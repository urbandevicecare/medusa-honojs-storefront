import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { getCategories } from "./lib/data.ts";
import { isRepairModuleInstalled, isPaystackInstalled } from "./lib/features.ts";
import { STORE_NAME, getStoreName, getStoreDomain, getLogoUrl, type StoreState, type AppEnv } from "./lib/utils.ts";
import { Layout } from "./components/Layout.tsx";

// API Routers
import { ratingsApi } from "./routes/api/ratings.ts";
import { productsApi } from "./routes/api/products.ts";
import { cartApi } from "./routes/api/cart.ts";
import { authApi } from "./routes/api/auth.ts";
import { accountApi } from "./routes/api/account.ts";
import { repairsApi } from "./routes/api/repairs.ts";

// Page Routers
import { storePages } from "./routes/pages/store.tsx";
import { cartCheckoutPages } from "./routes/pages/cart-checkout.tsx";
import { authAccountPages } from "./routes/pages/auth-account.tsx";
import { repairsPages } from "./routes/pages/repairs.tsx";
import { staticNewsPages } from "./routes/pages/static-news.tsx";
import { invoicePayPages } from "./routes/pages/invoice-pay.tsx";

export const app = new Hono<AppEnv>();

const FALLBACK_STYLES_CSS = `
::view-transition-old(root) { animation: 150ms cubic-bezier(0.4, 0, 1, 1) both fade-out; }
::view-transition-new(root) { animation: 150ms cubic-bezier(0, 0, 0.2, 1) both fade-in; animation-delay: 150ms; }
@keyframes fade-out { from { opacity: 1; } to { opacity: 0; } }
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
body.is-navigating { pointer-events: none !important; }
body.is-navigating, body.is-navigating * { cursor: wait !important; }
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

// Static file handlers
app.get("/assets/styles.css", async (c) => {
  if (c.env?.ASSETS && typeof c.env.ASSETS.fetch === "function") {
    try {
      const assetRes = await c.env.ASSETS.fetch(c.req.raw);
      if (assetRes.ok) return assetRes;
    } catch {}
  }
  if (typeof (globalThis as any).Deno?.readTextFile === "function") {
    try {
      const css = await (globalThis as any).Deno.readTextFile("./assets/styles.css");
      return c.text(css, 200, { "Content-Type": "text/css" });
    } catch {}
  }
  return c.text(FALLBACK_STYLES_CSS, 200, { "Content-Type": "text/css" });
});

app.get("/favicon.ico", async (c) => {
  if (c.env?.ASSETS && typeof c.env.ASSETS.fetch === "function") {
    try {
      const assetRes = await c.env.ASSETS.fetch(c.req.raw);
      if (assetRes.ok) return assetRes;
    } catch {}
  }
  if (typeof (globalThis as any).Deno?.readFile === "function") {
    try {
      const ico = await (globalThis as any).Deno.readFile("./static/favicon.ico");
      return new Response(ico, {
        headers: { "Content-Type": "image/x-icon" },
      });
    } catch {}
  }
  return c.text("", 404);
});

app.get("/logo.svg", async (c) => {
  if (c.env?.ASSETS && typeof c.env.ASSETS.fetch === "function") {
    try {
      const assetRes = await c.env.ASSETS.fetch(c.req.raw);
      if (assetRes.ok) return assetRes;
    } catch {}
  }
  if (typeof (globalThis as any).Deno?.readTextFile === "function") {
    try {
      const svg = await (globalThis as any).Deno.readTextFile("./static/logo.svg");
      return c.text(svg, 200, { "Content-Type": "image/svg+xml" });
    } catch {}
  }
  return c.text("", 404);
});

app.get("/sitemap.xml", async (c) => {
  if (c.env?.ASSETS && typeof c.env.ASSETS.fetch === "function") {
    try {
      const assetRes = await c.env.ASSETS.fetch(c.req.raw);
      if (assetRes.ok) return assetRes;
    } catch {}
  }
  if (typeof (globalThis as any).Deno?.readTextFile === "function") {
    try {
      const xml = await (globalThis as any).Deno.readTextFile("./static/sitemap.xml");
      return c.text(xml, 200, { "Content-Type": "application/xml" });
    } catch {}
  }
  return c.text("", 404);
});

app.get("/robots.txt", async (c) => {
  if (c.env?.ASSETS && typeof c.env.ASSETS.fetch === "function") {
    try {
      const assetRes = await c.env.ASSETS.fetch(c.req.raw);
      if (assetRes.ok) return assetRes;
    } catch {}
  }
  if (typeof (globalThis as any).Deno?.readTextFile === "function") {
    try {
      const txt = await (globalThis as any).Deno.readTextFile("./static/robots.txt");
      return c.text(txt, 200, { "Content-Type": "text/plain" });
    } catch {}
  }
  return c.text("User-agent: *\nAllow: /\n", 200, { "Content-Type": "text/plain" });
});

// Global state middleware
app.use("*", async (c, next) => {
  const token = getCookie(c, "_medusa_jwt");
  const isLoggedIn = !!token;

  let categories: any[] = [];
  let repairInstalled = false;
  let paystackInstalled = false;

  try {
    const [cats, rep, pay] = await Promise.all([
      getCategories(c.env).catch(() => []),
      isRepairModuleInstalled(c.env).catch(() => false),
      isPaystackInstalled(c.env).catch(() => false),
    ]);
    categories = cats || [];
    repairInstalled = rep;
    paystackInstalled = pay;
  } catch {}

  const state: StoreState = {
    storeName: getStoreName(c.env),
    storeDomain: getStoreDomain(c.env),
    logoUrl: getLogoUrl(c.env),
    isLoggedIn,
    categories,
    isRepairModuleInstalled: repairInstalled,
    isPaystackInstalled: paystackInstalled,
  };

  c.set("state", state);
  return next();
});

// Mount API routes
app.route("/api/ratings", ratingsApi);
app.route("/api/products", productsApi);
app.route("/api/cart", cartApi);
app.route("/api/auth", authApi);
app.route("/api/account", accountApi);
app.route("/api/repairs", repairsApi);

// Direct alias for email verification
app.post("/api/store/customers/verify-email", (c) => {
  return authApi.fetch(new Request(new URL("/verify-email", c.req.url).toString(), c.req.raw), c.env);
});

// Mount Page routes
app.route("/", storePages);
app.route("/", cartCheckoutPages);
app.route("/", authAccountPages);
app.route("/", repairsPages);
app.route("/", staticNewsPages);
app.route("/", invoicePayPages);

// 404 Handler
app.notFound((c) => {
  const state = c.get("state") || {};
  state.title = `Page Not Found - ${STORE_NAME}`;

  const isPartial = c.req.header("X-Hono-Partial") === "true";
  const notFoundContent = (
    <main class="flex-1 flex items-center justify-center py-20 px-4">
      <div class="text-center max-w-md">
        <h1 class="text-6xl font-black text-slate-900 mb-4">404</h1>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h2>
        <p class="text-gray-500 text-sm mb-6">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <a
          href="/"
          class="inline-block bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition"
        >
          Return Home
        </a>
      </div>
    </main>
  );

  if (isPartial) {
    return c.html(notFoundContent, 404);
  }

  return c.html(
    <Layout state={state} title={state.title}>
      {notFoundContent}
    </Layout>,
    404,
  );
});

// 500 Error Handler
app.onError((err, c) => {
  console.error("Server Error:", err);
  const state = c.get("state") || {};
  state.title = `Error - ${STORE_NAME}`;

  return c.html(
    <Layout state={state} title="Error">
      <main class="flex-1 flex items-center justify-center py-20 px-4">
        <div class="text-center max-w-md">
          <h1 class="text-5xl font-black text-red-600 mb-4">500</h1>
          <h2 class="text-2xl font-bold text-gray-800 mb-2">Internal Server Error</h2>
          <p class="text-gray-500 text-sm mb-6">
            Something went wrong while processing your request. Please try again later.
          </p>
          <a
            href="/"
            class="inline-block bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition"
          >
            Return Home
          </a>
        </div>
      </main>
    </Layout>,
    500,
  );
});

// Deno direct execution entrypoint
if (typeof (globalThis as any).Deno !== "undefined" && (import.meta as any).main) {
  const port = parseInt((globalThis as any).Deno.env.get("PORT") || "8000", 10);
  console.log(`Medusa Hono Storefront running on http://localhost:${port}`);
  (globalThis as any).Deno.serve({ port }, app.fetch);
}

export default app;
