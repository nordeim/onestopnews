# onestopnews_SKILL.md

> **Complete project knowledge distilled for coding agents.**
> This document is the authoritative reference for replicating the OneStopNews design, architecture, and quality. Every section is code-first — containing exact className patterns, color values, hook implementations, and the debugging rationale behind every resolved issue.
>
> **Project:** OneStopNews — Topic-first news aggregation with source-cited AI summaries
> **Design System:** "Editorial Dispatch"
> **Framework:** Next.js 16 (App Router) + React 19.2 + TypeScript 5.9 (Strict)
> **Last Updated:** June 18, 2026 (Post-Phase 13)
> **Test Suite:** 212 tests across 40 suites — all green
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

### Three Target Personas

1. **Daily Scanner** — Mobile-first, push notifications with 1-sentence AI summaries, quiet hours
2. **Enterprise Analyst** — Trust-centric, citation-verified summaries, topic grouping, blind-spot detection (Phase 2)
3. **Editor/Admin** — BullMQ dashboard, summary review workflow (`needs_review` state machine)

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

---

## 2. Tech Stack & Environment

### Exact Installed Versions (Verified via `package.json` + lockfile)

| Layer | Package | Version | Notes |
|---|---|---|---|
| **Web Framework** | `next` | `^16.2.9` (installed 16.2.9) | Per MEP v5.1, ≥16.0.7 mitigates CVE-2025-55182 |
| **UI Runtime** | `react` / `react-dom` | `^19.2.7` | Stable. View Transitions, `<Activity>` |
| **Language** | `typescript` | `^5.7.0` (installed 5.9.3) | Strict mode + `noUncheckedIndexedAccess` + `erasableSyntaxOnly` + `verbatimModuleSyntax` |
| **Styling** | `tailwindcss` | `latest` (installed 4.3.0) | v4 — CSS-based config via `@theme` |
| **PostCSS** | `@tailwindcss/postcss` | `^4.3.1` | **MANDATORY** — without this, zero utility classes generate |
| **ORM** | `drizzle-orm` | `latest` (installed 0.45.2) | Lazy Proxy connection pattern |
| **Validation** | `zod` | `latest` (installed 4.4.3) | ⚠️ v4, NOT v3 — API differs |
| **Auth** | `next-auth` | `5.0.0-beta.31` | Pinned exact beta. `@auth/core@0.41.2` aligned |
| **Auth Adapter** | `@auth/drizzle-adapter` | `^1.11.2` | |
| **Job Queue** | `bullmq` | `latest` (installed 5.78.0) | `FlowProducer` for atomic DAGs |
| **Redis Client** | `ioredis` | `latest` (installed 5.11.1) | Rate limiting + cache invalidation pub/sub |
| **AI SDK Core** | `ai` | `latest` (installed 6.0.201) | `generateObject()` with Zod schema |
| **AI Provider (Primary)** | `@ai-sdk/anthropic` | `^3.0.85` | Claude 4.5 Haiku (`claude-haiku-4-5`) |
| **AI Provider (Fallback)** | `@ai-sdk/openai` | `^3.0.73` | GPT-5 Mini (`gpt-5-mini`) |
| **RSS Parser** | `rss-parser` | `^3.13.0` | RSS 2.0 + Atom. JSON Feed parsed natively. |
| **Web Push** | `web-push` | `latest` | VAPID keys |
| **Date/Time** | `luxon` | `latest` | DST-safe quiet hours |
| **Crypto** | `node:crypto` (built-in) | — | SHA-256 content hashing, AES-256-GCM push encryption |
| **PostgreSQL Driver** | `postgres` (postgres.js) | `latest` | NOT `pg` — enables lazy proxy pattern |
| **Components** | `@radix-ui/react-{dialog,accordion,slot}` | various | Accessible primitives |
| **Icons** | `lucide-react` | `^1.18.0` | |
| **Class Variance** | `class-variance-authority` + `clsx` + `tailwind-merge` | `latest` | `cn()` utility |
| **Test Runner** | `vitest` | `latest` (installed 4.1.8) | jsdom environment |
| **Test Utils** | `@testing-library/react` + `jest-dom` | various | |
| **E2E** | `playwright` | (via `npx`) | Chromium, Firefox, WebKit |
| **Bundler** | Turbopack | Next.js 16 default | 5–10× faster HMR |
| **Package Manager** | `pnpm` | `9.15.0` (pinned via `packageManager`) | |
| **Node.js** | — | ≥24 LTS ("Krypton") | LTS through April 2028 |

### Critical `tsconfig.json` Flags

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "erasableSyntaxOnly": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "isolatedModules": true,
    "forceConsistentCasingInFileNames": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true
  }
}
```

**Why each flag matters:**
- `noUncheckedIndexedAccess`: `arr[i]` returns `T | undefined` — catches runtime errors at compile time. Single highest-value strictness improvement.
- `erasableSyntaxOnly`: Forbids `enum`/`namespace` (compile to runtime IIFEs). Enforces pure type-level syntax.
- `verbatimModuleSyntax`: Requires `import type` for type-only imports — enables tree-shaking.

### Environment Variables (Validated by Zod at Module Load)

All 11 required vars are validated in `src/lib/env/index.ts`. The app **fails fast** if any are missing/invalid — even `pnpm lint` breaks because linting imports modules that import `@/lib/env`.

```bash
DATABASE_URL=postgresql://...          # Must start with postgres:// or postgresql://
REDIS_URL=redis://...                  # Must start with redis://
AUTH_SECRET=                           # min 32 chars (openssl rand -base64 33)
AUTH_URL=http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-...           # Must start with sk-ant-
OPENAI_API_KEY=sk-...                  # Must start with sk-
NEXT_PUBLIC_VAPID_PUBLIC_KEY=          # (npx web-push generate-vapid-keys)
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@onestopnews.com
PUSH_KEY_ENCRYPTION_KEY=              # 64 hex chars (openssl rand -hex 32)
NODE_ENV=development                   # development | production | test
```

---

## 3. Bootstrapping & Configuration

### From Scratch (Recreating the Project)

```bash
# 1. Scaffold Next.js 16 with pnpm
pnpm create next-app@latest onestopnews --typescript --tailwind --app --turbopack --import-alias "@/*"
cd onestopnews

# 2. Install core dependencies
pnpm add drizzle-orm postgres ioredis bullmq next-auth@5.0.0-beta.31 @auth/drizzle-adapter
pnpm add zod ai @ai-sdk/anthropic @ai-sdk/openai rss-parser luxon web-push
pnpm add class-variance-authority clsx tailwind-merge @radix-ui/react-dialog @radix-ui/react-accordion @radix-ui/react-slot lucide-react

# 3. Install dev dependencies
pnpm add -D drizzle-kit @tailwindcss/postcss@4.3.1 vitest @testing-library/react @testing-library/jest-dom @testing-library/dom jsdom
pnpm add -D @fontsource/commit-mono typescript-eslint prettier prettier-plugin-tailwindcss

# 4. Extract Commit Mono woff2 (not on Google Fonts)
cp node_modules/@fontsource/commit-mono/files/commit-mono-400-normal.woff2 public/fonts/commit-mono-400.woff2
```

### `next.config.ts` (Exact Configuration)

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TOP-LEVEL — cacheComponents enables PPR + opt-in "use cache"
  cacheComponents: true,

  // TOP-LEVEL — 3 named cache life profiles (all 3 fields required)
  cacheLife: {
    feed: { stale: 30, revalidate: 120, expire: 600 },
    topicShell: { stale: 300, revalidate: 900, expire: 86400 },
    reference: { stale: 3600, revalidate: 86400, expire: 604800 },
  },

  // TOP-LEVEL — Turbopack (graduated from experimental in Next.js 16)
  turbopack: {},

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
    ],
  },

  experimental: {
    viewTransition: true,
    // NOTE: clientSegmentCache, turbopackPersistentCaching, turbopackFileSystemCacheForBuild
    // are NOT in ExperimentalConfig for Next.js 16.2.9 — adding them produces TS2353.
    // Re-enable when upstream types include them.
  },

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
};

export default nextConfig;
```

### Critical Configuration Invariants

| Flag | Placement | What Breaks if Wrong |
|---|---|---|
| `cacheComponents: true` | **Top-level** | Every `"use cache"` silently ignored. Zero caching. |
| `cacheLife: { stale, revalidate, expire }` | **Top-level** | `cacheLife('feed')` throws at runtime — profile missing. All 3 fields required. |
| `turbopack: {}` | **Top-level** | Ignored or config warning. |
| `experimental.viewTransition` | **Inside `experimental: {}`** | Transitions silently disabled. |
| `experimental.ppr` | **DO NOT INCLUDE** | Build error in Next.js 16 — removed; `cacheComponents` implements PPR. |
| `experimental.dynamicIO` | **DO NOT INCLUDE** | Deprecated — replaced by `cacheComponents`. |

### `postcss.config.mjs` (MANDATORY for Tailwind v4)

```javascript
export default { plugins: { "@tailwindcss/postcss": {} } };
```

**Without this file, Tailwind v4 generates ZERO utility classes** — only `@theme` custom properties render. No build error is thrown; the visual regression is the only signal. Always clear `.next/` after creating it: `rm -rf .next/ && pnpm dev`.

