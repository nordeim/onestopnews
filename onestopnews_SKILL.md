# onestopnews_SKILL.md

> **Complete project knowledge distilled for coding agents.**
> This document is the authoritative reference for replicating the OneStopNews design, architecture, and quality. Every section is code-first — containing exact className patterns, color values, hook implementations, and the debugging rationale behind every resolved issue.
>
> **Project:** OneStopNews — Topic-first news aggregation with source-cited AI summaries
> **Design System:** "Editorial Dispatch"
> **Framework:** Next.js 16 (App Router) + React 19.2 + TypeScript 5.9 (Strict)
> **Last Updated:** June 18, 2026 (Post-Phase 15)
> **Test Suite:** 279 tests across 49 suites + 10 Playwright E2E — all green
> **Quality Gate:** `pnpm check` (tsc --noEmit + ESLint --max-warnings 0) + `pnpm test`

---

## Table of Contents

1. [Project Identity & Design Philosophy](#1-project-identity--design-philosophy)
2. [Tech Stack & Environment](#2-tech-stack--environment)
3. [Bootstrapping & Configuration](#3-bootstrapping--configuration)
4. [The Design System (Code-First)](#4-the-design-system-code-first)
5. [Component Architecture & Patterns](#5-component-architecture--patterns)
6. [Custom Hooks Deep Dive](#6-custom-hooks-deep-dive)
7. [Content Management: RSS Ingestion Pipeline](#7-content-management-rss-ingestion-pipeline)
8. [Accessibility (WCAG AAA) Implementation](#8-accessibility-wcag-aaa-implementation)
9. [Anti-Patterns & Common Bugs](#9-anti-patterns--common-bugs)
10. [Debugging Guide](#10-debugging-guide)
11. [Pre-Ship Checklist](#11-pre-ship-checklist)
12. [Lessons Learnt & How to Avoid Them](#12-lessons-learnt--how-to-avoid-them)
13. [Pitfalls to Avoid](#13-pitfalls-to-avoid)
14. [Best Practices](#14-best-practices)
15. [Coding Patterns](#15-coding-patterns)
16. [Coding Anti-Patterns](#16-coding-anti-patterns)
17. [Responsive Breakpoint Reference](#17-responsive-breakpoint-reference)
18. [Z-Index Layer Map](#18-z-index-layer-map)
19. [Color Reference (Complete)](#19-color-reference-complete)
20. [TypeScript Interface Reference](#20-typescript-interface-reference)

---

## 1. Project Identity & Design Philosophy

### What It Is

OneStopNews is a **topic-first news aggregation platform** that reorganizes public news around *subjects* rather than *publishers*. Every AI-generated summary carries a **3-layer machine-readable provenance disclosure** (JSON-LD + HTTP header + HTML meta tag) for EU AI Act Article 50 compliance.

The platform runs as two processes:
- **Web App** — Next.js 16 App Router, serves the UI + public REST API
- **Worker Service** — Standalone Node.js 24 process running 4 BullMQ workers (ingest, summarize, score, feed-slice)

### The "Editorial Dispatch" Thesis

The visual identity is **not cosmetic — it is architectural**. The design philosophy is:

> **"Wire service terminal meets refined long-read publication. Every element carries the weight of something worth reading. Warmer ink, fresher type, and perfect structural alignment via CSS Subgrid. The dominant emotion: calm authority."**

This is the antithesis of "AI slop" — no purple gradients, no predictable card grids, no safe font pairings.

### Explicit Rejections (Non-Negotiable)

| Rejected | Why | Replacement |
|---|---|---|
| **Inter, Roboto, Space Grotesk** | Generic, overused, no editorial character | Newsreader (serif), Instrument Sans (sans), Commit Mono (mono) |
| **Purple-gradient-on-white** | AI slop cliché | `dispatch-ember` (#c7513f) coral-red accent on `paper-50` (#fafaf8) off-white |
| **Predictable card grids with fixed heights** | Causes layout shift, alignment drift | CSS Subgrid (`grid-rows-subgrid row-span-3`) — rows align across cards without JS |
| **C2PA for text provenance** | No text standard exists; media-only | 3-layer: JSON-LD + HTTP header + HTML meta |
| **`any` in TypeScript** | Breaks strict mode contract | `unknown` + type guards |
| **`enum` / `namespace`** | Compile to runtime IIFE; violate `erasableSyntaxOnly` | String unions + ES modules |
| **`middleware.ts`** | Renamed in Next.js 16 | `proxy.ts` (network boundary, Node.js runtime) |
| **`new Date()` in Server Components** | Causes `next-prerender-current-time` build error | Move to Client Component with `<Suspense>` boundary |

### Three Target Personas

1. **Daily Scanner** — Mobile-first, push notifications with 1-sentence AI summaries, quiet hours
2. **Enterprise Analyst** — Trust-centric, citation-verified summaries, topic grouping, blind-spot detection
3. **Editor/Admin** — BullMQ dashboard, summary review workflow (`needs_review` state machine), source management

### The Meticulous Approach (Mandatory 6-Phase Workflow)

Every implementation MUST follow:

```
ANALYZE → PLAN → VALIDATE → IMPLEMENT → VERIFY → DELIVER
```

- **ANALYZE**: Deep requirement mining. Identify explicit, implicit, edge-case needs.
- **PLAN**: Structured roadmap. Present for explicit user confirmation before coding.
- **VALIDATE**: Obtain user approval. Never proceed without alignment.
- **IMPLEMENT**: Modular, TDD, documented. Library components before custom.
- **VERIFY**: Rigorous QA against success criteria. Edge cases, WCAG AAA, performance.
- **DELIVER**: Complete handoff with instructions and next steps.

**Never write code without completing ANALYZE and PLAN. Never skip VALIDATE.**

### Phase History (Current: Phase 15)

| Phase | Status | Key Deliverable |
|---|---|---|
| 1 — Foundation | COMPLETE | `next.config.ts`, `proxy.ts`, `tsconfig.json`, docker-compose |
| 2 — Database | COMPLETE | Drizzle schema (11 tables: 8 business + 3 Auth.js adapter) |
| 3 — Design System | COMPLETE | Button, Badge, Skeleton, Header, Footer, Masthead, NewsTicker |
| 4 — Core Feed | COMPLETE | FeedGrid, ArticleCard, home/topic/article routes |
| 5 — AI Summarisation | COMPLETE | Zod schema, prompts, 3-layer provenance, NutritionLabel, SummaryPanel |
| 6 — Search, Admin & API | COMPLETE | FTS with `ts_rank_cd`, admin routes, `/api/articles` |
| 7 — Worker Service | COMPLETE | 4 BullMQ workers, scheduler, AES-256-GCM push encryption |
| 8 — Testing & CI/CD | COMPLETE | GitHub Actions, Dockerfiles, Lighthouse CI, Vitest coverage |
| 9 — Blocking Route Fix | COMPLETE | FeedData/FeedSkeleton + key-ed Suspense |
| 10 — Landing Page | COMPLETE | 10-section landing, design tokens, db:seed |
| 11 — SSR Remediation | COMPLETE | `.reveal` animations, `next-prerender-current-time` fix |
| 12 — Tailwind v4 PostCSS | COMPLETE | `@tailwindcss/postcss`, Commit Mono via `next/font/local` |
| 13 — Critical Gaps | COMPLETE | Real RSS parser, real AI SDK, FlowProducer DAG, rate limiting |
| 14 — Validated Gaps | COMPLETE | `hashContent` body, `TRUSTED_PROXY`, `encryptedKeys`, article detail page |
| 15 — Production Readiness | COMPLETE | Dockerfiles (Node 24), Load More, Drop `keys`, OAuth providers |

---

## 2. Tech Stack & Environment

### Exact Installed Versions (Verified via `package.json`)

| Layer | Package | Version | Notes |
|---|---|---|---|
| **Web Framework** | `next` | `^16.2.9` (installed 16.2.9) | Per MEP v5.1, ≥16.0.7 mitigates CVE-2025-55182 |
| **UI Runtime** | `react` / `react-dom` | `^19.2.7` | Stable. View Transitions, `<Activity>` |
| **Language** | `typescript` | `^5.7.0` (installed 5.9.3) | Strict mode + `noUncheckedIndexedAccess` + `erasableSyntaxOnly` + `verbatimModuleSyntax` |
| **Styling** | `tailwindcss` | `latest` (installed 4.3.0) | v4 — CSS-based config via `@theme` |
| **PostCSS** | `@tailwindcss/postcss` | `^4.3.1` | **MANDATORY** — without this, zero utility classes generate |
| **Components** | `@radix-ui/react-dialog`, `react-accordion`, `react-slot` | `^1.1.16`, `^1.2.14`, `^1.2.5` | Accessible primitives, wrapped for bespoke aesthetic |
| **Class Variance** | `class-variance-authority` | `latest` | For `Button` variants |
| **Class Merge** | `clsx` + `tailwind-merge` | `latest` | `cn()` utility |
| **ORM** | `drizzle-orm` + `drizzle-kit` | `latest` | TypeScript-native, SQL-fluent |
| **DB Driver** | `postgres` (postgres.js) | `latest` | **NOT `pg`** — enables lazy proxy connection |
| **Database** | PostgreSQL | 17 | GIN FTS + `ts_rank_cd` BM25 |
| **Validation** | `zod` | `latest` | Schema-first, composable. Enforces AI output constraints |
| **Auth** | `next-auth` | `5.0.0-beta.31` | Pinned exact beta. HttpOnly cookies, Drizzle adapter |
| **Auth Adapter** | `@auth/drizzle-adapter` | `^1.11.2` | Aligns with `@auth/core@0.41.2` |
| **Job Queue** | `bullmq` | `latest` | Job graphs (Flows via `FlowProducer`), priorities |
| **Queue Backend** | `ioredis` | `latest` | Redis client for BullMQ + rate limiting |
| **Cache** | Redis (Upstash) | 7.x | AOF persistence, `noeviction`, `maxRetriesPerRequest: null` |
| **Worker Runtime** | Node.js | 24 LTS ("Krypton") | `engines.node: ">=24.0.0"` |
| **AI SDK** | `ai` + `@ai-sdk/anthropic` + `@ai-sdk/openai` | `latest`, `^3.0.85`, `^3.0.73` | `generateObject()` with Zod schema |
| **AI (Primary)** | Claude 4.5 Haiku | `claude-haiku-4-5` | $1/$5 per M tokens |
| **AI (Fallback)** | GPT-5 Mini | `gpt-5-mini` | Validated cost/quality fallback |
| **RSS Parsing** | `rss-parser` | `^3.13.0` | RSS 2.0 + Atom 1.0. JSON Feed parsed natively |
| **Rate Limiting** | `ioredis` (fixed-window) | `latest` | Redis `INCR` + `EXPIRE`. 20 req/s per IP |
| **Push** | `web-push` | `latest` | VAPID + Web Push API |
| **Push Encryption** | `bcryptjs` (for hashing) + custom AES-256-GCM | `^3.0.3` | `src/lib/security/encrypt.ts` |
| **Timezones** | `luxon` | `latest` | DST-safe quiet hours |
| **Icons** | `lucide-react` | `^1.18.0` | Search icon, etc. |
| **Fonts** | `@fontsource/commit-mono` | `^5.2.5` | Source for woff2 extraction (NOT used at runtime) |
| **Test (Unit)** | `vitest` + `@testing-library/react` + `jsdom` | `latest`, `^16.3.2`, `^29.1.1` | jsdom env, globals enabled |
| **Test (E2E)** | `@playwright/test` | (via `playwright test`) | Chromium/Firefox/WebKit |
| **Lint** | `typescript-eslint` + `eslint` | `^8.61.0` | Flat config, `--max-warnings 0` |
| **Format** | `prettier` + `prettier-plugin-tailwindcss` | `latest` | Tailwind class sorting |
| **Build** | Turbopack | Next.js 16 default | 5–10× faster HMR |
| **Dev Runner** | `tsx` | `latest` | Runs TypeScript worker directly (no compile step) |

### Critical `tsconfig.json` Flags (Verified)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "strict": true,
    "noUncheckedIndexedAccess": true,      // arr[i] returns T | undefined
    "verbatimModuleSyntax": true,           // `import type` required for type-only
    "erasableSyntaxOnly": true,             // No enums, no namespaces, no parameter properties
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "isolatedModules": true,
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "paths": { "@/*": ["./src/*"] },
    "plugins": [{ "name": "next" }]
  },
  "exclude": ["node_modules", ".next", "drizzle", "e2e", "playwright.config.ts"]
}
```

**The 4 strictness flags that catch the most bugs:**

1. **`noUncheckedIndexedAccess: true`** — `arr[0]` returns `T | undefined`, forcing null checks. Catches off-by-one errors at compile time.
2. **`erasableSyntaxOnly: true`** — Forbids `enum`, `namespace`, parameter properties. These compile to runtime IIFEs/closures that aren't tree-shakeable. Use string unions (`type Status = "active" | "inactive"`) and ES modules instead.
3. **`verbatimModuleSyntax: true`** — Requires `import type` for type-only imports. Prevents runtime imports of types that don't exist at runtime.
4. **`strict: true`** — Enables `strictNullChecks`, `noImplicitAny`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noImplicitOverride` all at once.

### Environment Variables (15 total, Zod-validated at module load)

**Required (11):**
- `DATABASE_URL` — must start with `postgres://` or `postgresql://`
- `REDIS_URL` — must start with `redis://`
- `AUTH_SECRET` — min 32 chars
- `AUTH_URL` — app canonical URL
- `ANTHROPIC_API_KEY` — must start with `sk-ant-`
- `OPENAI_API_KEY` — must start with `sk-`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` — e.g., `mailto:admin@onestopnews.com`
- `PUSH_KEY_ENCRYPTION_KEY` — exactly 64 hex chars (32-byte AES key)
- `NODE_ENV` — `development` | `production` | `test`

**Optional (4, Phase 15 OAuth):**
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` — enable Google OAuth when both present
- `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` — enable GitHub OAuth when both present

**Optional (1, Phase 14 rate limiter):**
- `TRUSTED_PROXY` — set to `"true"` when behind CDN/proxy to use rightmost `x-forwarded-for` IP

**Validation pattern:** `src/lib/env/index.ts` — Zod schema validates at module load. App fails fast with descriptive error listing all missing/invalid vars. **All consuming code imports from `@/lib/env`, never `process.env` directly.**

### Key Commands (Verified via `package.json`)

```bash
pnpm dev          # Next.js dev server with Turbopack
pnpm worker       # Worker service (tsx src/workers/index.ts)
pnpm build        # Production build (requires DB + Redis for prerender)
pnpm start        # Production server (next start)
pnpm check        # tsc --noEmit && pnpm lint (PRE-COMMIT GATE)
pnpm lint         # ESLint --max-warnings 0
pnpm test         # vitest run (279 tests, ~13s)
pnpm test:watch   # vitest watch mode
pnpm test:e2e     # playwright test (10 E2E tests)
pnpm db:generate  # drizzle-kit generate (create migration from schema)
pnpm db:migrate   # drizzle-kit migrate (apply migrations)
pnpm db:seed      # tsx src/lib/db/seed.ts (idempotent: 7 categories, 7 sources, 30 articles)
pnpm db:studio    # drizzle-kit studio (DB GUI)
pnpm format       # prettier --write .
pnpm format:check # prettier --check .
```

---

## 3. Bootstrapping & Configuration

### From Zero: Recreating the Project

```bash
# 1. Scaffold Next.js 16 with pnpm
pnpm create next-app@latest onestopnews --typescript --tailwind --app --turbopack --eslint --src-dir --import-alias "@/*"
cd onestopnews

# 2. Install runtime dependencies
pnpm add next-auth@5.0.0-beta.31 @auth/drizzle-adapter drizzle-orm postgres bullmq ioredis \
  ai @ai-sdk/anthropic @ai-sdk/openai @anthropic-ai/sdk openai zod luxon \
  web-push bcryptjs rss-parser \
  @radix-ui/react-dialog @radix-ui/react-accordion @radix-ui/react-slot \
  class-variance-authority clsx tailwind-merge lucide-react

# 3. Install dev dependencies
pnpm add -D @tailwindcss/postcss@^4.3.1 drizzle-kit tsx \
  vitest @testing-library/react @testing-library/jest-dom @testing-library/dom jsdom \
  typescript-eslint @types/luxon @types/web-push @types/bcryptjs \
  prettier prettier-plugin-tailwindcss @fontsource/commit-mono

# 4. Set up infrastructure
docker compose up -d  # PostgreSQL 17 + Redis 7 (use docker-compose-dev.yml)

# 5. Configure environment
cp .env.example .env.local
# Edit .env.local with real values (DATABASE_URL, REDIS_URL, AUTH_SECRET, API keys, VAPID, PUSH_KEY_ENCRYPTION_KEY)

# 6. Apply database migrations + seed
pnpm db:migrate
pnpm db:seed

# 7. Run dev servers (2 terminals)
pnpm dev      # Terminal 1: Next.js
pnpm worker   # Terminal 2: Worker service
```

### Critical Configuration Files (Exact Contents)

#### `next.config.ts` — The 6 Mandatory Top-Level Flags

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. OUTPUT — "standalone" for production Docker (Phase 15)
  output: "standalone",

  // 2. CACHE COMPONENTS — TOP-LEVEL (not inside experimental)
  // Enables "use cache" directive, PPR, opt-in caching. Replaces experimental.ppr + dynamicIO.
  cacheComponents: true,

  // 3. CACHE LIFE PROFILES — TOP-LEVEL. All 3 fields required (stale, revalidate, expire).
  cacheLife: {
    feed: { stale: 30, revalidate: 120, expire: 600 },
    topicShell: { stale: 300, revalidate: 900, expire: 86400 },
    reference: { stale: 3600, revalidate: 86400, expire: 604800 },
  },

  // 4. TURBOPACK — TOP-LEVEL (graduated from experimental in Next.js 16)
  turbopack: {},

  // 5. EXPERIMENTAL — only viewTransition is safe in Next.js 16.2.9
  experimental: {
    viewTransition: true,
    // DO NOT add: clientSegmentCache, turbopackPersistentCaching, turbopackFileSystemCacheForBuild
    // These are NOT in ExperimentalConfig type → TS2353 error
    // DO NOT add: ppr, dynamicIO — removed in Next.js 16, replaced by cacheComponents
  },

  // 6. SECURITY HEADERS
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
      ],
    }];
  },

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24,
    remotePatterns: [{ protocol: "https", hostname: "picsum.photos", pathname: "/**" }],
  },
};

export default nextConfig;
```

**The 6 flags that silently break if misplaced:**

| Flag | Wrong Placement | Symptom | Correct Placement |
|---|---|---|---|
| `cacheComponents: true` | Inside `experimental` | Every `"use cache"` silently ignored | **Top-level** |
| `cacheLife: {...}` | Inside `experimental` | `cacheLife('feed')` throws runtime | **Top-level** |
| `turbopack: {}` | Inside `experimental` | Ignored or config warning | **Top-level** |
| `output: "standalone"` | Inside `experimental` | `.next/standalone/` not generated | **Top-level** |
| `experimental.viewTransition` | Top-level | Transitions silently disabled | **Inside `experimental`** |
| `experimental.ppr` / `dynamicIO` | Anywhere | **Build error** — removed in Next.js 16 | **DO NOT INCLUDE** |

#### `proxy.ts` — Network Boundary (Layer 0)

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./src/lib/auth";

// Next.js 16 renames middleware.ts → proxy.ts
// Runs on Node.js runtime (NOT Edge). Cookie check + redirect ONLY.
// CRITICAL: Zero DB calls. Zero business logic. Real auth lives in verifySession() at DAL.
export default async function proxy(request: NextRequest) {
  const session = await auth();
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");

  if (isAdminRoute && !session) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Broad matcher — intercepts all routes except static assets
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

#### `postcss.config.mjs` — Mandatory for Tailwind v4

```javascript
// Without this file, Tailwind v4 generates ZERO utility classes.
// Symptom: compiled CSS is ~16KB (only @theme custom properties), no class selectors.
export default { plugins: { "@tailwindcss/postcss": {} } };
```

#### `drizzle.config.ts`

```typescript
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
} satisfies Config;
```

#### `vitest.config.ts` — E2E Exclusion

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    // CRITICAL: Exclude Playwright E2E tests — they import @playwright/test
    // which isn't installed in the vitest env → import errors
    exclude: ["node_modules/", "dist/", "backup/", "plans/", "e2e/**", "playwright.config.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 },
      exclude: ["node_modules/", "dist/", "*.config.*", "*.d.ts", "src/test/**", "e2e/**"],
    },
    setupFiles: ["./src/test/setup.ts"],
  },
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
});
```

#### `eslint.config.mjs` — Flat Config

```javascript
import tseslint from "typescript-eslint";

export default [
  { ignores: [".next/**", "node_modules/**", "drizzle/**", "dist/**", "e2e/**", "playwright.config.ts"] },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: { parser: tseslint.parser },
    plugins: { "@typescript-eslint": tseslint.plugin },
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "warn",  // warn, not error (Auth.js adapter needs `as any`)
    },
  },
];
```

#### `src/test/setup.ts` — Direct Assignment (NOT `??=`)

```typescript
import { beforeAll, afterAll } from "vitest";

// CRITICAL: Use direct assignment (=), NOT nullish coalescing (??=).
// Shell env may contain values that fail Zod schema (e.g., SQLite DATABASE_URL).
// Direct assignment always overrides.
process.env.DATABASE_URL = "postgres://test:test@localhost:5432/test?sslmode=disable";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.AUTH_SECRET = "test-secret-at-least-32-characters-long-xxx";
process.env.AUTH_URL = "http://localhost:3000";
process.env.ANTHROPIC_API_KEY = "sk-ant-test-dummy-key";
process.env.OPENAI_API_KEY = "sk-test-dummy-key";
process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "test-vapid-public-key";
process.env.VAPID_PRIVATE_KEY = "test-vapid-private-key";
process.env.VAPID_SUBJECT = "mailto:test@onestopnews.com";
process.env.PUSH_KEY_ENCRYPTION_KEY = "0".repeat(64);
// Phase 15: OAuth env vars (optional in schema, but set for test isolation)
process.env.GOOGLE_CLIENT_ID = "test-google-client-id";
process.env.GOOGLE_CLIENT_SECRET = "test-google-client-secret";
process.env.GITHUB_CLIENT_ID = "test-github-client-id";
process.env.GITHUB_CLIENT_SECRET = "test-github-client-secret";
// NOTE: NODE_ENV is set by vitest to "test" — don't set manually (read-only per @types/node)

beforeAll(() => { console.log("Test suite starting..."); });
afterAll(() => { console.log("Test suite complete."); });
```

---

## 4. The Design System (Code-First)

### Typography Hierarchy (3 Typefaces, Each with a Job)

| Role | Typeface | Weight | CSS Variable | Tailwind Class | Usage |
|---|---|---|---|---|---|
| **Headlines** | Newsreader (variable serif) | 800 | `--font-editorial` | `font-editorial` | Article titles, section headings, masthead wordmark |
| **UI / Body** | Instrument Sans (variable sans) | 400–600 | `--font-ui` | `font-ui` | Body text, buttons, nav, form labels |
| **Metadata** | Commit Mono | 400 | `--font-mono` | `font-mono` | Timestamps, category labels, technical metadata |

**Font Loading (`src/app/layout.tsx`):**

```tsx
import { Newsreader, Instrument_Sans } from "next/font/google";
import localFont from "next/font/local";

const newsreader = Newsreader({
  variable: "--font-editorial",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Commit Mono is NOT on Google Fonts — must use next/font/local
const commitMono = localFont({
  src: "../../public/fonts/commit-mono-400.woff2",
  variable: "--font-mono",
  weight: "400",
  style: "normal",
  display: "swap",
});

// Apply all 3 variables to <html>
<html lang="en" className={`${newsreader.variable} ${instrumentSans.variable} ${commitMono.variable}`} suppressHydrationWarning>
  <body className="bg-paper-50 text-ink-600 font-ui antialiased">
```

**Commit Mono woff2 extraction (one-time):**

```bash
pnpm add -D @fontsource/commit-mono@5.2.5
cp node_modules/@fontsource/commit-mono/files/commit-mono-400-normal.woff2 public/fonts/commit-mono-400.woff2
```

### The `.font-editorial` Enhancement Block (globals.css)

```css
.font-editorial {
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
  text-rendering: optimizeLegibility;
  font-feature-settings: "ss01", "ss02";
}
```

**Redundancy rule:** Since `.font-editorial` bakes in weight 800, leading 1.1, and tracking -0.02em, do NOT add `font-[800]`, `leading-tight`, or `tracking-[-0.02em]` alongside it. Only add overrides for different values (e.g., `tracking-[-0.03em]` for the masthead wordmark, `font-[700]` for accordion questions, `leading-[1.05]` for section heads).

### Complete `@theme` Block (globals.css — exact tokens)

```css
@import "tailwindcss";

@theme {
  /* ── Ink Scale (Warm Grays) ─────────────────────────────── */
  --color-ink-900: #1a1a18;  /* Headings, letterpress black — 16.8:1 on paper-50 (AAA) */
  --color-ink-700: #2a2a27;  /* Secondary headings — 12.5:1 (AAA) */
  --color-ink-600: #3d3d3a;  /* Body text — 9.5:1 (AAA) */
  --color-ink-500: #525250;  /* Muted body — 6.9:1 (AA) */
  --color-ink-400: #6b6b68;  /* Placeholder, icons — 4.6:1 (AA) */
  --color-ink-300: #8a8a83;  /* Metadata, dividers (large text only) — 3.2:1 (AA large) */
  --color-ink-100: #e8e8e4;  /* Borders, scrollbar thumb */

  /* ── Paper Scale (Off-White Newsprint) ──────────────────── */
  --color-paper-50: #fafaf8;   /* Page background (primary) */
  --color-paper-100: #f2f2ee;  /* Card surface, hover bg */
  --color-paper-200: #e6e4de;  /* Borders, subtle dividers */
  --color-paper-300: #d8d4cc;  /* Stronger borders */

  /* ── Dispatch Brand Accents ─────────────────────────────── */
  --color-dispatch-ember: #c7513f;        /* Breaking news, AI badge, focus rings, primary CTA */
  --color-dispatch-ember-light: #fde8e4;
  --color-dispatch-sage: #6b8f71;         /* Finance, positive indicators */
  --color-dispatch-sage-light: #e4ede5;
  --color-dispatch-slate: #5a6b7a;        /* Tech, neutral accents */
  --color-dispatch-slate-light: #e2e7ec;
  --color-dispatch-clay: #8b6d5a;         /* Local, politics */
  --color-dispatch-clay-light: #ede5df;
  --color-dispatch-violet: #7a6b8f;       /* Culture, creative */
  --color-dispatch-violet-light: #e8e4ef;

  /* ── Typography Stack ── */
  --font-editorial: "Newsreader", Georgia, "Times New Roman", serif;
  --font-ui: "Instrument Sans", system-ui, -apple-system, sans-serif;
  --font-mono: "Commit Mono", ui-monospace, "Fira Code", monospace;
}
```

### Custom Utility Classes (globals.css)

```css
/* ── WCAG AAA Focus States ────────────────────────────────── */
:focus-visible {
  outline: 2px solid var(--color-dispatch-ember);
  outline-offset: 2px;
  border-radius: 2px;
}

/* ── Reduced Motion: Disable ALL animations ───────────────── */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0ms !important;
    transition-duration: 0ms !important;
  }
}

/* ── Scroll Progress (CSS-only, animation-timeline: scroll()) ── */
.scroll-progress {
  position: fixed; top: 0; left: 0; width: 100%; height: 2px;
  background: var(--color-dispatch-ember);
  transform-origin: left;
  animation: scroll-progress linear;
  animation-timeline: scroll();
  z-index: 999; pointer-events: none;
}
@keyframes scroll-progress {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

/* ── Ticker Animation (NewsTicker marquee) ────────────────── */
@keyframes ticker-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.ticker-track { animation: ticker-scroll 80s linear infinite; }
.ticker-track:hover { animation-play-state: paused; }

/* ── Live Pulse Dot ────────────────────────────────────────── */
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.25; }
}
.pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }

/* ── Nutrition Label (AI transparency panel) ──────────────── */
.nutrition-label {
  border-left: 3px solid var(--color-dispatch-ember);
  background: linear-gradient(to right, var(--color-paper-100) 0%, var(--color-paper-50) 100%);
}

/* ── Category Label (metadata tags) ───────────────────────── */
.cat-label {
  font-family: var(--font-mono);
  font-variant: all-small-caps;
  letter-spacing: 0.12em;
}
.cat-label-wide {
  font-family: var(--font-mono);
  font-variant: all-small-caps;
  letter-spacing: 0.25em;
}

/* ── Reveal Animations (IntersectionObserver-driven) ──────── */
.reveal { opacity: 0; transform: translateY(24px); transition: opacity 700ms cubic-bezier(0.4, 0, 0.2, 1), transform 700ms cubic-bezier(0.4, 0, 0.2, 1); }
.reveal.visible { opacity: 1; transform: translateY(0); }
.reveal-delay-1 { transition-delay: 80ms; }
.reveal-delay-2 { transition-delay: 160ms; }
.reveal-delay-3 { transition-delay: 240ms; }
.reveal-delay-4 { transition-delay: 320ms; }

@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; transition: none; }
  .reveal-delay-1, .reveal-delay-2, .reveal-delay-3, .reveal-delay-4 { transition-delay: 0ms; }
}

/* ── Scrollbar Styling ─────────────────────────────────────── */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--color-paper-50); }
::-webkit-scrollbar-thumb { background: var(--color-ink-100); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--color-ink-300); }
html { scrollbar-width: thin; scrollbar-color: var(--color-ink-100) var(--color-paper-50); }

/* ── Category Nav — Hidden Scrollbar ──────────────────────── */
.category-nav { scrollbar-width: none; -ms-overflow-style: none; }
.category-nav::-webkit-scrollbar { display: none; }

/* ── Accordion Animations (Radix) ─────────────────────────── */
@keyframes slideDown { from { height: 0; } to { height: var(--radix-accordion-content-height); } }
@keyframes slideUp { from { height: var(--radix-accordion-content-height); } to { height: 0; } }
.animate-slideDown { animation: slideDown 300ms cubic-bezier(0.87, 0, 0.13, 1); }
.animate-slideUp { animation: slideUp 300ms cubic-bezier(0.87, 0, 0.13, 1); }
```

### CSS Subgrid Feed Architecture (PRD §4.3)

**Parent defines columns with `gap-x` only (NO `gap-y`):**

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8" role="feed" aria-label="News articles">
  {articles.map((article) => (
    <ArticleCard key={article.id} article={article} />
  ))}
</div>
```

**Each `ArticleCard` spans 3 row tracks via `row-span-3`:**

```tsx
<article className="group relative grid grid-rows-subgrid row-span-3 gap-y-3 mb-10 last:mb-0 border-b border-ink-100 pb-6 transition-colors duration-300 hover:bg-paper-100/50">
  {/* Row 1: Headline */}
  <h3 className="font-editorial text-xl leading-tight text-ink-900 group-hover:text-dispatch-ember transition-colors duration-300">
    ...
  </h3>
  {/* Row 2: Excerpt */}
  <p className="font-ui text-sm leading-relaxed text-ink-600 line-clamp-3">...</p>
  {/* Row 3: Metadata */}
  <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-ink-600 mt-auto">
    ...
  </div>
</article>
```

**Why subgrid:** Headlines, excerpts, and metadata rows align across every card in a visual row — no fixed heights, no JavaScript measurement. The `last:mb-0` removes bottom margin on the last card to prevent footer spacing issues.

### Category Color Mapping (Header.tsx)

```tsx
export const CATEGORIES = [
  { slug: "top-stories",  name: "Top Stories",  colourClass: "bg-dispatch-ember",  activeBorder: "border-dispatch-ember" },
  { slug: "local",        name: "Local",        colourClass: "bg-dispatch-clay",   activeBorder: "border-dispatch-clay" },
  { slug: "tech",         name: "Tech",         colourClass: "bg-dispatch-slate",  activeBorder: "border-dispatch-slate" },
  { slug: "global",       name: "Global",       colourClass: "bg-dispatch-slate",  activeBorder: "border-dispatch-slate" },
  { slug: "finance",      name: "Finance",      colourClass: "bg-dispatch-sage",   activeBorder: "border-dispatch-sage" },
  { slug: "politics",     name: "Politics",     colourClass: "bg-dispatch-clay",   activeBorder: "border-dispatch-clay" },
  { slug: "culture",      name: "Culture",      colourClass: "bg-dispatch-violet", activeBorder: "border-dispatch-violet" },
];
```

---

## 5. Component Architecture & Patterns

### The 5-Layer Request Model (Golden Rule)

```
Layer 0: proxy.ts           — Cookie check, redirect. NO DB. NO logic.
Layer 1: App Router          — Routes, Metadata, PPR, Suspense. No data fetch in Layouts.
Layer 2: Feature Modules     — UI composition + queries.ts (all DB access) + actions.ts (mutations)
Layer 3: Domain Services     — Pure business logic. No Next.js / DB imports.
Layer 4: Infrastructure      — Drizzle, Auth.js, BullMQ, AI SDK, Env (Zod-validated)
```

**Deviation from this order creates security and consistency bugs.**

### Server Component / Client Component Split Pattern

**Rule:** Server Components by default. Use `'use client'` only for interactivity (state, effects, browser APIs).

**The pagination pattern (Phase 15):**

```tsx
// page.tsx (Server Component) — wraps in Suspense
import { Suspense } from "react";
import { FeedData } from "@/features/feed/components/FeedData";
import { FeedSkeleton } from "@/features/feed/components/FeedSkeleton";

export default function HomePage() {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      <FeedData limit={6} />
    </Suspense>
  );
}

// FeedData.tsx (Server Component) — fetches initial page, passes to client
export async function FeedData({ limit = 6 }: { limit?: number }) {
  const feed = await getFeedArticles({ limit });
  return (
    <FeedContainer
      initialArticles={feed.articles}
      initialNextCursor={feed.nextCursor}
      initialHasMore={feed.hasMore}
    />
  );
}

// FeedContainer.tsx ('use client') — manages appended list + load more
"use client";
export function FeedContainer({ initialArticles, initialNextCursor, initialHasMore }) {
  const [articles, setArticles] = useState(initialArticles);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/articles?cursor=${encodeURIComponent(nextCursor)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setArticles((prev) => [...prev, ...data.articles]);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasNextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [nextCursor, isLoading]);

  return (
    <>
      <FeedGrid articles={articles} />
      {error ? <RetryButton onClick={loadMore} /> : <LoadMoreButton hasMore={hasMore} isLoading={isLoading} onClick={loadMore} />}
    </>
  );
}
```

### ArticleCard (Subgrid Child) — Exact Pattern

```tsx
"use client";  // Required because formatTimeAgo() uses new Date()

import Link from "next/link";
import { formatTimeAgo } from "@/shared/lib/utils";
import type { ArticleWithSource } from "@/domain/articles/types";

interface ArticleCardProps {
  article: ArticleWithSource;
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <article className="group relative grid grid-rows-subgrid row-span-3 gap-y-3 mb-10 last:mb-0 border-b border-ink-100 pb-6 transition-colors duration-300 hover:bg-paper-100/50">
      {/* Row 1: Headline — full-card click area via after:absolute after:inset-0 */}
      <h3 className="font-editorial text-xl leading-tight text-ink-900 group-hover:text-dispatch-ember transition-colors duration-300">
        <Link
          href={`/article/${article.id}`}
          className="after:absolute after:inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-dispatch-ember focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50 rounded-sm"
        >
          {article.title}
        </Link>
      </h3>

      {/* Row 2: Excerpt — line-clamp-3, italic fallback when null */}
      <p className="font-ui text-sm leading-relaxed text-ink-600 line-clamp-3">
        {article.excerpt ?? (
          <span className="text-ink-300 italic">No excerpt available.</span>
        )}
      </p>

      {/* Row 3: Metadata — source name, bullet, time, optional AI Brief badge */}
      <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-ink-600 mt-auto">
        <span className="text-dispatch-slate font-medium truncate max-w-[120px]">
          {article.source.name}
        </span>
        <span className="w-1 h-1 rounded-full bg-ink-300 shrink-0" aria-hidden="true" />
        <time
          dateTime={article.publishedAt instanceof Date ? article.publishedAt.toISOString() : String(article.publishedAt)}
          className="shrink-0 tabular-nums"
        >
          {formatTimeAgo(article.publishedAt)}
        </time>
        {article.hasSummary && article.summaryStatus === "ok" && (
          <>
            <span className="w-1 h-1 rounded-full bg-ink-300 shrink-0" aria-hidden="true" />
            <span className="text-dispatch-ember font-medium shrink-0 tracking-widest">AI Brief</span>
          </>
        )}
      </div>
    </article>
  );
}
```

### Button (cva + Radix Slot) — Library Primitive

```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-sm font-ui font-medium text-sm transition-all duration-150 ease-out " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dispatch-ember focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50 " +
  "disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-dispatch-ember text-paper-50 hover:bg-dispatch-ember/90 active:scale-[0.98]",
        secondary: "bg-ink-900 text-paper-50 hover:bg-ink-700 active:scale-[0.98]",
        outline: "border border-ink-100 bg-transparent text-ink-900 hover:bg-paper-100 hover:border-ink-300 active:scale-[0.99]",
        ghost: "bg-transparent text-ink-600 hover:bg-paper-100 hover:text-ink-900",
        destructive: "bg-red-600 text-paper-50 hover:bg-red-700 active:scale-[0.98]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10 p-2",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref as React.Ref<HTMLButtonElement>}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <ButtonSpinner />}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";
```

### SummaryPanel (5-State Machine)

```tsx
// SummaryPanel renders different UI based on summaryStatus:
// "none"        → "Request AI Summary" button (useOptimistic for instant UI)
// "pending"     → "Generating AI summary..." status text (no spinner — minimal)
// "ok"          → <NutritionLabel summary={summary} />
// "needs_review"→ "Summary under editorial review" notice
// "disabled"    → renders null (no UI hint)
```

### SignInClient (Phase 15 OAuth + Credentials)

```tsx
"use client";

import Link from "next/link";
import { Button } from "@/shared/components/ui/Button";

interface SignInClientProps {
  showGoogle: boolean;
  showGithub: boolean;
}

export function SignInClient({ showGoogle, showGithub }: SignInClientProps) {
  return (
    <main className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <header className="text-center mb-10">
          <span className="block w-1.5 h-1.5 rounded-full bg-dispatch-ember mx-auto mb-4" aria-hidden="true" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-300 mb-2">OneStopNews</p>
          <h1 className="font-editorial text-3xl text-ink-900 leading-tight">Sign In</h1>
        </header>

        {/* OAuth buttons — progressive enhancement (works without client JS) */}
        {(showGoogle || showGithub) && (
          <div className="space-y-3 mb-6">
            {showGoogle && (
              <form action="/api/auth/signin/google" method="post">
                <Button type="submit" variant="outline" size="lg" className="w-full" aria-label="Sign in with Google">
                  {/* Google SVG icon */}
                  Sign in with Google
                </Button>
              </form>
            )}
            {showGithub && (
              <form action="/api/auth/signin/github" method="post">
                <Button type="submit" variant="outline" size="lg" className="w-full" aria-label="Sign in with GitHub">
                  {/* GitHub SVG icon */}
                  Sign in with GitHub
                </Button>
              </form>
            )}
          </div>
        )}

        {/* Divider (only if OAuth options exist) */}
        {(showGoogle || showGithub) && (
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-ink-100" /></div>
            <div className="relative flex justify-center">
              <span className="bg-paper-50 px-3 font-mono text-[10px] uppercase tracking-widest text-ink-300">or</span>
            </div>
          </div>
        )}

        {/* Credentials form — POSTs to Auth.js callback */}
        <form action="/api/auth/callback/credentials" method="post" className="space-y-4">
          <div>
            <label htmlFor="email" className="block font-mono text-[10px] uppercase tracking-widest text-ink-600 mb-1.5">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" autoFocus
              className="w-full h-10 px-3 rounded-sm border border-ink-100 bg-paper-50 text-ink-900 font-ui text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-dispatch-ember focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50" />
          </div>
          <div>
            <label htmlFor="password" className="block font-mono text-[10px] uppercase tracking-widest text-ink-600 mb-1.5">Password</label>
            <input id="password" name="password" type="password" required autoComplete="current-password"
              className="w-full h-10 px-3 rounded-sm border border-ink-100 bg-paper-50 text-ink-900 font-ui text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-dispatch-ember focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50" />
          </div>
          <Button type="submit" variant="primary" size="lg" className="w-full" aria-label="Sign in with credentials">
            Sign in with Credentials
          </Button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/" className="font-mono text-[11px] uppercase tracking-widest text-ink-600 hover:text-dispatch-ember transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
```

### Landing Page Component Composition (page.tsx)

```tsx
export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper-50">
      <div className="scroll-progress" aria-hidden="true" />
      <NewsTicker />                    {/* 1. Breaking news ticker */}
      <Masthead />                      {/* 2. Edition bar, wordmark, live badge */}
      <Suspense fallback={null}>
        <Header activeCategory="top-stories" />  {/* 3. Header + category nav */}
      </Suspense>
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
        <LeadStory />                   {/* 4. Hero / 7:5 grid */}
      </section>
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="mb-12">
          <h2 className="font-editorial text-4xl text-ink-900 mb-4">Top Stories</h2>
          <p className="font-ui text-ink-600 text-lg max-w-2xl">The most important stories of the day, summarised by AI with full source citation.</p>
        </section>
        <Suspense fallback={<FeedSkeleton />}>
          <FeedData limit={6} />        {/* 5. Feed (Suspense + Server Component) */}
        </Suspense>
      </main>
      <NutritionLabelDemo />            {/* 6. AI Nutrition Label demo */}
      <StatsSection />                  {/* 7. Trust indicators */}
      <FaqAccordion />                  {/* 8. FAQ accordion */}
      <NewsletterCTA />                 {/* 9. Newsletter signup */}
      <Suspense fallback={null}>
        <Footer />                      {/* 10. Footer (Client Component — uses new Date()) */}
      </Suspense>
    </div>
  );
}
```

### Article Detail Page (Phase 14) — generateMetadata for Provenance

```tsx
// src/app/article/[id]/page.tsx
export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticleWithSummary(id);

  if (!article) {
    return { title: "Article Not Found", description: "The requested article could not be found." };
  }

  const metadata: Metadata = {
    title: article.title,
    description: article.excerpt ?? undefined,
    openGraph: { title: article.title, description: article.excerpt ?? undefined, type: "article", publishedTime: article.publishedAt.toISOString(), authors: [article.source.name] },
    twitter: { card: "summary_large_image", title: article.title, description: article.excerpt ?? undefined },
  };

  // Emit 3-layer provenance when an approved summary exists
  if (article.summary && article.summary.status === "ok") {
    const provenance = generateProvenanceMetadata({
      summary: { summaryText: article.summary.summaryText, keyPoints: article.summary.keyPoints, sourcesCited: article.summary.sourcesCited, aiStatement: article.summary.aiStatement, coveragePercentage: article.summary.coveragePercentage },
      articleId: article.id,
      articleUrl: article.canonicalUrl,
      articleTitle: article.title,
      model: article.summary.model,
      generatedAt: article.summary.generatedAt.toISOString(),
    });

    metadata.other = {
      "ai-provenance": provenance.metaTag,
      "X-AI-Provenance": provenance.httpHeader,
      "json-ld-provenance": provenance.jsonLd,
    };
  }

  return metadata;
}
```

---

## 6. Custom Hooks Deep Dive

### `useDebounce<T>()` — Generic Value Debounce

```typescript
// src/shared/hooks/useDebounce.ts
"use client";

import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

**Usage:** Search input debouncing (`SearchBar.tsx`)

```tsx
const debouncedQuery = useDebounce(query, 300);
useEffect(() => {
  if (debouncedQuery) {
    router.push(`/search?q=${encodeURIComponent(debouncedQuery)}`);
  }
}, [debouncedQuery, router]);
```

**Why generic `<T>`:** Works with any value type — strings, objects, arrays. No need for separate `useDebouncedString`, `useDebouncedObject`, etc.

**Cleanup:** The `useEffect` return clears the timeout on unmount or when `value`/`delay` changes. Prevents stale updates.

### `useReducedMotion()` — WCAG AAA Motion Detection

```typescript
// src/shared/hooks/useReducedMotion.ts
"use client";

import { useState, useEffect } from "react";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    // Check on mount (SSR-safe — window is undefined on server)
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);

    // Listen for changes (user toggles OS setting)
    const onChange = (e: MediaQueryListEvent) => {
      setReduced(e.matches);
    };

    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
```

**Usage pattern:**

```tsx
const prefersReduced = useReducedMotion();

// Skip animation entirely (WCAG AAA: don't just slow it down — disable it)
if (prefersReduced) {
  return <StaticVersion />;
}
return <AnimatedVersion />;
```

**WCAG AAA rule:** When `prefers-reduced-motion: reduce`, **DISABLE all animations entirely**. Do NOT just slow them. The CSS `@media (prefers-reduced-motion: reduce)` block in `globals.css` enforces this globally:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0ms !important;
    transition-duration: 0ms !important;
  }
}
```

### `RevealProvider` — IntersectionObserver Scroll Reveal

```tsx
// src/shared/components/providers/RevealProvider.tsx
"use client";

import { useEffect } from "react";

export function RevealProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Skip if user prefers reduced motion — immediately reveal all
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll(".reveal").forEach((el) => el.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);  // Reveal once, then stop observing
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return <>{children}</>;
}
```

**Usage rule:** Only apply `.reveal` class to **below-the-fold** elements. Above-the-fold elements with `.reveal` cause hydration mismatch (server renders `class="reveal"` invisible, client's `IntersectionObserver` would add `.visible` immediately on mount → mismatch).

### `PageTransition` — View Transitions (Progressive Enhancement)

```tsx
// src/components/primitives/PageTransition.tsx
"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

export function PageTransition({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only intercept clicks if browser supports startViewTransition
    if (typeof document === "undefined" || !document.startViewTransition) {
      return;
    }

    // Skip if user prefers reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      // Only handle internal links
      if (!href || href.startsWith("http") || href.startsWith("#")) return;

      e.preventDefault();
      document.startViewTransition?.(() => {
        router.push(href);
      });
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [router, pathname]);

  return <>{children}</>;
}
```

**Why browser-native, not React-native:** React's `ViewTransition` API is experimental and may change. `document.startViewTransition` is stable (Chrome 115+, Firefox 144+). Graceful degradation: if unsupported, clicks just navigate normally.

---

## 7. Content Management: RSS Ingestion Pipeline

### Architecture Overview

```
RSS/Atom/JSON Feed (50-200+ sources)
        ↓
   [ingest worker] (concurrency 50)
        ↓ fetch + parseFeed()
        ↓ determineContentAvailability()
        ↓ hashContent(title, body, publishedAt) SHA-256
        ↓ db.insert(articles).onConflictDoUpdate() with (xmax = 0) trick
        ↓ enqueuePostIngestFlow() — FlowProducer atomic DAG
        ↓
   [score worker] (concurrency 20) ← children
        ↓ calculateImportanceScore() → float 0.0-1.0
        ↓ db.update(articles.importanceScore)
        ↓
   [feed-slice worker] (concurrency 10) ← parent (runs after all children)
        ↓ publishCacheInvalidation("feed:<categoryId>")
        ↓ Redis pub/sub → web app subscribes → revalidateTag()
```

### `parseFeed()` — RSS/Atom/JSON Parser

```typescript
// src/workers/jobs/parseFeed.ts
import Parser from "rss-parser";

const parser = new Parser({
  customFields: { item: ["content:encoded", "content"] },
});

export interface FeedItem {
  title: string;          // Required — items without title filtered out
  excerpt?: string;
  body?: string;          // Full body (RSS content:encoded, Atom <content>, JSON content_text/html)
  url: string;            // Canonical URL
  publishedAt?: Date;
}

export async function parseFeed(content: string, feedFormat: "rss" | "atom" | "json_api"): Promise<FeedItem[]> {
  if (feedFormat === "json_api") return parseJsonFeed(content);
  return parseXmlFeed(content);
}

async function parseXmlFeed(content: string): Promise<FeedItem[]> {
  try {
    const parsed = await parser.parseString(content);
    const rawItems = (parsed.items ?? []) as unknown as RssParsedItem[];

    // Detect Atom by inspecting raw XML root element (rss-parser's feedType is unreliable)
    const isAtom = /^\s*<\?xml[^>]*\?>\s*<feed[\s>]/i.test(content) || /^\s*<feed[\s>]/i.test(content.trim());

    const items: FeedItem[] = [];
    for (const raw of rawItems) {
      if (!raw.title || raw.title.trim().length === 0) continue;  // Filter: title required
      if (!raw.link) continue;                                     // Filter: URL required

      // Body extraction by feed type:
      //   RSS: only trust content:encoded (explicit full-body extension)
      //   Atom: use the <content> element (rss-parser exposes as `content`)
      const body = isAtom ? raw.content : raw["content:encoded"];
      const cleanBody = body ? stripHtml(body) : undefined;

      // Excerpt extraction by feed type:
      //   RSS 2.0: <description> (rss-parser exposes as contentSnippet, plain-text)
      //   Atom: <summary> (rss-parser exposes as summary)
      const excerpt = isAtom
        ? raw.summary?.trim() || undefined
        : raw.contentSnippet?.trim() || raw.summary?.trim() || undefined;

      const publishedAt = parseDate(raw.isoDate ?? raw.pubDate);

      items.push({
        title: raw.title.trim(),
        excerpt: excerpt && excerpt.length > 0 ? excerpt : undefined,
        body: cleanBody && cleanBody.trim().length > 0 ? cleanBody : undefined,
        url: raw.link,
        publishedAt,
      });
    }

    return items;
  } catch (error) {
    // Malformed XML — return empty array (don't crash the worker)
    console.warn("[parseFeed] XML parse failed:", error);
    return [];
  }
}
```

**`rss-parser` field conflation warning:** `rss-parser` conflates `<content:encoded>`, `<description>`, and `<content>` into its built-in `content` field. You cannot distinguish "body" from "excerpt" using `content` alone. Always read fields explicitly by feed type (as shown above).

### Content Availability Guard (Anti-Hallucination)

```typescript
// src/workers/jobs/determineContentAvailability.ts
// Pure function — classifies articles into 4 tiers:
//   "title_only"    → Title extracted only. DO NOT summarise.
//   "excerpt"       → Title + short excerpt (≤300 chars). DO NOT summarise.
//   "partial_text"  → Title + excerpt + partial body (300-1500 chars). Summarise permitted.
//   "full_text"     → Title + excerpt + full body (>1500 chars). Summarise preferred.

export function determineContentAvailability(input: {
  title: string;
  excerpt?: string;
  body?: string;
}): "title_only" | "excerpt" | "partial_text" | "full_text" {
  if (!input.title) return "title_only";
  if (!input.excerpt && !input.body) return "title_only";
  if (!input.body) return "excerpt";
  if (input.body.length < 500) return "partial_text";
  return "full_text";
}
```

**Enforcement:** The summarize worker checks `contentAvailability` BEFORE calling `callAISummary()`. If `"title_only"` or `"excerpt"`, it returns early with `{ status: "skipped", reason: "insufficient_content" }`. This prevents AI hallucination from insufficient input.

### `hashContent()` — SHA-256 Content Change Detection

```typescript
// src/domain/articles/normalize.ts
import { createHash } from "node:crypto";

export function hashContent(
  title: string,
  body: string | null | undefined,
  publishedAt: Date
): string {
  const data = `${title.trim()}|${body ?? ""}|${publishedAt.toISOString()}`;
  return createHash("sha256").update(data, "utf8").digest("hex");
}
```

**Why body is included (Phase 14 fix):** The original `hashContent(title, publishedAt)` only hashed title + date. If a feed updated an article's body (same title + pubDate, different content), the `contentHash` wouldn't change, and the `onConflictDoUpdate WHERE content_hash != excluded.content_hash` clause would skip the update — silently dropping body edits. Including body ensures content-only updates are detected.

### Upsert with Content Change Detection (PostgreSQL `(xmax = 0)` trick)

```typescript
// src/workers/index.ts (processIngestJob)
const result = await db
  .insert(articles)
  .values({
    sourceId: source.id,
    categoryId: source.categoryId,
    title: item.title,
    excerpt: item.excerpt ?? null,
    body: item.body ?? null,
    canonicalUrl: item.url,
    contentHash,
    contentAvailability,
    publishedAt: item.publishedAt ?? new Date(),
  })
  .onConflictDoUpdate({
    target: articles.canonicalUrl,
    set: {
      title: item.title,
      excerpt: item.excerpt ?? null,
      body: item.body ?? null,
      contentHash,
    },
    where: sql`${articles.contentHash} != excluded.content_hash`,
  })
  .returning({
    id: articles.id,
    isNew: sql<boolean>`(xmax = 0)`,  // true for INSERT, false for UPDATE
  });
```

**`(xmax = 0)` explanation:** PostgreSQL system column `xmax` is 0 for newly inserted rows (no transaction ID to delete) and non-zero for updated rows. Combined with `WHERE content_hash != excluded.content_hash`, this detects:
- `isNew = true` → genuinely new article → enqueue scoring
- `isNew = false` → content changed → enqueue scoring (re-score updated content)
- `isNew = null` (row not returned) → content unchanged → skip scoring

### FlowProducer Atomic DAG

```typescript
// src/lib/queue/flows.ts
import { FlowProducer } from "bullmq";
import { createQueueConnection } from "./index";

let _flowProducer: FlowProducer | null = null;

function getFlowProducer(): FlowProducer {
  if (!_flowProducer) {
    _flowProducer = new FlowProducer({ connection: createQueueConnection() });
  }
  return _flowProducer;  // Singleton — avoid connection churn
}

export async function enqueuePostIngestFlow(input: { newArticleIds: string[]; categoryId: string }): Promise<void> {
  const flowProducer = getFlowProducer();

  // Children: one score-article job per new article (parallel)
  const children = input.newArticleIds.map((articleId) => ({
    name: "score-article",
    queueName: "score",
    data: { articleId },
    opts: { priority: 2 },
  }));

  // Parent: refresh-feed-slice (runs ONLY after all children complete — BullMQ guarantee)
  await flowProducer.add({
    name: "refresh-feed-slice",
    queueName: "feed-slice",
    data: { categoryId: input.categoryId, sort: "latest" },
    opts: { priority: 1 },
    children,
  });
}
```

**Why atomic:** Individual `scoreQueue.add()` calls + separate `publishCacheInvalidation()` were not atomic — cache invalidation could fire before all scoring completed, causing stale feed ordering. The FlowProducer DAG guarantees the parent runs only after ALL children complete.

### AI Summarization (Anthropic + OpenAI Fallback)

```typescript
// src/workers/jobs/summarize.ts
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { summarisationOutputSchema } from "@/features/summaries/lib/summariseSchema";

const PRIMARY_MODEL = "claude-haiku-4-5";
const FALLBACK_MODEL = "gpt-5-mini";
const TEMPERATURE = 0.1;  // Factual-only mode

export async function callAISummary(article: ArticleForSummarization): Promise<SummarizationResult> {
  const content = article.body ?? article.excerpt ?? article.title;
  const messages = buildSummarisationMessages({ content, title: article.title, sourceName: article.sourceName, sourceUrl: article.sourceUrl });

  // Primary: Anthropic Claude 4.5 Haiku
  try {
    const result = await generateObject({
      model: anthropic(PRIMARY_MODEL),
      schema: summarisationOutputSchema,  // Zod-validated output
      messages,
      temperature: TEMPERATURE,
    });

    // Vercel AI SDK v6: result.object (NOT result directly)
    return {
      ...result.object,
      model: PRIMARY_MODEL,
      tokensUsed: result.usage?.totalTokens ?? 0,
    };
  } catch (primaryError) {
    console.warn("[Summarize] Anthropic failed, falling back to OpenAI:", primaryError);
    // Fall through to OpenAI (NO return here — the catch only logs)
  }

  // Fallback: OpenAI GPT-5 Mini (NOT wrapped in try/catch — if this throws, error propagates)
  const result = await generateObject({
    model: openai(FALLBACK_MODEL),
    schema: summarisationOutputSchema,
    messages,
    temperature: TEMPERATURE,
  });

  return {
    ...result.object,
    model: FALLBACK_MODEL,
    tokensUsed: result.usage?.totalTokens ?? 0,
  };
}
```

**Vercel AI SDK v6 gotcha:** `generateObject()` returns `{ object, usage, ... }` — the validated output is in `result.object`, NOT `result` directly. Spreading `result` gives you the full envelope (including `usage`), which you don't want to store in the DB.

### `getSummaryFailureState()` — Permanent Failure Visibility (Phase 14)

```typescript
// src/workers/jobs/summarizeFailure.ts
export interface SummaryFailureState {
  summaryStatus: "none" | "needs_review";
  flagReason: string | null;
}

export function getSummaryFailureState(
  attemptsMade: number,
  maxAttempts: number = 3
): SummaryFailureState {
  // If NOT the final retry, allow BullMQ to retry again
  if (attemptsMade < maxAttempts) {
    return { summaryStatus: "none", flagReason: null };
  }

  // All retries exhausted — set to 'needs_review' for admin visibility
  return {
    summaryStatus: "needs_review",
    flagReason: `AI summarization failed after ${maxAttempts} attempts`,
  };
}
```

**Usage in `processSummarizeJob` catch block:**

```typescript
} catch (error) {
  const attemptsMade = job.attemptsMade ?? 0;
  const maxAttempts = job.opts?.attempts ?? 3;
  const failureState = getSummaryFailureState(attemptsMade, maxAttempts);

  await db
    .update(articles)
    .set({ summaryStatus: failureState.summaryStatus })
    .where(eq(articles.id, articleId));

  console.error(
    `[Summarize] Failed (attempt ${attemptsMade + 1}/${maxAttempts}) for article ${articleId}:`,
    error,
    failureState.flagReason ? `→ Marked as ${failureState.summaryStatus}: ${failureState.flagReason}` : "→ Will retry"
  );

  throw error;  // Re-throw to let BullMQ handle retry/DLQ
}
```

### Cache Invalidation (Singleton Publisher)

```typescript
// src/workers/lib/cacheInvalidation.ts
import { Redis } from "ioredis";
import { env } from "@/lib/env";

let _publisher: Redis | null = null;

function getPublisher(): Redis {
  if (!_publisher) {
    _publisher = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
    });
  }
  return _publisher;  // Singleton — avoids connection churn under 50-worker ingest load
}

export async function publishCacheInvalidation(tag: string): Promise<boolean> {
  try {
    const publisher = getPublisher();
    const channel = `cache:invalidate:${tag}`;
    const message = JSON.stringify({ tag, timestamp: new Date().toISOString() });
    await publisher.publish(channel, message);
    return true;
  } catch (error) {
    console.warn("[CacheInvalidation] Failed to publish invalidation:", error);
    return false;  // Best-effort: don't crash the worker
  }
}
```

**Why singleton:** The original implementation created a new Redis connection per call. Under 50 concurrent ingest workers × N calls, this caused connection churn. The module-level singleton publisher stays alive for the process lifetime.

**Why Redis pub/sub:** Workers run in a separate Node.js process and cannot call `revalidateTag()` (Next.js-only API). Instead, they publish to Redis, and the Next.js app subscribes and calls `revalidateTag()` locally.

---

## 8. Accessibility (WCAG AAA) Implementation

### The 4 Mandatory A11y Patterns

#### 1. Focus Rings (WCAG 2.4.7 — Focus Visible)

```css
/* globals.css — global focus-visible style */
:focus-visible {
  outline: 2px solid var(--color-dispatch-ember);
  outline-offset: 2px;
  border-radius: 2px;
}
```

```tsx
// Component-level focus rings (Button.tsx)
"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dispatch-ember focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50"
```

**Rule:** Every interactive element MUST have a visible focus indicator. Use `focus-visible:` (not `focus:`) so the ring only shows on keyboard navigation, not mouse clicks.

#### 2. Reduced Motion (WCAG 2.3.3 — Animation from Interactions)

```css
/* globals.css — DISABLE all animations, don't slow them */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0ms !important;
    transition-duration: 0ms !important;
  }
}

