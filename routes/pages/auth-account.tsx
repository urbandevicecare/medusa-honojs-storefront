import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { getMedusaClient } from "../../lib/sdk.ts";
import { STORE_NAME, type AppEnv } from "../../lib/utils.ts";
import { formatAmount } from "../../lib/pricing.ts";
import { getUnifiedOrderStatus, getOrderStatusTheme, getUnifiedOrderNumber } from "../../lib/order-utils.ts";
import { renderPage } from "../../lib/render.tsx";
import { AccountLayout } from "../../components/AccountLayout.tsx";

export const authAccountPages = new Hono<AppEnv>();

// 1. Login Page (/login)
authAccountPages.get("/login", (c) => {
  const state = c.get("state") || {};
  const token = getCookie(c, "_medusa_jwt");
  if (token) return c.redirect("/account");

  state.title = `Sign In - ${STORE_NAME}`;
  state.description = "Sign in to access your orders, repairs, and account settings.";

  const content = (
    <main class="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-gray-900 tracking-tight" id="auth-title">
            Welcome Back
          </h1>
          <p class="text-sm text-gray-500 mt-1" id="auth-subtitle">
            Sign in to your {STORE_NAME} account
          </p>
        </div>

        <form id="auth-form" class="space-y-4">
          <div id="name-fields" class="hidden space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <input
                type="text"
                id="first_name"
                placeholder="First name"
                class="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                id="last_name"
                placeholder="Last name"
                class="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              required
              placeholder="you@example.com"
              class="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              required
              placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
              class="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            id="auth-submit-btn"
            class="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-xl text-sm transition shadow-sm cursor-pointer"
          >
            Sign In
          </button>
        </form>

        <div class="mt-6 text-center text-sm text-gray-500 border-t border-gray-100 pt-4">
          <span id="toggle-prompt">Don't have an account?</span>{" "}
          <button
            type="button"
            id="toggle-auth-btn"
            class="text-blue-600 hover:underline font-medium cursor-pointer"
          >
            Create an account
          </button>
        </div>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
(function() {
  var isRegister = false;
  var form = document.getElementById('auth-form');
  var toggleBtn = document.getElementById('toggle-auth-btn');
  var nameFields = document.getElementById('name-fields');
  var authTitle = document.getElementById('auth-title');
  var authSubtitle = document.getElementById('auth-subtitle');
  var submitBtn = document.getElementById('auth-submit-btn');
  var togglePrompt = document.getElementById('toggle-prompt');

  toggleBtn.addEventListener('click', function() {
    isRegister = !isRegister;
    if (isRegister) {
      nameFields.classList.remove('hidden');
      authTitle.textContent = 'Create Account';
      authSubtitle.textContent = 'Register a new customer account';
      submitBtn.textContent = 'Create Account';
      togglePrompt.textContent = 'Already have an account?';
      toggleBtn.textContent = 'Sign in';
    } else {
      nameFields.classList.add('hidden');
      authTitle.textContent = 'Welcome Back';
      authSubtitle.textContent = 'Sign in to your account';
      submitBtn.textContent = 'Sign In';
      togglePrompt.textContent = "Don't have an account?";
      toggleBtn.textContent = 'Create an account';
    }
  });

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Please wait...';

    var email = document.getElementById('email').value;
    var password = document.getElementById('password').value;
    var endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';

    var payload = { email: email, password: password };
    if (isRegister) {
      payload.first_name = document.getElementById('first_name').value;
      payload.last_name = document.getElementById('last_name').value;
    }

    try {
      var res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      var data = await res.json();
      if (res.ok) {
        window.location.href = '/account';
      } else {
        if (window.showToast) window.showToast(data.error || 'Authentication failed', true);
        submitBtn.disabled = false;
        submitBtn.textContent = isRegister ? 'Create Account' : 'Sign In';
      }
    } catch(err) {
      if (window.showToast) window.showToast('Network error', true);
      submitBtn.disabled = false;
      submitBtn.textContent = isRegister ? 'Create Account' : 'Sign In';
    }
  });
})();
`,
        }}
      />
    </main>
  );

  return renderPage(c, content, state);
});

// 2. Email Verification Page (/verify-email)
authAccountPages.get("/verify-email", (c) => {
  const state = c.get("state") || {};
  const token = c.req.query("token") || "";
  const email = c.req.query("email") || "";

  state.title = `Verify Email - ${STORE_NAME}`;

  const content = (
    <main class="flex-1 flex items-center justify-center py-16 px-4">
      <div class="max-w-md w-full bg-white p-8 rounded-2xl border border-gray-200 shadow-sm text-center">
        <div class="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h9" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            <path d="m16 19 2 2 4-4" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Email Verification</h1>
        <p class="text-sm text-gray-500 mb-6" id="verify-status">
          {token && email ? "Verifying your account details..." : "Enter your verification token to complete registration."}
        </p>

        <form id="verify-form" class="space-y-4">
          <input
            type="email"
            id="verify-email-input"
            defaultValue={email}
            placeholder="Your email address"
            required
            class="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            id="verify-token-input"
            defaultValue={token}
            placeholder="Verification Token"
            required
            class="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase tracking-widest text-center font-mono font-bold"
          />
          <button
            type="submit"
            id="verify-submit-btn"
            class="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-xl text-sm transition shadow-sm cursor-pointer"
          >
            Verify Account
          </button>
        </form>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
(function() {
  var form = document.getElementById('verify-form');
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    var email = document.getElementById('verify-email-input').value;
    var token = document.getElementById('verify-token-input').value;
    var status = document.getElementById('verify-status');

    try {
      var res = await fetch('/api/store/customers/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, token: token })
      });
      if (res.ok) {
        status.textContent = 'Account verified successfully! Redirecting to login...';
        status.className = 'text-sm text-green-600 font-semibold mb-6';
        setTimeout(function() { window.location.href = '/login'; }, 1500);
      } else {
        var err = await res.json().catch(function() { return {}; });
        status.textContent = err.error || 'Invalid or expired verification token.';
        status.className = 'text-sm text-red-600 font-medium mb-6';
      }
    } catch(err) {
      status.textContent = 'Connection error. Please try again.';
      status.className = 'text-sm text-red-600 font-medium mb-6';
    }
  });

  var autoToken = "${token}";
  var autoEmail = "${email}";
  if (autoToken && autoEmail) {
    form.dispatchEvent(new Event('submit'));
  }
})();
`,
        }}
      />
    </main>
  );

  return renderPage(c, content, state);
});

