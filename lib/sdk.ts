import MedusaSdk from "@medusajs/js-sdk";
import { getEnv } from "./utils.ts";

const MedusaConstructor = (MedusaSdk as any).default || MedusaSdk;

export function getMedusaBackendUrl(env?: any): string {
  return getEnv("MEDUSA_BACKEND_URL", env) || "http://localhost:9000";
}

export function getMedusaPublishableKey(env?: any): string {
  return getEnv("MEDUSA_PUBLISHABLE_KEY", env) || "pk_c7904d9e7fcc12a1a42277a4e0e33e3479c9653efeed505bdc70dc442d21b067";
}

export const medusaUrl = getMedusaBackendUrl();
export const publishableKey = getMedusaPublishableKey();

// Default global Medusa SDK instance
export const medusa = new MedusaConstructor({
  baseUrl: medusaUrl,
  publishableKey: publishableKey,
  debug: false,
}) as any;

export function createMedusaClient(env?: any): any {
  return new MedusaConstructor({
    baseUrl: getMedusaBackendUrl(env),
    publishableKey: getMedusaPublishableKey(env),
    debug: false,
  });
}

export function getMedusaClient(env?: any): any {
  if (env && (env.MEDUSA_BACKEND_URL || env.MEDUSA_PUBLISHABLE_KEY)) {
    return createMedusaClient(env);
  }
  return medusa;
}
