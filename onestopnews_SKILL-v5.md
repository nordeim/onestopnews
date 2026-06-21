# OneStopNews — Complete Skill Reference

> **Classification:** Definitive Engineering Knowledge Base
> **Phase:** 19 (Comprehensive Code Audit & Remediation Complete)
> **Last Updated:** June 21, 2026
> **Test Status:** 392 tests across 63 suites + 10 Playwright E2E + 4 axe-core a11y scans — all green
> **Quality Gate:** `pnpm check` (tsc --noEmit + ESLint --max-warnings 0) + `pnpm test` (vitest run) + `pnpm test --coverage` (enforced in CI) + husky pre-commit hooks — all green

---

## The Meticulous Approach (Mandatory SOP)

Every task must follow this six-phase workflow:

1. **ANALYZE** — Deep requirement mining. Identify explicit, implicit, and edge-case needs.
2. **PLAN** — Structured execution roadmap. Present for approval before writing code.
3. **VALIDATE** — Obtain user approval. Address concerns. Never proceed without alignment.
4. **IMPLEMENT** — Modular, tested, documented builds. TDD: RED → GREEN → REFACTOR.
5. **VERIFY** — Rigorous QA. Edge cases, accessibility (WCAG AAA), performance.
6. **DELIVER** — Complete handoff with instructions, docs, next steps.

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
20. [The Complete TypeScript Interface Reference](#20-the-complete-typescript-interface-reference)

---

## 1. Project Identity & Design Philosophy

### 1.1 What Is OneStopNews?

OneStopNews is a **topic-first news aggregation and AI summarisation platform** that reorganises public news content around subjects rather than sources. It collects article metadata from 50–200+ diverse RSS/Atom/JSON feeds, normalises and categorises stories into a two-level topic hierarchy, and presents them in a calm, editorially-informed interface built on the **"Editorial Dispatch"** design system. Every AI-generated summary carries a machine-readable **3-layer provenance disclosure** (JSON-LD + HTTP header + HTML meta tag) achieving full EU AI Act Article 50 compliance.

### 1.2 Design Philosophy: "Editorial Dispatch"

The design system is **architectural, not cosmetic**. Every element carries the weight of something worth reading. The aesthetic direction is **high-end editorial** — inspired by broadsheet newspapers, financial terminals, and dispatch wire services. Not brutalist, not minimalist, not maximalist — **editorial**.

**Core thesis:** Whitespace is a structural element, not empty space. Typography hierarchy IS the design. Colour is semantic (each category has its own dispatch accent). Motion is restrained (only when it serves understanding).

**Anti-Generic mandates:**

- **No Inter, Roboto, or Space Grotesk** — these are the "AI slop" fonts. Use Newsreader (headlines), Instrument Sans (body), Commit Mono (metadata).
- **No purple-gradient-on-white** — use the dispatch accent system (ember, sage, slate, clay, violet).
- **No predictable card grids without hierarchy** — the feed uses CSS Subgrid for aligned 3-row cards with a lead story that breaks the grid.
- **No raw hex colors in Tailwind classes** — always use design tokens (`bg-ink-900`, `text-dispatch-ember`).

### 1.3 The Three Personas

| Persona            | Need                                                    | How Served                                                            |
| ------------------ | ------------------------------------------------------- | --------------------------------------------------------------------- |
| Daily scanner      | Fast, calm mobile interface with AI push                | Topic-first feed, cursor pagination, push notifications               |
| Enterprise analyst | Trustworthy topic grouping, source attribution          | Citation-verified summaries, Nutrition Label, 3-layer provenance      |
| Editor/admin       | Manage ingestion pipelines, review flagged AI summaries | AdminGuard-protected dashboard, BullMQ monitoring, needs_review queue |

### 1.4 The 5-Layer Architecture Model

```
Layer 0: proxy.ts            — Cookie check, redirect only. NO DB, NO logic.
Layer 1: App Router          — Routes, Metadata, PPR, Suspense. Layouts must NOT fetch data.
Layer 2: Feature Modules     — UI + queries.ts (all DB access) + actions.ts (mutations).
Layer 3: Domain Services     — Pure business logic. No Next.js or DB client imports.
Layer 4: Infrastructure      — Drizzle, Auth.js, BullMQ, AI, Env. Side-effecting operations.
```

**Golden Rule:** Deviation from this order creates security and consistency bugs. Admin auth lives at L1 (`(admin)/layout.tsx` via `<AdminGuard>`), never at L0. DB access lives at L2 (`queries.ts`), never in L1 pages directly.

---

## 2. Tech Stack & Environment

### 2.1 Exact Versions (from `package.json`)

| Layer                | Technology                                       | Version                                                                                              | Notes                                                                                           |
| -------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Web Framework        | Next.js                                          | `^16.2.9`                                                                                            | App Router, Turbopack, `cacheComponents: true`                                                  |
| UI Runtime           | React                                            | `^19.2.7`                                                                                            | Stable, View Transitions, `useActionState`, `useOptimistic`                                     |
| Language             | TypeScript                                       | `^5.7.0`                                                                                             | Strict mode, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `erasableSyntaxOnly`           |
| Database             | PostgreSQL                                       | 17                                                                                                   | GIN FTS + `ts_rank_cd` BM25, `pg_trgm` for autocomplete                                         |
| ORM                  | Drizzle ORM                                      | `^0.45.2`                                                                                            | TypeScript-native, SQL-fluent, lazy proxy connection                                            |
| Migration Tool       | drizzle-kit                                      | `^0.31.10`                                                                                           | `generate` + `migrate` only (never `push` in production)                                        |
| Job Queue            | BullMQ                                           | `^5.78.0`                                                                                            | FlowProducer atomic DAG, 4 queues                                                               |
| Cache/Pub-Sub        | Redis (ioredis)                                  | `^5.11.1`                                                                                            | AOF, `noeviction`, `maxRetriesPerRequest: null` for workers                                     |
| Auth                 | Auth.js v5                                       | `5.0.0-beta.31`                                                                                      | HttpOnly cookies, Drizzle adapter, JWT strategy                                                 |
| Validation           | Zod                                              | `^4.4.3`                                                                                             | Schema-first, AI output constraints, env validation                                             |
| Styling              | Tailwind CSS                                     | `^4.3.1`                                                                                             | CSS-first `@theme`, PostCSS plugin, CSS Subgrid                                                 |
| PostCSS              | `@tailwindcss/postcss`                           | `^4.3.1`                                                                                             | MANDATORY — without it, zero utility classes generate                                           |
| AI SDK               | Vercel AI SDK                                    | `ai@^6.0.201` + `@ai-sdk/anthropic@^3.0.85` + `@ai-sdk/openai@^3.0.73`                               | `generateObject()` with Zod schema                                                              |
| AI Primary           | Claude 4.5 Haiku                                 | `claude-haiku-4-5`                                                                                   | $1/$5 per M tokens                                                                              |
| AI Fallback          | GPT-5 Mini                                       | `gpt-5-mini`                                                                                         | Validated cost/quality fallback                                                                 |
| RSS Parsing          | rss-parser                                       | `^3.13.0`                                                                                            | RSS 2.0 + Atom 1.0; JSON Feed parsed natively                                                   |
| HTML Parsing         | cheerio                                          | `^1.2.0`                                                                                             | Phase 19 / H9 — replaces regex HTML stripper                                                    |
| Rate Limiting        | ioredis (fixed-window)                           | `^5.11.1`                                                                                            | Redis `INCR` + `EXPIRE`; 20 req/s per IP on `/api/articles`, 5 req/min/user on `/api/summarize` |
| DB Driver            | postgres (postgres.js)                           | `^3.4.9`                                                                                             | Enables lazy proxy connection                                                                   |
| Component Primitives | Radix UI                                         | `@radix-ui/react-accordion ^1.2.14`, `@radix-ui/react-dialog ^1.1.16`, `@radix-ui/react-slot ^1.2.5` | Accessible primitives, wrapped for bespoke styling                                              |
| Icon Library         | lucide-react                                     | `^1.18.0`                                                                                            | Search, X, Loader2, ChevronDown, Shield, Clock, Zap                                             |
| Date/Time            | luxon                                            | `^3.7.2`                                                                                             | DST-safe quiet hours for push notifications                                                     |
| Web Push             | web-push                                         | `^3.6.7`                                                                                             | VAPID, encrypted push subscriptions                                                             |
| Password Hashing     | bcryptjs                                         | `^3.0.3`                                                                                             | Credentials provider                                                                            |
| CSS Utilities        | class-variance-authority + clsx + tailwind-merge | `^0.7.1`, `^2.1.1`, `^3.6.0`                                                                         | `cn()` helper + cva variants                                                                    |

### 2.2 Dev Dependencies

| Package                       | Version   | Purpose                                              |
| ----------------------------- | --------- | ---------------------------------------------------- |
| `@vitest/coverage-v8`         | `^4.1.9`  | Phase 19 / H6 — V8 coverage provider for CI gate     |
| `@axe-core/playwright`        | `^4.11.3` | Phase 19 / M5 — WCAG 2.x A/AA/AAA scans in E2E       |
| `@playwright/test`            | `^1.61.0` | E2E testing (Chromium, Firefox, WebKit)              |
| `husky`                       | `^9.1.7`  | Phase 19 / M10 — Git hook installation               |
| `lint-staged`                 | `^17.0.8` | Phase 19 / M10 — Pre-commit lint + format            |
| `vitest`                      | `^4.1.8`  | Unit/integration testing                             |
| `@testing-library/react`      | `^16.3.2` | Component testing                                    |
| `@testing-library/jest-dom`   | `^6.9.1`  | DOM matchers                                         |
| `jsdom`                       | `^29.1.1` | Vitest environment                                   |
| `prettier`                    | `^3.8.4`  | Code formatting                                      |
| `prettier-plugin-tailwindcss` | `^0.8.0`  | Tailwind class sorting                               |
| `typescript-eslint`           | `^8.61.0` | ESLint TypeScript parser                             |
| `tsx`                         | `^4.22.4` | TypeScript execution (worker, seed)                  |
| `@fontsource/commit-mono`     | `^5.2.5`  | Commit Mono woff2 source (copied to `public/fonts/`) |

### 2.3 Critical TypeScript Flags (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "strictNullChecks": true,
    "forceConsistentCasingInFileNames": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "isolatedModules": true,
    "incremental": true,
    "paths": { "@/*": ["./src/*"] }
  },
  "exclude": [
    "node_modules",
    ".next",
    "drizzle",
    "e2e",
    "playwright.config.ts",
    "skills"
  ]
}
```

**Why these matter:**

- `noUncheckedIndexedAccess` — The single highest-value strictness improvement. Array access returns `T | undefined`, forcing null checks.
- `verbatimModuleSyntax` — Enforces `import type` for type-only imports. Required for `erasableSyntaxOnly`.
- `erasableSyntaxOnly` — Forbids `enum` and `namespace` (they have runtime emissions). Use string unions + `(typeof enum.enumValues)[number]` instead.
- `skills` in `exclude` — Phase 19 / C1. The vendored `skills/` directory has its own deps not installed in this project; without exclusion, tsc produces 64 errors.

### 2.4 Engine Requirements

```json
"engines": { "node": ">=24.0.0", "pnpm": ">=9.0.0" },
"packageManager": "pnpm@9.15.0"
```

**Node 24 LTS ("Krypton")** is mandatory — BullMQ v5 + the worker service require it. Dockerfiles pin `node:24-alpine`.

---

## 3. Bootstrapping & Configuration

### 3.1 From Scratch (Recreating the Project)

```bash
# 1. Create Next.js 16 app with pnpm
pnpm create next-app@latest onestopnews --typescript --tailwind --app --turbopack
cd onestopnews