/* Reveal animations also disabled */
@media (prefers-reduced-motion: reduce) {
  .reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
  .reveal-delay-1, .reveal-delay-2, .reveal-delay-3, .reveal-delay-4 {
    transition-delay: 0ms;
  }
}
```

**Hook for JS-driven animations:**

```tsx
const prefersReduced = useReducedMotion();
if (prefersReduced) return <StaticVersion />;
return <AnimatedVersion />;
```

#### 3. Semantic HTML + ARIA

```tsx
// Feed grid
<div role="feed" aria-label="News articles">
  {articles.map((article) => <ArticleCard key={article.id} article={article} />)}
</div>

// Empty state
<div role="status">
  <p className="font-mono text-[11px] uppercase tracking-widest text-ink-300">No stories in this category yet</p>
</div>

// Error state
<div role="alert" aria-live="polite">
  <p>Failed to load more articles</p>
  <Button>Retry</Button>
</div>

// Navigation
<nav aria-label="Primary navigation">...</nav>
<nav aria-label="Topic categories" role="tablist">...</nav>

// Time elements
<time dateTime={article.publishedAt.toISOString()} className="tabular-nums">
  {formatTimeAgo(article.publishedAt)}
</time>

// AI disclosure
<aside aria-label="AI-generated summary transparency label">...</aside>
```

#### 4. Color Contrast (WCAG 1.4.6 — Contrast Enhanced)

| Foreground | Background | Ratio | Level | Usage |
|---|---|---|---|---|
| `ink-900` (#1a1a18) | `paper-50` (#fafaf8) | 16.8:1 | AAA | Headings |
| `ink-600` (#3d3d3a) | `paper-50` (#fafaf8) | 9.5:1 | AAA | Body text |
| `ink-500` (#525250) | `paper-50` (#fafaf8) | 6.9:1 | AA | Muted text |
| `ink-400` (#6b6b68) | `paper-50` (#fafaf8) | 4.6:1 | AA | Placeholder, icons |
| `ink-300` (#8a8a83) | `paper-50` (#fafaf8) | 3.2:1 | AA large | Metadata (large text only) |
| `dispatch-ember` (#c7513f) | `paper-50` (#fafaf8) | 4.8:1 | AA | Focus rings, AI badge |
| `paper-50` (#fafaf8) | `dispatch-ember` (#c7513f) | 4.8:1 | AA | Button text on ember bg |

**Rule:** Never use `ink-300` for body text — only for large text (≥18px or ≥14px bold) or decorative elements.

### Keyboard Navigation

- **Tab order:** Follows DOM order (no `tabindex` manipulation)
- **Skip link:** (Not yet implemented — future enhancement)
- **Mobile menu:** Radix Dialog traps focus, restores on close
- **Search:** `⌘K` / `Ctrl+K` shortcut to focus search input

### Screen Reader Announcements

- Loading: `aria-busy="true"` on feed container during fetch
- Errors: `role="alert" aria-live="polite"` on error messages
- Empty: `role="status"` on empty state containers
- AI disclosure: `aria-label="AI-generated summary transparency label"` on NutritionLabel

---

## 9. Anti-Patterns & Common Bugs

### TypeScript Anti-Patterns

| Anti-Pattern | Why Forbidden | Fix |
|---|---|---|
| `any` | Breaks strict mode + type inference | `unknown` + type guards |
| `enum` / `namespace` | Compile to runtime IIFE; violate `erasableSyntaxOnly` | String unions + ES modules |
| `as any` without eslint-disable | Triggers `--max-warnings 0` lint failure | Add `// eslint-disable-next-line @typescript-eslint/no-explicit-any` with justification (only for Auth.js adapter) |
| Missing `import type` | Violates `verbatimModuleSyntax` | Use `import type` for type-only imports |
| `arr[i]` returning `T` | Hides undefined access | `noUncheckedIndexedAccess: true` makes it `T \| undefined` |

