import { assertEquals } from "@std/assert";
import { withCache, clearCache } from "../lib/cache.ts";

Deno.test("withCache - executes fetcher on first call", async () => {
  await clearCache();
  let callCount = 0;
  const mockFetcher = () => {
    callCount++;
    return Promise.resolve({ data: "test" });
  };

  const result = await withCache(["test", "key1"], mockFetcher);
  assertEquals(result.data, "test");
  assertEquals(callCount, 1);
});

Deno.test("withCache - returns cached value on second call", async () => {
  await clearCache();
  let callCount = 0;
  const mockFetcher = () => {
    callCount++;
    return Promise.resolve({ data: "cached_test" });
  };

  // First call populates cache
  await withCache(["test", "key2"], mockFetcher);

  // Second call should hit cache
  const result2 = await withCache(["test", "key2"], mockFetcher);

  assertEquals(result2.data, "cached_test");
  assertEquals(callCount, 1);
});

Deno.test("withCache - expires cache correctly", async () => {
  await clearCache();
  let callCount = 0;
  const mockFetcher = () => {
    callCount++;
    return Promise.resolve({ data: "expire_test" });
  };

  // Cache with 10ms TTL
  await withCache(["test", "key3"], mockFetcher, 10);

  // Wait for TTL to expire
  await new Promise((r) => setTimeout(r, 40));

  // Second call should trigger fetcher again
  await withCache(["test", "key3"], mockFetcher, 10);

  assertEquals(callCount, 2);
});

