import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { getMedusaClient } from "../../lib/sdk.ts";
import { getStoreRegion } from "../../lib/data.ts";
import { getProductRatings, getUserRating } from "../../lib/ratings.ts";
import { getPriceInfo } from "../../lib/pricing.ts";
import { STORE_NAME, type AppEnv } from "../../lib/utils.ts";
import { renderPage } from "../../lib/render.tsx";
import { ProductCard } from "../../components/ProductCard.tsx";
import { PromoBanner } from "../../components/PromoBanner.tsx";
import { StarRating } from "../../components/StarRating.tsx";

export const storePages = new Hono<AppEnv>();

// 1. Store Catalog / Home Page (/)
storePages.get("/", async (c) => {
  const state = c.get("state") || {};
  const q = c.req.query("q") || "";
  const sort = c.req.query("sort") || "-created_at";

  let products: any[] = [];
  let currencyCode = "USD";

  try {
    const client = getMedusaClient(c.env);
    const region = await getStoreRegion(c.env);
    currencyCode = region?.currency_code || "USD";

    const query: Record<string, any> = {
      limit: 20,
      order: sort,
      fields: "*variants,*variants.options,*options,*options.values",
    };
    if (region?.id) query.region_id = region.id;
    if (q) query.q = q;

    const res = await client.store.product.list(query).catch(() => ({ products: [] }));
    products = res.products || [];

    if (products.length > 0) {
      const ratings = await getProductRatings(
        products.map((p) => p.id),
        c.env,
      );
      products = products.map((p) => ({
        ...p,
        ratingStats: ratings[p.id] || { totalStars: 0, count: 0, average: 0 },
      }));
    }
  } catch (err) {
    console.warn("Could not load products for home page:", err);
  }

  state.title = `Store - ${STORE_NAME}`;
  state.description = "Shop all our refurbished tech products.";

  const content = (
    <main class="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <PromoBanner />

      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">
            All Products
          </h1>
          <p class="text-sm text-gray-500 mt-1">
            Certified refurbished devices thoroughly tested and guaranteed.
          </p>
        </div>

        {/* Search bar */}
        <form method="get" action="/" class="relative max-w-xs w-full">
          <input
            type="text"
            name="q"
            value={q}
            placeholder="Search products..."
            class="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            class="w-4 h-4 text-gray-400 absolute left-3 top-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </form>
      </div>

      {products.length === 0 ? (
        <div class="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <p class="text-gray-500 text-lg">No products found.</p>
          <a
            href="/"
            class="inline-block mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition"
          >
            Clear Filters
          </a>
        </div>
      ) : (
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} currencyCode={currencyCode} />
          ))}
        </div>
      )}
    </main>
  );

  return renderPage(c, content, state);
});

// 2. Category Shop Page (/shop/:category)
storePages.get("/shop/:category", async (c) => {
  const state = c.get("state") || {};
  const categoryHandle = c.req.param("category");
  let products: any[] = [];
  let currencyCode = "USD";
  let categoryName = categoryHandle;

  try {
    const client = getMedusaClient(c.env);
    const region = await getStoreRegion(c.env);
    currencyCode = region?.currency_code || "USD";

    const { product_categories } = await client.store.category
      .list({ handle: categoryHandle })
      .catch(() => ({ product_categories: [] }));

    if (product_categories && product_categories.length > 0) {
      categoryName = product_categories[0].name;
      const query: Record<string, any> = {
        category_id: [product_categories[0].id],
        limit: 20,
        fields: "*variants,*variants.options,*options,*options.values",
      };
      if (region?.id) query.region_id = region.id;

      const res = await client.store.product.list(query).catch(() => ({ products: [] }));
      products = res.products || [];

      if (products.length > 0) {
        const ratings = await getProductRatings(
          products.map((p) => p.id),
          c.env,
        );
        products = products.map((p) => ({
          ...p,
          ratingStats: ratings[p.id] || { totalStars: 0, count: 0, average: 0 },
        }));
      }
    }
  } catch (err) {
    console.warn("Could not load products for category:", err);
  }

  state.title = `${categoryName.toUpperCase()} - ${STORE_NAME}`;
  state.description = `Shop certified refurbished ${categoryName} devices.`;

  const content = (
    <main class="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight capitalize">
          {categoryName}
        </h1>
        <p class="text-sm text-gray-500 mt-1">
          Explore our certified {categoryName} collection with warranty.
        </p>
      </div>

      {products.length === 0 ? (
        <div class="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <p class="text-gray-500 text-lg">No products found in this category.</p>
          <a
            href="/"
            class="inline-block mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition"
          >
            Back to Store
          </a>
        </div>
      ) : (
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} currencyCode={currencyCode} />
          ))}
        </div>
      )}
    </main>
  );

  return renderPage(c, content, state);
});