### Next.js 16 Anti-Patterns

| Anti-Pattern | Symptom | Fix |
|---|---|---|
| `middleware.ts` | Renamed in Next.js 16 | Use `proxy.ts` |
| `experimental.ppr` | Build error — removed | Use `cacheComponents: true` (top-level) |
| `experimental.dynamicIO` | Build error — deprecated | Use `cacheComponents: true` |
| `cacheComponents` inside `experimental` | `"use cache"` silently ignored | Move to top-level |
| `cacheLife` profiles missing `expire` | Runtime throws | All 3 fields required: `stale`, `revalidate`, `expire` |
| `new Date()` in Server Component | `next-prerender-current-time` build error | Move to Client Component with `<Suspense>` |
| `new Date()` in Client Component without Suspense | Prerender still fails | Wrap in `<Suspense fallback={null}>` |
| Direct `await` of DB query in page | `blocking-route` error | Extract to Server Component, wrap in `<Suspense>` |
| `clientSegmentCache` flag | `TS2353` — not in ExperimentalConfig type | Document as deferred; re-enable when upstream type includes it |
| Data fetching in Layout | Causes re-renders | Fetch in Pages only |

### Database Anti-Patterns

| Anti-Pattern | Why Forbidden | Fix |
|---|---|---|
| Eager DB connection | Crashes build when `DATABASE_URL` missing | Lazy Proxy pattern (`src/lib/db/index.ts`) |
| `drizzle-kit push` in production | Overwrites schema without history | `generate` + `migrate` only |
| Raw Drizzle calls in components | Breaks layer model | All queries via `queries.ts` in feature module |
| `as any` with Drizzle `.with()` | Type inference broken for relational queries | Use explicit `.innerJoin()` |
| FNV-1a hash for `contentHash` | 8-char hash not collision-resistant | SHA-256 via `node:crypto` (64-char hex) |
| `hashContent(title, publishedAt)` | Content-only updates silently dropped | Include body: `hashContent(title, body, publishedAt)` |

