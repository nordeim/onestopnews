import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
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
//  - PUSH_KEY_ENCRYPTION_KEY validated at MODULE LOAD (fail-fast at boot)
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

// ─── MODULE-LOAD VALIDATION TESTS ────────────────────────────────────────────
//
// Phase 3 remediation: PUSH_KEY_ENCRYPTION_KEY must be validated at MODULE
// LOAD (not lazily inside encryptPushKeys/decryptPushKeys). This makes the
// worker / web server fail fast at boot if the env var is missing/invalid,
// rather than 500-ing on the first push operation.
//
// These tests use vi.resetModules() + dynamic import() to re-trigger the
// module load with controlled env state. The previously-cached module is
// discarded so the new env value takes effect at the fresh module load.
// ─────────────────────────────────────────────────────────────────────────────

describe("PUSH_KEY_ENCRYPTION_KEY module-load validation", () => {
  const originalKey = process.env.PUSH_KEY_ENCRYPTION_KEY;

  afterEach(() => {
    // Restore original env state and reset the module cache so subsequent
    // test files see a clean module loaded with the test-setup env value.
    if (originalKey) {
      process.env.PUSH_KEY_ENCRYPTION_KEY = originalKey;
    } else {
      delete process.env.PUSH_KEY_ENCRYPTION_KEY;
    }
    vi.resetModules();
  });

  it("module loads successfully when PUSH_KEY_ENCRYPTION_KEY is a valid 64-hex string", async () => {
    process.env.PUSH_KEY_ENCRYPTION_KEY = TEST_KEY;
    vi.resetModules();

    // Importing the module should NOT throw — the env var is valid.
    const mod = await import("./encrypt");
    expect(mod.encryptPushKeys).toBeDefined();
    expect(mod.decryptPushKeys).toBeDefined();
  });

  it("module throws at import time when PUSH_KEY_ENCRYPTION_KEY is missing", async () => {
    delete process.env.PUSH_KEY_ENCRYPTION_KEY;
    vi.resetModules();

    await expect(import("./encrypt")).rejects.toThrow(/PUSH_KEY_ENCRYPTION_KEY/);
  });

  it("module throws at import time when PUSH_KEY_ENCRYPTION_KEY is not 64 chars", async () => {
    process.env.PUSH_KEY_ENCRYPTION_KEY = "tooshort";
    vi.resetModules();

    await expect(import("./encrypt")).rejects.toThrow(/PUSH_KEY_ENCRYPTION_KEY/);
  });

  it("module throws at import time when PUSH_KEY_ENCRYPTION_KEY is not hex", async () => {
    // 64 chars long but contains non-hex characters (z, x, etc.)
    process.env.PUSH_KEY_ENCRYPTION_KEY = "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz";
    vi.resetModules();

    await expect(import("./encrypt")).rejects.toThrow(/PUSH_KEY_ENCRYPTION_KEY/);
  });
});