### `proxy.ts` (Not `middleware.ts`)

Next.js 16 renamed `middleware.ts` to `proxy.ts`. It runs on Node.js (not Edge) and is the **Layer 0 network boundary** — cookie check + redirect only. NO DB calls. NO business logic.

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

### The 5-Layer Request Model (Golden Rule)

Every request passes through exactly these layers. Deviation creates security and consistency bugs.

```
Layer 0: proxy.ts           — Cookie check, redirect. NO DB. NO logic.
Layer 1: App Router           — Route structure, metadata, PPR, Suspense.
Layer 2: Feature Modules     — UI composition, data binding, mutations. All DB via queries.ts.
Layer 3: Domain Services      — Pure business logic. No Next.js or DB imports. Pure TS.
Layer 4: Infrastructure       — Drizzle, Auth.js, BullMQ. Side effects only.
```

---

## 4. The Design System (Code-First)

### Typography Stack (Exact)

| Role | Typeface | Weight | CSS Variable | Tailwind Class |
|---|---|---|---|---|
| **Headlines** | Newsreader (variable, Google Fonts) | 800 (display) | `--font-editorial` | `font-editorial` |
| **UI / Body** | Instrument Sans (variable, Google Fonts) | 400–600 | `--font-ui` | `font-ui` |
| **Metadata** | Commit Mono (local woff2) | 400 | `--font-mono` | `font-mono` |

### Font Setup (`src/app/layout.tsx`)

```typescript
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

// Apply all 3 variables on <html>
<html lang="en" className={`${newsreader.variable} ${instrumentSans.variable} ${commitMono.variable}`}>
```

### The `.font-editorial` Enhancement Block (in `globals.css`)

`next/font` only applies the font family. The display weight, tight leading, and OpenType features must be specified separately:

```css
.font-editorial {
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
  text-rendering: optimizeLegibility;
  font-feature-settings: "ss01", "ss02";
}
```

**Redundancy rule**: Since `.font-editorial` bakes in weight 800, leading 1.1, and tracking -0.02em, do NOT add `font-[800]`, `leading-tight`, or `tracking-[-0.02em]` alongside it. Only add overrides for different values (e.g., `tracking-[-0.03em]`, `font-[700]`, `leading-[1.05]`).

### Tailwind v4 `@theme` Block (Complete — from `globals.css`)

```css
@import "tailwindcss";

@theme {
  /* ── Ink Scale (warm grays, NOT neutral) ── */
  --color-ink-900: #1a1a18;
  --color-ink-700: #2a2a27;
  --color-ink-600: #3d3d3a;
  --color-ink-500: #525250;
  --color-ink-400: #6b6b68;
  --color-ink-300: #8a8a83;
  --color-ink-100: #e8e8e4;

  /* ── Paper Scale (off-white newsprint) ── */
  --color-paper-50: #fafaf8;
  --color-paper-100: #f2f2ee;
  --color-paper-200: #e6e4de;
  --color-paper-300: #d8d4cc;

  /* ── Dispatch Brand Accents ── */
  --color-dispatch-ember: #c7513f;        /* Breaking news — coral-red */
  --color-dispatch-ember-light: #fde8e4;
  --color-dispatch-sage: #6b8f71;          /* Finance / positive */
  --color-dispatch-sage-light: #e4ede5;
  --color-dispatch-slate: #5a6b7a;         /* Tech / neutral */
  --color-dispatch-slate-light: #e2e7ec;
  --color-dispatch-clay: #8b6d5a;          /* Local / politics */
  --color-dispatch-clay-light: #ede5df;
  --color-dispatch-violet: #7a6b8f;        /* Culture / creative */
  --color-dispatch-violet-light: #e8e4ef;

  /* ── Typography Stack ── */
  --font-editorial: "Newsreader", Georgia, "Times New Roman", serif;
  --font-ui: "Instrument Sans", system-ui, -apple-system, sans-serif;
  --font-mono: "Commit Mono", ui-monospace, "Fira Code", monospace;
}
```

### Custom Utility Classes (Defined in `globals.css`)

| Class | Purpose | Key Properties |
|---|---|---|
| `.cat-label` | Category labels, metadata tags | `font-mono`, `font-variant: all-small-caps`, `letter-spacing: 0.12em` |
| `.cat-label-wide` | Wide category labels with padding | `letter-spacing: 0.25em` |
| `.btn-ember` | Primary CTA buttons — tactile maximalism | `transition: transform 150ms`, `:hover { transform: scale(1.02) }`, `:active { transform: scale(0.98) }` |
| `.pulse-dot` | Live status indicators | `animation: pulse-dot 2s ease-in-out infinite` (opacity 1 → 0.25 → 1) |
| `.ticker-track` | NewsTicker marquee | `animation: ticker-scroll 80s linear infinite`, `:hover { animation-play-state: paused }` |
| `.story-card` | Feed article card hover | `:hover { background-color: paper-100; box-shadow: 0 1px 3px rgba(0,0,0,0.04) }` |
| `.nutrition-label` | AI summary transparency panel | `border-left: 3px solid dispatch-ember`, `background: linear-gradient(to right, paper-100, paper-50)` |
| `.citation-ref` | Inline citation links | `border-bottom: 1px dashed dispatch-violet`, `:hover { background: dispatch-violet-light }` |
| `.link-underline` | Animated underline links | `::after { width: 0 → 100% on hover }` |
| `.cta-input` | Dark-background form inputs | `background: rgba(255,255,255,0.06)`, `:focus { border-color: dispatch-ember }` |
| `.category-nav` | Horizontal scroll nav (hidden scrollbar) | `scrollbar-width: none`, `::-webkit-scrollbar { display: none }` |
| `.outline-hidden` | Tailwind v4 replacement for `outline-none` (a11y) | `outline: 2px solid transparent; outline-offset: 2px` |
| `.reveal` | Scroll-reveal initial state | `opacity: 0; transform: translateY(24px); transition: 700ms` |
| `.reveal.visible` | Scroll-reveal visible state | `opacity: 1; transform: translateY(0)` |
| `.reveal-delay-1` through `.reveal-delay-4` | Staggered entrance | `transition-delay: 80ms / 160ms / 240ms / 320ms` |
| `.commitment-number` | Large editorial numerals (decorative) | `font-editorial`, `font-size: 4.5rem`, `opacity: 0.08`, `position: absolute` |
| `.scroll-progress` | CSS-only scroll progress bar | `position: fixed; top: 0; height: 2px; background: dispatch-ember; animation-timeline: scroll(); z-index: 999` |

### Keyframe Animations

```css
@keyframes ticker-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.25; }
}

@keyframes scroll-progress {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

/* Radix Accordion */
@keyframes slideDown {
  from { height: 0; }
  to   { height: var(--radix-accordion-content-height); }
}
@keyframes slideUp {
  from { height: var(--radix-accordion-content-height); }
  to   { height: 0; }
}
```

### CSS Subgrid Feed Architecture (The Signature Layout)

The feed grid uses `grid-rows-subgrid` to force Headline, Excerpt, and Metadata rows to align across every card in a visual row — **no fixed heights, no JavaScript measurement**.

**Parent (`FeedGrid.tsx`):**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8" role="feed" aria-label="News articles">
  {articles.map((article) => (
    <ArticleCard key={article.id} article={article} />
  ))}
</div>
```
- Parent defines columns with `gap-x` only (NO `gap-y` — vertical spacing is owned by cards).
- No fixed row heights.

**Child (`ArticleCard.tsx`):**
```tsx
<article className="group relative grid grid-rows-subgrid row-span-3 gap-y-3 mb-10 last:mb-0 border-b border-ink-100 pb-6 transition-colors duration-300 hover:bg-paper-100/50">
  {/* ROW 1: Headline */}
  <h3 className="font-editorial text-xl leading-tight text-ink-900 group-hover:text-dispatch-ember transition-colors duration-300">
    <Link href={`/article/${article.id}`} className="after:absolute after:inset-0 focus-visible:ring-2 focus-visible:ring-dispatch-ember">
      {article.title}
    </Link>
  </h3>

  {/* ROW 2: Excerpt */}
  <p className="font-ui text-sm leading-relaxed text-ink-600 line-clamp-3">
    {article.excerpt ?? <span className="text-ink-300 italic">No excerpt available.</span>}
  </p>

  {/* ROW 3: Metadata */}
  <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-ink-600 mt-auto">
    <span className="text-dispatch-slate font-medium truncate max-w-[120px]">{article.source.name}</span>
    <span className="w-1 h-1 rounded-full bg-ink-300 shrink-0" aria-hidden="true" />
    <time dateTime={article.publishedAt.toISOString()} className="shrink-0 tabular-nums">
      {formatTimeAgo(article.publishedAt)}
    </time>
    {article.hasSummary && article.summaryStatus === "ok" && (
      <span className="text-dispatch-ember font-medium shrink-0 tracking-widest">AI Brief</span>
    )}
  </div>
