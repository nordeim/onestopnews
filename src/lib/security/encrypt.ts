import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): string {
  const key = process.env.PUSH_KEY_ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error("PUSH_KEY_ENCRYPTION_KEY must be a 32-byte (64 hex char) string");
  }
  return key;
}

/**
 * encryptPushKeys — Encrypts Web Push subscription keys with AES-256-GCM.
 *
 * Uses a random 16-byte IV and produces the format:
 *   ${iv}:${authTag}:${encryptedData} (all hex-encoded)
 *
 * @param pushKeys — { p256dh, auth } from the PushSubscription keys
 * @returns Hex-encoded encrypted string
 */
export function encryptPushKeys(keys: { p256dh: string; auth: string }): string {
  const key = getKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, Buffer.from(key, "hex"), iv);

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

  const key = getKey();
  const decipher = createDecipheriv(
    ALGORITHM,
    Buffer.from(key, "hex"),
    Buffer.from(ivHex, "hex")
  );

  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return JSON.parse(decrypted);
}