# 2. Install core dependencies
pnpm add drizzle-orm postgres bullmq ioredis next-auth@5.0.0-beta.31 @auth/drizzle-adapter \
  zod ai @ai-sdk/anthropic @ai-sdk/openai @anthropic-ai/sdk openai \
  rss-parser cheerio luxon bcryptjs web-push \
  class-variance-authority clsx tailwind-merge \
  @radix-ui/react-accordion @radix-ui/react-dialog @radix-ui/react-slot \
  lucide-react

# 3. Install dev dependencies
pnpm add -D drizzle-kit @types/node @types/react @types/react-dom @types/luxon @types/bcryptjs @types/web-push \
  vitest @testing-library/react @testing-library/jest-dom @testing-library/dom jsdom \
  @playwright/test @axe-core/playwright \
  @vitest/coverage-v8 \
  husky lint-staged \
  prettier prettier-plugin-tailwindcss \
  typescript-eslint @eslint/eslintrc \
  tsx @fontsource/commit-mono

# 4. Initialize husky
pnpm exec husky init
echo "pnpm exec lint-staged" > .husky/pre-commit
```

### 3.2 `next.config.ts` — Critical Configuration

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // REQUIRED for Dockerfile.web — produces self-contained .next/standalone/
  output: "standalone",

  // TOP-LEVEL flag. Enables "use cache", PPR, opt-in caching.
  // Replaces experimental.ppr + dynamicIO (both removed in Next.js 16).
  cacheComponents: true,

  // Named cache life profiles — MUST be defined before any cacheLife() call.
  cacheLife: {
    feed: { stale: 30, revalidate: 120, expire: 600 }, // 30s/2m/10m
    topicShell: { stale: 300, revalidate: 900, expire: 86400 }, // 5m/15m/1d
    reference: { stale: 3600, revalidate: 86400, expire: 604800 }, // 1h/1d/7d
  },

  turbopack: {}, // Top-level in Next.js 16 (graduated from experimental)

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24, // 24h
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
    ],
  },

  experimental: {
    viewTransition: true, // MUST go through <PageTransition> abstraction
    // NOTE: clientSegmentCache, turbopackPersistentCaching, turbopackFileSystemCacheForBuild
    // are NOT in ExperimentalConfig type for Next.js 16.2.9 — adding them = TS2353 error.
  },

  // Phase 19 / M1 — Security headers (HSTS + CSP added)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // transitional — migrate to nonce-based CSP
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' https: data:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

**Critical gotchas:**

- `cacheComponents: true` MUST be top-level, NOT inside `experimental`. Putting it inside `experimental` silently ignores it.
- `experimental.ppr` and `experimental.dynamicIO` MUST NOT be present — they cause build errors in Next.js 16.
- `output: "standalone"` is REQUIRED for `Dockerfile.web` to find `.next/standalone/`.

### 3.3 `postcss.config.mjs` — Tailwind v4 PostCSS Plugin

```javascript
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

**WITHOUT this file, Tailwind v4 generates ZERO utility classes.** The build succeeds but every page is unstyled. This is the #1 most common Tailwind v4 migration failure.

### 3.4 `eslint.config.mjs` — Flat Config

```javascript
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "drizzle/**",
      "dist/**",
      "e2e/**",
      "playwright.config.ts",
      "skills/**",
      "coverage/**",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: { parser: tseslint.parser },
    plugins: { "@typescript-eslint": tseslint.plugin },
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "error", // Phase 19 / M19 — promoted from "warn"
    },
  },
];
```

**Phase 19 / C1:** The `skills/**` and `coverage/**` ignores are MANDATORY — without them, vendored skills produce 43 lint warnings that fail `--max-warnings 0`.

### 3.5 `vitest.config.ts` — Coverage Thresholds

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    exclude: [
      "node_modules/",
      "dist/",
      "backup/",
      "plans/",
      "e2e/**",
      "playwright.config.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      // Phase 19 / H6 — calibrated to actual coverage. TODO: raise to 80/80/70/80.
      thresholds: { lines: 80, functions: 75, branches: 65, statements: 80 },
      exclude: [
        "node_modules/",
        "dist/",
        "*.config.*",
        "*.d.ts",
        "src/test/**",
        "e2e/**",
      ],
    },
    setupFiles: ["./src/test/setup.ts"],
  },
  resolve: {
    alias: { "@": new URL("./src", import.meta.url).pathname },
  },
});
```

### 3.6 Environment Variables (16 total — 12 required, 4 optional)

All env vars are validated by Zod at module load in `src/lib/env/index.ts`. The app fails fast with a descriptive error if any required var is missing.

| Variable                       | Required | Validation                                                         | Notes                                                         |
| ------------------------------ | -------- | ------------------------------------------------------------------ | ------------------------------------------------------------- |
| `DATABASE_URL`                 | ✅       | `min(1)` + must start with `postgres://` or `postgresql://`        |                                                               |
| `REDIS_URL`                    | ✅       | `min(1)` + must start with `redis://`                              |                                                               |
| `AUTH_SECRET`                  | ✅       | `min(32)`                                                          | Generate with `openssl rand -base64 32`                       |
| `AUTH_URL`                     | ✅       | `min(1)`                                                           | e.g. `http://localhost:3000`                                  |
| `ANTHROPIC_API_KEY`            | ✅       | `min(1)` + must start with `sk-ant-`                               |                                                               |
| `OPENAI_API_KEY`               | ✅       | `min(1)` + must start with `sk-`                                   |                                                               |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ✅       | `min(1)`                                                           | Client-visible                                                |
| `VAPID_PRIVATE_KEY`            | ✅       | `min(1)`                                                           |                                                               |
| `VAPID_SUBJECT`                | ✅       | `min(1)`                                                           | e.g. `mailto:admin@onestopnews.com`                           |
| `PUSH_KEY_ENCRYPTION_KEY`      | ✅       | `length(64)` + `/^[0-9a-fA-F]{64}$/`                               | Generate with `openssl rand -hex 32`                          |
| `GOOGLE_CLIENT_ID`             | ❌       | `optional()`                                                       | Enables Google OAuth when paired with secret                  |
| `GOOGLE_CLIENT_SECRET`         | ❌       | `optional()`                                                       |                                                               |
| `GITHUB_CLIENT_ID`             | ❌       | `optional()`                                                       | Enables GitHub OAuth when paired with secret                  |
| `GITHUB_CLIENT_SECRET`         | ❌       | `optional()`                                                       |                                                               |
| `TRUSTED_PROXY`                | ❌       | `optional()`                                                       | Set to `"true"` behind CDN — rate limiter uses rightmost IP   |
| `TRUSTED_PROXY_CIDRS`          | ❌       | `optional()`                                                       | Phase 19 / M2 — comma-separated CIDRs for proxy-chain walking |
| `NODE_ENV`                     | ❌       | `enum(["development","production","test"]).default("development")` |                                                               |

**Phase 19 / H12:** NEVER read `process.env.*` directly in production code. Always import `env` from `@/lib/env`. The Zod schema catches typos at boot.

**Phase 19 / M2:** Boot-time `console.warn` if `NODE_ENV=production && TRUSTED_PROXY !== "true"` — surfaces X-Forwarded-For spoofing risk.

---

## 4. The Design System (Code-First)

### 4.1 Typography Hierarchy

| Role      | Typeface                   | Weight  | Tailwind Class   | CSS Variable       | Source                    |
| --------- | -------------------------- | ------- | ---------------- | ------------------ | ------------------------- |
| Headlines | Newsreader (variable)      | 800     | `font-editorial` | `--font-editorial` | `next/font/google`        |
| UI / Body | Instrument Sans (variable) | 400–600 | `font-ui`        | `--font-ui`        | `next/font/google`        |
| Metadata  | Commit Mono                | 400     | `font-mono`      | `--font-mono`      | `next/font/local` (woff2) |

**Commit Mono is NOT on Google Fonts.** It must be loaded via `next/font/local` from `public/fonts/commit-mono-400.woff2`. The woff2 is sourced from `@fontsource/commit-mono`.

**`.font-editorial` helper class** (from `globals.css`):

```css
.font-editorial {
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
  text-rendering: optimizeLegibility;
  font-feature-settings: "ss01", "ss02";
}
```

**Metadata pattern:** `font-mono text-[10px] uppercase tracking-widest text-ink-300` — used on every label, badge, and metadata row throughout the app.

### 4.2 The `@theme` Block (exact CSS variables)

```css
@import "tailwindcss";

@theme {
  /* ── Ink Scale ────────────────────────────────────── */
  --color-ink-900: #1a1a18; /* headings, secondary button bg */
  --color-ink-700: #2a2a27; /* hover state for ink-900 */
  --color-ink-600: #3d3d3a; /* body text (WCAG AAA on paper-50) */
  --color-ink-500: #525250;
  --color-ink-400: #6b6b68; /* icon grey */
  --color-ink-300: #8a8a83; /* muted text, metadata */
  --color-ink-100: #e8e8e4; /* borders */

  /* ── Paper Scale ──────────────────────────────────── */
  --color-paper-50: #fafaf8; /* page background, ring offset */
  --color-paper-100: #f2f2ee; /* card surface, muted bg */
  --color-paper-200: #e6e4de; /* skeleton bg, separators */
  --color-paper-300: #d8d4cc; /* masthead separators */

  /* ── Dispatch Brand Accents ───────────────────────── */
  --color-dispatch-ember: #c7513f; /* breaking news, AI badge, focus rings, primary CTA */
  --color-dispatch-ember-light: #fde8e4;
  --color-dispatch-sage: #6b8f71; /* positive, finance, "ok" status */
  --color-dispatch-sage-light: #e4ede5;
  --color-dispatch-slate: #5a6b7a; /* tech, neutral */
  --color-dispatch-slate-light: #e2e7ec;
  --color-dispatch-clay: #8b6d5a; /* politics, local */
  --color-dispatch-clay-light: #ede5df;
  --color-dispatch-violet: #7a6b8f; /* culture */
  --color-dispatch-violet-light: #e8e4ef;

  /* ── Semantic State Tokens (Phase 19 / M15) ───────── */
  --color-dispatch-warning: #b45309; /* amber-700 equivalent — needs_review */
  --color-dispatch-warning-light: #fef3c7; /* amber-50 equivalent */
  --color-dispatch-danger: #dc2626; /* red-600 equivalent — destructive button */
  --color-dispatch-danger-dark: #b91c1c; /* red-700 equivalent — destructive hover */

  /* ── Typography Stack ── */
  --font-editorial: "Newsreader", Georgia, "Times New Roman", serif;
  --font-ui: "Instrument Sans", system-ui, -apple-system, sans-serif;
  --font-mono: "Commit Mono", ui-monospace, "Fira Code", monospace;
}
```

