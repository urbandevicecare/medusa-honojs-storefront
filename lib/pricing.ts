import type { HttpTypes } from "@medusajs/types";

export function formatAmount(
  amount: number,
  currencyCode: string = "USD",
): string {
  const zeroDecimalCurrencies = ["JPY", "KRW", "VND", "CLP", "PYG", "KES"];
  const isZeroDecimal = zeroDecimalCurrencies.includes(
    currencyCode.toUpperCase(),
  );
  const divisor = isZeroDecimal ? 1 : 100;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
    minimumFractionDigits: isZeroDecimal ? 0 : 2,
    maximumFractionDigits: isZeroDecimal ? 0 : 2,
  }).format(amount / divisor);
}

export function getPriceInfo(
  product: HttpTypes.StoreProduct,
  currencyCode: string = "USD",
  selectedVariant?: HttpTypes.StoreProductVariant,
) {
  const variant = selectedVariant || product.variants?.[0];
  let currentPrice = 0;
  let originalPrice = 0;

  if (variant?.calculated_price) {
    currentPrice = (variant.calculated_price as any).calculated_amount ?? 0;
    originalPrice = (variant.calculated_price as any).original_amount ?? currentPrice;
  } else if ((variant as any)?.prices?.[0]) {
    currentPrice = ((variant as any).prices[0] as any).amount ?? 0;
    originalPrice = (variant as any).original_price || currentPrice;
  }

  return {
    currentPrice: formatAmount(currentPrice, currencyCode),
    originalPrice: formatAmount(originalPrice, currencyCode),
    hasDiscount: originalPrice > currentPrice,
  };
}
