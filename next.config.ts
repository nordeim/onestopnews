import type { NextConfig } from "next";

/**
 * next.config.ts — OneStopNews Production Configuration
 * Next.js ≥16.2.6 (initial release: October 21, 2025)
 *
 * SECURITY NOTE: Pin this project to Next.js ≥16.2.6 as mitigation
 * for CVE-2025-55182 (React2Shell RCE) and the associated 13-advisory
 * bundle shipped in 16.2.6 covering high-severity DoS and SSRF vulnerabilities.
 */
const nextConfig: NextConfig = {
  // ── CACHE COMPONENTS ───────────────────────────────────────────────────
  // TOP-LEVEL flag. Enables Cache Components ("use cache" directive), PPR,
  // and opt-in caching model. Replaces ALL of: experimental.ppr + dynamicIO.
  cacheComponents: true,

  // ── NAMED CACHE LIFE PROFILES ───────────────────────────────────────────
  // TOP-LEVEL alongside cacheComponents. MUST be defined here before any
  // cacheLife('profileName') call works — runtime error if profile is missing.
  cacheLife: {
    // Primary news feed. 30s stale, 120s revalidate, 10-min hard eviction.
    feed: { stale: 30, revalidate: 120, expire: 600 },
    // Topic navigation shell. 5-min stale, 15-min revalidate, 1-day hard eviction.
    topicShell: { stale: 300, revalidate: 900, expire: 86400 },
    // Static reference data. 1-hour stale, daily revalidate, weekly hard eviction.
    reference: { stale: 3600, revalidate: 86400, expire: 604800 },
  },

  // ── TURBOPACK ──────────────────────────────────────────────────────────
  // TOP-LEVEL in Next.js 16 (graduated out of experimental). Default bundler.
  turbopack: {},

  // ── REACT COMPILER ──────────────────────────────────────────────────────
  // TOP-LEVEL in Next.js 16 (promoted from experimental to stable).
  // Disabled by default due to build-time cost. Enable when components follow Rules of React.
  // reactCompiler: true,

  // ── IMAGE OPTIMISATION ──────────────────────────────────────────────────
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24, // 24h minimum CDN TTL for news thumbnails
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
    ],
  },

  // ── EXPERIMENTAL ─────────────────────────────────────────────────────────
  experimental: {
    // VIEW TRANSITIONS: Official docs state "currently experimental and subject to change".
    // All usage MUST go through <PageTransition> abstraction.
    viewTransition: true,
  },

  // ── SECURITY HEADERS ─────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "geolocation=(), microphone=(), camera=()",
          },
        ],
      },
    ];
  },

  // ── CUSTOM REMOTE CACHE HANDLER (Multi-Instance) ────────────────────────
  // UNCOMMENT for multi-instance / horizontally-scaled deployments.
  // Default in-memory cache means each replica maintains its own independent cache.
  // cacheHandler: require.resolve('./src/lib/cache/redis-cache-handler'),
  // cacheMaxMemorySize: 0, // Disable in-memory when using remote handler
};

export default nextConfig;