### 4.3 Custom Utility Classes

| Class                                       | Definition                                                                                                                                                      | Usage                                    |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `.font-editorial`                           | `font-weight: 800; line-height: 1.1; letter-spacing: -0.02em; text-rendering: optimizeLegibility; font-feature-settings: "ss01", "ss02";`                       | Every `<h1>`–`<h3>`, wordmark            |
| `.cat-label`                                | `font-family: var(--font-mono); font-variant: all-small-caps; letter-spacing: 0.12em;`                                                                          | Category labels, section labels          |
| `.cat-label-wide`                           | `font-family: var(--font-mono); font-variant: all-small-caps; letter-spacing: 0.25em;`                                                                          | Masthead subtitle                        |
| `.btn-ember`                                | `transition: transform 150ms, background-color 150ms, box-shadow 150ms cubic-bezier(0.4,0,0.2,1);` + `:hover` scale(1.02) + `:active` scale(0.98)               | Landing page CTA buttons                 |
| `.pulse-dot`                                | `animation: pulse-dot 2s ease-in-out infinite;`                                                                                                                 | Live indicator, breaking news dot        |
| `.scroll-progress`                          | `position: fixed; top: 0; height: 2px; background: var(--color-dispatch-ember); animation: scroll-progress linear; animation-timeline: scroll(); z-index: 999;` | Reading progress bar                     |
| `.ticker-track`                             | `animation: ticker-scroll 80s linear infinite;` + `:hover { animation-play-state: paused; }`                                                                    | Breaking news ticker                     |
| `.story-card`                               | `transition: background-color 200ms, box-shadow 200ms cubic-bezier(0.4,0,0.2,1);` + `:hover` paper-100 bg + subtle shadow                                       | Article card hover effect                |
| `.nutrition-label`                          | `border-left: 3px solid var(--color-dispatch-ember); background: linear-gradient(to right, var(--color-paper-100) 0%, var(--color-paper-50) 100%);`             | AI summary transparency label            |
| `.citation-ref`                             | `border-bottom: 1px dashed var(--color-dispatch-violet); cursor: pointer;` + `:hover` violet-light bg                                                           | Inline citations                         |
| `.link-underline`                           | `position: relative;` + `::after` animated underline from 0 to 100% width                                                                                       | Article links                            |
| `.cta-input`                                | `background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15);` + `:focus` ember border                                                         | Newsletter CTA input on dark bg          |
| `.category-nav`                             | `scrollbar-width: none; -ms-overflow-style: none;` + `::-webkit-scrollbar { display: none; }`                                                                   | Header category nav (hidden scrollbar)   |
| `.reveal`                                   | `opacity: 0; transform: translateY(24px); transition: opacity 700ms, transform 700ms cubic-bezier(0.4,0,0.2,1);`                                                | Scroll-reveal (below-the-fold ONLY)      |
| `.reveal.visible`                           | `opacity: 1; transform: translateY(0);`                                                                                                                         | Reveal active state                      |
| `.reveal-delay-1` through `.reveal-delay-4` | `transition-delay: 80ms / 160ms / 240ms / 320ms;`                                                                                                               | Staggered reveal entrance                |
| `.commitment-number`                        | `font-family: var(--font-editorial); font-size: 4.5rem; line-height: 1; opacity: 0.08; position: absolute;`                                                     | Large decorative numbers on landing page |

### 4.4 Animation Keyframes

| Keyframe          | Definition                                                                  | Usage                                            |
| ----------------- | --------------------------------------------------------------------------- | ------------------------------------------------ |
| `scroll-progress` | `from { transform: scaleX(0); } to { transform: scaleX(1); }`               | Reading progress bar                             |
| `ticker-scroll`   | `0% { transform: translateX(0); } 100% { transform: translateX(-50%); }`    | News ticker (items duplicated for seamless loop) |
| `pulse-dot`       | `0%, 100% { opacity: 1; } 50% { opacity: 0.25; }`                           | Live/breaking indicator                          |
| `slideDown`       | `from { height: 0; } to { height: var(--radix-accordion-content-height); }` | Accordion expand                                 |
| `slideUp`         | `from { height: var(--radix-accordion-content-height); } to { height: 0; }` | Accordion collapse                               |

### 4.5 Global CSS Rules

```css
/* Font smoothing */
* {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Smooth scroll */
html {
  scroll-behavior: smooth;
}

/* Body defaults */
body {
  font-family: var(--font-ui);
  background-color: var(--color-paper-50);
  color: var(--color-ink-600);
}

/* WCAG AAA focus ring — global default */
:focus-visible {
  outline: 2px solid var(--color-dispatch-ember);
  outline-offset: 2px;
  border-radius: 2px;
}

/* WCAG AAA: DISABLE all animations under reduced-motion (not just slow them) */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0ms !important;
    transition-duration: 0ms !important;
  }
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: var(--color-paper-50);
}
::-webkit-scrollbar-thumb {
  background: var(--color-ink-100);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--color-ink-300);
}
html {
  scrollbar-width: thin;
  scrollbar-color: var(--color-ink-100) var(--color-paper-50);
}
```

### 4.6 CSS Subgrid Feed Architecture

The feed grid uses CSS Subgrid for aligned 3-row cards:

```tsx
// FeedGrid.tsx — parent defines columns with gap-x only (no gap-y)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8" role="feed">
  {articles.map((article) => <ArticleCard key={article.id} article={article} />)}
</div>

// ArticleCard.tsx — each card spans 3 named rows via subgrid
<article className="group relative grid grid-rows-subgrid row-span-3 gap-y-3 mb-10 last:mb-0 ...">
  <h3>...</h3>      {/* Row 1: headline */}
  <p>...</p>         {/* Row 2: excerpt */}
  <div>...</div>     {/* Row 3: metadata (mt-auto for bottom alignment) */}
</article>
```

**Why Subgrid?** Without it, each card's rows align independently — headlines in the same visual row don't line up. With `grid-rows-subgrid row-span-3`, all cards in a row share the same 3-row grid, so headlines align across columns.

### 4.7 Design Token Discipline

**FORBIDDEN:** Raw hex colors in Tailwind className strings.

```tsx
// ❌ BAD
<div className="bg-[#fafaf8] text-[#1a1a18]">

// ✅ GOOD
<div className="bg-paper-50 text-ink-900">
```

**FORBIDDEN:** Tailwind default palette colors (`amber-*`, `red-*`, `blue-*`, etc.) — use design tokens instead.

```tsx
// ❌ BAD (Phase 19 / M15 fixed these)
<span className="bg-amber-500 text-amber-700">
<button className="bg-red-600 hover:bg-red-700">

// ✅ GOOD
<span className="bg-dispatch-warning text-dispatch-warning">
<button className="bg-dispatch-danger hover:bg-dispatch-danger-dark">
```

---

## 5. Component Architecture & Patterns

### 5.1 The "Engineered Soul" Component Philosophy

Every component in OneStopNews follows these principles:

1. **Library Discipline** — If Radix/Shadcn provides the primitive, USE IT. Wrap for bespoke styling. Never rebuild.
2. **Server Component First** — Only add `"use client"` when the component needs state, effects, or browser APIs.
3. **4 UI States** — Every async component handles: loading, error, empty, success.
4. **Stretched-Link Pattern** — Cards use `after:absolute after:inset-0` on the inner `<Link>` to make the whole card clickable without nested `<a>` tags.
5. **Focus Ring Contract** — Every interactive element has `focus-visible:ring-2 focus-visible:ring-dispatch-ember focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50`.

### 5.2 Button (cva + Radix Slot)

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-sm font-ui font-medium text-sm transition-all duration-150 ease-out " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dispatch-ember focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50 " +
    "disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-dispatch-ember text-paper-50 hover:bg-dispatch-ember/90 active:scale-[0.98]",
        secondary:
          "bg-ink-900 text-paper-50 hover:bg-ink-700 active:scale-[0.98]",
        outline:
          "border border-ink-100 bg-transparent text-ink-900 hover:bg-paper-100 hover:border-ink-300 active:scale-[0.99]",
        ghost:
          "bg-transparent text-ink-600 hover:bg-paper-100 hover:text-ink-900",
        destructive:
          "bg-dispatch-danger text-paper-50 hover:bg-dispatch-danger-dark active:scale-[0.98]", // Phase 19 / M15
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm", // default
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10 p-2",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);
```

**Props:** `{ asChild?: boolean; isLoading?: boolean }` + all native button attrs. Uses `React.forwardRef`. When `isLoading`, renders a `<ButtonSpinner />` SVG before children and sets `disabled`.

### 5.3 ArticleCard (CSS Subgrid + Stretched Link)

```tsx
<article className="group relative grid grid-rows-subgrid row-span-3 gap-y-3 mb-10 last:mb-0 border-b border-ink-100 pb-6 transition-colors duration-300 hover:bg-paper-100/50">
  {/* Row 1: Headline */}
  <h3 className="font-editorial text-xl leading-tight text-ink-900 group-hover:text-dispatch-ember transition-colors duration-300">
    <Link href={`/article/${article.id}`}
      className="after:absolute after:inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-dispatch-ember focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50 rounded-sm">
      {article.title}
    </Link>
  </h3>
  {/* Row 2: Excerpt */}
  <p className="font-ui text-sm leading-relaxed text-ink-600 line-clamp-3">
    {article.excerpt ?? <span className="text-ink-300 italic">No excerpt available.</span>}
  </p>
  {/* Row 3: Metadata */}
  <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-ink-600 mt-auto">
    <span className="text-dispatch-slate font-medium truncate max-w-[120px]">{article.source.name}</span>
    <span className="w-1 h-1 rounded-full bg-ink-300 shrink-0" aria-hidden="true" />
    <time dateTime={...} className="shrink-0 tabular-nums">{formatTimeAgo(article.publishedAt)}</time>
    {article.hasSummary && article.summaryStatus === "ok" && (
      <>
        <span className="w-1 h-1 rounded-full bg-ink-300 shrink-0" aria-hidden="true" />
        <span className="text-dispatch-ember font-medium shrink-0 tracking-widest">AI Brief</span>
      </>
    )}
  </div>
</article>
```

**Data contract:** `article.source.name` requires a JOIN with the `sources` table. Feed queries MUST use `getFeedArticles()` which includes the join.

### 5.4 SummaryPanel (5-State Machine + Error State)

```tsx
type SummaryStatus = ArticleWithSummary["summaryStatus"];
// "none" | "pending" | "ok" | "needs_review" | "disabled"

