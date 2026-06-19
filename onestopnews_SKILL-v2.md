# OneStopNews — Complete Project Skill File

> **Purpose:** This document is the definitive reference for reproducing the OneStopNews codebase — its design, architecture, patterns, and quality. Every section is grounded in the actual source code (HEAD `ea96e76`, Phase 16 complete). When in doubt, the code wins.
>
> **Audience:** Coding agents (and senior engineers) who need to extend, debug, or replicate this project. Read this file IN FULL before making any change.
>
> **Last Updated:** June 20, 2026 · **Phase:** 16 (Remediation Batches 1-4 complete) · **Tests:** 292 / 52 suites · **Quality Gate:** `pnpm check` + `pnpm test` green

---

## Table of Contents

1. [Project Identity & Design Philosophy](#1-project-identity--design-philosophy)
2. [Tech Stack & Environment](#2-tech-stack--environment)
3. [Bootstrapping & Configuration](#3-bootstrapping--configuration)
4. [The Design System (Code-First)](#4-the-design-system-code-first)
5. [Component Architecture & Patterns](#5-component-architecture--patterns)
6. [Custom Hooks Deep Dive](#6-custom-hooks-deep-dive)
7. [Content Management (RSS/Atom/JSON Feed Ingestion)](#7-content-management-rssatomjson-feed-ingestion)
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
21. [The Meticulous Approach (Mandatory 6-Phase Workflow)](#21-the-meticulous-approach-mandatory-6-phase-workflow)

---

## 1. Project Identity & Design Philosophy

### 1.1 What Is OneStopNews?

**OneStopNews** is a **topic-first news aggregation platform** with source-cited AI summaries. Rather than organizing news by publisher, it organizes stories by **subject** across 50–200+ RSS/Atom/JSON feeds, normalizes/dedupes them, scores importance, optionally AI-summarizes them, and exposes them via topic-categorized feed, full-text search, public REST API, and admin tools.

**Tagline:** *"Every story, organized by what it's about — not who published it."*

### 1.2 Design Philosophy — "Editorial Dispatch"

The visual identity is **architectural, not cosmetic**. Every element carries the weight of something worth reading. This is a **high-end editorial** aesthetic — think broadsheet newspaper meets modern web app — NOT brutalist, NOT generic SaaS.

**Explicit Rejections (do NOT use these):**
- ❌ Inter, Roboto, Space Grotesk (the "generic SaaS" font stack)
- ❌ Purple-gradient-on-white clichés
- ❌ Predictable card grids without structural alignment
- ❌ The homogenized "AI slop" aesthetic
- ❌ Raw hex colors in Tailwind classes (always use design tokens)

**Three Typefaces (each with a job):**
| Typeface | Role | Weight | Source |
|---|---|---|---|
| **Newsreader** (variable) | Headlines — editorial gravitas | 800 (display) | Google Fonts |
| **Instrument Sans** (variable) | UI / body — neutral legibility | 400–600 | Google Fonts |
| **Commit Mono** | Metadata — mechanical precision | 400 | `next/font/local` (NOT on Google Fonts) |

**Accent Color — "Dispatch Ember":**
- `--color-dispatch-ember: #c7513f` — a coral-red accent for breaking news, focus rings, AI badges
- Used sparingly: links, AI brief tags, focus-visible rings, border-left on summary panels
- **NEVER** used as a full background fill (except buttons + status dots)

### 1.3 Defining Differentiators

1. **3-layer machine-readable AI provenance** — JSON-LD + `X-AI-Provenance` HTTP header + `<meta name="ai-provenance">` — emitted via `generateMetadata()` on `/article/[id]`. C2PA explicitly rejected. EU AI Act Article 50 compliant.
2. **Content Availability Guard** — `contentAvailabilityEnum` with 4 tiers; only `partial_text`/`full_text` eligible for summarization. Double-enforced at Server Action AND API Route layers. Prevents AI hallucination.
3. **Modular monolith (Next.js 16 web) + standalone Node.js 24 worker service** — connected via BullMQ v5 on Redis 7+ and shared PostgreSQL 17.
4. **CSS Subgrid feed** — `grid-rows-subgrid row-span-3` aligns Headline/Excerpt/Metadata rows across cards without fixed heights.

### 1.4 The Meticulous Approach (Mandatory SOP)

Every task MUST follow this 6-phase workflow:
1. **ANALYZE** — Deep requirement mining. Identify explicit, implicit, edge-case needs.
2. **PLAN** — Structured execution roadmap. **Present for approval before writing code.**
3. **VALIDATE** — Obtain explicit user confirmation of the plan.
4. **IMPLEMENT** — Modular, tested, documented builds. Use library primitives first.
5. **VERIFY** — Rigorous QA. Edge cases, accessibility (WCAG AAA), performance.
6. **DELIVER** — Complete handoff with knowledge transfer.

**Never proceed to IMPLEMENT without VALIDATE.** See §21 for full details.

---

## 2. Tech Stack & Environment

### 2.1 Exact Versions (from `package.json` + lockfile)

| Layer | Technology | Version | Notes |
|---|---|---|---|
| **Web Framework** | Next.js | `^16.2.9` (≥16.0.7 required for CVE-2025-55182 mitigation) | App Router, Turbopack, `cacheComponents: true` |
| **UI Runtime** | React | `^19.2.7` | Stable, View Transitions, `useOptimistic` |
| **Language** | TypeScript | `^5.7.0` | Strict mode + `noUncheckedIndexedAccess` + `verbatimModuleSyntax` + `erasableSyntaxOnly` |
| **Styling** | Tailwind CSS | `latest` (resolves to 4.3.0) | v4 with `@theme` block |
| **PostCSS** | `@tailwindcss/postcss` | `^4.3.1` | **MANDATORY** — without it, zero utility classes generate |
| **Components** | Shadcn UI + Radix | `@radix-ui/react-*` | Accessible primitives, wrapped; never rebuild from scratch |
| **ORM** | Drizzle ORM | `latest` | TypeScript-native, SQL-fluent, lazy proxy connection |
| **Validation** | Zod | `latest` (resolves to 4.4.3) | Schema-first, enforces AI output constraints |
| **Auth** | Auth.js (next-auth) | `5.0.0-beta.31` | HttpOnly cookies, Drizzle adapter; pin to beta.31 |
| **Database** | PostgreSQL | 17 | GIN FTS + `ts_rank_cd` BM25 |
| **Search** | `tsvector` + `ts_rank_cd` | Built-in PG | BM25 relevance; `pg_trgm` for autocomplete |
| **Job Queue** | BullMQ | `latest` (resolves to v5) | Flows via `FlowProducer`, priorities, dashboard |
| **Queue Backend** | Redis (Upstash) | 7.x | AOF, `noeviction`, `maxRetriesPerRequest: null` |
| **Worker Runtime** | Node.js | ≥24 LTS ("Krypton") | LTS through April 2028 |
| **AI SDK** | Vercel AI SDK | `ai@latest` (resolves to v6) + `@ai-sdk/anthropic@^3` + `@ai-sdk/openai@^3` | `generateObject()` with Zod validation |
| **AI Primary** | Claude 4.5 Haiku | `claude-haiku-4-5` | $1/$5 per M tokens |
| **AI Fallback** | GPT-5 Mini | `gpt-5-mini` | Validated cost/quality fallback |
| **RSS Parsing** | `rss-parser` | `^3.13.0` | RSS 2.0 + Atom 1.0; JSON Feed parsed natively |
| **Rate Limiting** | `ioredis` (fixed-window) | `latest` (resolves to 5.x) | Redis `INCR`+`EXPIRE`; 20 req/s per IP on `/api/articles` |
| **Bundler** | Turbopack | Next.js 16 default | 5–10× faster Fast Refresh |
| **DST-safe time** | luxon | `latest` | Required for quiet-hours math; native `Date` breaks at DST |
| **Fonts** | Newsreader (variable), Instrument Sans (variable), Commit Mono (400, self-hosted woff2) | — | Typography stack |
| **Test (unit)** | Vitest | `latest` (resolves to 4.1.8) | jsdom env, coverage thresholds |
| **Test (e2e)** | Playwright | via `@playwright/test` | Chromium/Firefox/WebKit |
| **Test (a11y)** | axe-core + Playwright | — | WCAG 2.1 AAA |
| **Test (perf)** | Lighthouse CI | — | Perf ≥90, A11y ≥95 |
| **Pkg Manager** | pnpm | `9.15.0` (via `packageManager` field) | Frozen lockfile in CI |

### 2.2 Critical `tsconfig.json` Flags

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "strict": true,                          // non-negotiable
    "noUncheckedIndexedAccess": true,        // arr[i] returns T | undefined
    "verbatimModuleSyntax": true,            // import type { X } required for type-only
    "erasableSyntaxOnly": true,              // no enum, no namespace (compiles to IIFE)
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "paths": { "@/*": ["./src/*"] }
  },
  "exclude": ["node_modules", ".next", "drizzle", "e2e", "playwright.config.ts"]
}
```

**Why `erasableSyntaxOnly`?** It forbids `enum` and `namespace` (which compile to runtime IIFEs/closures). Use **string unions** (`type Status = "active" | "paused"`) or Drizzle's `pgEnum` instead.

**Why `noUncheckedIndexedAccess`?** Without it, `arr[i]` returns `T` instead of `T | undefined`, hiding runtime errors. This is the **single highest-value strictness improvement** available.

### 2.3 Environment Variables (validated by Zod at module load)

See `src/lib/env/index.ts` for the canonical schema. **Required vars MUST be set even for `pnpm lint` and `pnpm test`** because lint/test import modules that import `@/lib/env`.

| Variable | Required | Validation |
|---|---|---|
| `DATABASE_URL` | ✅ | starts `postgres://` or `postgresql://` |
| `REDIS_URL` | ✅ | starts `redis://` |
| `AUTH_SECRET` | ✅ | min 32 chars (`openssl rand -base64 33`) |
| `AUTH_URL` | ✅ | non-empty |
| `ANTHROPIC_API_KEY` | ✅ | starts `sk-ant-` |
| `OPENAI_API_KEY` | ✅ | starts `sk-` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ✅ | non-empty |
| `VAPID_PRIVATE_KEY` | ✅ | non-empty |
| `VAPID_SUBJECT` | ✅ | non-empty |
| `PUSH_KEY_ENCRYPTION_KEY` | ✅ | exactly 64 hex chars (`openssl rand -hex 32`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | ❌ optional | — |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | ❌ optional | — |
| `TRUSTED_PROXY` | ❌ optional | string; route checks `=== "true"` |
| `NODE_ENV` | ✅ (defaulted) | enum `development\|production\|test`, default `development` |

---

## 3. Bootstrapping & Configuration

### 3.1 From-Scratch Setup

```bash
# 1. Clone and install
git clone https://github.com/nordeim/onestopnews.git
cd onestopnews
pnpm install --frozen-lockfile   # pnpm@9.15.0 via corepack

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local — set all required vars (see §2.3)
# Generate secrets:
openssl rand -base64 33           # → AUTH_SECRET
openssl rand -hex 32              # → PUSH_KEY_ENCRYPTION_KEY (64 hex chars)
npx web-push generate-vapid-keys  # → NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY

# 3. Set up the database
pnpm db:generate                  # Generate migrations from Drizzle schema
pnpm db:migrate                   # Apply migrations
pnpm db:seed                      # Seed 7 categories, 7 sources, 30 articles, 15 summaries (idempotent)

# 4. Enable PostgreSQL extensions
psql -c 'CREATE EXTENSION IF NOT EXISTS pg_trgm;'   # autocomplete (ts_rank_cd is built-in)
# NOTE: pg_textsearch does NOT exist in PG 17 — do NOT attempt to create it

# 5. Start dev servers (TWO terminals)
pnpm dev                          # Terminal 1 — Next.js dev server (Turbopack)
pnpm worker                       # Terminal 2 — BullMQ worker service
```

### 3.2 Critical `next.config.ts` Flags (placement is NON-NEGOTIABLE)

```ts
const nextConfig: NextConfig = {
  output: "standalone",           // TOP-LEVEL — Dockerfile.web copies .next/standalone/
  cacheComponents: true,          // TOP-LEVEL — enables "use cache" directive + PPR
  cacheLife: {                    // TOP-LEVEL — profiles for cacheLife('name') calls
    feed:      { stale: 30,    revalidate: 120,   expire: 600 },
    topicShell:{ stale: 300,   revalidate: 900,   expire: 86400 },
    reference: { stale: 3600,  revalidate: 86400, expire: 604800 },
  },
  turbopack: {},                  // TOP-LEVEL — graduated from experimental in Next.js 16
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "picsum.photos", pathname: "/**" }],
  },
  experimental: {
    viewTransition: true,         // INSIDE experimental — all usage via <PageTransition>
    // DO NOT add: ppr, dynamicIO, clientSegmentCache (not in 16.2.9 ExperimentalConfig)
  },
  async headers() { /* X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy */ },
};
```

**What breaks if misplaced:**
- `cacheComponents` inside `experimental` → every `"use cache"` silently ignored (zero caching)
- `cacheLife` profiles inside `experimental` → `cacheLife('feed')` throws at runtime (profile missing)
- `experimental.ppr` present → build error in Next.js 16 (removed; `cacheComponents` replaces it)
- `experimental.dynamicIO` present → deprecated, build warning

### 3.3 `postcss.config.mjs` (MANDATORY for Tailwind v4)

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},   // Without this, ZERO utility classes generate
  },
}
```

**Symptom of missing config:** Tailwind v4 generates only `@theme` custom properties, no utility classes. No build error — silently breaks all styling. Fix: `pnpm add -D @tailwindcss/postcss@4.3.1` + create `postcss.config.mjs` + `rm -rf .next/` + restart dev server.

### 3.4 Commit Mono Font (NOT on Google Fonts)

```ts
// src/app/layout.tsx
import localFont from "next/font/local";

const commitMono = localFont({
  src: "../../public/fonts/commit-mono-400.woff2",  // extracted from @fontsource/commit-mono
  variable: "--font-mono",
  weight: "400",
  style: "normal",
  display: "swap",
});
```

**To extract the woff2:** `pnpm add -D @fontsource/commit-mono@5.2.5` → copy `node_modules/@fontsource/commit-mono/files/commit-mono-400-normal.woff2` to `public/fonts/commit-mono-400.woff2`.

### 3.5 Commands (all scripts in `package.json`)

| Command | Purpose |
|---|---|
| `pnpm dev` | Next.js dev server with Turbopack (`next dev --turbo`) |
| `pnpm worker` | Worker service — `tsx src/workers/index.ts` |
| `pnpm build` | Production build (`next build`) |
| `pnpm start` | Production server (`next start`) |
| `pnpm check` | `tsc --noEmit && pnpm lint` (combined pre-commit gate) |
| `pnpm lint` | ESLint with `--max-warnings 0` |
| `pnpm test` | Vitest run (unit + integration) |
| `pnpm test:watch` | Vitest watch mode |
| `pnpm test:e2e` | Playwright E2E tests |
| `pnpm db:generate` | `drizzle-kit generate` (generate migration SQL) |
| `pnpm db:migrate` | `drizzle-kit migrate` (apply migrations) |
| `pnpm db:seed` | `tsx src/lib/db/seed.ts` (idempotent seed) |
| `pnpm db:studio` | Drizzle Studio (DB GUI) |
| `pnpm format` / `format:check` | Prettier write / check |

**Pre-commit gate:** `pnpm check && pnpm test` — must pass before any PR merges. No exceptions.

---

## 4. The Design System (Code-First)

### 4.1 `globals.css` — `@theme` Block (exact tokens)

```css
@import "tailwindcss";

@theme {
  /* ── Ink Scale (text/dark) ── */
  --color-ink-900: #1a1a18;   /* letterpress black — headings */
  --color-ink-700: #2a2a27;
  --color-ink-600: #3d3d3a;   /* body text (WCAG AAA on paper-50) */
  --color-ink-500: #525250;
  --color-ink-400: #6b6b68;
  --color-ink-300: #8a8a83;   /* muted / metadata */
  --color-ink-100: #e8e8e4;   /* dividers / borders */

  /* ── Paper Scale (light/bg) ── */
  --color-paper-50:  #fafaf8;  /* newsprint off-white — page bg */
  --color-paper-100: #f2f2ee;  /* card surface */
  --color-paper-200: #e6e4de;  /* skeleton fills */
  --color-paper-300: #d8d4cc;  /* broadsheet rules */

  /* ── Dispatch Brand Accents ── */
  --color-dispatch-ember:        #c7513f;  /* breaking news — coral-red */
  --color-dispatch-ember-light:  #fde8e4;
  --color-dispatch-sage:         #6b8f71;  /* finance / positive / "ok" status */
  --color-dispatch-sage-light:   #e4ede5;
  --color-dispatch-slate:        #5a6b7a;  /* tech / neutral / source names */
  --color-dispatch-slate-light:  #e2e7ec;
  --color-dispatch-clay:         #8b6d5a;  /* local / politics */
  --color-dispatch-clay-light:   #ede5df;
  --color-dispatch-violet:       #7a6b8f;  /* culture / creative */
  --color-dispatch-violet-light: #e8e4ef;

  /* ── Typography Stack ── */
  --font-editorial: "Newsreader", Georgia, "Times New Roman", serif;
  --font-ui:        "Instrument Sans", system-ui, -apple-system, sans-serif;
  --font-mono:      "Commit Mono", ui-monospace, "Fira Code", monospace;
}
```

### 4.2 Typography Utility Classes

| Class | Definition | Used for |
|---|---|---|
| `.font-editorial` | `font-weight: 800; line-height: 1.1; letter-spacing: -0.02em; text-rendering: optimizeLegibility; font-feature-settings: "ss01", "ss02";` | Headlines — Newsreader variable at display weight |
| `.font-ui` | (via `--font-ui` on body) | Body, excerpts, UI text |
| `.font-mono` | (via `--font-mono`) | Metadata, labels, timestamps, badges |
| `.cat-label` | `font-family: var(--font-mono); font-variant: all-small-caps; letter-spacing: 0.12em;` | Category labels (uppercase, tracked) |
| `.cat-label-wide` | Same + `letter-spacing: 0.25em;` | Masthead tagline |

**`.font-editorial` bakes in weight 800, line-height 1.1, letter-spacing -0.02em.** Do NOT add `font-[800]`, `leading-tight`, or `tracking-[-0.02em]` alongside it — only override for different values.

### 4.3 Custom CSS Utility Classes (must be in `globals.css`)

| Class | Purpose | Key properties |
|---|---|---|
| `.btn-ember` | Primary CTA button | `transition: transform 150ms; hover: scale(1.02) + box-shadow; active: scale(0.98)` |
| `.cta-input` | Newsletter input on dark bg | `background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); focus: border-ember` |
| `.pulse-dot` | Live status indicator | `animation: pulse-dot 2s ease-in-out infinite` (opacity 1→0.25→1) |
| `.ticker-track` | News ticker marquee | `animation: ticker-scroll 80s linear infinite; hover: pause` |
| `.reveal` + `.visible` | Scroll-reveal (IntersectionObserver-driven) | `opacity: 0; translateY(24px); → opacity: 1; translateY(0); 700ms cubic-bezier(0.4,0,0.2,1)` |
| `.reveal-delay-1` through `.reveal-delay-4` | Staggered reveal | `transition-delay: 80/160/240/320ms` |
| `.nutrition-label` | AI summary panel | `border-left: 3px solid ember; background: linear-gradient(paper-100→paper-50)` |
| `.commitment-number` | Large faded stat number | `font-editorial; font-size: 4.5rem; opacity: 0.08; position: absolute` |
| `.category-nav` | Horizontal scroll nav | `scrollbar-width: none; -ms-overflow-style: none; ::-webkit-scrollbar: display: none` |
| `.scroll-progress` | Top scroll progress bar | `position: fixed; top: 0; height: 2px; bg: ember; animation-timeline: scroll()` |
| `.link-underline` | Animated underline on hover | `::after width: 0 → 100% on hover (200ms)` |
| `.story-card` | Feed card hover state | `transition: bg + box-shadow 200ms; hover: bg-paper-100 + subtle shadow` |
| `.citation-ref` | Inline citation links | `border-bottom: 1px dashed violet; hover: bg violet-light` |
| `.outline-hidden` | Tailwind v4 replacement for `outline-none` | `outline: 2px solid transparent; outline-offset: 2px` (keeps a11y) |

### 4.4 Keyframe Animations

```css
@keyframes ticker-scroll { 0% { translateX(0); } 100% { translateX(-50%); } }
@keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
@keyframes scroll-progress { from { scaleX(0); } to { scaleX(1); } }
@keyframes slideDown { from { height: 0; } to { height: var(--radix-accordion-content-height); } }
@keyframes slideUp { from { height: var(--radix-accordion-content-height); } to { height: 0; } }

.animate-slideDown { animation: slideDown 300ms cubic-bezier(0.87, 0, 0.13, 1); }
.animate-slideUp   { animation: slideUp 300ms cubic-bezier(0.87, 0, 0.13, 1); }
```

### 4.5 Global Base Styles

```css
* { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
html { scroll-behavior: smooth; }
body { font-family: var(--font-ui); background: var(--color-paper-50); color: var(--color-ink-600); }

/* WCAG AAA Focus States (canonical) */
:focus-visible {
  outline: 2px solid var(--color-dispatch-ember);
  outline-offset: 2px;
  border-radius: 2px;
}

/* Reduced Motion — GLOBAL kill switch */
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0ms !important; transition-duration: 0ms !important; }
  .reveal { opacity: 1; transform: none; transition: none; }
  .reveal-delay-1, .reveal-delay-2, .reveal-delay-3, .reveal-delay-4 { transition-delay: 0ms; }
}
```

### 4.6 CSS Subgrid Contract (CRITICAL — PRD §4.3)

**Parent (`FeedGrid`, `FeedSkeleton`):**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8" role="feed" aria-label="News articles">
```
- `gap-x-8` ONLY — **NO `gap-y`**. Vertical rhythm is owned by cards.

**Child (`ArticleCard`, `FeedSkeleton` article):**
```tsx
<article className="grid grid-rows-subgrid row-span-3 gap-y-3 mb-10 last:mb-0 border-b border-ink-100 pb-6 ...">
```
- `grid-rows-subgrid` + `row-span-3` = the card inherits the parent's 3 named row tracks
- **Row 1:** Headline (`font-editorial text-xl leading-tight text-ink-900 group-hover:text-dispatch-ember`)
- **Row 2:** Excerpt (`font-ui text-sm leading-relaxed text-ink-600 line-clamp-3`)
- **Row 3:** Metadata (`flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-ink-600 mt-auto`)
- `mb-10` creates vertical space between visual rows; `last:mb-0` prevents trailing space
- **Test in Firefox first** — Chrome historically had subgrid bugs

### 4.7 Stretched-Link Pattern (full-card click area)

```tsx
<article className="group relative ...">
  <h3>
    <Link href={`/article/${article.id}`}
      className="after:absolute after:inset-0 focus:outline-none
                 focus-visible:ring-2 focus-visible:ring-dispatch-ember
                 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50 rounded-sm">
      {article.title}
    </Link>
  </h3>
  {/* ... excerpt, metadata ... */}
</article>
```
The `after:absolute after:inset-0` pseudo-element covers the whole card, making the entire card clickable while keeping the actual `<a>` text as the accessible name.

---

## 5. Component Architecture & Patterns

### 5.1 The 5-Layer Architecture Model (Golden Rule)

> **Deviation from this order creates security and consistency bugs.**

```
Layer 0: proxy.ts           — Cookie check, redirect. NO DB. NO logic.
Layer 1: App Router         — Route structure, metadata, PPR, Suspense.
Layer 2: Feature Modules    — UI composition, data binding, mutations.
Layer 3: Domain Services    — Pure business logic. No framework imports.
Layer 4: Infrastructure     — Drizzle, BullMQ, Auth.js. Side effects only.
```

| Layer | Responsibilities | Prohibitions |
|---|---|---|
| **0 — `proxy.ts`** | Cookie check; optimistic redirect only | **No DB access. No business logic. No admin auth.** |
| **1 — App Router** | Route structure, metadata, PPR, Suspense | No direct DB awaits in pages (must be wrapped in `<Suspense>`). No data fetching in layouts (fetch in pages, or via `AdminGuard`). |
| **2 — Feature Modules** | UI composition, data binding, mutations | No raw Drizzle calls in components (go through `queries.ts`). |
| **3 — Domain Services** | Pure business logic | **No framework imports. No DB client imports.** Pure TypeScript. |
| **4 — Infrastructure** | Drizzle, BullMQ, Auth.js, AI SDK | Side effects only. Workers cannot call `revalidateTag` (Next.js-only API). |

### 5.2 The "Engineered Soul" Component Philosophy

Every component must be:
1. **Accessible by default** — `aria-label`, `role`, `aria-hidden` on decorative elements
2. **State-complete** — handle loading, error, empty, success (and for AI summaries: 5 states)
3. **Token-pure** — use design tokens (`bg-ink-900`), never raw hex (`bg-[#1a1a18]`)
4. **Library-first** — use Radix/Shadcn primitives, wrap for bespoke styling, never rebuild

### 5.3 Primitive Component Pattern — `Button.tsx` (canonical)

```tsx
// No 'use client' — Server Component compatible
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
        primary:    "bg-dispatch-ember text-paper-50 hover:bg-dispatch-ember/90 active:scale-[0.98]",
        secondary:  "bg-ink-900 text-paper-50 hover:bg-ink-700 active:scale-[0.98]",
        outline:    "border border-ink-100 bg-transparent text-ink-900 hover:bg-paper-100 hover:border-ink-300 active:scale-[0.99]",
        ghost:      "bg-transparent text-ink-600 hover:bg-paper-100 hover:text-ink-900",
        destructive:"bg-red-600 text-paper-50 hover:bg-red-700 active:scale-[0.98]",
      },
      size: {
        sm:   "h-8 px-3 text-xs",
        md:   "h-10 px-4 text-sm",
        lg:   "h-12 px-6 text-base",
        icon: "h-10 w-10 p-2",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
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
export { Button, buttonVariants };
```

**Key patterns:**
- `cva` for variant definitions (5 variants × 4 sizes)
- `Radix Slot` for `asChild` polymorphism (`const Comp = asChild ? Slot : "button"`)
- `forwardRef` + `displayName`
- `isLoading` prop forces `disabled` + renders spinner SVG (`aria-hidden="true"`)
- Canonical focus ring: `focus-visible:ring-2 focus-visible:ring-dispatch-ember focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50`

### 5.4 Component Inventory (with directives + key patterns)

#### Shared UI (`src/shared/components/ui/`)

| Component | `'use client'` | Pattern | Key variants |
|---|---|---|---|
| `Button.tsx` | No | cva + Radix Slot + forwardRef | primary, secondary, outline, ghost, destructive × sm/md/lg/icon |
| `Badge.tsx` | No | cva + forwardRef + plain `<span>` | ember, slate, sage, clay, violet, muted, plain (optional `dot` prop) |
| `Skeleton.tsx` | No | 4 exports: `SkeletonLine`, `SkeletonLines`, `ArticleCardSkeleton`, `FeedSkeleton` | `motion-safe:animate-pulse` (WCAG AAA) |
| `Accordion.tsx` | **Yes** | Radix Accordion (Root/Item/Trigger/Content) | `data-[state=open]:animate-slideDown`, hardcoded 6 FAQ items |
| `NewsletterCTA.tsx` | **Yes** | Local state machine (`idle\|submitting\|success\|error`) | Simulated 1s async, trust badges (Shield/Clock/Zap) |
| `StatsSection.tsx` | No | Hardcoded 3 stats + 4 features | `.commitment-number` ghost number behind foreground |

#### Layout (`src/shared/components/layout/`)

| Component | `'use client'` | Why | Key patterns |
|---|---|---|---|
| `Header.tsx` | **Yes** | `usePathname()`, `useState` for mobile menu | Sticky `z-40 bg-paper-50/95 backdrop-blur-sm`; Radix Dialog for mobile; `CATEGORIES` const (7 items with colour classes); active category derived from URL |
| `Footer.tsx` | **Yes** | `new Date()` for current year | `role="contentinfo"`; AI Disclosure block; hardcoded `v0.1.0` + `95% feed freshness` |
| `Masthead.tsx` | No | Pure RSC | `fontVariationSettings: "'opsz' 72"` (Newsreader optical size axis); 6 broadsheet column rules; `.pulse-dot` + `.cat-label` |
| `NewsTicker.tsx` | **Yes** | (defensive — uses `cn`) | Seamless marquee: items rendered twice, `.ticker-track` animation translates -50%; `role="marquee"` |

#### Auth (`src/shared/components/auth/`)

| Component | `'use client'` | Pattern |
|---|---|---|
| `AdminGuard.tsx` | No (async Server Component) | `async function AdminGuard({children}): Promise<React.ReactElement>` — awaits `verifyAdminSession()`, returns children. Redirects happen inside `dal.ts`. |
| `AdminGuardSkeleton.tsx` | No | Static dark skeleton (`bg-ink-900`), `role="status"` + `aria-label="Verifying admin access"` + `sr-only` text |

#### Providers & Primitives

| Component | `'use client'` | Pattern |
|---|---|---|
| `RevealProvider.tsx` | **Yes** | IntersectionObserver (`threshold: 0.1, rootMargin: "0px 0px -40px 0px"`); reduced-motion fallback adds `.visible` to all `.reveal` immediately |
| `PageTransition.tsx` | **Yes** | `document.startViewTransition` (Chrome 115+, Firefox 144+); progressive enhancement — early-returns if unsupported or reduced-motion; document-level click listener filters internal links |

#### Feed (`src/features/feed/components/`)

| Component | `'use client'` | Pattern |
|---|---|---|
| `FeedContainer.tsx` | **Yes** | `useState` ×5 (articles, nextCursor, hasMore, isLoading, error) + `useCallback` for `loadMore`. Fetches `/api/articles?cursor=...`. Error block has `role="alert" aria-live="polite"`. |
| `FeedData.tsx` | No (async RSC) | Fetches initial page via `getFeedArticles({ limit: 6 })`, passes to `<FeedContainer>`. Also renders `<Footer />`. |
| `FeedGrid.tsx` | No | CSS Subgrid parent: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8`, `role="feed"`. Empty state: ember dot + "No stories in this category yet". |
| `FeedSkeleton.tsx` | No | Mirrors FeedGrid grid; 6 × `ArticleCardSkeleton` with `animate-pulse`, `aria-busy="true"`. |
| `ArticleCard.tsx` | **Yes** | CSS Subgrid child: `grid grid-rows-subgrid row-span-3`. Stretched-link via `after:absolute after:inset-0`. "AI Brief" tag only when `hasSummary && summaryStatus === "ok"`. Uses `formatTimeAgo()`. |
| `LoadMoreButton.tsx` | **Yes** | `if (!hasMore) return null` — absence IS the empty state. `aria-busy={isLoading}`, `data-testid="load-more-button"`. |
| `LeadStory.tsx` | **Yes** | Hardcoded demo: 7:5 grid (`lg:grid-cols-12`), `next/image` with `fill` + `object-cover`, `.pulse-dot` on Breaking badge, `fontVariationSettings: "'opsz' 72"` on headline. |

#### Summaries (`src/features/summaries/components/`)

| Component | `'use client'` | Pattern |
|---|---|---|
| `SummaryPanel.tsx` | **Yes** | **5-state machine** via `switch (optimisticStatus)`: `disabled`→null, `none`→request button, `pending`→spinner, `needs_review`→amber notice, `ok`→`<NutritionLabel>`. Uses `useOptimistic` for instant UI. |
| `NutritionLabel.tsx` | No | `<aside aria-label="AI-generated summary transparency label">`; numbered citations `[1]`, `[2]`; coverage %; "Verify with original source →" link. |
| `DisclosureBadge.tsx` | **Yes** | Button-based badge with `getStatusConfig()` switch. `disabled`/`none` → `null`. States: ok (sage "AI Brief"), pending (ink "Processing"), needs_review (amber "Under Review"). |
| `NutritionLabelDemo.tsx` | **Yes** | Hardcoded static demo for landing page. 12-col grid, coverage bar (`style={{ width: "87%" }}`), citations array. |

#### Articles (`src/features/articles/components/`)

| Component | `'use client'` | Pattern |
|---|---|---|
| `ArticleData.tsx` | No (async RSC) | Fetches `getArticleWithSummary(id)`. 404 fallback with ember dot. Renders header + excerpt + body + `<SummaryPanel>` (without `onRequestSummary` — display only). `<Footer />` at end. |

### 5.5 The SummaryPanel 5-State Machine (NO "error" state)

```tsx
const [optimisticStatus, setOptimisticStatus] = useOptimistic(
  initialStatus,
  (_state, newStatus: SummaryStatus) => newStatus
);

switch (optimisticStatus) {
  case "disabled":     return null;           // no UI hint
  case "none":         return <RequestButton />;  // ember border, "Request AI Summary" button
  case "pending":      return <GeneratingNotice />; // ink-300 border, pulsing dot
  case "needs_review": return <ReviewNotice />;    // amber border, "Summary under editorial review"
  case "ok":           return <NutritionLabel summary={summary} />;  // sage, full label
  default:             return null;           // exhaustiveness check
}
```

**Color semantics by state:**
| State | Border | Background | Dot | UI |
|---|---|---|---|---|
| `none` | `border-dispatch-ember` | `bg-paper-100/50` | `bg-dispatch-ember` | Request button |
| `pending` | `border-ink-300` | `bg-paper-100/50` | `bg-ink-300 animate-pulse` | "Generating..." |
| `needs_review` | `border-amber-500` | `bg-amber-50` | `bg-amber-500` | "Under editorial review" |
| `ok` | (NutritionLabel) | — | — | Full label |
| `disabled` | — | — | — | `null` (no UI) |

**Optimistic transition:** `setOptimisticStatus("pending")` is called BEFORE `onRequestSummary()` for instant UI feedback. Button `disabled={initialStatus === "pending"}` uses REAL status (not optimistic) to prevent double-submits.

### 5.6 The AdminGuard Pattern (Phase 16 HIGH Security Fix)

**Problem:** `(admin)/layout.tsx` was synchronous (cacheComponents workaround), pushing `verifyAdminSession()` into per-page data components. Latent risk: any new admin page forgetting the guard = publicly accessible.

**Fix:** Centralize at the layout boundary:

```tsx
// src/app/(admin)/layout.tsx
import { Suspense } from "react";
import { AdminGuard } from "@/shared/components/auth/AdminGuard";
import { AdminGuardSkeleton } from "@/shared/components/auth/AdminGuardSkeleton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-900 text-paper-50">
      <div className="flex">
        <nav className="w-64 min-h-screen bg-ink-900 border-r border-ink-700 p-6">{/* sidebar */}</nav>
        <main className="flex-1 p-8">
          <Suspense fallback={<AdminGuardSkeleton />}>
            <AdminGuard>{children}</AdminGuard>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
```

```tsx
// src/shared/components/auth/AdminGuard.tsx — async Server Component
export async function AdminGuard({ children }: AdminGuardProps): Promise<React.ReactElement> {
  await verifyAdminSession();  // redirects internally on failure
  return <>{children}</>;
}
```

**Why this works:** `verifyAdminSession()` is memoized via `React.cache()` in `dal.ts`, so the call deduplicates per-request. Any future admin page added under `(admin)/` is automatically protected — no per-page guard needed.

---

## 6. Custom Hooks Deep Dive

### 6.1 `useDebounce<T>` — Generic Value Debounce

```tsx
// src/shared/hooks/useDebounce.ts
"use client";
import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

**Implementation details:**
- Generic over `<T>` — works with string, number, object, array
- Default delay: **300ms**
- Initial state = first `value` (first render returns undebounced value)
- Cleanup via `useEffect` return (`clearTimeout(handler)`)
- Deps: `[value, delay]` — re-sets timeout on every value/delay change
- **Used in:** `SearchBar.tsx` (`useDebounce(query, 300)`)

### 6.2 `useReducedMotion` — WCAG AAA Motion Preference

```tsx
// src/shared/hooks/useReducedMotion.ts
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

**Implementation details:**
- Returns `true` if user prefers reduced motion (per WCAG AAA PRD §4.4)
- Initial state `false` for SSR safety (no `window` on server)
- `MediaQueryList` API: `addEventListener("change", handler)` + cleanup
- Empty deps `[]` — runs once on mount
- **Note:** Most components use the CSS `motion-safe:` Tailwind variant instead (e.g., `motion-safe:animate-pulse` in Skeleton). This hook is for cases requiring JS-level branching.

### 6.3 When to Use Each Hook

| Hook | Use case | Example |
|---|---|---|
| `useDebounce` | Search input, auto-save, any rapid-fire user input | `SearchBar.tsx` debounces query 300ms before triggering search |
| `useReducedMotion` | JS-level motion gating (when CSS `motion-safe:` isn't enough) | Conditional animation logic |
| `useOptimistic` (React 19 built-in) | Instant UI update before server confirms | `SummaryPanel.tsx` — `setOptimisticStatus("pending")` before `onRequestSummary()` |
| `useActionState` (React 19 built-in) | Form state with server action | (Not currently used — `SummaryPanel` uses `useOptimistic` + callback prop) |

---

## 7. Content Management (RSS/Atom/JSON Feed Ingestion)

### 7.1 The Ingestion Pipeline (4-stage DAG)

```
[scheduler.ts (cron)]
   ↓
[ingestQueue]  (concurrency 50)
   ↓
[parseFeed.ts] → rss-parser → FeedItem[]
   ↓
[determineContentAvailability.ts] → classify title_only|excerpt|partial_text|full_text
   ↓
[hashContent(title, body, publishedAt)] → SHA-256 64-char hex
   ↓
[db.insert.onConflictDoUpdate WHERE content_hash != excluded.content_hash RETURNING (xmax = 0)]
   ↓ (if new articles)
[enqueuePostIngestFlow] → FlowProducer atomic DAG
   ↓
[scoreQueue] (concurrency 20) → calculateImportanceScore → update articles.importanceScore
   ↓ (parent runs after all children)
[feed-slice queue] (concurrency 10) → publishCacheInvalidation(`feed:${categoryId}`)
```

### 7.2 `parseFeed.ts` — Real RSS/Atom/JSON Parser

```ts
import Parser from "rss-parser";

const parser = new Parser({
  customFields: { item: ["content:encoded", "content"] },
});

export async function parseFeed(content: string, feedFormat: FeedFormat): Promise<FeedItem[]>
```

**Atom detection (regex on raw XML — NOT `parsed.feedType`):**
```ts
const isAtom = /^\s*<\?xml[^>]*\?>\s*<feed[\s>]/i.test(content) ||
               /^\s*<feed[\s>]/i.test(content.trim());
```
**Why not `parsed.feedType`?** It's `undefined` in `rss-parser` v3.13.0 for Atom feeds. Detect via raw XML root element `<feed>`.

**Field extraction by format:**
| Format | Body source | Excerpt source |
|---|---|---|
| RSS 2.0 | `raw["content:encoded"]` (explicit full-body extension) | `raw.contentSnippet` (plain-text `<description>`), fallback `raw.summary` |
| Atom | `raw.content` (the `<content>` element) | `raw.summary?.trim()` (does NOT use contentSnippet — it conflates with `<content>`) |
| JSON Feed | `raw.content_text ?? stripHtml(raw.content_html)` | `raw.summary?.trim()` |

**Filter rules:**
- Items without title (`!raw.title || raw.title.trim().length === 0`) → skipped
- Items without URL (`!raw.link`) → skipped

**`stripHtml` helper** (HTML → plain text for AI summarization):
```ts
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, " ").trim();
}
```

**Error handling:** XML/JSON parse failures → `console.warn` + return `[]` (never throws — worker continues with other sources).

### 7.3 Content Availability Guard (Anti-Hallucination)

```ts
// src/workers/jobs/determineContentAvailability.ts
export function determineContentAvailability(parsed: ParsedContent): ContentAvailability {
  if (!parsed.title || parsed.title.trim().length === 0) return "title_only";    // DO NOT summarise
  if (!parsed.excerpt || parsed.excerpt.trim().length === 0) return "excerpt";   // DO NOT summarise
  const bodyLength = parsed.body ? parsed.body.length : 0;
  if (bodyLength < 500) return "partial_text";  // summarise permitted (300–1500 chars)
  return "full_text";                            // summarise preferred (>1500 chars)
}
```

**Summarisation eligibility:**
| Tier | Body length | Summarise? |
|---|---|---|
| `title_only` | no title | ❌ NEVER (hallucination risk) |
| `excerpt` | no excerpt | ❌ NEVER (hallucination risk) |
| `partial_text` | < 500 chars | ✅ Allowed |
| `full_text` | ≥ 500 chars | ✅ Preferred |

**Double enforcement:** The guard runs in BOTH the Server Action (`requestSummary` in `summaries/actions.ts`) AND the API Route (`/api/summarize/[id]`). Both reject `title_only`/`excerpt` with 400.

### 7.4 Content Change Detection — `(xmax = 0)` Trick

```ts
// src/workers/index.ts — processIngestJob
const result = await db
  .insert(articles)
  .values({ ... })
  .onConflictDoUpdate({
    target: articles.canonicalUrl,
    set: { title, excerpt, body, contentHash },
    where: sql`${articles.contentHash} != excluded.content_hash`,
  })
  .returning({ id: articles.id, isNew: sql<boolean>`(xmax = 0)` });
