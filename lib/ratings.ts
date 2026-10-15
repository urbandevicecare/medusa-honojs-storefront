export interface RatingStats {
  totalStars: number;
  count: number;
  average: number;
}

// In-memory fallback store for testing and environments without KV bindings
const memoryStatsStore = new Map<string, { totalStars: number; count: number }>();
const memoryUserRatingStore = new Map<string, number>();

let denoKvPromise: Promise<any> | null = null;
async function getDenoKv(): Promise<any> {
  if (typeof (globalThis as any).Deno?.openKv !== "function") {
    return null;
  }
  if (!denoKvPromise) {
    const isDeploy = (globalThis as any).Deno?.env?.get("DENO_DEPLOYMENT_ID");
    denoKvPromise = (globalThis as any).Deno.openKv(isDeploy ? undefined : "./ratings.db");
  }
  return await denoKvPromise;
}

export async function getProductRatings(
  productIds: string[],
  env?: any,
): Promise<Record<string, RatingStats>> {
  const results: Record<string, RatingStats> = {};
  if (!productIds || productIds.length === 0) return results;

  // 1. Cloudflare KV binding
  const cfKv = env?.RATINGS_KV || env?.KV;
  if (cfKv && typeof cfKv.get === "function") {
    await Promise.all(
      productIds.map(async (id) => {
        try {
          const raw = await cfKv.get(`product_ratings:${id}`, { type: "json" });
          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
          const data = parsed || { totalStars: 0, count: 0 };
          results[id] = {
            totalStars: data.totalStars || 0,
            count: data.count || 0,
            average: data.count > 0
              ? Number((data.totalStars / data.count).toFixed(1))
              : 0,
          };
        } catch {
          results[id] = { totalStars: 0, count: 0, average: 0 };
        }
      }),
    );
    return results;
  }

  // 2. Deno KV
  const denoKv = await getDenoKv();
  if (denoKv) {
    const keys = productIds.map((id) => ["product_ratings", id]);
    for (let i = 0; i < keys.length; i += 10) {
      const chunk = keys.slice(i, i + 10);
      const res = await denoKv.getMany(chunk);
      res.forEach((entry: any, idx: number) => {
        const productId = chunk[idx][1] as string;
        const data = entry.value || { totalStars: 0, count: 0 };
        results[productId] = {
          totalStars: data.totalStars,
          count: data.count,
          average: data.count > 0
            ? Number((data.totalStars / data.count).toFixed(1))
            : 0,
        };
      });
    }
    return results;
  }

  // 3. In-memory / Test fallback
  for (const id of productIds) {
    const data = memoryStatsStore.get(id) || { totalStars: 0, count: 0 };
    results[id] = {
      totalStars: data.totalStars,
      count: data.count,
      average: data.count > 0
        ? Number((data.totalStars / data.count).toFixed(1))
        : 0,
    };
  }
  return results;
}

