const memoryCache = new Map<string, { value: any; expiresAt: number }>();

let denoKvPromise: Promise<any> | null = null;
async function getDenoKv(): Promise<any> {
  if (typeof (globalThis as any).Deno?.openKv !== "function") {
    return null;
  }
  if (!denoKvPromise) {
    denoKvPromise = (globalThis as any).Deno.openKv();
  }
  return await denoKvPromise;
}

/**
 * Caches the result of an async function in Cloudflare KV, Deno KV, or in-memory cache.
 * @param key The cache key array (e.g., ["medusa", "regions"])
 * @param fetcher The async function to fetch data if cache misses
 * @param ttlMs Time to live in milliseconds (default: 5 minutes)
 * @param env Optional Cloudflare environment object
 */
export async function withCache<T>(
  key: string[],
  fetcher: () => Promise<T>,
  ttlMs: number = 1000 * 60 * 5,
  env?: any,
): Promise<T> {
  const serializedKey = key.join(":");

  // 1. Cloudflare KV binding
  const cfKv = env?.CACHE_KV || env?.KV;
  if (cfKv && typeof cfKv.get === "function" && typeof cfKv.put === "function") {
    try {
      const cached = await cfKv.get(serializedKey, { type: "json" });
      if (cached && typeof cached === "object" && "value" in cached && "expiresAt" in cached) {
        if (cached.expiresAt > Date.now()) {
          return cached.value as T;
        }
      }
    } catch {}

    const data = await fetcher();
    if (data !== null && data !== undefined) {
      try {
        await cfKv.put(
          serializedKey,
          JSON.stringify({ value: data, expiresAt: Date.now() + ttlMs }),
          { expirationTtl: Math.max(60, Math.ceil(ttlMs / 1000)) },
        );
      } catch {}
    }
    return data;
  }

  // 2. Deno KV
  const denoKv = await getDenoKv();
  if (denoKv) {
    try {
      const cached = await denoKv.get(key);
      if (cached?.value && cached.value.expiresAt > Date.now()) {
        return cached.value.value as T;
      }
    } catch {}

    const data = await fetcher();
    if (data !== null && data !== undefined) {
      try {
        await denoKv.set(key, { value: data, expiresAt: Date.now() + ttlMs });
      } catch {}
    }
    return data;
  }

  // 3. In-memory / Test fallback
  const cached = memoryCache.get(serializedKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value as T;
  }

  const data = await fetcher();
  if (data !== null && data !== undefined) {
    memoryCache.set(serializedKey, { value: data, expiresAt: Date.now() + ttlMs });
  }
  return data;
}

export async function clearCache(prefix?: string[]): Promise<void> {
  memoryCache.clear();
  const denoKv = await getDenoKv();
  if (denoKv) {
    try {
      const iter = denoKv.list({ prefix: prefix || [] });
      for await (const entry of iter) {
        await denoKv.delete(entry.key);
      }
    } catch {}
  }
}

export function clearMemoryCache(): void {
  memoryCache.clear();
}