```

**How it works:**
- `onConflictDoUpdate` on `canonicalUrl` (the idempotency key)
- `WHERE content_hash != excluded.content_hash` — only update if content actually changed
- `RETURNING (xmax = 0)` — PostgreSQL system column: `true` for INSERT, `false` for UPDATE
- This distinguishes "new article" from "updated article" in a single query

### 7.5 `hashContent` — SHA-256 Content Hash

```ts
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

- **Algorithm:** SHA-256 via Node `crypto.createHash`
- **Input format:** `${title.trim()}|${body ?? ""}|${publishedAt.toISOString()}` (pipe-separated)
- **Output:** 64-char lowercase hex
- **Body MUST be included** — without it, content-only edits (same title+date, different body) are silently dropped by the `WHERE content_hash != excluded.content_hash` clause

### 7.6 FlowProducer Atomic DAG

```ts
// src/lib/queue/flows.ts
export async function enqueuePostIngestFlow(input: PostIngestFlowInput): Promise<void> {
  const flowProducer = getFlowProducer();  // module-level singleton
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
    children,
  });
}
```

**Why FlowProducer (not individual `scoreQueue.add()`)?** Individual adds are non-atomic — cache invalidation could fire before all scoring completes. FlowProducer guarantees the parent (`refresh-feed-slice`) runs ONLY after ALL children (`score-article`) complete.

