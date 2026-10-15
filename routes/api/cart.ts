import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { getMedusaClient } from "../../lib/sdk.ts";
import type { AppEnv } from "../../lib/utils.ts";

export const cartApi = new Hono<AppEnv>();

// GET: Retrieve current cart
cartApi.get("/", async (c) => {
  try {
    const client = getMedusaClient(c.env);
    const cartId = getCookie(c, "_medusa_cart_id");
    const token = getCookie(c, "_medusa_jwt") || c.req.header("Authorization")?.replace(/^Bearer\s+/i, "");

    if (!cartId) {
      return c.json({ cart: null }, 200);
    }

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const { cart } = await client.store.cart.retrieve(
      cartId,
      { fields: "*items,*items.variant,*items.variant.product" },
      headers,
    );

    return c.json({ cart }, 200);
  } catch (e: any) {
    return c.json(
      { error: e instanceof Error ? e.message : "Failed to retrieve cart" },
      400,
    );
  }
});

// POST: Create cart or add line item
cartApi.post("/", async (c) => {
  try {
    const client = getMedusaClient(c.env);
    let cartId = getCookie(c, "_medusa_cart_id");
    const token = getCookie(c, "_medusa_jwt") || c.req.header("Authorization")?.replace(/^Bearer\s+/i, "");
    const body = await c.req.json().catch(() => ({}));

    let cart;
    const reqHeaders: Record<string, string> = {};
    if (token) {
      reqHeaders.Authorization = `Bearer ${token}`;
    }

    if (!cartId) {
      let region_id = body.region_id;
      if (!region_id) {
        const { regions } = await client.store.region.list().catch(() => ({ regions: [] }));
        region_id = regions?.[0]?.id;
      }

      let email: string | undefined;
      if (token) {
        try {
          const { customer } = await client.store.customer.retrieve({}, reqHeaders);
          if (customer) email = customer.email;
        } catch {}
      }

      const { cart: newCart } = await client.store.cart.create(
        { region_id, email },
        {},
        reqHeaders,
      );
      cart = newCart;
      cartId = cart.id;

      if (cartId) {
        setCookie(c, "_medusa_cart_id", cartId, {
          path: "/",
          httpOnly: true,
          secure: true,
          sameSite: "Lax",
          maxAge: 2592000,
        });
      }
    } else {
      const { cart: existingCart } = await client.store.cart.retrieve(
        cartId,
        {},
        reqHeaders,
      );
      cart = existingCart;
    }

    if (body.variant_id && body.quantity && cartId) {
      const { cart: updatedCart } = await client.store.cart.createLineItem(
        cartId,
        {
          variant_id: body.variant_id,
          quantity: body.quantity,
        },
        {},
        reqHeaders,
      );
      cart = updatedCart;
    }

    return c.json({ cart }, 200);
  } catch (e: any) {
    return c.json(
      { error: e instanceof Error ? e.message : "Failed to update cart" },
      400,
    );
  }
});

// Items manipulation
cartApi.post("/items", async (c) => {
  try {
    const client = getMedusaClient(c.env);
    const cartId = getCookie(c, "_medusa_cart_id");
    if (!cartId) return c.json({ error: "No active cart" }, 400);

    const token = getCookie(c, "_medusa_jwt");
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    const { variant_id, quantity } = await c.req.json();

    const { cart } = await client.store.cart.createLineItem(
      cartId,
      { variant_id, quantity },
      {},
      headers,
    );
    return c.json({ cart }, 200);
  } catch (e: any) {
    return c.json({ error: e.message }, 400);
  }
});

cartApi.delete("/items/:id", async (c) => {
  try {
    const client = getMedusaClient(c.env);
    const cartId = getCookie(c, "_medusa_cart_id");
    if (!cartId) return c.json({ error: "No active cart" }, 400);

    const lineItemId = c.req.param("id");
    const token = getCookie(c, "_medusa_jwt");
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    const { parent: cart } = await client.store.cart.deleteLineItem(
      cartId,
      lineItemId,
      headers,
    );
    return c.json({ cart }, 200);
  } catch (e: any) {
    return c.json({ error: e.message }, 400);
  }
});

cartApi.post("/shipping-options", async (c) => {
  try {
    const client = getMedusaClient(c.env);
    const cartId = getCookie(c, "_medusa_cart_id");
    if (!cartId) return c.json({ error: "No active cart" }, 400);
    const { shipping_options } = await client.store.fulfillment.listCartOptions({ cart_id: cartId });
    return c.json({ shipping_options }, 200);
  } catch (e: any) {
    return c.json({ error: e.message }, 400);
  }
});

cartApi.post("/complete", async (c) => {
  try {
    const client = getMedusaClient(c.env);
    const cartId = getCookie(c, "_medusa_cart_id");
    if (!cartId) return c.json({ error: "No active cart" }, 400);
    const token = getCookie(c, "_medusa_jwt");
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    const result = await client.store.cart.complete(cartId, {}, headers);
    return c.json(result, 200);
  } catch (e: any) {
    return c.json({ error: e.message }, 400);
  }
});
