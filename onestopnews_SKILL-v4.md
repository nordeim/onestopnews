# OneStopNews — Complete Skill Reference

> **Classification:** Definitive Engineering Knowledge Base
> **Phase:** 17 (Comprehensive Remediation Complete)
> **Last Updated:** June 20, 2026
> **Test Status:** 302 tests across 53 suites + 10 Playwright E2E — all green
> **Quality Gate:** `pnpm check` (tsc --noEmit + ESLint --max-warnings 0) + `pnpm test` (vitest run)

This document is the complete, code-first reference for the OneStopNews codebase. Every section is grounded in the actual source code at HEAD. Any coding agent (or senior engineer) who reads this file top-to-bottom will have the institutional knowledge required to extend, debug, or replicate this project.

---

## The Meticulous Approach (Mandatory SOP)

Every task — no matter how small — must follow this six-phase workflow:

1. **ANALYZE** — Deep requirement mining. Identify explicit, implicit, and edge-case needs. Read the actual source files (never assume). Explore multiple approaches. Assess risks.
2. **PLAN** — Structured execution roadmap. Present for explicit user confirmation before writing code.
3. **VALIDATE** — Obtain user approval. Address concerns. Never proceed without alignment.
4. **IMPLEMENT** — Modular, tested, documented builds. Use library components before custom ones. TDD: RED → GREEN → REFACTOR → COMMIT.
5. **VERIFY** — Rigorous QA against success criteria. Test edge cases, accessibility (WCAG AAA), and performance (Core Web Vitals).
6. **DELIVER** — Complete handoff with instructions, documentation, and next steps.

**Non-negotiable:** Never write code without first completing ANALYZE and PLAN. Never skip the VALIDATE checkpoint.

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

### What Is OneStopNews?

OneStopNews is a **topic-first news aggregation platform** with source-cited AI summaries. Rather than organizing news by publisher, it organizes stories by **subject** across 50–200+ RSS/Atom/JSON feeds, normalizes/dedupes them, scores importance, optionally AI-summarizes them with strict provenance, and exposes them via topic-categorized feed, full-text search, public REST API, and admin tools.

### The "Editorial Dispatch" Design System

The visual identity is **architectural, not cosmetic.** Every element carries the weight of something worth reading. This is a high-end editorial aesthetic — think *The Economist* meets *Bloomberg Terminal* — not "AI slop."

**Design Thesis:** "High-End Editorial" — calm, authoritative, typography-driven, with deliberate use of whitespace as a structural element. The interface should feel like a well-edited newspaper, not a social media feed.

**Explicit Rejections:**
- Inter, Roboto, Space Grotesk — never use them
- Purple gradients on white — cliché AI aesthetic
- Predictable card grids with rounded corners — too generic
- Bootstrap-style 12-column grids — too predictable

### The 4 Defining Differentiators

1. **3-layer machine-readable AI provenance** — JSON-LD `<script>` + `X-AI-Provenance` HTTP header + `<meta name="ai-provenance">` — EU AI Act Article 50 compliant. C2PA explicitly rejected (no text standard exists).
2. **Editorial Dispatch design system** — Newsreader (headlines, 800 weight) + Instrument Sans (UI/body) + Commit Mono (metadata, self-hosted via `next/font/local`). CSS Subgrid for feed alignment. `--dispatch-ember #c7513f` accent.
3. **Content Availability Guard** — 4-tier enum (`title_only` / `excerpt` / `partial_text` / `full_text`); only `partial_text`/`full_text` eligible for AI summarization. Double-enforced at Server Action AND API Route layers. Prevents AI hallucination.
4. **Modular monolith (Next.js 16 web) + standalone Node.js 24 worker service**, connected via BullMQ v5 on Redis 7+ and shared PostgreSQL 17.

### The 5-Layer Request Model (Golden Rule)

Every request passes through exactly these layers. Deviating from this order creates security and consistency bugs.

```
Layer 0: proxy.ts           — Cookie check, redirect. NO DB. NO logic.
Layer 1: App Router           — Route structure, metadata, PPR, Suspense.
Layer 2: Feature Modules     — UI composition, data binding, mutations.
Layer 3: Domain Services      — Pure business logic. No Next.js or DB imports.
Layer 4: Infrastructure       — Drizzle, Auth.js, BullMQ, AI SDK. Side effects only.
```

### The Meticulous Approach Principles

| Principle | Rationale |
| :--- | :--- |
| **Library Discipline** | If Shadcn UI / Radix provides the primitive, use it. Wrap for bespoke styling. Never rebuild from scratch. |
| **Single Source of Truth** | The Drizzle schema is the only source of DB types. Types derive from schema via `(typeof enum.enumValues)[number]` and `$inferSelect`. |
| **Opt-In Caching** | Next.js 16 makes caching opt-in via `"use cache"`. Everything is dynamic by default. Don't cache without explicit intent. |
| **Progressive Enhancement** | View Transitions are progressive. They silently degrade on Firefox / reduced-motion. Never rely on them for core functionality. |
| **Zero `any`** | TypeScript strict mode, always. Prefer `unknown` over `any`. Use type inference; explicit types on public APIs only. |
| **Auth at the DAL** | `proxy.ts` is UX-only (optimistic redirect). Real authorization lives in `verifySession()` / `verifyAdminSession()`. |
| **Content Guard** | Never enqueue summarisation for `title_only` or `excerpt` articles. This prevents AI hallucination. |
| **Fail Fast at Boot** | Security-critical env vars must be validated at module load, not lazily on first use. |

---

## 2. Tech Stack & Environment

### Exact Versions (verified live from `package.json` + `pnpm-lock.yaml`)

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Web Framework** | Next.js | `^16.2.9` | App Router, PPR, Cache Components, `proxy.ts`. ≥16.0.7 mitigates CVE-2025-55182. |
| **UI Runtime** | React | `^19.2.7` | View Transitions, `useActionState`, `useOptimistic`, Server Components |
| **Language** | TypeScript | `^5.7.0` (installed 5.9.3) | Strict mode, `noUncheckedIndexedAccess`, `erasableSyntaxOnly`, `verbatimModuleSyntax` |
| **Styling** | Tailwind CSS | `^4.3.1` | Utility-first with `@theme` tokens. CSS Subgrid for feed alignment. |
| **PostCSS** | `@tailwindcss/postcss` | `^4.3.1` | **Mandatory** PostCSS plugin for Tailwind v4 utility class generation |
| **Components** | Shadcn UI + Radix | latest | Accessible primitives (Accordion, Dialog, Slot), wrapped for bespoke aesthetic |
| **ORM** | Drizzle ORM | `^0.45.2` | TypeScript-native, SQL-fluent, lazy proxy connection pattern |
| **Validation** | Zod | `^4.4.3` | Schema-first, composable. Enforces AI output constraints + env validation |
| **Auth** | Auth.js (next-auth) | `5.0.0-beta.31` | HttpOnly session cookies, Drizzle adapter, JWT strategy (30-day) |
| **Database** | PostgreSQL | 17 | Primary datastore. GIN FTS + `ts_rank_cd` BM25. `pg_trgm` for autocomplete. |
| **Search** | `tsvector` + `ts_rank_cd` | Built-in | BM25 relevance ranking natively in Postgres. `websearch_to_tsquery` for user input. |
| **Job Queue** | BullMQ | `^5.78.0` | Job graphs (Flows via `FlowProducer`), priorities, built-in monitoring |
| **Queue Backend** | Redis (ioredis) | `^5.11.1` | AOF persistence, `noeviction` policy, `maxRetriesPerRequest: null` |
| **Worker Runtime** | Node.js | `>=24.0.0` (LTS "Krypton") | BullMQ-native. LTS through April 2028. |
| **AI SDK** | Vercel AI SDK | `ai@^6.0.201` + `@ai-sdk/anthropic@^3` + `@ai-sdk/openai@^3` | `generateObject()` with Zod schema validation |
| **AI (Primary)** | Claude 4.5 Haiku | `claude-haiku-4-5` | $1/$5 per M tokens. Best cost/quality for news summarisation. |
| **AI (Fallback)** | GPT-5 Mini | `gpt-5-mini` | Validated cost/quality fallback model |
| **RSS Parsing** | `rss-parser` | `^3.13.0` | RSS 2.0 + Atom 1.0 parsing. JSON Feed parsed natively. |
| **Rate Limiting** | `ioredis` (fixed-window) | `^5.11.1` | Redis `INCR` + `EXPIRE` pattern. 20 req/s per IP on `/api/articles`. |
| **Push Encryption** | `node:crypto` | built-in | AES-256-GCM for VAPID key encryption at rest |
| **Date/Time** | Luxon | `^3.7.2` | DST-safe quiet hours calculation |
| **Package Manager** | pnpm | `9.15.0` (via `packageManager` field) | Required (not npm/yarn) |
| **Test Runner** | Vitest | `^4.1.8` | Unit + integration tests. jsdom environment. v8 coverage. |
| **E2E** | Playwright | `^1.61.0` | 3 browser projects (Chromium, Firefox, WebKit). Auto-starts dev server. |

### Critical TypeScript Flags (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "incremental": true,
    "paths": { "@/*": ["./src/*"] }
  },
  "exclude": ["node_modules", ".next", "drizzle", "e2e", "playwright.config.ts"]
}
```

**Why these flags matter:**
- `noUncheckedIndexedAccess`: `arr[i]` returns `T | undefined` — catches runtime errors at compile time. Single highest-value strictness improvement.
- `erasableSyntaxOnly`: Forbids `enum` and `namespace` (they compile to runtime IIFEs). Forces string unions + ES modules.
- `verbatimModuleSyntax`: Requires `import type` for type-only imports. Enforces clean module boundaries.
- `strict`: Enables `strictNullChecks`, `noImplicitAny`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noImplicitOverride` all at once.

### Key Commands

| Command | Purpose |
| :--- | :--- |
| `pnpm dev` | Next.js dev server with Turbopack |
| `pnpm worker` | Worker service (BullMQ consumers + RSS + AI) |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint (`--max-warnings 0`) |
| `pnpm check` | `tsc --noEmit && pnpm lint` (combined gate) |
| `pnpm test` | Run all test suites (`vitest run`) |
| `pnpm test:e2e` | Playwright E2E tests |
| `pnpm drizzle-kit generate` | Generate migration SQL from schema |
| `pnpm drizzle-kit migrate` | Apply pending migrations |
| `pnpm db:seed` | Seed sample articles/categories/sources |
| `pnpm format` | Prettier write |

---

## 3. Bootstrapping & Configuration

### From-Scratch Setup

```bash
# 1. Clone + install
git clone https://github.com/nordeim/onestopnews.git
cd onestopnews
pnpm install --frozen-lockfile

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local — set all required vars (see §Environment Variables below)

# 3. Database setup
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
pnpm db:seed

# 4. Enable PostgreSQL extensions
psql -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"

# 5. Start dev servers (2 terminals)
pnpm dev      # Terminal 1: Next.js on :3000
pnpm worker   # Terminal 2: BullMQ workers
```

### Environment Variables (Zod-Validated at Module Load)

All variables are validated by Zod at module load time (`src/lib/env/index.ts`). The app fails fast with a descriptive error if any required variable is missing or invalid.

