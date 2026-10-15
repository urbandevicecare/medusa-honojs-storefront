# Storefront API & Features (Hono Edition)

This document maps out all features and APIs available in the **Medusa V2 + Hono Storefront**, including runtime requirements, ratings data storage, and partials architecture.

---

## 🚀 Feature Overview

- **Hono & Hono JSX:** Built on modern Web Standards with `hono/jsx` for server-side rendering, compatible with Cloudflare Workers, Deno, and Node.
- **Partials & View Transitions:** Implements the Hono equivalent of Fresh partials via `<Partial name="...">` containers and a lightweight client-side navigation script that uses the browser's View Transitions API.
- **Product Ratings System:** Real-time 5-star ratings persisted via Cloudflare KV (`RATINGS_KV`), Deno KV (`ratings.db`), or in-memory fallback.
- **E-commerce Ready:** Full integration with MedusaJS backend for browsing collections, managing carts, customer authentication, and checkout flows.
- **Service Portals:** Dedicated portals for Trade-ins, Financing, and Mac Repairs. Customers can book repairs and track existing tickets in real-time.
- **Email Verification:** Complete workflow spanning `/login`, `/register`, and `/verify-email`.
- **Responsive Design:** Polished Tailwind CSS styling with semantic HTML and SVG iconography.

---

## ⭐ Ratings System & API

Product ratings are tracked independently per product and per customer.

### KV Storage Schema
- **Product Stats Key:** `product_ratings:<productId>`  
  **Value:** `{ totalStars: number, count: number }`
- **User Rating Key:** `product_user_ratings:<productId>:<userId>`  
  **Value:** `number` (1 to 5)

### Atomic Rating Calculation
- When a customer rates a product for the first time:
  - `totalStars = currentTotalStars + rating`
  - `count = currentCount + 1`
  - `average = Number((totalStars / count).toFixed(1))`
- When an existing reviewer updates their rating (e.g. from 3 to 5):
  - `totalStars = currentTotalStars - previousRating + rating`
  - `count = currentCount` (remains unchanged)
  - `average = Number((totalStars / count).toFixed(1))`

### Endpoints

#### 1. Submit Product Rating
`POST /api/ratings`

- **Headers:** `Cookie: _medusa_jwt=<token>` or `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "productId": "prod_01J...",
    "rating": 5
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "totalStars": 15,
    "count": 3,
    "average": 5.0
  }
  ```
- **Error Responses:**
  - `401 Unauthorized` if unauthenticated or token expired.
  - `400 Bad Request` if `productId` is missing or `rating` is not an integer from 1 to 5.

#### 2. Get Rating Stats & User Rating for Product
`GET /api/ratings?productId=<productId>`

- **Headers (Optional):** `Cookie: _medusa_jwt=<token>`
- **Response (200 OK):**
  ```json
  {
    "productId": "prod_01J...",
    "totalStars": 15,
    "count": 3,
    "average": 5.0,
    "userRating": 5
  }
  ```
  *(Returns `"userRating": null` if guest or user has not rated).*

---

## 🧩 Partials Architecture (Hono Equivalent)

Fresh.js popularized partial updates using `<Partial name="...">` and `f-client-nav`. In this Hono storefront, the equivalent is achieved through:

1. **`<Partial name="main">` & `<Partial name="repair-content">` Components:**  
   Renders `<div data-partial="name" id="partial-name" class="hono-partial">...</div>`.
2. **Client-Side Partial Router:**  
   Intercepts anchor clicks (`<a>`) and form submissions within the layout:
   - Dispatches `partial-start`, `hono:partial-start`, and `fresh:partial-start` CustomEvents.
   - Adds `.is-navigating` loading cursor to `document.body` and animates `TopProgressBar`.
   - Sends `fetch(url, { headers: { "X-Hono-Partial": "true" } })`.
   - Replaces only matching `[data-partial]` DOM containers while preserving parent-child hierarchy.
   - Automatically executes dynamic `<script>` elements in the swapped fragment to keep button click handlers, form submissions, and UI state active.
   - Wraps DOM replacement inside `document.startViewTransition()` when supported.
   - Re-initializes interactive widgets (`window.__initStarRatings()`).
   - Dispatches `partial-end`, `hono:partial-end`, and `fresh:partial-end` CustomEvents.
3. **Selective Fragment Responses:**  
   When a request provides `X-Partial: repair-content`, Hono routes return only the `<Partial name="repair-content">` fragment, conserving network bandwidth. Standard requests return the complete HTML layout for optimal SEO.

---

## 🔧 Repair Module Implementations

The storefront maps closely to the `medusajs-repair-module` running on the backend.

- `POST /api/repairs/book`: Creates a new repair intake ticket.
- `GET /api/repairs/track?ticket=<number>`: Look up repair status and timeline.
- `/account/orders/:id/invoice`: Generates printable Tax Invoices.

---

## ✉️ Email Verification Workflow

1. User registers via `/login` or `/api/auth/register`.
2. User receives an email with a link to `/verify-email?token=TOKEN&email=EMAIL`.
3. The storefront submits `POST /api/store/customers/verify-email`.
4. Upon success, user is redirected to `/login` to sign in.
