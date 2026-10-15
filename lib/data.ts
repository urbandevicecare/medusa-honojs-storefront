import { getMedusaClient } from "./sdk.ts";
import { withCache } from "./cache.ts";

export async function getCategories(env?: any) {
  return await withCache(
    ["medusa", "categories"],
    async () => {
      try {
        const client = getMedusaClient(env);
        const { product_categories } = await client.store.category.list({
          limit: 100,
        });
        if (product_categories) {
          // Sort by rank
          return product_categories.sort((a: any, b: any) =>
            (a.rank || 0) - (b.rank || 0)
          );
        }
      } catch (e) {
        console.warn("Failed to fetch product categories", e);
      }
      return [];
    },
    1000 * 60 * 15, // 15 minutes cache
    env,
  );
}

export async function getStoreRegion(env?: any) {
  return await withCache(
    ["medusa", "region"],
    async () => {
      try {
        const client = getMedusaClient(env);
        const { regions } = await client.store.region.list();
        if (regions && regions.length > 0) {
          return regions[0];
        }
      } catch (_e) {
        console.warn("Failed to fetch regions");
      }
      return null;
    },
    1000 * 60 * 60, // 1 hour cache
    env,
  );
}

export async function getStoreCurrency(env?: any) {
  const region = await getStoreRegion(env);
  return region?.currency_code || "USD";
}

export async function getProducts(
  collectionHandle?: string,
  headers?: Record<string, string>,
  env?: any,
) {
  try {
    const region = await getStoreRegion(env);
    const client = getMedusaClient(env);

    const query: Record<string, string | string[]> = {};
    if (region?.id) {
      query.region_id = region.id;
    }

    if (collectionHandle) {
      const collections = await withCache(
        ["medusa", "collection", collectionHandle],
        async () => {
          const { collections } = await client.store.collection.list(
            { handle: collectionHandle },
            headers,
          );
          return collections;
        },
        1000 * 60 * 60, // 1 hour cache
        env,
      );

      if (collections && collections.length > 0) {
        query.collection_id = [collections[0].id];
      }
    }

    const { products } = await client.store.product.list(query, headers);

    if (products && products.length > 0) {
      return products;
    }
    return [];
  } catch (e) {
    console.error(
      `Failed to fetch data for ${collectionHandle || "products"}. Error:`,
      e,
    );
    throw e;
  }
}