### Worker Anti-Patterns

| Anti-Pattern | Why Forbidden | Fix |
|---|---|---|
| `revalidateTag()` in workers | Next.js-only API, not in Node.js process | Redis pub/sub for cache invalidation |
| `new Redis()` per cache invalidation | Connection churn under 50 workers | Module-level singleton publisher |
| Individual `scoreQueue.add()` per article | Not atomic; cache invalidation fires before all scoring completes | `enqueuePostIngestFlow()` FlowProducer atomic DAG |
| Summarising `title_only` / `excerpt` | AI hallucination risk | Content availability guard |
| `summaryStatus: "none"` after 3 retries | No observability | `getSummaryFailureState()` → `needs_review` |
| `parseFeed` stub returning `[]` | Ingestion produces zero articles | Real `rss-parser` implementation |

### Auth Anti-Patterns

| Anti-Pattern | Why Forbidden | Fix |
|---|---|---|
| Admin auth in `proxy.ts` | Layer 0 has no DB access | `verifyAdminSession()` in `(admin)/layout.tsx` |
| `throw new Error()` in RSC auth | Triggers full-page error boundary | `redirect('/sign-in')` from `next/navigation` |
| Synchronous `cookies()` access | `TS2339` error; runtime undefined | `(await cookies()).get('key')` |
| Always-on OAuth providers | Auth.js throws at boot if env vars missing | Conditional `buildProviders()` — only include when env vars present |
| Missing `/sign-in` page referenced in `pages.signIn` | Silent 404 at runtime | Create `src/app/sign-in/page.tsx` |

