import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { buildProviders } from "./providers";

/**
 * Helper: extract the `id` from each provider safely.
 *
 * Auth.js v5's `Provider` type is a union of (a) configured provider objects
 * (which have `id`) and (b) a function form (which doesn't). At runtime,
 * `buildProviders()` always returns configured objects, so this narrowing is
 * safe. We use `'id' in p` to satisfy TypeScript's narrowing rules.
 */
function providerIds(providers: ReturnType<typeof buildProviders>): string[] {
  return providers.map((p) => ("id" in p ? p.id : "unknown"));
}

describe("buildProviders", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset OAuth env vars before each test
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GITHUB_CLIENT_ID;
    delete process.env.GITHUB_CLIENT_SECRET;
  });

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv };
  });

  it("returns only the credentials provider when no OAuth env vars are set", () => {
    const providers = buildProviders();
    expect(providers).toHaveLength(1);
    expect(providerIds(providers)[0]).toBe("credentials");
  });

  it("includes Google provider when GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set", () => {
    process.env.GOOGLE_CLIENT_ID = "google-id-123";
    process.env.GOOGLE_CLIENT_SECRET = "google-secret-456";

    const providers = buildProviders();
    const ids = providerIds(providers);
    expect(ids).toContain("credentials");
    expect(ids).toContain("google");
  });

  it("includes GitHub provider when GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are set", () => {
    process.env.GITHUB_CLIENT_ID = "github-id-123";
    process.env.GITHUB_CLIENT_SECRET = "github-secret-456";

    const providers = buildProviders();
    const ids = providerIds(providers);
    expect(ids).toContain("credentials");
    expect(ids).toContain("github");
  });

  it("includes all three providers when all OAuth env vars are set", () => {
    process.env.GOOGLE_CLIENT_ID = "google-id-123";
    process.env.GOOGLE_CLIENT_SECRET = "google-secret-456";
    process.env.GITHUB_CLIENT_ID = "github-id-123";
    process.env.GITHUB_CLIENT_SECRET = "github-secret-456";

    const providers = buildProviders();
    const ids = providerIds(providers).sort();
    expect(ids).toEqual(["credentials", "github", "google"]);
  });

  it("does NOT include Google provider if only GOOGLE_CLIENT_ID is set (missing secret)", () => {
    process.env.GOOGLE_CLIENT_ID = "google-id-123";
    // GOOGLE_CLIENT_SECRET intentionally not set

    const providers = buildProviders();
    const ids = providerIds(providers);
    expect(ids).not.toContain("google");
    expect(ids).toContain("credentials");
  });

  it("does NOT include GitHub provider if only GITHUB_CLIENT_SECRET is set (missing id)", () => {
    // GITHUB_CLIENT_ID intentionally not set
    process.env.GITHUB_CLIENT_SECRET = "github-secret-456";

    const providers = buildProviders();
    const ids = providerIds(providers);
    expect(ids).not.toContain("github");
    expect(ids).toContain("credentials");
  });
});