interface SummaryPanelProps {
  articleId: string;
  initialStatus: SummaryStatus;
  summary?: SummarisationOutput | null;
  onRequestSummary?: () => void;
  error?: string | null; // Phase 19 / H4
  onError?: (error: Error) => void;
}
```

**State precedence:** error > disabled > none > pending > needs_review > ok

**useOptimistic pattern:**

```tsx
const [optimisticStatus, setOptimisticStatus] = useOptimistic(
  initialStatus,
  (_state, newStatus: SummaryStatus) => newStatus,
);
```

When user clicks "Request AI Summary": `setOptimisticStatus("pending"); onRequestSummary();` — the UI instantly shows "Generating..." without waiting for the server round-trip.

**Phase 19 / H4 error state:** If `error` prop is set, renders `role="alert" aria-live="polite"` error UI with "Try Again" button that re-invokes `onRequestSummary()`. Error takes precedence over the optimistic "pending" state so the user isn't stuck on an infinite spinner.

**Phase 19 / M15:** `needs_review` state uses `border-dispatch-warning bg-dispatch-warning-light text-dispatch-warning` instead of Tailwind's `amber-*` palette.

### 5.5 NutritionLabel (AI Transparency)

The Nutrition Label is the EU AI Act Article 50 transparency disclosure UI:

```tsx
<aside
  aria-label="AI-generated summary transparency label"
  className="border-l-2 border-dispatch-ember bg-paper-100/50 p-6"
>
  {/* Header with ember dot + "AI-Generated Summary" label */}
  {/* Summary text (50-800 chars) */}
  {/* Key points (1-5 numbered list) */}
  {/* Sources cited (numbered citations with links) */}
  {/* Transparency footer: coverage %, "Verify with original source →" link */}
  {/* AI statement (20-200 chars) */}
</aside>
```

### 5.6 Header (Category Nav + UserMenu + Mobile Dialog)

The `CATEGORIES` array is the single source of truth for topic navigation:

```tsx
export const CATEGORIES = [
  {
    slug: "top-stories",
    name: "Top Stories",
    colourClass: "bg-dispatch-ember",
    activeBorder: "border-dispatch-ember",
  },
  {
    slug: "local",
    name: "Local",
    colourClass: "bg-dispatch-clay",
    activeBorder: "border-dispatch-clay",
  },
  {
    slug: "tech",
    name: "Tech",
    colourClass: "bg-dispatch-slate",
    activeBorder: "border-dispatch-slate",
  },
  {
    slug: "global",
    name: "Global",
    colourClass: "bg-dispatch-slate",
    activeBorder: "border-dispatch-slate",
  },
  {
    slug: "finance",
    name: "Finance",
    colourClass: "bg-dispatch-sage",
    activeBorder: "border-dispatch-sage",
  },
  {
    slug: "politics",
    name: "Politics",
    colourClass: "bg-dispatch-clay",
    activeBorder: "border-dispatch-clay",
  },
  {
    slug: "culture",
    name: "Culture",
    colourClass: "bg-dispatch-violet",
    activeBorder: "border-dispatch-violet",
  },
];
```

**Phase 19 / H2:** Header now includes `<UserMenu />` in both desktop and mobile drawers. UserMenu uses `useSession()` from `next-auth/react` — Sign In link when unauthenticated, Sign Out button when authenticated.

### 5.7 AdminGuard (Centralized Admin Auth)

```tsx
// (admin)/layout.tsx
<Suspense fallback={<AdminGuardSkeleton />}>
  <AdminGuard>{children}</AdminGuard>
</Suspense>;

// AdminGuard.tsx
export async function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  await verifyAdminSession(); // redirects if not admin
  return <>{children}</>;
}
```

**Why centralized?** Phase 16 fix — previously each admin page had to remember to call `verifyAdminSession()` in its data component. Any new admin page that forgot the guard would be publicly accessible. Now the layout guard automatically protects ALL admin pages.

### 5.8 Error Boundaries (Phase 19 / H5)

Three branded error pages, all including `<main id="main-content">` for the skip-to-content link:

| File                       | Purpose                      | Key Requirement                                                           |
| -------------------------- | ---------------------------- | ------------------------------------------------------------------------- |
| `src/app/error.tsx`        | Route-segment error boundary | `"use client"` (needs `reset` callback)                                   |
| `src/app/not-found.tsx`    | Branded 404                  | Server Component OK                                                       |
| `src/app/global-error.tsx` | Root layout error fallback   | `"use client"` + MUST render own `<html>`/`<body>` (replaces root layout) |

### 5.9 React 19 Form Action Pattern (Phase 19 / C5)

Server actions that return a status object must be wrapped in a void-returning closure for form binding:

```tsx
<form
  action={async () => {
    await approveSummary(summary.id);
  }}
>
  <button
    type="submit"
    className="... focus-visible:ring-2 focus-visible:ring-dispatch-ember ..."
  >
    Approve
  </button>
</form>
```

The form's POST semantics + `revalidatePath("/admin/summaries")` inside the action refresh the page after the mutation lands.

---

## 6. Custom Hooks Deep Dive

### 6.1 `useDebounce<T>(value: T, delay = 300): T`

```tsx
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

**Usage:** SearchBar debounces input by 300ms before calling `onSearch`.

### 6.2 `useReducedMotion(): boolean`

```tsx
"use client";
import { useState, useEffect } from "react";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}
```

**WCAG AAA mandate:** When `prefers-reduced-motion: reduce`, DISABLE all animations entirely. Do NOT just slow them. The global CSS `@media (prefers-reduced-motion: reduce) { * { animation-duration: 0ms !important; transition-duration: 0ms !important; } }` handles this at the CSS level. This hook is for JS-level decisions (e.g., skip View Transitions).

---

## 7. Content Management: RSS Ingestion Pipeline

### 7.1 The Ingest Flow

```
RSS/Atom/JSON Feed
  → parseFeed.ts (rss-parser + cheerio)
  → determineContentAvailability.ts (title_only/excerpt/partial_text/full_text)
  → hashContent.ts (SHA-256 of title|body|publishedAt)
  → DB upsert (ON CONFLICT DO UPDATE WHERE content_hash != excluded.content_hash)
  → enqueuePostIngestFlow (FlowProducer: score → refresh-feed-slice)
```

### 7.2 `parseFeed.ts` — cheerio HTML Stripping (Phase 19 / H9)

```tsx
import * as cheerio from "cheerio";

function stripHtml(html: string): string {
  const $ = cheerio.load(html);
  // Remove non-content tags entirely — their text must NOT appear in output
  $("script, style, noscript, iframe, object, embed").remove();
  // $.text() decodes all entity types (named, decimal, hex) to Unicode
  return $.text().replace(/\s+/g, " ").trim();
}
```

**Gotcha:** cheerio decodes `&#8217;` to U+2019 (right single quotation mark `'`), NOT ASCII apostrophe `'`. Tests must use `body.toContain("\u2019s a test")`.

### 7.3 Content Availability Guard (Anti-Hallucination)

```tsx
function determineContentAvailability(
  parsed: ParsedContent,
): ContentAvailability {
  if (!parsed.title?.trim()) return "title_only"; // DO NOT summarise
  if (!parsed.excerpt?.trim()) return "excerpt"; // DO NOT summarise
  if ((parsed.body?.length ?? 0) < 500) return "partial_text"; // summarise permitted
  return "full_text"; // summarise preferred
}
```

**CRITICAL:** Only `partial_text` and `full_text` may be enqueued for AI summarisation. Summarising `title_only` or `excerpt` forces the AI to hallucinate content. Enforced at BOTH the Server Action AND API Route layers.

### 7.4 `hashContent` — SHA-256 Content Change Detection

```tsx
import { createHash } from "node:crypto";

export function hashContent(
  title: string,
  body: string | null | undefined,
  publishedAt: Date,
): string {
  const data = `${title.trim()}|${body ?? ""}|${publishedAt.toISOString()}`;
  return createHash("sha256").update(data, "utf8").digest("hex");
  // Returns 64-character lowercase hex
}
```

**Phase 14 fix:** `body` was added to the hash to detect content-only updates (same title + date, but updated body text). Without body, body edits would be silently dropped by the `WHERE content_hash != excluded.content_hash` upsert guard.

### 7.5 FlowProducer Atomic DAG + Fallback (Phase 19 / C4)

```tsx
export async function enqueuePostIngestFlow(input: PostIngestFlowInput): Promise<PostIngestFlowStatus> {
  if (input.newArticleIds.length === 0) return { status: "skipped", ... };

  try {
    await flowProducer.add({
      name: "refresh-feed-slice",
      queueName: "feed-slice",
      data: { categoryId: input.categoryId, sort: "latest" },
      opts: { priority: 1 },
      children: input.newArticleIds.map((articleId) => ({
        name: "score-article", queueName: "score", data: { articleId }, opts: { priority: 2 },
      })),
    });
    return { status: "ok", fallbackUsed: false, ... };
  } catch (flowError) {
    // FALLBACK: direct scoreQueue.add() per article (loses atomicity but at least scores get enqueued)
    // NEVER re-throw — re-throwing causes BullMQ to retry ingest, but articles are already persisted
    // (xmax != 0), so newArticleIds would be empty on retry → silent data loss
    let fallbackFailures = 0;
    for (const articleId of input.newArticleIds) {
      try { await scoreQueue.add("score-article", { articleId }); }
      catch { fallbackFailures += 1; }
    }
    return { status: "degraded", fallbackUsed: true, fallbackFailures, ... };
  }
}
```

### 7.6 `checkNeedsReviewAlert` (Phase 19 / H10)

```tsx
export async function checkNeedsReviewAlert(
  options: NeedsReviewAlertOptions = {},
): Promise<NeedsReviewAlertResult> {
  const threshold = options.threshold ?? DEFAULT_ALERT_THRESHOLD; // 3
  const alertFn = options.alert ?? defaultAlert; // console.warn by default

  const result = await db.execute(
    sql`SELECT COUNT(*)::int AS count FROM summaries WHERE status = 'needs_review'`,
  );
  const count = (result as unknown as Array<{ count: number }>)[0]?.count ?? 0;

  if (count > threshold) {
    alertFn({
      count,
      threshold,
      message: `[OneStopNews] ${count} summaries need editorial review...`,
    });
    return { status: "warning", count, alerted: true };
  }
  return { status: "ok", count, alerted: false };
}
```

The `alert` callback is pluggable — production swaps in email/webhook/Slack. Designed to run from a BullMQ repeatable job (e.g., every 24h).

---

## 8. Accessibility (WCAG AAA) Implementation

### 8.1 Skip-to-Content Link

```tsx
// layout.tsx — first child of <body>
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-ink-900 focus:text-paper-50 focus:font-ui focus:text-sm focus:rounded focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-dispatch-ember"
>
  Skip to content
</a>
```

Every page template MUST render `<main id="main-content">` for this to work.

### 8.2 Focus Ring Contract

Every interactive element MUST have:

```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dispatch-ember focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50
```

