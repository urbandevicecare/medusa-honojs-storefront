import { assertEquals, assertRejects } from "@std/assert";
import {
  getProductRatings,
  submitRating,
  getUserRating,
  resetRatingsStore,
} from "../lib/ratings.ts";
import { app } from "../server.tsx";
import { StarRating } from "../components/StarRating.tsx";
import { medusa } from "../lib/sdk.ts";

Deno.test("Ratings - getProductRatings for empty and non-existent products", async () => {
  await resetRatingsStore();


  // Empty list
  const emptyRes = await getProductRatings([]);
  assertEquals(Object.keys(emptyRes).length, 0);

  // Non-existent product
  const singleRes = await getProductRatings(["prod_non_existent"]);
  assertEquals(singleRes["prod_non_existent"], {
    totalStars: 0,
    count: 0,
    average: 0,
  });
});

Deno.test("Ratings - submitRating validates input strictly", async () => {
  await resetRatingsStore();

  // Invalid rating values
  await assertRejects(
    async () => await submitRating("prod_1", "user_1", 0),
    Error,
    "Rating must be an integer between 1 and 5",
  );
  await assertRejects(
    async () => await submitRating("prod_1", "user_1", 6),
    Error,
    "Rating must be an integer between 1 and 5",
  );
  await assertRejects(
    async () => await submitRating("prod_1", "user_1", 3.5 as any),
    Error,
    "Rating must be an integer between 1 and 5",
  );
  await assertRejects(
    async () => await submitRating("prod_1", "user_1", -1),
    Error,
    "Rating must be an integer between 1 and 5",
  );

  // Missing or invalid productId or userId
  await assertRejects(
    async () => await submitRating("", "user_1", 5),
    Error,
    "Missing or invalid productId",
  );
  await assertRejects(
    async () => await submitRating("prod_1", "", 5),
    Error,
    "Missing or invalid userId",
  );
});

Deno.test("Ratings - multiple user submissions accumulate and calculate average correctly", async () => {
  await resetRatingsStore();


  // User 1 rates 4 stars
  const stats1 = await submitRating("prod_100", "user_A", 4);
  assertEquals(stats1, { totalStars: 4, count: 1, average: 4 });

  // User 2 rates 5 stars
  const stats2 = await submitRating("prod_100", "user_B", 5);
  assertEquals(stats2, { totalStars: 9, count: 2, average: 4.5 });

  // User 3 rates 3 stars
  const stats3 = await submitRating("prod_100", "user_C", 3);
  assertEquals(stats3, { totalStars: 12, count: 3, average: 4.0 });

  // Verify getProductRatings retrieves exact aggregated stats
  const ratings = await getProductRatings(["prod_100"]);
  assertEquals(ratings["prod_100"], { totalStars: 12, count: 3, average: 4.0 });

  // Verify getUserRating retrieves individual user ratings
  assertEquals(await getUserRating("prod_100", "user_A"), 4);
  assertEquals(await getUserRating("prod_100", "user_B"), 5);
  assertEquals(await getUserRating("prod_100", "user_C"), 3);
  assertEquals(await getUserRating("prod_100", "user_D"), null);
});

Deno.test("Ratings - updating an existing rating updates total and recalculates without increasing count", async () => {
  await resetRatingsStore();


  // User rates 2 stars
  await submitRating("prod_200", "user_X", 2);
  let ratings = await getProductRatings(["prod_200"]);
  assertEquals(ratings["prod_200"], { totalStars: 2, count: 1, average: 2.0 });

  // User changes rating to 5 stars
  const updatedStats = await submitRating("prod_200", "user_X", 5);
  assertEquals(updatedStats, { totalStars: 5, count: 1, average: 5.0 });

  ratings = await getProductRatings(["prod_200"]);
  assertEquals(ratings["prod_200"], { totalStars: 5, count: 1, average: 5.0 });
  assertEquals(await getUserRating("prod_200", "user_X"), 5);
});

Deno.test("Ratings - Cloudflare KV engine integration mock", async () => {
  // Mock Cloudflare KV storage
  const mockStorage = new Map<string, string>();
  const mockCfKv = {
    get: (key: string, opts?: any) => {
      const val = mockStorage.get(key);
      if (!val) return Promise.resolve(null);
      if (opts?.type === "json") return Promise.resolve(JSON.parse(val));
      return Promise.resolve(val);
    },
    put: (key: string, val: string) => {
      mockStorage.set(key, val);
      return Promise.resolve();
    },
  };

  const mockEnv = { RATINGS_KV: mockCfKv };

  // Submit via Cloudflare KV
  const s1 = await submitRating("cf_prod_1", "cf_user_1", 5, mockEnv);
  assertEquals(s1, { totalStars: 5, count: 1, average: 5.0 });

  const s2 = await submitRating("cf_prod_1", "cf_user_2", 3, mockEnv);
  assertEquals(s2, { totalStars: 8, count: 2, average: 4.0 });

  // Read via Cloudflare KV
  const cfRatings = await getProductRatings(["cf_prod_1"], mockEnv);
  assertEquals(cfRatings["cf_prod_1"], { totalStars: 8, count: 2, average: 4.0 });

  const cfUserRating = await getUserRating("cf_prod_1", "cf_user_1", mockEnv);
  assertEquals(cfUserRating, 5);
});

