import { z } from "zod";

/**
 * Environment variable validation schema.
 * All environment variables used by the application MUST be declared here.
 * This ensures the app fails fast with a clear error if any required
 * variable is missing or invalid.
 */
export const envSchema = z.object({
  // ── Database ────────────────────────────────────────────────────────────
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .refine(
      (val) => val.startsWith("postgres://") || val.startsWith("postgresql://"),
      "DATABASE_URL must start with postgres:// or postgresql://"
    ),

  // ── Redis (BullMQ) ──────────────────────────────────────────────────────
  REDIS_URL: z
    .string()
    .min(1, "REDIS_URL is required")
    .refine(
      (val) => val.startsWith("redis://"),
      "REDIS_URL must start with redis://"
    ),

  // ── Auth.js ─────────────────────────────────────────────────────────────
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters"),
  AUTH_URL: z.string().min(1, "AUTH_URL is required"),

  // ── AI Providers ────────────────────────────────────────────────────────
  ANTHROPIC_API_KEY: z
    .string()
    .min(1, "ANTHROPIC_API_KEY is required")
    .refine(
      (val) => val.startsWith("sk-ant-"),
      "ANTHROPIC_API_KEY must start with sk-ant-"
    ),
  OPENAI_API_KEY: z
    .string()
    .min(1, "OPENAI_API_KEY is required")
    .refine(
      (val) => val.startsWith("sk-"),
      "OPENAI_API_KEY must start with sk-"
    ),

  // ── Push Notifications ──────────────────────────────────────────────────
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(1),
  VAPID_PRIVATE_KEY: z.string().min(1),
  VAPID_SUBJECT: z.string().min(1),

  // ── Push Key Encryption ─────────────────────────────────────────────────
  PUSH_KEY_ENCRYPTION_KEY: z
    .string()
    .length(64, "PUSH_KEY_ENCRYPTION_KEY must be exactly 64 hex characters")
    .refine(
      (val) => /^[0-9a-fA-F]{64}$/.test(val),
      "PUSH_KEY_ENCRYPTION_KEY must be 64 hex characters"
    ),

  // ── Node Environment ────────────────────────────────────────────────────
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables at module load time.
 * Throws a descriptive error if any required variable is missing/invalid.
 */
function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues;
    const messages = issues.map((issue) => {
      const path = issue.path.join(".");
      return `  - ${path}: ${issue.message}`;
    });

    const errorMessage = [
      "Environment variable validation failed:",
      ...messages,
      "", // Empty line for readability
      "Please check your .env file and ensure all required variables are set.",
    ].join("\n");

    throw new Error(errorMessage);
  }

  return parsed.data;
}

/** Exported validated environment variables. Import from here, not process.env. */
export const env = validateEnv();