| Variable | Required? | Validation | Purpose |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | ✅ | `postgres://` or `postgresql://` prefix | PostgreSQL connection string |
| `REDIS_URL` | ✅ | `redis://` prefix | Redis connection for BullMQ + rate limiting |
| `AUTH_SECRET` | ✅ | min 32 chars | Auth.js session secret (`openssl rand -base64 33`) |
| `AUTH_URL` | ✅ | non-empty | Canonical URL (`http://localhost:3000` for dev) |
| `ANTHROPIC_API_KEY` | ✅ | `sk-ant-` prefix | Claude 4.5 Haiku (primary AI) |
| `OPENAI_API_KEY` | ✅ | `sk-` prefix | GPT-5 Mini (fallback AI) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ✅ | non-empty | Web Push VAPID public key |
| `VAPID_PRIVATE_KEY` | ✅ | non-empty | Web Push VAPID private key |
| `VAPID_SUBJECT` | ✅ | non-empty | `mailto:admin@onestopnews.com` |
| `PUSH_KEY_ENCRYPTION_KEY` | ✅ | exactly 64 hex chars | AES-256-GCM key (`openssl rand -hex 32`) |
| `GOOGLE_CLIENT_ID` | optional | string | Google OAuth (conditional provider) |
| `GOOGLE_CLIENT_SECRET` | optional | string | Google OAuth |
| `GITHUB_CLIENT_ID` | optional | string | GitHub OAuth (conditional provider) |
| `GITHUB_CLIENT_SECRET` | optional | string | GitHub OAuth |
| `TRUSTED_PROXY` | optional | string | `"true"` = use rightmost IP (CDN-safe) |
| `NODE_ENV` | optional | enum: `development`/`production`/`test` | Defaults to `development` |

**Critical:** `src/lib/env/index.ts` validates at module load. Even `pnpm lint` imports modules that import `@/lib/env`, so missing env vars break ALL CI steps. The CI workflow sets all vars with dummy values.

### `next.config.ts` — Critical Configuration Invariants

```typescript
const nextConfig: NextConfig = {
  output: "standalone",           // TOP-LEVEL — required for Dockerfile.web
  cacheComponents: true,          // TOP-LEVEL — enables "use cache" + PPR
  cacheLife: {                    // TOP-LEVEL — named profiles (stale/revalidate/expire)
    feed:       { stale: 30,    revalidate: 120,  expire: 600 },
    topicShell: { stale: 300,   revalidate: 900,  expire: 86400 },
    reference:  { stale: 3600,  revalidate: 86400, expire: 604800 },
  },
  turbopack: {},                  // TOP-LEVEL — graduated from experimental in Next 16
  experimental: {
    viewTransition: true,         // INSIDE experimental — View Transitions API
    // DO NOT include: ppr, dynamicIO (removed in Next 16)
    // DO NOT include: clientSegmentCache (not in ExperimentalConfig type yet)
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "picsum.photos" }],
  },
  // Security headers: X-Content-Type-Options, X-Frame-Options: DENY,
  // Referrer-Policy, Permissions-Policy
};
```

| Flag | Placement | What Breaks if Wrong |
| :--- | :--- | :--- |
| `cacheComponents: true` | **Top-level** | Every `"use cache"` silently ignored. Zero caching. |
| `cacheLife` profiles | **Top-level** | `cacheLife('feed')` throws runtime — profile missing. |
| `turbopack: {}` | **Top-level** | Ignored or config warning. |
| `experimental.viewTransition` | **Inside `experimental: {}`** | Transitions silently disabled. |
| `experimental.ppr` | **DO NOT INCLUDE** | Build error in Next.js 16 — removed; `cacheComponents` implements PPR. |
| `experimental.dynamicIO` | **DO NOT INCLUDE** | Deprecated — replaced by `cacheComponents`. |

### `postcss.config.mjs` — Mandatory for Tailwind v4

```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

**Without this file, Tailwind v4 generates ZERO utility classes.** The `@theme` block renders as custom properties but no class selectors are generated from template class usage. Compiled CSS is ~16KB instead of hundreds of KB. **No build error is thrown** — it silently kills all utility class generation.

### `proxy.ts` — Layer 0 Network Boundary (replaces `middleware.ts`)

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./src/lib/auth";

export default async function proxy(request: NextRequest) {
  const session = await auth();
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  if (isAdminRoute && !session) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

**CRITICAL:** Zero DB calls. Zero business logic. Optimistic redirects only. Real authorization lives in `verifySession()` at the DAL layer. Runs on Node.js runtime (not Edge).

---

## 4. The Design System (Code-First)

### Typography Hierarchy

| Role | Typeface | Weight | CSS Variable | Tailwind Class | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Headlines | Newsreader (variable) | 800 | `--font-editorial` | `font-editorial` | Page titles, article headlines, masthead wordmark |
| UI / Body | Instrument Sans (variable) | 400–600 | `--font-ui` | `font-ui` | Body text, buttons, form labels, navigation |
| Metadata | Commit Mono | 400 | `--font-mono` | `font-mono` | Timestamps, category labels, technical metadata |

**Font Loading** (`src/app/layout.tsx`):

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

// Commit Mono is NOT on Google Fonts — must use next/font/local with woff2
const commitMono = localFont({
  src: "../../public/fonts/commit-mono-400.woff2",
  variable: "--font-mono",
  weight: "400",
  style: "normal",
  display: "swap",
});
```

**`.font-editorial` Enhancement Block** (in `globals.css`):

```css
.font-editorial {
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
  text-rendering: optimizeLegibility;
  font-feature-settings: "ss01", "ss02";
}
```

**Redundancy Rule:** Since `.font-editorial` bakes in weight 800, leading 1.1, and tracking -0.02em, do NOT add `font-[800]`, `leading-tight`, or `tracking-[-0.02em]` alongside `font-editorial`. Only add overrides for different values (e.g., `tracking-[-0.03em]` for the Masthead wordmark, `font-[700]` for accordion questions, `leading-[1.05]` for section heads).

### Complete `@theme` Token Block (`src/app/globals.css`)

```css
@import "tailwindcss";

@theme {
  /* ── Ink Scale (dark text colors) ────────────────────────── */
  --color-ink-900: #1a1a18;
  --color-ink-700: #2a2a27;
  --color-ink-600: #3d3d3a;
  --color-ink-500: #525250;
  --color-ink-400: #6b6b68;
  --color-ink-300: #8a8a83;
  --color-ink-100: #e8e8e4;

  /* ── Paper Scale (light background colors) ───────────────── */
  --color-paper-50:  #fafaf8;
  --color-paper-100: #f2f2ee;
  --color-paper-200: #e6e4de;
  --color-paper-300: #d8d4cc;

  /* ── Dispatch Brand Accents (category colors) ────────────── */
  --color-dispatch-ember:        #c7513f;  /* Breaking news, AI badge, primary CTA */
  --color-dispatch-ember-light:  #fde8e4;
  --color-dispatch-sage:         #6b8f71;  /* Finance, positive */
  --color-dispatch-sage-light:   #e4ede5;
  --color-dispatch-slate:        #5a6b7a;  /* Tech, neutral */
  --color-dispatch-slate-light:  #e2e7ec;
  --color-dispatch-clay:         #8b6d5a;  /* Local, politics */
  --color-dispatch-clay-light:   #ede5df;
  --color-dispatch-violet:       #7a6b8f;  /* Culture, creative */
  --color-dispatch-violet-light: #e8e4ef;

  /* ── Typography Stack ── */
  --font-editorial: "Newsreader", Georgia, "Times New Roman", serif;
  --font-ui: "Instrument Sans", system-ui, -apple-system, sans-serif;
  --font-mono: "Commit Mono", ui-monospace, "Fira Code", monospace;
}
```

### Custom Utility Classes (`globals.css`)

| Class | Definition | Usage |
| :--- | :--- | :--- |
| `.font-editorial` | `font-weight: 800; line-height: 1.1; letter-spacing: -0.02em; text-rendering: optimizeLegibility; font-feature-settings: "ss01", "ss02";` | Headlines (Newsreader) |
| `.cat-label` | `font-family: var(--font-mono); font-variant: all-small-caps; letter-spacing: 0.12em;` | Category labels, metadata tags |
| `.cat-label-wide` | `font-family: var(--font-mono); font-variant: all-small-caps; letter-spacing: 0.25em;` | Wide category labels with extra tracking |
| `.btn-ember` | `transition: transform 150ms, background-color 150ms, box-shadow 150ms;` + hover/active states | Primary CTA buttons (tactile maximalism) |
| `.pulse-dot` | `animation: pulse-dot 2s ease-in-out infinite;` | Live status indicators |
| `.scroll-progress` | `position: fixed; top: 0; height: 2px; background: dispatch-ember; animation-timeline: scroll();` | Scroll progress bar |
| `.ticker-track` | `animation: ticker-scroll 80s linear infinite;` + `:hover { animation-play-state: paused; }` | NewsTicker marquee |
| `.story-card` | `transition: background-color 200ms, box-shadow 200ms;` + hover state | Article card hover effect |
| `.nutrition-label` | `border-left: 3px solid dispatch-ember; background: linear-gradient(to right, paper-100, paper-50);` | AI Nutrition Label panel |
| `.citation-ref` | `border-bottom: 1px dashed dispatch-violet; cursor: pointer;` + hover | Inline citation references |
| `.link-underline` | `position: relative;` + `::after` pseudo-element with width animation | Animated link underlines |
| `.cta-input` | Dark-background input styling for NewsletterCTA | Newsletter signup input |
| `.outline-hidden` | `outline: 2px solid transparent; outline-offset: 2px;` | Tailwind v4 replacement for `outline-none` (a11y) |
| `.category-nav` | `scrollbar-width: none;` + `::-webkit-scrollbar { display: none; }` | Hidden scrollbar for category nav |
| `.commitment-number` | `font-family: editorial; font-size: 4.5rem; line-height: 1; opacity: 0.08; position: absolute;` | Large faded background numerals in StatsSection |
| `.reveal` | `opacity: 0; transform: translateY(24px); transition: opacity 700ms, transform 700ms;` | Scroll-reveal initial state |
| `.reveal.visible` | `opacity: 1; transform: translateY(0);` | Scroll-reveal visible state |
| `.reveal-delay-1` through `.reveal-delay-4` | `transition-delay: 80ms / 160ms / 240ms / 320ms;` | Staggered scroll-reveal entrance |

### Keyframe Animations

| Animation | Keyframes | Usage |
| :--- | :--- | :--- |
| `scroll-progress` | `scaleX(0) → scaleX(1)` | Scroll progress bar (CSS `animation-timeline: scroll()`) |
| `ticker-scroll` | `translateX(0) → translateX(-50%)` | NewsTicker marquee (80s linear infinite) |
| `pulse-dot` | `opacity: 1 → 0.25 → 1` | Live status indicators (2s ease-in-out) |
| `slideDown` | `height: 0 → var(--radix-accordion-content-height)` | Radix Accordion expand (300ms cubic-bezier) |
| `slideUp` | `height: var(--radix-accordion-content-height) → 0` | Radix Accordion collapse |

### CSS Subgrid Feed Architecture

The feed grid uses `grid-rows-subgrid` to force Headline, Excerpt, and Metadata rows to align across every card in a visual row — no fixed heights, no JavaScript measurement.

```css
/* Parent (FeedGrid): defines columns with gap-x only — NO gap-y */
/* Each ArticleCard: grid grid-rows-subgrid row-span-3 gap-y-3 */
```

```tsx
// FeedGrid.tsx — parent
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8" role="feed">
  {articles.map((article) => (
    <ArticleCard key={article.id} article={article} />
  ))}
</div>

// ArticleCard.tsx — child (spans 3 row tracks)
<article className="group relative grid grid-rows-subgrid row-span-3 gap-y-3 mb-10 last:mb-0">
  <h3>...</h3>  {/* Row 1: Headline */}
  <p>...</p>    {/* Row 2: Excerpt */}
  <div>...</div> {/* Row 3: Metadata */}
</article>
```

### Design Token Discipline

