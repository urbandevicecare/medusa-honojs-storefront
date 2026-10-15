import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { getMedusaClient, getMedusaBackendUrl, getMedusaPublishableKey } from "../../lib/sdk.ts";
import type { AppEnv } from "../../lib/utils.ts";

export const authApi = new Hono<AppEnv>();

// POST /api/auth/login
authApi.post("/login", async (c) => {
  try {
    const client = getMedusaClient(c.env);
    const { email, password } = await c.req.json();

    const result = await client.auth.login("customer", "emailpass", {
      email,
      password,
    });

    if (typeof result !== "string") {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const token = result;
    const cartId = getCookie(c, "_medusa_cart_id");

    try {
      const { customer } = await client.store.customer.retrieve(
        {},
        { Authorization: `Bearer ${token}` },
      );

      if ((customer?.metadata as any)?.is_verified === false) {
        return c.json(
          { error: "Please verify your email before logging in." },
          403,
        );
      }

      if (cartId && customer?.id) {
        await client.store.cart.update(
          cartId,
          { email: customer.email },
          { Authorization: `Bearer ${token}` },
        );
      }
    } catch (err) {
      console.warn("Could not retrieve customer details after login:", err);
    }

    setCookie(c, "_medusa_jwt", token, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      maxAge: 2592000,
    });

    return c.json({ success: true }, 200);
  } catch (e: any) {
    return c.json(
      { error: e instanceof Error ? e.message : "Login failed" },
      401,
    );
  }
});

// GET & POST /api/auth/logout
authApi.all("/logout", (c) => {
  deleteCookie(c, "_medusa_jwt", { path: "/" });
  return c.redirect("/login");
});

// POST /api/auth/register
authApi.post("/register", async (c) => {
  try {
    const client = getMedusaClient(c.env);
    const body = await c.req.json();
    const { email, password, first_name, last_name, phone } = body;

    // Register with Medusa auth
    await client.auth.register("customer", "emailpass", {
      email,
      password,
    });

    // Login immediately to get token
    const token = await client.auth.login("customer", "emailpass", {
      email,
      password,
    });

    if (typeof token === "string") {
      // Update customer profile
      await client.store.customer.update(
        { first_name, last_name, phone },
        { Authorization: `Bearer ${token}` },
      );

      setCookie(c, "_medusa_jwt", token, {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
        maxAge: 2592000,
      });
    }

    return c.json({ success: true }, 200);
  } catch (e: any) {
    return c.json(
      { error: e instanceof Error ? e.message : "Registration failed" },
      400,
    );
  }
});

// POST /api/auth/verify-email
authApi.post("/verify-email", async (c) => {
  try {
    const backendUrl = getMedusaBackendUrl(c.env);
    const publishableKey = getMedusaPublishableKey(c.env);
    const body = await c.req.json();

    const res = await fetch(`${backendUrl}/store/customers/verify-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(publishableKey ? { "x-publishable-api-key": publishableKey } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    return c.json(data, res.status as any);
  } catch (e: any) {
    return c.json(
      { error: e instanceof Error ? e.message : "Email verification failed" },
      500,
    );
  }
});
