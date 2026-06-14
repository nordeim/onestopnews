/**
 * normalize.ts — Pure domain functions for article normalization.
 *
 * PAD §5.6: "Pure functions – zero Next.js or DB imports."
 */

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
 * Creates a content hash from title + publishedAt for change detection.
 * Uses a simple string concatenation + hash approach.
 */
export function hashContent(title: string, publishedAt: Date): string {
  const data = `${title.trim()}|${publishedAt.toISOString()}`;
  // Simple hash function (FNV-1a like) for client-side usage
  let hash = 2166136261;
  for (let i = 0; i < data.length; i++) {
    hash ^= data.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