**Never use raw hex colors in Tailwind classes.** All colors must come from the design token system. Raw hex values bypass the theme and break maintainability.

```tsx
// ❌ FORBIDDEN
<div className="bg-[#1a1a2e] text-[#fafaf8]">

// ✅ CORRECT
<div className="bg-ink-900 text-paper-50">
```

---

## 5. Component Architecture & Patterns

### Component Directives Cheat Sheet

| Directive | When to Use | Example |
| :--- | :--- | :--- |
| (none — Server Component) | Default. Data fetching, static content, no interactivity | `FeedData`, `ArticleData`, `AdminGuard` |
| `"use client"` | Interactivity (state, effects, browser APIs, event handlers) | `Header`, `Footer`, `NewsTicker`, `ArticleCard`, `FeedContainer`, `SummaryPanel`, `RevealProvider`, `PageTransition`, `Accordion`, `NewsletterCTA`, `SignInClient` |

### UI Primitives (`src/shared/components/ui/`)

#### Button — cva + Radix Slot Pattern

```tsx
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

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

// Props: extends ButtonHTMLAttributes + VariantProps + { asChild?: boolean; isLoading?: boolean }
// asChild=true uses Radix Slot for polymorphism (e.g., <Button asChild><Link href="/">Home</Link></Button>)
// isLoading=true shows spinner + disables button
```

#### Badge — 7 Variants with Optional Dot

```tsx
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest leading-none",
  {
    variants: {
      variant: {
        ember:  "bg-dispatch-ember/10 text-dispatch-ember border border-dispatch-ember/20 px-2 py-1",
        slate:  "bg-dispatch-slate/10 text-dispatch-slate border border-dispatch-slate/20 px-2 py-1",
        sage:   "bg-dispatch-sage/10 text-dispatch-sage border border-dispatch-sage/20 px-2 py-1",
        clay:   "bg-dispatch-clay/10 text-dispatch-clay border border-dispatch-clay/20 px-2 py-1",
        violet: "bg-dispatch-violet/10 text-dispatch-violet border border-dispatch-violet/20 px-2 py-1",
        muted:  "bg-paper-100 text-ink-300 border border-ink-100 px-2 py-1",
        plain:  "text-ink-300",
      },
    },
    defaultVariants: { variant: "ember" },
  }
);
// Optional `dot` prop shows a coloured dot before the text
```

#### Skeleton — 4 Exported Components

- `SkeletonLine` — single line placeholder (`motion-safe:animate-pulse`, `aria-hidden="true"`)
- `SkeletonLines` — multi-line placeholder (last line is 60% width)
- `ArticleCardSkeleton` — subgrid-shaped card placeholder
- `FeedSkeleton` — multiple card skeletons in a grid (`role="feed"`, `aria-label="Loading news articles"`)

### Layout Components (`src/shared/components/layout/`)

#### Header — Sticky with Category Nav + Mobile Dialog

```tsx
"use client";
// Sticky: className="sticky top-0 z-40 bg-paper-50/95 backdrop-blur-sm border-b border-paper-200"
// Category nav: 7 categories with colour dots (ember, clay, slate, slate, sage, clay, violet)
// Mobile: Radix Dialog with slide-in-from-right animation
// Active category: derived from usePathname() or explicit prop
export const CATEGORIES = [
  { slug: "top-stories", name: "Top Stories", colourClass: "bg-dispatch-ember",  activeBorder: "border-dispatch-ember" },
  { slug: "local",       name: "Local",       colourClass: "bg-dispatch-clay",   activeBorder: "border-dispatch-clay" },
  { slug: "tech",        name: "Tech",        colourClass: "bg-dispatch-slate",  activeBorder: "border-dispatch-slate" },
  { slug: "global",      name: "Global",      colourClass: "bg-dispatch-slate",  activeBorder: "border-dispatch-slate" },
  { slug: "finance",     name: "Finance",     colourClass: "bg-dispatch-sage",   activeBorder: "border-dispatch-sage" },
  { slug: "politics",    name: "Politics",    colourClass: "bg-dispatch-clay",   activeBorder: "border-dispatch-clay" },
  { slug: "culture",     name: "Culture",     colourClass: "bg-dispatch-violet", activeBorder: "border-dispatch-violet" },
];
```

#### Footer — Client Component (uses `new Date()`)

**Why Client Component:** `new Date().getFullYear()` in a Server Component causes `next-prerender-current-time` error in Next.js 16 with `cacheComponents: true`. Must be wrapped in `<Suspense>` by the parent page.

#### Masthead — Edition Bar + Wordmark

```tsx
// Wordmark: font-editorial text-6xl sm:text-7xl lg:text-8xl tracking-[-0.03em]
// Uses inline style: { lineHeight: 0.93, fontVariationSettings: "'opsz' 72" }
// Live badge: <span className="w-1.5 h-1.5 rounded-full bg-dispatch-ember pulse-dot" />
```

#### NewsTicker — Marquee with Duplicate Set

```tsx
"use client";
// Renders tickerItems TWICE for seamless scroll (translateX(-50%))
// Pauses on hover via CSS: .ticker-track:hover { animation-play-state: paused; }
// role="marquee" aria-label="Breaking news ticker"
```

### Feed Components (`src/features/feed/components/`)

#### ArticleCard — CSS Subgrid Child with Stretched Link

```tsx
"use client";
// Subgrid: grid grid-rows-subgrid row-span-3 gap-y-3 mb-10 last:mb-0
// Stretched link: <Link className="after:absolute after:inset-0" />
// The entire card is clickable via the ::after pseudo-element
// AI Brief badge shows when: article.hasSummary && article.summaryStatus === "ok"
```

#### FeedContainer — Client Component with Cursor Pagination

```tsx
"use client";
// 5 useState: articles, nextCursor, hasMore, isLoading, error
// 1 useCallback: loadMore (fetches /api/articles?cursor=...)
// UI states: success (FeedGrid + LoadMoreButton), loading (button disabled), error (retry button)
// Uses vi.stubGlobal("fetch", mockFetch) pattern in tests
```

#### FeedData — Server Component (Suspense-wrapped)

```tsx
// NO "use client" — this is a Server Component
// Fetches initial page via getFeedArticles()
// Passes initialArticles + initialNextCursor + initialHasMore to FeedContainer
// Must be wrapped in <Suspense fallback={<FeedSkeleton />}> by parent page
```

### Summary Components (`src/features/summaries/components/`)

#### SummaryPanel — 5-State State Machine

```tsx
"use client";
// Uses useOptimistic() for instant UI update when requesting summary
// States:
//   "none"         → "Request AI Summary" button
//   "pending"      → "Generating AI summary..." with pulse dot
//   "ok"           → <NutritionLabel summary={summary} />
//   "needs_review" → "Summary under editorial review" notice
//   "disabled"     → null (no UI)
```

#### NutritionLabel — Source-Cited Transparency Panel

```tsx
// <aside aria-label="AI-generated summary transparency label">
// border-l-2 border-dispatch-ember bg-paper-100/50 p-6
// Shows: summaryText, keyPoints (ordered list), sourcesCited (numbered links),
//         coveragePercentage, "Verify with original source" link, aiStatement
```

#### DisclosureBadge — Status Indicator with Accessible Dot

```tsx
"use client";
// States: ok (sage dot, "AI Brief"), pending (ink dot + pulse, "Processing"),
//         needs_review (amber dot, "Under Review"), disabled/none (null)
// Clickable button that scrolls to #ai-summary
```

### Auth Components (`src/shared/components/auth/`)

#### AdminGuard — Async Server Component (Phase 16)

```tsx
// NO "use client" — async Server Component
import { verifyAdminSession } from "@/lib/auth/dal";

export async function AdminGuard({ children }: AdminGuardProps): Promise<React.ReactElement> {
  await verifyAdminSession();  // Redirects internally on failure
  return <>{children}</>;
}

// Used in (admin)/layout.tsx:
// <Suspense fallback={<AdminGuardSkeleton />}>
//   <AdminGuard>{children}</AdminGuard>
// </Suspense>
```

### Sign-In Components (`src/app/sign-in/`)

#### SignInClient — OAuth + Credentials Form

```tsx
"use client";
// Props: { showGoogle: boolean; showGithub: boolean }
// OAuth buttons use <form action="/api/auth/signin/google" method="post"> (progressive enhancement)
// Credentials form posts to /api/auth/callback/credentials
// All inputs have associated <label htmlFor> for a11y
```

### Provider Components (`src/shared/components/providers/`)

#### RevealProvider — IntersectionObserver Scroll Animations

```tsx
"use client";
// useEffect + IntersectionObserver
// threshold: 0.1, rootMargin: "0px 0px -40px 0px"
// Adds .visible class when element enters viewport
// Reduced motion: immediately reveals all .reveal elements
```

### Primitive Components (`src/components/primitives/`)

#### PageTransition — Native View Transitions API

```tsx
"use client";
// Uses document.startViewTransition (NOT React's experimental ViewTransition API)
// Graceful degradation: returns early if !document.startViewTransition
// Reduced motion: returns early if prefers-reduced-motion: reduce
// Intercepts internal link clicks, prevents default, wraps router.push in startViewTransition
```

### Landing Page Composition (`src/app/(public)/page.tsx`)

The 10-section landing page follows this exact order:

```tsx
<div className="min-h-screen bg-paper-50">
  <div className="scroll-progress" aria-hidden="true" />
  <NewsTicker />              {/* 1. Breaking news ticker */}
  <Masthead />                {/* 2. Edition bar, wordmark, live badge */}
  <Suspense fallback={null}>
    <Header activeCategory="top-stories" />  {/* 3. Header + category nav */}
  </Suspense>
  <section>
    <LeadStory />             {/* 4. Hero / 7:5 grid */}
  </section>
  <main id="main-content">    {/* Skip link target */}
    <Suspense fallback={<FeedSkeleton />}>
      <FeedData limit={6} />  {/* 5. Feed (Suspense + Server Component) */}
    </Suspense>
  </main>
  <NutritionLabelDemo />      {/* 6. AI Nutrition Label demo */}
  <StatsSection />            {/* 7. Trust indicators */}
  <FaqAccordion />            {/* 8. FAQ accordion */}
  <NewsletterCTA />           {/* 9. Newsletter signup */}
  <Suspense fallback={null}>
    <Footer />                {/* 10. Footer */}
  </Suspense>
</div>
```

---

## 6. Custom Hooks Deep Dive

### `useDebounce<T>` — Generic Value Debounce

**File:** `src/shared/hooks/useDebounce.ts`

```typescript
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

**Design Decisions:**
- **Generic `<T>`**: Works with any value type (string, number, object, array).
- **Cleanup via `useEffect` return**: `clearTimeout(handler)` prevents stale updates when the component unmounts or the value changes before the delay elapses.
- **Default 300ms**: Suitable for search inputs. Override with the second argument.
- **`"use client"`**: Required — uses `useState` + `useEffect`.

**Usage Pattern (SearchBar):**

```tsx
"use client";
function SearchBar() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      // Fetch search results with debouncedQuery
    }
  }, [debouncedQuery]);

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

### `useReducedMotion` — WCAG AAA Motion Detection

**File:** `src/shared/hooks/useReducedMotion.ts`

```typescript
"use client";
import { useState, useEffect } from "react";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);

    const onChange = (e: MediaQueryListEvent) => {
      setReduced(e.matches);
    };

    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
```

**Design Decisions:**
- **Returns `false` on SSR / first render**: `useState(false)` initial value. This is intentional — the hook can't access `window` during SSR. The `useEffect` corrects the value on mount.
- **Listens for changes**: `addEventListener("change", ...)` updates the state if the user toggles the OS-level reduced-motion preference while the page is open.
- **Cleanup**: `removeEventListener` prevents memory leaks.
- **`"use client"`**: Required — accesses `window.matchMedia`.

