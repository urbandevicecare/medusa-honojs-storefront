import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { getMedusaClient } from "../../lib/sdk.ts";
import type { AppEnv } from "../../lib/utils.ts";

export const accountApi = new Hono<AppEnv>();

// Middleware: require authentication
accountApi.use("*", async (c, next) => {
  const token = getCookie(c, "_medusa_jwt") || c.req.header("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  c.set("token", token);
  return await next();
});

accountApi.get("/profile", async (c) => {
  const token = c.get("token");
  const client = getMedusaClient(c.env);
  try {
    const { customer } = await client.store.customer.retrieve(
      { fields: "*addresses" },
      { Authorization: `Bearer ${token}` },
    );
    return c.json({ customer }, 200);
  } catch (e: any) {
    return c.json({ error: e.message }, 400);
  }
});

accountApi.post("/profile", async (c) => {
  const token = c.get("token");
  const client = getMedusaClient(c.env);
  try {
    const body = await c.req.json();
    const { customer } = await client.store.customer.update(
      body,
      { Authorization: `Bearer ${token}` },
    );
    return c.json({ customer }, 200);
  } catch (e: any) {
    return c.json({ error: e.message }, 400);
  }
});

accountApi.post("/address", async (c) => {
  const token = c.get("token");
  const client = getMedusaClient(c.env);
  try {
    const body = await c.req.json();
    const { address } = await client.store.customer.createAddress(
      body,
      { Authorization: `Bearer ${token}` },
    );
    return c.json({ address }, 200);
  } catch (e: any) {
    return c.json({ error: e.message }, 400);
  }
});