### Design System Anti-Patterns

| Anti-Pattern | Why Forbidden | Fix |
|---|---|---|
| Inter, Roboto, Space Grotesk | Generic, no editorial character | Newsreader, Instrument Sans, Commit Mono |
| Raw hex colors in Tailwind classes | Bypasses design token system | Use design tokens (`bg-ink-900`, `text-paper-50`) |
| `.reveal` on above-the-fold elements | Hydration mismatch (server renders invisible, client adds `.visible`) | Only use `.reveal` for below-the-fold elements |
| Merge artifact in CSS `@theme` | Corrupts entire `@theme` block, all custom colors break | Review CSS diffs after merges; run `pnpm build` before pushing |
| Corrupted className (`font浃着`, `Monad`) | Invalid CSS class silently ignored; element falls back to wrong font | Use `font-mono` consistently; audit className strings after edits |
| `next/font/google` for Commit Mono | Not on Google Fonts | Use `next/font/local` with woff2 file |

### Dockerfile Anti-Patterns (Phase 15)

| Anti-Pattern | Why Forbidden | Fix |
|---|---|---|
| `node:22-alpine` | Violates `engines.node: ">=24.0.0"` | Pin to `node:24-alpine` |
| Missing `output: "standalone"` | Dockerfile.web copies `.next/standalone/` which doesn't exist | Add `output: "standalone"` to `next.config.ts` |
| `worker:build` script reference | Script doesn't exist | Run `tsx src/workers/index.ts` directly |
| Copying non-existent `dist/` | No build step produces `dist/` | Don't compile worker; run from `src/` via `tsx` |
| Malformed lines (`COPY . .RUN`) | Missing newline — Docker parses as single command | Each instruction on its own line |
| Copying `packages/` | Not a monorepo — directory doesn't exist | Remove the `COPY packages/` line |

### Testing Anti-Patterns (Phase 14-15)

| Anti-Pattern | Why Forbidden | Fix |
|---|---|---|
| E2E tests scanned by vitest | `@playwright/test` not installed in vitest env | Exclude `e2e/` + `playwright.config.ts` from vitest config |
| `vi.fn()` for `global.fetch` without `vi.stubGlobal` | Real `fetch` called instead of mock | `vi.stubGlobal("fetch", mockFetch)` in `beforeEach()` |
| `vi.fn(() => mockInstance)` for constructors | `new` on vi.fn returns empty object | Use `class MockX { ... }` in mock factory |
| `??=` for test env vars | Shell env may contain failing values | Direct `=` assignment in `src/test/setup.ts` |
| Hardcoded SHA-256 vector in test | Brittle — fails if delimiter changes | Property-based test: compute expected via `node:crypto` inline |
| Accessing `provider.id` without type narrowing | `Provider` type is a union — `TS2339` | Use `'id' in p ? p.id : "unknown"` narrowing |

---

## 10. Debugging Guide

### Symptom: Build fails with "Environment variable validation failed"

**Cause:** `src/lib/env/index.ts` validates all env vars at module load. Even `pnpm lint` imports modules that import `@/lib/env`, so missing env vars break ALL CI steps — not just runtime.

**Fix:**

1. Check `.env.local` exists and has all 11 required vars
2. For CI, set all env vars in `.github/workflows/ci.yml` `env:` block with CI-safe dummy values
3. For tests, `src/test/setup.ts` sets all env vars with direct assignment (`=`)

```yaml
# .github/workflows/ci.yml
env:
  DATABASE_URL: "postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable"
  REDIS_URL: "redis://localhost:6379"
  AUTH_SECRET: "ci-dummy-secret-at-least-32-characters-long-xxx"
  AUTH_URL: "http://localhost:3000"
  ANTHROPIC_API_KEY: "sk-ant-ci-dummy-key-not-real"
  OPENAI_API_KEY: "sk-ci-dummy-key-not-real"
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: "ci-dummy-vapid-public-key-not-real"
  VAPID_PRIVATE_KEY: "ci-dummy-vapid-private-key-not-real"
  VAPID_SUBJECT: "mailto:ci@onestopnews.com"
  PUSH_KEY_ENCRYPTION_KEY: "0000000000000000000000000000000000000000000000000000000000000000"
  GOOGLE_CLIENT_ID: "ci-dummy-google-client-id"
  GOOGLE_CLIENT_SECRET: "ci-dummy-google-client-secret"
  GITHUB_CLIENT_ID: "ci-dummy-github-client-id"
  GITHUB_CLIENT_SECRET: "ci-dummy-github-client-secret"
  NODE_ENV: "test"
```

### Symptom: `next-prerender-current-time` build error

**Cause:** `new Date()` or `Date.now()` called in a Server Component during static prerendering. Next.js 16 with `cacheComponents: true` blocks this.

**Fix (3 steps, in order):**

1. Move time-dependent logic to a `'use client'` component:

```tsx
"use client";
import { useState, useEffect } from "react";

export function LiveDate() {
  const [year, setYear] = useState("");
  useEffect(() => {
    setYear(String(new Date().getFullYear()));
  }, []);
  return <span>{year}</span>;
}
```

2. Wrap the Client Component in `<Suspense>`:

```tsx
import { Suspense } from "react";

export default function Page() {
  return (
    <footer>
      <Suspense fallback={null}>
        <LiveDate />
      </Suspense>
    </footer>
  );
}
```

