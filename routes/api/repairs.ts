import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { getMedusaBackendUrl, getMedusaPublishableKey } from "../../lib/sdk.ts";

export const repairsApi = new Hono();

repairsApi.post("/book", async (c) => {
  try {
    const backendUrl = getMedusaBackendUrl(c.env);
    const publishableKey = getMedusaPublishableKey(c.env);
    const body = await c.req.json();
    const token = getCookie(c, "_medusa_jwt");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-publishable-api-key": publishableKey,
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${backendUrl}/store/repairs`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return c.json(data, res.status as any);
  } catch (e: any) {
    return c.json({ error: e.message || "Failed to book repair" }, 500);
  }
});

repairsApi.get("/track", async (c) => {
  try {
    const backendUrl = getMedusaBackendUrl(c.env);
    const publishableKey = getMedusaPublishableKey(c.env);
    const ticket = c.req.query("ticket") || c.req.query("serial") || "";
    const token = c.req.query("token") || "";

    const headers: Record<string, string> = {
      "x-publishable-api-key": publishableKey,
    };

    const url = new URL(`${backendUrl}/store/repairs`);
    if (ticket) url.searchParams.set("ticket", ticket);
    if (token) url.searchParams.set("token", token);

    const res = await fetch(url.toString(), { headers });
    const data = await res.json();
    return c.json(data, res.status as any);
  } catch (e: any) {
    return c.json({ error: e.message || "Failed to track repair" }, 500);
  }
});

repairsApi.get("/settings", async (c) => {
  try {
    const backendUrl = getMedusaBackendUrl(c.env);
    const publishableKey = getMedusaPublishableKey(c.env);

    const res = await fetch(`${backendUrl}/store/repairs/settings`, {
      headers: { "x-publishable-api-key": publishableKey },
    });
    const data = await res.json();
    return c.json(data, res.status as any);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});
