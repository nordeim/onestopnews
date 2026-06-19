/**
 * index.test.ts — Tests for the Zod env validation schema.
 *
 * Verifies that TRUSTED_PROXY is a recognized, optional env var. The
 * schema must accept its presence (with any string value) and its absence
 * (since it's .optional()).
 *
 * These tests directly exercise envSchema (not the module-level `env`
 * export, which validates process.env at module load and would throw in
 * the test environment if vars were missing).
 */

import { describe, it, expect } from "vitest";
import { envSchema } from "./index";

// Minimal required-vars payload that satisfies every required field in
// envSchema. Individual tests spread this and add/override fields.
const BASE_REQUIRED = {
  DATABASE_URL: "postgres://user:pass@host:5432/db",
  REDIS_URL: "redis://localhost:6379",
  AUTH_SECRET: "x".repeat(32),
  AUTH_URL: "http://localhost:3000",
  ANTHROPIC_API_KEY: "sk-ant-test-key",
  OPENAI_API_KEY: "sk-test-key",
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: "vapid-public",
  VAPID_PRIVATE_KEY: "vapid-private",
  VAPID_SUBJECT: "mailto:test@example.com",
  PUSH_KEY_ENCRYPTION_KEY: "0".repeat(64),
} as const;

describe("envSchema — TRUSTED_PROXY field", () => {
  it("accepts TRUSTED_PROXY='true' (trusted-proxy mode enabled)", () => {
    const result = envSchema.safeParse({
      ...BASE_REQUIRED,
      TRUSTED_PROXY: "true",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.TRUSTED_PROXY).toBe("true");
    }
  });

  it("accepts TRUSTED_PROXY='false' (explicit disable)", () => {
    const result = envSchema.safeParse({
      ...BASE_REQUIRED,
      TRUSTED_PROXY: "false",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.TRUSTED_PROXY).toBe("false");
    }
  });

  it("accepts absence of TRUSTED_PROXY (optional — defaults to undefined)", () => {
    const result = envSchema.safeParse(BASE_REQUIRED);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.TRUSTED_PROXY).toBeUndefined();
    }
  });

  it("accepts arbitrary string value (no enum constraint)", () => {
    // The schema declares TRUSTED_PROXY as z.string().optional() — any
    // string is valid. The route handler interprets === "true" specially,
    // but the schema itself is permissive (documented behavior).
    const result = envSchema.safeParse({
      ...BASE_REQUIRED,
      TRUSTED_PROXY: "yes",
    });
    expect(result.success).toBe(true);
  });
});
