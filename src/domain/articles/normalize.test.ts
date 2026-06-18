import { describe, it, expect } from "vitest";
import { normalizeCanonicalUrl, hashContent } from "./normalize";

describe("normalizeCanonicalUrl", () => {
  it("removes UTM parameters", () => {
    const url =
      "https://example.com/article?utm_source=newsletter&utm_medium=email";
    expect(normalizeCanonicalUrl(url)).toBe("https://example.com/article");
  });

  it("lower-cases scheme and host", () => {
    const url = "HTTPS://Example.COM/Article";
    expect(normalizeCanonicalUrl(url)).toBe("https://example.com/Article");
  });

  it("normalizes trailing slash", () => {
    // URL.toString() always includes the trailing slash when path is "/"
    // This is correct browser behavior; we normalize by not adding extra slashes
    const url = "https://example.com/";
    expect(normalizeCanonicalUrl(url)).toBe("https://example.com/");
  });

  it("preserves path and non-UTM query params", () => {
    const url = "https://example.com/article?page=2";
    expect(normalizeCanonicalUrl(url)).toBe("https://example.com/article?page=2");
  });

  it("returns invalid URL as-is", () => {
    const url = "not-a-valid-url";
    expect(normalizeCanonicalUrl(url)).toBe("not-a-valid-url");
  });
});

describe("hashContent", () => {
  it("produces consistent hash for same input", () => {
    const title = "Test Article";
    const date = new Date("2024-06-01T00:00:00Z");
    const hash1 = hashContent(title, date);
    const hash2 = hashContent(title, date);
    expect(hash1).toBe(hash2);
  });

  it("produces different hash for different input", () => {
    const hash1 = hashContent("Article A", new Date("2024-06-01T00:00:00Z"));
    const hash2 = hashContent("Article B", new Date("2024-06-01T00:00:00Z"));
    expect(hash1).not.toBe(hash2);
  });

  it("produces 64-character hex string (SHA-256)", () => {
    const hash = hashContent("Test", new Date());
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces deterministic SHA-256 hash for known input (per PAD §7.1)", () => {
    // SHA-256 of "Test Article|2024-06-01T00:00:00.000Z"
    // Computed via: printf 'Test Article|2024-06-01T00:00:00.000Z' | sha256sum
    const expected =
      "28f1f63411b395c72759c15a19845a4eeadb025f23d2a901e4c6fee87d137c41";
    const hash = hashContent("Test Article", new Date("2024-06-01T00:00:00Z"));
    expect(hash).toBe(expected);
  });

  it("is collision-resistant — small input change produces different hash", () => {
    const date = new Date("2024-06-01T00:00:00Z");
    const hash1 = hashContent("Test Article", date);
    const hash2 = hashContent("Test Article.", date); // added period
    expect(hash1).not.toBe(hash2);
  });

  it("trims title before hashing", () => {
    const date = new Date("2024-06-01T00:00:00Z");
    const hash1 = hashContent("Test Article", date);
    const hash2 = hashContent("  Test Article  ", date);
    expect(hash1).toBe(hash2);
  });
});