3. For utility functions like `formatTimeAgo()` that call `new Date()`, ensure they're only invoked from Client Components — never from Server Components.

### Symptom: `blocking-route` error

**Cause:** In Next.js 16 with `cacheComponents: true`, any uncached data fetch outside `<Suspense>` blocks the entire page render.

**Fix:** Extract data fetching into a separate Server Component and wrap in `<Suspense>`:

```tsx
// ❌ BAD — direct await blocks the page
export default async function HomePage() {
  const feed = await getFeedArticles();  // BLOCKS!
  return <FeedGrid articles={feed.articles} />;
}

// ✅ GOOD — Suspense + Server Component
export default function HomePage() {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      <FeedData limit={6} />
    </Suspense>
  );
}

// FeedData.tsx — Server Component that fetches
export async function FeedData({ limit }: { limit: number }) {
  const feed = await getFeedArticles({ limit });
  return <FeedContainer initialArticles={feed.articles} initialNextCursor={feed.nextCursor} initialHasMore={feed.hasMore} />;
}
```

### Symptom: Tailwind utility classes not generating (compiled CSS is ~16KB)

**Cause:** Tailwind CSS v4 requires `@tailwindcss/postcss` as a PostCSS plugin. Without `postcss.config.mjs`, `@import "tailwindcss"` is treated as plain CSS — `@theme` block renders as custom properties but no utility classes are generated from template class usage.

**Fix:**

```bash
pnpm add -D @tailwindcss/postcss@4.3.1
echo 'export default { plugins: { "@tailwindcss/postcss": {} } }' > postcss.config.mjs
rm -rf .next/  # CRITICAL — stale cache masks the fix
pnpm dev
```

### Symptom: Commit Mono font not loading

**Cause:** Commit Mono is not on Google Fonts. `next/font/google` cannot load it.

**Fix:**

```bash
pnpm add -D @fontsource/commit-mono@5.2.5
cp node_modules/@fontsource/commit-mono/files/commit-mono-400-normal.woff2 public/fonts/commit-mono-400.woff2
```

```tsx
// src/app/layout.tsx
import localFont from "next/font/local";

const commitMono = localFont({
  src: "../../public/fonts/commit-mono-400.woff2",
  variable: "--font-mono",
  weight: "400",
  style: "normal",
  display: "swap",
});
```

### Symptom: Hydration mismatch on `.reveal` elements

**Cause:** Applying `.reveal` class to above-the-fold elements. Server renders `class="reveal"` (invisible), client's `IntersectionObserver` adds `.visible` immediately → React detects hydration mismatch.

**Fix:** Only use `.reveal` for below-the-fold elements. Above-the-fold elements should be visible immediately.

### Symptom: CSS merge artifact corrupts `@theme` block

**Cause:** A git merge injected stray text into a CSS custom property declaration:

```css
/* ❌ Broken by merge artifact */
--color-ink-600: #3d3 INCLUDED-500: #525250;

/* ✅ Fixed */
--color-ink-600: #3d3d3a;
--color-ink-500: #525250;
```

**Fix:** Review CSS diffs after every merge that touches `globals.css`. Run `pnpm build` before pushing to catch parsing errors early.

### Symptom: RSS feed parsing returns empty array

**Cause 1:** Feed XML is malformed. `parseFeed` catches XML parse errors and returns `[]` (to avoid crashing the worker).

**Cause 2:** All items lack `<title>` — `parseFeed` filters out items without titles.

**Cause 3:** Feed format detection failed. `parseFeed` detects Atom by checking for `<feed` in raw XML; unusual whitespace/encoding may cause misdetection.

**Fix:**

```bash
curl -s <feed-url> | head -20  # Inspect raw XML
npx tsx -e "import { parseFeed } from './src/workers/jobs/parseFeed'; fetch('<feed-url>').then(r => r.text()).then(t => parseFeed(t, 'rss').then(items => console.log(items.length, 'items')))"
```

### Symptom: OAuth sign-in button not appearing on `/sign-in`

**Cause:** OAuth env vars (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`) not set. The sign-in page uses `showGoogle`/`showGithub` props derived from env var presence.

**Fix:** Set the env vars in `.env.local`:

```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

Restart dev server. Both `CLIENT_ID` AND `CLIENT_SECRET` must be set for a given provider — partial config is silently ignored.

### Symptom: Docker build fails with "Cannot find module" or ".next/standalone not found"

**Cause:** Phase 15 Dockerfile drift — Node version mismatch, missing `output: "standalone"`, or referencing non-existent scripts/paths.

**Fix:**

1. Verify `next.config.ts` has `output: "standalone"` (top-level)
2. Verify `Dockerfile.web` uses `node:24-alpine` and copies `.next/standalone`
3. Verify `Dockerfile.worker` uses `node:24-alpine` and runs `tsx src/workers/index.ts` directly (no `dist/`)
4. Run `docker build -f Dockerfile.web -t onestopnews-web .` to verify

### Symptom: Rate limit returns 429 unexpectedly

**Cause 1:** Multiple clients behind same NAT/proxy share an IP. The fixed-window counter is per-IP.

**Cause 2:** Behind a CDN without `TRUSTED_PROXY=true` — attacker can spoof `x-forwarded-for`.

**Fix:**

```bash
redis-cli get ratelimit:api:articles:1.2.3.4
redis-cli ttl ratelimit:api:articles:1.2.3.4
redis-cli del ratelimit:api:articles:1.2.3.4  # Reset
```

For production behind CDN, set `TRUSTED_PROXY=true` in `.env.local` to use rightmost IP from `x-forwarded-for`.

---

## 11. Pre-Ship Checklist

Before claiming any task is complete, verify ALL of the following:

### TypeScript & Lint

```bash
pnpm check   # tsc --noEmit && pnpm lint
```

- [ ] Zero TypeScript errors (`tsc --noEmit` exit 0)
- [ ] Zero ESLint warnings (`eslint . --max-warnings 0` exit 0)
- [ ] No `any` types (use `unknown` + type guards)
- [ ] No `enum` / `namespace` (use string unions + ES modules)
- [ ] All type-only imports use `import type`
- [ ] `noUncheckedIndexedAccess` satisfied (no `arr[i]` without null check)

### Tests

```bash
pnpm test     # vitest run
pnpm test:e2e # playwright test (requires pnpm dev running)
```

- [ ] All unit tests pass (currently 279 across 49 suites)
- [ ] All E2E tests pass (10 Playwright smoke tests)
- [ ] New code has tests (TDD: RED → GREEN → REFACTOR)
- [ ] Test duration < 30s (currently ~13s)
- [ ] `e2e/` excluded from vitest/eslint/tsc

### Build

```bash
pnpm build    # next build (requires DB + Redis for prerender)
```

- [ ] Production build succeeds (requires DATABASE_URL + REDIS_URL)
- [ ] No `blocking-route` warnings
- [ ] No `next-prerender-current-time` errors
- [ ] `.next/standalone/` generated (requires `output: "standalone"`)

### Database

- [ ] All schema changes have a migration (`drizzle-kit generate`)
- [ ] Migrations are additive (no destructive changes without explicit approval)
- [ ] `drizzle/meta/_journal.json` committed alongside migration SQL
- [ ] Never use `drizzle-kit push` in production

### Design System

- [ ] No raw hex colors in Tailwind classes (use design tokens)
- [ ] No Inter/Roboto/Space Grotesk (use Newsreader/Instrument Sans/Commit Mono)
- [ ] `.font-editorial` used for headlines (don't add redundant `font-[800]`/`leading-tight`/`tracking-[-0.02em]`)
- [ ] `font-mono` used for metadata (not corrupted variants like `font浃着` or `Monad`)
- [ ] CSS Subgrid used for feed grid (`grid-rows-subgrid row-span-3`)

### Accessibility (WCAG AAA)

- [ ] All interactive elements have `focus-visible:` rings
- [ ] All animations respect `prefers-reduced-motion: reduce` (disabled, not slowed)
- [ ] Color contrast meets AAA where possible (ink-600 on paper-50 = 9.5:1)
- [ ] Semantic HTML (`<nav>`, `<main>`, `<article>`, `<time>`, `<aside>`)
- [ ] ARIA labels on icon-only buttons (`aria-label="Search news"`)
- [ ] `role="feed"` on feed containers
- [ ] `role="alert" aria-live="polite"` on error messages
- [ ] Empty states have `role="status"`

### Architecture (5-Layer Model)

- [ ] `proxy.ts` has NO DB calls, NO business logic (Layer 0)
- [ ] No data fetching in Layouts (Layer 1)
- [ ] All DB access via `queries.ts` in feature modules (Layer 2)
- [ ] Domain services are pure (no Next.js / DB imports) (Layer 3)
- [ ] Infrastructure isolated in `src/lib/` (Layer 4)

### Auth

- [ ] `verifySession()` / `verifyAdminSession()` called in Server Components / Server Actions
- [ ] `redirect()` used (not `throw new Error()`) for auth failures
- [ ] OAuth providers conditional on env vars (`buildProviders()`)
- [ ] `/sign-in` and `/auth-error` pages exist (referenced in `pages.signIn`/`pages.error`)

### Workers

- [ ] No `revalidateTag()` in worker code (use Redis pub/sub)
- [ ] Singleton Redis publisher (no per-call `new Redis()`)
- [ ] `FlowProducer` atomic DAG for post-ingest (not individual `scoreQueue.add()`)
- [ ] Content availability guard enforced (no summarising `title_only`/`excerpt`)
- [ ] `getSummaryFailureState()` used in catch block (sets `needs_review` after 3 retries)

### Environment

- [ ] All 11 required env vars in `.env.example`
- [ ] All 4 optional OAuth env vars in `.env.example` (commented out)
- [ ] `src/test/setup.ts` sets all env vars with direct `=` assignment
- [ ] `.github/workflows/ci.yml` has all env vars in `env:` block

### Docker (Phase 15)

- [ ] All Dockerfiles pinned to `node:24-alpine`
- [ ] `next.config.ts` has `output: "standalone"`
- [ ] `Dockerfile.worker` runs `tsx src/workers/index.ts` (no `dist/`)
- [ ] No `packages/` copy (not a monorepo)
- [ ] `docker-compose.prod.yml` passes through all env vars from host

### Documentation

- [ ] README.md updated (Phase Status Tracker, test count, file hierarchy)
- [ ] CLAUDE.md updated (anti-patterns, file locations, lessons learned)
- [ ] AGENTS.md updated (file inventory, anti-patterns, lessons learned)
- [ ] onestopnews_SKILL.md updated (this file)

---

## 12. Lessons Learnt & How to Avoid Them

### Phase 13 Lessons

1. **`rss-parser` field conflation** — Always check what a library conflates before relying on built-in fields. For feeds, explicit field extraction by format is safer than generic fallbacks.

2. **Vercel AI SDK v6 `generateObject` return shape** — `result.object` (NOT `result` directly). Spread `result.object` and add `model` + `tokensUsed` from `result.usage`.

3. **`articles.body` column — Schema design gap** — When `contentAvailabilityEnum` tiers imply body content exists, the schema must have a `body` column. Don't let domain logic check `body.length` on input that's never persisted.

4. **`vi.fn().mockImplementation()` is NOT a constructor** — When mocking classes called with `new`, use a real class in the mock factory: `class MockRedis { incr = mockRedis.incr; ... }`.

5. **Test setup env var override** — Use direct `=` (not `??=`) in `src/test/setup.ts`. Shell env may contain values that fail Zod schema.

6. **CI workflow — Missing env vars break all steps** — `src/lib/env/index.ts` validates at module load. Even `pnpm lint` imports modules that import `@/lib/env`. Set all env vars in CI `env:` block.

7. **`clientSegmentCache` not in ExperimentalConfig** — Next.js 16.2.9 doesn't expose this flag. Adding it produces `TS2353`. Document as deferred.

8. **Content change detection via `(xmax = 0)`** — PostgreSQL system column `xmax` is 0 for INSERTs, non-zero for UPDATEs. Combined with `WHERE content_hash != excluded.content_hash`, this detects content changes.

9. **Singleton publisher pattern** — Module-level singleton Redis publisher avoids connection churn under high ingest load (50 workers × N calls).

10. **Corrupted CSS class names** — `font浃着` and `Monad` are invalid CSS classes — browsers silently ignore them. Use `font-mono` consistently. Audit className strings after edits.

### Phase 14 Lessons

1. **`hashContent` must include body** — When hashing for change detection, include ALL fields that represent "content" — not just identifiers. Title + date identify the article; body IS the content.

2. **Rate limiter `TRUSTED_PROXY` pattern** — IP extraction from `x-forwarded-for` must distinguish "direct exposure" (leftmost = client) from "behind trusted proxy" (rightmost = proxy's client). Use env var to switch — don't hardcode either.

3. **`pushSubscriptions.keys` schema convention** — Schema types should match storage semantics. If a field stores an encrypted envelope, it should be a single string column — not stuffed into a typed object field. Additive migrations (new column) are safer than in-place type changes.

4. **Article detail page — `generateMetadata` for provenance** — `generateMetadata()` is the Next.js 16 mechanism for per-page HTTP headers + meta tags. Set `metadata.other = { "ai-provenance": metaTag, "X-AI-Provenance": httpHeader }` for 3-layer provenance.

5. **Property-based testing > hardcoded vectors** — Prefer property-based tests (determinism, collision resistance, algorithm verification) over hardcoded vectors. Hardcoded vectors are brittle and don't explain WHY the hash should be that value.

6. **E2E tests require config separation** — When using multiple test runners (vitest for unit/integration, Playwright for E2E), explicitly exclude each runner's files from the other's config.

7. **BullMQ `getSummaryFailureState` — permanent failure visibility** — For retryable operations, distinguish "temporary failure (retry)" from "permanent failure (escalate)". After exhausting retries, set a visible failure state.

8. **Drizzle mock query builder chaining** — Drizzle's query builder is deeply chainable. Self-referential mocks (`result.method = method`) handle arbitrary chaining depth.

### Phase 15 Lessons

1. **Dockerfile drift — Node version mismatch + malformed lines** — Dockerfiles must be validated as part of CI — not just visually reviewed. Always pin to the exact Node version specified in `engines.node`. Each Dockerfile instruction must be on its own line.

2. **`output: "standalone"` required for production Docker** — Mandatory when using the standalone Docker pattern. Without it, the Dockerfile references a directory that doesn't exist. Always pair the config flag with the Dockerfile copy step.

3. **Cursor-based "Load More" — Server fetch initial, Client fetches subsequent** — The Next.js 16 App Router pattern for paginated feeds: Server Component fetches page 1 (fast initial render + SEO), Client Component fetches subsequent pages (interactivity). `<Suspense>` wraps the Server Component so the page shell renders immediately.

4. **Dropping a deprecated column — additive migration verification via TDD** — Before dropping a column, grep the entire `src/` for references. Use the test mock as a canary — if removing the column from the mock doesn't break tests, no code reads it. Always generate a Drizzle migration (`drizzle-kit generate`) rather than writing SQL by hand.

5. **OAuth providers — conditional configuration for backward compat** — When adding new auth providers, make them conditional on env vars. Never assume all deployments will have the same provider configuration. The `Provider` type from Auth.js v5 is a union — use `'id' in p` narrowing to access the `id` property safely in tests.

6. **Missing `/sign-in` and `/auth-error` pages — referenced but non-existent** — Always verify that routes referenced in `pages.signIn`/`pages.error` actually exist. Auth.js silently accepts non-existent paths — the failure only appears at runtime when a user is redirected to a 404. Server-action forms (`<form action="..." method="post">`) are the simplest OAuth trigger pattern — no `SessionProvider` needed.

7. **Mocking `global.fetch` in Vitest — `vi.stubGlobal` pattern** — `vi.fn()` creates a mock function but doesn't replace anything by itself. For global APIs like `fetch`, use `vi.stubGlobal("fetch", mockFn)`. Always reset between tests to avoid cross-test contamination.

8. **Stale file paths in documentation** — Documentation file paths drift over time as components are moved during refactors. Audit docs against the actual filesystem periodically using `find src -name "*.tsx" | sort`. Consider a CI check that greps doc-cited paths and verifies they exist.

---

## 13. Pitfalls to Avoid

### Build-Time Pitfalls

1. **Don't run `pnpm build` without DATABASE_URL + REDIS_URL** — The home page's `getFeedArticles()` uses `"use cache"` which queries the DB at build time. CI handles this with Postgres + Redis service containers.

2. **Don't forget `rm -rf .next/` after config changes** — Stale `.next/` cache serves pre-fix CSS/JS, masking the fix. This is a reflex for any PostCSS/Tailwind/Next.js config change.

3. **Don't add `experimental.ppr` or `experimental.dynamicIO`** — These are removed in Next.js 16. `cacheComponents: true` replaces them.

4. **Don't put `cacheComponents` inside `experimental`** — It must be top-level. Inside `experimental`, every `"use cache"` is silently ignored.

### Runtime Pitfalls

5. **Don't call `revalidateTag()` in workers** — It's a Next.js-only API, not available in the separate Node.js worker process. Use Redis pub/sub for cache invalidation.

6. **Don't create `new Redis()` per call** — Connection churn under high load. Use module-level singleton publishers.

7. **Don't use `drizzle-kit push` in production** — Overwrites schema without migration history. Use `generate` + `migrate` only.

8. **Don't summarise `title_only` or `excerpt` articles** — AI hallucination risk. The content availability guard prevents this, but it must be enforced at BOTH the Server Action layer AND the API Route layer.

### Type Safety Pitfalls

9. **Don't use `as any` with Drizzle `.with()`** — Type inference broken for relational queries. Use explicit `.innerJoin()` instead.

10. **Don't use `enum` or `namespace`** — Violate `erasableSyntaxOnly`. Use string unions and ES modules.

11. **Don't access `arr[i]` without null check** — `noUncheckedIndexedAccess: true` makes it `T | undefined`. Always check `if (!row) return ...`.

12. **Don't use `??=` for test env vars** — Shell env may contain values that fail Zod schema. Use direct `=` assignment.

### Design System Pitfalls

13. **Don't use raw hex colors** — Bypasses design token system. Use `bg-ink-900`, `text-paper-50`, etc.

14. **Don't add redundant classes alongside `.font-editorial`** — It bakes in weight 800, leading 1.1, tracking -0.02em. Only add overrides for different values.

15. **Don't use `.reveal` on above-the-fold elements** — Causes hydration mismatch. Only for below-the-fold.

16. **Don't use `next/font/google` for Commit Mono** — Not on Google Fonts. Use `next/font/local` with woff2 file.

### Auth Pitfalls

17. **Don't put admin auth in `proxy.ts`** — Layer 0 has no DB access. Use `verifyAdminSession()` in `(admin)/layout.tsx`.

18. **Don't use `throw new Error()` for auth failures in RSC** — Triggers full-page error boundary. Use `redirect('/sign-in')`.

19. **Don't make OAuth providers always-on** — Auth.js throws at boot if env vars missing. Use conditional `buildProviders()`.

20. **Don't reference non-existent pages in `pages.signIn`/`pages.error`** — Auth.js silently accepts non-existent paths. Verify the pages exist.

---

## 14. Best Practices

### TypeScript

- **`interface` over `type`** for structural definitions; `type` for unions/intersections
- **Early returns** (guard clauses) over deeply nested conditionals
- **Composition over inheritance** — no class hierarchies for business logic
- **`import type`** for type-only imports (required by `verbatimModuleSyntax`)
- **Derive types from Drizzle schema** via `InferSelectModel` — never hand-write
- **Use `unknown` + type guards** instead of `any`
- **Avoid explicit return types** unless public API boundary (lean on inference)

### Next.js 16

- **Server Components by default** — use `'use client'` only for interactivity
- **`<Suspense>` around all DB queries** — prevents `blocking-route` error
- **`async params` / `async searchParams`** — always `await` them (Promise<T>)
- **`async cookies()`** — always `await` before `.get()`
- **No data fetching in Layouts** — fetch in Pages
- **`proxy.ts`** (not `middleware.ts`) — Node.js runtime, cookie check + redirect only
- **`generateMetadata()`** for per-page HTTP headers + meta tags

### Database

- **Lazy Proxy connection** — defers until first query, prevents build-time crashes
- **All queries via `queries.ts`** in feature modules — no raw Drizzle calls in components
- **Additive migrations only** — never `push` in production
- **`onConflictDoUpdate` with `(xmax = 0)` trick** — distinguish INSERT vs UPDATE
- **SHA-256 for content hashing** — include body, not just title + date
- **`innerJoin` over `.with()`** for type-safe relational queries

### Workers

- **Singleton Redis publisher** — module-level, reused across calls
- **`FlowProducer` atomic DAG** — parent runs only after all children complete
- **Content availability guard** — never summarise `title_only`/`excerpt`
- **`getSummaryFailureState()`** — `needs_review` after 3 retries (not silent `none`)
- **Graceful shutdown** — `SIGTERM`/`SIGINT` handlers close all workers

### Testing

- **TDD: RED → GREEN → REFACTOR** — one cycle per commit
- **Property-based tests** over hardcoded vectors
- **`vi.stubGlobal("fetch", mockFn)`** for global API mocking
- **Self-referential mocks** for chainable query builders
- **Exclude `e2e/` from vitest/eslint/tsc** — separate Playwright config
- **Direct `=` assignment for test env vars** — not `??=`

### Design System

- **Design tokens only** — no raw hex colors
- **`.font-editorial` for headlines** — don't add redundant weight/leading/tracking
- **CSS Subgrid for feed** — `grid-rows-subgrid row-span-3`
- **`.reveal` for below-the-fold only** — prevents hydration mismatch
- **`prefers-reduced-motion: reduce`** — disable animations entirely (not slow them)

### Accessibility

- **`focus-visible:` rings** — not `focus:` (only show on keyboard nav)
- **`role="feed"`** on feed containers
- **`role="alert" aria-live="polite"`** on errors
- **`role="status"`** on empty states
- **`<time dateTime={...}>`** for all timestamps
- **`aria-label`** on icon-only buttons
- **AAA color contrast** where possible (ink-600 on paper-50 = 9.5:1)

---

## 15. Coding Patterns

### The `cn()` Utility (clsx + tailwind-merge)

```typescript
// src/shared/lib/utils.ts
import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Usage:** Conditional class names with Tailwind conflict resolution:

```tsx
<Button className={cn("w-full", isActive && "bg-dispatch-ember", isLoading && "opacity-50")}>
```

### The `formatTimeAgo()` Utility

```typescript
export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
    { label: "second", seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count > 0) {
      return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
    }
  }

  return "just now";
}
```

**Warning:** Uses `new Date()` — must be called from Client Components only (or wrapped in `<Suspense>`).

### The Lazy Proxy DB Pattern

```typescript
// src/lib/db/index.ts
let _db: ReturnType<typeof createDb> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("[DB] DATABASE_URL is not set.");
  _client = createClient(url);
  _db = createDb(_client);
  return _db;
}