### 7.7 Worker Concurrency Matrix

| Worker | Queue | Concurrency | Why |
|---|---|---|---|
| ingest | `"ingest"` | **50** | I/O-bound (network fetches to RSS sources) |
| summarize | `"summarize"` | **5** | AI-API-bound (rate-limited by Anthropic/OpenAI) |
| score | `"score"` | **20** | CPU/DB-bound (scoring formula is fast) |
| feed-slice | `"feed-slice"` | **10** | Redis writes (fast but connection pool limited) |

```ts
// src/workers/index.ts
const CONCURRENCY = { ingest: 50, summarize: 5, score: 20, feedSlice: 10 } as const;
```

### 7.8 Graceful Shutdown (SIGTERM/SIGINT)

```ts
async function gracefulShutdown(signal: string) {
  console.log(`[Worker] Received ${signal}. Closing workers...`);
  await Promise.all(allWorkers.map((w) => w.close()));
  console.log("[Worker] All workers closed. Exiting.");
  process.exit(0);
}
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
```

### 7.9 AI Summarization — Vercel AI SDK with Fallback

```ts
// src/workers/jobs/summarize.ts
const PRIMARY_MODEL = "claude-haiku-4-5";
const FALLBACK_MODEL = "gpt-5-mini";
const TEMPERATURE = 0.1;  // Factual-only mode

export async function callAISummary(article: ArticleForSummarization): Promise<SummarizationResult> {
  const content = article.body ?? article.excerpt ?? article.title;
  const messages = buildSummarisationMessages({ content, title, sourceName, sourceUrl });

  try {
    const result = await generateObject({
      model: anthropic(PRIMARY_MODEL),
      schema: summarisationOutputSchema,  // Zod schema validates output
      messages,
      temperature: TEMPERATURE,
    });
    return { ...result.object, model: PRIMARY_MODEL, tokensUsed: result.usage?.totalTokens ?? 0 };
  } catch (primaryError) {
    console.warn("[Summarize] Anthropic failed, falling back to OpenAI:", primaryError);
  }

  const result = await generateObject({
    model: openai(FALLBACK_MODEL),
    schema: summarisationOutputSchema,
    messages,
    temperature: TEMPERATURE,
  });
  return { ...result.object, model: FALLBACK_MODEL, tokensUsed: result.usage?.totalTokens ?? 0 };
}
```

**Critical:** Vercel AI SDK v6 `generateObject()` returns `{ object, usage, ... }` — the validated output is in `result.object`, NOT `result` directly.

### 7.10 Summary Failure State — `getSummaryFailureState`

```ts
// src/workers/jobs/summarizeFailure.ts
export function getSummaryFailureState(attemptsMade: number, maxAttempts: number = 3): SummaryFailureState {
  if (attemptsMade < maxAttempts) {
    return { summaryStatus: "none", flagReason: null };  // retry
  }
  return {
    summaryStatus: "needs_review",
    flagReason: `AI summarization failed after ${maxAttempts} attempts`,
  };
}
```

- `attemptsMade` is 0-indexed (0 = first attempt)
- `maxAttempts` default: 3 (matches BullMQ `defaultJobOptions.attempts`)
- Returns `'none' + null` when retrying; `'needs_review' + reason` when exhausted
- **NO `"error"` state** — failed summaries are visible in the admin review queue as `needs_review`

---

## 8. Accessibility (WCAG AAA) Implementation

### 8.1 WCAG AAA Target

OneStopNews targets **WCAG 2.1 AAA** (the strictest level). Verified via `axe-core` + Playwright in CI.

### 8.2 Color Contrast (verified)

