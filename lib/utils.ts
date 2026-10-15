import type { HttpTypes } from "@medusajs/types";

export interface StoreState {
  shared?: string;
  isLoggedIn?: boolean;
  categories?: any[];
  isRepairModuleInstalled?: boolean;
  isPaystackInstalled?: boolean;
  customer?: HttpTypes.StoreCustomer | null;
  order?: HttpTypes.StoreOrder;
  orders?: HttpTypes.StoreOrder[];
  cart?: HttpTypes.StoreCart | null;
  title?: string;
  description?: string;
  hideLayout?: boolean;
  hasOrders?: boolean;
  hasRepairs?: boolean;
  storeName?: string;
  storeDomain?: string;
  logoUrl?: string;
}

export type AppEnv = {
  Variables: {
    state: StoreState;
    token?: string;
  };
  Bindings: {
    RATINGS_KV?: any;
    CACHE_KV?: any;
    KV?: any;
    STORE_NAME?: string;
    STORE_DOMAIN?: string;
    LOGO_URL?: string;
    MEDUSA_BACKEND_URL?: string;
    MEDUSA_PUBLISHABLE_KEY?: string;
    ASSETS?: any;
  };
};

export function getEnv(key: string, env?: any): string | undefined {
  if (env && typeof env === "object" && key in env) {
    return env[key];
  }
  if (typeof (globalThis as any).Deno?.env?.get === "function") {
    return (globalThis as any).Deno.env.get(key);
  }
  if (typeof (globalThis as any).process?.env === "object") {
    return (globalThis as any).process.env[key];
  }
  return undefined;
}

export function getStoreName(env?: any): string {
  return getEnv("STORE_NAME", env) || "Urban Device Care";
}

export function getStoreDomain(env?: any): string {
  return getEnv("STORE_DOMAIN", env) || "urbandevicecare.co.uk";
}

export function getLogoUrl(env?: any): string {
  return getEnv("LOGO_URL", env) || "/logo.svg";
}

export const STORE_NAME = getStoreName();
export const STORE_DOMAIN = getStoreDomain();
export const LOGO_URL = getLogoUrl();

export function formatProviderName(id: string): string {
  return id
    .replace(/^pp_/, "")
    .replace(/[_-]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export { formatAmount } from "./pricing.ts";
