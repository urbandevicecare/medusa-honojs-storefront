import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { getMedusaClient } from "../../lib/sdk.ts";
import { getStoreCurrency } from "../../lib/data.ts";
import { getProductRatings } from "../../lib/ratings.ts";

export const productsApi = new Hono();

productsApi.get("/", async (c) => {
  const page = parseInt(c.req.query("page") || "1", 10);
  const limit = parseInt(c.req.query("limit") || "12", 10);
  const sort = c.req.query("sort") || "-created_at";
  const q = c.req.query("q") || "";
  const categoryHandle = c.req.query("category") || "";

  const token = getCookie(c, "_medusa_jwt") || c.req.header("Authorization")?.replace(/^Bearer\s+/i, "");
  const client = getMedusaClient(c.env);

  try {
    const query: Record<string, string | number | string[]> = {
      limit,
      offset: (page - 1) * limit,
      order: sort,
      fields:
        "*variants,*variants.options,*options,*options.values,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder",
    };
    if (q) query.q = q;

    if (categoryHandle) {
      const { product_categories } = await client.store.category.list({
        handle: categoryHandle,
      });
      if (product_categories && product_categories.length > 0) {
        query.category_id = [product_categories[0].id];
      } else {
        return c.json({
          products: [],
          count: 0,
          isError: false,
          currencyCode: "USD",
        });
      }
    }

    // Fetch region to get region_id for calculated prices
    try {
      const { regions } = await client.store.region.list();
      const region = regions?.[0];
      if (region) {
        query.region_id = region.id;
      }
    } catch {}

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const [{ products, count }, currencyCode] = await Promise.all([
      client.store.product.list(query, headers).catch(() => ({ products: [], count: 0 })),
      getStoreCurrency(c.env).catch(() => "USD"),
    ]);

    // Fetch KV ratings for all retrieved products
    let ratings: Record<string, any> = {};
    if (products && products.length > 0) {
      ratings = await getProductRatings(
        products.map((p: any) => p.id),
        c.env,
      );
    }

    // Attach ratings directly to the product objects
    const productsWithRatings = (products || []).map((p: any) => ({
      ...p,
      ratingStats: ratings[p.id] || { totalStars: 0, count: 0, average: 0 },
    }));

    return c.json({
      products: productsWithRatings,
      count,
      isError: false,
      currencyCode,
    });
  } catch (e: any) {
    console.error("API Error fetching products:", e);
    return c.json(
      {
        products: [],
        count: 0,
        isError: true,
        error: e instanceof Error ? e.message : "Unknown error",
        currencyCode: "USD",
      },
      500,
    );
  }
});