// 3. Product Details Page (/product/:handle)
storePages.get("/product/:handle", async (c) => {
  const state = c.get("state") || {};
  const handle = c.req.param("handle");
  const token = getCookie(c, "_medusa_jwt") || c.req.header("Authorization")?.replace(/^Bearer\s+/i, "");

  let product: any = null;
  let currencyCode = "USD";
  let userRating: number | null = null;
  let ratingStats = { totalStars: 0, count: 0, average: 0 };

  try {
    const client = getMedusaClient(c.env);
    const region = await getStoreRegion(c.env);
    currencyCode = region?.currency_code || "USD";

    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const query: Record<string, any> = {
      handle,
      fields:
        "*variants,*variants.options,*options,*options.values,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder",
    };
    if (region?.id) query.region_id = region.id;

    const res = await client.store.product.list(query, headers).catch(() => ({ products: [] }));
    if (res.products && res.products.length > 0) {
      product = res.products[0];

      // Fetch Ratings
      const ratings = await getProductRatings([product.id], c.env);
      ratingStats = ratings[product.id] || { totalStars: 0, count: 0, average: 0 };
      product.ratingStats = ratingStats;

      // Fetch User's personal rating if authenticated
      if (token) {
        try {
          const { customer } = await client.store.customer.retrieve({}, headers);
          if (customer?.id) {
            userRating = await getUserRating(product.id, customer.id, c.env);
          }
        } catch {}
      }
    }
  } catch (err) {
    console.error("Failed to fetch product:", err);
  }

  if (!product) {
    state.title = `Product Not Found - ${STORE_NAME}`;
    const notFoundContent = (
      <main class="flex-1 flex items-center justify-center py-24">
        <div class="text-center">
          <h1 class="text-2xl font-bold mb-2">Product not found</h1>
          <p class="text-gray-600 mb-6">
            The product you are looking for does not exist or has been removed.
          </p>
          <a
            href="/"
            class="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Back to Store
          </a>
        </div>
      </main>
    );
    return renderPage(c, notFoundContent, state);
  }

  const { currentPrice, originalPrice, hasDiscount } = getPriceInfo(
    product,
    currencyCode,
  );

  state.title = `${product.title} - ${STORE_NAME}`;
  state.description = product.description || `Buy ${product.title} at ${STORE_NAME}`;

  const content = (
    <main class="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* Product Media */}
        <div class="bg-white rounded-2xl border border-gray-200 p-8 flex items-center justify-center aspect-square shadow-sm">
          {product.thumbnail ? (
            <img
              src={product.thumbnail}
              alt={product.title}
              class="max-w-full max-h-full object-contain mix-blend-multiply"
            />
          ) : (
            <div class="text-gray-400">No Image Available</div>
          )}
        </div>

        {/* Product Details & Actions */}
        <div class="flex flex-col gap-6">
          <div>
            <span class="text-xs font-semibold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-full">
              Certified Refurbished
            </span>
            <h1 class="text-3xl font-extrabold text-gray-900 mt-2">
              {product.title}
            </h1>

            {/* Interactive Star Rating Widget */}
            <div class="mt-2.5">
              <StarRating
                productId={product.id}
                initialAverage={ratingStats.average}
                initialCount={ratingStats.count}
                userRating={userRating}
                interactive
              />
            </div>
          </div>

          <div class="border-y border-gray-100 py-4 flex items-baseline gap-3">
            <span class="text-3xl font-bold text-gray-900">{currentPrice}</span>
            {hasDiscount && (
              <span class="text-lg text-gray-400 line-through">
                {originalPrice}
              </span>
            )}
          </div>

          {product.description && (
            <div class="text-gray-600 leading-relaxed text-sm whitespace-pre-line">
              {product.description}
            </div>
          )}

          {/* Variants and Options */}
          {product.variants && product.variants.length > 1 && (
            <div class="space-y-3">
              <label class="block text-sm font-semibold text-gray-900">
                Configuration
              </label>
              <div class="grid grid-cols-2 gap-2" id="variant-selector">
                {product.variants.map((v: any, idx: number) => (
                  <button
                    key={v.id}
                    type="button"
                    data-variant-id={v.id}
                    class={`px-3 py-2 text-sm rounded-lg border text-left transition ${
                      idx === 0
                        ? "border-blue-600 bg-blue-50/50 font-medium text-blue-900"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    {v.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add to Cart Section */}
          <div class="pt-4">
            <button
              type="button"
              id="add-to-cart-btn"
              data-variant-id={product.variants?.[0]?.id || ""}
              class="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 px-6 rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg
                class="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
              <span>Add to Cart</span>
            </button>
          </div>

          <div class="bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs text-gray-600 space-y-1.5">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>12 Months Comprehensive Hardware Warranty</span>
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Free Next-Day Insured Delivery</span>
            </div>
          </div>
        </div>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
(function() {
  var addBtn = document.getElementById('add-to-cart-btn');
  if (addBtn) {
    addBtn.addEventListener('click', async function() {
      var variantId = addBtn.getAttribute('data-variant-id');
      if (!variantId) return;

      addBtn.disabled = true;
      var originalText = addBtn.innerHTML;
      addBtn.innerHTML = 'Adding...';

      try {
        var res = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variant_id: variantId, quantity: 1 })
        });
        if (res.ok) {
          if (window.showToast) window.showToast('Added to cart!');
          setTimeout(function() { window.location.href = '/cart'; }, 500);
        } else {
          if (window.showToast) window.showToast('Failed to add to cart', true);
        }
      } catch(e) {
        if (window.showToast) window.showToast('Error adding to cart', true);
      } finally {
        addBtn.disabled = false;
        addBtn.innerHTML = originalText;
      }
    });
  }

  var variantBtns = document.querySelectorAll('#variant-selector button');
  variantBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      variantBtns.forEach(function(b) {
        b.className = 'px-3 py-2 text-sm rounded-lg border text-left transition border-gray-200 hover:border-gray-300 text-gray-700';
      });
      btn.className = 'px-3 py-2 text-sm rounded-lg border text-left transition border-blue-600 bg-blue-50/50 font-medium text-blue-900';
      if (addBtn) {
        addBtn.setAttribute('data-variant-id', btn.getAttribute('data-variant-id'));
      }
    });
  });
})();
`,
        }}
      />
    </main>
  );

  return renderPage(c, content, state);
});
