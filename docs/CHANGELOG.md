# Changelog

### v2.0.0 - Full Migration from Fresh.js to Hono (Current)

- **Architecture Migration**: Migrated entire storefront from Deno Fresh.js to **[Hono](https://hono.dev)** (`hono/jsx`), enabling native execution on Cloudflare Workers, Deno, and Node environments.
- **Ratings Engine**:
  - Implemented multi-storage ratings engine supporting Cloudflare KV (`RATINGS_KV`), Deno KV (`ratings.db`), and in-memory fallback for local testing.
  - Added atomic rating recalculation handling both initial rating submissions and user rating updates (adjusting total stars, keeping review counts consistent).
  - Built interactive 5-star rating widget (`StarRating`) supporting hover preview, fractional fills, personal rating retrieval, and toast feedback for unauthenticated users.
  - Implemented REST API routes at `/api/ratings` (`POST` for authenticated ratings, `GET` for product user ratings) and automatically attached KV ratings to product listings at `/api/products`.
- **Pages & Partials Architecture**:
  - Implemented Hono equivalent of Fresh partials via `<Partial name="...">` component and client-side navigation script with View Transitions API support.
  - Supported selective partial responses: requests passing `X-Partial` or `X-Hono-Partial` return targeted partial fragments (e.g. `repair-content`), reducing payload bandwidth while maintaining full SEO page rendering for direct URL hits.
  - Integrated `TopProgressBar` progress listener reacting to `partial-start`, `partial-end`, `fresh:partial-start`, and `fresh:partial-end` events.
- **Cloudflare Workers Deployment & Build Isolation**:
  - Fixed runtime `ReferenceError: React is not defined` crash in Cloudflare Workers by configuring `tsconfig.json` with `jsx: "react-jsx"` and `jsxImportSource: "hono/jsx"`.
  - Added `wrangler.json` preconfigured with `RATINGS_KV` and `CACHE_KV` bindings, compatibility flags, and static asset mapping (`ASSETS`).
  - Switched all page routes (`store.tsx`, `cart-checkout.tsx`, `auth-account.tsx`, `invoice-pay.tsx`) and API routes (`ratings.ts`, `products.ts`, `cart.ts`, `account.ts`) to use `getMedusaClient(c.env)` dynamically to respect Cloudflare Worker runtime environment bindings.
  - Embedded full authentic news articles into `lib/news.ts` fallback for edge runtimes without local filesystem access.
  - Implemented standalone Yarn / PnP project isolation to guarantee clean esbuild bundling during `wrangler deploy` without parent directory interference.
  - Replaced JSR-dependent front-matter parsing with a native, zero-dependency universal front-matter extractor in `lib/news.ts`.
  - Added dedicated email verification endpoints (`POST /api/auth/verify-email` and `/api/store/customers/verify-email`).
  - Added comprehensive step-by-step Cloudflare guide at `docs/CLOUDFLARE_GUIDE.md`.
- **Test Suite**:
  - Expanded to 42 automated unit and integration tests covering ratings engine, atomic updates, authenticated submissions, payload validation, Cloudflare KV mock, pages, partials, script execution runtime, email verification endpoints, cache, dynamic Cloudflare Worker bindings (`STORE_NAME`), and simulated Cloudflare `ASSETS` fetching.

---

### v1.3.1 (Fresh.js)

- **Feature**: Added a native URL shortener proxy at `/r/[code]` to securely
  relay abbreviated links (used in SMS and WhatsApp notifications) directly to
  the backend's link resolver, completely masking the backend domain.

### v1.3.0

- **Enhancement**: Removed the `PAYMENT_PROVIDERS` environment variable in favor
  of dynamically fetching and formatting payment providers from the Medusa
  backend.
- **Enhancement**: Added a GitHub Actions CI workflow to automatically build the
  storefront and attach release assets (ZIP archives) on version tags.

### v1.2.0

- **Enhancement**: Added beautiful frontend HTML rendering for repair documents
  (Job Card, Quote, Tax Invoice, Receipt) to match the order invoice styling.
- **Enhancement**: Introduced `STOREFRONT_URL` environment variable for robust
  QR code generation across invoices and repair documents.
- **Enhancement**: Seamless post-login redirects implemented across account and
  repair tracking portals. This release focuses heavily on integrating and
  refining the Medusa Repair Module frontend.

### v1.1.0

- **Feature**: Integrated comprehensive email verification flow spanning
  `/login`, `/register`, and `/verify-email` routes.
- **Feature**: Integrated Medusa Repair Module frontend paths mapping over
  `/repairs/track` and `account/repairs`.
- **UI Upgrade**: Applied View Transitions across all pages to ensure smooth
  client-side route navigation.

### v1.0.0 - Initial Release

- Core e-commerce routes (Shop, Cart, Checkout) implemented and mapped to Medusa
  workflows.
- Baseline static pages (About Us, Careers, Contact, Legal Policies) launched.