export async function submitRating(
  productId: string,
  userId: string,
  rating: number,
  env?: any,
): Promise<RatingStats> {
  if (
    typeof rating !== "number" ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    throw new Error("Rating must be an integer between 1 and 5");
  }

  if (!productId || typeof productId !== "string" || !productId.trim()) {
    throw new Error("Missing or invalid productId");
  }

  if (!userId || typeof userId !== "string" || !userId.trim()) {
    throw new Error("Missing or invalid userId");
  }

  // 1. Cloudflare KV binding
  const cfKv = env?.RATINGS_KV || env?.KV;
  if (cfKv && typeof cfKv.get === "function" && typeof cfKv.put === "function") {
    const statsKey = `product_ratings:${productId}`;
    const userKey = `product_user_ratings:${productId}:${userId}`;

    const [currentStatsRaw, previousRatingRaw] = await Promise.all([
      cfKv.get(statsKey, { type: "json" }),
      cfKv.get(userKey, { type: "json" }),
    ]);

    const currentStats = (typeof currentStatsRaw === "string" ? JSON.parse(currentStatsRaw) : currentStatsRaw) || { totalStars: 0, count: 0 };
    const parsedPrev = typeof previousRatingRaw === "string" ? JSON.parse(previousRatingRaw) : previousRatingRaw;
    const previousRating = typeof parsedPrev === "number" ? parsedPrev : null;

    let newTotal = currentStats.totalStars || 0;
    let newCount = currentStats.count || 0;

    if (previousRating !== null) {
      newTotal = newTotal - previousRating + rating;
    } else {
      newTotal += rating;
      newCount += 1;
    }

    const nextStats = { totalStars: newTotal, count: newCount };

    await Promise.all([
      cfKv.put(statsKey, JSON.stringify(nextStats)),
      cfKv.put(userKey, JSON.stringify(rating)),
    ]);

    return {
      totalStars: nextStats.totalStars,
      count: nextStats.count,
      average: nextStats.count > 0
        ? Number((nextStats.totalStars / nextStats.count).toFixed(1))
        : 0,
    };
  }

  // 2. Deno KV
  const denoKv = await getDenoKv();
  if (denoKv) {
    const statsKey = ["product_ratings", productId];
    const userKey = ["product_user_ratings", productId, userId];

    let res = { ok: false };
    let finalStats: RatingStats = { totalStars: 0, count: 0, average: 0 };

    while (!res.ok) {
      const [statsRes, userRes] = await denoKv.getMany([statsKey, userKey]);
      const currentStats = (statsRes.value as { totalStars: number; count: number }) || {
        totalStars: 0,
        count: 0,
      };
      const previousRating = userRes.value as number | null;

      let newTotal = currentStats.totalStars;
      let newCount = currentStats.count;

      if (typeof previousRating === "number") {
        newTotal = newTotal - previousRating + rating;
      } else {
        newTotal += rating;
        newCount += 1;
      }

      const nextStats = { totalStars: newTotal, count: newCount };

      res = await denoKv.atomic()
        .check(statsRes)
        .check(userRes)
        .set(statsKey, nextStats)
        .set(userKey, rating)
        .commit();

      if (res.ok) {
        finalStats = {
          totalStars: nextStats.totalStars,
          count: nextStats.count,
          average: nextStats.count > 0
            ? Number((nextStats.totalStars / nextStats.count).toFixed(1))
            : 0,
        };
      }
    }

    return finalStats;
  }

  // 3. In-memory / Test fallback
  const currentStats = memoryStatsStore.get(productId) || { totalStars: 0, count: 0 };
  const userKey = `${productId}:${userId}`;
  const previousRating = memoryUserRatingStore.get(userKey) ?? null;

  let newTotal = currentStats.totalStars;
  let newCount = currentStats.count;

  if (previousRating !== null) {
    newTotal = newTotal - previousRating + rating;
  } else {
    newTotal += rating;
    newCount += 1;
  }

  const nextStats = { totalStars: newTotal, count: newCount };
  memoryStatsStore.set(productId, nextStats);
  memoryUserRatingStore.set(userKey, rating);

  return {
    totalStars: nextStats.totalStars,
    count: nextStats.count,
    average: nextStats.count > 0
      ? Number((nextStats.totalStars / nextStats.count).toFixed(1))
      : 0,
  };
}

export async function getUserRating(
  productId: string,
  userId: string,
  env?: any,
): Promise<number | null> {
  if (!productId || !userId) return null;

  // 1. Cloudflare KV binding
  const cfKv = env?.RATINGS_KV || env?.KV;
  if (cfKv && typeof cfKv.get === "function") {
    try {
      const val = await cfKv.get(`product_user_ratings:${productId}:${userId}`, { type: "json" });
      const parsed = typeof val === "string" ? JSON.parse(val) : val;
      return typeof parsed === "number" ? parsed : null;
    } catch {
      return null;
    }
  }

  // 2. Deno KV
  const denoKv = await getDenoKv();
  if (denoKv) {
    const res = await denoKv.get(["product_user_ratings", productId, userId]);
    return (res.value as number) || null;
  }

  // 3. In-memory fallback
  const userKey = `${productId}:${userId}`;
  return memoryUserRatingStore.get(userKey) ?? null;
}

export async function resetRatingsStore(): Promise<void> {
  memoryStatsStore.clear();
  memoryUserRatingStore.clear();
  const denoKv = await getDenoKv();
  if (denoKv) {
    try {
      const iter1 = denoKv.list({ prefix: ["product_ratings"] });
      for await (const entry of iter1) {
        await denoKv.delete(entry.key);
      }
      const iter2 = denoKv.list({ prefix: ["product_user_ratings"] });
      for await (const entry of iter2) {
        await denoKv.delete(entry.key);
      }
    } catch {}
  }
}

export function resetMemoryRatingsStore(): void {
  memoryStatsStore.clear();
  memoryUserRatingStore.clear();
}

