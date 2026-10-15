import { assertEquals, assertMatch } from "@std/assert";
import { app } from "../server.tsx";

Deno.test("Pages - Home page (/) renders successfully", async () => {
  const res = await app.request("/");
  assertEquals(res.status, 200);
  const html = await res.text();
  assertMatch(html, /All Products/);
  assertMatch(html, /BRING YOUR DEVICE/);
  assertMatch(html, /data-partial="main"/);
});

Deno.test("Pages - Category shop page (/shop/:category) renders", async () => {
  const res = await app.request("/shop/mac");
  assertEquals(res.status, 200);
  const html = await res.text();
  assertMatch(html, /mac/i);
});

Deno.test("Pages - Product page (/product/:handle) renders product or not found message", async () => {
  const res = await app.request("/product/test-macbook");
  assertEquals(res.status, 200);
  const html = await res.text();
  // Either renders product or not found page
  assertMatch(html, /(Product not found|Add to Cart|Certified Refurbished)/);
});

Deno.test("Pages - Cart page (/cart) renders with shopping cart summary", async () => {
  const res = await app.request("/cart");
  assertEquals(res.status, 200);
  const html = await res.text();
  assertMatch(html, /Shopping Cart/);
});

Deno.test("Pages - Checkout redirects to /cart when cart is not active", async () => {
  const res = await app.request("/checkout");
  // Without cart cookie, redirects to /cart
  assertEquals(res.status, 302);
  assertEquals(res.headers.get("location"), "/cart");
});

Deno.test("Pages - Login and Register page (/login) renders", async () => {
  const res = await app.request("/login");
  assertEquals(res.status, 200);
  const html = await res.text();
  assertMatch(html, /Welcome Back/);
  assertMatch(html, /Create an account/);
});

Deno.test("Pages - Email verification page (/verify-email) renders", async () => {
  const res = await app.request("/verify-email?token=ABC123&email=test@example.com");
  assertEquals(res.status, 200);
  const html = await res.text();
  assertMatch(html, /Email Verification/);
  assertMatch(html, /ABC123/);
});

Deno.test("Auth API - Email verification endpoints exist and respond (not 404)", async () => {
  const res1 = await app.request("/api/auth/verify-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "invalid@example.com", token: "BAD_TOKEN" }),
  });
  assertEquals(res1.status !== 404, true);

  const res2 = await app.request("/api/store/customers/verify-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "invalid@example.com", token: "BAD_TOKEN" }),
  });
  assertEquals(res2.status !== 404, true);
});

Deno.test("Pages - News listing and individual article render markdown content", async () => {
  // 1. Listing
  const listRes = await app.request("/news");
  assertEquals(listRes.status, 200);
  const listHtml = await listRes.text();
  assertMatch(listHtml, /News (&|&amp;) Insights/);

  // 2. Individual article
  const postRes = await app.request("/news/apple-siri-ai");
  assertEquals(postRes.status, 200);
  const postHtml = await postRes.text();
  assertMatch(postHtml, /Siri AI/);
  assertMatch(postHtml, /views/);
});

Deno.test("Pages - About, Services, and Legal static routes render", async () => {
  const routes = [
    "/about/our-story",
    "/about/careers",
    "/about/contact",
    "/services/repairs",
    "/services/guides",
    "/services/trade-in",
    "/services/financing",
    "/legal/terms",
    "/legal/privacy",
    "/legal/cookies",
  ];

  for (const route of routes) {
    const res = await app.request(route);
    assertEquals(res.status, 200, `Route ${route} failed with status ${res.status}`);
  }
});

Deno.test("Pages - 404 Not Found returns styled 404 page", async () => {
  const res = await app.request("/some-route-that-definitely-does-not-exist");
  assertEquals(res.status, 404);
  const html = await res.text();
  assertMatch(html, /404/);
  assertMatch(html, /Page Not Found/);
});

Deno.test("Pages - Static assets (/assets/styles.css, /logo.svg, /robots.txt) return valid responses", async () => {
  const cssRes = await app.request("/assets/styles.css");
  assertEquals(cssRes.status, 200);
  assertEquals(cssRes.headers.get("content-type"), "text/css");

  const robotsRes = await app.request("/robots.txt");
  assertEquals(robotsRes.status, 200);
  const robotsText = await robotsRes.text();
  assertMatch(robotsText, /User-agent/);
});

Deno.test("Cloudflare Workers - Environment bindings (STORE_NAME) dynamically reflect in layout", async () => {
  const customEnv = { STORE_NAME: "Custom Workers Store" };
  const res = await app.request("/about/our-story", {}, customEnv);
  assertEquals(res.status, 200);
  const html = await res.text();
  assertMatch(html, /Custom Workers Store/);
});

Deno.test("Cloudflare Workers - ASSETS binding fetch simulation", async () => {
  const mockAssets = {
    fetch: (req: Request) => {
      const url = new URL(req.url);
      if (url.pathname === "/assets/styles.css") {
        return Promise.resolve(new Response("/* mock cf worker css */", {
          status: 200,
          headers: { "Content-Type": "text/css" },
        }));
      }
      return Promise.resolve(new Response("Not found", { status: 404 }));
    },
  };

  const res = await app.request("/assets/styles.css", {}, { ASSETS: mockAssets });
  assertEquals(res.status, 200);
  const text = await res.text();
  assertEquals(text, "/* mock cf worker css */");
});