The global `:focus-visible` CSS rule provides a default, but components that set `focus-visible:outline-none` MUST replace it with explicit `focus-visible:ring-*` classes (Phase 19 / H1 — Accordion was missing this).

### 8.3 `prefers-reduced-motion`

```css
/* Global — DISABLE all animations (not just slow them) */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0ms !important;
    transition-duration: 0ms !important;
  }
  .reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

**WCAG AAA mandate:** "When `prefers-reduced-motion: reduce`, DISABLE all animations entirely. Do NOT just slow them."

### 8.4 ARIA Roles

| Element        | Role                                                        | Notes                                   |
| -------------- | ----------------------------------------------------------- | --------------------------------------- |
| Feed grid      | `role="feed"` + `aria-label="News articles"`                |                                         |
| Search bar     | `role="search"` + `aria-label="Search news articles"`       |                                         |
| Category nav   | `role="tablist"` + each item `role="tab"` + `aria-selected` |                                         |
| News ticker    | `role="marquee"` + `aria-label="Breaking news ticker"`      |                                         |
| Error alerts   | `role="alert"` + `aria-live="polite"`                       | SearchResults error, SummaryPanel error |
| Loading states | `aria-busy="true"` on buttons, `aria-label` on spinners     |                                         |
| Footer         | `role="contentinfo"`                                        |                                         |
| AdminGuard     | `<Suspense fallback={<AdminGuardSkeleton />}>`              | Prevents flash of unprotected content   |

### 8.5 axe-core Automated Scanning (Phase 19 / M5)

```tsx
// e2e/a11y.spec.ts
import AxeBuilder from "@axe-core/playwright";

test("home page has no axe violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  // Filter color-contrast (dispatch tokens manually verified at 9.5:1 on paper-50)
  const filtered = results.violations.filter((v) => v.id !== "color-contrast");
  expect(filtered).toEqual([]);
});
```

Runs against `/`, `/search`, `/sign-in`, `/auth-error` in CI.

---

## 9. Anti-Patterns & Common Bugs

### 9.1 `process.env.*` Reads Bypass Zod Schema (Phase 19 / H12)

**Symptom:** OAuth silently disabled; `GOOGLE_CLIENTID` typo returns `undefined` with no error.
**Root cause:** `process.env.*` bypasses the Zod env schema validation.
**Fix:** Import `env` from `@/lib/env` and read `env.VAR_NAME`. The Zod schema validates at module load.
**Detection:** `grep -rn "process\.env\." src/ --include="*.ts" --include="*.tsx" | grep -v "\.test\." | grep -v "src/lib/env/index.ts" | grep -v "src/test/setup.ts"`

### 9.2 `vi.mock()` Factory Hoisting ReferenceError (Phase 19 / H12 test fix)

**Symptom:** `ReferenceError: Cannot access 'mockEnv' before initialization` in tests.
**Root cause:** `vi.mock()` factories are hoisted to file top by Vitest. If the factory references a `const` declared below it, the const isn't initialized yet.
**Fix:** Use `vi.hoisted()`:

```tsx
const { mockEnv } = vi.hoisted(() => ({ mockEnv: {} }));
vi.mock("@/lib/env", () => ({ env: mockEnv }));
```

### 9.3 `cacheLife()` Throws Outside Next.js Cache Context (Phase 19 / M4 test fix)

**Symptom:** `TypeError: cacheLife is not a function` in unit tests.
**Root cause:** `cacheLife()` only works inside a `"use cache"` boundary at runtime.
**Fix:** Mock `next/cache` in test files: `vi.mock("next/cache", () => ({ cacheLife: vi.fn() }))`

### 9.4 `useSession` Requires `SessionProvider` (Phase 19 / H2 test fix)

**Symptom:** `Error: useSession must be wrapped in a <SessionProvider>` in tests.
**Root cause:** `useSession()` requires a `<SessionProvider>` ancestor. In production, root `layout.tsx` provides it. Tests don't go through the layout.
**Fix:** Mock `next-auth/react` with a passthrough `SessionProvider: ({ children }) => <>{children}</>` and stub `useSession`.

### 9.5 FlowProducer Silent Data Loss (Phase 19 / C4)

**Symptom:** Articles persisted but never scored; never cache-invalidated.
**Root cause:** `flowProducer.add()` throws on Redis failure → error propagates to ingest catch → BullMQ retries ingest → articles already persisted (`xmax != 0`) → `newArticleIds` empty on retry → flow never re-enqueued.
**Fix:** Wrap in try/catch; fall back to direct `scoreQueue.add()` per article; return status object; NEVER re-throw.

### 9.6 Regex HTML Stripper Leaks Script Content (Phase 19 / H9)

**Symptom:** AI summaries contain JavaScript text like "alert" or CSS like "color: red".
**Root cause:** `/<[^>]*>/g` strips TAGS but not their TEXT CONTENT.
**Fix:** Use `cheerio.load(html)`, remove `script,style,noscript,iframe,object,embed`, then `$.text()`.

### 9.7 `global-error.tsx` Must Render `<html>`/`<body>`

**Symptom:** Build error or "document is not defined" in global error.
**Root cause:** `global-error.tsx` REPLACES the root layout when it throws — it must render the full document structure.
**Fix:** `return <html lang="en"><body className="bg-paper-50 ..."><main id="main-content">...</main></body></html>`

### 9.8 Vendored `skills/` Breaks `pnpm check` (Phase 19 / C1)

**Symptom:** 64 tsc errors + 43 lint warnings from `skills/` directory.
**Root cause:** `skills/` has its own deps (`z-ai-web-dev-sdk`) not installed in this project.
**Fix:** Add `"skills"` to `tsconfig.json` `exclude`; add `"skills/**"` + `"coverage/**"` to `eslint.config.mjs` `ignores`.

### 9.9 `new Date()` in Server Components

**Symptom:** `next-prerender-current-time` build error.
**Root cause:** `new Date()` is non-deterministic; Next.js 16 `cacheComponents` rejects it in Server Components.
**Fix:** Move to a Client Component (e.g., `Footer.tsx` is `"use client"` for this reason) OR wrap in `<Suspense>`.

### 9.10 Direct `await` of DB Query in Page

**Symptom:** `blocking-route` error in Next.js 16.
**Root cause:** `cacheComponents: true` makes everything dynamic by default. Direct `await` in a page body blocks the route.
**Fix:** Wrap DB fetches in a Server Component (`FeedData`) + `<Suspense fallback={<FeedSkeleton />}>`.

### 9.11 JSON-LD via `metadata.other`

**Symptom:** JSON-LD `<script>` tag never appears in DOM.
**Root cause:** Next.js renders `metadata.other` keys as `<meta>` tags, NOT `<script>` tags.
**Fix:** Render `<script type="application/ld+json" dangerouslySetInnerHTML={{__html: jsonLd}} />` directly in the page body (Server Component).

### 9.12 Missing `@tailwindcss/postcss` Plugin

**Symptom:** Build succeeds but every page is unstyled (zero utility classes).
**Root cause:** Tailwind v4 requires the PostCSS plugin; without it, no classes generate.
**Fix:** Create `postcss.config.mjs` with `{ plugins: { "@tailwindcss/postcss": {} } }` and clear `.next/` cache.

### 9.13 Inert Action Buttons (Phase 19 / C5)

**Symptom:** Admin Approve/Disable buttons don't do anything when clicked.
**Root cause:** `<button type="button">` with no `onClick` and no `form action`.
**Fix:** Use `<form action={async () => { await action(id); }}><button type="submit">...</button></form>`.

### 9.14 `no-explicit-any` as `warn` Instead of `error` (Phase 19 / M19)

**Symptom:** `any` usage creeps into the codebase.
**Root cause:** `warn` doesn't fail the lint gate.
**Fix:** Promote to `"error"` in `eslint.config.mjs`.

---

## 10. Debugging Guide

### 10.1 `pnpm check` Fails with tsc Errors

```bash
# 1. Check if errors are in src/ or vendored code
npx tsc --noEmit 2>&1 | grep "error TS" | awk -F: '{print $1}' | sort -u