// Exported as a Proxy — connection deferred until first property access
export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_, prop) {
    return getDb()[prop as keyof ReturnType<typeof getDb>];
  },
});
```

### The `verifySession()` Pattern (cache-memoized)

```typescript
// src/lib/auth/dal.ts
import { cache } from "react";
import { redirect } from "next/navigation";

export const verifySession = cache(async () => {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/sign-in");  // NEVER throw — use redirect()
  }

  const user = await db
    .select({ id: users.id, role: users.role, name: users.name })
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!user) {
    redirect("/sign-in");
  }

  return { user, sessionId: session.user.id as string };
});

export const verifyAdminSession = cache(async () => {
  const { user } = await verifySession();
  if (user.role !== "admin") {
    redirect("/");
  }
  return user;
});
```

**Why `cache()`:** Memoizes per-request. Multiple components calling `verifySession()` in one render tree execute ONE validation.

### The Conditional OAuth Providers Pattern

```typescript
// src/lib/auth/providers.ts
export function buildProviders(): Provider[] {
  const providers: Provider[] = [credentialsProvider];  // Always present

  const hasGoogle = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
  if (hasGoogle) {
    providers.push(Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET }));
  }

  const hasGitHub = process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET;
  if (hasGitHub) {
    providers.push(GitHub({ clientId: process.env.GITHUB_CLIENT_ID, clientSecret: process.env.GITHUB_CLIENT_SECRET }));
  }

  return providers;
}
```

**Type narrowing for tests:**

```typescript
function providerIds(providers: ReturnType<typeof buildProviders>): string[] {
  return providers.map((p) => ("id" in p ? p.id : "unknown"));
}
```

### The Suspense + Server Component Pattern

```tsx
// page.tsx — wraps async component in Suspense
import { Suspense } from "react";
import { FeedData } from "@/features/feed/components/FeedData";
import { FeedSkeleton } from "@/features/feed/components/FeedSkeleton";

export default function HomePage() {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      <FeedData limit={6} />
    </Suspense>
  );
}

// FeedData.tsx — Server Component that fetches
export async function FeedData({ limit = 6 }: { limit?: number }) {
  const feed = await getFeedArticles({ limit });
  return <FeedContainer initialArticles={feed.articles} initialNextCursor={feed.nextCursor} initialHasMore={feed.hasMore} />;
}
```

### The 3-Layer Provenance Pattern

```typescript
// src/lib/ai/provenance.ts
export function generateProvenanceMetadata(input: ProvenanceInput): ProvenanceResult {
  return {
    jsonLd: generateJsonLd(input),       // Layer 1: JSON-LD for <script type="application/ld+json">
    httpHeader: generateHttpHeader(input), // Layer 2: Base64 JSON for X-AI-Provenance header
    metaTag: generateMetaTag(input),      // Layer 3: Semicolon-delimited for <meta name="ai-provenance">
  };
}

// Usage in generateMetadata():
metadata.other = {
  "ai-provenance": provenance.metaTag,
  "X-AI-Provenance": provenance.httpHeader,
  "json-ld-provenance": provenance.jsonLd,
};
```

### The Upsert with Content Change Detection Pattern

```typescript
const result = await db
  .insert(articles)
  .values({ ... })
  .onConflictDoUpdate({
    target: articles.canonicalUrl,
    set: { title: item.title, excerpt: item.excerpt, body: item.body, contentHash },
    where: sql`${articles.contentHash} != excluded.content_hash`,
  })
  .returning({
    id: articles.id,
    isNew: sql<boolean>`(xmax = 0)`,  // true for INSERT, false for UPDATE
  });

const row = result[0];
if (row?.isNew) {
  // Enqueue scoring for new/updated articles
  await enqueuePostIngestFlow({ newArticleIds: [row.id], categoryId: source.categoryId! });
}
```

### The Singleton Redis Publisher Pattern

```typescript
let _publisher: Redis | null = null;

function getPublisher(): Redis {
  if (!_publisher) {
    _publisher = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
    });
  }
  return _publisher;
}
```

### The FlowProducer Atomic DAG Pattern

```typescript
let _flowProducer: FlowProducer | null = null;

function getFlowProducer(): FlowProducer {
  if (!_flowProducer) {
    _flowProducer = new FlowProducer({ connection: createQueueConnection() });
  }
  return _flowProducer;
}

export async function enqueuePostIngestFlow(input: PostIngestFlowInput): Promise<void> {
  const flowProducer = getFlowProducer();

  const children = input.newArticleIds.map((articleId) => ({
    name: "score-article",
    queueName: "score",
    data: { articleId },
    opts: { priority: 2 },
  }));

  await flowProducer.add({
    name: "refresh-feed-slice",
    queueName: "feed-slice",
    data: { categoryId: input.categoryId, sort: "latest" },
    opts: { priority: 1 },
    children,  // Parent runs ONLY after all children complete
  });
}
```

---

## 16. Coding Anti-Patterns

(See Section 9 for the complete anti-patterns table. Key reinforcements:)

- **No `any`** — use `unknown` + type guards
- **No `enum` / `namespace`** — use string unions + ES modules
- **No `middleware.ts`** — use `proxy.ts`
- **No `experimental.ppr` / `dynamicIO`** — use `cacheComponents: true`
- **No `new Date()` in Server Components** — move to Client Component with `<Suspense>`
- **No direct `await` of DB query in page** — wrap in `<Suspense>` + Server Component
- **No `revalidateTag()` in workers** — use Redis pub/sub
- **No `new Redis()` per call** — use module-level singleton
- **No `drizzle-kit push` in production** — use `generate` + `migrate`
- **No `as any` with Drizzle `.with()`** — use explicit `.innerJoin()`
- **No raw hex colors** — use design tokens
- **No `.reveal` on above-the-fold** — causes hydration mismatch
- **No admin auth in `proxy.ts`** — use `verifyAdminSession()` in layout
- **No `throw new Error()` for auth** — use `redirect()`
- **No always-on OAuth providers** — use conditional `buildProviders()`
- **No `vi.fn()` for `global.fetch` without `vi.stubGlobal`** — use `vi.stubGlobal("fetch", mockFn)`
- **No `??=` for test env vars** — use direct `=`
- **No `node:22-alpine` in Dockerfiles** — pin to `node:24-alpine`
- **No missing `output: "standalone"`** — required for production Docker
- **No `worker:build` script reference** — run `tsx src/workers/index.ts` directly
- **No malformed Dockerfile lines** — each instruction on its own line
- **No `packages/` copy** — not a monorepo
- **No stale file paths in docs** — audit against filesystem periodically

---

## 17. Responsive Breakpoint Reference

OneStopNews uses Tailwind's default breakpoints (no custom config):

| Prefix | Min Width | Typical Usage |
|---|---|---|
| (none) | 0px | Mobile-first base styles |
| `sm:` | 640px | Small tablets — headline size bump (`text-3xl sm:text-4xl`) |
| `md:` | 768px | Tablets — 2-column feed (`md:grid-cols-2`), show desktop nav (`hidden md:flex`) |
| `lg:` | 1024px | Desktop — 3-column feed (`lg:grid-cols-3`), section padding (`py-16 lg:py-24`) |
| `xl:` | 1280px | (Not used — max-width is fixed at 1440px) |
| `2xl:` | 1536px | (Not used) |

### Standard Container Pattern

```tsx
<div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
```

- Mobile: 16px horizontal padding (`px-4`)
- Small tablet+: 24px padding (`sm:px-6`)
- Desktop+: 32px padding (`lg:px-8`)
- Max width: 1440px (centered)

### Feed Grid Responsive Pattern

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8">
```

