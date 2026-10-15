export function StarRating({
  productId,
  initialAverage = 0,
  initialCount = 0,
  userRating = null,
  interactive = true,
}: {
  productId: string;
  initialAverage?: number;
  initialCount?: number;
  userRating?: number | null;
  interactive?: boolean;
}) {
  const avg = Number(initialAverage || 0);
  const count = Number(initialCount || 0);
  const userRate = userRating !== null && userRating !== undefined ? Number(userRating) : null;

  return (
    <div
      class="star-rating-widget flex flex-col gap-0.5 mt-1 mb-1 select-none"
      data-product-id={productId}
      data-average={avg}
      data-count={count}
      data-user-rating={userRate !== null ? userRate : ""}
      data-interactive={interactive ? "true" : "false"}
    >
      <div class="stars-row flex items-center gap-1.5">
        <div class="stars-container flex items-center" data-rating-container>
          {[1, 2, 3, 4, 5].map((star) => {
            let fillPercent = 0;
            if (userRate !== null) {
              fillPercent = star <= userRate ? 100 : 0;
            } else if (avg >= star) {
              fillPercent = 100;
            } else if (avg > star - 1) {
              fillPercent = Math.round((avg - (star - 1)) * 100);
            }

            const starContent = (
              <>
                {/* Background empty star */}
                <svg
                  class="w-4 h-4 text-gray-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>

                {/* Foreground filled star */}
                <div
                  class="star-fill absolute inset-0.5 overflow-hidden transition-all duration-150"
                  style={`width: ${fillPercent}%`}
                >
                  <svg
                    class="w-4 h-4 text-yellow-400 fill-yellow-400"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
              </>
            );

            if (interactive) {
              return (
                <button
                  type="button"
                  key={star}
                  data-star-btn={star}
                  class="star-btn relative p-0.5 focus:outline-none focus:scale-125 transition-transform cursor-pointer"
                  aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                  title={`Rate ${star} star${star > 1 ? "s" : ""}`}
                >
                  {starContent}
                </button>
              );
            }

            return (
              <span
                key={star}
                data-star-item={star}
                class="star-item relative p-0.5 inline-block"
                title={`${avg.toFixed(1)} stars`}
              >
                {starContent}
              </span>
            );
          })}
        </div>

        <span class="rating-text text-xs text-gray-500 font-medium">
          {avg > 0 ? `${avg.toFixed(1)}/5` : "No ratings"}{" "}
          {count > 0 && <span class="rating-count">({count})</span>}
        </span>
      </div>
    </div>
  );
}
