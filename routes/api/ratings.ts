import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { getMedusaClient } from "../../lib/sdk.ts";
import { getProductRatings, getUserRating, submitRating } from "../../lib/ratings.ts";

export const ratingsApi = new Hono();

// POST: Authenticated rating submission
ratingsApi.post("/", async (c) => {
  const token = getCookie(c, "_medusa_jwt") || c.req.header("Authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => ({}));
  const { productId, rating } = body;

  if (
    !productId ||
    typeof productId !== "string" ||
    !productId.trim() ||
    typeof rating !== "number" ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    return c.json({ error: "Invalid request payload" }, 400);
  }

  try {
    const client = getMedusaClient(c.env);
    // Verify token with Medusa to ensure the user is genuinely logged in
    const { customer } = await client.store.customer.retrieve(
      {},
      { Authorization: `Bearer ${token}` },
    );

    if (!customer || !customer.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const stats = await submitRating(productId.trim(), customer.id, rating, c.env);
    return c.json(stats, 200);
  } catch (err: any) {
    console.error("Error submitting rating:", err);
    // If validation error from rating engine, return 400
    if (
      err?.message?.includes("Rating must be") ||
      err?.message?.includes("Missing or invalid")
    ) {
      return c.json({ error: err.message }, 400);
    }
    // If Medusa returned unauthorized error, propagate 401
    if (err?.status === 401 || err?.message?.includes("Unauthorized")) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    return c.json({ error: "Failed to submit rating" }, 500);
  }
});

// GET: Fetch product rating stats & authenticated user's rating
ratingsApi.get("/", async (c) => {
  const productId = c.req.query("productId");
  if (!productId || typeof productId !== "string" || !productId.trim()) {
    return c.json({ error: "Missing productId" }, 400);
  }

  const token = getCookie(c, "_medusa_jwt") || c.req.header("Authorization")?.replace(/^Bearer\s+/i, "");
  let userRating: number | null = null;

  if (token) {
    try {
      const client = getMedusaClient(c.env);
      const { customer } = await client.store.customer.retrieve(
        {},
        { Authorization: `Bearer ${token}` },
      );
      if (customer && customer.id) {
        userRating = await getUserRating(productId.trim(), customer.id, c.env);
      }
    } catch {
      // Ignore auth errors on GET, user just isn't logged in or token is expired
    }
  }

  const ratingsMap = await getProductRatings([productId.trim()], c.env);
  const stats = ratingsMap[productId.trim()] || { totalStars: 0, count: 0, average: 0 };

  return c.json({
    productId: productId.trim(),
    totalStars: stats.totalStars,
    count: stats.count,
    average: stats.average,
    userRating,
  }, 200);
});