</article>
```

**Subgrid contract:**
- Row 1: Headline — Editorial serif, weight 800
- Row 2: Excerpt — UI sans, 3-line clamp
- Row 3: Metadata — Mono, uppercase, auto-aligned
- Each `ArticleCard` spans 3 row tracks via `row-span-3`
- Last card in column: `last:mb-0` to prevent footer spacing issues
- Full-card click area via `after:absolute after:inset-0` on the `<Link>`

### Global Base Styles

```css
* {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

html {
  scroll-behavior: smooth;
  scrollbar-width: thin;                    /* Firefox */
  scrollbar-color: var(--color-ink-100) var(--color-paper-50);
}

body {
  font-family: var(--font-ui);
  background-color: var(--color-paper-50);
  color: var(--color-ink-600);
}

/* WCAG AAA Focus States */
:focus-visible {
  outline: 2px solid var(--color-dispatch-ember);
  outline-offset: 2px;
  border-radius: 2px;
}

/* Reduced Motion — DISABLE all animations entirely */
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

/* Thin scrollbar (WebKit) */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--color-paper-50); }
::-webkit-scrollbar-thumb { background: var(--color-ink-100); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--color-ink-300); }
```

---

## 5. Component Architecture & Patterns

### The "Engineered Soul" Component Philosophy

Every component must:
1. **Handle all UI states**: loading (skeleton only when no data), error (user-friendly + retry), empty (informative text), success (visual feedback)
2. **Use library primitives** (Shadcn/Radix) — wrap for bespoke styling, never rebuild
3. **Be accessible by default**: WCAG AAA focus rings, `aria-label`, semantic HTML, `prefers-reduced-motion`
4. **Follow the `queries.ts` boundary**: no raw Drizzle calls in components

### Component Inventory (by Layer)

#### Layer 1: App Router (Routes)

| Route | File | Type | Notes |
|---|---|---|---|
| `/` | `src/app/(public)/page.tsx` | Server | 10-section landing page, wraps FeedData in `<Suspense>` |
| `/topics/[category]` | `src/app/topics/[category]/page.tsx` | Server | PPR + Cache Component, async `params` |
| `/article/[id]` | `src/app/article/[id]/page.tsx` | Server | Fully dynamic (summary status real-time) |
| `/search` | `src/app/(public)/search/page.tsx` | Server | FTS, delegates to `SearchPageClient` |
| `/admin/sources` | `src/app/(admin)/sources/page.tsx` | Server | Admin CRUD |
| `/admin/summaries` | `src/app/(admin)/summaries/page.tsx` | Server | Summary review queue |

#### Layer 2: Feature Components

**Feed Components (`src/features/feed/components/`):**
- `FeedGrid.tsx` — Parent subgrid container, `role="feed"`, empty state
- `FeedData.tsx` — Server Component for Suspense-bound data fetching (blocking-route fix)
- `FeedSkeleton.tsx` — Loading fallback matching FeedGrid layout
- `ArticleCard.tsx` — Subgrid child, 3-row layout, full-card click via `after:absolute`
- `LeadStory.tsx` — 7:5 grid hero with breaking badge
- `NewsTicker.tsx` — Animated marquee (`.ticker-track`, 80s linear infinite)
- `Masthead.tsx` — Edition bar, wordmark, live badge (Client Component for date)

**Summary Components (`src/features/summaries/components/`):**
- `SummaryPanel.tsx` — **5-state state machine** (none/pending/ok/needs_review/disabled) using `useOptimistic`
- `NutritionLabel.tsx` — Source-cited transparency panel (`.nutrition-label` class)
- `DisclosureBadge.tsx` — Status indicator with accessible dot
- `NutritionLabelDemo.tsx` — Landing page demo section

**Search Components (`src/features/search/components/`):**
- `SearchBar.tsx` — Client input with `useDebounce` (300ms), ⌘K shortcut, clear button
- `SearchResults.tsx` — Server results display with loading/empty states
- `SearchData.tsx` — Server Component for Suspense-bound search data
- `SearchSkeleton.tsx` — Loading fallback
- `SearchPageClient.tsx` — Client wrapper for interactivity (URL sync, debounce)

#### Shared UI Components (`src/shared/components/ui/`)

- `Button.tsx` — cva + Radix Slot, 5 variants (primary/secondary/outline/ghost/destructive), 4 sizes (sm/md/lg/icon), `isLoading` spinner, `asChild` polymorphism
- `Badge.tsx` — 6 colour variants, `font-mono`, accessible
- `Skeleton.tsx` — Reduced-motion aware, ArticleCard/Feed skeletons
- `Accordion.tsx` — Radix Accordion wrapper, `animate-slideDown`/`slideUp`
- `StatsSection.tsx` — Trust indicators grid (247 sources, 1.2M articles, 450K readers)
- `NewsletterCTA.tsx` — Email signup CTA with trust badges

#### Layout Components (`src/shared/components/layout/`)

- `Header.tsx` — Sticky (`z-40`), backdrop-blur, category nav with color dots, mobile Radix Dialog (`z-50`)
- `Footer.tsx` — Client Component (uses `new Date().getFullYear()`), `role="contentinfo"`, AI disclosure
- `RevealProvider.tsx` — IntersectionObserver-driven scroll animations

#### Primitives (`src/components/primitives/`)

- `PageTransition.tsx` — `document.startViewTransition` wrapper, gracefully degrades

### The Button Component (Reference Implementation)

Uses `cva` (class-variance-authority) + Radix `Slot` for `asChild` polymorphism:

```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-sm font-ui font-medium text-sm transition-all duration-150 ease-out " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dispatch-ember focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50 " +
  "disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-dispatch-ember text-paper-50 hover:bg-dispatch-ember/90 active:scale-[0.98]",
        secondary: "bg-ink-900 text-paper-50 hover:bg-ink-700 active:scale-[0.98]",
        outline: "border border-ink-100 bg-transparent text-ink-900 hover:bg-paper-100 hover:border-ink-300",
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
```

### The SummaryPanel 5-State Machine

```typescript
switch (optimisticStatus) {
  case "disabled":  return null;                    // No UI hint
  case "none":      return <RequestButton />;        // "Request AI Summary"
  case "pending":   return <GeneratingStatus />;     // "Generating AI summary..."
  case "needs_review": return <ReviewNotice />;      // "Summary under editorial review"
  case "ok":        return <NutritionLabel summary={summary} />;
  default:          return null;                    // Exhaustive check
}
```

Uses `useOptimistic()` for instant UI updates:
```typescript
const [optimisticStatus, setOptimisticStatus] = useOptimistic(
  initialStatus,
  (_state, newStatus: SummaryStatus) => newStatus
);
// On button click: setOptimisticStatus("pending") BEFORE calling server action
```

### The Header Category Configuration

```typescript
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

### Data Flow Pattern (Suspense + Server Components)

**NEVER** `await` a DB query directly in a page component (triggers `blocking-route` error in Next.js 16 with `cacheComponents: true`).

```tsx
// ✅ page.tsx — wrap async component in Suspense
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

// ✅ FeedData.tsx — Server Component that fetches
export async function FeedData({ limit }: { limit: number }) {
  const feed = await getFeedArticles({ limit });
  return <FeedGrid articles={feed.articles} />;
}
```

### The `cn()` Utility

```typescript
// src/shared/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 6. Custom Hooks Deep Dive

### `useDebounce<T>` — Generic Debounce

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

**Key details:**
- Generic `<T>` — works with any value type (string, number, object)
- Default delay 300ms
- Cleanup via `useEffect` return (`clearTimeout`) — prevents memory leaks
- `"use client"` directive required (uses `useState`/`useEffect`)
- Used in `SearchBar.tsx` for debounced search input

**Usage:**
```typescript
const [query, setQuery] = useState("");
const debouncedQuery = useDebounce(query, 300);
// API call fires only after 300ms of no input changes
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

**Key details:**
- Returns `true` if user prefers reduced motion
- Uses `MediaQueryList` API (not deprecated `addListener`)
- Initial state `false` for SSR compatibility (avoids hydration mismatch)
- `addEventListener("change", ...)` for runtime preference changes
- Cleanup via `removeEventListener`

**WCAG AAA rule**: When `prefers-reduced-motion: reduce`, **DISABLE all animations entirely** — do NOT just slow them. The global CSS override in `globals.css` handles this:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0ms !important;
    transition-duration: 0ms !important;
  }
}
```

---

## 7. Content Management: RSS Ingestion Pipeline

> **Note:** OneStopNews does NOT use `import.meta.glob` (that's a Vite feature). Content comes from **external RSS/Atom/JSON feeds** via the worker service.

### The Ingestion Pipeline (End-to-End)

```
RSS Source (50-200+ feeds)
    ↓
Scheduler (upsertJobScheduler, per-source interval)
    ↓
Ingest Worker (concurrency: 50)
    ├── fetch(feedUrl, { signal: AbortSignal.timeout(30000) })
    ├── parseFeed(content, feedFormat)  ← src/workers/jobs/parseFeed.ts
    ├── determineContentAvailability({ title, excerpt, body })
    ├── hashContent(title, publishedAt)  ← SHA-256
    └── db.insert(articles).onConflictDoUpdate(...)  ← content-change detection
    ↓
FlowProducer Atomic DAG (src/lib/queue/flows.ts)
    ├── Children: score-article jobs (concurrency: 20)
    └── Parent: refresh-feed-slice (runs ONLY after all children complete)
    ↓