// 3. Customer Dashboard (/account)
authAccountPages.get("/account", async (c) => {
  const state = c.get("state") || {};
  const token = getCookie(c, "_medusa_jwt") || c.req.header("Authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) return c.redirect("/login");

  let customer: any = null;
  try {
    const client = getMedusaClient(c.env);
    const res = await client.store.customer.retrieve(
      { fields: "*orders,*addresses" },
      { Authorization: `Bearer ${token}` },
    );
    customer = res.customer;
  } catch {
    return c.redirect("/login");
  }

  state.title = `My Account - ${STORE_NAME}`;

  const content = (
    <AccountLayout activeTab="overview" state={state}>
      <div>
        <h2 class="text-xl font-bold text-gray-900 mb-2">
          Hello, {customer.first_name || customer.email}!
        </h2>
        <p class="text-sm text-gray-500 mb-8">
          From your account dashboard, you can view your recent orders, manage shipping addresses, and track repairs.
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="p-5 border border-gray-100 rounded-xl bg-gray-50/50">
            <h3 class="text-sm font-semibold text-gray-900 mb-1">Account Info</h3>
            <p class="text-xs text-gray-500">{customer.email}</p>
            {customer.phone && <p class="text-xs text-gray-500 mt-0.5">{customer.phone}</p>}
          </div>

          <div class="p-5 border border-gray-100 rounded-xl bg-gray-50/50">
            <h3 class="text-sm font-semibold text-gray-900 mb-1">Default Address</h3>
            {customer.addresses && customer.addresses.length > 0 ? (
              <p class="text-xs text-gray-500">
                {customer.addresses[0].address_1}, {customer.addresses[0].city}
              </p>
            ) : (
              <p class="text-xs text-gray-400">No saved addresses</p>
            )}
          </div>
        </div>
      </div>
    </AccountLayout>
  );

  return renderPage(c, content, state);
});

// 4. Orders List (/account/orders)
authAccountPages.get("/account/orders", async (c) => {
  const state = c.get("state") || {};
  const token = getCookie(c, "_medusa_jwt") || c.req.header("Authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) return c.redirect("/login");

  let orders: any[] = [];
  try {
    const client = getMedusaClient(c.env);
    const res = await client.store.order.list(
      { fields: "*items,*items.variant" },
      { Authorization: `Bearer ${token}` },
    );
    orders = res.orders || [];
  } catch (err) {
    console.warn("Could not retrieve customer orders:", err);
  }

  state.title = `My Orders - ${STORE_NAME}`;

  const content = (
    <AccountLayout activeTab="orders" state={state}>
      <div>
        <h2 class="text-xl font-bold text-gray-900 mb-6">Order History</h2>

        {orders.length === 0 ? (
          <div class="text-center py-12 text-gray-500 text-sm">
            <p>You haven't placed any orders yet.</p>
            <a href="/" class="inline-block mt-4 text-blue-600 font-semibold hover:underline">
              Start shopping
            </a>
          </div>
        ) : (
          <div class="space-y-4">
            {orders.map((order) => {
              const status = getUnifiedOrderStatus(order);
              const theme = getOrderStatusTheme(status);
              const orderNum = getUnifiedOrderNumber(order);
              const total = formatAmount(order.total || 0, order.currency_code || "USD");

              return (
                <div key={order.id} class="p-5 border border-gray-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-gray-300 transition">
                  <div>
                    <div class="flex items-center gap-3">
                      <span class="font-bold text-gray-900 text-sm">#{orderNum}</span>
                      <span class={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${theme}`}>
                        {status}
                      </span>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">
                      {new Date(order.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })} &bull; {order.items?.length || 0} items
                    </p>
                  </div>

                  <div class="flex items-center gap-4 self-end sm:self-center">
                    <span class="font-bold text-gray-900 text-sm">{total}</span>
                    <a
                      href={`/account/orders/${order.id}`}
                      class="px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
                    >
                      View Order
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AccountLayout>
  );

  return renderPage(c, content, state);
});

// 5. Order Details (/account/orders/:id)
authAccountPages.get("/account/orders/:id", async (c) => {
  const state = c.get("state") || {};
  const id = c.req.param("id");
  const token = getCookie(c, "_medusa_jwt") || c.req.header("Authorization")?.replace(/^Bearer\s+/i, "");

  let order: any = null;
  try {
    const client = getMedusaClient(c.env);
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await client.store.order.retrieve(
      id,
      { fields: "*items,*items.variant,*items.variant.product,*shipping_address,*billing_address" },
      headers,
    );
    order = res.order;
  } catch (err) {
    console.warn("Could not retrieve order details:", err);
  }

  if (!order) {
    return c.redirect("/account/orders");
  }

  state.title = `Order Details - ${STORE_NAME}`;
  const status = getUnifiedOrderStatus(order);
  const theme = getOrderStatusTheme(status);
  const orderNum = getUnifiedOrderNumber(order);
  const currency = order.currency_code || "USD";

  const content = (
    <AccountLayout activeTab="orders" state={state}>
      <div>
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div>
            <div class="flex items-center gap-3">
              <h2 class="text-xl font-bold text-gray-900">Order #{orderNum}</h2>
              <span class={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${theme}`}>
                {status}
              </span>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              Placed on {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>

          <a
            href={`/account/orders/${order.id}/invoice`}
            target="_blank"
            class="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Download Invoice
          </a>
        </div>

        {/* Items */}
        <div class="divide-y divide-gray-100 mb-8">
          {order.items?.map((item: any) => (
            <div key={item.id} class="py-4 flex justify-between items-center text-sm">
              <div>
                <p class="font-semibold text-gray-900">{item.title}</p>
                <p class="text-xs text-gray-500">Qty: {item.quantity}</p>
              </div>
              <span class="font-bold text-gray-900">
                {formatAmount((item.unit_price || 0) * (item.quantity || 1), currency)}
              </span>
            </div>
          ))}
        </div>

        <div class="bg-gray-50 p-4 rounded-xl flex justify-between text-base font-bold text-gray-900">
          <span>Total</span>
          <span>{formatAmount(order.total || 0, currency)}</span>
        </div>
      </div>
    </AccountLayout>
  );

  return renderPage(c, content, state);
});