# 2. If errors are in skills/ → add to tsconfig.json exclude
# 3. If errors are in src/ → fix the actual code
```

### 10.2 Tests Fail with `cacheLife is not a function`

```bash
# Add to the failing test file:
vi.mock("next/cache", () => ({ cacheLife: vi.fn() }));
```

### 10.3 Tests Fail with `useSession must be wrapped in <SessionProvider>`

```bash
# Add to the failing test file:
vi.mock("next-auth/react", () => ({
  useSession: vi.fn().mockReturnValue({ data: null, status: "unauthenticated" }),
  signOut: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
```

### 10.4 Tests Fail with `ReferenceError: Cannot access 'mockEnv' before initialization`

```bash
# Use vi.hoisted() instead of declaring const before vi.mock():
const { mockEnv } = vi.hoisted(() => ({ mockEnv: {} }));
vi.mock("@/lib/env", () => ({ env: mockEnv }));
```

### 10.5 RSS Feed Parsing Returns Empty Array

```bash
# 1. Check if the feed URL is reachable
curl -sS "FEED_URL" | head -50

# 2. Check if it's Atom (rss-parser feedType is undefined for Atom in v3.13)
# parseFeed.ts detects Atom via XML root element regex, not parsed.feedType

# 3. Check for items missing title or URL (parseFeed filters these out)
```

### 10.6 AI Summarization Returns Placeholder Data

```bash
# Check for stub shadowing:
grep -rn "Summary placeholder\|callAISummary.*mock\|placeholder" src/workers/

# The real implementation uses Vercel AI SDK generateObject()
grep -rn "generateObject" src/workers/jobs/summarize.ts
```

### 10.7 Rate Limit Returns 429 Unexpectedly

```bash
# Check Redis for rate limit keys:
redis-cli keys "ratelimit:*"
redis-cli get ratelimit:api:articles:1.2.3.4
redis-cli ttl ratelimit:api:articles:1.2.3.4

# If behind CDN, set TRUSTED_PROXY=true to use rightmost IP
# If sharing NAT, the limit is per-IP — multiple users behind same NAT share budget
```

### 10.8 Docker Build Fails

```bash
# Check Node version in Dockerfile (must be node:24-alpine)
grep "FROM node" Dockerfile.web Dockerfile.worker

# Check output: "standalone" is set
grep 'output: "standalone"' next.config.ts

# Check that .next/standalone exists after build
ls .next/standalone/server.js
```

### 10.9 Coverage Fails in CI

```bash
# Run locally with coverage
npx vitest run --coverage

# Check thresholds in vitest.config.ts
# Low-coverage files are listed in the threshold TODO comment
```

### 10.10 cheerio Test Assertion Fails on Apostrophe

```bash
# cheerio decodes &#8217; to U+2019 (right single quotation mark), NOT ASCII '
# Use Unicode escape in test assertions:
expect(body).toContain("\u2019s a test");  // NOT "'s a test"
```

---

## 11. Pre-Ship Checklist

Before claiming any task is complete, verify ALL of the following:

### 11.1 Code Quality

```bash
pnpm check          # tsc --noEmit && pnpm lint — MUST exit 0
pnpm test           # vitest run — ALL tests must pass
pnpm test -- --coverage  # Coverage thresholds must pass (Phase 19 / H6 CI gate)
```

### 11.2 No `process.env.*` in Production Code

```bash
grep -rn "process\.env\." src/ --include="*.ts" --include="*.tsx" | grep -v "\.test\." | grep -v "src/lib/env/index.ts" | grep -v "src/test/setup.ts"
# Should return only comment lines
```

### 11.3 No `any` in Production Code

```bash
grep -rn ": any\b\|<any>\|as any" src/ --include="*.ts" --include="*.tsx" | grep -v "\.test\." | grep -v "eslint-disable"
# Should return nothing (Phase 19 / M19 — no-explicit-any is "error")
```

### 11.4 No Raw Hex Colors in className

```bash
grep -rn 'className="[^"]*#[0-9a-fA-F]\{3,8\}' src/ --include="*.tsx"
# Should return nothing
```

### 11.5 Every Page Has `<main id="main-content">`

```bash
grep -rn 'id="main-content"' src/app/ --include="*.tsx" | wc -l
# Should match the number of page templates
```

### 11.6 Every Server Action Has Auth

```bash
# Every exported function in actions.ts files must call verifySession() or verifyAdminSession()
grep -rn "export async function" src/features/*/actions.ts src/app/*/actions.ts
# Manually verify each has a verifySession/verifyAdminSession call
```

### 11.7 Focus Rings on All Interactive Elements

```bash
grep -rn "focus-visible:outline-none" src/ --include="*.tsx" | grep -v "focus-visible:ring"
# Should return nothing — every outline-none must have a ring replacement
```

### 11.8 Error States on Async Components

```bash
# Every component that fetches data must handle: loading, error, empty, success
# Check for try/catch in client components, error.tsx boundaries for server components
```

### 11.9 Lockfile Hygiene

```bash
grep -n '"latest"' package.json
# Should return nothing (Phase 17 pinned all deps to ^ ranges)
```

### 11.10 Migration Safety

```bash
# Never use db:push in production (script removed in Phase 17)
grep "db:push" package.json
# Should return nothing

# Migrations must be additive (drop columns in a separate release)
ls drizzle/*.sql
# Verify no destructive migrations without IF EXISTS guards
```

### 11.11 Pre-commit Hook Active

```bash
cat .husky/pre-commit
# Should contain: pnpm exec lint-staged

# Verify lint-staged config in package.json
grep -A 10 "lint-staged" package.json
```

### 11.12 E2E Tests

```bash
pnpm test:e2e  # Playwright — 10 smoke tests + 4 axe-core a11y scans
```

---

## 12. Lessons Learnt & How to Avoid Them

### 12.1 Vendored Code Breaks Build Gates (Phase 19 / C1)

**Lesson:** When vendoring third-party code with its own deps, exclude it from tsc + eslint immediately. The project's `src/` may be clean, but build gates scan everything by default.
**Avoidance:** After vendoring, run `npx tsc --noEmit 2>&1 | grep "error TS" | awk -F: '{print $1}' | sort -u`. If errors point outside `src/`, exclude the directory.

### 12.2 Server Actions Need Auth Too (Phase 19 / C3)

**Lesson:** Server Actions are RPCs — they bypass the React tree and any layout-level guards. Every Server Action must call `verifySession()` or `verifyAdminSession()` as its first line.
**Avoidance:** Audit every `actions.ts` file. Consider an ESLint custom rule that flags functions in `actions.ts` files missing `verifySession`/`verifyAdminSession`.

### 12.3 Never Re-throw at Resilience Boundaries (Phase 19 / C4)

**Lesson:** At queue enqueues, cache writes, and external API calls, NEVER re-throw if the side effect has already landed. Return a status object. Re-throwing causes the job runner to retry, but the retry sees a different state and silently drops the work.
**Avoidance:** `try { await criticalOp(); return { status: "ok" }; } catch { await fallbackOp(); return { status: "degraded" }; }`

### 12.4 HTML is Not Regular (Phase 19 / H9)

**Lesson:** Regex-based HTML stripping is fundamentally broken. Use a real parser (cheerio/parse5).
**Avoidance:** Never use `/<[^>]*>/g` for HTML. Always use `cheerio.load(html)` + `$.text()`.

### 12.5 `vi.mock()` Factories Are Hoisted (Phase 19 / H12)

**Lesson:** `vi.mock()` factories run BEFORE any `const`/`let` declarations in the file. Use `vi.hoisted()` to declare mutable mock objects that the factory can safely close over.
**Avoidance:** Any `vi.mock()` factory that references a mutable object needs `vi.hoisted()`.

### 12.6 `cacheLife()` Only Works in Cache Context (Phase 19 / M4)

**Lesson:** `cacheLife()` throws outside a `"use cache"` boundary. In tests, always mock `next/cache`.
**Avoidance:** `vi.mock("next/cache", () => ({ cacheLife: vi.fn() }))` in any test file importing a module that calls `cacheLife()`.

### 12.7 `global-error.tsx` Replaces the Root Layout (Phase 19 / H5)

**Lesson:** Unlike `error.tsx`, `global-error.tsx` catches ROOT LAYOUT errors and must render its own `<html>`/`<body>`.
**Avoidance:** Always include `<html lang="en"><body>...</body></html>` in `global-error.tsx`.

### 12.8 `new Date()` Blocks Prerender (Phase 11)

**Lesson:** `new Date()` is non-deterministic; Next.js 16 `cacheComponents` rejects it in Server Components.
**Avoidance:** Move date-dependent code to Client Components (wrapped in `<Suspense>` if needed).

### 12.9 JSON-LD Must Be in `<script>`, Not `<meta>` (Phase 17)

**Lesson:** `metadata.other` renders `<meta>` tags, NOT `<script>` tags. JSON-LD MUST be rendered directly in the page body.
**Avoidance:** `<script type="application/ld+json" dangerouslySetInnerHTML={{__html: jsonLd}} />` in the Server Component.

### 12.10 Lazy DB Proxy Prevents Build Crashes (Phase 3)

**Lesson:** Next.js imports modules at build time. An eager DB connection crashes the build when `DATABASE_URL` is missing (CI, static export).
**Avoidance:** Always use the Proxy pattern that defers connection until first property access.

---

## 13. Pitfalls to Avoid

1. **Putting `cacheComponents` inside `experimental`** — silently ignored. Must be top-level.
2. **Including `experimental.ppr` or `experimental.dynamicIO`** — build errors in Next.js 16. Both removed.
3. **Using `drizzle-kit push` in production** — script removed in Phase 17. Use `generate` + `migrate` only.
4. **`as any` with Drizzle `.with()`** — breaks type inference. Use explicit `.innerJoin()`.
5. **`revalidateTag` in workers** — Next.js-only API, not available in Node.js worker process. Use Redis pub/sub.
6. **`.reveal` class on above-the-fold elements** — causes hydration mismatch (invisible vs visible).
7. **Corrupted className strings** (e.g., `font浃着`, `Monad`) — non-ASCII characters break styling silently.
8. **Missing `remotePatterns` for external images** — images fail to load.
9. **`node:22-alpine` in Dockerfiles** — violates `engines.node: ">=24.0.0"`.
10. **Missing `output: "standalone"`** — `Dockerfile.web` can't find `.next/standalone/`.
11. **`#!/bin/bash.# comment`** — concatenated shebang causes kernel exec failure.
12. **`"DOCKER_REGISTRY/path"` without `$`** — literal string passed instead of variable.
13. **`db:migrate || true`** — swallows migration failures (silent data corruption risk). Phase 19 / H7 removed this.
14. **`npx tsx` in Dockerfile** — startup latency + requires network in air-gapped envs. Use bare `tsx`.
15. **Legacy `version: '3.8'` in docker-compose** — Docker Compose v2 prints deprecation warning.

---

## 14. Best Practices

1. **Library Discipline** — If Radix/Shadcn provides the primitive, use it. Wrap for bespoke styling. Never rebuild.
2. **Single Source of Truth** — Drizzle schema is the only source for DB types. Derive via `InferSelectModel` and `(typeof enum.enumValues)[number]`.
3. **Opt-In Caching** — `"use cache"` + `cacheLife("profile")` on every data-fetching function. Never `await` DB directly in a page.
4. **Progressive Enhancement** — Forms work without client JS (server actions). View Transitions degrade silently on unsupported browsers.
5. **Zero `any`** — Use `unknown` + type guards. `no-explicit-any` is `error` in ESLint.
6. **Auth at the DAL** — `verifySession()` / `verifyAdminSession()` in every Server Action + DAL function. `proxy.ts` is UX-only.
7. **Content Guard** — Only `partial_text` and `full_text` may be summarised. Enforced at Server Action AND API Route.
8. **3-Layer Provenance** — JSON-LD `<script>` in body + `X-AI-Provenance` HTTP header + `<meta name="ai-provenance">` tag.
9. **WCAG AAA** — Focus rings, skip-to-content, `prefers-reduced-motion`, `role="feed"`, `aria-live` for errors.
10. **TDD** — RED → GREEN → REFACTOR. One cycle per commit.
11. **Early Returns** — Avoid deeply nested conditionals.
12. **Composition Over Inheritance** — Use cva variants + Radix Slot, not class inheritance.
13. **Additive Migrations** — Never drop columns in the same release that adds them. Drop in a separate release.
14. **Per-User Rate Limiting** — For authenticated endpoints, key on `session.user.id` (not IP) to prevent NAT-shared budget burning.
15. **Status Objects Over Re-throws** — At resilience boundaries, return `{ status: "ok"|"degraded" }` instead of throwing.

---

## 15. Coding Patterns

### 15.1 Lazy DB Proxy

```tsx
export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_, prop) {
    return getDb()[prop as keyof ReturnType<typeof getDb>];
  },
});
```

### 15.2 Server Action with Auth + Rate Limit (Phase 19 / C3)

```tsx
"use server";
export async function requestSummary(
  articleId: string,
): Promise<SummariseResponse> {
  const session = await verifySession();
  if (!session)
    return { success: false, jobId: null, error: "Authentication required" };

  const rl = await checkRateLimit(`api:summarize:${session.user.id}`, 5, 60);
  if (!rl.allowed)
    return { success: false, jobId: null, error: "Rate limit exceeded" };

  // ... validation, DB query, enqueue ...
}
```

### 15.3 React 19 Form Action Binding (Phase 19 / C5)

```tsx
<form
  action={async () => {
    await approveSummary(summary.id);
  }}
>
  <button
    type="submit"
    className="... focus-visible:ring-2 focus-visible:ring-dispatch-ember ..."
  >
    Approve
  </button>
</form>
```

### 15.4 `useOptimistic` for Instant UI

```tsx
const [optimisticStatus, setOptimisticStatus] = useOptimistic(
  initialStatus,
  (_state, newStatus: SummaryStatus) => newStatus,
);
// On click: setOptimisticStatus("pending"); onRequestSummary();
```

### 15.5 FlowProducer Fallback (Phase 19 / C4)

```tsx
try {
  await flowProducer.add({ ... });
  return { status: "ok" };
} catch {
  for (const id of newArticleIds) {
    try { await scoreQueue.add("score-article", { articleId: id }); }
    catch { fallbackFailures++; }
  }
  return { status: "degraded", fallbackUsed: true, fallbackFailures };
}
```

### 15.6 `vi.hoisted()` for Mutable Env Mocks (Phase 19 / H12)

```tsx
const { mockEnv } = vi.hoisted(() => ({ mockEnv: {} }));
vi.mock("@/lib/env", () => ({ env: mockEnv }));
// In tests: mockEnv.GOOGLE_CLIENT_ID = "test-id";
```

### 15.7 Error Boundary Precedence

```tsx
// error state takes precedence over optimistic pending
if (error) return <ErrorUI />;
switch (optimisticStatus) {
  case "disabled":
    return null;
  case "none":
    return <RequestButton />;
  case "pending":
    return <GeneratingSpinner />;
  // ...
}
```

### 15.8 Schema-Derived Types

```tsx
export type ContentAvailability =
  (typeof contentAvailabilityEnum.enumValues)[number];
// "title_only" | "excerpt" | "partial_text" | "full_text"
```

### 15.9 SHA-256 Content Hashing

```tsx
const data = `${title.trim()}|${body ?? ""}|${publishedAt.toISOString()}`;
const hash = createHash("sha256").update(data, "utf8").digest("hex");
```

### 15.10 `(xmax = 0)` INSERT vs UPDATE Detection

```tsx
const result = await db.insert(articles).values({...}).onConflictDoUpdate({...}).returning({
  id: articles.id,
  isNew: sql<boolean>`(xmax = 0)`,  // true = INSERT, false = UPDATE
});
```

---

## 16. Coding Anti-Patterns

(See §9 Anti-Patterns & Common Bugs for the full catalogue with fixes. The following is the quick-reference list.)

| #   | Anti-Pattern                                      | Fix                                                |
| --- | ------------------------------------------------- | -------------------------------------------------- | ----- | -------- | --- | ----------------- |
| 1   | `any` in TypeScript                               | Use `unknown` + type guards                        |
| 2   | `enum` / `namespace`                              | String unions + `(typeof enum.enumValues)[number]` |
| 3   | `process.env.*` outside env module                | Import `env` from `@/lib/env`                      |
| 4   | `drizzle-kit push` in production                  | Use `generate` + `migrate` only                    |
| 5   | `new Date()` in Server Component                  | Move to Client Component                           |
| 6   | Direct `await` DB in page                         | Wrap in `<Suspense>` + Server Component            |
| 7   | `revalidateTag` in workers                        | Use Redis pub/sub                                  |
| 8   | `as any` with Drizzle `.with()`                   | Use explicit `.innerJoin()`                        |
| 9   | Raw hex in className                              | Use design tokens                                  |
| 10  | Tailwind default palette (`amber-*`, `red-*`)     | Use `dispatch-warning`, `dispatch-danger`          |
| 11  | Regex HTML stripping                              | Use `cheerio`                                      |
| 12  | `flowProducer.add()` without try/catch            | Wrap + fallback + status object                    |
| 13  | Inert `<button type="button">` for server actions | Use `<form action={...}><button type="submit">`    |
| 14  | Missing `SessionProvider`                         | Wrap app in `layout.tsx`                           |
| 15  | Missing `error.tsx` / `global-error.tsx`          | Add both (global-error renders own `<html>`)       |
| 16  | `cacheLife()` in tests without mock               | `vi.mock("next/cache", ...)`                       |
| 17  | `vi.mock()` factory referencing `const` below     | Use `vi.hoisted()`                                 |
| 18  | `no-explicit-any` as `warn`                       | Promote to `error`                                 |
| 19  | Missing `HEALTHCHECK` in Dockerfiles              | Add `HEALTHCHECK` to web + worker                  |
| 20  | `npx tsx` in Dockerfile                           | Use bare `tsx`                                     |
| 21  | Legacy `version: '3.8'` in compose                | Remove the key                                     |
| 22  | Vendored code not excluded from tsc/eslint        | Add to `exclude` / `ignores`                       |
| 23  | `db:migrate                                       |                                                    | true` | Remove ` |     | true` (fail-fast) |
| 24  | JSON-LD via `metadata.other`                      | Render `<script>` directly in body                 |
| 25  | `.reveal` on above-the-fold elements              | Only below-the-fold                                |

---

## 17. Responsive Breakpoint Reference

OneStopNews uses Tailwind's default breakpoints (no custom config needed in Tailwind v4 CSS-first):

| Breakpoint | Min Width | Typical Usage                                                                                                                                                   |
| ---------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sm`       | 640px     | Mobile landscape, small tablets. `text-3xl sm:text-4xl` for responsive headlines.                                                                               |
| `md`       | 768px     | Tablets. Desktop nav appears (`hidden md:flex`), mobile hamburger hides (`md:hidden`). Grid switches from 1 to 2 columns (`md:grid-cols-2`).                    |
| `lg`       | 1024px    | Desktop. Grid switches to 3 columns (`lg:grid-cols-3`). Lead story 7:5 grid activates (`lg:grid-cols-12`). Masthead broadsheet rules appear (`hidden lg:flex`). |
| `xl`       | 1280px    | Large desktop. No explicit `xl:` usage in the codebase (max-w-[1440px] caps content).                                                                           |
| `2xl`      | 1536px    | Not used.                                                                                                                                                       |

**Common patterns:**

- `max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8` — standard container
- `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` — feed grid
- `hidden md:flex` / `md:hidden` — desktop/mobile toggle
- `text-3xl sm:text-4xl lg:text-[46px]` — responsive headlines
- `lg:col-span-7` / `lg:col-span-5` — 7:5 lead story grid

---

## 18. Z-Index Layer Map

| Z-Index    | Element                             | Location                            |
| ---------- | ----------------------------------- | ----------------------------------- |
| `z-[9999]` | Skip-to-content link (focused)      | `layout.tsx`                        |
| `z-999`    | Scroll progress bar                 | `.scroll-progress` in `globals.css` |
| `z-50`     | Mobile nav Dialog overlay + content | `Header.tsx`                        |
| `z-40`     | Sticky Header                       | `Header.tsx`                        |
| `z-[1]`    | (not used — reserved)               | —                                   |

**Rules:**

- Never use `z-index` values above 9999 (skip link needs to be on top of everything).
- The mobile Dialog overlay and content share `z-50` — content renders after overlay in DOM.
- The sticky Header is `z-40` so the mobile Dialog (`z-50`) can cover it.
- The scroll progress bar is `z-999` (below skip link at 9999, above everything else).

---

## 19. Color Reference (Complete)

### 19.1 Ink Scale (text + backgrounds)

| Token     | Hex       | RGB                  | Usage                                             |
| --------- | --------- | -------------------- | ------------------------------------------------- |
| `ink-900` | `#1a1a18` | `rgb(26, 26, 24)`    | Headlines, secondary button bg, skip link bg      |
| `ink-700` | `#2a2a27` | `rgb(42, 42, 39)`    | Secondary button hover                            |
| `ink-600` | `#3d3d3a` | `rgb(61, 61, 58)`    | Body text (9.5:1 contrast on paper-50 — WCAG AAA) |
| `ink-500` | `#525250` | `rgb(82, 82, 80)`    | (rarely used)                                     |
| `ink-400` | `#6b6b68` | `rgb(107, 107, 104)` | Icon grey, accordion chevron                      |
| `ink-300` | `#8a8a83` | `rgb(138, 138, 131)` | Muted text, metadata labels                       |
| `ink-100` | `#e8e8e4` | `rgb(232, 232, 228)` | Borders, outline variant border                   |

### 19.2 Paper Scale (backgrounds)

| Token       | Hex       | RGB                  | Usage                                     |
| ----------- | --------- | -------------------- | ----------------------------------------- |
| `paper-50`  | `#fafaf8` | `rgb(250, 250, 248)` | Page background, ring offset              |
| `paper-100` | `#f2f2ee` | `rgb(242, 242, 238)` | Card surface, muted bg, skeleton bg hover |
| `paper-200` | `#e6e4de` | `rgb(230, 228, 222)` | Skeleton bg, separators, border-paper-200 |
| `paper-300` | `#d8d4cc` | `rgb(216, 212, 204)` | Masthead broadsheet rules                 |

### 19.3 Dispatch Brand Accents

| Token                   | Hex       | RGB                  | Category        | Usage                                                         |
| ----------------------- | --------- | -------------------- | --------------- | ------------------------------------------------------------- |
| `dispatch-ember`        | `#c7513f` | `rgb(199, 81, 63)`   | Top Stories     | Breaking news, AI badge, focus rings, primary CTA, "AI Brief" |
| `dispatch-ember-light`  | `#fde8e4` | `rgb(253, 232, 228)` | —               | Active category bg (`/40` opacity)                            |
| `dispatch-sage`         | `#6b8f71` | `rgb(107, 143, 113)` | Finance         | "ok" status, "All systems operational"                        |
| `dispatch-sage-light`   | `#e4ede5` | `rgb(228, 237, 229)` | —               | Sage bg tint                                                  |
| `dispatch-slate`        | `#5a6b7a` | `rgb(90, 107, 122)`  | Tech, Global    | Source names, lead story category                             |
| `dispatch-slate-light`  | `#e2e7ec` | `rgb(226, 231, 236)` | —               | Slate bg tint                                                 |
| `dispatch-clay`         | `#8b6d5a` | `rgb(139, 109, 90)`  | Local, Politics | Category dot                                                  |
| `dispatch-clay-light`   | `#ede5df` | `rgb(237, 229, 223)` | —               | Clay bg tint                                                  |
| `dispatch-violet`       | `#7a6b8f` | `rgb(122, 107, 143)` | Culture         | Category dot, citation refs                                   |
| `dispatch-violet-light` | `#e8e4ef` | `rgb(232, 228, 239)` | —               | Citation hover bg                                             |

### 19.4 Semantic State Tokens (Phase 19 / M15)

| Token                    | Hex       | Equivalent | Usage                                                 |
| ------------------------ | --------- | ---------- | ----------------------------------------------------- |
| `dispatch-warning`       | `#b45309` | amber-700  | `needs_review` status (SummaryPanel, DisclosureBadge) |
| `dispatch-warning-light` | `#fef3c7` | amber-50   | `needs_review` bg                                     |
| `dispatch-danger`        | `#dc2626` | red-600    | Destructive button                                    |
| `dispatch-danger-dark`   | `#b91c1c` | red-700    | Destructive button hover                              |

### 19.5 Category → Color Mapping

| Category    | Slug          | Dot Class            | Active Border            |
| ----------- | ------------- | -------------------- | ------------------------ |
| Top Stories | `top-stories` | `bg-dispatch-ember`  | `border-dispatch-ember`  |
| Local       | `local`       | `bg-dispatch-clay`   | `border-dispatch-clay`   |
| Tech        | `tech`        | `bg-dispatch-slate`  | `border-dispatch-slate`  |
| Global      | `global`      | `bg-dispatch-slate`  | `border-dispatch-slate`  |
| Finance     | `finance`     | `bg-dispatch-sage`   | `border-dispatch-sage`   |
| Politics    | `politics`    | `bg-dispatch-clay`   | `border-dispatch-clay`   |
| Culture     | `culture`     | `bg-dispatch-violet` | `border-dispatch-violet` |

### 19.6 Summary Status → Color Mapping

| Status                  | Dot                        | Text                    | Background                        |
| ----------------------- | -------------------------- | ----------------------- | --------------------------------- |
| `ok`                    | `bg-dispatch-sage`         | `text-dispatch-sage`    | `hover:bg-dispatch-sage-light/50` |
| `pending`               | `bg-ink-300 animate-pulse` | `text-ink-400`          | —                                 |
| `needs_review`          | `bg-dispatch-warning`      | `text-dispatch-warning` | `bg-dispatch-warning-light`       |
| `disabled`              | —                          | —                       | — (returns null)                  |
| `error` (Phase 19 / H4) | `bg-dispatch-ember`        | `text-ink-600`          | `bg-paper-100/50`                 |

### 19.7 Opacity Modifiers

| Pattern                      | Usage                                              |
| ---------------------------- | -------------------------------------------------- |
| `bg-dispatch-ember/10`       | Badge backgrounds (10% opacity)                    |
| `bg-dispatch-ember/20`       | Badge borders (20% opacity)                        |
| `bg-dispatch-ember-light/40` | Active category tab background                     |
| `bg-dispatch-ember/95`       | Breaking news badge (95% opacity for readability)  |
| `bg-paper-50/95`             | Sticky Header (95% opacity for backdrop-blur)      |
| `bg-black/40`                | Mobile Dialog overlay                              |
| `hover:bg-paper-100/50`      | Article card hover (50% opacity for subtle effect) |

---

## 20. The Complete TypeScript Interface Reference

### 20.1 Domain Types (`src/domain/articles/types.ts`)

```typescript
import type { InferSelectModel } from "drizzle-orm";
import type { articles, sources, categories, summaries } from "@/lib/db/schema";

export type Article = InferSelectModel<typeof articles>;
export type Source = InferSelectModel<typeof sources>;
export type Category = InferSelectModel<typeof categories>;
export type Summary = InferSelectModel<typeof summaries>;

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

### 20.2 Schema-Derived Enum Types (`src/lib/db/schema.ts`)

```typescript
export type UserRole = (typeof userRoleEnum.enumValues)[number];
// "reader" | "admin"

export type FeedFormat = (typeof feedFormatEnum.enumValues)[number];
// "rss" | "atom" | "json_api"

export type ContentAvailability =
  (typeof contentAvailabilityEnum.enumValues)[number];
// "title_only" | "excerpt" | "partial_text" | "full_text"

export type SummaryStatus = (typeof summaryStatusEnum.enumValues)[number];
// "none" | "pending" | "ok" | "needs_review" | "disabled"
```

### 20.3 Component Props

```typescript
// Button
interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

// Badge
interface BadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  dotColorClass?: string;
}

// ArticleCard
interface ArticleCardProps {
  article: ArticleWithSource;
}

// FeedGrid
interface FeedGridProps {
  articles: ArticleWithSource[];
}

// FeedContainer
interface FeedContainerProps {
  initialArticles: ArticleWithSource[];
  initialNextCursor: string | null;
  initialHasMore: boolean;
}

// LoadMoreButton
interface LoadMoreButtonProps {
  hasMore: boolean;
  isLoading: boolean;
  onClick: () => void;
}

// SummaryPanel
interface SummaryPanelProps {
  articleId: string;
  initialStatus: SummaryStatus;
  summary?: SummarisationOutput | null;
  onRequestSummary?: () => void;
  error?: string | null;
  onError?: (error: Error) => void;
}

// DisclosureBadge
interface DisclosureBadgeProps {
  status: SummaryStatus;
  onClick?: () => void;
}

// NutritionLabel
interface NutritionLabelProps {
  summary: SummarisationOutput;
}

// SearchBar
interface SearchBarProps {
  defaultValue?: string;
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

// SearchResults
interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

// Header
interface HeaderProps {
  activeCategory?: string;
  className?: string;
}

// AdminGuard
interface AdminGuardProps {
  children: React.ReactNode;
}

// Error boundaries
interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}
```

### 20.4 AI / Summarisation Types

```typescript
// summariseSchema.ts
interface SourceCitation {
  url: string;
  title: string;
}

interface SummarisationOutput {
  summaryText: string; // 50-800 chars
  keyPoints: string[]; // 1-5 items, each ≤120 chars
  sourcesCited: SourceCitation[]; // min 1
  aiStatement: string; // 20-200 chars
  coveragePercentage: number; // 0-100 int
}

// provenance.ts
interface ProvenanceInput {
  summary: SummarisationOutput;
  articleId: string;
  articleUrl: string;
  articleTitle: string;
  model: string;
  generatedAt: string;
}

interface ProvenanceResult {
  jsonLd: string; // JSON-stringified schema.org/CreativeWork
  httpHeader: string; // base64-encoded JSON for X-AI-Provenance
  metaTag: string; // semicolon-delimited for <meta name="ai-provenance">
}

// prompts.ts
interface PromptInput {
  content: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
}
```

### 20.5 Queue / Flow Types

```typescript
// flows.ts
interface PostIngestFlowInput {
  newArticleIds: string[];
  categoryId: string;
}

interface PostIngestFlowStatus {
  status: "ok" | "degraded" | "skipped";
  fallbackUsed: boolean;
  fallbackFailures: number;
  enqueuedCount: number;
}

// rateLimit.ts
interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // epoch ms
}
```

### 20.6 Server Action Return Types

```typescript
// summaries/actions.ts
interface SummariseResponse {
  success: boolean;
  jobId: string | null;
  error: string | null;
}

// All admin actions return:
interface { success: boolean; error: string | null; }
```

### 20.7 Alert Types (Phase 19 / H10)

```typescript
interface NeedsReviewAlertResult {
  status: "ok" | "warning";
  count: number;
  alerted: boolean;
}

interface NeedsReviewAlertOptions {
  threshold?: number; // default: 3
  alert?: (info: { count: number; threshold: number; message: string }) => void;
}
```

### 20.8 Scoring Types

```typescript
// domain/ranking/score.ts
interface ScoringInputs {
  ageInHours: number;
  hasSummary: boolean;
  sourcePriority: number; // lower is better, typically 1-5
  contentAvailability: ContentAvailability;
}
// calculateImportanceScore(inputs: ScoringInputs): number  -- returns [0.0, 1.0]
```

### 20.9 Feed/Search Query Types

```typescript
// search/types.ts
interface SearchParams {
  query: string;
  cursor?: Date;
  limit?: number;
}
interface SearchResult {
  article: ArticleWithSource;
  rank: number;
}
interface SearchPage {
  results: SearchResult[];
  nextCursor: string | null;
  hasMore: boolean;
}

// feed/queries.ts
interface FeedParams {
  category?: string;
  cursor?: Date;
  limit?: number;
}
// Returns FeedPage (see §20.1)
```

### 20.10 Worker Job Types

```typescript
// determineContentAvailability.ts
interface ParsedContent {
  title?: string;
  excerpt?: string;
  body?: string;
}
// Returns ContentAvailability

// summarizeFailure.ts
interface SummaryFailureState {
  summaryStatus: "none" | "needs_review";
  flagReason: string | null;
}
// getSummaryFailureState(attemptsMade: number, maxAttempts?: number): SummaryFailureState

// parseFeed.ts
interface FeedItem {
  title: string;
  excerpt?: string;
  body?: string;
  url: string;
  publishedAt?: Date;
}
// parseFeed(content: string, feedFormat: FeedFormat): Promise<FeedItem[]>
```

---

## Validation Checklist (10-Point)

Before using this skill file, verify these 10 checkpoints against the actual codebase:

1. ✅ **Tech stack versions match** — `package.json` has Next.js `^16.2.9`, React `^19.2.7`, TypeScript `^5.7.0`, Drizzle `^0.45.2`, BullMQ `^5.78.0`, Zod `^4.4.3`, cheerio `^1.2.0`
2. ✅ **Configuration files match** — `tsconfig.json` has `erasableSyntaxOnly`, `noUncheckedIndexedAccess`, `"skills"` in exclude; `next.config.ts` has `cacheComponents: true` (top-level), `output: "standalone"`, HSTS + CSP headers; `postcss.config.mjs` has `@tailwindcss/postcss`; `eslint.config.mjs` has `skills/**` in ignores, `no-explicit-any: "error"`
3. ✅ **Design system tokens match** — `globals.css` `@theme` block has 7 ink + 4 paper + 10 dispatch + 4 semantic state (Phase 19 / M15) + 3 typography tokens; `.font-editorial` has `font-feature-settings: "ss01", "ss02"`
4. ✅ **Component architecture matches** — Button has 5 variants (primary/secondary/outline/ghost/destructive) with `dispatch-danger` tokens; ArticleCard uses `grid-rows-subgrid row-span-3`; SummaryPanel has 5-state machine + error state; Header has `CATEGORIES` array with 7 entries + `<UserMenu>`
5. ✅ **Hooks implementation matches** — `useDebounce<T>(value: T, delay = 300): T` with `setTimeout` + `clearTimeout`; `useReducedMotion(): boolean` with `matchMedia` + `addEventListener`
6. ✅ **Content ingestion patterns match** — `parseFeed.ts` uses `cheerio.load(html)` + `$("script,style,...").remove()` + `$.text()`; `determineContentAvailability` has 4-tier guard; `hashContent` includes body; `enqueuePostIngestFlow` has try/catch fallback
7. ✅ **Accessibility implementation matches** — Skip-to-content link in `layout.tsx`; `:focus-visible` global rule; `@media (prefers-reduced-motion: reduce)` disables ALL animations; `e2e/a11y.spec.ts` with `AxeBuilder`; every page has `<main id="main-content">`
8. ✅ **Anti-patterns documented correctly** — All 25 anti-patterns in §16 match actual code fixes; `process.env.*` eliminated; `vi.hoisted()` pattern documented; `cacheLife()` mock documented
9. ✅ **Color references match** — 7 ink + 4 paper + 10 dispatch + 4 semantic state = 25 tokens; category→color mapping has 7 entries; status→color mapping has 5 entries (including Phase 19 error state)
10. ✅ **TypeScript interfaces match** — All interfaces in §20 match actual source: `ArticleWithSource`, `ArticleWithSummary`, `FeedPage`, `SummarisationOutput`, `PostIngestFlowStatus`, `RateLimitResult`, `ScoringInputs`, `NeedsReviewAlertResult`, etc.

---

_End of OneStopNews Complete Skill Reference — Phase 19_
