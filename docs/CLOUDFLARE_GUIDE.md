# Cloudflare Setup & Deployment Guide

This guide details how to deploy the **Medusa Hono Storefront** (`medusa-honojs-storefront`) to **Cloudflare Workers**.

---

## ⚡ Overview

The storefront is built on **[Hono](https://hono.dev)**, a modern, ultra-fast web framework tailored specifically for edge runtimes like Cloudflare Workers. 

Key architectural highlights on Cloudflare:
- **Zero Cold Starts**: Deployed natively to Cloudflare's global edge network.
- **Server-Side Rendered (SSR) with View Transitions**: Delivers fast first-contentful paint while maintaining smooth, SPA-like client-side navigation.
- **Cloudflare KV Integration**: Product ratings and cache are persisted globally in Cloudflare KV namespaces with atomic updates.

---

## 🛠️ Prerequisites

1. A **Cloudflare Account** ([Sign up free](https://dash.cloudflare.com/sign-up)).
2. **Node.js** (v18+) or **Deno** installed locally.
3. **Wrangler CLI** installed:
   ```bash
   npm install -g wrangler
   # or run with npx:
   npx wrangler --version
   ```
4. Authenticate Wrangler with your Cloudflare account:
   ```bash
   wrangler login
   ```

---

## 🗄️ 1. Create Cloudflare KV Namespaces

The storefront uses two KV namespaces:
1. `RATINGS_KV`: Stores user product ratings, star counts, and averages.
2. `CACHE_KV`: Stores cached Medusa backend responses (categories, regions, news views).

Run the following commands in the project root:

### For Production:
```bash
# Create Ratings KV
wrangler kv namespace create RATINGS_KV

# Create Cache KV
wrangler kv namespace create CACHE_KV
```

### For Local Preview / Development:
```bash
wrangler kv namespace create RATINGS_KV --preview
wrangler kv namespace create CACHE_KV --preview
```

Each command outputs a namespace ID, for example:
```
🌀 Creating namespace with title "medusa-honojs-storefront-RATINGS_KV"
✨ Success! Add the following to your configuration file:
{ binding = "RATINGS_KV", id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }
```

---

## ⚙️ 2. Configure `wrangler.json`

Open `wrangler.json` in your repository root and replace the namespace IDs with your generated IDs:

```json
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "medusa-honojs-storefront",
  "main": "server.tsx",
  "compatibility_date": "2024-09-23",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": "./static",
    "binding": "ASSETS"
  },
  "kv_namespaces": [
    {
      "binding": "RATINGS_KV",
      "id": "YOUR_ACTUAL_RATINGS_KV_ID",
      "preview_id": "YOUR_PREVIEW_RATINGS_KV_ID"
    },
    {
      "binding": "CACHE_KV",
      "id": "YOUR_ACTUAL_CACHE_KV_ID",
      "preview_id": "YOUR_PREVIEW_CACHE_KV_ID"
    }
  ],
  "vars": {
    "STORE_NAME": "Urban Device Care",
    "STORE_DOMAIN": "urbandevicecare.co.uk",
    "LOGO_URL": "/logo.svg",
    "MEDUSA_BACKEND_URL": "https://backend.urbandevicecare.co.uk"
  }
}
```

---

## 🔒 3. Configure Secrets (Publishable Key)

Never hardcode your Medusa publishable key or secret keys into source code. Store them using Wrangler secrets:

```bash
# Add Medusa Publishable Key
wrangler secret put MEDUSA_PUBLISHABLE_KEY
# Enter your pk_... key when prompted
```

If you use Paystack or other integrations:
```bash
wrangler secret put PAYSTACK_PUBLIC_KEY
```

---

## 💻 4. Local Development with Cloudflare Sandbox

To run the app simulating the Cloudflare Workers edge environment locally:

```bash
# Start local Cloudflare Workers simulator with Deno or Yarn:
deno task cf:dev
# or:
yarn cf:dev
# or with standalone wrangler:
wrangler dev
```

This starts the application on `http://localhost:8787` with simulated KV storage.

To validate your bundle and bindings ahead of deployment without actually publishing:
```bash
deno task cf:dry-run
# or:
yarn cf:dry-run
```

Alternatively, for rapid local development with Deno:
```bash
deno task dev
```

---

## 🚀 5. Deploy to Cloudflare Workers

Deploy the storefront to your Cloudflare account with a single command:

```bash
deno task cf:deploy
# or:
yarn cf:deploy
# or with standalone wrangler:
wrangler deploy
```

Upon completion, Wrangler will output your live URL:
```
Total Upload: ... KiB / gzip: ... KiB
Uploaded medusa-honojs-storefront (...)
Published medusa-honojs-storefront (0.92 sec)
  https://medusa-honojs-storefront.<your-subdomain>.workers.dev
```

---

## 🌐 6. Adding a Custom Domain

To link your custom domain (e.g., `store.urbandevicecare.co.uk`):

1. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Navigate to **Workers & Pages** &rarr; `medusa-honojs-storefront`.
3. Click on the **Settings** tab &rarr; **Domains & Routes**.
4. Click **Add** &rarr; **Custom Domain**.
5. Type your domain name and click **Add Custom Domain**.
6. Cloudflare automatically handles DNS configuration and SSL certificates!
