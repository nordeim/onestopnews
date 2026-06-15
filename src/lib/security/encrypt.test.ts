import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { encryptPushKeys, decryptPushKeys } from "./encrypt";

// ─── UNIT TEST: AES-256-GCM Push Key Encryption ──────────────────────────────
//
// TDD Approach: Write failing tests first, then implement.
//
// Security requirements (per PRD v4.3 §8.2):
//  - Keys must be encrypted at rest with AES-256-GCM
//  - IV (12+ bytes) + Auth Tag (16 bytes) + Ciphertext
//  - Round-trip: encrypt -> decrypt produces identical input
//  - Invalid format throws descriptive error
// ─────────────────────────────────────────────────────────────────────────────

// Set a test encryption key
const TEST_KEY = "aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899";

describe("push key encryption", () => {
  const originalKey = process.env.PUSH_KEY_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.PUSH_KEY_ENCRYPTION_KEY = TEST_KEY;
  });

  afterEach(() => {
    if (originalKey) {
      process.env.PUSH_KEY_ENCRYPTION_KEY = originalKey;
    } else {
      delete process.env.PUSH_KEY_ENCRYPTION_KEY;
    }
  });

  it("round-trips encryption and decryption correctly", () => {
    const original = {
      p256dh: "BF8pKvQlt5lRJBBs5DhKYJ3w8J-zZdqvdvh3umpYwNE=",
      auth: "f7GzA0dGKb2KxY3-vQWuBQ==",
    };

    const encrypted = encryptPushKeys(original);
    expect(encrypted).toBeDefined();
    expect(encrypted.split(":")).toHaveLength(3); // iv:authTag:ciphertext

    const decrypted = decryptPushKeys(encrypted);
    expect(decrypted).toEqual(original);
  });

  it("throws on invalid encrypted format", () => {
    expect(() => decryptPushKeys("invalid")).toThrow("Invalid encrypted push key format");
    expect(() => decryptPushKeys("only:two")).toThrow("Invalid encrypted push key format");
  });

  it("produces different ciphertext for same input (IV is random)", () => {
    const original = {
      p256dh: "BF8pKvQlt5lRJBBs5DhKYJ3w8J-zZdqvdvh3umpYwNE=",
      auth: "f7GzA0dGKb2KxY3-vQWuBQ==",
    };

    const encrypted1 = encryptPushKeys(original);
    const encrypted2 = encryptPushKeys(original);

    // Same input should produce different ciphertext because IV is random
    expect(encrypted1).not.toBe(encrypted2);
  });

  it("handles longer push keys correctly", () => {
    const original = {
      p256dh: "x".repeat(1000),
      auth: "y".repeat(500),
    };

    const encrypted = encryptPushKeys(original);
    const decrypted = decryptPushKeys(encrypted);

    expect(decrypted).toEqual(original);
  });
});
