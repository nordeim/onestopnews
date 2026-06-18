import type { NextConfig } from "next";

/**
 * next.config.ts — OneStopNews Production Configuration
 * Next.js ≥16.0.7 (initial release: October 21, 2025)
 *
 * SECURITY NOTE: Per MEP v5.1, pin this project to Next.js ≥16.0.7 as mitigation
 * for CVE-2025-55182 (React2Shell RCE) and the associated 13-advisory
 * bundle covering high-severity DoS and SSRF vulnerabilities.
 * (v5.1 corrected the earlier ≥16.2.6 guidance — 16.0.7 is the actual security patch.)
 */
const nextConfig: NextConfig = {
  // ── OUTPUT MODE ─────────────────────────────────────────────────────────
  // "standalone" produces a self-contained .next/standalone/ directory that
  // can be deployed without node_modules (only used deps are bundled). This
  // is the Next.js-recommended pattern for production Docker images and is
  // required by Dockerfile.web.
  output: "standalone",

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
    // NOTE: PRD §5.2 / PAD §5.3 also list `clientSegmentCache: true`,
    // `turbopackPersistentCaching: true`, and `turbopackFileSystemCacheForBuild: true`,
    // but the installed Next.js 16.2.9 does not yet expose these flags in
    // ExperimentalConfig. Re-enable once the upstream type includes them.
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