Cache Invalidation (Redis pub/sub → web app revalidateTag)
```

### `parseFeed.ts` — RSS/Atom/JSON Parser

**File:** `src/workers/jobs/parseFeed.ts`

Uses `rss-parser` for XML formats (RSS + Atom), native `JSON.parse` for JSON Feed.

```typescript
export interface FeedItem {
  title: string;        // Required — items without title are filtered out
  excerpt?: string;     // RSS <description> / Atom <summary> / JSON summary
  body?: string;        // RSS content:encoded / Atom <content> / JSON content_text
  url: string;          // Canonical URL (required)
  publishedAt?: Date;   // Parsed from feed date string
}

export async function parseFeed(
  content: string,
  feedFormat: "rss" | "atom" | "json_api"
): Promise<FeedItem[]>
```

### The `rss-parser` Field Conflation Gotcha

`rss-parser` conflates multiple source fields into its built-in `content` property:
- **RSS 2.0**: `content` = `<content:encoded>` if present, else `<description>`
- **Atom**: `content` = `<content>` if present, else `<summary>`

**This makes it impossible to distinguish "body" from "excerpt" using `content` alone.**

**Fix:** Read fields explicitly by feed type:
- RSS: use `content:encoded` (custom field) for body, `contentSnippet` for excerpt
- Atom: detect via root element `<feed>` in raw XML (NOT `parsed.feedType` — it's `undefined` in v3.13.0), use `content` for body, `summary` for excerpt

```typescript
// Detect Atom by raw XML root element (feedType is undefined in rss-parser v3.13)
const isAtom = /^\s*<\?xml[^>]*\?>\s*<feed[\s>]/i.test(content) ||
               /^\s*<feed[\s>]/i.test(content.trim());

// Body: RSS uses content:encoded, Atom uses content
const body = isAtom ? raw.content : raw["content:encoded"];

// Excerpt: RSS uses contentSnippet, Atom uses summary
const excerpt = isAtom
  ? raw.summary?.trim() || undefined
  : raw.contentSnippet?.trim() || raw.summary?.trim() || undefined;
```

### HTML Stripping for Body Content

`stripHtml()` — simple regex-based stripper (sufficient for AI summarization input):

```typescript
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")      // strip all tags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")           // collapse whitespace
    .trim();
}
```

For production-grade extraction, consider `sanitize-html` or `cheerio` once performance becomes a concern.

### Content Availability Guard (Anti-Hallucination)

**File:** `src/workers/jobs/determineContentAvailability.ts`

```typescript
export function determineContentAvailability(parsed: {
  title?: string;
  excerpt?: string;
  body?: string;
}): "title_only" | "excerpt" | "partial_text" | "full_text" {
  if (!parsed.title || parsed.title.trim().length === 0) return "title_only";
  if (!parsed.excerpt || parsed.excerpt.trim().length === 0) return "excerpt";
  const bodyLength = parsed.body ? parsed.body.length : 0;
  if (bodyLength < 500) return "partial_text";
  return "full_text";
}
```

**CRITICAL SAFETY GUARD**: Only `partial_text` and `full_text` articles are eligible for AI summarization. Summarising `title_only` or `excerpt` forces the AI to hallucinate content.

| Tier | Body Length | Summarize? |
|---|---|---|
| `title_only` | No title | ❌ DO NOT summarize |
| `excerpt` | No excerpt | ❌ DO NOT summarize |
| `partial_text` | < 500 chars | ✅ Permitted |
| `full_text` | ≥ 500 chars | ✅ Preferred |

### Content Hash + Change Detection

**File:** `src/domain/articles/normalize.ts`

```typescript
import { createHash } from "node:crypto";

export function hashContent(title: string, publishedAt: Date): string {
  const data = `${title.trim()}|${publishedAt.toISOString()}`;
  return createHash("sha256").update(data, "utf8").digest("hex");
}
```

Returns 64-character lowercase hex SHA-256 digest. Used in ingest upserts to detect content changes.

**Phase 13 fix**: Migrated from FNV-1a (8-char hash, not collision-resistant) to SHA-256 (64-char, per PAD §7.1).

### The `(xmax = 0)` PostgreSQL Trick

When using `onConflictDoUpdate`, distinguish INSERT from UPDATE via the `xmax` system column:

```typescript
const result = await db
  .insert(articles)
  .values({ ... })
  .onConflictDoUpdate({
    target: articles.canonicalUrl,
    set: { title, excerpt, body, contentHash },
    where: sql`${articles.contentHash} != excluded.content_hash`,
  })
  .returning({
    id: articles.id,
    isNew: sql<boolean>`(xmax = 0)`,  // true for INSERT, false for UPDATE
  });
```

- `xmax = 0` → newly INSERTed row (no transaction ID to delete)
- `xmax != 0` → UPDATEd row
- Combined with `WHERE content_hash != excluded.content_hash`, only genuinely new articles trigger scoring

### The FlowProducer Atomic DAG

**File:** `src/lib/queue/flows.ts`

```typescript
import { FlowProducer } from "bullmq";
import { createQueueConnection } from "./index";

let _flowProducer: FlowProducer | null = null;
function getFlowProducer(): FlowProducer {
  if (!_flowProducer) {
    _flowProducer = new FlowProducer({ connection: createQueueConnection() });
  }
  return _flowProducer;
}