| Foreground | Background | Ratio | Usage |
|---|---|---|---|
| `ink-600` (#3d3d3a) | `paper-50` (#fafaf8) | **9.5:1** (AAA) | Body text |
| `ink-900` (#1a1a18) | `paper-50` (#fafaf8) | **15.8:1** (AAA) | Headlines |
| `ink-300` (#8a8a83) | `paper-50` (#fafaf8) | **3.9:1** (AA Large only) | Metadata (use sparingly, never body) |
| `paper-50` (#fafaf8) | `dispatch-ember` (#c7513f) | **4.6:1** (AA) | Button text on ember |
| `paper-50` (#fafaf8) | `ink-900` (#1a1a18) | **15.8:1** (AAA) | Button text on dark |

### 8.3 Focus States (canonical — apply to ALL interactive elements)

```css
/* globals.css */
:focus-visible {
  outline: 2px solid var(--color-dispatch-ember);
  outline-offset: 2px;
  border-radius: 2px;
}
```

**Tailwind equivalent (used in Button, Header, SearchBar):**
```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dispatch-ember
focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50
```

### 8.4 Reduced Motion — Triple Defense

1. **Global CSS kill switch** (`globals.css`):
   ```css
   @media (prefers-reduced-motion: reduce) {
     * { animation-duration: 0ms !important; transition-duration: 0ms !important; }
     .reveal { opacity: 1; transform: none; transition: none; }
   }
   ```

2. **Tailwind `motion-safe:` variant** (Skeleton):
   ```tsx
   <div className="motion-safe:animate-pulse ..." />
   ```
   Animation only runs when motion is NOT reduced.

3. **JS-level `useReducedMotion` hook + `RevealProvider` fallback**:
   ```tsx
   // RevealProvider.tsx
   if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
     document.querySelectorAll(".reveal").forEach((el) => el.classList.add("visible"));
     return;  // skip IntersectionObserver
   }
   ```

### 8.5 ARIA Patterns (cross-cutting)

| Pattern | Where | Implementation |
|---|---|---|
| `aria-hidden="true"` on decorative icons/dots | All components | Universal — every SVG/dot that's decorative |
| `aria-label` on icon-only buttons | Header (search, hamburger, close), SearchBar | `"Search news"`, `"Open menu"`, `"Close menu"`, `"Clear search"` |
| `aria-expanded` on toggles | Header hamburger | `aria-expanded={mobileOpen}` |
| `role="contentinfo"` | Footer | Semantic footer landmark |
| `role="feed"` + `aria-label` | FeedGrid, FeedSkeleton | `"News articles"`, `"Loading news articles"` |
| `role="search"` + `aria-label` | SearchBar container | `"Search news articles"` |
| `role="status"` + `aria-label` + `sr-only` | AdminGuardSkeleton | `"Verifying admin access"` + `"Loading admin console…"` |
| `role="alert"` + `aria-live="polite"` | FeedContainer error block | Screen-reader-announced errors |
| `role="tablist"` + `role="tab"` + `aria-selected` | Header category nav | Active category indicator |
| `role="marquee"` + `aria-label` | NewsTicker | `"Breaking news ticker"` (non-standard but intentional) |
| `<time dateTime={ISO}>` | ArticleCard, ArticleData | Machine-readable timestamp |
| `aria-busy={isLoading}` | LoadMoreButton | Loading state for AT |

### 8.6 Stretched-Link Accessibility

```tsx
<Link href={`/article/${article.id}`}
  className="after:absolute after:inset-0 focus:outline-none
             focus-visible:ring-2 focus-visible:ring-dispatch-ember
             focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50 rounded-sm">
  {article.title}
</Link>
```
The `after:absolute after:inset-0` pseudo-element makes the whole card clickable, but the actual `<a>` text remains the accessible name. Focus ring still appears on the link (not the card).

---

## 9. Anti-Patterns & Common Bugs

### 9.1 Phase 16 Anti-Patterns (most recent — highest priority)

| Anti-Pattern | Why Forbidden | Fix |
|---|---|---|
| **Admin auth only in per-page data components** (Phase 16) | Latent security gap — any new admin page forgetting `verifyAdminSession()` is publicly accessible | Centralize via `<AdminGuard>` async Server Component in `(admin)/layout.tsx` wrapped in `<Suspense>` |
| **`TRUSTED_PROXY` read via `process.env`** (Phase 16) | Bypasses Zod env schema; typos can't be caught at boot | Declare `TRUSTED_PROXY: z.string().optional()` in envSchema; read via typed `env.TRUSTED_PROXY` |
| **`PUSH_KEY_ENCRYPTION_KEY` validated lazily in `getKey()`** (Phase 16) | Boot succeeds with missing/invalid key; first push operation 500s (deferred failure) | Hoist validation to module scope; cache `KEY_BUFFER` so boot fails fast |
| **Prod Redis without `--maxmemory-policy noeviction --appendonly yes`** (Phase 16) | Default policy is noeviction but undocumented; no AOF = jobs lost on Redis restart | Add explicit `command:` block to `docker-compose.prod.yml` redis service |
| **`#!/bin/bash.# comment` concatenated shebang** (Phase 16) | Kernel tries to exec `/bin/bash.#` which doesn't exist; `./deploy.sh` fails with "cannot execute" | Shebang must be on its own line: `#!/bin/bash` then `# comment` on line 2 |
| **`"DOCKER_REGISTRY/path"` without `$` prefix** (Phase 16) | Literal string passed to command; variable never interpolated | Use `"${DOCKER_REGISTRY}/path"` with `$` prefix |

### 9.2 Next.js 16 Anti-Patterns

| Anti-Pattern | Why Forbidden | Fix |
|---|---|---|
| `any` in TypeScript | Breaks strict mode contract | `unknown` + type guards |
| `enum` / `namespace` | Compile to runtime IIFE/closure; violates `erasableSyntaxOnly` | String unions + ES modules |
| `throw new Error()` in RSC auth | Triggers full-page error boundary | `redirect('/sign-in')` from `next/navigation` |
| Synchronous `params` access | Runtime 500 in Next.js 16 App Router | Always `await params` (it's a `Promise<T>`) |
| Synchronous `cookies()` access | `TS2339` error | `(await cookies()).get('key')` |
| `new Date()` in Server Component | `next-prerender-current-time` build error | Move to Client Component with `useEffect`, or wrap in `<Suspense>` |
| `.reveal` class on above-the-fold elements | Hydration mismatch (server renders `reveal`, client wants `reveal visible`) | Only use `.reveal` for below-the-fold elements |
| Direct `await` of DB query in page | `blocking-route` error with `cacheComponents: true` | Wrap in `<Suspense>` with Server Component |
| `revalidateTag` in workers | Next.js-only API, not available in Node.js worker process | Use Redis pub/sub for cache invalidation |
| `as any` with Drizzle `.with()` | Type inference broken for relational queries | Use explicit `.innerJoin()` instead |
| Missing `@tailwindcss/postcss` plugin | Tailwind v4 generates ZERO utility classes (silently) | Install `@tailwindcss/postcss@4.3.1` + create `postcss.config.mjs` |
| `next/font/google` for Commit Mono | Not available on Google Fonts | Use `next/font/local` with woff2 from `@fontsource/commit-mono` |
| Stale `.next/` cache after config change | Serves pre-fix CSS; masks the fix | Always `rm -rf .next/` after PostCSS/Tailwind/Next.js config changes |
| `experimental.ppr` in config | Build error in Next.js 16 — removed | Use `cacheComponents: true` (top-level) instead |
| `experimental.dynamicIO` in config | Deprecated — replaced by `cacheComponents` | Remove entirely |
| `experimental.clientSegmentCache` | Not in `ExperimentalConfig` type in 16.2.9 → `TS2353` | Document as deferred; re-enable when upstream type includes it |

### 9.3 Drizzle / Database Anti-Patterns

| Anti-Pattern | Why Forbidden | Fix |
|---|---|---|
| `drizzle-kit push` in production | Overwrites schema without migration history | `generate` + `migrate` only |
| `hashContent` without body | Content-only updates silently dropped | Include body: `hashContent(title, body, publishedAt)` |
| FNV-1a hash for `contentHash` | 8-char hash not collision-resistant; doesn't match SHA-256 spec | Use `node:crypto` `createHash("sha256")` → 64-char hex |
| Hardcoded SHA-256 vector in test | Brittle — fails if delimiter/date format changes | Property-based test: compute expected via `node:crypto` inline |
| `keys: { p256dh: encryptedEnvelope }` (Phase 14) | Semantically misleading — schema says `{ p256dh, auth }` but p256dh holds entire envelope | Use dedicated `encryptedKeys` text column |
| `summaryStatus: "none"` after retries exhausted | No observability — failed summaries invisible | Use `getSummaryFailureState()` → `needs_review` |
| Lazy proxy for DrizzleAdapter | Incorrectly documented — lazy proxy IS correct | Use `Proxy<T>` intercepting ALL property access (not plain object) |
| Leftmost `x-forwarded-for` IP behind CDN | Spoofable — attacker can bypass rate limiting | Use `TRUSTED_PROXY=true` env var → rightmost IP |

### 9.4 Worker / Cache Anti-Patterns

| Anti-Pattern | Why Forbidden | Fix |
|---|---|---|
| Individual `scoreQueue.add()` per article | Non-atomic; cache invalidation can fire before all scoring completes | Use `enqueuePostIngestFlow()` FlowProducer atomic DAG |
| `new Redis()` per cache invalidation call | Connection churn under 50 concurrent workers | Module-level singleton publisher |
| Summarising `title_only` / `excerpt` articles | AI hallucination risk | Content availability guard (double-enforced) |
| `parseFeed` stub returning `[]` | Ingestion produces zero articles; system appears healthy but never ingests | Use real `rss-parser` in `src/workers/jobs/parseFeed.ts` |
| `callAISummary` stub returning placeholder | Summaries contain fake data; no real AI call | Use Vercel AI SDK `generateObject()` in `src/workers/jobs/summarize.ts` |

### 9.5 Testing Anti-Patterns

| Anti-Pattern | Why Forbidden | Fix |
|---|---|---|
| `??=` for test env vars | Shell env may contain values that fail Zod schema | Use direct `=` assignment in `src/test/setup.ts` |
| `vi.fn(() => mockInstance)` for constructors | `new` on vi.fn returns empty object, ignoring return value | Use `class MockX { ... }` in the mock factory |
| `vi.fn()` for `global.fetch` without `vi.stubGlobal` | Real `fetch` is called instead of mock | Use `vi.stubGlobal("fetch", mockFetch)` in `beforeEach()` |
| E2E tests scanned by vitest | `@playwright/test` not installed in vitest env → import errors | Exclude `e2e/` + `playwright.config.ts` from `vitest.config.ts`, `eslint.config.mjs`, `tsconfig.json` |
| Missing env vars in CI | `src/lib/env/index.ts` validates at module load; breaks ALL CI steps including lint | Set all required env vars in `ci.yml` `env:` block with CI-safe dummy values |
| `vi.stubEnv("TRUSTED_PROXY", "true")` after switching to `env.TRUSTED_PROXY` | Won't work — `env` is computed at module load | Mock `@/lib/env` with mutable `mockEnv` object (see `route.test.ts`) |

### 9.6 Docker / Deployment Anti-Patterns

| Anti-Pattern | Why Forbidden | Fix |
|---|---|---|
| `node:22-alpine` in Dockerfile | Violates `engines.node: ">=24.0.0"` | Pin to `node:24-alpine` in all Dockerfiles |
| Missing `output: "standalone"` in `next.config.ts` | `Dockerfile.web` copies `.next/standalone/` which doesn't exist → build fails | Add `output: "standalone"` top-level |
| `Dockerfile.worker` referencing `worker:build` script | Script doesn't exist — `pnpm run worker:build` fails | Run `tsx src/workers/index.ts` directly |
| `Dockerfile.worker` copying non-existent `dist/` | No build step produces `dist/` | Don't compile the worker; run from `src/` via `tsx` |
| Malformed Dockerfile lines (`COPY . .RUN`) | Missing newline — Docker parses as single command | Each `RUN`/`COPY`/`WORKDIR` on its own line |
| `Dockerfile.dev` copying `packages/` | Directory doesn't exist (not a monorepo) | Remove the `COPY packages/` line |
| Always-on OAuth providers | Auth.js throws at boot if `CLIENT_ID`/`CLIENT_SECRET` missing | Make providers conditional via `buildProviders()` |

### 9.7 CSS / Styling Anti-Patterns

| Anti-Pattern | Why Forbidden | Fix |
|---|---|---|
| Merge artifact in CSS (e.g., ` INCLUDED`) | Corrupts Tailwind v4 `@theme` block, poisoning entire theme | Review CSS diffs after merges; run `pnpm build` before pushing |
| Corrupted className (e.g., `font浃着`, `Monad`) | Invalid CSS class silently ignored; element falls back to wrong font | Review CSS class strings after edits; use `font-mono` consistently |
| Raw hex colors in Tailwind classes | Bypasses design token system; breaks theming | Use design tokens (`bg-ink-900`, `text-paper-50`) |
| Generic fonts (Inter, Roboto, Space Grotesk) | Violates "Editorial Dispatch" anti-generic mandate | Newsreader, Instrument Sans, Commit Mono only |

### 9.8 The `#!/bin/bash.#` Shebang Bug (Phase 16 — subtle!)

**Symptom:** `./scripts/deploy.sh` fails with `cannot execute: required file not found`. But `bash scripts/deploy.sh` works fine. And `bash -n scripts/deploy.sh` reports no syntax error.

**Root cause:** Line 1 was `#!/bin/bash.# Deployment script...` — the shebang is concatenated with a comment. The kernel tries to exec `/bin/bash.#` (which doesn't exist). `bash -n` doesn't catch this because bash treats the shebang line as a comment.

**Fix:** Split onto two lines:
```bash
#!/bin/bash
# Deployment script for OneStopNews. Production deployments only.
```

**Prevention:** The Phase 16 CI gate runs a shebang regex check on all `scripts/*.sh` files: first line must be exactly `#!/bin/bash` or `#!/usr/bin/env bash` with no trailing text.

---

## 10. Debugging Guide

### 10.1 "Tailwind utility classes not generating" (zero styling)

**Check 1:** Is `postcss.config.mjs` present?
```bash
cat postcss.config.mjs
# Should show: plugins: { '@tailwindcss/postcss': {} }
```

**Check 2:** Is `@tailwindcss/postcss` installed?
```bash
pnpm why @tailwindcss/postcss
```

**Check 3:** Clear `.next` cache and restart:
```bash
rm -rf .next
pnpm dev
```

**Check 4:** Verify `globals.css` starts with `@import "tailwindcss";` (line 1).

### 10.2 "Commit Mono font not loading"

**Check:** Is the woff2 file present?
```bash
ls -la public/fonts/commit-mono-400.woff2
```

If missing, extract from `@fontsource/commit-mono`:
```bash
pnpm add -D @fontsource/commit-mono@5.2.5
cp node_modules/@fontsource/commit-mono/files/commit-mono-400-normal.woff2 public/fonts/commit-mono-400.woff2
```

**Never** use `next/font/google` for Commit Mono — it's not on Google Fonts.

### 10.3 "Next.js 16 `blocking-route` error"

**Cause:** With `cacheComponents: true`, any uncached async data fetch (e.g., Drizzle query) directly in a page component triggers this error.

**Fix:** Extract the fetch into a Server Component and wrap with `<Suspense>`:
```tsx
// page.tsx — NO direct await
export default function Page() {
  return (
    <main>
      <Suspense fallback={<FeedSkeleton />}>
        <FeedData limit={6} />
      </Suspense>
    </main>
  );
}

// FeedData.tsx — async Server Component
export async function FeedData({ limit }: { limit: number }) {
  const feed = await getFeedArticles({ limit });
  return <FeedContainer ... />;
}
```

### 10.4 "`next-prerender-current-time` error"

**Cause:** `new Date()` or `Date.now()` in a Server Component. Next.js 16 `cacheComponents` blocks prerendering of non-deterministic values.

**Fix:** Move to a Client Component with `useEffect`:
```tsx
"use client";
function Footer() {
  const [year, setYear] = useState<number>();
  useEffect(() => setYear(new Date().getFullYear()), []);
  return <footer>© {year}</footer>;
}
```
Or wrap the Client Component in `<Suspense>` (the root layout already does this for `<Footer />`).

### 10.5 "RSS feed parsing returns empty array"

**Check 1:** Validate the feed URL manually:
```bash
curl -s <feed-url> | head -20
```

**Check 2:** Is it Atom? Look for `<feed` root element. The parser detects Atom via regex on raw XML, not `parsed.feedType` (which is `undefined` in v3.13.0).

**Check 3:** Are items missing `<title>`? The parser skips items without titles.

**Check 4:** Run the parseFeed tests:
```bash
pnpm test -- src/workers/jobs/parseFeed.test.ts
```
There are 13 tests covering RSS 2.0, Atom, JSON Feed, and edge cases.

### 10.6 "AI summarization returns placeholder data"

**Check:** Is `callAISummary` a stub or real?
```bash
grep -n "Summary placeholder" src/workers/
```
Should return no matches. If it does, the stub is shadowing the real implementation.

**Verify:** `src/workers/jobs/summarize.ts` uses `generateObject()` from the Vercel AI SDK:
```bash
grep -n "generateObject" src/workers/jobs/summarize.ts
```

### 10.7 "Rate limit returns 429 unexpectedly"

**Check 1:** Multiple clients behind NAT/proxy share an IP — this is expected behavior.

**Check 2:** Stale Redis TTL?
```bash
redis-cli get ratelimit:api:articles:<ip>
redis-cli ttl ratelimit:api:articles:<ip>
redis-cli del ratelimit:api:articles:<ip>  # reset
```

**Check 3:** If behind a CDN, set `TRUSTED_PROXY=true` to use the rightmost IP (prevents spoofing).

### 10.8 "`hashContent` returns 8-character hash"

**Cause:** Old FNV-1a implementation is present.

**Fix:** Verify `src/domain/articles/normalize.ts` uses SHA-256:
```bash
grep -n "createHash\|FNV\|2166136261" src/domain/articles/normalize.ts
```
Should show `createHash("sha256")`, NOT `2166136261` (FNV-1a seed).

### 10.9 "FlowProducer not enqueuing scoring jobs"

**Check:** Is the ingest worker using `enqueuePostIngestFlow` or individual `scoreQueue.add()`?
```bash
grep -n "enqueuePostIngestFlow\|scoreQueue.add" src/workers/index.ts
```
Should show `enqueuePostIngestFlow` (the atomic DAG), not `scoreQueue.add` (non-atomic).

### 10.10 "CI fails with 'Environment variable validation failed'"

**Cause:** `src/lib/env/index.ts` validates at module load. Even `pnpm lint` imports modules that import `@/lib/env`, so missing vars break ALL CI steps.

**Fix:** Ensure `.github/workflows/ci.yml` `env:` block sets ALL required vars with CI-safe dummy values:
```yaml
env:
  DATABASE_URL: "postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable"
  REDIS_URL: "redis://localhost:6379"
  AUTH_SECRET: "ci-dummy-secret-at-least-32-characters-long-xxx"
  # ... all 15 vars (see ci.yml for the full list)
  TRUSTED_PROXY: "true"
  NODE_ENV: "test"
```

### 10.11 "`./scripts/deploy.sh` cannot execute"

**Check line 1:**
```bash
head -1 scripts/deploy.sh
```
Should be exactly `#!/bin/bash` — no trailing text.

**If broken:** `git checkout scripts/deploy.sh` (Phase 16 fixed this).

### 10.12 "Docker build fails with '.next/standalone not found'"

**Check:** Is `output: "standalone"` in `next.config.ts`?
```bash
grep 'output: "standalone"' next.config.ts
```
Phase 15 added this. If missing, add it (top-level, alongside `cacheComponents: true`).

### 10.13 "OAuth sign-in button not appearing"

**Cause:** OAuth env vars (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, etc.) not set. The sign-in page uses `showGoogle`/`showGithub` props derived from env var presence.

**Fix:** Set BOTH `CLIENT_ID` AND `CLIENT_SECRET` for a provider. Partial config is silently ignored (defensive).

### 10.14 "PUSH_KEY_ENCRYPTION_KEY error at boot" (Phase 16)

**Symptom:** Worker/web server fails to start with:
```
Error: PUSH_KEY_ENCRYPTION_KEY must be a 32-byte (64 hex char) string. Generate one with: openssl rand -hex 32
```

**Fix:** Generate a valid key:
```bash
openssl rand -hex 32  # → 64 hex chars
```
Set it in `.env.local` as `PUSH_KEY_ENCRYPTION_KEY=<64-hex-chars>`.

---

## 11. Pre-Ship Checklist

Before claiming any task complete, verify ALL of the following:

### 11.1 Quality Gates (must pass)
```bash
pnpm check          # tsc --noEmit && pnpm lint --max-warnings 0
pnpm test           # vitest run (292 tests / 52 suites expected)
```
Both must exit 0 with no output (silent success).

### 11.2 Code Standards
- [ ] Zero `any` types (use `unknown` + type guards)
- [ ] Zero `enum` / `namespace` (string unions + ES modules)
- [ ] `import type` for type-only imports (required by `verbatimModuleSyntax`)
- [ ] All async `params`/`searchParams` awaited (Next.js 16)
- [ ] All DB queries in feature `queries.ts` (not in components/pages)
- [ ] All env vars read via `env` export (not `process.env` directly, except `providers.ts` for testability)
- [ ] All Server Components that fetch data wrapped in `<Suspense>`

### 11.3 Accessibility (WCAG AAA)
- [ ] `aria-hidden="true"` on all decorative icons/dots
- [ ] `aria-label` on all icon-only buttons/links
- [ ] `role` attributes on landmarks (`contentinfo`, `feed`, `search`, `status`, `tablist`)
- [ ] `<time dateTime={ISO}>` for all timestamps
- [ ] `focus-visible:ring-2 focus-visible:ring-dispatch-ember` on all interactive elements
- [ ] `prefers-reduced-motion` respected (CSS `motion-safe:` variant or `useReducedMotion` hook)
- [ ] Color contrast ≥ 7:1 for body text (AAA), ≥ 4.5:1 for UI (AA)

### 11.4 Design System
- [ ] Only Newsreader / Instrument Sans / Commit Mono fonts
- [ ] Only design tokens (no raw hex in Tailwind classes)
- [ ] `.font-editorial` not paired with redundant `font-[800]`/`leading-tight`/`tracking-[-0.02em]`
- [ ] CSS Subgrid pattern correct: parent `gap-x-8` only, child `grid-rows-subgrid row-span-3`
- [ ] Stretched-link pattern: `after:absolute after:inset-0` on card links

### 11.5 Security
- [ ] No `verifyAdminSession()` in `proxy.ts` (Layer 0 — no DB)
- [ ] Admin routes guarded by `<AdminGuard>` in `(admin)/layout.tsx`
- [ ] Content Guard enforced in BOTH Server Action AND API Route
- [ ] `PUSH_KEY_ENCRYPTION_KEY` validated at module load (fail-fast)
- [ ] `TRUSTED_PROXY` declared in Zod env schema
- [ ] Rate limiting active on `/api/articles` (20 req/s per IP)
- [ ] AES-256-GCM encryption for push keys at rest
- [ ] Security headers configured (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`)

### 11.6 Infrastructure
- [ ] All Dockerfiles pinned to `node:24-alpine`
- [ ] `output: "standalone"` in `next.config.ts`
- [ ] `docker-compose.prod.yml` Redis has `command:` block (`--maxmemory-policy noeviction --appendonly yes`)
- [ ] All shell scripts pass `bash -n` + shebang regex check (CI gate)
- [ ] All docker-compose files pass YAML validation (`scripts/validate-compose.py`)

### 11.7 Testing
- [ ] New code has tests (TDD: RED → GREEN → REFACTOR)
- [ ] `pnpm test` count increased (or unchanged if infra-only)
- [ ] No `vi.fn(() => mockInstance)` for constructors (use real class in mock factory)
- [ ] No `vi.stubEnv` for vars read via `env` export (mock `@/lib/env` instead)
- [ ] `e2e/` excluded from `vitest.config.ts`, `eslint.config.mjs`, `tsconfig.json`

### 11.8 Documentation
- [ ] If adding a new phase, update `CLAUDE.md`, `AGENTS.md`, `README.md` Phase Status tables
- [ ] If adding a new anti-pattern, add to the Anti-Patterns tables in all 3 docs
- [ ] If adding a new file, add to the File Inventory in `AGENTS.md`
- [ ] Update test count in all 3 docs if it changed

---

## 12. Lessons Learnt & How to Avoid Them

### 12.1 Phase 16 Lessons (most recent)

#### Centralize Security at Boundaries, Not Leaves
**Lesson:** Next.js 16 `cacheComponents` rejects synchronous layouts that perform async work, but the fix is NOT to push auth into per-page components (fragile — relies on every page author remembering). The correct pattern is an async Server Component guard wrapped in `<Suspense>` inside the layout. **Centralize security at boundaries, not at leaves.**

#### Declare EVERY Env Var in Zod Schema
**Lesson:** The `env` export is a frozen, validated object computed at module load. Tests can't use `vi.stubEnv` to change it dynamically — the pattern from `cacheInvalidation.test.ts` (mock `@/lib/env` with a mutable `mockEnv` object) is the correct approach. Always declare EVERY env var in the Zod schema, even optional ones — typos in `process.env.MY_VAR` are silently `undefined` and impossible to debug.

#### Security-Critical Env Vars Must Fail Fast at Boot
**Lesson:** Security-critical env vars must be validated at module load (fail-fast at boot), not lazily on first use. The pattern matches `env/index.ts:109` (`export const env = validateEnv();`). Tests for module-load behavior require `vi.resetModules()` + dynamic `import()` to re-trigger the module load with controlled env state.

#### `bash -n` Is Permissive — Use Regex for Shebangs
**Lesson:** `bash -n` treats shebang lines as comments and won't catch malformed shebangs. The only way to catch the `#!/bin/bash.#` bug is a regex check on line 1, OR attempting to execute the script directly. The CI gate uses the regex approach because it's faster and doesn't require execution. Always validate infra-only changes (shell scripts, YAML, Dockerfiles) in CI — they don't have unit tests, so a dedicated gate is the only safety net.

### 12.2 Phase 15 Lessons

#### Dockerfiles Must Be Validated in CI, Not Just Visually Reviewed
**Lesson:** Always pin to the exact Node version specified in `engines.node`. Each Dockerfile instruction (`RUN`, `COPY`, `WORKDIR`) must be on its own line. Never reference directories or scripts that don't exist — verify with `ls` and `cat package.json` before writing Dockerfile instructions.

#### `output: "standalone"` + Dockerfile Copy Are a Coupled Pair
**Lesson:** `output: "standalone"` is mandatory when using the standalone Docker pattern. Without it, the Dockerfile references a directory that doesn't exist. Always pair the config flag with the Dockerfile copy step.

#### Server Component Page 1 + Client Component Subsequent Pages
**Lesson:** The Next.js 16 App Router pattern for paginated feeds is: Server Component fetches page 1 (for fast initial render + SEO), Client Component fetches subsequent pages (for interactivity). The `<Suspense>` boundary wraps the Server Component so the page shell renders immediately. The `LoadMoreButton` is hidden entirely when `hasMore` is false — **the absence of the button IS the empty state.**

#### TDD-Style Column Drop Verification
**Lesson:** Before dropping a column, grep the entire `src/` for references. Use the test mock as a canary — if removing the column from the mock doesn't break tests, no code reads it. Always generate a Drizzle migration (`drizzle-kit generate`) rather than writing SQL by hand.

#### Conditional OAuth Providers for Backward Compat
**Lesson:** When adding new auth providers, make them conditional on env vars. Never assume all deployments will have the same provider configuration. The `Provider` type from Auth.js v5 is a union (object form + function form) — use `'id' in p` narrowing to access the `id` property safely in tests.

#### Verify Referenced Routes Actually Exist
**Lesson:** Always verify that routes referenced in `pages.signIn`/`pages.error` actually exist. The Auth.js config silently accepts non-existent paths — the failure only appears at runtime when a user is redirected to a 404. Server-action forms (`<form action="..." method="post">`) are the simplest OAuth trigger pattern — no `SessionProvider` or client-side `signIn()` needed.

### 12.3 Phase 14 Lessons

#### Include ALL Content Fields in Change-Detection Hashes
**Lesson:** When hashing for change detection, include ALL fields that represent "content" — not just identifiers. Title + date identify the article; body IS the content. Without body in the hash, content-only edits are silently dropped.

#### Distinguish Direct Exposure vs Trusted Proxy
**Lesson:** IP extraction from `x-forwarded-for` must distinguish between "direct exposure" (leftmost = client) and "behind trusted proxy" (rightmost = proxy's client). Use an env var to switch modes — don't hardcode either.

#### Schema Types Should Match Storage Semantics
**Lesson:** If a field stores an encrypted envelope, it should be a single string column — not stuffed into a typed object field. Additive migrations (new column) are safer than in-place type changes.

#### `generateMetadata()` Is the Next.js 16 Mechanism for Per-Page Headers
**Lesson:** Set `metadata.other = { "ai-provenance": metaTag, "X-AI-Provenance": httpHeader }` for the 3-layer provenance. JSON-LD can be emitted via a `<script type="application/ld+json">` tag rendered in the page body.

#### Prefer Property-Based Tests Over Hardcoded Vectors
**Lesson:** Hardcoded vectors are brittle and don't explain WHY the hash should be that value. Property-based tests (compute expected via `node:crypto` inline) verify determinism, collision resistance, and the algorithm itself.

#### Exclude Each Test Runner's Files from the Other's Config
**Lesson:** When using multiple test runners (vitest for unit/integration, Playwright for E2E), explicitly exclude each runner's files from the other's config. Otherwise, the runner without the dependency will fail to parse the files.

#### Distinguish Temporary Failure from Permanent Failure
**Lesson:** For retryable operations, distinguish "temporary failure (retry)" from "permanent failure (escalate)". After exhausting retries, set a visible failure state — don't silently leave the entity in its initial state.

#### Self-Referential Mocks for Chainable Builders
**Lesson:** Drizzle's query builder is deeply chainable (`select().from().innerJoin().leftJoin().where().limit()`). Mock factories must handle arbitrary chaining depth. Self-referential mocks (`result.method = method`) are the cleanest pattern.

### 12.4 Phase 13 Lessons

#### `rss-parser` Conflates Fields — Extract Explicitly
**Lesson:** Always check what a library conflates before relying on its built-in fields. For feeds, explicit field extraction by format is safer than generic fallbacks. `rss-parser` conflates `<content:encoded>`, `<description>`, and `<content>` into `content`. Detect Atom via raw XML root (`<feed>`), not `parsed.feedType` (undefined in v3.13.0).

#### Vercel AI SDK v6 `generateObject()` Returns `result.object`
**Lesson:** The validated output is in `result.object`, NOT `result` directly. Return `{ ...result.object, model: PRIMARY_MODEL, tokensUsed: result.usage?.totalTokens ?? 0 }`.

#### Module-Level Singleton Publishers Prevent Connection Churn
**Lesson:** Under high ingest load (50 concurrent workers), creating a new Redis connection per cache invalidation call causes connection churn. Use a module-level singleton publisher. Best-effort: returns `false` on failure, never crashes the worker.

#### `(xmax = 0)` Trick for INSERT vs UPDATE Detection
**Lesson:** PostgreSQL's `xmax` system column is `0` for INSERTs and non-zero for UPDATEs. Combined with `WHERE content_hash != excluded.content_hash`, this enables content-change-detection upserts in a single query.

### 12.5 Phase 12 Lessons

#### Tailwind v4 Requires `@tailwindcss/postcss`
**Lesson:** Without `postcss.config.mjs`, Tailwind v4 generates only `@theme` custom properties — zero utility classes. No build error. Always `rm -rf .next/` after PostCSS/Tailwind/Next.js config changes.

#### Commit Mono Is NOT on Google Fonts
**Lesson:** Use `next/font/local` with woff2 extracted from `@fontsource/commit-mono`. Never add `@font-face` manually.

### 12.6 Phase 11 Lessons

#### `new Date()` in Server Components Breaks Prerendering
**Lesson:** `new Date()` / `Date.now()` in Server Components causes `next-prerender-current-time` build errors under `cacheComponents`. Move to Client Components with `useEffect`, or wrap in `<Suspense>`.

#### `.reveal` Class Only for Below-the-Fold
**Lesson:** Above-the-fold `.reveal` elements cause hydration mismatch (server renders `reveal`, client wants `reveal visible`). Only use `.reveal` for below-the-fold content.

### 12.7 Phase 9 Lessons

#### `<Suspense>` + Server Component for Async Data
**Lesson:** Under `cacheComponents: true`, never `await` a DB query directly in a page. Extract the fetch into a Server Component and wrap with `<Suspense fallback={<Skeleton />}>`.

### 12.8 Phase 8 Lessons

#### CI Env Vars Must Be CI-Safe Dummies
**Lesson:** Set all required env vars in `ci.yml` `env:` block with CI-safe dummy values. Use values that pass the Zod schema (e.g., `DATABASE_URL=postgres://...`, `ANTHROPIC_API_KEY=sk-ant-...`, `PUSH_KEY_ENCRYPTION_KEY=0000...0000` 64 hex chars).

---

## 13. Pitfalls to Avoid

### 13.1 Next.js 16 Specific

1. **Don't add `experimental.ppr` or `experimental.dynamicIO`** — removed in Next.js 16. Use `cacheComponents: true` (top-level) instead.
2. **Don't use `middleware.ts`** — renamed to `proxy.ts` in Next.js 16. Runs on Node.js only (not Edge).
3. **Don't `await params`/`searchParams` synchronously** — they're `Promise<T>` in Next.js 15+. Always `await` them.
4. **Don't use `cookies()` synchronously** — `(await cookies()).get('key')`.
5. **Don't call `revalidateTag` from workers** — it's a Next.js-only API. Use Redis pub/sub instead.
6. **Don't use `clientSegmentCache`, `turbopackPersistentCaching`, `turbopackFileSystemCacheForBuild`** — not in `ExperimentalConfig` type in 16.2.9 → `TS2353`.
7. **Don't put `cacheComponents` inside `experimental`** — must be top-level.
8. **Don't put `cacheLife` profiles inside `experimental`** — must be top-level.

### 13.2 TypeScript Strict Mode

1. **Don't use `any`** — use `unknown` + type guards.
2. **Don't use `enum` or `namespace`** — `erasableSyntaxOnly` forbids them. Use string unions.
3. **Don't omit `import type` for type-only imports** — `verbatimModuleSyntax` requires it.
4. **Don't assume `arr[i]` is `T`** — `noUncheckedIndexedAccess` makes it `T | undefined`. Always null-check.
5. **Don't use `as any`** — if absolutely necessary for a beta adapter, add `eslint-disable-next-line @typescript-eslint/no-explicit-any` with justification.

### 13.3 Drizzle ORM

1. **Don't use `drizzle-kit push` in production** — use `generate` + `migrate` only.
2. **Don't hand-write SQL migrations** — always `drizzle-kit generate`.
3. **Don't use `as any` with `.with()`** — use explicit `.innerJoin()` for type safety.
4. **Don't eagerly create the DB connection at module load** — use the lazy Proxy pattern (see §20.1).
5. **Don't use `pg_textsearch` extension** — it doesn't exist in PG 17. `ts_rank_cd` is built-in.

### 13.4 BullMQ / Redis

1. **Don't use individual `queue.add()` for atomic multi-job flows** — use `FlowProducer`.
2. **Don't create `new Redis()` per call** — use module-level singletons.
3. **Don't use the same Redis connection config for workers and queues** — workers need `enableOfflineQueue: true`, queues need `enableOfflineQueue: false`.
4. **Don't forget `maxRetriesPerRequest: null` for worker connections** — required for BullMQ blocking commands.
5. **Don't run Redis without `--maxmemory-policy noeviction` in production** — BullMQ jobs would be evicted under memory pressure.

### 13.5 Auth.js v5

1. **Don't use database sessions** — use JWT strategy (`session: { strategy: "jwt" }`).
2. **Don't put `verifyAdminSession()` in `proxy.ts`** — Layer 0 has no DB access. Use `<AdminGuard>` in `(admin)/layout.tsx`.
3. **Don't make OAuth providers always-on** — make them conditional via `buildProviders()` based on env var presence.
4. **Don't use `throw new Error()` in RSC auth** — use `redirect('/sign-in')`.
5. **Don't assume `@auth/core` version alignment** — run `pnpm why @auth/core` to diagnose mismatches.

### 13.6 Testing

1. **Don't use `vi.fn(() => mockInstance)` for constructors** — `new` returns empty object. Use real `class MockX { ... }`.
2. **Don't use `vi.fn()` for `global.fetch`** — use `vi.stubGlobal("fetch", mockFn)`.
3. **Don't use `??=` for test env vars** — shell env may contain failing values. Use direct `=`.
4. **Don't use `vi.stubEnv` for vars read via `env` export** — mock `@/lib/env` with mutable object instead.
5. **Don't include `e2e/` in vitest config** — exclude from `vitest.config.ts`, `eslint.config.mjs`, `tsconfig.json`.

### 13.7 Docker / Deployment

1. **Don't use `node:22-alpine`** — violates `engines.node: ">=24.0.0"`. Pin to `node:24-alpine`.
2. **Don't forget `output: "standalone"` in `next.config.ts`** — `Dockerfile.web` copies `.next/standalone/`.
3. **Don't compile the worker** — run `tsx src/workers/index.ts` directly.
4. **Don't copy `packages/`** — not a monorepo, directory doesn't exist.
5. **Don't concatenate shebang with comments** — `#!/bin/bash.# comment` breaks `./script.sh` execution.
6. **Don't run prod Redis without `--maxmemory-policy noeviction --appendonly yes`** — jobs lost on restart.

---

## 14. Best Practices

### 14.1 Architecture

1. **Follow the 5-Layer Model strictly** — `proxy.ts` → App Router → Feature Modules → Domain Services → Infrastructure. Deviations create security/consistency bugs.
2. **Centralize security at boundaries** — `<AdminGuard>` in layout, not per-page.
3. **Use `<Suspense>` for ALL async Server Component data fetches** — prevents `blocking-route` errors.
4. **Use `React.cache()` for per-request memoization** — `verifySession` / `verifyAdminSession` are cached.
5. **Split Redis connections** — Worker (`enableOfflineQueue: true`), Queue (`enableOfflineQueue: false`).
6. **Use module-level singletons** — for Redis publishers, FlowProducer, rate limiter.

### 14.2 Code Style

1. **`interface` > `type`** for structural definitions. `type` for unions/intersections.
2. **Early returns** over deeply nested conditionals.
3. **Composition over inheritance** — no class hierarchies for business logic.
4. **`unknown` over `any`** — always.
5. **Self-documenting code** — name functions clearly, avoid clever one-liners.
6. **Test behavior, not implementation** — don't assert on internal state.
7. **Factory pattern for test data** — `getMockUser(overrides)`.

### 14.3 Database

1. **Drizzle schema is the single source of truth** — types derive via `typeof table.$inferSelect`.
2. **Additive migrations only** — add columns, don't remove in-place. Drop in a later release after code stops reading.
3. **`onConflictDoUpdate` with `WHERE` for change detection** — `WHERE content_hash != excluded.content_hash`.
4. **`(xmax = 0)` for INSERT vs UPDATE detection** — in `RETURNING` clause.
5. **GIN index with `fastupdate=off` for high-write FTS** — prevents WAL bloat (currently commented out in `custom-indexes.sql` — uncomment for production).
6. **`pg_trgm` for autocomplete** — `similarity(title, $partial) > 0.3`.
7. **`websearch_to_tsquery` over `to_tsquery`** — handles quoted phrases, negation, OR naturally.

### 14.4 Caching

1. **`"use cache"` + `cacheLife("profile")`** — opt-in caching under `cacheComponents: true`.
2. **Three cache profiles:** `feed` (30s/120s/600s), `topicShell` (5min/15min/1day), `reference` (1hr/1day/1week).
3. **Workers can't call `revalidateTag`** — use Redis pub/sub (`cache:invalidate:<tag>` channel).
4. **Singleton Redis publisher** — never `new Redis()` per call.
5. **Best-effort invalidation** — return `false` on failure, never crash the worker.

### 14.5 AI / Provenance

1. **3-layer disclosure** — JSON-LD + HTTP header + HTML meta tag. C2PA explicitly rejected.
2. **`generateMetadata()` for per-page headers/meta** — `metadata.other = { "ai-provenance": metaTag, "X-AI-Provenance": httpHeader }`.
3. **`accountablePerson.name` includes model** — `AI System: ${model}`.
4. **Content Guard double-enforced** — Server Action AND API Route both reject `title_only`/`excerpt`.
5. **Anthropic primary + OpenAI fallback** — via Vercel AI SDK `generateObject()` with Zod schema.
6. **`getSummaryFailureState()` for permanent failure visibility** — `needs_review` after 3 retries.
7. **`temperature: 0.1`** — factual-only mode for news summarization.

### 14.6 Accessibility

1. **WCAG AAA target** — verified via `axe-core` + Playwright in CI.
2. **`aria-hidden="true"` on all decorative elements** — universal rule.
3. **`aria-label` on all icon-only buttons** — `"Search news"`, `"Open menu"`, etc.
4. **`role` on landmarks** — `contentinfo`, `feed`, `search`, `status`, `tablist`.
5. **`<time dateTime={ISO}>`** for all timestamps.
6. **`focus-visible:ring-2 ring-dispatch-ember ring-offset-2 ring-offset-paper-50`** — canonical focus ring.
7. **`prefers-reduced-motion` respected** — CSS `motion-safe:` variant + JS `useReducedMotion` hook + `RevealProvider` fallback.
8. **Color contrast** — `ink-600` on `paper-50` is 9.5:1 (AAA).

### 14.7 Performance

1. **Cursor pagination with LIMIT 31 pattern** — fetch `limit+1`, return `limit`, `hasMore = rows.length > limit`.
2. **Rate limiting** — 20 req/s per IP on `/api/articles` via Redis fixed-window counter.
3. **`TRUSTED_PROXY=true` behind CDN** — rightmost IP prevents spoofing.
4. **`Cache-Control: public, max-age=60, stale-while-revalidate=300`** on `/api/articles`.
5. **`output: "standalone"`** for production Docker — bundles only production deps.
6. **CSS Subgrid** — aligns card rows without fixed heights or JS measurement.
7. **`next/font` with `display: "swap"`** — prevents FOIT.
8. **`next/image` with `fill` + `object-cover`** for responsive images.

---

## 15. Coding Patterns

### 15.1 The Lazy DB Proxy Pattern (canonical)

```ts
// src/lib/db/index.ts
let _db: ReturnType<typeof createDb> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("[DB] DATABASE_URL is not set. Database queries will fail.");
  _client = createClient(url);
  _db = createDb(_client);
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_, prop) {
    return getDb()[prop as keyof ReturnType<typeof getDb>];
  },
});
```
**Why:** Next.js imports modules at build time. An eager connection crashes the build when `DATABASE_URL` is unavailable (CI, static export). The Proxy defers connection until first property access.

### 15.2 The `cache()` + `redirect()` DAL Pattern

```ts
// src/lib/auth/dal.ts
export const verifySession = cache(async () => {
  const session = await auth();
  if (!session?.user?.email) redirect("/sign-in");  // NEVER throws
  const user = await db.select({ id, role, name }).from(users).where(eq(users.email, session.user.email)).limit(1).then((rows) => rows[0] ?? null);
  if (!user) redirect("/sign-in");
  return { user, sessionId: session.user.id as string };
});

export const verifyAdminSession = cache(async () => {
  const { user } = await verifySession();  // cached — no double DB hit
  if (user.role !== "admin") redirect("/");
  return user;
});
```
**Why:** `cache()` memoizes per-request (multiple components calling `verifySession` in one render tree execute ONE validation). `redirect()` preserves invisible UX (no full-page error boundary).

### 15.3 The AdminGuard Pattern (Phase 16)

```tsx
// src/shared/components/auth/AdminGuard.tsx — async Server Component
export async function AdminGuard({ children }: AdminGuardProps): Promise<React.ReactElement> {
  await verifyAdminSession();  // redirects internally on failure
  return <>{children}</>;
}

// src/app/(admin)/layout.tsx
<Suspense fallback={<AdminGuardSkeleton />}>
  <AdminGuard>{children}</AdminGuard>
</Suspense>
```
**Why:** Centralizes admin auth at the layout boundary. Any future admin page is automatically protected. `cache()` memoization makes removing per-page guards safe.

### 15.4 The Module-Load Validation Pattern

```ts
// src/lib/security/encrypt.ts
const PUSH_KEY_HEX = process.env.PUSH_KEY_ENCRYPTION_KEY;
if (!PUSH_KEY_HEX || PUSH_KEY_HEX.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(PUSH_KEY_HEX)) {
  throw new Error("PUSH_KEY_ENCRYPTION_KEY must be a 32-byte (64 hex char) string. Generate one with: openssl rand -hex 32");
}
const KEY_BUFFER = Buffer.from(PUSH_KEY_HEX, "hex");  // cached
```
**Why:** Security-critical env vars must fail fast at boot, not lazily on first use. Matches `env/index.ts:109` pattern.

### 15.5 The 3-Layer Provenance Pattern

```ts
// src/app/article/[id]/page.tsx — generateMetadata()
if (article.summary && article.summary.status === "ok") {
  const provenance = generateProvenanceMetadata({ summary, articleId, articleUrl, articleTitle, model, generatedAt });
  metadata.other = {
    "ai-provenance": provenance.metaTag,           // <meta name="ai-provenance">
    "X-AI-Provenance": provenance.httpHeader,      // HTTP response header
    "json-ld-provenance": provenance.jsonLd,        // <script type="application/ld+json">
  };
}
```
**Why:** EU AI Act Article 50 requires machine-readable disclosure. Three layers ensure consumers can read it via their preferred mechanism (crawlers read JSON-LD, proxies read headers, scrapers read meta tags).

### 15.6 The FlowProducer Atomic DAG Pattern

```ts
// src/lib/queue/flows.ts
const children = newArticleIds.map((articleId) => ({
  name: "score-article", queueName: "score", data: { articleId }, opts: { priority: 2 },
}));
await flowProducer.add({
  name: "refresh-feed-slice", queueName: "feed-slice", data: { categoryId, sort: "latest" },
  opts: { priority: 1 }, children,
});
```
**Why:** Parent (`refresh-feed-slice`) runs ONLY after ALL children (`score-article`) complete. Prevents cache invalidation firing before all scoring is done.

### 15.7 The CSS Subgrid Pattern

```tsx
// Parent
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8" role="feed">

// Child
<article className="grid grid-rows-subgrid row-span-3 gap-y-3 mb-10 last:mb-0">
  <h3>Headline</h3>      {/* Row 1 */}
  <p>Excerpt</p>          {/* Row 2 */}
  <div>Metadata</div>     {/* Row 3 */}
</article>
```
**Why:** Aligns Headline/Excerpt/Metadata rows across cards in the same visual row, without fixed heights or JS measurement.

### 15.8 The Stretched-Link Pattern

```tsx
<article className="group relative ...">
  <h3>
    <Link href={`/article/${article.id}`}
      className="after:absolute after:inset-0 focus:outline-none
                 focus-visible:ring-2 focus-visible:ring-dispatch-ember
                 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50 rounded-sm">
      {article.title}
    </Link>
  </h3>
</article>
```
**Why:** Makes the entire card clickable while keeping the `<a>` text as the accessible name. Focus ring still appears on the link.

### 15.9 The `useOptimistic` Pattern (React 19)

```tsx
// src/features/summaries/components/SummaryPanel.tsx
const [optimisticStatus, setOptimisticStatus] = useOptimistic(
  initialStatus,
  (_state, newStatus: SummaryStatus) => newStatus
);

// In click handler — instant UI update BEFORE server confirms:
onClick={() => {
  setOptimisticStatus("pending");  // instant
  onRequestSummary();              // async server call
}}
```
**Why:** Instant UI feedback. The reducer ignores prior state and returns the new status. `disabled={initialStatus === "pending"}` uses REAL status (not optimistic) to prevent double-submits.

### 15.10 The Split Redis Connection Pattern

```ts
// Queue (producer) — prevent memory leaks
function createQueueConnection() {
  return { ...getRedisUrlParts(), maxRetriesPerRequest: undefined as unknown as null, enableOfflineQueue: false };
}

// Worker — persist during outages
function createWorkerConnection() {
  return { ...getRedisUrlParts(), maxRetriesPerRequest: null as unknown as null, enableOfflineQueue: true };
}
```
**Why:** Workers must persist during Redis outages (`enableOfflineQueue: true`). Queues should fail fast to prevent memory leaks (`enableOfflineQueue: false`).

### 15.11 The Module-Level Singleton Pattern

```ts
// src/workers/lib/cacheInvalidation.ts
let _publisher: Redis | null = null;
function getPublisher(): Redis {
  if (!_publisher) {
    _publisher = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 3, connectTimeout: 5000 });
  }
  return _publisher;
}
```
**Why:** Under 50 concurrent ingest workers, creating `new Redis()` per call causes connection churn. Singleton eliminates it.

### 15.12 The Conditional OAuth Provider Pattern

```ts
// src/lib/auth/providers.ts
export function buildProviders(): Provider[] {
  const providers: Provider[] = [credentialsProvider];  // always present
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET }));
  }
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    providers.push(GitHub({ clientId: process.env.GITHUB_CLIENT_ID, clientSecret: process.env.GITHUB_CLIENT_SECRET }));
  }
  return providers;
}
```
**Why:** Backward-compatible — deployments without OAuth continue with Credentials-only. Both `CLIENT_ID` AND `CLIENT_SECRET` must be present (partial config silently ignored).

---

## 16. Coding Anti-Patterns

### 16.1 TypeScript Anti-Patterns

| Anti-Pattern | Fix |
|---|---|
| `any` | `unknown` + type guards |
| `enum` / `namespace` | String unions + ES modules (`erasableSyntaxOnly`) |
| `as any` without eslint-disable | Add `eslint-disable-next-line @typescript-eslint/no-explicit-any` with justification |
| Missing `import type` | `import type { X }` for type-only imports (`verbatimModuleSyntax`) |
| `arr[i]` without null check | `noUncheckedIndexedAccess` makes it `T \| undefined` — always check |
| Explicit return types everywhere | Lean on type inference; explicit types only on public API boundaries |

### 16.2 React / Next.js Anti-Patterns

| Anti-Pattern | Fix |
|---|---|
| `'use client'` on everything | Default to Server Components; `'use client'` only for interactivity |
| `new Date()` in Server Component | Move to Client Component with `useEffect`, or wrap in `<Suspense>` |
| Direct `await` of DB in page | Extract to Server Component, wrap in `<Suspense>` |
| `throw new Error()` in RSC auth | `redirect('/sign-in')` from `next/navigation` |
| `middleware.ts` | Renamed to `proxy.ts` in Next.js 16 |
| Synchronous `params`/`searchParams` | Always `await` (they're `Promise<T>`) |
| `revalidateTag` in workers | Use Redis pub/sub |
| Custom component over Shadcn/Radix | Use library primitive, wrap for bespoke styling |

### 16.3 Drizzle Anti-Patterns

| Anti-Pattern | Fix |
|---|---|
| `drizzle-kit push` in production | `generate` + `migrate` only |
| Hand-written SQL migrations | `drizzle-kit generate` always |
| `as any` with `.with()` | Explicit `.innerJoin()` |
| Eager DB connection at module load | Lazy Proxy pattern |
| `pg_textsearch` extension | Doesn't exist in PG 17 — use built-in `ts_rank_cd` |
| Hand-written enum types | Derive via `typeof enum.enumValues[number]` |

### 16.4 Security Anti-Patterns

| Anti-Pattern | Fix |
|---|---|
| `verifyAdminSession()` in `proxy.ts` | Layer 0 has no DB — use `<AdminGuard>` in `(admin)/layout.tsx` |
| `TRUSTED_PROXY` via `process.env` | Declare in Zod schema, read via `env.TRUSTED_PROXY` |
| Lazy `PUSH_KEY_ENCRYPTION_KEY` validation | Hoist to module load (fail-fast) |
| Summarising `title_only`/`excerpt` | Content Guard (double-enforced) |
| Always-on OAuth providers | Conditional via `buildProviders()` |
| Leftmost IP behind CDN | `TRUSTED_PROXY=true` → rightmost IP |
| Plain-text push keys | AES-256-GCM encryption at rest |

### 16.5 CSS Anti-Patterns

| Anti-Pattern | Fix |
|---|---|
| Raw hex in Tailwind classes | Use design tokens (`bg-ink-900`) |
| Generic fonts (Inter, Roboto) | Newsreader, Instrument Sans, Commit Mono only |
| `.font-editorial` + `font-[800]` | `.font-editorial` already bakes in weight 800 |
| `.reveal` on above-the-fold | Only for below-the-fold (hydration mismatch) |
| Missing `@tailwindcss/postcss` | Install + create `postcss.config.mjs` |
| Corrupted className (`font浃着`) | Review CSS class strings after edits |

### 16.6 Testing Anti-Patterns

| Anti-Pattern | Fix |
|---|---|
| `vi.fn(() => mockInstance)` for constructors | Use real `class MockX { ... }` |
| `vi.fn()` for `global.fetch` | `vi.stubGlobal("fetch", mockFn)` |
| `??=` for test env vars | Direct `=` assignment |
| `vi.stubEnv` for `env` export vars | Mock `@/lib/env` with mutable object |
| E2E files in vitest | Exclude `e2e/` from `vitest.config.ts`, `eslint.config.mjs`, `tsconfig.json` |
| Hardcoded test vectors | Property-based tests (compute expected inline) |

### 16.7 Docker Anti-Patterns

| Anti-Pattern | Fix |
|---|---|
| `node:22-alpine` | Pin to `node:24-alpine` |
| Missing `output: "standalone"` | Add top-level in `next.config.ts` |
| `worker:build` script reference | Run `tsx src/workers/index.ts` directly |
| Copying `dist/` for worker | Don't compile — run from `src/` via `tsx` |
| `COPY packages/` | Not a monorepo — remove |
| Malformed Dockerfile lines | Each `RUN`/`COPY`/`WORKDIR` on its own line |
| `#!/bin/bash.# comment` | Split shebang onto its own line |
| Prod Redis without `noeviction` + AOF | Add `command:` block to `docker-compose.prod.yml` |

---

## 17. Responsive Breakpoint Reference

OneStopNews uses **Tailwind's default breakpoints** (no customization):

| Prefix | Min-width | Typical usage |
|---|---|---|
| (default) | 0px | Mobile-first base styles |
| `sm:` | 640px | Small phones → large phones / small tablets |
| `md:` | 768px | Tablets (e.g., `md:grid-cols-2`, `md:flex` for desktop nav) |
| `lg:` | 1024px | Desktop (e.g., `lg:grid-cols-3`, `lg:grid-cols-12`, `lg:py-24`) |
| `xl:` | 1280px | Large desktop (rarely used; max-width container is 1440px) |
| `2xl:` | 1536px | Not used (max-width caps at 1440px) |

### Container Pattern

```tsx
<div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
```
- **Max width:** 1440px (hardcoded, not a Tailwind default)
- **Horizontal padding:** 16px (mobile) → 24px (sm) → 32px (lg)
- Used in: Header, Footer, Masthead, LeadStory, StatsSection, NewsletterCTA, FaqAccordion, FeedData, ArticleData

### Feed Grid Responsive

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8">
```
- Mobile: 1 column
- Tablet (`md:`): 2 columns
- Desktop (`lg:`): 3 columns
- `gap-x-8` only (no `gap-y` — vertical rhythm owned by cards via `mb-10`)

### Header Responsive

- Mobile: hamburger menu (Radix Dialog slide-in from right)
- `md:` and up: desktop nav with category tabs (`hidden md:flex`)
- Hamburger hidden on desktop: `md:hidden`

### LeadStory Responsive

```tsx
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">
  <div className="lg:col-span-7">  {/* Image — 7/12 on desktop, full on mobile */}
  <div className="lg:col-span-5">  {/* Text — 5/12 on desktop, full on mobile */}
```

### Masthead Responsive

```tsx
<h1 className="font-editorial text-6xl sm:text-7xl lg:text-8xl tracking-[-0.03em]">
```
- Mobile: 6xl (3.75rem)
- `sm:`: 7xl (4.5rem)
- `lg:`: 8xl (6rem)

### Hidden Elements

- `hidden sm:inline` — hide on mobile, show on small+ (e.g., Masthead edition metadata)
- `hidden lg:flex` — hide on mobile/tablet, show on desktop (e.g., broadsheet column rules)
- `md:hidden` — show on mobile only, hide on desktop (e.g., hamburger button)

---

## 18. Z-Index Layer Map

| Z-Index | Element | Context | Token/Class |
|---|---|---|---|
| `999` | `.scroll-progress` bar | Fixed top progress bar | `z-999` (in globals.css) |
| `50` | Radix Dialog Overlay (Header mobile menu) | Full-screen backdrop | `z-50` |
| `50` | Radix Dialog Content (Header mobile menu) | Slide-in panel | `z-50` |
| `40` | `Header` (sticky) | Sticky top header | `z-40` |
| `10` | Foreground stat in StatsSection | Above `.commitment-number` ghost | `relative z-10` |
| (none) | `.commitment-number` | Background faded number | `position: absolute` (no z-index, but behind z-10) |
| (none) | `.nutrition-label` | AI summary panel | (no z-index needed) |
| (none) | `.reveal` elements | Scroll-reveal content | (no z-index needed) |
| (none) | FeedGrid, ArticleCard | Main content | (no z-index needed) |

### Z-Index Rules

1. **Use `z-40` for sticky headers** — above content, below modals.
2. **Use `z-50` for modals/dialogs** — above everything except progress bars.
3. **Use `z-999` for fixed progress indicators** — always visible.
4. **Use `relative z-10` for foreground over absolutely-positioned backgrounds** — e.g., StatsSection stat over `.commitment-number`.
5. **Avoid `z-index` arms races** — if you need `z-[9999]`, you're probably doing something wrong.

---

## 19. Color Reference (Complete)

### 19.1 Ink Scale (text / dark surfaces)

| Token | Hex | RGB | Usage |
|---|---|---|---|
| `--color-ink-900` | `#1a1a18` | rgb(26, 26, 24) | Headlines, letterpress black, admin sidebar bg |
| `--color-ink-700` | `#2a2a27` | rgb(42, 42, 39) | Admin sidebar border, secondary dark surface |
| `--color-ink-600` | `#3d3d3a` | rgb(61, 61, 58) | **Body text** (WCAG AAA 9.5:1 on paper-50) |
| `--color-ink-500` | `#525250` | rgb(82, 82, 80) | (reserved) |
| `--color-ink-400` | `#6b6b68` | rgb(107, 107, 104) | Secondary text, metadata |
| `--color-ink-300` | `#8a8a83` | rgb(138, 138, 131) | Muted text, placeholders (AA Large only — never body) |
| `--color-ink-100` | `#e8e8e4` | rgb(232, 232, 228) | Dividers, borders, scrollbar thumb |

### 19.2 Paper Scale (light / backgrounds)

| Token | Hex | RGB | Usage |
|---|---|---|---|
| `--color-paper-50` | `#fafaf8` | rgb(250, 250, 248) | **Page background** (newsprint off-white) |
| `--color-paper-100` | `#f2f2ee` | rgb(242, 242, 238) | Card surface, footer bg, skeleton base |
| `--color-paper-200` | `#e6e4de` | rgb(230, 228, 222) | Skeleton fills, border on cards |
| `--color-paper-300` | `#d8d4cc` | rgb(216, 212, 204) | Broadsheet column rules, Masthead borders |

### 19.3 Dispatch Brand Accents

| Token | Hex | RGB | Usage |
|---|---|---|---|
| `--color-dispatch-ember` | `#c7513f` | rgb(199, 81, 63) | **Primary accent** — breaking news, focus rings, AI Brief, primary buttons |
| `--color-dispatch-ember-light` | `#fde8e4` | rgb(253, 232, 228) | Active category bg (with `/40` opacity) |
| `--color-dispatch-sage` | `#6b8f71` | rgb(107, 143, 113) | Finance, positive, "ok" status, success |
| `--color-dispatch-sage-light` | `#e4ede5` | rgb(228, 237, 229) | Sage hover bg |
| `--color-dispatch-slate` | `#5a6b7a` | rgb(90, 107, 122) | Tech, neutral, source names |
| `--color-dispatch-slate-light` | `#e2e7ec` | rgb(226, 231, 236) | Slate hover bg |
| `--color-dispatch-clay` | `#8b6d5a` | rgb(139, 109, 90) | Local, politics |
| `--color-dispatch-clay-light` | `#ede5df` | rgb(237, 229, 223) | Clay hover bg |
| `--color-dispatch-violet` | `#7a6b8f` | rgb(122, 107, 143) | Culture, creative, citation links |
| `--color-dispatch-violet-light` | `#e8e4ef` | rgb(232, 228, 239) | Violet hover bg, citation hover |

### 19.4 Category → Color Mapping (from `CATEGORIES` const in Header.tsx)

| Category | Slug | Color Class | Active Border |
|---|---|---|---|
| Top Stories | `top-stories` | `bg-dispatch-ember` | `border-dispatch-ember` |
| Local | `local` | `bg-dispatch-clay` | `border-dispatch-clay` |
| Tech | `tech` | `bg-dispatch-slate` | `border-dispatch-slate` |
| Global | `global` | `bg-dispatch-slate` | `border-dispatch-slate` |
| Finance | `finance` | `bg-dispatch-sage` | `border-dispatch-sage` |
| Politics | `politics` | `bg-dispatch-clay` | `border-dispatch-clay` |
| Culture | `culture` | `bg-dispatch-violet` | `border-dispatch-violet` |

### 19.5 Summary Status → Color Mapping

| Status | Border | Background | Dot | Badge Text |
|---|---|---|---|---|
| `none` | `border-dispatch-ember` | `bg-paper-100/50` | `bg-dispatch-ember` | — |
| `pending` | `border-ink-300` | `bg-paper-100/50` | `bg-ink-300 animate-pulse` | `text-ink-400` "Processing" |
| `ok` | (NutritionLabel `border-l-2 border-dispatch-ember`) | `bg-paper-100/50` | `bg-dispatch-sage` | `text-dispatch-sage` "AI Brief" |
| `needs_review` | `border-amber-500` | `bg-amber-50` | `bg-amber-500` | `text-amber-700 bg-amber-50` "Under Review" |
| `disabled` | — | — | — | (no UI) |

### 19.6 Opacity Modifiers (Tailwind)

Colors are frequently used with opacity modifiers:
- `/10` — subtle bg tint (e.g., `bg-dispatch-ember/10` in Badge)
- `/20` — border tint (e.g., `border-dispatch-ember/20`)
- `/40` — active state bg (e.g., `bg-dispatch-ember-light/40`)
- `/50` — card hover bg (e.g., `hover:bg-paper-100/50`)
- `/90` — button hover (e.g., `hover:bg-dispatch-ember/90`)
- `/95` — sticky header bg (e.g., `bg-paper-50/95 backdrop-blur-sm`)

### 19.7 Non-Token Colors (use sparingly)

| Color | Usage |
|---|---|
| `red-600` / `red-700` | `destructive` button variant |
| `amber-500` / `amber-50` / `amber-700` / `amber-800` | `needs_review` status (Tailwind defaults) |
| `black/40` | Dialog overlay backdrop |
| `white` | Text on ember buttons, dot in Breaking badge |

---

## 20. The Complete TypeScript Interface Reference

### 20.1 Database Schema Types (from `src/lib/db/schema.ts`)

```ts
// ── Enums (4) ──
export const userRoleEnum = pgEnum("user_role", ["reader", "admin"]);
export const feedFormatEnum = pgEnum("feed_format", ["rss", "atom", "json_api"]);
export const contentAvailabilityEnum = pgEnum("content_availability", [
  "title_only", "excerpt", "partial_text", "full_text",
]);
export const summaryStatusEnum = pgEnum("summary_status", [
  "none", "pending", "ok", "needs_review", "disabled",
]);

// ── Inferred Types (13) ──
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type Subcategory = typeof subcategories.$inferSelect;
export type Source = typeof sources.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type Summary = typeof summaries.$inferSelect;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type UserPreference = typeof userPreferences.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type VerificationToken = typeof verificationTokens.$inferSelect;

// ── Custom Type ──
export const tsvector = customType<{ data: string }>({ dataType() { return "tsvector"; } });
```

### 20.2 Domain Types (from `src/domain/articles/types.ts`)

```ts
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

### 20.3 Search Types (from `src/features/search/types.ts`)

```ts
export interface SearchParams {
  query: string;
  categorySlug?: string;
  cursor?: Date;
  limit?: number;
}

export interface SearchResult {
  article: ArticleWithSource;
  rank: number;  // ts_rank_cd score
}

export interface SearchPage {
  results: SearchResult[];
  nextCursor: string | null;
  hasMore: boolean;
}
```

### 20.4 Feed Types (from `src/features/feed/queries.ts`)

```ts
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

### 20.5 Summary Schema (from `src/features/summaries/lib/summariseSchema.ts`)

```ts
export const sourceCitationSchema = z.object({
  url: z.string().url("Source URL must be a valid URL"),
  title: z.string().trim().min(1, "Source title cannot be empty"),
});

export const summarisationOutputSchema = z.object({
  summaryText: z.string().min(50, "Summary must be at least 50 characters").max(800, "Summary must not exceed 800 characters"),
  keyPoints: z.array(z.string().trim().min(1).max(120)).min(1, "At least one key point is required").max(5, "No more than 5 key points allowed"),
  sourcesCited: z.array(sourceCitationSchema).min(1, "At least one source must be cited"),
  aiStatement: z.string().min(20, "AI statement must be at least 20 characters").max(200, "AI statement must not exceed 200 characters"),
  coveragePercentage: z.number().int().min(0, "Coverage cannot be negative").max(100, "Coverage cannot exceed 100%"),
});

export type SummarisationOutput = z.infer<typeof summarisationOutputSchema>;

export function validateSummarisationOutput(raw: unknown): { success: true; data: SummarisationOutput } | { success: false; error: string };
```

### 20.6 Provenance Types (from `src/lib/ai/provenance.ts`)

```ts
export interface ProvenanceInput {
  summary: SummarisationOutput;
  articleId: string;
  articleUrl: string;
  articleTitle: string;
  model: string;
  generatedAt: string;  // ISO timestamp
}

export interface ProvenanceResult {
  jsonLd: string;      // Layer 1 — <script type="application/ld+json">
  httpHeader: string;  // Layer 2 — X-AI-Provenance (Base64)
  metaTag: string;     // Layer 3 — <meta name="ai-provenance">
}

export function generateProvenanceMetadata(input: ProvenanceInput): ProvenanceResult;
```

### 20.7 Rate Limit Types (from `src/lib/rateLimit.ts`)

```ts
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;  // Epoch milliseconds
}

export async function checkRateLimit(identifier: string, limit: number, windowSec: number): Promise<RateLimitResult>;
```

### 20.8 Queue Flow Types (from `src/lib/queue/flows.ts`)

```ts
export interface PostIngestFlowInput {
  newArticleIds: string[];
  categoryId: string;
}

export async function enqueuePostIngestFlow(input: PostIngestFlowInput): Promise<void>;
```

### 20.9 Encryption Types (from `src/lib/security/encrypt.ts`)

```ts
export function encryptPushKeys(keys: { p256dh: string; auth: string }): string;
export function decryptPushKeys(encryptedString: string): { p256dh: string; auth: string };
```

### 20.10 Worker Job Types (from `src/workers/`)

```ts
// parseFeed.ts
export interface FeedItem {
  title: string;
  excerpt?: string;
  body?: string;
  url: string;
  publishedAt?: Date;
}
export type FeedFormat = "rss" | "atom" | "json_api";
export async function parseFeed(content: string, feedFormat: FeedFormat): Promise<FeedItem[]>;

// summarize.ts
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
export async function callAISummary(article: ArticleForSummarization): Promise<SummarizationResult>;

// summarizeFailure.ts
export interface SummaryFailureState {
  summaryStatus: "none" | "needs_review";
  flagReason: string | null;
}
export function getSummaryFailureState(attemptsMade: number, maxAttempts?: number): SummaryFailureState;

// determineContentAvailability.ts
type ContentAvailability = (typeof contentAvailabilityEnum.enumValues)[number];
interface ParsedContent { title?: string; excerpt?: string; body?: string; }
export function determineContentAvailability(parsed: ParsedContent): ContentAvailability;
```

### 20.11 Domain Logic Types (from `src/domain/`)

```ts
// articles/normalize.ts
export function normalizeCanonicalUrl(url: string): string;
export function hashContent(title: string, body: string | null | undefined, publishedAt: Date): string;

// ranking/score.ts
export interface ScoringInputs {
  ageInHours: number;
  hasSummary: boolean;
  sourcePriority: number;  // lower is better, typically 1–5
  contentAvailability: "title_only" | "excerpt" | "partial_text" | "full_text";
}
export function calculateImportanceScore(inputs: ScoringInputs): number;  // float [0.0, 1.0]
```

### 20.12 Component Props Interfaces (key ones)

```ts
// Button.tsx
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

// Badge.tsx
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean;
  dotColorClass?: string;
}

// Header.tsx
export interface HeaderProps { activeCategory?: string; className?: string; }
export const CATEGORIES: Array<{ slug: string; name: string; colourClass: string; activeBorder: string; }>;

// Footer.tsx
export interface FooterProps { className?: string; }

// NewsTicker.tsx
export interface TickerItem { label: string; text: string; labelColor: string; }
export const tickerItems: TickerItem[];

// AdminGuard.tsx
export interface AdminGuardProps { children: React.ReactNode; }

// FeedContainer.tsx
interface FeedContainerProps {
  initialArticles: ArticleWithSource[];
  initialNextCursor: string | null;
  initialHasMore: boolean;
}

// FeedData.tsx
interface FeedDataProps {
  category?: string;
  cursor?: Date;
  limit?: number;
  params?: Promise<{ category: string }>;
  searchParams?: Promise<{ cursor?: string }>;
}

// ArticleCard.tsx
interface ArticleCardProps { article: ArticleWithSource; }

// LoadMoreButton.tsx
interface LoadMoreButtonProps {
  hasMore: boolean;
  isLoading: boolean;
  onClick: () => void;
}

// SummaryPanel.tsx
interface SummaryPanelProps {
  articleId: string;
  initialStatus: SummaryStatus;
  summary?: SummarisationOutput | null;
  onRequestSummary?: () => void;
}

// NutritionLabel.tsx
interface NutritionLabelProps { summary: SummarisationOutput; }

// DisclosureBadge.tsx
interface DisclosureBadgeProps { status: SummaryStatus; onClick?: () => void; }

// SearchBar.tsx
interface SearchBarProps {
  defaultValue?: string;
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

// SignInClient.tsx
interface SignInClientProps { showGoogle: boolean; showGithub: boolean; }

// ArticleData.tsx
interface ArticleDataProps { params: Promise<{ id: string }>; }
```

### 20.13 API Response Shapes

```ts
// GET /api/articles
{
  articles: ArticleWithSource[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

// GET /api/categories
{ categories: Array<{ id: string; slug: string; name: string; }>; }

// GET /api/health
{
  status: "ok" | "degraded";
  deps: { db: "connected" | "error"; redis: "connected" | "error"; };
  timestamp: string;  // ISO
}

// POST /api/summarize/[id] (success)
{ jobId: string; }

// POST /api/push/subscribe (success)
{ success: true; }

// Server Action: requestSummary
export interface SummariseResponse {
  success: boolean;
  jobId: string | null;
  error: string | null;
}
```

### 20.14 Env Schema Type (from `src/lib/env/index.ts`)

```ts
export const envSchema = z.object({
  DATABASE_URL: z.string().min(1).refine(/* starts postgres:// or postgresql:// */),
  REDIS_URL: z.string().min(1).refine(/* starts redis:// */),
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1).refine(/* starts sk-ant- */),
  OPENAI_API_KEY: z.string().min(1).refine(/* starts sk- */),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(1),
  VAPID_PRIVATE_KEY: z.string().min(1),
  VAPID_SUBJECT: z.string().min(1),
  PUSH_KEY_ENCRYPTION_KEY: z.string().length(64).refine(/* /^[0-9a-fA-F]{64}$/ */),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  TRUSTED_PROXY: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = validateEnv();  // validated at module load
```

---

## 21. The Meticulous Approach (Mandatory 6-Phase Workflow)

> **Every task MUST follow this workflow. No exceptions.**

### Phase 1: ANALYZE — Deep Requirement Mining

- Identify **explicit, implicit, and edge-case** needs
- Conduct thorough research into existing code, documentation, relevant resources
- Explore multiple solution approaches, evaluating each against:
  - Technical feasibility
  - Alignment with project goals
  - Long-term implications
- Perform risk assessment: identify risks, dependencies, challenges with mitigation strategies
- **Never make surface-level assumptions**

### Phase 2: PLAN — Structured Execution Roadmap

- Create a detailed plan with:
  - Sequential phases with clear objectives
  - Integrated checklist for each phase
  - Success criteria and validation checkpoints
  - Estimated effort and timeline
- **Present the plan for explicit user confirmation before writing any code**
- Never proceed to implementation without validation

### Phase 3: VALIDATE — Explicit Confirmation Checkpoint

- Obtain explicit user approval of the plan
- Address any concerns or requested modifications
- Ensure alignment on all aspects of the proposed solution
- **Never proceed without alignment**

### Phase 4: IMPLEMENT — Modular, Tested, Documented Builds

- Set up proper environment: ensure dependencies, configurations, prerequisites
- Implement solutions in logical, testable components
- Practice **TDD**: Red → Green → Refactor → Commit. One cycle per commit.
- For bugs: write failing regression test first, then fix
- Exception: pure CSS/layout/infra changes (use CI gate instead)
- Create clear, comprehensive documentation alongside code
- Provide regular progress tracking against the plan
- Follow **library-first approach**: use existing UI/component libraries when available
- Apply bespoke styling only when necessary to achieve the vision

### Phase 5: VERIFY — Rigorous QA Against Success Criteria

- Execute comprehensive testing: address any failures in test suites
- Review code for adherence to best practices, security, and performance standards
- Ensure documentation is accurate, complete, and accessible
- Confirm solution meets all requirements and success criteria
- Consider edge cases, accessibility (WCAG AAA), and performance

### Phase 6: DELIVER — Complete Handoff with Knowledge Transfer

- Provide the complete solution with clear usage instructions
- Create comprehensive guides, runbooks, and troubleshooting resources
- Document challenges encountered and solutions implemented
- Suggest potential improvements, next steps, and maintenance considerations
- Ensure nothing is left ambiguous in the handoff

### TDD Discipline (Phase 4 detail)

- **Red:** Write a failing test that captures the desired behavior
- **Green:** Write the minimum code to make the test pass
- **Refactor:** Improve the code without changing behavior
- **Commit:** One TDD cycle per commit
- For bugs: write a failing regression test FIRST, then fix
- Use factory pattern for test data: `getMockX(overrides)`
- Run tests before considering work complete

### Pre-Commit Gate

```bash
pnpm check          # tsc --noEmit && pnpm lint --max-warnings 0
pnpm test           # vitest run (292 tests / 52 suites expected)
```
Both must pass before any PR merges. **No exceptions.**

---

## Appendix A: File Structure (Complete)

```
onestopnews/
├── proxy.ts                              # Layer 0 — cookie check + redirect only
├── next.config.ts                        # cacheComponents, cacheLife, turbopack, output:standalone
├── tsconfig.json                         # strict + noUncheckedIndexedAccess + verbatimModuleSyntax + erasableSyntaxOnly
├── postcss.config.mjs                    # @tailwindcss/postcss plugin (MANDATORY)
├── vitest.config.ts                      # excludes e2e/, @/ alias → src/
├── eslint.config.mjs                     # flat config, excludes e2e/, --max-warnings 0
├── playwright.config.ts                  # Chromium/Firefox/WebKit, auto-start dev server
├── lighthouserc.js                       # Perf ≥90, A11y ≥95
├── drizzle.config.ts                     # schema: ./src/lib/db/schema.ts
├── package.json                          # pnpm@9.15.0, node >=24.0.0
├── pnpm-lock.yaml                        # frozen
├── .env.example                          # all env vars with comments
├── .dockerignore
├── .gitignore
│
├── src/
│   ├── app/                              # Layer 1 — App Router
│   │   ├── layout.tsx                    # Root: Newsreader + Instrument Sans + Commit Mono, RevealProvider
│   │   ├── globals.css                   # @theme block, .font-editorial, .cat-label, .btn-ember, .reveal
│   │   ├── (public)/
│   │   │   ├── page.tsx                  # Landing page (10 sections)
│   │   │   └── search/                   # /search
│   │   ├── topics/[category]/page.tsx    # /topics/:category
│   │   ├── article/[id]/page.tsx         # /article/:id — generateMetadata emits 3-layer provenance
│   │   ├── sign-in/                      # /sign-in (page.tsx + SignInClient.tsx)
│   │   ├── auth-error/page.tsx           # /auth-error
│   │   ├── (admin)/                      # Protected admin
│   │   │   ├── layout.tsx                # AdminGuard + Suspense
│   │   │   ├── sources/                  # /admin/sources
│   │   │   └── summaries/                # /admin/summaries
│   │   └── api/
│   │       ├── articles/route.ts         # GET /api/articles (feed + search, rate limited)
│   │       ├── categories/route.ts       # GET /api/categories
│   │       ├── health/route.ts           # GET /api/health
│   │       ├── push/subscribe/route.ts   # POST /api/push/subscribe
│   │       ├── summarize/[id]/route.ts   # POST /api/summarize/:id
│   │       ├── admin/route.ts            # GET /api/admin (stub)
│   │       └── auth/[[...nextauth]]/route.ts
│   │
│   ├── features/                         # Layer 2 — Feature Modules
│   │   ├── feed/
│   │   │   ├── queries.ts                # getFeedArticles (cursor pagination, "use cache" + cacheLife("feed"))
│   │   │   └── components/               # FeedContainer, FeedData, FeedGrid, FeedSkeleton, ArticleCard, LoadMoreButton, LeadStory
│   │   ├── articles/
│   │   │   ├── queries.ts                # getArticleWithSummary (4-way JOIN)
│   │   │   └── components/               # ArticleData, ArticleSkeleton
│   │   ├── summaries/
│   │   │   ├── lib/summariseSchema.ts    # Zod schema for AI output
│   │   │   ├── actions.ts                # requestSummary, flagSummary, disableSummary
│   │   │   ├── queries.ts                # getFlaggedSummaries
│   │   │   └── components/               # NutritionLabel, SummaryPanel, DisclosureBadge, NutritionLabelDemo
│   │   ├── search/
│   │   │   ├── queries.ts                # searchArticles (BM25), getSearchSuggestions (pg_trgm)
│   │   │   ├── types.ts                  # SearchParams, SearchResult, SearchPage
│   │   │   └── components/               # SearchBar, SearchResults, SearchData, SearchSkeleton
│   │   └── sources/
│   │       └── components/               # SourcesData, SourcesSkeleton
│   │
│   ├── domain/                           # Layer 3 — Pure Business Logic
│   │   ├── articles/
│   │   │   ├── normalize.ts              # normalizeCanonicalUrl, hashContent (SHA-256)
│   │   │   └── types.ts                  # Article, Source, Category, Summary, ArticleWithSource, ArticleWithSummary, FeedPage
│   │   └── ranking/score.ts              # calculateImportanceScore (float 0.0-1.0)
│   │
│   ├── lib/                              # Layer 4 — Infrastructure
│   │   ├── db/
│   │   │   ├── schema.ts                 # 11 tables, 4 enums, single source of truth
│   │   │   ├── index.ts                  # Lazy Proxy DB client
│   │   │   ├── auth.ts                   # Eager Drizzle for Auth.js adapter
│   │   │   └── seed.ts                   # Idempotent seed (7 cat, 7 src, 30 art, 15 sum)
│   │   ├── auth/
│   │   │   ├── index.ts                  # NextAuth config (JWT, DrizzleAdapter, callbacks)
│   │   │   ├── dal.ts                    # verifySession, verifyAdminSession (cache + redirect)
│   │   │   └── providers.ts              # buildProviders (conditional OAuth)
│   │   ├── env/index.ts                  # Zod env schema (validated at module load)
│   │   ├── security/encrypt.ts           # AES-256-GCM (module-load validation)
│   │   ├── rateLimit.ts                  # Redis fixed-window counter (TRUSTED_PROXY)
│   │   ├── queue/
│   │   │   ├── index.ts                  # 4 BullMQ queues, split Redis connections
│   │   │   └── flows.ts                  # FlowProducer atomic DAG
│   │   └── ai/
│   │       ├── prompts.ts                # buildSummarisationMessages
│   │       └── provenance.ts             # 3-layer disclosure generator
│   │
│   ├── shared/
│   │   ├── components/
│   │   │   ├── ui/                       # Button, Badge, Skeleton, Accordion, NewsletterCTA, StatsSection
│   │   │   ├── layout/                   # Header, Footer, Masthead, NewsTicker
│   │   │   ├── providers/RevealProvider.tsx
│   │   │   └── auth/                     # AdminGuard, AdminGuardSkeleton
│   │   ├── hooks/                        # useDebounce, useReducedMotion
│   │   └── lib/utils.ts                  # cn, formatTimeAgo, formatDate, truncate
│   │
│   ├── components/primitives/PageTransition.tsx
│   ├── workers/                          # Worker service (separate process)
│   │   ├── index.ts                      # 4 BullMQ workers + graceful shutdown
│   │   ├── jobs/                         # parseFeed, summarize, summarizeFailure, determineContentAvailability, scheduler
│   │   ├── lib/cacheInvalidation.ts      # Singleton Redis publisher
│   │   └── push/isWithinQuietHours.ts    # DST-safe (luxon)
│   └── test/setup.ts                     # Global Vitest setup (direct = env vars)
│
├── drizzle/                              # Migrations (additive only)
│   ├── 0000_purple_blue_marvel.sql       # Initial schema
│   ├── 0001_panoramic_makkari.sql
│   ├── 0002_flippant_screwball.sql
│   ├── 0003_strong_mac_gargan.sql        # articles.body + users.email_verified + users.image
│   ├── 0004_smiling_newton_destine.sql   # push_subscriptions.encrypted_keys
│   ├── 0005_neat_wolverine.sql           # DROP COLUMN keys
│   ├── custom-indexes.sql                # GIN FTS + pg_trgm + performance indexes
│   └── meta/                             # Migration journal + snapshots
│
├── e2e/smoke.spec.ts                     # 10 E2E smoke tests
├── public/fonts/commit-mono-400.woff2    # Self-hosted Commit Mono
├── scripts/
│   ├── init-extensions.sql               # CREATE EXTENSION uuid-ossp, pg_trgm
│   ├── migrate.ts
│   ├── dev-setup.sh
│   ├── deploy.sh                         # Tagged release deployment (Phase 16: fixed shebang + var interpolation)
│   └── validate-compose.py               # YAML validator (Phase 16 CI gate)
│
├── .github/workflows/
│   ├── ci.yml                            # Validate Shell+YAML → lint → test → check → build
│   └── e2e.yml                           # Playwright Chromium/Firefox/WebKit
│
├── Dockerfile.web                        # node:24-alpine, output:standalone
├── Dockerfile.worker                     # node:24-alpine, tsx src/workers/index.ts
├── Dockerfile.dev                        # node:24-alpine, pnpm dev --turbo
├── Dockerfile.worker.dev                 # node:24-alpine, tsx watch
├── docker-compose.prod.yml               # web + worker + PG17 + Redis7 (hardened: noeviction + AOF)
├── docker-compose-dev.yml                # dev compose
├── docker-compose-nginx.yml              # optional HTTPS proxy
├── docker-compose-sample.yml             # stale sample (to be deleted in Batch 5)
│
├── README.md                             # User-facing documentation
├── CLAUDE.md                             # Institutional knowledge for Claude
├── AGENTS.md                             # Institutional knowledge for all agents
├── GEMINI.md                             # Master instruction context
├── MASTER_EXECUTION_PLAN.md              # Definitive engineering blueprint (v5.1)
├── Project_Architecture_Document_v4.5.md # PAD — authoritative architecture source
├── Project_Requirements_Document_v4.3.md # PRD — authoritative requirements source
├── onestopnews_SKILL.md                  # THIS FILE
└── [phase docs, reports, etc.]
```

---

## Appendix B: Phase Status (all 16 phases COMPLETE)

| Phase | Status | Summary |
|---|---|---|
| 1 — Foundation & Configuration | ✅ | next.config.ts, proxy.ts, tsconfig.json, docker-compose |
| 2 — Database Schema & Infrastructure | ✅ | Drizzle schema (11 tables), lazy DB client, Auth.js v5, BullMQ queues |
| 3 — Design System & Shared Components | ✅ | Button, Badge, Skeleton, Header, Footer, useDebounce, useReducedMotion |
| 4 — Core Feed Feature | ✅ | Domain layer, feed queries, FeedGrid, ArticleCard, home/topic/article routes |
| 5 — AI Summarisation Pipeline | ✅ | Zod schema, prompts, 3-layer provenance, NutritionLabel, SummaryPanel |
| 6 — Search, Admin & Public API | ✅ | FTS with BM25, admin routes, public REST API |
| 7 — Worker Service, Push & Observability | ✅ | 4 BullMQ workers, scheduler, content guard, AES-256-GCM push, quiet hours |
| 8 — Testing, CI/CD & Deployment | ✅ | GitHub Actions CI/E2E, Dockerfiles, Lighthouse CI, deploy script |
| 9 — Blocking Route Fix & Suspense | ✅ | FeedData/FeedSkeleton Server Components, key-ed Suspense |
| 10 — Landing Page & Design System | ✅ | 10-section landing page, design tokens, db:seed |
| 11 — Landing Page Bug Fixes & SSR Remediation | ✅ | CSS merge artifact, .reveal animations, next-prerender-current-time fix |
| 12 — Tailwind v4 PostCSS & Commit Mono Font Fix | ✅ | @tailwindcss/postcss, Commit Mono via next/font/local |
| 13 — Critical Gaps Remediation | ✅ | Real rss-parser, real AI, FlowProducer DAG, rate limiting, SHA-256 |
| 14 — Validated Gaps Closure | ✅ | hashContent body, TRUSTED_PROXY, encryptedKeys, article detail page, Playwright |
| 15 — Production Readiness | ✅ | Dockerfiles node:24, Load More, Drop keys, OAuth, /sign-in + /auth-error |
| **16 — Remediation Batches 1-4** | ✅ | AdminGuard, TRUSTED_PROXY in Zod, PUSH_KEY module-load, prod Redis, deploy.sh, CI gate |

**Current test count:** 292 tests / 52 suites + 10 Playwright E2E tests
**Quality gate:** `pnpm check` (0 TS errors, 0 lint warnings) + `pnpm test` (292/292 pass) — all green

---

*This skill file is the definitive reference for reproducing the OneStopNews codebase. When in doubt, read the actual source code — it is the source of truth. Last updated: June 20, 2026 (Phase 16 complete, commit `ea96e76`).*
