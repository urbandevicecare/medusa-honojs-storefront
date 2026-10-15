import { getMedusaBackendUrl, getMedusaPublishableKey } from "./sdk.ts";
import { withCache } from "./cache.ts";

export async function isPaystackInstalled(env?: any): Promise<boolean> {
  return await withCache(
    ["medusa", "feature", "paystack_v3"],
    async () => {
      try {
        const backendUrl = getMedusaBackendUrl(env);
        const publishableKey = getMedusaPublishableKey(env);
        const response = await fetch(`${backendUrl}/store/paystack/stk-push`, {
          method: "OPTIONS",
          headers: publishableKey ? { "x-publishable-api-key": publishableKey } : {},
        });
        if (response.status === 404) {
          return false;
        }
        return true;
      } catch (e) {
        console.warn("Failed to check Paystack installation", e);
        return false;
      }
    },
    1000 * 60 * 60 * 24, // Cache for 24 hours
    env,
  );
}

export async function isRepairModuleInstalled(env?: any): Promise<boolean> {
  return await withCache(
    ["medusa", "feature", "repair-module"],
    async () => {
      try {
        const backendUrl = getMedusaBackendUrl(env);
        // Ping a known repair module endpoint
        const response = await fetch(`${backendUrl}/store/repairs?limit=1`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        // If it's a 404, the route doesn't exist (plugin not installed)
        if (response.status === 404) {
          return false;
        }

        // Any other status (200, 400, 401) implies the route exists and plugin is installed
        return true;
      } catch (e) {
        console.warn("Failed to check Repair Module installation", e);
        return false;
      }
    },
    1000 * 60 * 60 * 24, // Cache for 24 hours
    env,
  );
}