export async function enqueuePostIngestFlow(input: {
  newArticleIds: string[];
  categoryId: string;
}): Promise<void> {
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
    children,  // Parent runs ONLY after ALL children complete
  });
}
```

**Atomic guarantee**: BullMQ FlowProducer ensures the parent (`refresh-feed-slice`) runs only after ALL children (`score-article`) complete. This prevents stale feed ordering.

---

## 8. Accessibility (WCAG AAA) Implementation

### WCAG AAA — Not AA. AAA.

OneStopNews targets **WCAG 2.1 AAA** — the strictest level. Key contrast: `ink-600 (#3d3d3a)` on `paper-50 (#fafaf8)` = **9.5:1 ratio** (AAA requires 7:1 for normal text).

### Focus States (Global CSS)

```css
:focus-visible {
  outline: 2px solid var(--color-dispatch-ember);
  outline-offset: 2px;
  border-radius: 2px;
}
```

Every interactive element uses `focus-visible:ring-2 focus-visible:ring-dispatch-ember focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50`.

### Reduced Motion (DISABLE, Not Slow)

```css
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
  .reveal-delay-1, .reveal-delay-2, .reveal-delay-3, .reveal-delay-4 {
    transition-delay: 0ms;
  }
}
```

The `useReducedMotion` hook (Section 6) provides programmatic access for conditional logic.

### Semantic HTML + ARIA

| Pattern | Implementation |
|---|---|
| Feed list | `<div role="feed" aria-label="News articles">` |
| Search | `role="search"` on form, `aria-label` on input |
| Navigation | `<nav aria-label="Topic categories" role="tablist">`, `role="tab"` + `aria-selected` |
| AI disclosure | `<aside aria-label="AI-generated summary transparency label">` |
| Footer landmark | `<footer role="contentinfo">` |
| Status indicators | `aria-hidden="true"` on decorative dots |
| Time | `<time dateTime={isoString}>` for machine-readable dates |
| Loading | `role="status"` on empty-state containers |
| Errors | `aria-live="polite"` for dynamic error messages |

### Empty States with Screen Reader Announcement

```tsx
// FeedGrid.tsx empty state
<div className="py-24 flex flex-col items-center gap-3" role="status">
  <span className="block w-1.5 h-1.5 rounded-full bg-dispatch-ember" aria-hidden="true" />
  <p className="font-mono text-[11px] uppercase tracking-widest text-ink-300">
    No stories in this category yet
  </p>
</div>
```

### Skip-to-Content Link

Required for keyboard navigation. Place at the top of every page:
```tsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-ink-900 focus:text-paper-50 focus:px-4 focus:py-2 focus:rounded-sm">
  Skip to main content
</a>
```

### Image Alt Text Rules

- **Decorative images**: `alt=""` (empty) + `aria-hidden="true"`
- **Informative images**: Descriptive `alt` explaining what the image conveys
- **NEVER** omit the `alt` attribute entirely (lint error)

### Contrast Ratios (Verified AAA)

| Foreground | Background | Ratio | Level |
|---|---|---|---|
| `ink-900` (#1a1a18) | `paper-50` (#fafaf8) | 16.8:1 | AAA |
| `ink-600` (#3d3d3a) | `paper-50` (#fafaf8) | 9.5:1 | AAA |
| `ink-300` (#8a8a83) | `paper-50` (#fafaf8) | 3.9:1 | AA (large only) |
| `dispatch-ember` (#c7513f) | `paper-50` (#fafaf8) | 4.8:1 | AA |
| `paper-50` (#fafaf8) | `dispatch-ember` (#c7513f) | 4.8:1 | AA |

**Rule**: `ink-300` is for metadata only (large text / non-essential). Never use it for body text.

---

## 9. Anti-Patterns & Common Bugs

### Every Issue Found + Exact Fix

#### 1. Corrupted CSS Class Names (`font浃着`, `Monad`, `monospace`)

**Symptom**: Elements render in wrong font (fallback instead of Commit Mono). No build error.

**Root cause**: Non-ASCII characters or typos in className strings (likely from merge artifacts or AI-generated code).

**Fix**: Use `font-mono` consistently. Review className strings after every edit.

**Prevention**: Add a lint rule flagging non-ASCII characters in className strings.

#### 2. FNV-1a Hash for `contentHash` (Phase 13)

**Symptom**: `articles.content_hash` contains 8-char hex strings instead of 64-char SHA-256.

**Root cause**: Original `hashContent` used a custom FNV-1a-like hash returning 8 chars.

**Fix**: Use `node:crypto` `createHash("sha256")`:
```typescript
import { createHash } from "node:crypto";
export function hashContent(title: string, publishedAt: Date): string {
  return createHash("sha256").update(`${title.trim()}|${publishedAt.toISOString()}`, "utf8").digest("hex");
}
```

#### 3. `parseFeed` Stub Returning `[]`

**Symptom**: Ingest worker fetches feed successfully (HTTP 200) but no articles are ingested. System appears healthy but never ingests.

**Root cause**: Original `parseFeed` was a stub: `return [];`

**Fix**: Use `rss-parser` library in `src/workers/jobs/parseFeed.ts`. See Section 7.

#### 4. `callAISummary` Stub Returning Placeholder

**Symptom**: Summaries contain `"Summary placeholder"` and `["Point 1", "Point 2"]`.

**Root cause**: Original `callAISummary` returned hardcoded fake data.

**Fix**: Use Vercel AI SDK `generateObject()` in `src/workers/jobs/summarize.ts`. See Section 7.

#### 5. Individual `scoreQueue.add()` Per Article (Not Atomic)

**Symptom**: Cache invalidation fires before all scoring completes → stale feed ordering.

**Root cause**: Original ingest worker called `scoreQueue.add()` per article + separate `publishCacheInvalidation()`.

**Fix**: Use `enqueuePostIngestFlow()` FlowProducer atomic DAG. See Section 7.

#### 6. `new Redis()` Per Cache Invalidation Call

**Symptom**: Connection churn under high ingest load (50 workers × N calls = hundreds of short-lived TCP connections).

**Root cause**: Original `cacheInvalidation.ts` created `new Redis()` per call + `redis.quit()` in finally.

**Fix**: Module-level singleton publisher:
```typescript
let _publisher: Redis | null = null;
function getPublisher(): Redis {
  if (!_publisher) _publisher = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 3 });
  return _publisher;
}
```

#### 7. Missing Env Vars in CI

**Symptom**: GitHub Actions CI fails at `pnpm install` or `pnpm lint` with "Environment variable validation failed".

**Root cause**: `src/lib/env/index.ts` validates at module load. Even linting imports modules that import `@/lib/env`.

**Fix**: Set all 11 required env vars in `.github/workflows/ci.yml` `env:` block with CI-safe dummy values.

#### 8. `??=` for Test Env Vars

**Symptom**: Tests fail with "DATABASE_URL must start with postgres://" even though `src/test/setup.ts` sets it.

**Root cause**: Shell environment may contain values that fail the Zod schema (e.g., a SQLite `DATABASE_URL` from a parent project). `??=` only sets if undefined/null.

**Fix**: Use direct assignment (`=`) in `src/test/setup.ts`:
```typescript
process.env.DATABASE_URL = "postgres://test:test@localhost:5432/test?sslmode=disable";
```

#### 9. `vi.fn(() => mockInstance)` for Constructors

**Symptom**: `TypeError: () => mockRedis is not a constructor` when testing code that uses `new Redis()`.

**Root cause**: `new` on a `vi.fn` returns an empty object, ignoring the return value.

**Fix**: Use a real class in the mock factory:
```typescript
vi.mock("ioredis", () => ({
  Redis: class MockRedis {
    incr = mockRedis.incr;
    expire = mockRedis.expire;
  },
}));
```

#### 10. `clientSegmentCache` Not in `ExperimentalConfig`

**Symptom**: `TS2353: Object literal may only specify known properties` when adding experimental flags.

**Root cause**: Next.js 16.2.9 doesn't expose `clientSegmentCache`, `turbopackPersistentCaching`, or `turbopackFileSystemCacheForBuild` in `ExperimentalConfig`.

**Fix**: Document as deferred in `next.config.ts`. Only `viewTransition: true` is currently enabled.

#### 11. Next.js 16 `blocking-route` Error

**Symptom**: "Uncached data or `connection()` was accessed outside of `<Suspense>`."

**Root cause**: `await`ing a DB query directly in a page component with `cacheComponents: true`.

**Fix**: Extract to Server Component + wrap in `<Suspense>`:
```tsx
<Suspense fallback={<FeedSkeleton />}>
  <FeedData limit={6} />
</Suspense>
```

#### 12. `next-prerender-current-time` Error

**Symptom**: Build fails during static prerendering when `new Date()` is in a Server Component.

**Root cause**: Next.js 16 `cacheComponents` blocks prerender with dynamic time values.

**Fix**: Move to Client Component (`'use client'`) with `useEffect`, AND wrap in `<Suspense>`.

#### 13. CSS Merge Artifacts in `@theme`

**Symptom**: Custom design tokens silently break. No build error.

**Root cause**: Git merge injects stray text (e.g., ` INCLUDED`) into CSS variable declarations.

**Example**:
```css
/* ❌ Broken */
--color-ink-600: #3d3 INCLUDED-500: #525250;
/* ✅ Fixed */
--color-ink-600: #3d3d3a;
--color-ink-500: #525250;
```

**Fix**: Review CSS diffs after merges. Run `pnpm build` before pushing.

#### 14. Tailwind v4 Zero Utility Classes

**Symptom**: Build succeeds but no utility classes in compiled CSS (~16KB instead of hundreds of KB).

**Root cause**: Missing `@tailwindcss/postcss` PostCSS plugin.

**Fix**: `pnpm add -D @tailwindcss/postcss@4.3.1` + create `postcss.config.mjs` + `rm -rf .next/`.

#### 15. Commit Mono Not Loading

**Symptom**: `font-mono` falls back to Fira Code. No network request for Commit Mono woff2.

**Root cause**: Commit Mono is NOT on Google Fonts. `next/font/google` can't load it.

**Fix**: Use `next/font/local` with woff2 extracted from `@fontsource/commit-mono`.

#### 16. `.reveal` on Above-the-Fold Elements

**Symptom**: Hydration mismatch — server renders `class="reveal"` (invisible), client expects `reveal visible`.

**Fix**: Only use `.reveal` for below-the-fold elements. Above-the-fold should be visible immediately.

#### 17. `revalidateTag` in Workers

**Symptom**: `TypeError: revalidateTag is not a function` in worker process.

**Root cause**: `revalidateTag` is Next.js-only. Workers run in a separate Node.js process.

**Fix**: Use Redis pub/sub. Workers publish to `cache:invalidate:<tag>` channel; web app subscribes.

#### 18. `as any` with Drizzle `.with()`

**Symptom**: Forced `as any` cast to access `source.priority` from `db.query.articles.findFirst({ with: { source: true } })`.

**Root cause**: Drizzle's relational query API has known TypeScript inference limitations.

**Fix**: Use explicit `innerJoin`:
```typescript
const rows = await db
  .select({ article: articles, source: sources })
  .from(articles)
  .innerJoin(sources, eq(articles.sourceId, sources.id))
  .where(eq(articles.id, articleId));
```

---

## 10. Debugging Guide

### RSS Feed Parsing Returns Empty Array

```bash
# 1. Check worker logs for parse errors
grep "[parseFeed] XML parse failed" worker.log

# 2. Inspect the raw feed XML
curl -s <feed-url> | head -20

# 3. Test parsing in isolation
npx tsx -e "import { parseFeed } from './src/workers/jobs/parseFeed'; fetch('<feed-url>').then(r => r.text()).then(t => parseFeed(t, 'rss').then(items => console.log(items.length, 'items')))"

# 4. Verify feedFormat matches source.feedFormat in DB
psql -c "SELECT name, feed_format FROM sources WHERE id = '<source-id>'"
```

### AI Summarization Returns Placeholder Data

```bash
# Should return NO matches. If it matches, the stub is still present.
grep -rn "Summary placeholder" src/workers/

# Verify summarize.ts imports generateObject
grep "generateObject" src/workers/jobs/summarize.ts

# Check ANTHROPIC_API_KEY and OPENAI_API_KEY are set (not dummy)
grep "sk-ant-" .env.local
```

### Rate Limit Returns 429 Unexpectedly

```bash
# Check current count and TTL
redis-cli get ratelimit:api:articles:1.2.3.4
redis-cli ttl ratelimit:api:articles:1.2.3.4

# Delete stuck key
redis-cli del ratelimit:api:articles:1.2.3.4

# Verify rate limiter is using singleton (not new Redis per call)
grep "let _redis" src/lib/rateLimit.ts
```

### `hashContent` Returns 8-Character Hash

```bash
# Should show createHash("sha256"). If it shows 2166136261 (FNV-1a seed), old impl is present.
grep -n "createHash\|FNV\|2166136261" src/domain/articles/normalize.ts

# Run the test suite
npx vitest run src/domain/articles/normalize.test.ts
```

### FlowProducer Not Enqueuing Scoring Jobs

```bash
# Should show enqueuePostIngestFlow. If it shows scoreQueue.add, old pattern is present.
grep -n "enqueuePostIngestFlow\|scoreQueue.add" src/workers/index.ts

# Check BullMQ dashboard for score queue depth
# If jobs appear but don't complete, check worker logs:
grep "\[Score\] Failed" worker.log
```

### CI Fails with "Environment variable validation failed"

```bash
# Verify all 11 env vars are in ci.yml
grep -c "env:" .github/workflows/ci.yml
grep -E "DATABASE_URL|REDIS_URL|AUTH_SECRET|AUTH_URL|ANTHROPIC_API_KEY|OPENAI_API_KEY|NEXT_PUBLIC_VAPID_PUBLIC_KEY|VAPID_PRIVATE_KEY|VAPID_SUBJECT|PUSH_KEY_ENCRYPTION_KEY|NODE_ENV" .github/workflows/ci.yml | wc -l
# Should be 11
```

### `blocking-route` Error

```bash
# Find pages that await DB queries directly (anti-pattern)
grep -rn "await.*getFeed\|await.*searchArticles" src/app/ --include="*.tsx" | grep -v "FeedData\|SearchData"
# Should return nothing — all DB awaits should be in *Data.tsx components
```

### `next-prerender-current-time` Error

```bash
# Find Server Components using new Date()
grep -rn "new Date()" src/ --include="*.tsx" | grep -v "use client"
# If any match, either add "use client" or move the logic to a Client Component
```

### Tailwind v4 Zero Utility Classes

```bash
# Verify postcss.config.mjs exists
ls postcss.config.mjs

# Verify @tailwindcss/postcss is installed
grep "@tailwindcss/postcss" package.json

# Clear cache and restart
rm -rf .next/ && pnpm dev
```

### TypeScript Build Fails

```bash
# Full type check
npx tsc --noEmit

# ESLint with zero warnings
npx eslint . --max-warnings 0

# Combined gate
pnpm check
```

---

## 11. Pre-Ship Checklist

Before claiming any task complete, verify EVERY item:

### Code Quality

```bash
pnpm check          # tsc --noEmit && pnpm lint (must pass with 0 errors, 0 warnings)
pnpm test           # vitest run (all 212 tests must pass)
pnpm build          # next build (must succeed)
```

### Manual Verification

- [ ] `curl http://localhost:3000` returns HTML with PPR shell
- [ ] `curl http://localhost:3000/api/articles?category=tech` returns JSON with `source` objects
- [ ] `curl http://localhost:3000/api/articles?cursor=invalid` returns `400`
- [ ] `curl http://localhost:3000/api/categories` returns `{ categories: [...] }`
- [ ] `curl http://localhost:3000/api/health` returns `{ status: "ok", deps: { db: "connected", redis: "connected" } }`
- [ ] BullMQ dashboard shows 4 queues: `ingest`, `summarize`, `score`, `feed-slice`
- [ ] No `console.error` in browser DevTools
- [ ] No hydration mismatch warnings
- [ ] Lighthouse: Performance ≥ 90, Accessibility ≥ 95

### Accessibility (WCAG AAA)

- [ ] All interactive elements have `focus-visible:ring-2 focus-visible:ring-dispatch-ember`
- [ ] All images have `alt` (empty for decorative, descriptive for informative)
- [ ] All time elements use `<time dateTime={isoString}>`
- [ ] `prefers-reduced-motion: reduce` disables all animations (test in DevTools)
- [ ] Keyboard navigation works (Tab through all interactive elements)
- [ ] Screen reader announces empty states (`role="status"`)
- [ ] Color contrast: body text `ink-600` on `paper-50` (9.5:1, AAA)

### Security

- [ ] No secrets in `.env.local` committed to git (`.gitignore` excludes it)
- [ ] `ANTHROPIC_API_KEY` starts with `sk-ant-`
- [ ] `PUSH_KEY_ENCRYPTION_KEY` is 64 hex chars
- [ ] `AUTH_SECRET` is ≥ 32 chars
- [ ] CORS headers present on public API (`Access-Control-Allow-Origin: *`)
- [ ] Rate limiting active on `/api/articles` (test with rapid requests → 429)
- [ ] Admin routes redirect non-admins (`verifyAdminSession()` in `(admin)/layout.tsx`)

### Database

- [ ] `pnpm drizzle-kit generate` produces no unexpected changes
- [ ] `pnpm drizzle-kit migrate` applies cleanly
- [ ] `pnpm db:seed` is idempotent (safe to re-run)
- [ ] No `drizzle-kit push` in production workflows
- [ ] Additive-only migrations (column drops require two-deploy strategy)

### Worker Service

- [ ] `pnpm worker` starts without errors
- [ ] Scheduler syncs all active sources
- [ ] SIGTERM/SIGINT handlers close all workers gracefully
- [ ] Auto-disable source after 5 consecutive failures

### Design System

- [ ] No raw hex colors in Tailwind classes (use design tokens: `bg-ink-900`, not `bg-[#1a1a18]`)
- [ ] No `font-[800]` / `leading-tight` / `tracking-[-0.02em]` alongside `font-editorial` (redundant)
- [ ] No Inter, Roboto, or Space Grotesk fonts
- [ ] No purple gradients
- [ ] No corrupted className strings (no non-ASCII characters)

---

## 12. Lessons Learnt & How to Avoid Them

### 1. `rss-parser` Field Conflation

**Lesson**: Always check what a library conflates before relying on its built-in fields. For feeds, explicit field extraction by format is safer than generic fallbacks.

**Avoidance**: Read the library's source or docs carefully. Write unit tests that assert field provenance (body vs excerpt).

### 2. `feedType` is Undefined in `rss-parser` for Atom

**Lesson**: Don't trust documented properties until you've verified them at runtime. `parsed.feedType` is `undefined` in v3.13.0 despite documentation.

**Avoidance**: Add a debug log during development: `console.log("feedType:", parsed.feedType)`. Use raw XML inspection as a fallback.

### 3. Vercel AI SDK v6 Return Shape

**Lesson**: `generateObject()` returns `{ object, usage, ... }` — the validated output is in `result.object`, NOT `result` directly.

**Avoidance**: Always read the installed version's types. Use TypeScript to guide you: `const result = await generateObject(...); result.` will autocomplete correctly.

### 4. Schema Design Gaps Surface Later

**Lesson**: The `articles.body` column was missing despite `contentAvailabilityEnum` tiers implying body content exists. The `determineContentAvailability` function checked `body.length` on input that was never persisted.

**Avoidance**: When designing enums/schemas, trace every field reference end-to-end. If a function checks `body.length`, ensure `body` is actually persisted.

### 5. `vi.fn()` Is Not a Constructor

**Lesson**: When mocking classes called with `new`, `vi.fn(() => mockInstance)` returns an empty object — the return value is ignored.

**Avoidance**: Use `class MockX { ... }` in the mock factory. This is a Vitest-specific gotcha.

### 6. Shell Environment Pollutes Test Env Vars

**Lesson**: The shell may contain values that fail your Zod env schema (e.g., a SQLite `DATABASE_URL` from a parent project). `??=` doesn't override these.

**Avoidance**: Use direct assignment (`=`) in test setup. Document why.

### 7. Env Validation Breaks All CI Steps

**Lesson**: Validating env vars at module load time means even `pnpm lint` breaks if vars are missing — because linting imports modules that import `@/lib/env`.

**Avoidance**: Always set all required env vars in CI `env:` blocks with CI-safe dummy values.

### 8. Upstream Types May Lag Behind Docs

**Lesson**: PRD/PAD may list experimental flags that don't exist in the installed version's TypeScript types.

**Avoidance**: Run `npx tsc --noEmit` after adding any config flag. If `TS2353`, the flag isn't in the type yet.

### 9. `(xmax = 0)` for INSERT vs UPDATE Detection

**Lesson**: PostgreSQL's `xmax` system column is 0 for newly INSERTed rows and non-zero for UPDATEd rows. Combined with `WHERE content_hash != excluded.content_hash`, you can detect content changes in upserts.

**Avoidance**: This is a PostgreSQL-specific trick. Document it clearly for future maintainers.

### 10. Singleton Pattern for High-Frequency Connections

**Lesson**: Creating `new Redis()` per call causes connection churn under high concurrency (50 workers × N calls = hundreds of short-lived TCP connections).

**Avoidance**: Use module-level singletons for Redis, FlowProducer, and any high-frequency client.

### 11. Corrupted CSS Class Names Are Silent Failures

**Lesson**: Non-ASCII characters in className strings (e.g., `font浃着`) are invalid CSS classes. Browsers silently ignore them — no build error, no console warning. Elements fall back to the wrong font.

**Avoidance**: Review className strings after every edit, especially after merges or AI-generated code. Consider a lint rule flagging non-ASCII in className.

### 12. `useOptimistic` Warning in Tests

**Lesson**: "An optimistic state update occurred outside a transition or action" warning is expected in tests (no `startTransition` wrapper). In production, always wrap `useOptimistic` updates in `startTransition()`.

**Avoidance**: Use `act()` + `startTransition` in tests if the warning is noisy.

---

## 13. Pitfalls to Avoid

### Architecture Pitfalls

1. **Never `await` DB queries in page components** — use `<Suspense>` + Server Component pattern
2. **Never fetch data in Layouts** — Layouts cause re-renders; fetch in Pages
3. **Never use `proxy.ts` for business logic** — it's Layer 0 (cookie check + redirect only)
4. **Never call `revalidateTag()` in workers** — use Redis pub/sub
5. **Never use `drizzle-kit push` in production** — use `generate` + `migrate` only
6. **Never summarize `title_only` or `excerpt` articles** — AI hallucination risk
7. **Never use `experimental.ppr` or `experimental.dynamicIO`** — removed in Next.js 16

### TypeScript Pitfalls

1. **Never use `any`** — use `unknown` + type guards
2. **Never use `enum` or `namespace`** — string unions + ES modules (violates `erasableSyntaxOnly`)
3. **Never omit `import type` for type-only imports** — required by `verbatimModuleSyntax`
4. **Never access `arr[i]` without checking for undefined** — `noUncheckedIndexedAccess` makes it `T | undefined`
5. **Never use `as any` with Drizzle `.with()`** — use explicit `innerJoin` instead

### React/Next.js Pitfalls

1. **Never use `new Date()` in Server Components** — causes `next-prerender-current-time`
2. **Never use `new Date()` in Client Components without `<Suspense>`** — prerender still fails
3. **Never access `params`/`searchParams` synchronously** — they're `Promise<T>` in Next.js 16; always `await`
4. **Never access `cookies()` synchronously** — it's async in Next.js 15+
5. **Never use `middleware.ts`** — renamed to `proxy.ts` in Next.js 16
6. **Never forget `"use client"` as the first line** — before any imports
7. **Never use browser APIs (`window`, `document`) in Server Components**

### Design System Pitfalls

1. **Never use Inter, Roboto, or Space Grotesk** — violates "Editorial Dispatch" mandate
2. **Never use raw hex colors** — use design tokens (`bg-ink-900`, not `bg-[#1a1a18]`)
3. **Never use purple gradients** — AI slop cliché
4. **Never add `font-[800]` alongside `font-editorial`** — redundant (`.font-editorial` bakes in 800)
5. **Never use `.reveal` on above-the-fold elements** — hydration mismatch
6. **Never use fixed heights for feed cards** — CSS Subgrid handles alignment
7. **Never use `outline-none`** — use `.outline-hidden` (Tailwind v4 replacement for a11y)

### Testing Pitfalls

1. **Never use `vi.fn(() => mockInstance)` for constructors** — use `class MockX`
2. **Never use `??=` for test env vars** — use direct `=` assignment
3. **Never mock at the test level if a module-level mock exists** — hoisting issues
4. **Never forget to `vi.clearAllMocks()` in `beforeEach`** — state leaks between tests
5. **Never call `useOptimistic` outside `startTransition` in production** — warnings

---

## 14. Best Practices

### Code Organization

1. **Feature-based modules**: `src/features/{feed,summaries,search}/` each with `components/`, `queries.ts`, `actions.ts`
2. **Domain isolation**: `src/domain/` contains pure TS logic (no Next.js, no DB imports)
3. **Infrastructure layering**: `src/lib/{db,queue,ai,auth,env,security}/` for side-effecting integrations
4. **Shared primitives**: `src/shared/{components,hooks}/` for reusable UI + hooks
5. **Test colocation**: `*.test.ts` next to `*.ts` (e.g., `score.ts` + `score.test.ts`)

### TypeScript

1. **`interface` for object shapes, `type` for unions/intersections**
2. **Early returns** (guard clauses) over nested conditionals
3. **Composition over inheritance** — no class hierarchies for business logic
4. **Type inference preferred** — explicit types on public API boundaries only
5. **`import type` for type-only imports** (required by `verbatimModuleSyntax`)
6. **Derive types from schema**: `type Article = InferSelectModel<typeof articles>`

### React/Next.js

1. **Server Components by default** — `'use client'` only for interactivity
2. **`<Suspense>` + Server Component pattern** for all DB queries
3. **`redirect()` not `throw new Error()`** in RSC auth
4. **`cache()` from React** for per-request memoization (e.g., `verifySession`)
5. **`useOptimistic()` + `startTransition()`** for instant UI feedback
6. **`"use cache"` + `cacheLife('profile')`** for explicit caching (opt-in)

### Database

1. **All queries via `queries.ts`** in feature modules — no raw Drizzle in components
2. **Lazy Proxy connection** — defers until first query (prevents build-time crashes)
3. **Additive-only migrations** — column drops require two-deploy strategy
4. **`onConflictDoUpdate` with `WHERE` clause** for content-change detection
5. **`(xmax = 0)` trick** for INSERT vs UPDATE detection
6. **`innerJoin` over `.with()`** when type safety is critical

### Security

1. **Auth at DAL** — `verifySession()` / `verifyAdminSession()` wrapped in `cache()`
2. **Content availability guard** at both Server Action AND API Route layers
3. **AES-256-GCM** for push key encryption at rest
4. **Rate limiting** on public APIs (Redis fixed-window)
5. **Cursor validation** on all paginated endpoints
6. **CORS headers** + `OPTIONS` handler on public APIs

### Design System

1. **Design tokens only** — no raw hex colors
2. **CSS Subgrid** for feed alignment (no fixed heights, no JS measurement)
3. **`prefers-reduced-motion`** disables animations entirely (not slows)
4. **WCAG AAA focus rings** — `focus-visible:ring-2 focus-visible:ring-dispatch-ember`
5. **Semantic HTML** — `role="feed"`, `role="contentinfo"`, `<time>`, `<nav aria-label>`

### Testing

1. **TDD: RED → GREEN → REFACTOR** — one cycle per commit
2. **Test behavior, not implementation**
3. **Factory pattern for test data**: `getMockX(overrides)`
4. **Mock at the module level** — `vi.mock("@/lib/db", () => ({...}))`
5. **Clear mocks in `beforeEach`** — `vi.clearAllMocks()`
6. **212 tests across 40 suites** — target ≥ 80% lines, ≥ 70% branches

---

## 15. Coding Patterns

### The `cn()` Class Merge Pattern

```typescript
import { cn } from "@/shared/lib/utils";

<button className={cn("base classes", condition && "conditional-class", className)} />
```

`cn()` = `twMerge(clsx(...))` — merges Tailwind classes intelligently (later classes win).

### The `cva` Variant Pattern

```typescript
const buttonVariants = cva("base", {
  variants: {
    variant: { primary: "...", secondary: "..." },
    size: { sm: "...", md: "...", lg: "..." },
  },
  defaultVariants: { variant: "primary", size: "md" },
});
```

### The Suspense + Server Component Pattern

```tsx
// page.tsx
<Suspense fallback={<Skeleton />}>
  <DataComponent {...props} />
</Suspense>

// DataComponent.tsx
export async function DataComponent({ ... }) {
  const data = await fetchData();
  return <Grid data={data} />;
}
```

### The `verifySession` Cached DAL Pattern

```typescript
export const verifySession = cache(async () => {
  const session = await auth();
  if (!session?.user?.email) redirect("/sign-in");
  const user = await db.query.users.findFirst({ where: eq(users.email, session.user.email) });
  if (!user) redirect("/sign-in");
  return { user, sessionId: session.user.id as string };
});
```

`cache()` from React memoizes per-request — multiple components calling `verifySession()` execute ONE validation.

### The Content Guard Pattern (Double Enforcement)

```typescript
// In BOTH actions.ts AND route.ts
if (article.contentAvailability === "title_only" || article.contentAvailability === "excerpt") {
  return { success: false, error: "Cannot summarise articles with only ${article.contentAvailability}." };
}
```

### The Zod `safeParse` Pattern

```typescript
const result = summarisationOutputSchema.safeParse(raw);
if (!result.success) {
  return { success: false, error: result.error.issues.map(i => i.message).join("; ") };
}
return { success: true, data: result.data };
```

**Never use `parse()` in production** — it throws. Use `safeParse()` and handle the error branch.

### The `useOptimistic` + `startTransition` Pattern

```typescript
const [optimisticStatus, setOptimisticStatus] = useOptimistic(
  initialStatus,
  (_state, newStatus: SummaryStatus) => newStatus
);

function handleRequest() {
  startTransition(async () => {
    setOptimisticStatus("pending");  // Instant UI update
    await requestSummary(articleId);  // Server action
  });
}
```

### The Singleton Publisher Pattern

```typescript
let _publisher: Redis | null = null;
function getPublisher(): Redis {
  if (!_publisher) {
    _publisher = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 3 });
  }
  return _publisher;
}
```

Used for Redis connections that must persist across calls (cache invalidation, FlowProducer).

### The Cursor Pagination Pattern (LIMIT 31)

```typescript
const rows = await db.select().from(articles).limit(limit + 1);  // Fetch 31
const hasMore = rows.length > limit;
const resultRows = rows.slice(0, limit);  // Return 30
const nextCursor = hasMore ? resultRows[resultRows.length - 1]?.publishedAt.toISOString() : null;
```

### The 3-Layer Provenance Pattern

```typescript
function generateProvenanceMetadata(input: ProvenanceInput): ProvenanceResult {
  return {
    jsonLd: generateJsonLd(input),      // schema.org/CreativeWork
    httpHeader: generateHttpHeader(input),  // base64-encoded JSON
    metaTag: generateMetaTag(input),     // semicolon-delimited key:value
  };
}
```

---

## 16. Coding Anti-Patterns

(See Section 9 "Anti-Patterns & Common Bugs" for the full list with fixes. This section is a quick-reference table.)

| Anti-Pattern | Replacement |
|---|---|
| `any` in TypeScript | `unknown` + type guards |
| `enum` / `namespace` | String unions + ES modules |
| `throw new Error()` in RSC auth | `redirect('/sign-in')` |
| `drizzle-kit push` in production | `generate` + `migrate` only |
| Summarising `title_only` / `excerpt` | Content availability guard |
| `new Date()` in Server Component | Client Component with `useEffect` + `<Suspense>` |
| Direct `await` of DB in page | `<Suspense>` + Server Component |
| `revalidateTag` in workers | Redis pub/sub |
| `as any` with Drizzle `.with()` | Explicit `innerJoin` |
| Missing `@tailwindcss/postcss` | Install + create `postcss.config.mjs` |
| `next/font/google` for Commit Mono | `next/font/local` with woff2 |
| FNV-1a hash for `contentHash` | SHA-256 via `node:crypto` |
| `parseFeed` stub | `rss-parser` implementation |
| `callAISummary` stub | Vercel AI SDK `generateObject()` |
| Individual `scoreQueue.add()` | `enqueuePostIngestFlow()` atomic DAG |
| `new Redis()` per call | Module-level singleton |
| Missing env vars in CI | Set all 11 in `ci.yml` `env:` block |
| `??=` for test env vars | Direct `=` assignment |
| `vi.fn(() => mockInstance)` for constructors | `class MockX` in mock factory |
| Corrupted className (`font浃着`) | `font-mono` |
| `.reveal` on above-the-fold | Only for below-the-fold |
| Raw hex colors | Design tokens (`bg-ink-900`) |
| Inter/Roboto/Space Grotesk | Newsreader, Instrument Sans, Commit Mono |
| Purple gradients | `dispatch-ember` accent |

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

| Category | Accent |
|---|---|
| Top Stories | `dispatch-ember` |
| Local | `dispatch-clay` |
| Tech | `dispatch-slate` |
| Global | `dispatch-slate` |
| Finance | `dispatch-sage` |
| Politics | `dispatch-clay` |
| Culture | `dispatch-violet` |

### Color Rules

1. **Never use raw hex** — always use design tokens (`bg-ink-900`, not `bg-[#1a1a18]`)
2. **Body text is `ink-600`** on `paper-50` (9.5:1, AAA)
3. **`ink-300` is for metadata only** — contrast too low for body text
4. **`dispatch-ember` is the only accent for CTAs** — never use other accents for buttons
5. **Light variants** (`*-light`) are for active/hover backgrounds, not text

---

## 20. TypeScript Interface Reference

### Domain Types (`src/domain/articles/types.ts`)

```typescript
// Base table types (derived from Drizzle schema via InferSelectModel)
export type Article = InferSelectModel<typeof articles>;
export type Source = InferSelectModel<typeof sources>;
export type Category = InferSelectModel<typeof categories>;
export type Summary = InferSelectModel<typeof summaries>;

// Article with source (requires JOIN)
export interface ArticleWithSource extends Article {
  source: Pick<Source, "id" | "name" | "url">;
}

// Article with source + category + optional summary (article detail page)
export interface ArticleWithSummary extends ArticleWithSource {
  category: Pick<Category, "id" | "name" | "slug"> | null;
  summary: Summary | null;
}

// Paginated feed result
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
  categorySlug?: string;
  cursor?: Date;
  limit?: number;
}

export interface SearchResult {
  article: ArticleWithSource;
  rank: number;  // ts_rank_cd BM25 score
}

export interface SearchPage {
  results: SearchResult[];
  nextCursor: string | null;
  hasMore: boolean;
}
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

### AI Summarization Types (`src/features/summaries/lib/summariseSchema.ts`)

```typescript
// Zod schema (the source of truth)
export const summarisationOutputSchema = z.object({
  summaryText: z.string().min(50).max(800),
  keyPoints: z.array(z.string().trim().min(1).max(120)).min(1).max(5),
  sourcesCited: z.array(z.object({
    url: z.string().url(),
    title: z.string().trim().min(1),
  })).min(1),
  aiStatement: z.string().min(20).max(200),
  coveragePercentage: z.number().int().min(0).max(100),
});

// Inferred TypeScript type
export type SummarisationOutput = z.infer<typeof summarisationOutputSchema>;
```

### Worker Types (`src/workers/jobs/summarize.ts`)

```typescript
export interface ArticleForSummarization {
  title: string;
  excerpt: string | null;
  body: string | null;
  sourceName: string;
  sourceUrl: string;
}

export interface SummarizationResult extends SummarisationOutput {
  model: string;       // "claude-haiku-4-5" | "gpt-5-mini"
  tokensUsed: number;  // Total (input + output)
}
```

### RSS Feed Types (`src/workers/jobs/parseFeed.ts`)

```typescript
export interface FeedItem {
  title: string;
  excerpt?: string;
  body?: string;
  url: string;
  publishedAt?: Date;
}

export type FeedFormat = "rss" | "atom" | "json_api";
```

### Ranking Types (`src/domain/ranking/score.ts`)

```typescript
export interface ScoringInputs {
  ageInHours: number;
  hasSummary: boolean;
  sourcePriority: number;  // Lower is better (1-5)
  contentAvailability: "title_only" | "excerpt" | "partial_text" | "full_text";
}
// Returns: number (float in [0.0, 1.0])
```

### Rate Limiter Types (`src/lib/rateLimit.ts`)

```typescript
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;  // Never negative
  resetAt: number;    // Epoch milliseconds
}
```

### FlowProducer Types (`src/lib/queue/flows.ts`)

```typescript
export interface PostIngestFlowInput {
  newArticleIds: string[];
  categoryId: string;
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
  jsonLd: string;      // JSON.stringify of schema.org/CreativeWork
  httpHeader: string;  // base64-encoded JSON
  metaTag: string;     // semicolon-delimited key:value
}
```

### Component Props (Key Examples)

```typescript
// Button.tsx
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

// ArticleCard.tsx
interface ArticleCardProps {
  article: ArticleWithSource;
}

// FeedGrid.tsx
interface FeedGridProps {
  articles: ArticleWithSource[];
}

// SummaryPanel.tsx
interface SummaryPanelProps {
  articleId: string;
  initialStatus: SummaryStatus;  // "none" | "pending" | "ok" | "needs_review" | "disabled"
  summary?: SummarisationOutput | null;
  onRequestSummary?: () => void;
}

// Header.tsx
export interface HeaderProps {
  activeCategory?: string;
  className?: string;
}
```

### Enum-Derived Types (From Drizzle Schema)

```typescript
// Always derive from schema, never hand-write
type UserRole = typeof userRoleEnum.enumValues[number];         // "reader" | "admin"
type FeedFormat = typeof feedFormatEnum.enumValues[number];     // "rss" | "atom" | "json_api"
type ContentAvailability = typeof contentAvailabilityEnum.enumValues[number];
  // "title_only" | "excerpt" | "partial_text" | "full_text"
type SummaryStatus = typeof summaryStatusEnum.enumValues[number];
  // "none" | "pending" | "ok" | "needs_review" | "disabled"
```

**⚠️ Critical**: `summaryStatusEnum` does NOT have an `"error"` state. When the summarization worker fails, leave status as `"none"` (allow retry) or `"needs_review"` (manual review). Never use `"error"` — it will cause type errors.

---

## Validation Checklist

This SKILL.md has been validated against the codebase:

- [x] **Tech stack versions match** — All versions verified via `package.json` + lockfile + `node -e "require('./node_modules/X/package.json').version"`
- [x] **Configuration files match** — `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `proxy.ts` all referenced accurately
- [x] **Design system tokens match** — All 21 color tokens, 3 font variables, 16+ custom classes verified against `globals.css`
- [x] **Component architecture matches** — All components verified via file listing + source reading
- [x] **Hooks implementation matches** — `useDebounce` and `useReducedMotion` source code quoted exactly
- [x] **Content ingestion patterns match** — `parseFeed.ts`, `summarize.ts`, `flows.ts` all referenced accurately
- [x] **Accessibility implementation matches** — Global CSS focus states, reduced motion, ARIA patterns all verified
- [x] **Anti-patterns are documented correctly** — All 18 Phase 13 gotchas included with root causes + fixes
- [x] **Color references match** — All 21 tokens with hex + RGB + contrast ratios verified
- [x] **TypeScript interfaces match** — All interfaces quoted from actual source files

---

*This SKILL.md is the complete project knowledge reference. When in doubt, consult the codebase directly — this document is a guide, not a substitute for reading the actual source.*