**WCAG AAA Rule:** When `prefers-reduced-motion: reduce`, **DISABLE all animations entirely. Do NOT just slow them.** The hook returns `true` so components can conditionally skip animations.

**Usage Pattern:**

```tsx
"use client";
function AnimatedComponent() {
  const reduced = useReducedMotion();
  return <div className={reduced ? "" : "animate-slide-down"} />;
}
```

**Alternative (CSS-only, preferred for global rules):** The `globals.css` file includes a global `@media (prefers-reduced-motion: reduce)` block that disables ALL animations and transitions. Use the hook for component-level conditional logic; use the CSS block for blanket disablement.

---

## 7. Content Management: RSS Ingestion Pipeline

OneStopNews does NOT use `import.meta.glob` (that's a Vite feature). Instead, it uses a **BullMQ worker pipeline** that fetches RSS/Atom/JSON feeds on a schedule, parses them, and ingests articles into PostgreSQL.

### The Ingestion Pipeline (4 Workers)

```
Scheduler (upsertJobScheduler)
    ↓
ingest worker (concurrency: 50)
    ├── parseFeed(feedUrl, feedFormat) → ParsedArticle[]
    ├── determineContentAvailability({title, excerpt, body}) → ContentAvailability
    ├── hashContent(title, body, publishedAt) → SHA-256 hex (64 chars)
    └── UPSERT article (onConflictDoUpdate WHERE content_hash != excluded.content_hash)
        └── IF new/changed → enqueuePostIngestFlow()
    ↓
FlowProducer DAG (atomic):
    ├── Children: score-article jobs (concurrency: 20, one per new article)
    │   └── calculateImportanceScore() → importanceScore [0.0, 1.0]
    └── Parent: refresh-feed-slice (runs ONLY after ALL children complete)
        └── Redis pub/sub → web app calls revalidateTag()
    ↓
summarize worker (concurrency: 5, AI rate-limited)
    ├── Content Guard: only summarize if contentAvailability IN ('partial_text', 'full_text')
    ├── callAISummary() → Vercel AI SDK generateObject() with Zod schema
    │   ├── Primary: Anthropic claude-haiku-4-5
    │   └── Fallback: OpenAI gpt-5-mini
    ├── validateSummarisationOutput() → Zod safeParse
    └── INSERT summary
    ↓ (on failure after 3 retries)
getSummaryFailureState() → summaryStatus: 'needs_review' (visible in admin queue)
```

### RSS Feed Parsing (`src/workers/jobs/parseFeed.ts`)

**Key Gotcha — `rss-parser` Field Conflation:**
`rss-parser` conflates several source fields into its built-in `content` property:
- RSS 2.0: `content` = `<content:encoded>` if present, else `<description>`
- Atom: `content` = `<content>` if present, else `<summary>`

**Fix:** Read fields explicitly by feed type:
- **RSS**: use `content:encoded` (custom field) for body, `contentSnippet` for excerpt
- **Atom**: detect via raw XML root element `<feed>` (NOT `parsed.feedType` which is `undefined` in v3.13.0), use `content` for body, `summary` for excerpt

```typescript
// Atom detection regex
const isAtom = /^\s*<\?xml[^>]*\?>\s*<feed[\s>]/i.test(content) ||
               /^\s*<feed[\s>]/i.test(content.trim());
```

### Content Availability Guard (Anti-Hallucination)

**File:** `src/workers/jobs/determineContentAvailability.ts`

```typescript
export function determineContentAvailability(parsed: ParsedContent): ContentAvailability {
  if (!parsed.title || parsed.title.trim().length === 0) return "title_only";
  if (!parsed.excerpt || parsed.excerpt.trim().length === 0) return "excerpt";
  const bodyLength = parsed.body ? parsed.body.length : 0;
  if (bodyLength < 500) return "partial_text";
  return "full_text";
}
```

**CRITICAL SAFETY RULE:** Only `partial_text` and `full_text` articles are eligible for AI summarisation. Summarising `title_only` or `excerpt` forces the AI to hallucinate content. This guard is double-enforced at both the Server Action layer AND the API Route layer.

### Content Hashing (Change Detection)

**File:** `src/domain/articles/normalize.ts`

```typescript
export function hashContent(
  title: string,
  body: string | null | undefined,
  publishedAt: Date
): string {
  const data = `${title.trim()}|${body ?? ""}|${publishedAt.toISOString()}`;
  return createHash("sha256").update(data, "utf8").digest("hex");
}
```

**Why `body` is included (Phase 14 fix):** Previously, `hashContent(title, publishedAt)` only hashed title + date. Content-only updates (same title+date, different body) were silently dropped by `onConflictDoUpdate WHERE content_hash != excluded.content_hash`. Including `body` ensures body edits are detected.

### Upsert with Change Detection (`xmax = 0` trick)

```typescript
const result = await db.insert(articles)
  .values(newArticle)
  .onConflictDoUpdate({
    target: articles.canonicalUrl,
    set: { /* ... */ },
    setWhere: sql`${articles.contentHash} != excluded.content_hash`,
  })
  .returning({
    id: articles.id,
    isNew: sql<boolean>`(xmax = 0)`,  // true for INSERT, false for UPDATE
  });
```

**`xmax = 0`** is a PostgreSQL system column that is `0` for newly inserted rows and non-zero for updated rows. This lets you distinguish INSERT from UPDATE in a single query.

### FlowProducer Atomic DAG

**File:** `src/lib/queue/flows.ts`

```typescript
export async function enqueuePostIngestFlow(input: PostIngestFlowInput): Promise<void> {
  const flowProducer = getFlowProducer();  // Module-level singleton

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
    children,  // Parent runs ONLY after ALL children complete
  });
}
```

**Why FlowProducer (not individual `queue.add()`):** Individual `scoreQueue.add()` calls are not atomic — the feed-slice cache invalidation can fire before all scoring completes. FlowProducer guarantees the parent runs only after all children complete.

### Worker Concurrency Matrix

| Worker | Concurrency | Rationale |
| :--- | :--- | :--- |
| `ingest` | 50 | I/O-bound (network fetches) |
| `summarize` | 5 | AI rate-limited (Anthropic/OpenAI) |
| `score` | 20 | CPU/DB-bound |
| `feed-slice` | 10 | Redis-bound |

### Cache Invalidation (Worker → Web App)

**Problem:** `revalidateTag()` is a Next.js-only API. Workers run in a separate Node.js process and cannot call it.

**Fix:** Redis pub/sub. Workers publish invalidation events to a Redis channel; the Next.js app subscribes and calls `revalidateTag()` locally.

```typescript
// src/workers/lib/cacheInvalidation.ts (singleton publisher pattern)
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

---

## 8. Accessibility (WCAG AAA) Implementation

### WCAG AAA Compliance Checklist

| Requirement | Implementation | Verification |
| :--- | :--- | :--- |
| **Focus rings** | `:focus-visible { outline: 2px solid var(--color-dispatch-ember); outline-offset: 2px; }` in `globals.css` | Tab through any page — ember outline visible |
| **Skip-to-content link** | `<a href="#main-content" className="sr-only focus:not-sr-only ...">Skip to content</a>` in root `layout.tsx` (Phase 17) | Tab from URL bar — skip link appears |
| **Main landmark** | `<main id="main-content">` on all 7 page templates (Phase 17 + follow-up) | `document.querySelector('main#main-content')` returns element |
| **All images have alt** | Every `<Image>` and `<img>` has an `alt` attribute (empty `alt=""` for decorative) | E2E test: `e2e/smoke.spec.ts` "all images have alt text" |
| **`<time>` with `dateTime`** | `<time dateTime={article.publishedAt.toISOString()}>{formatTimeAgo(...)}</time>` | Inspect any ArticleCard |
| **`<nav aria-label>`** | Header nav: `<nav aria-label="Topic categories" role="tablist">` | Inspect Header component |
| **`role="feed"`** | FeedGrid: `<div role="feed" aria-label="News articles">` | Inspect feed container |
| **`role="contentinfo"`** | Footer: `<footer role="contentinfo">` | Inspect Footer component |
| **`role="status"`** | Empty state: `<div role="status">`; Skeleton: `aria-label="Loading news articles"` | Inspect FeedGrid empty state |
| **`role="alert"` + `aria-live`** | Error state: `<div role="alert" aria-live="polite">` | Inspect FeedContainer error state |
| **`prefers-reduced-motion`** | Global CSS: `@media (prefers-reduced-motion: reduce) { * { animation-duration: 0ms !important; transition-duration: 0ms !important; } }` | Toggle OS reduced-motion preference |
| **Color contrast** | `ink-600 (#3d3d3a)` on `paper-50 (#fafaf8)` = 9.5:1 (WCAG AAA) | Lighthouse audit |
| **AI disclosure** | `<aside aria-label="AI-generated summary transparency label">` | Inspect NutritionLabel |
| **Screen reader text** | `<span className="sr-only">Loading admin console…</span>` in AdminGuardSkeleton | Inspect admin skeleton |
| **Form labels** | `<label htmlFor="email">Email</label>` + `<input id="email" name="email">` | Inspect SignInClient form |

### Skip-to-Content Link Pattern (Phase 17)

```tsx
// src/app/layout.tsx — root layout (applies to ALL pages)
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-ink-900 focus:text-paper-50 focus:font-ui focus:text-sm focus:rounded focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-dispatch-ember"
>
  Skip to content
</a>
```

**Every page template must include `<main id="main-content">`** for the skip link to have a valid target. The 7 page templates are:
- `src/app/(public)/page.tsx` — Homepage
- `src/app/topics/[category]/page.tsx` — Topic page
- `src/app/(public)/search/page.tsx` — Search page
- `src/app/article/[id]/page.tsx` — Article detail
- `src/app/sign-in/SignInClient.tsx` — Sign-in page (Phase 17 follow-up fix)
- `src/app/auth-error/page.tsx` — Auth error page (Phase 17 follow-up fix)
- `src/app/(admin)/layout.tsx` — Admin layout (Phase 17 follow-up fix)

### Reduced Motion — Triple Defense

1. **Global CSS** (`globals.css`): Disables ALL animations and transitions when `prefers-reduced-motion: reduce`
2. **`useReducedMotion` hook**: Component-level conditional logic
3. **`RevealProvider`**: Immediately reveals all `.reveal` elements when reduced motion is preferred (skips IntersectionObserver)
4. **`PageTransition`**: Returns early (no View Transitions) when reduced motion is preferred

### AI Provenance Accessibility

The AI Nutrition Label (`NutritionLabel.tsx`) uses:
- `<aside aria-label="AI-generated summary transparency label">` — screen reader landmark
- Numbered source citations `[1]`, `[2]` with `<a>` links
- Coverage percentage displayed in `font-mono text-[10px]`
- "Verify with original source →" link for user verification

---

## 9. Anti-Patterns & Common Bugs

### Phase 17 Anti-Patterns (Most Recent)

| Anti-Pattern | Why Forbidden | Replacement |
| :--- | :--- | :--- |
| Missing skip-to-content link in root layout | WCAG AAA violation — keyboard users cannot bypass repetitive navigation | Add `<a href="#main-content" className="sr-only focus:not-sr-only ...">` as first child of `<body>`; add `id="main-content"` to `<main>` in every page template |
| JSON-LD via `metadata.other` | Next.js renders `metadata.other` keys as `<meta>` tags, NOT `<script>` tags — JSON-LD never appears in DOM as a script tag | Render `<script type="application/ld+json" dangerouslySetInnerHTML={{__html: jsonLd}} />` directly in the page body (Server Component) |
| Hand-written enum unions instead of schema-derived types | Violates Single Source of Truth — schema enum changes silently break consumers at runtime | Export `type X = (typeof enum.enumValues)[number]` from `schema.ts`; import in consumers; add compile-time `satisfies` check in tests |
| `"latest"` in `package.json` dependencies | Reproducibility footgun — manifest lies about what's installed; lockfile regen causes silent major-version jumps | Pin to `^` ranges matching the lockfile-resolved versions |

### Phase 16 Anti-Patterns

| Anti-Pattern | Why Forbidden | Replacement |
| :--- | :--- | :--- |
| Admin auth only in per-page data components | Latent security gap — any new admin page that forgets to call `verifyAdminSession()` is publicly accessible | Centralize via `<AdminGuard>` async Server Component in `(admin)/layout.tsx` wrapped in `<Suspense>` |
| `TRUSTED_PROXY` read via `process.env` | Bypasses Zod env schema; typos can't be caught at boot | Declare `TRUSTED_PROXY: z.string().optional()` in envSchema; read via typed `env.TRUSTED_PROXY` export |
| `PUSH_KEY_ENCRYPTION_KEY` validated lazily in `getKey()` | Boot succeeds with missing/invalid key; first push operation 500s (deferred failure) | Hoist validation to module scope; cache `KEY_BUFFER` so boot fails fast |
| Prod Redis without `--maxmemory-policy noeviction --appendonly yes` | Default policy is noeviction but undocumented; no AOF = jobs lost on Redis restart | Add explicit `command:` block to `docker-compose.prod.yml` redis service |
| `#!/bin/bash.# comment` concatenated shebang | Kernel tries to exec `/bin/bash.#` which doesn't exist; `./deploy.sh` fails with "cannot execute" | Shebang must be on its own line: `#!/bin/bash` then `# comment` on line 2 |
| `"DOCKER_REGISTRY/path"` without `$` prefix | Literal string passed to command; variable never interpolated | Use `"${DOCKER_REGISTRY}/path"` with `$` prefix |

### Phase 13-15 Anti-Patterns

| Anti-Pattern | Why Forbidden | Replacement |
| :--- | :--- | :--- |
| `new Date()` in Server Component | Non-deterministic; causes `next-prerender-current-time` build error | Move to Client Component with `useEffect`, or wrap in `<Suspense>` |
| Missing `@tailwindcss/postcss` | Tailwind v4 generates zero utility classes — only `@theme` custom properties | Install `@tailwindcss/postcss` + create `postcss.config.mjs` |
| `revalidateTag` in Workers | Next.js API not available in Node.js worker process | Use Redis pub/sub for cache invalidation |
| `.reveal` on top-of-page elements | Causes hydration mismatch (invisible vs visible) | Only use scroll-reveal for below-the-fold content |
| Corrupted `className` (e.g., `font浃着`) | Non-ASCII characters break styling silently | Use standard classes like `font-mono` and audit strings |
| `as any` in Drizzle `.with()` | Relational queries break type inference | Use explicit `.innerJoin()` for type-safety |
| `node:22-alpine` in Dockerfile | Violates `engines.node: ">=24.0.0"` | Pin to `node:24-alpine` |
| Missing `output: "standalone"` in `next.config.ts` | `Dockerfile.web` copies `.next/standalone/` which doesn't exist | Add `output: "standalone"` top-level |
| `vi.fn(() => mockInstance)` for constructors | `new` on vi.fn returns empty object, ignoring return value | Use `class MockX { ... }` in the mock factory |
| `??=` for test env vars | Shell env may contain values that fail Zod schema | Use direct `=` assignment in `src/test/setup.ts` |

### General Anti-Patterns (Always Forbidden)

| Anti-Pattern | Why Forbidden | Replacement |
| :--- | :--- | :--- |
| `any` in TypeScript | Breaks strict mode contract | `unknown` + type guards |
| `enum` / `namespace` | Compile to runtime IIFE/closure; violate `erasableSyntaxOnly` | String unions + ES modules |
| Custom component over Shadcn | Violates Library Discipline | Shadcn UI / Radix primitive, wrapped for styling |
| `throw new Error()` in RSC auth | Triggers full-page error boundary | `redirect('/sign-in')` from `next/navigation` |
| `drizzle-kit push` in production | Overwrites schema without migration history | `generate` + `migrate` only |
| Synchronous `params`/`searchParams` access | Runtime 500 in Next.js 16 App Router | Always `await params` (Promise) |
| Synchronous `cookies()` access | `TS2339` error; runtime undefined | `(await cookies()).get('key')` |
| Generic fonts (Inter, Roboto) | Violates "Editorial Dispatch" mandate | Newsreader, Instrument Sans, Commit Mono only |
| Raw hex colors in Tailwind | Bypasses design token system | Use design tokens (`bg-ink-900`, `text-paper-50`) |
| Direct `await` of DB query in page | Blocks page render in Next.js 16 with `cacheComponents` | Wrap in `<Suspense>` with Server Component |

---

## 10. Debugging Guide

### Problem: Tailwind v4 Utility Classes Not Generating (Zero Utilities)

**Symptom:** Build succeeds but no Tailwind utility classes appear in compiled CSS. Custom tokens (`bg-ink-900`, `text-paper-50`) resolve to `undefined`. Compiled CSS is ~16KB instead of hundreds of KB.

**Cause:** Tailwind CSS v4 requires `@tailwindcss/postcss` as a PostCSS plugin. Without `postcss.config.mjs`, `@import "tailwindcss"` is treated as plain CSS — `@theme` renders as custom properties but no utility classes are generated.

**Fix:**
```bash
pnpm add -D @tailwindcss/postcss@4.3.1
echo 'export default { plugins: { "@tailwindcss/postcss": {} } }' > postcss.config.mjs
rm -rf .next/   # CRITICAL — stale cache masks the fix
pnpm dev
```

**Prevention:** If utility classes are missing, check for `postcss.config.*` FIRST. The absence produces NO build error — it silently kills all utility class generation. Always `rm -rf .next/` after PostCSS/Tailwind/Next.js config changes.

### Problem: `next-prerender-current-time` Error

**Symptom:** Build fails with `Error: next-prerender-current-time` during static generation.

**Cause:** Using `new Date()` or `new Date().toLocaleDateString()` in a Server Component during prerendering. Next.js 16 with `cacheComponents: true` blocks non-deterministic time access.

**Fix:**
1. Move the time-sensitive code to a Client Component (`"use client"`)
2. Use `useEffect` to set the date after mount
3. Wrap the Client Component in `<Suspense>` in the parent

```tsx
// ❌ Don't: Server Component with new Date()
export default function Page() {
  const year = new Date().getFullYear();  // ERROR
  return <Footer year={year} />;
}

// ✅ Do: Client Component
"use client";
export function Footer() {
  const [year, setYear] = useState(0);
  useEffect(() => setYear(new Date().getFullYear()), []);
  return <footer>© {year}</footer>;
}

// ✅ Parent wraps in Suspense
<Suspense fallback={null}><Footer /></Suspense>
```

### Problem: `blocking-route` Error

**Symptom:** `Error: Route '/': Uncached data or connection() was accessed outside of <Suspense>.`

**Cause:** In Next.js 16 with `cacheComponents: true`, awaiting a DB query directly in a page component blocks the entire page from rendering.

**Fix:** Extract data fetching into a Server Component and wrap in `<Suspense>`:

```tsx
// ❌ Don't: Direct await blocks the page
export default async function HomePage() {
  const feed = await getFeedArticles();  // BLOCKS
  return <FeedGrid articles={feed.articles} />;
}

// ✅ Do: Suspense + Server Component
export default function HomePage() {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      <FeedData limit={6} />
    </Suspense>
  );
}
```

### Problem: JSON-LD Provenance Not in DOM

**Symptom:** On article detail pages, `document.querySelector('script[type="application/ld+json"]')` returns `null`.

**Cause:** Next.js's `metadata.other` API renders keys as `<meta>` tags, NOT `<script>` tags. JSON-LD set via `metadata.other["json-ld-provenance"]` was rendered as `<meta name="json-ld-provenance">` — semantically wrong.

**Fix (Phase 17):** Render the JSON-LD as a direct `<script>` element in `ArticleData.tsx` body:

```tsx
{jsonLdScript && (
  <script
    type="application/ld+json"
    key={`provenance-jsonld-${article.id}`}
    dangerouslySetInnerHTML={{ __html: jsonLdScript }}
  />
)}
```

### Problem: CI Fails with "Environment variable validation failed"

**Symptom:** GitHub Actions fails at `pnpm install` or `pnpm lint` with missing env var errors.

**Cause:** `src/lib/env/index.ts` validates at module load. Even linting imports modules that import `@/lib/env`.

**Fix:** Ensure ALL required env vars are set in `.github/workflows/ci.yml` `env:` block with CI-safe dummy values. See the CI workflow for the exact dummy values.

### Problem: `./scripts/deploy.sh` Fails with "cannot execute"

**Symptom:** `bash: ./scripts/deploy.sh: cannot execute: required file not found`

**Cause:** Shebang concatenated with comment: `#!/bin/bash.# Deployment script...`. Kernel tries to exec `/bin/bash.#` which doesn't exist. `bash -n` doesn't catch this (treats shebang as comment).

**Fix:** Line 1 must be exactly `#!/bin/bash`. The CI gate checks this with a regex: `^#!/(bin/bash|usr/bin/env\ bash)$`.

### Problem: E2E Tests Failing Due to DB Connection

**Symptom:** Playwright tests fail with `ECONNREFUSED` to PostgreSQL.

**Cause:** The dev server starts but DB-backed queries fail because no PostgreSQL is running locally.

**Fix:** Either (a) run PostgreSQL + Redis locally, or (b) use `docker compose -f docker-compose-sample.yml up -d postgres redis`, or (c) test against the live deployed site.

### Problem: Hydration Mismatch on `.reveal` Elements

**Symptom:** Console warning: "Hydration mismatch" on elements with `className="reveal"`.

**Cause:** Server renders `class="reveal"` (opacity: 0). Client's IntersectionObserver adds `.visible` in `useEffect`, but React detects the class difference during hydration.

**Fix:** Only use `.reveal` on below-the-fold elements. Above-the-fold elements should be visible immediately (no `.reveal` class).

---

## 11. Pre-Ship Checklist

Before considering ANY task complete, verify:

### Code Quality

```bash
pnpm check    # tsc --noEmit + ESLint --max-warnings 0 (MUST be silent = pass)
pnpm test     # vitest run (MUST pass: currently 302 tests across 53 suites)
```

- [ ] Zero TypeScript errors (`tsc --noEmit` clean)
- [ ] Zero ESLint warnings (`--max-warnings 0` clean)
- [ ] All tests pass (302/302 across 53 suites)
- [ ] No `any` types (use `unknown` + type guards)
- [ ] No `enum` or `namespace` (use string unions + ES modules)
- [ ] No raw hex colors in Tailwind classes (use design tokens)
- [ ] No `"latest"` in `package.json` (use `^` ranges)

### Architecture

- [ ] No data fetching in Layouts (fetch in Pages)
- [ ] All DB access via `queries.ts` in feature modules
- [ ] No `revalidateTag()` in workers (use Redis pub/sub)
- [ ] All async `params`/`searchParams` are `await`ed
- [ ] All `cookies()` calls are `await`ed
- [ ] `proxy.ts` has ZERO DB calls (UX-only)
- [ ] Admin routes protected by `<AdminGuard>` in layout (not per-page)
- [ ] Every page template has `<main id="main-content">`

### UI States (Every Component)

- [ ] **Loading** — skeleton shown (only when no data exists)
- [ ] **Error** — user-friendly message + retry button
- [ ] **Empty** — informative text (not just blank)
- [ ] **Success** — visual feedback
- [ ] **Async operation** — button disabled + loading indicator
- [ ] **onError handler** — always present with user feedback

### Accessibility (WCAG AAA)

- [ ] Skip-to-content link present (first focusable element)
- [ ] Focus rings visible (`focus-visible:ring-2 focus-visible:ring-dispatch-ember`)
- [ ] All images have `alt` attribute
- [ ] All `<time>` elements have `dateTime` attribute
- [ ] All `<nav>` has `aria-label`
- [ ] `prefers-reduced-motion` disables all animations
- [ ] Color contrast ≥ 7:1 (AAA) for body text
- [ ] Every list has an empty state
- [ ] Error messages announced via `aria-live="polite"`

### Security

- [ ] All env vars declared in Zod schema (`src/lib/env/index.ts`)
- [ ] No `process.env.X` direct access (use typed `env.X` export)
- [ ] `PUSH_KEY_ENCRYPTION_KEY` validated at module load (not lazy)
- [ ] Content Guard enforced (never summarize `title_only`/`excerpt`)
- [ ] Rate limiting active on `/api/articles` (20 req/s per IP)
- [ ] `TRUSTED_PROXY` set to `"true"` when behind CDN

### AI Provenance (EU AI Act Art. 50)

- [ ] JSON-LD `<script type="application/ld+json">` rendered in body (not via `metadata.other`)
- [ ] `X-AI-Provenance` HTTP header set via `metadata.other`
- [ ] `<meta name="ai-provenance">` set via `metadata.other`
- [ ] All 3 layers present when `summary.status === "ok"`

### Infrastructure

- [ ] `bash -n scripts/*.sh` passes (syntax check)
- [ ] Shebang regex check passes (line 1 = `#!/bin/bash` or `#!/usr/bin/env bash`)
- [ ] `python3 scripts/validate-compose.py` passes (all docker-compose files valid)
- [ ] `docker compose -f docker-compose.prod.yml config` parses without warnings
- [ ] Prod Redis has `--maxmemory-policy noeviction --appendonly yes`

### Testing

- [ ] Unit tests written (TDD: RED → GREEN → REFACTOR)
- [ ] Integration tests for DB queries + BullMQ jobs
- [ ] E2E tests for critical user journeys
- [ ] Coverage thresholds met (80% lines/functions/statements, 70% branches)
- [ ] `pnpm test:e2e` passes (10 Playwright smoke tests)

---

## 12. Lessons Learnt & How to Avoid Them

### Phase 17 Lessons

#### 1. Skip-to-Content Link — WCAG AAA Requirement

**Lesson:** WCAG AAA requires a skip-to-content link as the first focusable element on every page. The link must be visually hidden by default (`sr-only`) but become visible on focus (`focus:not-sr-only`) so sighted keyboard users can see it. The link's `href` must target an element with a matching `id` — if any page template forgets `<main id="main-content">`, the skip link is non-functional on that page.

**How to Avoid:** Centralize the skip link in the root layout; require every page template to include `<main id="main-content">`.

#### 2. JSON-LD Provenance — `metadata.other` Renders Meta Tags, Not Script Tags

**Lesson:** Next.js's `metadata.other` is for HTTP headers + `<meta>` tags only. For `<script type="application/ld+json">`, `<script type="module">`, or any other `<script>` variant, render the tag directly in the page body (Server Component). React 19 supports this and deduplicates by `key`. Always verify provenance/disclosure emissions via live DOM inspection, not just via the metadata API contract.

**How to Avoid:** Never use `metadata.other` for `<script>` tags. Render them directly in the component body with `dangerouslySetInnerHTML`.

#### 3. Hand-Written Enum Unions Violate Single Source of Truth

**Lesson:** When a Drizzle schema defines a `pgEnum`, always export a derived type via `(typeof enum.enumValues)[number]`. Never hand-write the union in consuming files. The `satisfies` operator (TypeScript 4.9+) is the cleanest way to enforce type-derivation invariants at compile time — it produces no runtime code but fails `tsc` if the types diverge.

**How to Avoid:** Export all derived types from `schema.ts`. Add compile-time `satisfies` checks in test files to catch drift.

#### 4. `"latest"` Dep Specifiers Create Reproducibility Risk

**Lesson:** `"latest"` in `package.json` is a reproducibility footgun — it makes the manifest lie about what's actually installed. Always use `^` ranges (or `~` for ultra-strict patch-only) matching the resolved versions. The lockfile is the source of truth for exact versions; `package.json` should declare the acceptable range.

**How to Avoid:** Run `pnpm install` (not `--frozen-lockfile`) after changing specifiers to regenerate the lockfile. Audit with `grep '"latest"' package.json` — should return 0 matches.

### Phase 16 Lessons

#### 5. Admin Auth Guard Centralization

**Lesson:** Next.js 16 `cacheComponents` rejects synchronous layouts that perform async work, but the fix is NOT to push auth into per-page components (fragile — relies on every page author remembering). The correct pattern is an async Server Component guard wrapped in `<Suspense>` inside the layout. **Centralize security at boundaries, not at leaves.**

#### 6. `TRUSTED_PROXY` in Zod Env Schema

**Lesson:** The `env` export is a frozen, validated object computed at module load. Tests can't use `vi.stubEnv` to change it dynamically — the pattern from `cacheInvalidation.test.ts` (mock `@/lib/env` with a mutable `mockEnv` object that tests control via direct property assignment) is the correct approach. Always declare EVERY env var in the Zod schema, even optional ones.

#### 7. `PUSH_KEY_ENCRYPTION_KEY` Module-Load Validation

**Lesson:** Security-critical env vars must be validated at module load (fail-fast at boot), not lazily on first use. Tests for module-load behavior require `vi.resetModules()` + dynamic `import()` to re-trigger the module load with controlled env state — the cached module won't re-evaluate.

#### 8. `bash -n` Is Permissive for Shebangs

**Lesson:** `bash -n` treats shebang lines as comments and won't catch malformed shebangs. The only way to catch the `#!/bin/bash.#` bug is a regex check on line 1, OR attempting to execute the script directly. Always validate infra-only changes (shell scripts, YAML, Dockerfiles) in CI — they don't have unit tests, so a dedicated gate is the only safety net.

### Phase 13-15 Lessons

#### 9. `rss-parser` Field Conflation

**Lesson:** Always check what a library conflates before relying on its built-in fields. For feeds, explicit field extraction by format is safer than generic fallbacks. `parsed.feedType` is `undefined` for Atom in v3.13.0 — detect via raw XML root element instead.

#### 10. Vercel AI SDK v6 `generateObject` Return Shape

**Lesson:** `generateObject()` returns `{ object, usage, ... }` — the validated output is in `result.object`, not `result` directly. Spread `result.object` and add `model` + `tokensUsed` from `result.usage`.

#### 11. Content Change Detection via `(xmax = 0)` Trick

**Lesson:** With `onConflictDoUpdate`, use PostgreSQL system column `xmax` in RETURNING to distinguish INSERT from UPDATE: `sql<boolean>\`(xmax = 0)\`` returns `true` for INSERT, `false` for UPDATE. Combined with `WHERE content_hash != excluded.content_hash`, this detects content changes and only enqueues scoring for genuinely new articles.

#### 12. Singleton Redis Publisher Pattern

**Lesson:** Creating a new Redis connection per cache invalidation call causes connection churn under high ingest load (50 workers × N calls). Use a module-level singleton publisher — same pattern for `FlowProducer` and rate limiter.

#### 13. Cursor-Based "Load More" — Server Fetch Initial, Client Fetches Subsequent

**Lesson:** The Next.js 16 App Router pattern for paginated feeds is: Server Component fetches page 1 (fast initial render + SEO), Client Component fetches subsequent pages (interactivity). The `<Suspense>` boundary wraps the Server Component so the page shell renders immediately.

#### 14. OAuth Providers — Conditional Configuration

**Lesson:** When adding new auth providers, make them conditional on env vars. The `Provider` type from Auth.js v5 is a union (object form + function form) — use `'id' in p` narrowing to access the `id` property safely in tests.

#### 15. Mocking `global.fetch` in Vitest

**Lesson:** `vi.fn()` creates a mock function but doesn't replace anything by itself. For global APIs like `fetch`, use `vi.stubGlobal("fetch", mockFn)`. Always reset between tests to avoid cross-test contamination.

---

## 13. Pitfalls to Avoid

### TypeScript Pitfalls

| Pitfall | Consequence | Avoidance |
| :--- | :--- | :--- |
| Using `any` instead of `unknown` | Breaks strict mode; hides type errors | Use `unknown` + type guards: `if (typeof input === 'string') ...` |
| Hand-writing enum unions | Schema drift — runtime errors when enum changes | Derive via `(typeof enum.enumValues)[number]` from `schema.ts` |
| Using `enum` keyword | Violates `erasableSyntaxOnly`; compiles to runtime IIFE | Use string unions: `type Status = "active" \| "inactive"` |
| Missing `import type` | Violates `verbatimModuleSyntax` | Always use `import type { X }` for type-only imports |
| Accessing `arr[i]` without `noUncheckedIndexedAccess` | Returns `T` instead of `T \| undefined` | Keep the flag enabled; handle `undefined` case |

### Next.js 16 Pitfalls

| Pitfall | Consequence | Avoidance |
| :--- | :--- | :--- |
| `new Date()` in Server Component | `next-prerender-current-time` build error | Move to Client Component with `useEffect` |
| Direct `await` of DB in page | `blocking-route` error | Wrap in `<Suspense>` with Server Component |
| `experimental.ppr` in config | Build error (removed in Next 16) | Use `cacheComponents: true` instead |
| `experimental.dynamicIO` in config | Build error (deprecated) | Use `cacheComponents: true` instead |
| `middleware.ts` instead of `proxy.ts` | Wrong file name for Next 16 | Use `proxy.ts` (renamed in Next 16) |
| Synchronous `params`/`searchParams` | Runtime 500 | Always `await params` (they're Promises now) |
| JSON-LD via `metadata.other` | Renders as `<meta>` tag, not `<script>` | Render `<script>` directly in component body |

### Database Pitfalls

| Pitfall | Consequence | Avoidance |
| :--- | :--- | :--- |
| `drizzle-kit push` in production | Overwrites schema without history | Use `generate` + `migrate` only |
| Eager DB connection at module load | Build crash when `DATABASE_URL` missing | Use Proxy pattern (lazy connection) |
| `as any` with Drizzle `.with()` | Type inference broken | Use explicit `.innerJoin()` |
| Hashing without `body` in `hashContent` | Content-only updates silently dropped | Include `body` in SHA-256 input |
| Missing `pg_trgm` extension | Autocomplete search fails silently | Run `CREATE EXTENSION IF NOT EXISTS pg_trgm;` |

### Worker/BullMQ Pitfalls

| Pitfall | Consequence | Avoidance |
| :--- | :--- | :--- |
| `revalidateTag()` in workers | `TypeError: revalidateTag is not a function` | Use Redis pub/sub for cache invalidation |
| New Redis connection per call | Connection churn under high load | Use module-level singleton |
| Individual `queue.add()` for DAG | Not atomic — parent can fire before children complete | Use `FlowProducer.add()` with `children` |
| Summarising `title_only`/`excerpt` | AI hallucination | Enforce Content Guard at both action + route layers |
| `summaryStatus: "none"` after 3 retries | No observability for failed summaries | Use `getSummaryFailureState()` → `needs_review` |

### Docker/Deployment Pitfalls

| Pitfall | Consequence | Avoidance |
| :--- | :--- | :--- |
| `node:22-alpine` in Dockerfile | Violates `engines.node: ">=24.0.0"` | Pin to `node:24-alpine` |
| Missing `output: "standalone"` | Dockerfile.web copies non-existent `.next/standalone/` | Add `output: "standalone"` top-level in `next.config.ts` |
| Prod Redis without `noeviction` | BullMQ jobs evicted under memory pressure | Add `--maxmemory-policy noeviction` to Redis command |
| Prod Redis without AOF | Jobs lost on Redis restart | Add `--appendonly yes` to Redis command |
| `#!/bin/bash.# comment` shebang | `./deploy.sh` fails with "cannot execute" | Shebang on its own line: `#!/bin/bash` |

---

## 14. Best Practices

### TypeScript Best Practices

1. **Prefer `interface` over `type`** for structural definitions. Use `type` for unions/intersections.
2. **Early returns** (guard clauses) over deeply nested conditionals.
3. **Composition over inheritance** — no class hierarchies for business logic.
4. **Use `satisfies` operator** to enforce type-derivation invariants at compile time.
5. **Avoid explicit return types** unless the function is a public API boundary.
6. **Use type inference** — let TypeScript infer types from implementation.

### Next.js 16 Best Practices

1. **Server Components by default.** Use `"use client"` only for interactivity.
2. **No data fetching in Layouts.** Fetch in Pages.
3. **Wrap async data fetches in `<Suspense>`** to prevent blocking-route errors.
4. **Use `generateMetadata()`** for SEO + HTTP headers + `<meta>` tags.
5. **Render `<script>` tags directly in the body** (not via `metadata.other`).
6. **Use `cache()` from React** to memoize per-request (e.g., `verifySession`).
7. **`redirect()` not `throw new Error()`** in RSC auth.

### Drizzle ORM Best Practices

1. **Lazy Proxy Connection** — defer DB connection until first query.
2. **All queries via `queries.ts`** in feature modules — no raw Drizzle calls in components.
3. **Derive types from schema** via `(typeof enum.enumValues)[number]` and `$inferSelect`.
4. **Additive migrations only** — never `push` in production.
5. **Use explicit `.innerJoin()`** for type-safe relational queries.
6. **Include all content fields in hashes** for change detection.

### Testing Best Practices

1. **TDD: RED → GREEN → REFACTOR → COMMIT** — one cycle per commit.
2. **For bugs: write failing regression test first**, then fix.
3. **Use `vi.mock("@/lib/env", ...)` with mutable `mockEnv`** to control env vars in tests.
4. **Use `vi.resetModules()` + dynamic `import()`** for module-load validation tests.
5. **Use `vi.stubGlobal("fetch", mockFetch)`** for global API mocking.
6. **Use `class MockX { ... }` in mock factories** for constructors (not `vi.fn(() => instance)`).
7. **Exclude `e2e/` from vitest, ESLint, and tsc** — Playwright has its own config.

### Security Best Practices

1. **All env vars in Zod schema** — validated at module load, fail-fast at boot.
2. **No `process.env.X` direct access** — use typed `env.X` export.
3. **Security-critical env vars at module scope** — not lazy.
4. **Admin auth at layout boundary** — not per-page.
5. **Rate limiting on public APIs** — 20 req/s per IP.
6. **`TRUSTED_PROXY=true` when behind CDN** — use rightmost IP.
7. **AES-256-GCM for push key encryption** — 64-char hex key, module-load validated.

### Design System Best Practices

1. **Never use raw hex colors** — always design tokens.
2. **Never use Inter/Roboto/Space Grotesk** — Newsreader, Instrument Sans, Commit Mono only.
3. **`.font-editorial` bakes in weight 800** — don't add `font-[800]` alongside it.
4. **CSS Subgrid for feed alignment** — no fixed heights, no JS measurement.
5. **`prefers-reduced-motion` disables ALL animations** — triple defense (CSS + hook + component).
6. **Every list has an empty state** — with `role="status"` or `aria-live`.

---

## 15. Coding Patterns

### Pattern: cva + Radix Slot (Button)

```tsx
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva("base classes...", {
  variants: { variant: { ... }, size: { ... } },
  defaultVariants: { variant: "primary", size: "md" },
});

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
```

### Pattern: Async Server Component Guard (AdminGuard)

```tsx
export async function AdminGuard({ children }: AdminGuardProps) {
  await verifyAdminSession();  // Redirects internally on failure
  return <>{children}</>;
}

// Layout usage:
<Suspense fallback={<AdminGuardSkeleton />}>
  <AdminGuard>{children}</AdminGuard>
</Suspense>
```

### Pattern: 5-State Machine (SummaryPanel)

```tsx
switch (optimisticStatus) {
  case "disabled": return null;
  case "none": return <RequestButton />;
  case "pending": return <GeneratingMessage />;
  case "needs_review": return <ReviewNotice />;
  case "ok": return <NutritionLabel summary={summary} />;
  default: return null;  // Exhaustive check
}
```

### Pattern: Server-Client Data Split (FeedData → FeedContainer)

```tsx
// Server Component: fetches initial page
export async function FeedData() {
  const feed = await getFeedArticles({ limit: 6 });
  return <FeedContainer initialArticles={feed.articles} initialNextCursor={feed.nextCursor} initialHasMore={feed.hasMore} />;
}

// Client Component: manages pagination state
"use client";
export function FeedContainer({ initialArticles, initialNextCursor, initialHasMore }) {
  const [articles, setArticles] = useState(initialArticles);
  // ... fetch more on click
}
```

### Pattern: Lazy DB Proxy

```tsx
let _db: ReturnType<typeof createDb> | null = null;

function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  _db = createDb(createClient(url));
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_, prop) {
    return getDb()[prop as keyof ReturnType<typeof getDb>];
  },
});
```

### Pattern: Module-Load Validation (encrypt.ts)

```tsx
const PUSH_KEY_HEX = process.env.PUSH_KEY_ENCRYPTION_KEY;
if (!PUSH_KEY_HEX || !/^[0-9a-fA-F]{64}$/.test(PUSH_KEY_HEX)) {
  throw new Error("PUSH_KEY_ENCRYPTION_KEY must be 64 hex chars...");
}
const KEY_BUFFER = Buffer.from(PUSH_KEY_HEX, "hex");  // Cached at module scope
```

### Pattern: Conditional OAuth Providers

```tsx
export function buildProviders(): Provider[] {
  const providers: Provider[] = [credentialsProvider];
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(Google({ clientId: ..., clientSecret: ... }));
  }
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    providers.push(GitHub({ clientId: ..., clientSecret: ... }));
  }
  return providers;
}
```

### Pattern: 3-Layer Provenance (ArticleData)

```tsx
// Layer 1: JSON-LD <script> — rendered directly in body (NOT via metadata.other)
{jsonLdScript && (
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript }} />
)}

// Layer 2 + 3: HTTP header + meta tag — via generateMetadata() metadata.other
metadata.other = {
  "ai-provenance": provenance.metaTag,        // Layer 3: <meta> tag
  "X-AI-Provenance": provenance.httpHeader,   // Layer 2: HTTP header
};
```

### Pattern: FlowProducer Atomic DAG

```tsx
await flowProducer.add({
  name: "refresh-feed-slice",
  queueName: "feed-slice",
  data: { categoryId },
  opts: { priority: 1 },
  children: newArticleIds.map(id => ({
    name: "score-article",
    queueName: "score",
    data: { articleId: id },
    opts: { priority: 2 },
  })),
});
```

### Pattern: Stretched Link (ArticleCard)

```tsx
<article className="group relative ...">
  <h3>
    <Link href={`/article/${article.id}`} className="after:absolute after:inset-0 ...">
      {article.title}
    </Link>
  </h3>
</article>
// The ::after pseudo-element covers the entire card, making it clickable
```

### Pattern: Compile-Time Type Safety (satisfies)

```tsx
// In test file — enforces that ScoringInputs.contentAvailability matches schema
const _typeCheck = "full_text" as ScoringInputs["contentAvailability"] satisfies SchemaContentAvailability;
void _typeCheck;
```

---

## 16. Coding Anti-Patterns

(See §9 Anti-Patterns & Common Bugs for the complete table. Key anti-patterns summarized here:)

- ❌ `any` → ✅ `unknown` + type guards
- ❌ `enum` / `namespace` → ✅ String unions + ES modules
- ❌ Custom component over Shadcn → ✅ Shadcn/Radix primitive
- ❌ `throw new Error()` in RSC auth → ✅ `redirect('/sign-in')`
- ❌ `drizzle-kit push` in prod → ✅ `generate` + `migrate`
- ❌ `new Date()` in Server Component → ✅ Client Component + `useEffect`
- ❌ Direct `await` DB in page → ✅ `<Suspense>` + Server Component
- ❌ JSON-LD via `metadata.other` → ✅ `<script>` directly in body
- ❌ Hand-written enum unions → ✅ Schema-derived types
- ❌ `"latest"` in package.json → ✅ `^` ranges
- ❌ `revalidateTag` in workers → ✅ Redis pub/sub
- ❌ `as any` in Drizzle `.with()` → ✅ Explicit `.innerJoin()`
- ❌ Admin auth per-page → ✅ `<AdminGuard>` at layout boundary
- ❌ Lazy env validation → ✅ Module-load validation (fail-fast)
- ❌ Raw hex colors → ✅ Design tokens
- ❌ Generic fonts (Inter/Roboto) → ✅ Newsreader/Instrument Sans/Commit Mono

---

## 17. Responsive Breakpoint Reference

OneStopNews uses Tailwind's default breakpoints (no custom config):

| Breakpoint | Width | Tailwind Prefix | Usage in OneStopNews |
| :--- | :--- | :--- | :--- |
| Default (mobile) | 0px+ | (none) | 1 column feed, hamburger menu, stacked sections |
| `sm` | 640px+ | `sm:` | Show edition bar date/location, 2-column newsletter form |
| `md` | 768px+ | `md:` | Desktop category nav (horizontal tabs), 2-column feed grid, hide hamburger |
| `lg` | 1024px+ | `lg:` | 3-column feed grid, 7:5 LeadStory grid, column rules in masthead |

### Common Responsive Patterns

```tsx
// Feed grid: 1 → 2 → 3 columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8">

// Masthead wordmark: scales up
<h1 className="font-editorial text-6xl sm:text-7xl lg:text-8xl tracking-[-0.03em]">

// Section heading
<h2 className="font-editorial text-3xl sm:text-4xl text-ink-900 leading-[1.05]">

// LeadStory 7:5 grid (desktop only)
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">
  <div className="lg:col-span-7">  {/* Image — 7 cols */}
  <div className="lg:col-span-5">  {/* Headline — 5 cols */}

// Hide on mobile, show on desktop
<div className="hidden md:flex ...">

// Hide on desktop, show on mobile
<button className="md:hidden ...">
```

### Max Width Container

All content uses `max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8` for consistent horizontal padding.

---

## 18. Z-Index Layer Map

| Z-Index | Element | Context |
| :--- | :--- | :--- |
| `9999` | Skip-to-content link (on focus) | `focus:z-[9999]` — must be above everything when visible |
| `999` | Scroll progress bar | `.scroll-progress { z-index: 999; }` — fixed at top |
| `50` | Mobile menu dialog (Radix Dialog) | `z-50` — overlay + content |
| `50` | Dialog overlay | `z-50` — backdrop blur |
| `40` | Sticky Header | `sticky top-0 z-40` — below dialog, above content |

**Rules:**
- Use Tailwind's `z-40`, `z-50`, `z-[999]`, `z-[9999]` — no other z-index values.
- The skip link MUST be `z-[9999]` so it's visible above the mobile dialog when focused.
- The scroll progress bar is `z-999` (via CSS) — above header, below dialog.
- Never use `z-index` without a positioning context (`fixed`, `sticky`, `absolute`, `relative`).

---

## 19. Color Reference (Complete)

### Ink Scale (Dark Text Colors)

| Token | Hex | RGB | Usage |
| :--- | :--- | :--- | :--- |
| `ink-900` | `#1a1a18` | rgb(26, 26, 24) | Headings (highest contrast) |
| `ink-700` | `#2a2a27` | rgb(42, 42, 39) | Secondary headings, admin sidebar |
| `ink-600` | `#3d3d3a` | rgb(61, 61, 58) | Body text (WCAG AAA on paper-50: 9.5:1) |
| `ink-500` | `#525250` | rgb(82, 82, 80) | Muted text |
| `ink-400` | `#6b6b68` | rgb(107, 107, 104) | Placeholder text, secondary metadata |
| `ink-300` | `#8a8a83` | rgb(138, 138, 131) | Metadata labels, timestamps |
| `ink-100` | `#e8e8e4` | rgb(232, 232, 228) | Dividers, borders |

### Paper Scale (Light Background Colors)

| Token | Hex | RGB | Usage |
| :--- | :--- | :--- | :--- |
| `paper-50` | `#fafaf8` | rgb(250, 250, 248) | Page background (newsprint off-white) |
| `paper-100` | `#f2f2ee` | rgb(242, 242, 238) | Card surface, section background |
| `paper-200` | `#e6e4de` | rgb(230, 228, 222) | Borders, skeleton placeholders |
| `paper-300` | `#d8d4cc` | rgb(216, 212, 204) | Masthead column rules |

### Dispatch Brand Accents (Category Colors)

| Token | Hex | RGB | Light Variant | Category Usage |
| :--- | :--- | :--- | :--- | :--- |
| `dispatch-ember` | `#c7513f` | rgb(199, 81, 63) | `ember-light: #fde8e4` | Breaking news, AI badge, primary CTA, Top Stories |
| `dispatch-sage` | `#6b8f71` | rgb(107, 143, 113) | `sage-light: #e4ede5` | Finance, positive indicators |
| `dispatch-slate` | `#5a6b7a` | rgb(90, 107, 122) | `slate-light: #e2e7ec` | Tech, Global, neutral accent |
| `dispatch-clay` | `#8b6d5a` | rgb(139, 109, 90) | `clay-light: #ede5df` | Local, Politics |
| `dispatch-violet` | `#7a6b8f` | rgb(122, 107, 143) | `violet-light: #e8e4ef` | Culture, creative |

### Category → Color Mapping

| Category Slug | Color Class | Active Border | Dot Color |
| :--- | :--- | :--- | :--- |
| `top-stories` | `bg-dispatch-ember` | `border-dispatch-ember` | `bg-dispatch-ember` |
| `local` | `bg-dispatch-clay` | `border-dispatch-clay` | `bg-dispatch-clay` |
| `tech` | `bg-dispatch-slate` | `border-dispatch-slate` | `bg-dispatch-slate` |
| `global` | `bg-dispatch-slate` | `border-dispatch-slate` | `bg-dispatch-slate` |
| `finance` | `bg-dispatch-sage` | `border-dispatch-sage` | `bg-dispatch-sage` |
| `politics` | `bg-dispatch-clay` | `border-dispatch-clay` | `bg-dispatch-clay` |
| `culture` | `bg-dispatch-violet` | `border-dispatch-violet` | `bg-dispatch-violet` |

### Status Color Mapping

| Status | Dot Color | Text Color | Background |
| :--- | :--- | :--- | :--- |
| Summary `ok` | `bg-dispatch-sage` | `text-dispatch-sage` | `bg-dispatch-sage/10` |
| Summary `pending` | `bg-ink-300 animate-pulse` | `text-ink-400` | (none) |
| Summary `needs_review` | `bg-amber-500` | `text-amber-700` | `bg-amber-50` |
| Summary `disabled` / `none` | (hidden) | (none) | (none) |
| Error | `bg-dispatch-ember` | `text-dispatch-ember` | `bg-dispatch-ember/10` |
| Success | `bg-dispatch-sage` | `text-dispatch-sage` | `bg-dispatch-sage/20` |

### Opacity Modifiers

Tailwind opacity modifiers work on all dispatch colors:
- `bg-dispatch-ember/10` — 10% opacity (badge backgrounds)
- `bg-dispatch-ember/20` — 20% opacity (border tint)
- `bg-dispatch-ember/90` — 90% opacity (hover state)
- `bg-dispatch-ember/95` — 95% opacity (breaking badge)

---

## 20. The Complete TypeScript Interface Reference

### Schema-Derived Types (`src/lib/db/schema.ts`)

```typescript
// Enums (pgEnum definitions)
export const userRoleEnum = pgEnum("user_role", ["reader", "admin"]);
export const feedFormatEnum = pgEnum("feed_format", ["rss", "atom", "json_api"]);
export const contentAvailabilityEnum = pgEnum("content_availability", [
  "title_only", "excerpt", "partial_text", "full_text"
]);
export const summaryStatusEnum = pgEnum("summary_status", [
  "none", "pending", "ok", "needs_review", "disabled"
]);

// Derived Types (Single Source of Truth — always import from here)
export type UserRole = (typeof userRoleEnum.enumValues)[number];              // "reader" | "admin"
export type FeedFormat = (typeof feedFormatEnum.enumValues)[number];          // "rss" | "atom" | "json_api"
export type ContentAvailability = (typeof contentAvailabilityEnum.enumValues)[number];
  // "title_only" | "excerpt" | "partial_text" | "full_text"
export type SummaryStatus = (typeof summaryStatusEnum.enumValues)[number];
  // "none" | "pending" | "ok" | "needs_review" | "disabled"

// Table-Related Types (inferred from schema)
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
```

### Domain Types (`src/domain/articles/types.ts`)

```typescript
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

### AI Output Schema (`src/features/summaries/lib/summariseSchema.ts`)

```typescript
export const sourceCitationSchema = z.object({
  url: z.string().url(),
  title: z.string().trim().min(1),
});

export const summarisationOutputSchema = z.object({
  summaryText: z.string().min(50).max(800),
  keyPoints: z.array(z.string().trim().min(1).max(120)).min(1).max(5),
  sourcesCited: z.array(sourceCitationSchema).min(1),
  aiStatement: z.string().min(20).max(200),
  coveragePercentage: z.number().int().min(0).max(100),
});

export type SummarisationOutput = z.infer<typeof summarisationOutputSchema>;
export type SourceCitation = z.infer<typeof sourceCitationSchema>;
```

### Provenance Types (`src/lib/ai/provenance.ts`)

```typescript
export interface ProvenanceInput {
  summary: SummarisationOutput;
  articleId: string;
  articleUrl: string;
  articleTitle: string;
  model: string;
  generatedAt: string;
}

export interface ProvenanceResult {
  jsonLd: string;      // Layer 1: JSON-LD for <script> tag
  httpHeader: string;  // Layer 2: Base64 JSON for X-AI-Provenance header
  metaTag: string;     // Layer 3: Semicolon-delimited for <meta> tag
}
```

### Scoring Types (`src/domain/ranking/score.ts`)

```typescript
export interface ScoringInputs {
  ageInHours: number;
  hasSummary: boolean;
  sourcePriority: number;  // 1-5, lower is better
  contentAvailability: ContentAvailability;  // From schema
}
// Returns: number in [0.0, 1.0]
```

### Rate Limit Types (`src/lib/rateLimit.ts`)

```typescript
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;  // Epoch milliseconds
}
```

### Queue/Flow Types (`src/lib/queue/flows.ts`)

```typescript
export interface PostIngestFlowInput {
  newArticleIds: string[];
  categoryId: string;
}
```

### Failure State Types (`src/workers/jobs/summarizeFailure.ts`)

```typescript
export interface SummaryFailureState {
  summaryStatus: "none" | "needs_review";
  flagReason: string | null;
}
```

### Component Props Reference

```typescript
// Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

// Badge
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean;
  dotColorClass?: string;
}

// Header
interface HeaderProps {
  activeCategory?: string;
  className?: string;
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

// FeedData
interface FeedDataProps {
  category?: string;
  cursor?: Date;
  limit?: number;
  params?: Promise<{ category: string }>;
  searchParams?: Promise<{ cursor?: string }>;
}

// SummaryPanel
interface SummaryPanelProps {
  articleId: string;
  initialStatus: SummaryStatus;
  summary?: SummarisationOutput | null;
  onRequestSummary?: () => void;
}

// NutritionLabel
interface NutritionLabelProps {
  summary: SummarisationOutput;
}

// DisclosureBadge
interface DisclosureBadgeProps {
  status: SummaryStatus;
  onClick?: () => void;
}

// AdminGuard
interface AdminGuardProps {
  children: React.ReactNode;
}

// SignInClient
interface SignInClientProps {
  showGoogle: boolean;
  showGithub: boolean;
}

// PageTransition
interface PageTransitionProps {
  children: ReactNode;
}
```

### Environment Schema (`src/lib/env/index.ts`)

```typescript
export const envSchema = z.object({
  DATABASE_URL: z.string().min(1).refine(v => v.startsWith("postgres://") || v.startsWith("postgresql://")),
  REDIS_URL: z.string().min(1).refine(v => v.startsWith("redis://")),
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1).refine(v => v.startsWith("sk-ant-")),
  OPENAI_API_KEY: z.string().min(1).refine(v => v.startsWith("sk-")),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(1),
  VAPID_PRIVATE_KEY: z.string().min(1),
  VAPID_SUBJECT: z.string().min(1),
  PUSH_KEY_ENCRYPTION_KEY: z.string().length(64).refine(v => /^[0-9a-fA-F]{64}$/.test(v)),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  TRUSTED_PROXY: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;
export const env: Env = validateEnv();  // Validated at module load
```

---

## Validation Checklist (10-Point)

This SKILL.md has been validated against the actual codebase:

1. ✅ **Tech stack versions match** — All versions verified from `package.json` (Next.js ^16.2.9, React ^19.2.7, TypeScript ^5.7.0, etc.)
2. ✅ **Configuration files match** — `next.config.ts`, `tsconfig.json`, `postcss.config.mjs` all verified verbatim
3. ✅ **Design system tokens match** — All `@theme` tokens verified from `globals.css` (ink/paper/dispatch scales, font stacks)
4. ✅ **Component architecture matches** — All component patterns verified from actual source files (Button cva+Slot, AdminGuard async RSC, SummaryPanel 5-state, etc.)
5. ✅ **Hooks implementation matches** — `useDebounce` and `useReducedMotion` verified verbatim from source
6. ✅ **Content ingestion patterns match** — RSS pipeline (parseFeed → determineContentAvailability → hashContent → FlowProducer DAG) verified from source
7. ✅ **Accessibility implementation matches** — Skip link, focus rings, reduced motion, ARIA patterns all verified from source
8. ✅ **Anti-patterns documented correctly** — All 50+ anti-patterns across 7 categories verified from CLAUDE.md/AGENTS.md/README.md
9. ✅ **Color references match** — All 21 color tokens (7 ink + 4 paper + 10 dispatch) verified from `globals.css`
10. ✅ **TypeScript interfaces match** — All interfaces verified from actual source files (schema, domain, components, env)

---

*This SKILL.md is the definitive reference for the OneStopNews codebase at Phase 17. Every section is grounded in the actual source code. When this document and the code diverge, the code is the source of truth — update this document immediately.*
