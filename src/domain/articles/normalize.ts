/**
 * normalize.ts — Pure domain functions for article normalization.
 *
 * PAD §5.6: "Pure functions – zero Next.js or DB imports."
 */

import { createHash } from "node:crypto";

/**
 * Removes UTM parameters, normalizes trailing slashes, and lowercases the scheme/host.
 * Used for deduplication via canonical URL.
 */
export function normalizeCanonicalUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove all UTM parameters
    const utmKeys: string[] = [];
    parsed.searchParams.forEach((_, key) => {
      if (key.startsWith("utm_")) {
        utmKeys.push(key);
      }
    });
    for (const key of utmKeys) {
      parsed.searchParams.delete(key);
    }
    // Remove empty search (removes trailing ?)
    if (parsed.searchParams.toString() === "") {
      parsed.search = "";
    }
    // Lowercase scheme and host
    parsed.protocol = parsed.protocol.toLowerCase();
    parsed.hostname = parsed.hostname.toLowerCase();
    // Normalize trailing slash on root path
    if (parsed.pathname === "/") {
      parsed.pathname = "";
    }
    return parsed.toString();
  } catch {
    // If URL is invalid, return as-is (should be caught by Zod before this)
    return url;
  }
}

/**
 * Creates a SHA-256 content hash from title + publishedAt for change detection.
 *
 * Per PAD §7.1: "SHA-256 of title + publishedAt ISO". Used as the
 * `articles.contentHash` value to detect content changes during ingestion
 * upserts (onConflictDoUpdate WHERE content_hash != excluded.content_hash).
 *
 * @param title — Article title (whitespace-trimmed before hashing)
 * @param publishedAt — Article publication date (serialized to ISO 8601)
 * @returns 64-character lowercase hex SHA-256 digest
 */
export function hashContent(title: string, publishedAt: Date): string {
  const data = `${title.trim()}|${publishedAt.toISOString()}`;
  return createHash("sha256").update(data, "utf8").digest("hex");
}
