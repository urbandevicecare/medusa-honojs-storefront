// Secure HMAC hashing utility for generating unguessable public URLs
import { getEnv } from "./utils.ts";

/**
 * Generates an HMAC SHA-256 hash for a given order ID using a shared secret.
 */
export async function generateOrderHash(
  orderId: string,
  customSecret?: string,
  env?: any,
): Promise<string> {
  const secretKeyString = customSecret ||
    getEnv("MEDUSA_PUBLISHABLE_KEY", env) ||
    "super_secret_fallback_key";

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKeyString);
  const messageData = encoder.encode(orderId);

  // Import the key for HMAC SHA-256
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );

  // Generate the signature
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    messageData,
  );

  // Convert buffer to hex string
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join(
    "",
  );

  return hashHex;
}

/**
 * Verifies if the provided hash perfectly matches the expected hash for the order ID.
 */
export async function verifyOrderHash(
  orderId: string,
  providedHash: string,
  env?: any,
): Promise<boolean> {
  const expectedHash = await generateOrderHash(orderId, undefined, env);
  if (expectedHash === providedHash) return true;

  // Fallback check against default key in case environment was unset during generation
  const fallbackHash = await generateOrderHash(orderId, "super_secret_fallback_key");
  if (fallbackHash === providedHash) return true;

  return false;
}
