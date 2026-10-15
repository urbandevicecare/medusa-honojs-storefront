import { assertEquals } from "@std/assert";
import { formatProviderName, formatAmount } from "../lib/utils.ts";
import { formatAmount as formatPricingAmount } from "../lib/pricing.ts";
import { generateOrderHash, verifyOrderHash } from "../lib/secure-link.ts";
import { isPaystackInstalled } from "../lib/features.ts";

Deno.test("formatProviderName - standard string", () => {
  assertEquals(formatProviderName("stripe"), "Stripe");
});

Deno.test("formatProviderName - with underscores", () => {
  assertEquals(formatProviderName("bank_transfer"), "Bank Transfer");
});

Deno.test("formatProviderName - with pp_ prefix", () => {
  assertEquals(formatProviderName("pp_system_default"), "System Default");
});

Deno.test("formatProviderName - mixed separators", () => {
  assertEquals(
    formatProviderName("pp_manual-payment_method"),
    "Manual Payment Method",
  );
});

Deno.test("formatAmount - currency formatting", () => {
  assertEquals(formatAmount(10000, "USD"), "$100.00");
  assertEquals(formatPricingAmount(2500, "KES"), "KES 2,500");
});

Deno.test("Secure Link - Order HMAC verification", async () => {
  const orderId = "order_01KS2E9BPZ4B9A5VSR25EJNW31";
  const hash = await generateOrderHash(orderId);

  const isValid = await verifyOrderHash(orderId, hash);
  assertEquals(isValid, true);

  const isInvalid = await verifyOrderHash(orderId, "invalid_hash_string");
  assertEquals(isInvalid, false);

  const fallbackHash = await generateOrderHash(orderId, "super_secret_fallback_key");
  const isFallbackValid = await verifyOrderHash(orderId, fallbackHash);
  assertEquals(isFallbackValid, true);
});

Deno.test("Features - isPaystackInstalled handles responses gracefully", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = () => Promise.resolve(new Response(null, { status: 200 }));
    const result = await isPaystackInstalled();
    assertEquals(typeof result, "boolean");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