- Mobile: 1 column
- Tablet+: 2 columns
- Desktop+: 3 columns
- `gap-x-8` only (no `gap-y` — cards own vertical spacing via `mb-10`)

### Headline Responsive Pattern

```tsx
<h2 className="font-editorial text-3xl sm:text-4xl text-ink-900 leading-[1.05]">
```

- Mobile: `text-3xl` (1.875rem)
- Small tablet+: `text-4xl` (2.25rem)

### Section Padding Pattern

```tsx
<section className="py-16 lg:py-24">
```

- Mobile/Tablet: 64px vertical padding
- Desktop+: 96px vertical padding

### Mobile Menu Pattern

```tsx
{/* Desktop nav — hidden on mobile */}
<nav className="hidden md:flex ...">...</nav>

{/* Mobile hamburger — hidden on desktop */}
<button className="md:hidden ...">...</button>
```

---

## 18. Z-Index Layer Map

| Layer | Z-Index | Element | Location |
|---|---|---|---|
| Content (above decorative) | `z-10` | Stats section text (above background numbers) | `StatsSection.tsx` |
| Sticky Header | `z-40` | Sticky top navigation | `Header.tsx` |
| Mobile Dialog Overlay | `z-50` | Radix Dialog Overlay (backdrop) | `Header.tsx` |
| Mobile Dialog Content | `z-50` | Radix Dialog Content (slide-in panel) | `Header.tsx` |
| Scroll Progress Bar | `z-index: 999` | CSS-only scroll progress (CSS, not Tailwind) | `globals.css` `.scroll-progress` |

### Z-Index Rules

1. **Never use `z-50`+ for content** — reserve for overlays/modals
2. **Sticky elements use `z-40`** — below modals, above content
3. **Decorative background elements use `z-10`** — below content
4. **Scroll progress uses `z-index: 999`** (CSS) — above everything, `pointer-events: none`
5. **No arbitrary z-index values** (`z-[9999]`) — use the Tailwind scale (`z-10` through `z-50`)

---

## 19. Color Reference (Complete)

### Ink Scale (Warm Grays)

| Token | Hex | RGB | Usage | Contrast on `paper-50` |
|---|---|---|---|---|
| `ink-900` | `#1a1a18` | 26, 26, 24 | Headings, letterpress black | 16.8:1 (AAA) |
| `ink-700` | `#2a2a27` | 42, 42, 39 | Secondary headings, hover states | 12.5:1 (AAA) |
| `ink-600` | `#3d3d3a` | 61, 61, 58 | Body text | 9.5:1 (AAA) |
| `ink-500` | `#525250` | 82, 82, 80 | Muted body text | 6.9:1 (AA) |
| `ink-400` | `#6b6b68` | 107, 107, 104 | Placeholder text, icons | 4.6:1 (AA) |
| `ink-300` | `#8a8a83` | 138, 138, 131 | Metadata, dividers (large text only) | 3.2:1 (AA large) |
| `ink-100` | `#e8e8e4` | 232, 232, 228 | Borders, dividers, scrollbar thumb | — |

### Paper Scale (Off-White Newsprint)

| Token | Hex | RGB | Usage |
|---|---|---|---|
| `paper-50` | `#fafaf8` | 250, 250, 248 | Page background (primary) |
| `paper-100` | `#f2f2ee` | 242, 242, 238 | Card surface, hover bg |
| `paper-200` | `#e6e4de` | 230, 228, 222 | Borders, subtle dividers |
| `paper-300` | `#d8d4cc` | 216, 212, 204 | Stronger borders |

### Dispatch Brand Accents

| Token | Hex | RGB | Usage | Light Variant |
|---|---|---|---|---|
| `dispatch-ember` | `#c7513f` | 199, 81, 63 | Breaking news, AI badge, focus rings, primary CTA | `#fde8e4` |
| `dispatch-sage` | `#6b8f71` | 107, 143, 113 | Finance, positive indicators | `#e4ede5` |
| `dispatch-slate` | `#5a6b7a` | 90, 107, 122 | Tech, neutral accents | `#e2e7ec` |
| `dispatch-clay` | `#8b6d5a` | 139, 109, 90 | Local, politics | `#ede5df` |
| `dispatch-violet` | `#7a6b8f` | 122, 107, 143 | Culture, creative | `#e8e4ef` |

### Category Color Mapping

| Category | Accent | Light Variant |
|---|---|---|
| Top Stories | `dispatch-ember` | `dispatch-ember-light` |
| Local | `dispatch-clay` | `dispatch-clay-light` |
| Tech | `dispatch-slate` | `dispatch-slate-light` |
| Global | `dispatch-slate` | `dispatch-slate-light` |
| Finance | `dispatch-sage` | `dispatch-sage-light` |
| Politics | `dispatch-clay` | `dispatch-clay-light` |
| Culture | `dispatch-violet` | `dispatch-violet-light` |

### Tailwind Class Reference

| Tailwind Class | CSS Variable | Example Usage |
|---|---|---|
| `bg-ink-900` | `--color-ink-900` | Headings background |
| `text-ink-600` | `--color-ink-600` | Body text |
| `bg-paper-50` | `--color-paper-50` | Page background |
| `bg-paper-100` | `--color-paper-100` | Card surface |
| `text-dispatch-ember` | `--color-dispatch-ember` | AI badge, breaking news |
| `bg-dispatch-ember` | `--color-dispatch-ember` | Primary CTA button |
| `border-ink-100` | `--color-ink-100` | Borders, dividers |
| `font-editorial` | `--font-editorial` | Headlines (Newsreader) |
| `font-ui` | `--font-ui` | Body text (Instrument Sans) |
| `font-mono` | `--font-mono` | Metadata (Commit Mono) |

---

## 20. TypeScript Interface Reference

### Domain Types (`src/domain/articles/types.ts`)

```typescript
import type { InferSelectModel } from "drizzle-orm";
import type { articles, sources, categories, summaries } from "@/lib/db/schema";

// Base Table Types (derived from Drizzle schema — single source of truth)
export type Article = InferSelectModel<typeof articles>;
export type Source = InferSelectModel<typeof sources>;
export type Category = InferSelectModel<typeof categories>;
export type Summary = InferSelectModel<typeof summaries>;

// Domain-Specific Types
export interface ArticleWithSource extends Article {
  source: Pick<Source, "id" | "name" | "url">;
}

export interface ArticleWithSummary extends ArticleWithSource {
  category: Pick<Category, "id" | "name" | "slug"> | null;
  summary: Summary | null;
}

export interface FeedPage {
  articles: ArticleWithSource[];
  nextCursor: string | null;
  hasMore: boolean;
}
```

### Schema Enums (`src/lib/db/schema.ts`)

```typescript
// String unions (NOT TypeScript enums — erasableSyntaxOnly)
type UserRole = "reader" | "admin";
type FeedFormat = "rss" | "atom" | "json_api";
type ContentAvailability = "title_only" | "excerpt" | "partial_text" | "full_text";
type SummaryStatus = "none" | "pending" | "ok" | "needs_review" | "disabled";
type SourceStatus = "active" | "paused" | "error" | "disabled";  // (not in schema — conceptual)
```

### Feed Query Types (`src/features/feed/queries.ts`)

```typescript
export interface FeedQueryOptions {
  category?: string;
  cursor?: Date;
  limit?: number;
}

export interface FeedPage {
  articles: ArticleWithSource[];
  nextCursor: string | null;
  hasMore: boolean;
}
```

### Search Types (`src/features/search/types.ts`)

```typescript
export interface SearchParams {
  query: string;
  category?: string;
  cursor?: Date;
  limit?: number;
}

export interface SearchResult {
  article: ArticleWithSource;
  rank: number;
}

export interface SearchPage {
  results: SearchResult[];
  nextCursor: string | null;
  hasMore: boolean;
}
```

### AI Summarisation Types (`src/features/summaries/lib/summariseSchema.ts`)

```typescript
export interface SourceCitation {
  url: string;
  title: string;
}

export interface SummarisationOutput {
  summaryText: string;           // 50-800 chars
  keyPoints: string[];           // 1-5 items, each 1-120 chars
  sourcesCited: SourceCitation[];  // min 1
  aiStatement: string;           // 20-200 chars
  coveragePercentage: number;    // 0-100
}
```

### Provenance Types (`src/lib/ai/provenance.ts`)

```typescript
export interface ProvenanceInput {
  summary: SummarisationOutput;
  articleId: string;
  articleUrl: string;
  articleTitle: string;
  model: string;
  generatedAt: string;  // ISO timestamp
}

export interface ProvenanceResult {
  jsonLd: string;       // Layer 1: JSON-LD for <script type="application/ld+json">
  httpHeader: string;   // Layer 2: Base64 JSON for X-AI-Provenance header
  metaTag: string;      // Layer 3: Semicolon-delimited for <meta name="ai-provenance">
}
```

### Worker Types

```typescript
// src/workers/jobs/parseFeed.ts
export interface FeedItem {
  title: string;
  excerpt?: string;
  body?: string;
  url: string;
  publishedAt?: Date;
}
export type FeedFormat = "rss" | "atom" | "json_api";

// src/workers/jobs/summarize.ts
export interface ArticleForSummarization {
  title: string;
  excerpt: string | null;
  body: string | null;
  sourceName: string;
  sourceUrl: string;
}
export interface SummarizationResult extends SummarisationOutput {
  model: string;
  tokensUsed: number;
}

// src/workers/jobs/summarizeFailure.ts
export interface SummaryFailureState {
  summaryStatus: "none" | "needs_review";
  flagReason: string | null;
}

// src/lib/queue/flows.ts
export interface PostIngestFlowInput {
  newArticleIds: string[];
  categoryId: string;
}
```

### Auth Types (`types/next-auth.d.ts`)

```typescript
import { DefaultSession } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "reader" | "admin";
    } & DefaultSession["user"];
  }
  interface User {
    role: "reader" | "admin";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "reader" | "admin";
  }
}
```

### Component Props Interfaces

```typescript
// ArticleCard
interface ArticleCardProps {
  article: ArticleWithSource;
}

// FeedGrid
interface FeedGridProps {
  articles: ArticleWithSource[];
}

// FeedContainer (Phase 15)
interface FeedContainerProps {
  initialArticles: ArticleWithSource[];
  initialNextCursor: string | null;
  initialHasMore: boolean;
}

// LoadMoreButton (Phase 15)
interface LoadMoreButtonProps {
  hasMore: boolean;
  isLoading: boolean;
  onClick: () => void;
}

// Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

// SignInClient (Phase 15)
interface SignInClientProps {
  showGoogle: boolean;
  showGithub: boolean;
}

// ArticleData
interface ArticleDataProps {
  params: Promise<{ id: string }>;
}
```

### Rate Limit Types (`src/lib/rateLimit.ts`)

```typescript
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;  // Epoch milliseconds
}
```

### Environment Types (`src/lib/env/index.ts`)

```typescript
// Inferred from Zod schema
type Env = {
  DATABASE_URL: string;
  REDIS_URL: string;
  AUTH_SECRET: string;
  AUTH_URL: string;
  ANTHROPIC_API_KEY: string;
  OPENAI_API_KEY: string;
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string;
  PUSH_KEY_ENCRYPTION_KEY: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  NODE_ENV: "development" | "production" | "test";
};
```

---

## Validation Checklist

Before using this skill file, verify the following against the actual codebase:

- [ ] **Tech stack versions match** — `package.json` has `next@^16.2.9`, `react@^19.2.7`, `typescript@^5.7.0`, `next-auth@5.0.0-beta.31`, `@tailwindcss/postcss@^4.3.1`
- [ ] **Configuration files match** — `next.config.ts` has `output: "standalone"`, `cacheComponents: true`, `cacheLife` profiles, `turbopack: {}`, `experimental.viewTransition`; `tsconfig.json` has `strict`, `noUncheckedIndexedAccess`, `erasableSyntaxOnly`, `verbatimModuleSyntax`; `postcss.config.mjs` exists with `@tailwindcss/postcss` plugin
- [ ] **Design system tokens match** — `globals.css` `@theme` block has all ink/paper/dispatch colors with exact hex values; `.font-editorial` enhancement block has weight 800, leading 1.1, tracking -0.02em
- [ ] **Component architecture matches** — 5-layer model enforced; `proxy.ts` has no DB calls; `verifySession()` uses `cache()` + `redirect()`; `<Suspense>` wraps all DB queries
- [ ] **Hooks implementation matches** — `useDebounce<T>` is generic with cleanup; `useReducedMotion` uses `matchMedia` + `addEventListener`; `RevealProvider` uses `IntersectionObserver` with `threshold: 0.1`
- [ ] **Content ingestion patterns match** — `parseFeed` uses `rss-parser` with custom fields; `hashContent(title, body, publishedAt)` includes body; `onConflictDoUpdate` uses `(xmax = 0)` trick; `FlowProducer` atomic DAG
- [ ] **Accessibility implementation matches** — `:focus-visible` global style; `prefers-reduced-motion` disables all animations; `role="feed"` on feed containers; `role="alert" aria-live="polite"` on errors
- [ ] **Anti-patterns documented correctly** — All Phase 13/14/15 anti-patterns present in Section 9
- [ ] **Color references match** — All ink/paper/dispatch tokens with hex, RGB, contrast ratios
- [ ] **TypeScript interfaces match** — All interfaces in Section 20 verified against actual source files

**Last validation:** June 18, 2026 — all checks pass against Phase 15 codebase (279 tests across 49 suites + 10 E2E, `tsc --noEmit` exit 0, `eslint --max-warnings 0` exit 0).

---

*This skill file is the authoritative reference for the OneStopNews project. When this document and the actual codebase diverge, the codebase is the source of truth — update this document to match.*
