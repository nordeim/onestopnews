import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * encrypt.ts — AES-256-GCM push key encryption.
 *
 * The PUSH_KEY_ENCRYPTION_KEY env var is validated AT MODULE LOAD (not
 * lazily inside encrypt/decrypt). This makes the worker / web server
 * fail fast at boot if the env var is missing or invalid — the
 * documented contract per src/lib/env/index.ts and AGENTS.md §Auth.
 *
 * Previously this module validated lazily inside getKey(), which meant
 * an unset/invalid key would only surface as a 500 on the first push
 * operation (deferred-failure pattern). Hoisting the validation to
 * module scope matches the pattern in env/index.ts and the documented
 * "validated at module load" contract.
 */

const ALGORITHM = "aes-256-gcm";

// ─── Module-load validation ────────────────────────────────────────────────
// Read + validate the env var ONCE at import time. Cache the Buffer so
// encrypt/decrypt don't re-validate or re-allocate on every call.
const PUSH_KEY_HEX = process.env.PUSH_KEY_ENCRYPTION_KEY;
if (!PUSH_KEY_HEX || PUSH_KEY_HEX.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(PUSH_KEY_HEX)) {
  throw new Error(
    "PUSH_KEY_ENCRYPTION_KEY must be a 32-byte (64 hex char) string. " +
      "Generate one with: openssl rand -hex 32"
  );
}
const KEY_BUFFER = Buffer.from(PUSH_KEY_HEX, "hex");

/**
 * encryptPushKeys — Encrypts Web Push subscription keys with AES-256-GCM.
 *
 * Uses a random 16-byte IV and produces the format:
 *   ${iv}:${authTag}:${encryptedData} (all hex-encoded)
 *
 * @param keys — { p256dh, auth } from the PushSubscription keys
 * @returns Hex-encoded encrypted string
 */
export function encryptPushKeys(keys: { p256dh: string; auth: string }): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY_BUFFER, iv);

  let encrypted = cipher.update(JSON.stringify(keys), "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encryptedData
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * decryptPushKeys — Decrypts Web Push subscription keys.
 *
 * @param encryptedString — Format: ${iv}:${authTag}:${encryptedData}
 * @returns Original { p256dh, auth } object
 */
export function decryptPushKeys(encryptedString: string): { p256dh: string; auth: string } {
  const [ivHex, authTagHex, encryptedHex] = encryptedString.split(":");

  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Invalid encrypted push key format");
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    KEY_BUFFER,
    Buffer.from(ivHex, "hex")
  );

  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return JSON.parse(decrypted);
}
