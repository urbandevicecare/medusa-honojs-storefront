import type { HttpTypes } from "@medusajs/types";
import { getPriceInfo } from "../lib/pricing.ts";
import { StarRating } from "./StarRating.tsx";

export function ProductCard({
  product,
  currencyCode = "USD",
}: {
  product: HttpTypes.StoreProduct;
  currencyCode?: string;
}) {
  const { currentPrice, originalPrice, hasDiscount } = getPriceInfo(
    product,
    currencyCode,
  );

  const ratingStats = (product as any).ratingStats || {
    average: 0,
    count: 0,
  };

  return (
    <a
      href={`/product/${product.handle}`}
      class="group cursor-pointer flex flex-col h-full bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
      aria-label={`View details for ${product.title}`}
    >
      <div class="aspect-square overflow-hidden bg-transparent p-4 flex items-center justify-center relative mb-4">
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.title}
            class="w-full h-full object-contain mix-blend-multiply bg-transparent group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div class="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400 rounded-xl">
            No image
          </div>
        )}
      </div>

      <div class="flex flex-col gap-1 flex-1">
        <h3 class="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
          {product.title}
        </h3>

        {/* Integrated Product Rating Badge */}
        <StarRating
          productId={product.id!}
          initialAverage={ratingStats.average}
          initialCount={ratingStats.count}
          interactive={false}
        />

        <p class="text-xs text-gray-500 mt-2">Starting at</p>
        <div class="flex items-baseline gap-2">
          <span class="font-bold text-xl text-gray-900">{currentPrice}</span>
        </div>

        {hasDiscount && (
          <p class="text-xs text-gray-500 mt-1">
            <span class="line-through">{originalPrice}</span> new
          </p>
        )}
      </div>
    </a>
  );
}