Deno.test("Ratings API - POST /api/ratings authentication & validation", async () => {
  // 1. Unauthenticated request -> 401
  const unauthRes = await app.request("/api/ratings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: "p1", rating: 5 }),
  });
  assertEquals(unauthRes.status, 401);
  const unauthData = await unauthRes.json();
  assertEquals(unauthData.error, "Unauthorized");

  // 2. Missing or invalid productId
  const badParamRes = await app.request("/api/ratings?invalid=true");
  assertEquals(badParamRes.status, 400);
  const badParamData = await badParamRes.json();
  assertEquals(badParamData.error, "Missing productId");

  // 3. Whitespace productId
  const whitespaceRes = await app.request("/api/ratings?productId=%20%20%20");
  assertEquals(whitespaceRes.status, 400);

  // 4. Valid GET /api/ratings?productId=... without token returns stats and null userRating
  const getRes = await app.request("/api/ratings?productId=prod_test_123");
  assertEquals(getRes.status, 200);
  const getData = await getRes.json();
  assertEquals(getData.productId, "prod_test_123");
  assertEquals(getData.totalStars, 0);
  assertEquals(getData.count, 0);
  assertEquals(getData.average, 0);
  assertEquals(getData.userRating, null);
});

Deno.test("Ratings API - GET /api/ratings reflects submitted ratings accurately", async () => {
  await resetRatingsStore();

  // Submit ratings directly via engine
  await submitRating("prod_reviewed", "cust_1", 5);
  await submitRating("prod_reviewed", "cust_2", 4);

  // GET /api/ratings should return accumulated total, count, and average
  const res = await app.request("/api/ratings?productId=prod_reviewed");
  assertEquals(res.status, 200);
  const data = await res.json();
  assertEquals(data.productId, "prod_reviewed");
  assertEquals(data.totalStars, 9);
  assertEquals(data.count, 2);
  assertEquals(data.average, 4.5);
});

Deno.test("Ratings - StarRating component renders valid HTML (span for card, button for interactive)", () => {
  // 1. Non-interactive (Product Card): Must render span to avoid invalid nested <button> in <a>
  const cardRating = StarRating({
    productId: "prod_card_1",
    initialAverage: 4.5,
    initialCount: 12,
    interactive: false,
  });

  const cardHtml = cardRating.toString();
  // Verify container attribute
  assertEquals(cardHtml.includes('data-interactive="false"'), true);
  // All stars must be span elements, NEVER button elements
  assertEquals(cardHtml.includes("<button"), false, "Non-interactive rating must not render button tags");
  assertEquals(cardHtml.includes("data-star-item="), true);
  assertEquals(cardHtml.includes("star-item"), true);

  // 2. Interactive (Product Details): Must render button elements for accessibility
  const detailRating = StarRating({
    productId: "prod_detail_1",
    initialAverage: 4.0,
    initialCount: 5,
    interactive: true,
  });

  const detailHtml = detailRating.toString();
  assertEquals(detailHtml.includes('data-interactive="true"'), true);
  assertEquals(detailHtml.includes("<button"), true, "Interactive rating must render button tags");
  assertEquals(detailHtml.includes("data-star-btn="), true);
  assertEquals(detailHtml.includes("star-btn"), true);
});

Deno.test("Ratings API - POST /api/ratings payload validation rejects non-integer and whitespace", async () => {
  // Test floating point rating (e.g. 3.5) with a dummy token
  const floatRes = await app.request("/api/ratings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer fake_token",
    },
    body: JSON.stringify({ productId: "prod_1", rating: 3.5 }),
  });
  assertEquals(floatRes.status, 400);
  const floatData = await floatRes.json();
  assertEquals(floatData.error, "Invalid request payload");

  // Test whitespace productId with dummy token
  const spaceRes = await app.request("/api/ratings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer fake_token",
    },
    body: JSON.stringify({ productId: "   ", rating: 4 }),
  });
  assertEquals(spaceRes.status, 400);
  const spaceData = await spaceRes.json();
  assertEquals(spaceData.error, "Invalid request payload");
});

Deno.test("Ratings - submitRating rejects whitespace productId and userId", async () => {
  await assertRejects(
    async () => await submitRating("   ", "user_1", 5),
    Error,
    "Missing or invalid productId",
  );
  await assertRejects(
    async () => await submitRating("prod_1", "   ", 5),
    Error,
    "Missing or invalid userId",
  );
});

Deno.test("Ratings API - authenticated POST /api/ratings submits and persists rating", async () => {
  await resetRatingsStore();

  const originalRetrieve = medusa.store.customer.retrieve;
  medusa.store.customer.retrieve = () =>
    Promise.resolve({ customer: { id: "cust_auth_123", email: "user@example.com" } });

  try {
    const res = await app.request("/api/ratings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer valid_jwt_token",
      },
      body: JSON.stringify({ productId: "prod_live_test", rating: 5 }),
    });

    assertEquals(res.status, 200);
    const data = await res.json();
    assertEquals(data.count, 1);
    assertEquals(data.average, 5.0);
    assertEquals(data.totalStars, 5);

    // Verify GET retrieves the submitted user rating
    const getRes = await app.request("/api/ratings?productId=prod_live_test", {
      headers: { "Authorization": "Bearer valid_jwt_token" },
    });
    const getData = await getRes.json();
    assertEquals(getData.userRating, 5);
    assertEquals(getData.count, 1);
    assertEquals(getData.average, 5.0);
  } finally {
    medusa.store.customer.retrieve = originalRetrieve;
  }
});


