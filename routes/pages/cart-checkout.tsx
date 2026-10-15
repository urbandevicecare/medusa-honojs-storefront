import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { getMedusaClient } from "../../lib/sdk.ts";
import { formatAmount } from "../../lib/pricing.ts";
import { formatProviderName, STORE_NAME, type AppEnv } from "../../lib/utils.ts";
import { renderPage } from "../../lib/render.tsx";

export const cartCheckoutPages = new Hono<AppEnv>();

// 1. Cart Page (/cart)
cartCheckoutPages.get("/cart", async (c) => {
  const state = c.get("state") || {};
  const cartId = getCookie(c, "_medusa_cart_id");
  const token = getCookie(c, "_medusa_jwt") || c.req.header("Authorization")?.replace(/^Bearer\s+/i, "");

  let cart: any = null;

  if (cartId) {
    try {
      const client = getMedusaClient(c.env);
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await client.store.cart.retrieve(
        cartId,
        { fields: "*items,*items.variant,*items.variant.product" },
        headers,
      );
      cart = res.cart;
    } catch (e) {
      console.warn("Cart retrieve failed:", e);
    }
  }

  state.title = `Cart - ${STORE_NAME}`;
  state.description = "View your shopping cart and proceed to checkout.";

  const currencyCode = cart?.currency_code || "USD";
  const items = cart?.items || [];
  const subtotal = cart?.subtotal ? formatAmount(cart.subtotal, currencyCode) : formatAmount(0, currencyCode);

  const content = (
    <main class="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
      <h1 class="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight">
        Shopping Cart
      </h1>

      {items.length === 0 ? (
        <div class="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p class="text-gray-500 mb-6 text-sm">Looks like you haven't added any products yet.</p>
          <a
            href="/"
            class="inline-block bg-slate-900 hover:bg-slate-800 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition"
          >
            Start Shopping
          </a>
        </div>
      ) : (
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Cart Items List */}
          <div class="lg:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm divide-y divide-gray-100">
            {items.map((item: any) => (
              <div key={item.id} class="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div class="flex items-center gap-4">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      class="w-16 h-16 object-contain rounded-lg border border-gray-100 p-1"
                    />
                  ) : (
                    <div class="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center text-xs text-gray-400">
                      No img
                    </div>
                  )}
                  <div>
                    <h3 class="font-semibold text-gray-900 text-sm">{item.title}</h3>
                    <p class="text-xs text-gray-500 mt-0.5">{item.variant_title || "Standard"}</p>
                    <p class="text-xs font-medium text-gray-900 mt-1">
                      {formatAmount(item.unit_price || 0, currencyCode)} &times; {item.quantity}
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-4 self-end sm:self-center">
                  <span class="font-bold text-gray-900 text-base">
                    {formatAmount((item.unit_price || 0) * (item.quantity || 1), currencyCode)}
                  </span>
                  <button
                    type="button"
                    class="text-red-500 hover:text-red-700 text-xs font-medium p-1 cursor-pointer delete-item-btn"
                    data-line-id={item.id}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col gap-4">
            <h2 class="text-lg font-bold text-gray-900">Order Summary</h2>
            <div class="flex justify-between text-sm text-gray-600 border-t border-gray-100 pt-3">
              <span>Subtotal</span>
              <span class="font-semibold text-gray-900">{subtotal}</span>
            </div>
            <div class="flex justify-between text-sm text-gray-600">
              <span>Shipping</span>
              <span class="text-green-600 font-medium">Calculated at checkout</span>
            </div>
            <div class="border-t border-gray-100 pt-3 flex justify-between text-base font-bold text-gray-900">
              <span>Estimated Total</span>
              <span>{subtotal}</span>
            </div>

            <a
              href="/checkout"
              class="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-xl text-center text-sm shadow-sm transition block"
            >
              Proceed to Checkout
            </a>
          </div>
        </div>
      )}

      <script
        dangerouslySetInnerHTML={{
          __html: `
(function() {
  document.querySelectorAll('.delete-item-btn').forEach(function(btn) {
    btn.addEventListener('click', async function() {
      var id = btn.getAttribute('data-line-id');
      if (!id) return;
      try {
        var res = await fetch('/api/cart/items/' + id, { method: 'DELETE' });
        if (res.ok) {
          window.location.reload();
        }
      } catch(e) {}
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

// 2. Checkout Page (/checkout)
cartCheckoutPages.get("/checkout", async (c) => {
  const state = c.get("state") || {};
  const cartId = getCookie(c, "_medusa_cart_id");
  const token = getCookie(c, "_medusa_jwt") || c.req.header("Authorization")?.replace(/^Bearer\s+/i, "");

  if (!cartId) {
    return c.redirect("/cart");
  }

  let cart: any = null;
  let customer: any = null;
  let _shippingOptions: any[] = [];
  let paymentProviders: any[] = [];

  try {
    const client = getMedusaClient(c.env);
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await client.store.cart.retrieve(
      cartId,
      { fields: "*items,*items.variant,*items.variant.product,*shipping_address,*billing_address,*region" },
      headers,
    );
    cart = res.cart;

    if (token) {
      try {
        const custRes = await client.store.customer.retrieve({ fields: "*addresses" }, headers);
        customer = custRes.customer;
      } catch {}
    }

    const { shipping_options } = await client.store.fulfillment
      .listCartOptions({ cart_id: cartId }, headers)
      .catch(() => ({ shipping_options: [] }));
    _shippingOptions = shipping_options || [];

    if (cart.region_id) {
      try {
        const { payment_providers } = await client.store.payment.listPaymentProviders(
          { region_id: cart.region_id },
          headers,
        );
        paymentProviders = (payment_providers || []).map((p: any) => ({
          id: p.id,
          name: formatProviderName(p.id),
        }));
      } catch {}
    }
  } catch (err) {
    console.error("Checkout retrieve error:", err);
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return c.redirect("/cart");
  }

  state.title = `Checkout - ${STORE_NAME}`;
  state.description = "Complete your order securely.";

  const currencyCode = cart.currency_code || "USD";
  const total = formatAmount(cart.total || cart.subtotal || 0, currencyCode);

  const content = (
    <main class="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
      <h1 class="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight">
        Checkout
      </h1>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Checkout Form */}
        <div class="lg:col-span-2 space-y-6">
          {/* Customer / Email */}
          <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 class="text-lg font-bold text-gray-900">Contact Information</h2>
            <input
              type="email"
              id="checkout-email"
              placeholder="Email address"
              defaultValue={cart.email || customer?.email || ""}
              class="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Shipping Address */}
          <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 class="text-lg font-bold text-gray-900">Shipping Address</h2>
            <div class="grid grid-cols-2 gap-4">
              <input
                type="text"
                id="first-name"
                placeholder="First name"
                defaultValue={cart.shipping_address?.first_name || customer?.first_name || ""}
                class="bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                id="last-name"
                placeholder="Last name"
                defaultValue={cart.shipping_address?.last_name || customer?.last_name || ""}
                class="bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <input
              type="text"
              id="address-1"
              placeholder="Address"
              defaultValue={cart.shipping_address?.address_1 || ""}
              class="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div class="grid grid-cols-2 gap-4">
              <input
                type="text"
                id="city"
                placeholder="City"
                defaultValue={cart.shipping_address?.city || ""}
                class="bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                id="postal-code"
                placeholder="Postal code"
                defaultValue={cart.shipping_address?.postal_code || ""}
                class="bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Delivery & Payment Selection */}
          <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 class="text-lg font-bold text-gray-900">Payment Method</h2>
            <div class="space-y-2">
              {(paymentProviders.length > 0
                ? paymentProviders
                : [{ id: "pp_system_default", name: "Credit / Debit Card" }]
              ).map((p: any, idx: number) => (
                <label
                  key={p.id}
                  class="flex items-center gap-3 p-3.5 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition"
                >
                  <input
                    type="radio"
                    name="payment_provider"
                    value={p.id}
                    defaultChecked={idx === 0}
                    class="text-blue-600 focus:ring-blue-500"
                  />
                  <span class="text-sm font-medium text-gray-800">{p.name}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="button"
            id="place-order-btn"
            class="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 px-6 rounded-xl shadow-sm transition text-base cursor-pointer"
          >
            Complete Order ({total})
          </button>
        </div>

        {/* Order Summary */}
        <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h2 class="text-lg font-bold text-gray-900">Items in Order</h2>
          <div class="divide-y divide-gray-100 text-sm">
            {cart.items.map((item: any) => (
              <div key={item.id} class="py-3 flex justify-between items-center">
                <span class="text-gray-700 font-medium">
                  {item.title} &times; {item.quantity}
                </span>
                <span class="font-semibold text-gray-900">
                  {formatAmount((item.unit_price || 0) * (item.quantity || 1), currencyCode)}
                </span>
              </div>
            ))}
          </div>
          <div class="border-t border-gray-100 pt-4 flex justify-between text-base font-bold text-gray-900">
            <span>Total to Pay</span>
            <span>{total}</span>
          </div>
        </div>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
(function() {
  var placeBtn = document.getElementById('place-order-btn');
  if (placeBtn) {
    placeBtn.addEventListener('click', async function() {
      placeBtn.disabled = true;
      placeBtn.textContent = 'Processing...';

      try {
        var res = await fetch('/api/cart/complete', { method: 'POST' });
        var data = await res.json();
        if (data.type === 'order' && data.order) {
          window.location.href = '/account/orders/' + data.order.id;
        } else {
          if (window.showToast) window.showToast(data.error || 'Payment requires further action', true);
          placeBtn.disabled = false;
          placeBtn.textContent = 'Complete Order';
        }
      } catch(e) {
        if (window.showToast) window.showToast('Order placement failed', true);
        placeBtn.disabled = false;
        placeBtn.textContent = 'Complete Order';
      }
    });
  }
})();
`,
        }}
      />
    </main>
  );

  return renderPage(c, content, state);
});
