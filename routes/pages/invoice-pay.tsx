import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { getMedusaClient } from "../../lib/sdk.ts";
import { verifyOrderHash } from "../../lib/secure-link.ts";
import { formatAmount } from "../../lib/pricing.ts";
import { STORE_NAME, LOGO_URL, type AppEnv } from "../../lib/utils.ts";
import { getUnifiedOrderNumber } from "../../lib/order-utils.ts";
import { renderPage } from "../../lib/render.tsx";

export const invoicePayPages = new Hono<AppEnv>();

// Order Printable Invoice
invoicePayPages.get("/account/orders/:id/invoice", async (c) => {
  const id = c.req.param("id");
  const token = getCookie(c, "_medusa_jwt") || c.req.header("Authorization")?.replace(/^Bearer\s+/i, "");

  let order: any = null;
  try {
    const client = getMedusaClient(c.env);
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await client.store.order.retrieve(
      id,
      { fields: "*items,*items.variant,*shipping_address,*billing_address" },
      headers,
    );
    order = res.order;
  } catch {}

  if (!order) {
    return c.text("Order not found or unauthorized", 404);
  }

  const orderNum = getUnifiedOrderNumber(order);
  const currency = order.currency_code || "USD";
  const date = new Date(order.created_at).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return c.html(
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Invoice #{orderNum} - {STORE_NAME}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          {`
          @media print {
            body { background: white !important; }
            .no-print { display: none !important; }
          }
          `}
        </style>
      </head>
      <body class="bg-gray-50 p-6 sm:p-12 font-sans text-gray-900">
        <div class="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-2xl border border-gray-200 shadow-sm print:border-none print:shadow-none">
          <div class="flex justify-between items-start mb-8 pb-8 border-b border-gray-100">
            <div>
              <img src={LOGO_URL} alt={STORE_NAME} class="h-12 w-auto mb-2" />
              <p class="text-xs text-gray-500 font-semibold">{STORE_NAME} Storefront</p>
            </div>
            <div class="text-right">
              <h1 class="text-2xl font-black text-gray-900 tracking-tight">TAX INVOICE</h1>
              <p class="text-sm text-gray-500 mt-1">Invoice #{orderNum}</p>
              <p class="text-xs text-gray-400">Date: {date}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-8 mb-8 text-sm">
            <div>
              <h3 class="font-bold text-gray-900 mb-1">Billed To:</h3>
              <p class="text-gray-600">{order.shipping_address?.first_name} {order.shipping_address?.last_name}</p>
              <p class="text-gray-600">{order.shipping_address?.address_1}</p>
              <p class="text-gray-600">{order.shipping_address?.city}, {order.shipping_address?.postal_code}</p>
              <p class="text-gray-500 text-xs mt-1">{order.email}</p>
            </div>
            <div class="text-right">
              <h3 class="font-bold text-gray-900 mb-1">Payment Status:</h3>
              <p class="capitalize font-semibold text-emerald-600">{order.payment_status || "Paid"}</p>
              <p class="text-gray-500 text-xs mt-1">Currency: {currency.toUpperCase()}</p>
            </div>
          </div>

          <table class="w-full text-left text-sm mb-8">
            <thead>
              <tr class="border-y border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <th class="py-3">Item</th>
                <th class="py-3 text-center">Qty</th>
                <th class="py-3 text-right">Price</th>
                <th class="py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              {order.items?.map((item: any) => (
                <tr key={item.id}>
                  <td class="py-4">
                    <p class="font-semibold text-gray-900">{item.title}</p>
                    <p class="text-xs text-gray-500">{item.variant_title || "Standard"}</p>
                  </td>
                  <td class="py-4 text-center text-gray-600">{item.quantity}</td>
                  <td class="py-4 text-right text-gray-600">{formatAmount(item.unit_price || 0, currency)}</td>
                  <td class="py-4 text-right font-semibold text-gray-900">
                    {formatAmount((item.unit_price || 0) * (item.quantity || 1), currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div class="border-t border-gray-200 pt-4 flex justify-between items-baseline mb-12">
            <span class="text-base font-bold text-gray-900">Total Paid</span>
            <span class="text-2xl font-black text-gray-900">{formatAmount(order.total || 0, currency)}</span>
          </div>

          <div class="no-print flex justify-end gap-3 border-t border-gray-100 pt-6">
            <button
              type="button"
              onclick="window.print()"
              class="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition cursor-pointer"
            >
              Print / Save PDF
            </button>
          </div>
        </div>
      </body>
    </html>,
  );
});

// Secure Pay Link (/pay/:hash/:id)
invoicePayPages.get("/pay/:hash/:id", async (c) => {
  const hash = c.req.param("hash");
  const id = c.req.param("id");

  const isValid = await verifyOrderHash(id, hash, c.env);
  if (!isValid) {
    return c.text("Unauthorized or invalid payment link signature", 403);
  }

  let order: any = null;
  try {
    const client = getMedusaClient(c.env);
    const res = await client.store.order.retrieve(id);
    order = res.order;
  } catch {}

  if (!order) {
    return c.text("Order not found", 404);
  }

  const currency = order.currency_code || "USD";
  const total = formatAmount(order.total || 0, currency);

  return renderPage(
    c,
    <main class="flex-1 max-w-lg mx-auto w-full px-4 py-16 text-center">
      <div class="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Secure Order Payment</h1>
        <p class="text-sm text-gray-500 mb-6">Complete payment for Order #{id}</p>
        <div class="bg-gray-50 p-4 rounded-xl mb-6">
          <span class="text-xs text-gray-500 uppercase tracking-wider block">Total Amount</span>
          <span class="text-3xl font-extrabold text-gray-900">{total}</span>
        </div>
        <a
          href={`/account/orders/${id}`}
          class="w-full bg-slate-900 text-white font-semibold py-3 px-4 rounded-xl block text-sm hover:bg-slate-800 transition"
        >
          Review & Pay
        </a>
      </div>
    </main>,
    { title: `Pay for Order #${id} - ${STORE_NAME}` },
  );
});

// Payment Collection redirect (/payment-collection/:id)
invoicePayPages.get("/payment-collection/:id", (c) => {
  const id = c.req.param("id");
  return c.redirect(`/account/orders/${id}`);
});
