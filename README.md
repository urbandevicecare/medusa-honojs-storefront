# Medusa V2 + Hono Storefront

A high-performance, edge-native, SEO-optimized e-commerce storefront for **Medusa V2**, migrated from Fresh.js to **[Hono](https://hono.dev)**. Designed to run seamlessly across **Cloudflare Workers**, **Deno**, and **Node.js**.

---

## 📚 Documentation

- **[Cloudflare Setup & Deployment Guide](./docs/CLOUDFLARE_GUIDE.md)**: Complete step-by-step instructions for deploying to Cloudflare Workers with KV namespaces, secrets, and custom domains.
- **[Features & API Implementations](./docs/API_AND_FEATURES.md)**: Detailed mapping of storefront features, ratings KV schema, partials architecture, repair module integration, and email verification.
- **[Changelog](./docs/CHANGELOG.md)**: Complete release history and migration notes.

---

## 🌟 Key Features

- **Hono & Hono JSX:** Full server-side rendering (SSR) built on Web Standards with near-instant responses.
- **Ratings System:** Real-time 5-star ratings persisted via Cloudflare KV (`RATINGS_KV`), Deno KV (`ratings.db`), or in-memory fallback.
  - Interactive star rating widget with hover states and fractional star fills.
  - Authenticated rating submission via `POST /api/ratings`.
  - Automatic atomic recalculation on rating updates.
- **Pages & Partials (Hono Equivalent):**
  - `<Partial name="...">` container tags matching Fresh partials functionality.
  - Built-in client-side router with **View Transitions API** support for seamless page transitions without page reloads.
  - `TopProgressBar` loading state that listens for navigation events (`partial-start`, `partial-end`).
  - Selective partial fragment responses for ultra-fast payload delivery (`X-Partial` header).
- **Medusa V2 Integration:** Catalog browsing, categories, cart management, checkout with dynamic payment providers, and order tracking.
- **Service & Repair Modules:** Repair booking, real-time ticket tracking, and tax invoice generation.

---

## 🛠️ Environment Variables

Create a `.env` file in the root directory:

```env
# Medusa Backend configuration
MEDUSA_BACKEND_URL="http://localhost:9000"
MEDUSA_PUBLISHABLE_KEY="pk_your_publishable_key_here"

# Storefront Branding configuration
STORE_NAME="Urban Device Care"
STORE_DOMAIN="urbandevicecare.co.uk"
LOGO_URL="/logo.svg"
```

---

## 🚀 Setup & Installation

### Option 1: Local Development (Deno)

1. **Install Dependencies & Start Dev Server:**
   ```bash
   deno task dev
   ```
   The storefront will start at `http://localhost:8000`.

2. **Run Test Suite:**
   ```bash
   deno task test
   ```

### Option 2: Cloudflare Workers Development & Deployment

1. **Prerequisites:** Install [Wrangler](https://developers.cloudflare.com/workers/wrangler/):
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. **Create KV Namespaces:**
   ```bash
   wrangler kv namespace create RATINGS_KV
   wrangler kv namespace create CACHE_KV
   ```
   Copy the generated namespace IDs into `wrangler.json`.

3. **Validate Bundle Build:**
   ```bash
   deno task cf:dry-run
   # or with yarn:
   yarn cf:dry-run
   ```

4. **Start Local Cloudflare Simulator:**
   ```bash
   deno task cf:dev
   # or with yarn:
   yarn cf:dev
   ```

5. **Deploy to Cloudflare:**
   ```bash
   deno task cf:deploy
   # or with yarn:
   yarn cf:deploy
   ```

For detailed Cloudflare instructions, see the **[Cloudflare Guide](./docs/CLOUDFLARE_GUIDE.md)**.

---

## 🧪 Testing

The storefront includes 42 automated tests covering ratings engine, partials responses, client-nav runtime, script execution, email verification, pages, caching, Cloudflare Workers environment bindings, and security:

```bash
deno task test
```
