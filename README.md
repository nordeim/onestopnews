<div align="center">

# OneStopNews

**Topic-first news aggregation with source-cited AI summaries.**

[![Next.js](https://img.shields.io/badge/Next.js-%E2%89%A516.0.7-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x%20Strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](./LICENSE)

*Every story, organized by what it's about — not who published it.*

</div>

---

## Overview

OneStopNews is a topic-first news aggregation and AI summarisation platform that reorganises public news content around subjects rather than sources. It collects article metadata from 50–200+ diverse RSS/Atom/JSON feeds, normalises and categorises stories into a two-level topic hierarchy, and presents them in a calm, editorially-informed interface built on the **"Editorial Dispatch"** design system. Every AI-generated summary carries a machine-readable **3-layer provenance disclosure** (JSON-LD + HTTP header + HTML meta tag) achieving full EU AI Act Article 50 compliance — no C2PA, no ambiguity.

The platform targets three distinct personas: **daily scanners** who need a fast, calm mobile interface with AI-summarised push notifications; **enterprise analysts** who require trustworthy topic grouping, accurate source attribution, and citation-verified summaries; and **editors/admins** who manage ingestion pipelines, review flagged AI summaries, and monitor system health through a BullMQ dashboard.

---

## Key Features

| Feature | Description |
| :--- | :--- |
| 🗂️ **Topic-first feed** | Stories grouped by subject across all sources — not siloed by publisher. Two-level category/subcategory hierarchy. |
| 🤖 **AI Nutrition Label** | Source-cited summaries with a human-readable transparency panel: model, temperature, coverage %, citations, compliance statement. |
| 📡 **3-layer AI disclosure** | JSON-LD (`schema.org/CreativeWork`), `X-AI-Provenance` HTTP header, and `<meta name="ai-provenance">` — EU AI Act Art. 50 compliant. |
| ⚡ **PPR + Cache Components** | Pre-rendered static shells served from CDN edge (TTFB < 50ms), dynamic content streamed into Suspense boundaries. Opt-in caching via `"use cache"`. |
| 🏗️ **CSS Subgrid feed** | Headline / Excerpt / Metadata rows align across cards without fixed heights or JavaScript measurement. |
| 🔄 **View Transitions** | Smooth topic-to-topic navigation via experimental `<PageTransition>` abstraction. Gracefully degrades on unsupported browsers. |
| 🔍 **BM25 Full-Text Search** | PostgreSQL-native FTS with GIN-indexed `tsvector` + `ts_rank_cd()` relevance ranking. No Elasticsearch cluster. `pg_trgm` for autocomplete. |
| 🔔 **AI-summarised push** | Web Push notifications with 1-sentence AI summaries, quiet hours, and AES-256-GCM key encryption. |
| 📊 **BullMQ ingestion pipeline** | Scheduled RSS polling, prioritised summarisation jobs, atomic DAG flows (`ingest → score → refresh-feed-slice`). |
| 🛡️ **Admin Interface** | Protected admin routes for source management (`/admin/sources`) and summary review (`/admin/summaries`). |
| 🌐 **Public REST API** | `/api/articles` — unified feed + search endpoint with CORS, cursor pagination, and `Cache-Control`. |
| 🏠 **10-Section Landing Page** | NewsTicker, Masthead, LeadStory, Feed, AI Nutrition Label, Stats, FAQ, Newsletter with "Editorial Dispatch" design system |
| 🎨 **Design System Tokens** | Custom Tailwind classes: `cat-label`, `btn-ember`, `pulse-dot`, `number-counter`. WCAG AAA accessibility, `prefers-reduced-motion` support. |
| 🌱 **Database Seeding** | `db:seed` script for sample articles, categories, and sources. Idempotent, safe to run multiple times. |

---

## Architecture

### Tech Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Web Framework** | Next.js | ≥16.0.7 (installed 16.2.9) | App Router, PPR, Cache Components, `proxy.ts`. Per MEP v5.1, ≥16.0.7 mitigates CVE-2025-55182. |
| **UI Runtime** | React | 19.2 (stable) | View Transitions, `<Activity>` for zero-shift summary loading |
| **Language** | TypeScript | 5.x (Strict) | Zero `any`. Type inference preferred. `noUncheckedIndexedAccess` + `erasableSyntaxOnly` + `verbatimModuleSyntax` enabled. |
| **Styling** | Tailwind CSS | v4 (4.3.0) | Utility-first with `@theme` tokens. CSS Subgrid for feed alignment. |
| **PostCSS** | `@tailwindcss/postcss` | 4.3.1 | Mandatory PostCSS plugin for Tailwind v4 utility class generation. |
| **Components** | Shadcn UI + Radix | Latest | Accessible primitives, wrapped for bespoke aesthetic. No custom rebuilds. |
| **ORM** | Drizzle ORM | 0.45+ | TypeScript-native, SQL-fluent, lazy proxy connection pattern. |
| **Validation** | Zod | 4.x (installed 4.4.3) | Schema-first, composable. Enforces AI output constraints. |
| **Auth** | Auth.js | 5.0.0-beta.31 | HttpOnly session cookies, Drizzle adapter. Pinned exact beta. Next-auth aligns with `@auth/drizzle-adapter` on `@auth/core@0.41.2`. |
| **Database** | PostgreSQL | 17 | Primary datastore. GIN FTS + `ts_rank_cd` BM25. |
| **Search** | `tsvector` + `ts_rank_cd` | Built-in | BM25 relevance ranking natively in Postgres. `pg_trgm` for autocomplete. |
| **Job Queue** | BullMQ | 5.78+ | Job graphs (Flows via `FlowProducer`), priorities, built-in monitoring dashboard. |
| **Queue Backend** | Redis (Upstash) | 7.x | AOF persistence, `noeviction`, `maxRetriesPerRequest: null`. |
| **Worker Runtime** | Node.js | 24 LTS ("Krypton") | BullMQ-native. LTS through April 2028. |
| **AI SDK** | Vercel AI SDK | `ai@6` + `@ai-sdk/anthropic@3` + `@ai-sdk/openai@3` | `generateObject()` with Zod schema validation. Anthropic primary, OpenAI fallback. |
| **AI (Primary)** | Claude 4.5 Haiku | `claude-haiku-4-5` | $1/$5 per M tokens. Best cost/quality for news summarisation. |
| **AI (Fallback)** | GPT-5 Mini | `gpt-5-mini` | Validated cost/quality fallback model. |
| **RSS Parsing** | `rss-parser` | 3.13+ | RSS 2.0 + Atom 1.0 parsing. JSON Feed parsed natively. |
| **Rate Limiting** | `ioredis` (fixed-window) | 5.11+ | Redis `INCR` + `EXPIRE` pattern. 20 req/s per IP on `/api/articles`. |
| **Bundler** | Turbopack | Next.js 16 default | 5–10× faster Fast Refresh. Stable since 16.0. |

### System Topology

```mermaid
flowchart TB
    subgraph Public["Public Internet"]
        Browser["Browser (React 19)"]
        Admin["Admin User"]
    end

    subgraph CDN["CDN Edge Layer"]
        PPR["PPR Static Shells<br/>TTFB < 50ms"]
    end

    subgraph WebApp["Next.js 16 Web App (Stateless)"]
        Proxy["proxy.ts<br/>Cookie check + redirect"]
        AppRouter["App Router<br/>RSC + PPR + Cache Components"]
        API["Route Handlers<br/>/api/articles (feed + search)"]
        AdminRoutes["Admin Routes<br/>(admin)/sources / (admin)/summaries"]
        AppLayer["Application Layer<br/>Server Actions · Feature Queries · Domain Services"]
        InfraLayer["Infrastructure Layer<br/>Drizzle ORM · Auth.js v5 · BullMQ Producer"]
    end

    subgraph Data["Data Layer"]
        PG["PostgreSQL 17<br/>articles · summaries · sources<br/>GIN FTS + ts_rank_cd BM25"]
        Redis["Redis (Upstash)<br/>BullMQ queues · Feed cache<br/>Session store · Rate limits"]
    end

    subgraph Worker["Worker Service (Node.js 24+)"]
        Scheduler["Job Scheduler<br/>upsertJobScheduler()"]
        Workers["Workers<br/>ingest (50) · summarize (5)<br/>score (20) · feed-slice (10)"]
        FlowProd["FlowProducer<br/>ingest → score → refresh"]
    end

    subgraph External["External Services"]
        RSS["RSS/Atom Sources (50–200+)"]
        Anthropic["Anthropic API"]
        OpenAI["OpenAI API"]
    end

    Browser --> CDN
    Admin --> CDN
    CDN -->|Cache miss| Proxy
    Proxy --> AppRouter
    AppRouter --> API
    AppRouter --> AdminRoutes
    API --> AppLayer
    AppRouter --> AppLayer
    AppLayer --> InfraLayer
    InfraLayer --> PG
    InfraLayer --> Redis
    Redis --> Worker
    Worker --> PG
    Worker --> Anthropic
    Worker --> OpenAI
    Scheduler --> Workers
    Workers --> FlowProd
    RSS --> Worker
```

### Request Flow (5-Layer Model)

Every request passes through exactly these layers. Deviating from this order creates security and consistency bugs.

| Layer | Component | Role | Rule |
| :--- | :--- | :--- | :--- |
| **0** | `proxy.ts` | Network boundary | Optimistic cookie check only. No DB calls. No business logic. Redirects only. |
| **1** | App Router | Route structure, metadata, PPR, Suspense | Layouts must not fetch data. Pages are the data-fetching boundary. |
| **2** | Feature Modules | UI composition, data binding, mutations | All data access through `queries.ts`. No direct DB calls. |
| **3** | Domain Services | Pure business logic | No Next.js imports. No DB client imports. Pure TypeScript. |
| **4** | Infrastructure | Side-effecting operations | All DB access via Drizzle. All queries parameterized. |

---

## File Hierarchy

```
onestopnews/
├── 📄 proxy.ts                  ← Network boundary (Layer 0): cookie check + redirect only
├── 📄 next.config.ts            ← Cache Components, cacheLife profiles, Turbopack, output: "standalone", experimental flags
├── 📄 drizzle.config.ts         ← Drizzle kit: schema path, migration output
├── 📄 tsconfig.json             ← strict, noUncheckedIndexedAccess, verbatimModuleSyntax, erasableSyntaxOnly
├── 📄 vitest.config.ts          ← Vitest config (excludes e2e/, playwright.config.ts)
├── 📄 eslint.config.mjs         ← ESLint flat config (excludes e2e/, playwright.config.ts)
├── 📄 playwright.config.ts      ← Playwright E2E config (Chromium/Firefox/WebKit, auto-start dev server)
│
├── 📂 app/                      ← Next.js App Router (Layer 1)
│   ├── 📄 layout.tsx            ← Root layout: Newsreader + Instrument Sans + Commit Mono fonts, RevealProvider
│   ├── 📄 globals.css           ← Tailwind v4 @theme tokens, .font-editorial, .cat-label, .btn-ember, .reveal
│   ├── 📂 (public)/             ← Unauthenticated public routes
│   │   ├── 📄 page.tsx          ← / — 10-section landing page (Phase 10): NewsTicker, Masthead, Header, LeadStory,
│   │   │                          Feed (Suspense + FeedData), NutritionLabelDemo, StatsSection, Accordion, NewsletterCTA, Footer
│   │   └── 📂 search/           ← /search — Full-text search (Phase 6): page.tsx + SearchPageClient.tsx
│   ├── 📂 topics/[category]/    ← /topics/:category — PPR + Cache Component (NOT inside (public) route group)
│   ├── 📂 article/[id]/         ← /article/:id — Fully dynamic, generateMetadata emits 3-layer provenance (Phase 14)
│   ├── 📂 sign-in/              ← /sign-in — Sign-in page (Phase 15): page.tsx (Server) + SignInClient.tsx (Client)
│   ├── 📂 auth-error/           ← /auth-error — Auth error landing (Phase 15, referenced in pages.error)
│   ├── 📂 (admin)/              ← Protected admin routes
│   │   ├── 📄 layout.tsx        ← Admin layout: verifies session via verifyAdminSession()
│   │   ├── 📂 sources/          ← /admin/sources — Source management (Phase 6): page.tsx + actions.ts
│   │   └── 📂 summaries/        ← /admin/summaries — Summary review (Phase 6)
│   └── 📂 api/                  ← Route Handlers: public HTTP API
│       ├── 📂 articles/         ← GET /api/articles (feed + search, Phase 6; rate limited + cursor validation Phase 13; TRUSTED_PROXY Phase 14)
│       ├── 📂 categories/       ← GET /api/categories (Phase 13)
│       ├── 📂 health/           ← GET /api/health — DB + Redis health check
│       ├── 📂 push/subscribe/   ← POST /api/push/subscribe (Phase 7; encryptedKeys column Phase 14)
│       ├── 📂 summarize/[id]/   ← POST /api/summarize/:id (enqueue only, content guard)
│       ├── 📂 admin/            ← GET /api/admin — stub endpoint (Phase 4)
│       └── 📂 auth/[[...nextauth]]/ ← Auth.js v5 catch-all route (GET + POST handlers)
│
├── 📂 features/                 ← Feature modules (Layer 2)
│   ├── 📂 feed/
│   │   ├── 📂 components/       ← ArticleCard, FeedGrid, FeedData, FeedSkeleton, LeadStory,
│   │   │                          FeedContainer (Phase 15), LoadMoreButton (Phase 15)
│   │   └── 📄 queries.ts        ← getFeedArticles() with cursor pagination, "use cache" + cacheLife('feed')
│   ├── 📂 articles/             ← Article detail feature (Phase 14)
│   │   ├── 📂 components/       ← ArticleData.tsx, ArticleSkeleton.tsx
│   │   └── 📄 queries.ts        ← getArticleWithSummary() — 4-way JOIN
│   ├── 📂 summaries/
│   │   ├── 📂 components/       ← NutritionLabel, NutritionLabelDemo, SummaryPanel, DisclosureBadge,
│   │   │                          SummariesData, SummariesSkeleton
│   │   ├── 📂 lib/              ← summariseSchema.ts (Zod schema for AI output)
│   │   ├── 📄 actions.ts        ← Server Action: requestSummary
│   │   └── 📄 queries.ts        ← Summary queries
│   ├── 📂 search/               ← (Phase 6)
│   │   ├── 📂 components/       ← SearchBar (client), SearchResults, SearchData, SearchSkeleton
│   │   ├── 📄 queries.ts        ← FTS query builder (tsvector + ts_rank_cd BM25)
│   │   ├── 📄 actions.ts        ← Server Actions
│   │   └── 📄 types.ts          ← SearchResult, SearchPage, SearchParams
│   └── 📂 sources/              ← Admin source management
│       └── 📂 components/       ← SourcesData, SourcesSkeleton
│
├── 📂 domain/                   ← Pure domain logic (Layer 3 — no Next.js / DB imports)
│   ├── 📂 articles/
│   │   ├── 📄 normalize.ts      ← normalizeCanonicalUrl, hashContent(title, body, publishedAt) SHA-256
│   │   └── 📄 types.ts          ← Article, Source, Category, Summary, ArticleWithSource, ArticleWithSummary, FeedPage
│   └── 📂 ranking/
│       └── 📄 score.ts          ← calculateImportanceScore() returns float 0.0–1.0
│
├── 📂 lib/                      ← Infrastructure integrations (Layer 4)
│   ├── 📂 db/
│   │   ├── 📄 index.ts          ← Lazy Proxy DB client (defers connection to first query)
│   │   ├── 📄 auth.ts           ← Eager Drizzle instance for Auth.js DrizzleAdapter
│   │   ├── 📄 schema.ts         ← Drizzle schema: 11 tables (8 business + 3 Auth.js adapter), 4 enums
│   │   └── 📄 seed.ts           ← Idempotent seed script (Phase 10): 7 categories, 7 sources, 30 articles
│   ├── 📂 queue/
│   │   ├── 📄 index.ts          ← BullMQ Queue instances + split Worker/Queue connection configs (4 queues)
│   │   └── 📄 flows.ts          ← FlowProducer atomic DAG: ingest → score → refresh-feed-slice (Phase 13)
│   ├── 📂 ai/
│   │   ├── 📄 prompts.ts        ← Prompt templates with Zod response schemas
│   │   └── 📄 provenance.ts     ← 3-layer AI provenance generator (JSON-LD + HTTP header + meta)
│   ├── 📂 auth/
│   │   ├── 📄 index.ts          ← Auth.js v5 NextAuth() config (DrizzleAdapter, JWT strategy, callbacks)
│   │   ├── 📄 dal.ts            ← Data Access Layer: verifySession(), verifyAdminSession() (cache()-memoized)
│   │   └── 📄 providers.ts      ← buildProviders() — conditional Credentials + Google + GitHub (Phase 15)
│   ├── 📂 env/
│   │   └── 📄 index.ts          ← Zod-validated env vars (fails fast at module load); OAuth vars optional
│   ├── 📂 security/
│   │   └── 📄 encrypt.ts        ← AES-256-GCM push key encryption (Phase 7)
│   └── 📄 rateLimit.ts          ← Redis fixed-window rate limiter (Phase 13, singleton publisher)
│
├── 📂 workers/                  ← Worker service (separate Node.js process, runs via `pnpm worker`)
│   ├── 📄 index.ts              ← 4 BullMQ workers (ingest=50, summarize=5, score=20, feedSlice=10) + graceful shutdown
│   ├── 📂 jobs/
│   │   ├── 📄 parseFeed.ts      ← RSS/Atom/JSON Feed parser via rss-parser (Phase 13)
│   │   ├── 📄 summarize.ts      ← AI summarization via Vercel AI SDK (Anthropic + OpenAI fallback) (Phase 13)
│   │   ├── 📄 summarizeFailure.ts ← getSummaryFailureState() — needs_review after 3 retries (Phase 14)
│   │   ├── 📄 determineContentAvailability.ts ← Content availability guard (Phase 7)
│   │   └── 📄 scheduler.ts      ← Idempotent job scheduler via upsertJobScheduler()
│   ├── 📂 push/
│   │   └── 📄 isWithinQuietHours.ts ← DST-safe quiet hours via luxon (Phase 7)
│   ├── 📂 lib/
│   │   └── 📄 cacheInvalidation.ts ← Redis pub/sub cache invalidation (singleton publisher, Phase 13)
│   └── 📄 pipeline.integration.test.ts ← 8 integration tests (parseFeed → score → hashContent) (Phase 14)
│
├── 📂 shared/                   ← Shared UI primitives (Layer 2 — cross-feature)
│   ├── 📂 components/
│   │   ├── 📂 layout/           ← Header, Footer, Masthead, NewsTicker
│   │   ├── 📂 ui/               ← Button (cva+Radix Slot), Badge, Skeleton, StatsSection, Accordion, NewsletterCTA
│   │   └── 📂 providers/        ← RevealProvider (IntersectionObserver scroll-reveal)
│   ├── 📂 hooks/                ← useDebounce, useReducedMotion
│   └── 📂 lib/
│       └── 📄 utils.ts          ← cn() (clsx + tailwind-merge), formatTimeAgo, formatDate, truncate
│
├── 📂 components/
│   └── 📂 primitives/
│       └── 📄 PageTransition.tsx ← View Transitions abstraction (progressive enhancement)
│
├── 📂 drizzle/                  ← Drizzle migrations (additive only — never `push` in production)
│   ├── 📄 0000_purple_blue_marvel.sql  ← Initial schema
│   ├── 📄 0001_panoramic_makkari.sql
│   ├── 📄 0002_flippant_screwball.sql
│   ├── 📄 0003_strong_mac_gargan.sql   ← articles.body + users.email_verified + users.image (Phase 13)
│   ├── 📄 0004_smiling_newton_destine.sql ← push_subscriptions.encrypted_keys + DROP NOT NULL keys (Phase 14)
│   ├── 📄 0005_neat_wolverine.sql      ← DROP COLUMN keys (Phase 15)
│   ├── 📄 custom-indexes.sql           ← GIN FTS + pg_trgm + performance indexes
│   └── 📂 meta/                        ← Drizzle migration journal + snapshots
│
├── 📂 e2e/                      ← Playwright E2E tests (excluded from vitest/eslint/tsc)
│   └── 📄 smoke.spec.ts         ← 10 E2E smoke tests (Phase 14)
│
├── 📂 public/fonts/             ← Self-hosted Commit Mono woff2 (extracted from @fontsource/commit-mono)
│
├── 📂 scripts/                  ← Operational scripts
│   ├── 📄 init-extensions.sql   ← CREATE EXTENSION uuid-ossp, pg_trgm
│   ├── 📄 migrate.ts            ← Migration runner
│   ├── 📄 dev-setup.sh          ← Development environment setup
│   └── 📄 deploy.sh             ← Tagged release deployment script
│
├── 📂 .github/workflows/        ← CI/CD pipelines
│   ├── 📄 ci.yml                ← Lint + tsc + vitest + build (Node 24, all 15 env vars)
│   └── 📄 e2e.yml               ← Playwright E2E on Chromium/Firefox/WebKit
│
├── 📄 Dockerfile.web            ← Production web image (node:24-alpine, output: "standalone") (Phase 15)
├── 📄 Dockerfile.worker         ← Production worker image (node:24-alpine, tsx src/workers/index.ts) (Phase 15)
├── 📄 Dockerfile.dev            ← Dev web image (node:24-alpine, pnpm dev --turbo)
├── 📄 Dockerfile.worker.dev     ← Dev worker image (node:24-alpine, tsx watch)
├── 📄 docker-compose.prod.yml   ← Production: web + worker + PostgreSQL 17 + Redis 7
├── 📄 docker-compose-dev.yml    ← Development compose
├── 📄 lighthouserc.js           ← Lighthouse CI budgets (Perf ≥90, A11y ≥95)
├── 📄 .env.example              ← All env vars with comments (incl. optional OAuth)
└── 📄 .dockerignore             ← Excludes node_modules, .git, .env*
```

**Note on route group placement:** `/topics/[category]` and `/article/[id]` live at the top level of `app/`, NOT inside the `(public)` route group. The `(public)` group only contains the home page and `/search`.

---

## Design System — "Editorial Dispatch"

The visual identity is not a skin or an afterthought — it is architectural. Every engineering decision points toward these tokens. **Explicit rejections: Inter, Roboto, Space Grotesk.**

### Typography

| Role | Typeface | Weight | Fallback |
| :--- | :--- | :--- | :--- |
| **Headlines** | Newsreader (variable) | 800 (display) | Georgia, serif |
| **UI / Body** | Instrument Sans (variable) | 400–600 | system-ui, sans-serif |
| **Metadata** | Commit Mono | 400 | Fira Code, monospace |

### Colour Tokens

| Token | Hex | Usage |
| :--- | :--- | :--- |
| `--color-ink-900` | `#1a1a18` | Letterpress black — headings |
| `--color-ink-600` | `#3d3d3a` | Body text — WCAG AAA on `paper-50` |
| `--color-ink-300` | `#8a8a83` | Muted / metadata — use sparingly |
| `--color-ink-100` | `#e8e8e4` | Dividers / borders |
| `--color-paper-50` | `#fafaf8` | Newsprint off-white — page background |
| `--color-paper-100` | `#f2f2ee` | Card surface |
| `--color-dispatch-ember` | `#c7513f` | Breaking news — coral-red accent |
| `--color-dispatch-sage` | `#6b8f71` | Finance / positive accent |
| `--color-dispatch-slate` | `#5a6b7a` | Tech / neutral accent |
| `--color-dispatch-clay` | `#8b6d5a` | Local / politics accent |
| `--color-dispatch-violet` | `#7a6b8f` | Culture / creative accent |

### CSS Subgrid Feed Architecture

The feed grid uses `grid-rows-subgrid` to force Headline, Excerpt, and Metadata rows to align across every card in a visual row — no fixed heights, no JavaScript measurement. Parent defines columns with `gap-x` only; each `ArticleCard` spans 3 row tracks via `row-span-3`.

### Custom Utility Classes

| Class | Definition | Usage |
| :--- | :--- | :--- |
| `.cat-label` | `@apply uppercase tracking-widest font-mono text-[10px] text-center;` | Category labels, metadata tags |
| `.cat-label-wide` | `@apply uppercase tracking-widest font-mono text-[10px] text-center px-4 py-1.5;` | Wide category labels with padding |
| `.btn-ember` | `@apply bg-dispatch-ember text-white transition-all duration-200;` | Primary CTA buttons |
| `.pulse-dot` | `@apply w-1.5 h-1.5 rounded-full bg-dispatch-ember animate-pulse;` | Live indicator badges |
| `.number-counter` | `@apply font-editorial text-6xl font-bold text-ink-900 transition-all duration-1000;` | Animated stat counters |

### Custom Animation Tokens

| Animation | Keyframes | Usage |
| :--- | :--- | :--- |
| `ticker-scroll` | `translateX(0) → translateX(-100%)` | NewsTicker marquee |
| `pulse-dot` | `scale(1) → scale(1.2) → scale(1)` | Live status indicators |
| `number-count` | `opacity: 0 → 1, transform: translateY(20px) → 0` | Stat counter entrance |

**Accessibility**: All animations respect `prefers-reduced-motion: reduce`. Use `motion-safe:` and `motion-reduce:` Tailwind variants.

---

## Quick Start

### Prerequisites

- **Node.js** ≥24 LTS ("Krypton")
- **PostgreSQL** ≥17
- **Redis** ≥7.x (or Upstash managed instance)
- **pnpm** ≥9.x (recommended package manager)

### 1. Clone and install

```bash
git clone https://github.com/your-org/onestopnews-web.git
cd onestopnews-web
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` — see [Environment Variables](#environment-variables) for required values.

### 3. Set up the database

```bash
# Generate migration files from Drizzle schema
pnpm drizzle-kit generate

# Apply migrations
pnpm drizzle-kit migrate

# Seed with sample data (articles, categories, sources)
pnpm db:seed

# Verify seed data
pnpm db:seed --dry-run  # Show what would be inserted without writing
```

**Note on `db:seed`**: The seed script is idempotent — safe to run multiple times. It checks for existing data before inserting. Useful for development environments.

### 4. Enable PostgreSQL extensions

```bash
# Connect to your PostgreSQL instance and run:
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- For fuzzy search suggestions
-- pg_textsearch is NOT required in PG 17 (ts_rank_cd is built-in)
```

### 5. Start development servers

```bash
# Terminal 1 — Next.js dev server (Turbopack)
pnpm dev

# Terminal 2 — Worker service (BullMQ consumers + RSS ingestion + AI summarization)
pnpm worker
```

### 6. Verify setup

| Check | Expected |
| :--- | :--- |
| `curl http://localhost:3000` | HTML response with PPR shell |
| `curl http://localhost:3000/api/articles?category=tech` | JSON array of articles with `source` objects |
| `curl "http://localhost:3000/api/articles?q=AI+regulation"` | JSON array of search results with `rank` |
| `curl http://localhost:3000/api/categories` | JSON `{ categories: [...] }` with id/slug/name per category |
| `curl http://localhost:3000/api/health` | `{ status: "ok", deps: { db: "connected", redis: "connected" } }` |
| `curl -H "x-forwarded-for: 1.2.3.4" "http://localhost:3000/api/articles?cursor=invalid"` | `400` with `{ error: "Invalid cursor format..." }` |
| BullMQ dashboard at `http://localhost:3001` | Active queues: `ingest`, `summarize`, `score`, `feed-slice` |
| `pnpm tsc --noEmit` | Zero type errors |
| `pnpm test` | All 279 tests pass across 49 suites |

---

## Environment Variables

All variables are validated by Zod at module load time (`src/lib/env/index.ts`). The app fails fast with a descriptive error if any required variable is missing or invalid.

```bash
# ── Database ──────────────────────────────────────────────
DATABASE_URL=postgresql://user:pass@localhost:5432/onestopnews
# Must start with postgres:// or postgresql://
# For serverless (Vercel/Lambda), use PgBouncer/Supavisor pooler URL

# ── Redis ─────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379
# Must start with redis://

# ── Authentication (Auth.js v5) ───────────────────────────
AUTH_SECRET=  # Generate with: openssl rand -base64 33 (min 32 chars)
AUTH_URL=http://localhost:3000  # Production: your canonical URL

# ── AI Models ─────────────────────────────────────────────
ANTHROPIC_API_KEY=             # Must start with sk-ant- (Claude 4.5 Haiku, primary)
OPENAI_API_KEY=                # Must start with sk- (GPT-5 Mini, fallback)

# ── Web Push (VAPID) ──────────────────────────────────────
# Generate with: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@onestopnews.com

# ── Push Key Encryption ───────────────────────────────────
# 32-byte hex string (64 chars). Generate with: openssl rand -hex 32
PUSH_KEY_ENCRYPTION_KEY=

# ── Node Environment ──────────────────────────────────────
NODE_ENV=development  # development | production | test

# ── Rate Limiting (Optional) ─────────────────────────────
# Set to "true" when behind a trusted reverse proxy / CDN (Cloudflare, Nginx).
# When true, the rate limiter uses the rightmost IP from x-forwarded-for
# (the proxy's view of the client), preventing spoofing.
# When unset (default), uses the leftmost IP (client-supplied, spoofable).
TRUSTED_PROXY=  # "true" | unset

# ── OAuth Providers (Optional) ───────────────────────────
# Leave blank to use Credentials-only auth (backward compatible).
# When both CLIENT_ID and CLIENT_SECRET for a provider are set, that
# provider is enabled on the /sign-in page.
#
# Google OAuth: https://console.cloud.google.com/apis/credentials
# Authorized redirect URI: ${AUTH_URL}/api/auth/callback/google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# GitHub OAuth: https://github.com/settings/developers
# Authorization callback URL: ${AUTH_URL}/api/auth/callback/github
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# ── Observability (Optional) ──────────────────────────────
SENTRY_DSN=
AXIOM_TOKEN=
```

**CI Note:** All required env vars must be set even for `pnpm lint` and `pnpm test`, because `src/lib/env/index.ts` validates at module load time. See `.github/workflows/ci.yml` for CI-safe dummy values.

---

## API Reference

| Endpoint | Method | Auth | Description |
| :--- | :--- | :--- | :--- |
| `/api/articles` | `GET` | Public (rate limited) | Feed articles with cursor pagination. Query: `?category=tech&cursor=2026-06-10T12:00:00Z&limit=31` |
| `/api/articles` | `GET` | Public (rate limited) | Full-text search. Query: `?q=AI+regulation&category=tech` |
| `/api/categories` | `GET` | Public | All categories (id, slug, name). Cached 5min at CDN. (Phase 13) |
| `/api/health` | `GET` | Public | DB + Redis health check. Returns `200 { status: "ok" }` or `503 { status: "degraded" }`. |
| `/api/summarize/[id]` | `POST` | Session | Enqueue summarisation job for article `id`. Returns `202` with job ID. Content availability guard enforced. |
| `/api/push/subscribe` | `POST` | Session | Web Push subscription. Encrypts p256dh/auth keys with AES-256-GCM before storage (Phase 14: stored in `encryptedKeys` column). |
| `/article/[id]` | `GET` | Public | Article detail page. Emits 3-layer AI provenance via `generateMetadata()` when summary exists. (Phase 14) |
| `/admin/sources` | `GET/POST` | Admin | Source management dashboard + CRUD. |
| `/admin/summaries` | `GET` | Admin | Summary review queue for flagged content (incl. AI-failed summaries after Phase 14). |
| `/sign-in` | `GET` | Public | Sign-in page with Credentials form + conditional Google/GitHub OAuth buttons (Phase 15). |
| `/auth-error` | `GET` | Public | Auth error landing page (referenced by Auth.js `pages.error`). |

**Rate Limiting (Phase 13+14):** `GET /api/articles` is rate-limited to 20 requests/second per IP via Redis fixed-window counter (`src/lib/rateLimit.ts`). Exceeding the limit returns `429 Too Many Requests` with `Retry-After` and `X-RateLimit-Remaining` headers. Set `TRUSTED_PROXY=true` when behind a CDN to use the rightmost IP from `x-forwarded-for` (prevents spoofing).

**Cursor Validation (Phase 13):** The `cursor` query parameter must be a valid ISO 8601 date string (e.g., `2026-06-10T12:00:00Z`). Invalid cursors return `400 Bad Request` with `{ error: "Invalid cursor format..." }`.

**Public API Response Shape:**
```json
{
  "articles": [...],
  "nextCursor": "2026-06-10T12:00:00Z",
  "hasNextPage": true
}
```

**Headers on success:**
- `Cache-Control: public, max-age=60, stale-while-revalidate=300`
- `X-RateLimit-Remaining: <count>`
- CORS headers (`Access-Control-Allow-Origin: *`)

---

## Testing

```bash
# Run all tests
pnpm test

# Run tests for a specific package
pnpm test --filter=feed

# Run with coverage (target: 80% lines)
pnpm test:coverage

# Type-check without emitting
pnpm tsc --noEmit

# Lint
pnpm lint
```

**Test prerequisites:** PostgreSQL and Redis must be running. Tests use isolated schemas that are created and torn down per suite.

---

## CI/CD & Deployment

### GitHub Actions

Two workflows run on every push/PR to `main`:

| Workflow | Trigger | Jobs |
| :--- | :--- | :--- |
| `ci.yml` | push, pull_request | TypeScript check, lint, unit tests, build |
| `e2e.yml` | push, pull_request | Playwright tests on Chromium, Firefox, WebKit |

### Docker

Multi-stage production builds:

```bash
# Build production images
docker build -f Dockerfile.web -t onestopnews-web .
docker build -f Dockerfile.worker -t onestopnews-worker .

# Start full stack
docker compose -f docker-compose.prod.yml up -d
```

### Lighthouse CI

```bash
# Run Lighthouse CI against production build
npx lhci autorun
```

Budgets: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 90, SEO ≥ 90.

---

## Known Issues & Troubleshooting

### Next.js 16 `blocking-route` Error

**Symptom**: Console shows: "Uncached data or `connection()` was accessed outside of `<Suspense>`. This delays the entire page from rendering."

**Cause**: In Next.js 16 with `cacheComponents: true`, database queries must be wrapped in `<Suspense>` with a fallback UI. Directly awaiting data in the page component body blocks rendering.

**Fix**: Extract data fetching to a separate Server Component and wrap it in `<Suspense>`:

```tsx
// page.tsx
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
```

**Prevention**: Always use the `<Suspense>` + Server Component pattern for database queries in Next.js 16.

### Masthead / Date Hydration Mismatch

**Symptom**: Console error: "Text content does not match server-rendered HTML" or "Hydration failed because the initial UI does not match".

**Cause**: `new Date().toLocaleDateString()` renders differently on server (Node.js locale) vs client (browser locale). Timezone differences compound the issue.

**Fix**: Use a Client Component for dynamic dates:

```tsx
"use client";
export function LiveDate() {
  const [date, setDate] = useState("");
  useEffect(() => {
    setDate(new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }));
  }, []);
  return <span>{date}</span>;
}
```

**Prevention**: Always wrap client-dependent rendering (`Date`, `window`, `navigator`) in `'use client'` components or pass pre-computed strings as props from Server Components.

### `next-prerender-current-time` Error

**Symptom**: Build error during static prerendering: `next-prerender-current-time`. The build fails or hangs when Next.js 16 with `cacheComponents: true` encounters `new Date()` in a component tree.

**Cause**: `new Date()` or `Date.now()` is called in a Server Component or a Client Component that lacks a `<Suspense>` boundary. Next.js 16's prerender phase cannot resolve dynamic time values and throws this error instead of producing stale or mismatched timestamps.

**Fix**: Three steps, applied in order:

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

2. Wrap the Client Component in `<Suspense>` in the parent Server Component:

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

3. For utility functions like `formatTimeAgo()` that call `new Date()`, ensure they are only invoked from Client Components — never from Server Components.

**Prevention**: Never use `new Date()`, `Date.now()`, or any time-dependent utility in a Server Component. All time-logic must reside in `'use client'` components wrapped in `<Suspense>`. Pre-computed date strings passed as props from Server Components are safe.

### CSS Merge Artifacts in Tailwind v4 `@theme`

**Symptom**: Custom design tokens silently break — colors resolve to `undefined` or fall back to defaults. The entire Tailwind v4 `@theme` block becomes invalid. No build error is thrown; the visual regression is the only signal.

**Cause**: A git merge conflict injects stray text into a CSS custom property declaration inside the `@theme` block. For example:

```css
/* ❌ Broken by merge artifact */
--color-ink-600: #3d3 INCLUDED-500: #525250;

/* ✅ Correct */
--color-ink-600: #3d3d3a;
--color-ink-500: #525250;
```

Tailwind v4's `@theme` is a regular CSS block — merge artifacts corrupt the CSS parser silently.

**Fix**: Review CSS diffs after every merge that touches `globals.css` or any file containing `@theme`. Run `pnpm build` before pushing to catch parsing errors early. Inspect the `@theme` block line by line for stray characters, duplicated lines, or merged property names.

**Prevention**: Add `pnpm build` to CI as a quality gate. Treat CSS `@theme` blocks with the same caution as JSON or YAML — a single stray character can invalidate the entire block without a compile-time error.

### External Image Loading Failure

**Symptom**: Next.js `<Image>` component fails with "hostname is not configured under images in your next.config.ts".

**Cause**: Next.js Image Optimization requires all external domains to be whitelisted in `next.config.ts` for security.

**Fix**: Add external domains to `next.config.ts`:

```typescript
// next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};
```

**Prevention**: Whenever adding external image URLs to components, immediately update `next.config.ts`.

### Saved HTML Snapshots Becoming Stale

**Symptom**: Comparing a saved `dynamic_landing_page.html` with the current live site shows major differences (missing sections, old CSS, wrong structure).

**Cause**: Static HTML snapshots are captured at a point in time. During active development, components, layouts, and styles change continuously.

**Fix**: Always verify against the live server:

```bash
# Capture current state
curl http://localhost:3000 > current_page.html

# Compare
diff current_page.html saved_page.html
```

**Prevention**: Label saved snapshots with timestamps. Use live `curl` or browser verification during active development. Do not rely on saved HTML for regression testing.

### Tailwind v4 Utility Classes Not Generating (Zero Utilities)

**Symptom**: Build succeeds but no Tailwind utility classes appear in the compiled CSS. Custom tokens (`bg-ink-900`, `text-paper-50`, `bg-dispatch-ember`) resolve to `undefined` or fallback values. Compiled CSS is ~16KB instead of hundreds of KB. The `@theme` custom properties render but no class selectors are generated.

**Cause**: Tailwind CSS v4 requires `@tailwindcss/postcss` as a PostCSS plugin to generate utility classes from template class usage. Without `postcss.config.mjs`, the `@import "tailwindcss"` directive is treated as a plain CSS import — the `@theme` block renders as custom properties but the class-scanning engine never runs.

**Fix**:

```bash
# 1. Install the PostCSS plugin
pnpm add -D @tailwindcss/postcss@4.3.1

# 2. Create PostCSS config
echo 'export default { plugins: { "@tailwindcss/postcss": {} } }' > postcss.config.mjs

# 3. Clear stale Next.js cache (critical — old cache masks the fix)
rm -rf .next/

# 4. Restart dev server
pnpm dev
```

**Prevention**: If utility classes are missing after a Tailwind v4 setup or upgrade, check for `postcss.config.*` first. The absence of this file produces **no build error** — it silently kills all utility class generation. After any PostCSS/Tailwind/Next.js config change, always clear `.next/`.

### Commit Mono Font Not Loading

**Symptom**: The `font-mono` CSS variable resolves to the fallback stack (Fira Code, monospace) instead of Commit Mono. Network tab shows no request for the Commit Mono woff2 file.

**Cause**: Commit Mono is a fontsmith typeface not available on Google Fonts. `next/font/google` cannot load it.

**Fix**: Use `next/font/local` with a woff2 file:

```tsx
import localFont from "next/font/local";

const commitMono = localFont({
  src: "../../public/fonts/commit-mono-400.woff2",
  variable: "--font-mono",
  weight: "400",
  style: "normal",
  display: "swap",
});
```

Extract the woff2 from `@fontsource/commit-mono`:

```bash
pnpm add -D @fontsource/commit-mono@5.2.5
cp node_modules/@fontsource/commit-mono/files/commit-mono-400-normal.woff2 public/fonts/commit-mono-400.woff2
```

**Prevention**: For fonts not on Google Fonts, use `next/font/local` with woff2 files. Never add `@font-face` declarations manually in `globals.css` — `next/font` handles font optimization, preloading, and layout-shift prevention.

### RSS Feed Parsing Returns Empty Array (Phase 13)

**Symptom**: The ingest worker fetches a feed successfully (HTTP 200) but `parseFeed` returns `[]` — no articles are ingested.

**Cause 1**: The feed XML is malformed. `parseFeed` catches XML parse errors and returns `[]` rather than throwing (to avoid crashing the worker). Check the worker logs for `[parseFeed] XML parse failed:` warnings.

**Cause 2**: All items in the feed lack a `<title>` element. `parseFeed` filters out items without titles (required field).

**Cause 3**: The feed format detection failed. `parseFeed` detects Atom feeds by checking for `<feed` in the raw XML; if the XML has unusual whitespace or encoding, detection may fail and the feed is treated as RSS.

**Fix**: Validate the feed URL with `curl -s <feed-url> | head -20` to inspect the raw XML. Test parsing in isolation:
```bash
npx tsx -e "import { parseFeed } from './src/workers/jobs/parseFeed'; fetch('<feed-url>').then(r => r.text()).then(t => parseFeed(t, 'rss').then(items => console.log(items.length, 'items')))";
```

**Prevention**: The `parseFeed.test.ts` suite has 13 tests covering RSS 2.0, Atom, JSON Feed, and edge cases. Run `pnpm test -- parseFeed` after any parser change.

### AI Summarization Returns Placeholder Data (Phase 13)

**Symptom**: Summaries are being generated but contain `"Summary placeholder"` or `["Point 1", "Point 2"]` text.

**Cause**: The `callAISummary` function in `src/workers/jobs/summarize.ts` is being shadowed by an older stub. This can happen if you have uncommitted changes or are on a branch predating Phase 13.

**Fix**: Verify the worker is using the real implementation:
```bash
grep -n "Summary placeholder" src/workers/
# Should return NO matches. If it matches, the stub is still present.
```

**Prevention**: The `summarize.test.ts` suite (8 tests) mocks the AI SDK and verifies `generateObject` is called. If the stub is present, these tests will fail because the stub doesn't call `generateObject`.

### Rate Limit Returns 429 Unexpectedly (Phase 13)

**Symptom**: Legitimate clients receive `429 Too Many Requests` from `/api/articles` despite low traffic.

**Cause 1**: Multiple clients behind the same NAT/proxy share an IP. The fixed-window counter is per-IP, so 20 req/s is shared across all clients behind that IP.

**Cause 2**: The Redis key `ratelimit:api:articles:<ip>` has a stale TTL. This shouldn't happen (TTL is set on first INCR), but a Redis restart mid-window could leave a key without expiry.

**Fix**: Check the current count and TTL in Redis:
```bash
redis-cli get ratelimit:api:articles:1.2.3.4
redis-cli ttl ratelimit:api:articles:1.2.3.4
```
If the count is stuck high with a long TTL, delete the key: `redis-cli del ratelimit:api:articles:1.2.3.4`.

**Prevention**: The rate limiter uses a 1-second window, so counts reset quickly. For production behind a CDN, consider using a signed CDN IP header instead of `x-forwarded-for`.

### `hashContent` Returns 8-Character Hash (Phase 13)

**Symptom**: The `articles.content_hash` column contains 8-character hex strings instead of 64-character SHA-256 hashes.

**Cause**: The old FNV-1a implementation is still present. Phase 13 migrated `hashContent` to SHA-256, but if you're on a branch predating Phase 13, the old implementation returns 8-char hashes.

**Fix**: Verify the implementation:
```bash
grep -n "createHash\|FNV\|2166136261" src/domain/articles/normalize.ts
# Should show createHash("sha256"). If it shows 2166136261 (FNV-1a seed), the old impl is present.
```

**Prevention**: The `normalize.test.ts` suite has a test asserting `hash` matches `/^[0-9a-f]{64}$/` and a deterministic SHA-256 vector test. These fail if the old FNV-1a implementation is restored.

### FlowProducer Not Enqueuing Scoring Jobs (Phase 13)

**Symptom**: New articles are ingested (visible in `articles` table) but never get scored (importance_score stays at default 0.5).

**Cause**: The `enqueuePostIngestFlow` function in `src/lib/queue/flows.ts` may be failing silently, OR the ingest worker is using the old per-article `scoreQueue.add()` pattern instead of the atomic flow.

**Fix**: Verify the ingest worker calls `enqueuePostIngestFlow`:
```bash
grep -n "enqueuePostIngestFlow\|scoreQueue.add" src/workers/index.ts
# Should show enqueuePostIngestFlow. If it shows scoreQueue.add, the old pattern is present.
```

Check BullMQ dashboard for the `score` queue — if jobs are appearing there but not completing, the score worker may be crashing. Check worker logs for `[Score] Failed:` errors.

**Prevention**: The `flows.test.ts` suite (6 tests) verifies the DAG structure. The atomic guarantee (parent runs only after all children) is a BullMQ FlowProducer feature — no application-level test needed.

### CI Fails with "Environment variable validation failed" (Phase 13)

**Symptom**: GitHub Actions CI fails at the `pnpm install` or `pnpm lint` step with an error listing missing environment variables.

**Cause**: `src/lib/env/index.ts` validates all required env vars at module load time. Even linting imports modules that import `@/lib/env`, so missing env vars break ALL CI steps — not just runtime ones.

**Fix**: Ensure all required env vars are set in `.github/workflows/ci.yml` `env:` block. Phase 13 added all 11 required vars with CI-safe dummy values. If you added a new required env var to `src/lib/env/index.ts`, you MUST also add it to `ci.yml`.

**Prevention**: The `src/test/setup.ts` file sets all required env vars for local test runs. If you add a new env var, update both `src/test/setup.ts` AND `.github/workflows/ci.yml`.

## Security & Compliance

| Concern | Posture |
| :--- | :--- |
| **Next.js version** | Pinned to ≥16.0.7 (installed 16.2.9). Per MEP v5.1, ≥16.0.7 mitigates CVE-2025-55182 (React2Shell RCE) and the 13-advisory DoS/SSRF bundle. (Earlier docs cited ≥16.2.6; MEP v5.1 corrected this — 16.0.7 is the actual security patch.) |
| **AI Disclosure** | 3-layer machine-readable: JSON-LD + HTTP header + HTML meta. C2PA explicitly rejected (no text standard exists). EU AI Act Art. 50 compliant. |
| **Authentication** | Auth.js v5 with HttpOnly session cookies. No JWT tokens in localStorage. |
| **Network boundary** | `proxy.ts` provides optimistic UX redirects. Real auth enforcement in `(admin)/layout.tsx`. |
| **Content availability guard** | `contentAvailabilityEnum` prevents AI summarisation of `title_only` or `excerpt` articles — eliminating fabrication risk. Enforced at both Server Action and API Route layers. |
| **Rate limiting** | `GET /api/articles` rate-limited to 20 req/s per IP via Redis fixed-window counter (Phase 13). Returns `429` with `Retry-After` header. |
| **Push key encryption** | VAPID keys encrypted at rest with AES-256-GCM. `PUSH_KEY_ENCRYPTION_KEY` is 64-char hex (32-byte), validated at module load. |
| **Accessibility** | WCAG AAA focus indicators (`focus-visible:ring-dispatch-ember`). `prefers-reduced-motion` disables all animations entirely. |
| **DB connections** | Lazy Proxy connection (defers until first query). `max: 10` pool for dedicated runtimes; serverless requires PgBouncer/Supavisor. |
| **Content hashing** | `articles.contentHash` uses SHA-256 (via `node:crypto`) of `title|body|publishedAt.toISOString()`. Includes body so content-only updates are detected. (Phase 14) |
| **Env validation** | All required env vars validated by Zod at module load (`src/lib/env/index.ts`). Fails fast with descriptive error if any are missing/invalid. |
| **Push key storage** | Encrypted envelope stored in dedicated `encryptedKeys` column (Phase 14). Old `keys` column retained for backward compat but deprecated. |
| **Trusted proxy** | `TRUSTED_PROXY=true` env var makes rate limiter use rightmost IP from `x-forwarded-for` (prevents spoofing behind CDN). (Phase 14) |
| **AI failure observability** | After 3 BullMQ retries, failed summaries set `summaryStatus: "needs_review"` — visible in admin review queue. (Phase 14) |

---

## Known Issues & Lessons Learned

### Phase 6: Search, Admin & Public API

#### 1. PostgreSQL FTS Extension Confusion

**Issue**: The `pg_textsearch` extension does not exist in PostgreSQL 17 (it was never a separate extension). `ts_rank_cd()` is built-in.

**Lesson**: Verify extension availability before assuming it exists. Check with `SELECT * FROM pg_available_extensions WHERE name LIKE '%textsearch%'`.

**Fix**: The codebase uses `ts_rank_cd` and `websearch_to_tsquery` directly via Drizzle `sql` template literals. No extension installation required beyond `pg_trgm` for autocomplete.

#### 2. `searchVector` Column + `.notNull()`

**Issue**: The `searchVector` column in `schema.ts` must use `.notNull()` to match the generated column contract. Omitting it causes type mismatches.

**Fix**: 
```typescript
searchVector: tsvector("search_vector")
  .generatedAlwaysAs(sql`...`)
  .notNull(),
```

#### 3. Admin Route Guard in Layout

**Issue**: Admin route protection was initially discussed for `proxy.ts`, but the correct placement is in `(admin)/layout.tsx`.

**Lesson**: `verifyAdminSession()` belongs in the Layout (Layer 1), not `proxy.ts` (Layer 0). `proxy.ts` is UX-only and has no DB access.

**Implementation**:
```typescript
// src/app/(admin)/layout.tsx
export default async function AdminLayout({ children }) {
  await verifyAdminSession(); // Redirects non-admins to '/'
  return <AdminShell>{children}</AdminShell>;
}
```

#### 4. Search UI: Server vs. Client Component Split

**Issue**: Search needs both server-rendered initial results and client-side interactivity (debounced input, URL sync, loading states).

**Lesson**: Use a Server Component for the page to fetch initial results, and a Client Component wrapper (`SearchPageClient`) for interactivity. The `SearchBar` is `'use client'`; `SearchResults` can be RSC.

**Pattern**:
```
page.tsx (Server) → fetches initial results
  └── SearchPageClient (Client) → manages state, debounce, URL sync
       ├── SearchBar (Client) → input, ⌘K shortcut, loading spinner
       └── SearchResults (Server) → receives results via props
```

#### 5. `pg_trgm` for Autocomplete

**Issue**: Fuzzy search suggestions require `pg_trgm` extension, which may not be enabled by default.

**Fix**: Run `CREATE EXTENSION IF NOT EXISTS pg_trgm;` on your database. The similarity function is used for title matching in `getSearchSuggestions()`.

#### 6. CORS on Public API

**Lesson**: The `/api/articles` endpoint must include CORS headers (`Access-Control-Allow-Origin: *`) for external consumers. Always include an `OPTIONS` handler.

#### 7. `websearch_to_tsquery` Query Parsing

**Lesson**: Use `websearch_to_tsquery('english', $query)` instead of `to_tsquery` for user-facing search. It handles quoted phrases (`"exact match"`), negation (`-term`), and OR operators naturally.

### Phase 5: AI Summarisation Pipeline

#### 8. Content Availability Guard (Anti-Hallucination)

**Issue**: How to prevent AI from generating summaries when there is insufficient article content.

**Decision**: Implemented at two layers — Server Action and API Route. Both validate `contentAvailability` before enqueuing summarisation jobs.

**Schema**: `contentAvailabilityEnum` has four levels: `title_only`, `excerpt`, `partial_text`, `full_text`. Only `partial_text` and `full_text` are eligible for summarisation.

**Lesson**: Always guard against insufficient input data. The Zod schema validates output constraints, but the input guard is the first line of defense.

#### 9. Zod Schema Design for AI Output

**Issue**: LLM output is unpredictable. How to validate structured AI output reliably?

**Solution**: 
1. Define strict Zod schema with `min()` / `max()` constraints
2. Use `safeParse()` in production, not `parse()`
3. Map `result.error.issues` to user-friendly error messages

**Key pattern**:
```typescript
const result = summarisationOutputSchema.safeParse(rawOutput);
if (!result.success) {
  return { 
    success: false, 
    error: result.error.issues.map(i => i.message).join("; ")
  };
}
```

#### 10. useOptimistic for Instant UI Feedback

**Issue**: When user clicks "Request AI Summary", the UI must immediately show "Processing" state without waiting for server round-trip.

**Solution**: React 19's `useOptimistic()` hook provides instant local state updates while the server action is pending.

**Trade-off**: If the server action fails, the optimistic state must be rolled back. Handle this by re-checking server state after action completes.

#### 11. 3-Layer Provenance — C2PA Explicitly Rejected

**Lesson**: C2PA is a media (image/video/audio) standard with no established text specification. Our 3-layer approach (JSON-LD, HTTP header, HTML meta tag) is the correct and sufficient approach for text AI provenance under EU AI Act Art. 50.

### Phase 2: Authentication & Database Stabilisation

#### 12. @auth/core Version Conflict (Resolved)

**Issue**: `DrizzleAdapter` failed at build time with `TS2322: Type 'Adapter' is not assignable to type 'Adapter'` due to `next-auth@5.0.0-beta.25` depending on `@auth/core@0.37.2` while `@auth/drizzle-adapter@1.11.2` depended on `@auth/core@0.41.2`.

**Root Cause**: Mismatched `@auth/core` versions caused incompatible `Adapter` type definitions.

**Fix**: Upgraded `next-auth` to `5.0.0-beta.31` which depends on `@auth/core@0.41.2`, aligning both packages.

```bash
# Verification
pnpm why @auth/core
# Should show both next-auth and @auth/drizzle-adapter using the same version
```

#### 13. DrizzleAdapter + Database Connection (Resolved)

**Issue**: `DrizzleAdapter` evaluated the database at build time, defeating the lazy proxy pattern and throwing `Unsupported database type (object)`.

**Root Cause**: `@auth/drizzle-adapter` triggers database connection during module import, requiring `DATABASE_URL` to be available at build time.

**Fix**: Replaced lazy proxy with eager connection that gracefully falls back when `DATABASE_URL` is unavailable. The connection is established at module load time if the env var is present.

**Trade-off**: Eager connection reintroduces build-time database connection risks in serverless environments. For CI/builds without database access, consider build-time dummy URI injection (see recommendations below).

#### 14. Lazy Proxy Clarification (Phase 3)

**Correction**: The "DrizzleAdapter + Database Connection" fix above (eager connection) was later **reverted** in favor of a corrected **lazy proxy** implementation. The original lazy proxy was missing a proper `Proxy<T>` that intercepts all property access. The corrected implementation in `src/lib/db/index.ts` uses a full `Proxy<T>` that forwards all property access to the real `db`, eliminating the "Unsupported database type (object)" error while preserving build-time safety.

**Phase 3 Test Coverage**: `src/lib/db/index.test.ts` has 5 tests verifying the proxy behavior including missing `DATABASE_URL`, first-query execution, and repeated access returns same instance.

**Lesson**: The lazy proxy pattern IS correct for DrizzleAdapter. The issue was an incomplete proxy implementation, not the pattern itself.

### General Troubleshooting

#### TypeScript error: "Property 'issues' does not exist on type 'ZodError'"

**Cause**: The Zod `safeParse()` result type is `SafeParseReturnType`, not a direct `ZodError`. You must access `result.error.issues` only when `result.success` is `false`.

**Fix**:
```typescript
const result = summarisationOutputSchema.safeParse(raw);
if (!result.success) {
  // result.error is ZodError here, which has .issues
  return result.error.issues.map(i => i.message).join("; ");
}
```

#### useOptimistic warning: "An optimistic state update occurred outside a transition or action"

**Cause**: In tests, `useOptimistic` is not wrapped in a transition. This warning is expected in test environments.

**Fix**: No action needed for tests. In production, always wrap `useOptimistic` updates in `startTransition`.

#### Build fails with "Unsupported database type (object)"

**Cause**: In the original implementation, the lazy proxy database object was missing a full `Proxy<T>` wrapper, causing `@auth/drizzle-adapter` to fail at build time.

**Fix**: The corrected implementation in `src/lib/db/index.ts` uses a full `Proxy<T>` that intercepts all property access and forwards to the real `db`. This is the correct and working approach. If you see this error, ensure you are using the latest `src/lib/db/index.ts` which implements the lazy proxy correctly.

#### `searchArticles()` returns empty results

**Cause 1**: The search query is empty or whitespace-only. The function returns early.
**Fix**: Ensure the query string has at least one non-whitespace character.

**Cause 2**: The `pg_trgm` extension is not enabled, and `getSearchSuggestions` fails.
**Fix**: Run `CREATE EXTENSION IF NOT EXISTS pg_trgm;`.

**Cause 3**: The `articles.searchVector` GIN index is missing or corrupted.
**Fix**: Verify the index exists: `SELECT indexname FROM pg_indexes WHERE tablename = 'articles';`.

### Docker Build Fails with "Cannot find module" or "dist/workers/index.js" (Phase 15)

**Symptom**: `docker build -f Dockerfile.worker -t onestopnews-worker .` fails with `Cannot find module '/app/dist/workers/index.js'` or references to `worker:build` script.

**Cause**: The Dockerfile was written before Phase 15 — it referenced a non-existent `worker:build` script and copied a non-existent `dist/` directory. Phase 15 rewrote the Dockerfile to run `tsx src/workers/index.ts` directly.

**Fix**: Ensure you're using the Phase 15 Dockerfile (pinned to `node:24-alpine`, `CMD ["npx", "tsx", "src/workers/index.ts"]`). If you have local changes, discard them: `git checkout Dockerfile.worker`.

**Prevention**: The Dockerfile copies `node_modules` from the builder stage (which installs ALL deps including `tsx` in devDependencies). Never strip devDependencies in the builder — `tsx` is required at runtime.

### Docker Build Fails with ".next/standalone not found" (Phase 15)

**Symptom**: `docker build -f Dockerfile.web -t onestopnews-web .` fails at the `COPY --from=builder /app/.next/standalone ./` step.

**Cause**: `next.config.ts` doesn't have `output: "standalone"` set, so Next.js doesn't generate the standalone directory during `next build`.

**Fix**: Phase 15 added `output: "standalone"` to `next.config.ts` (top-level, alongside `cacheComponents: true`). Verify it's present:
```bash
grep 'output: "standalone"' next.config.ts
```
If missing, add it and rebuild.

### OAuth Sign-In Button Not Appearing on /sign-in Page (Phase 15)

**Symptom**: The `/sign-in` page shows only the Credentials form — no "Sign in with Google" or "Sign in with GitHub" buttons.

**Cause**: The OAuth env vars (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`) are not set in the environment. The sign-in page uses `showGoogle`/`showGithub` props derived from env var presence.

**Fix**: Set the env vars in `.env.local` (or your deployment env):
```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```
Then restart the dev server. The buttons will appear automatically.

**Note**: Both `CLIENT_ID` AND `CLIENT_SECRET` must be set for a given provider. Setting only one will NOT enable the provider (defensive — partial config is silently ignored).

### OAuth Callback URL Mismatch (Phase 15)

**Symptom**: Clicking "Sign in with Google" redirects to Google but returns an error like "Redirect URI mismatch" after consent.

**Cause**: The OAuth provider's configured redirect URI doesn't match `${AUTH_URL}/api/auth/callback/google`.

**Fix**: In the Google Cloud Console (or GitHub OAuth Apps), set the authorized redirect URI to exactly:
- Google: `${AUTH_URL}/api/auth/callback/google` (e.g., `http://localhost:3000/api/auth/callback/google`)
- GitHub: `${AUTH_URL}/api/auth/callback/github`

The `AUTH_URL` env var must match the URL users actually visit (including scheme + host + port).

### "Load More" Button Not Appearing on Home Feed (Phase 15)

**Symptom**: The home feed shows 6 articles but no "Load More" button appears below them.

**Cause 1**: There are no more articles in the database (less than 7 total). The `LoadMoreButton` is hidden when `hasMore` is false.

**Cause 2**: The `FeedData` Server Component didn't pass `initialNextCursor` and `initialHasMore` to `FeedContainer`. This was the pre-Phase-15 behavior.

**Fix**: Run `pnpm db:seed` to populate 30 sample articles. Verify the `FeedData.tsx` component renders `<FeedContainer initialArticles={feed.articles} initialNextCursor={feed.nextCursor} initialHasMore={feed.hasMore} />`.

---

## Recommendations

1. **Auth.js Stable Release**: Monitor `authjs.dev` for stable v5 release. Remove `as any` casts and eslint-disable comments when adapter types are fixed.

2. **Serverless Build Strategy**: For Vercel/Cloudflare Pages builds, inject a dummy `DATABASE_URL` at build time (e.g., via `NEXT_PUBLIC_DATABASE_URL` or build environment variables) to prevent connection errors. Replace with real connection at runtime.

3. **ESLint Config**: Consider migrating to `@next/eslint-plugin-next` directly once it supports flat config natively.

4. **Dependency Monitoring**: Regularly run `pnpm outdated` and `pnpm why @auth/core` to catch version mismatches early.

5. **AI Model Evaluation**: Monitor summarisation quality across models. Claude 4.5 Haiku is primary, GPT-5 Mini is fallback. Consider adding a quality scoring metric to the `summaries` table for model comparison. Track `summaries.tokensUsed` to monitor cost per model.

6. **Zod Schema Evolution**: As LLM capabilities improve, schema constraints may need adjustment. Keep the Zod schema and tests version-controlled. Changes to `summaryText` min/max lengths or `keyPoints` count should be accompanied by new tests.

7. **Provenance Verification**: Periodically verify all three provenance layers (JSON-LD, HTTP header, meta tag) are correctly generated and conform to EU AI Act Art. 50 requirements. Consider automating this in CI. The article detail page (`/article/[id]`) now emits all 3 layers via `generateMetadata()` when a summary exists (Phase 14).

8. **Test Suite Growth**: Phase 5 added 47 tests; Phase 6 added 4 tests; Phase 7 added 21 tests; Phase 13 added 39 tests; Phase 14 added 39 tests (article queries: 4, ArticleData component: 8, push subscribe: 6, rate limiter IP: 5, hashContent body: 3, summarizeFailure: 6, pipeline integration: 8, minus removed hardcoded vector: -1); Phase 15 added 28 tests (LoadMoreButton: 5, FeedContainer: 8, providers: 6, SignInClient: 9). Current total: **279 tests across 49 suites** + 10 Playwright E2E tests. Monitor test duration — currently ~13s; if it exceeds 30s, investigate slow tests.

9. **BM25 Search Tuning**: The `ts_rank_cd('{0.1, 0.2, 0.4, 1.0}', ...)` weights may need adjustment based on real user queries. Consider A/B testing different weight configurations.

10. **~~Rate Limiting Implementation~~** (RESOLVED — Phase 13): `GET /api/articles` now has Redis fixed-window rate limiting (20 req/s per IP) via `src/lib/rateLimit.ts`. Returns `429` with `Retry-After` header. **Future enhancement**: Consider token bucket for burst support, and extend rate limiting to `/api/summarize/[id]` (currently relies on `summaryStatus !== "none"` check as a natural rate limiter).

11. **CI Pipeline Monitoring**: Monitor GitHub Actions pipeline duration. If it exceeds 10 minutes, investigate slow steps (likely `npx playwright install --with-deps`). Phase 13 fixed the CI workflow to use Node 24 + all required env vars — verify CI passes on next push.

12. **Docker Image Size**: Monitor Docker image sizes. If the web image exceeds 500MB, investigate `node_modules` pruning or multi-stage build optimization. Phase 15 added `output: "standalone"` to `next.config.ts` which bundles only production deps — verify the resulting image size.

13. **Lighthouse CI Budgets**: Start with conservative budgets (Perf ≥ 90, A11y ≥ 95) and tighten as the app matures. PPR helps with performance but heavy AI components can slow LCP.

14. **Blocking Route Prevention**: In Next.js 16 with `cacheComponents: true`, always wrap database queries in `<Suspense>` with a fallback UI (e.g., `FeedSkeleton`). Never `await` data fetches directly in the main page component body — this triggers the `blocking-route` error.

15. **~~Article Detail Page~~** (RESOLVED — Phase 14): The article detail page now fetches real data via `getArticleWithSummary(id)`, renders `SummaryPanel` + `NutritionLabel`, and emits 3-layer provenance via `generateMetadata()`.

16. **~~RSS Ingestion E2E Test~~** (RESOLVED — Phase 14): Phase 14 created `src/workers/pipeline.integration.test.ts` (8 tests) that exercises the full pipeline: `parseFeed → determineContentAvailability → hashContent → content change detection`. Also created `e2e/smoke.spec.ts` (10 E2E tests) for browser-level verification.

17. **Token Usage Monitoring**: The `summarize.ts` worker tracks `tokensUsed` per summary. Monitor aggregate token usage in production to verify the AI SDK v6 `usage` field is populated correctly for both Anthropic and OpenAI, and to catch unexpected cost spikes.

18. **~~Rate Limit Identifier Hardening~~** (RESOLVED — Phase 14): The rate limiter now supports `TRUSTED_PROXY=true` env var. When set, uses the rightmost IP from `x-forwarded-for` (the trusted proxy's view of the client), preventing spoofing. When unset, uses the leftmost IP (documented as spoofable for direct-exposure deployments).

---

## Outstanding Issues & Future Work

### ~~No Rate Limiting on Public API~~ (RESOLVED — Phase 13)

**Status**: RESOLVED. Phase 13 implemented Redis fixed-window rate limiting on `GET /api/articles` (max 20 req/s per IP) via `src/lib/rateLimit.ts`. Returns HTTP 429 with `Retry-After` and `X-RateLimit-Remaining` headers when exceeded. Cursor validation also added (returns 400 for invalid ISO 8601 date strings).

### ~~Summarisation Worker AI Integration~~ (RESOLVED — Phase 13)

**Status**: RESOLVED. Phase 13 integrated the Vercel AI SDK (`ai@6`, `@ai-sdk/anthropic@3`, `@ai-sdk/openai@3`) in `src/workers/jobs/summarize.ts`. Calls Claude 4.5 Haiku as primary with GPT-5 Mini fallback, using `generateObject()` with the Zod-validated `summarisationOutputSchema`. Token usage is tracked per summary.

### ~~Article Detail Page~~ (RESOLVED — Phase 14)

**Status**: RESOLVED. Phase 14 implemented the full article detail page:
- `getArticleWithSummary(id)` query with 4-way JOIN (articles + sources + categories + summaries)
- `ArticleData.tsx` fetches real article data, renders title/excerpt/body/source/category
- Renders `SummaryPanel` (5-state machine) with real `initialStatus` + `summary` props
- `generateMetadata()` emits 3-layer AI provenance (JSON-LD + `X-AI-Provenance` header + `<meta name="ai-provenance">`) when summary exists
- Also emits OpenGraph + Twitter card metadata
- Renders 404 "Article not found" when article is null

### ~~RSS Ingestion End-to-End Test~~ (RESOLVED — Phase 14)

**Status**: RESOLVED. Phase 14 created `src/workers/pipeline.integration.test.ts` (8 tests) that exercises the full pipeline: `parseFeed → determineContentAvailability → hashContent → content change detection`. Also created `playwright.config.ts` + `e2e/smoke.spec.ts` (10 E2E tests) for browser-level verification.

### ~~Dockerfile Drift~~ (RESOLVED — Phase 15)

**Status**: RESOLVED. Phase 15 pinned both production Dockerfiles to `node:24-alpine` (matching `engines.node: ">=24.0.0"`), added `output: "standalone"` to `next.config.ts`, rewrote `Dockerfile.worker` to run `tsx src/workers/index.ts` directly (fixing malformed lines + non-existent `worker:build` script + missing `dist/`), and fixed `Dockerfile.dev`/`Dockerfile.worker.dev` (removed non-existent `packages/` copy + corrected script names).

### ~~Missing Sign-In / Auth-Error Pages~~ (RESOLVED — Phase 15)

**Status**: RESOLVED. Phase 15 created `src/app/sign-in/page.tsx` (Server Component) + `SignInClient.tsx` (Client Component) with OAuth buttons + Credentials form, and `src/app/auth-error/page.tsx`. The Auth.js config referenced these routes via `pages.signIn`/`pages.error` but they didn't exist before Phase 15.

### ~~Deprecated `keys` Column on `push_subscriptions`~~ (RESOLVED — Phase 15)

**Status**: RESOLVED. Phase 15 dropped the deprecated `keys` jsonb column via migration `0005_neat_wolverine.sql` (`ALTER TABLE push_subscriptions DROP COLUMN keys;`). Verified via grep that no code reads the column before dropping.

### Add Sign-In / Sign-Out Button to Header (Future Enhancement)

**Status**: Open. The `/sign-in` page now exists (Phase 15) but there's no sign-in/sign-out button in the `Header` component. Users must navigate to `/sign-in` manually. Adding a button to the header would improve UX discoverability.

**Suggested approach**: Add a conditional button to `src/shared/components/layout/Header.tsx` that shows "Sign In" when unauthenticated (links to `/sign-in`) and "Sign Out" when authenticated (calls `signOut()` server action). Use `auth()` from `@/lib/auth` in a Server Component wrapper to determine auth state.

### Extend Load More to Topic Pages (Future Enhancement)

**Status**: Open. Phase 15 added cursor-based "Load More" pagination to the home feed (`FeedContainer` + `LoadMoreButton`). The topic pages (`/topics/[category]`) still render only the initial page. Consider reusing `FeedContainer` on topic pages for consistency.

### OAuth Account Linking (Future Enhancement)

**Status**: Open. Phase 15 added Google + GitHub OAuth providers, but there's no UI for linking an OAuth account to an existing Credentials account. If a user signs in with Credentials first and later tries OAuth with the same email, Auth.js will create a separate account. Consider adding an account-linking flow in a user settings page.

### Test Flakiness Risk

**Impact**: Low — `useOptimistic` tests may be timing-sensitive due to React's internal batching and transition scheduling.

**Mitigation**: Tests already wrap `useOptimistic` calls in `act()` and await transitions. If flakiness appears, consider mocking `startTransition` or using `@testing-library/react`'s `waitFor` with longer timeout.

---

## Project Status

| Phase | Status | Key Deliverables |
| :--- | :--- | :--- |
| **Phase 1** — Foundation & Configuration | **COMPLETE** | next.config.ts, proxy.ts, tsconfig.json, docker-compose |
| **Phase 2** — Database Schema & Infrastructure | **COMPLETE** | Drizzle schema (11 tables: 8 business + 3 Auth.js adapter), lazy DB client, Auth.js v5, BullMQ queues |
| **Phase 3** — Design System & Shared Components | **COMPLETE** | Button, Badge, Skeleton, Header, Footer, useDebounce, useReducedMotion, PageTransition |
| **Phase 4** — Core Feed Feature | **COMPLETE** | Domain layer, feed queries, FeedGrid, ArticleCard, home/topic/article routes |
| **Phase 5** — AI Summarisation Pipeline | **COMPLETE** | Zod schema, prompts, 3-layer provenance, NutritionLabel, SummaryPanel, actions, API endpoint |
| **Phase 6** — Search, Admin & Public API | **COMPLETE** | FTS search with BM25 (`ts_rank_cd`), admin routes (`/admin/sources`, `/admin/summaries`), public REST API (`/api/articles`) |
| **Phase 7** — Worker Service, Push & Observability | **COMPLETE** | 4 BullMQ workers, scheduler, content guard, AES-256-GCM push encryption, DST-safe quiet hours, cache invalidation, push subscribe API |
| **Phase 8** — Testing, CI/CD & Deployment | **COMPLETE** | GitHub Actions CI/E2E pipelines, multi-stage Dockerfiles (web + worker), docker-compose.prod.yml, Lighthouse CI, Vitest coverage thresholds, deployment script |
| **Phase 9** — Blocking Route Fix & Suspense | **COMPLETE** | FeedData.tsx/FeedSkeleton.tsx Server Components, key-ed Suspense, async params support |
| **Phase 10** — Landing Page & Design System | **COMPLETE** | 10-section landing page, design system tokens (cat-label, btn-ember, animations), db:seed, test mocking |
| **Phase 11** — Landing Page Bug Fixes & SSR Remediation | **COMPLETE** | Fixed CSS merge artifact, `.reveal` scroll animations, `next-prerender-current-time` fix, `ArticleCard` client conversion |
| **Phase 12** — Tailwind v4 PostCSS & Commit Mono Font Fix | **COMPLETE** | `@tailwindcss/postcss` + `postcss.config.mjs`, Commit Mono via `next/font/local`, `.font-editorial` enhancement, `.next` cache clear |
| **Phase 13** — Critical Gaps Remediation | **COMPLETE** | Real RSS/Atom/JSON parser (`rss-parser`), real AI summarization (Vercel AI SDK: Anthropic primary + OpenAI fallback), `FlowProducer` atomic DAG (ingest → score → refresh-feed-slice), `/api/articles` cursor validation + Redis rate limiting (20 req/s per IP), `hashContent` upgraded to SHA-256, `/api/categories` endpoint, `cacheInvalidation` singleton publisher, CI workflow fixed (Node 24 + all env vars), UI CSS class corruption fixes, `accountablePerson.name` provenance fidelity, `body` column added to articles schema, content-change-detection upserts |
| **Phase 14** — Validated Gaps Closure | **COMPLETE** | `hashContent` includes body (content-only updates detected), rate limiter `TRUSTED_PROXY` env var (rightmost IP for CDN), property-based `node:crypto` SHA-256 test (replaced hardcoded vector), `pushSubscriptions.encryptedKeys` column (replaced misleading `keys.p256dh` convention), article detail page with real data fetch + `SummaryPanel` + 3-layer provenance via `generateMetadata()`, Playwright config + 10 E2E smoke tests, 8 pipeline integration tests, `getSummaryFailureState` (permanent failure → `needs_review` after 3 retries), `e2e/` excluded from vitest/ESLint/tsc (**251 tests across 45 suites** + 10 E2E) |
| **Phase 15** — Production Readiness (Dockerfiles, Load More, Drop keys, OAuth) | **COMPLETE** | Pinned both production Dockerfiles to `node:24-alpine` + added `output: "standalone"` to `next.config.ts`; rewrote `Dockerfile.worker` to run `tsx src/workers/index.ts` directly (fixing malformed lines + non-existent `worker:build` script + missing `dist/`); fixed `Dockerfile.dev`/`Dockerfile.worker.dev` (removed non-existent `packages/` copy + corrected script names); cursor-based "Load More" pagination on home feed (`FeedContainer` + `LoadMoreButton` client components using existing `Button` primitive); dropped deprecated `push_subscriptions.keys` column via migration `0005_neat_wolverine.sql`; added Google + GitHub OAuth providers (conditional on env vars, Credentials-only fallback preserved); created `/sign-in` and `/auth-error` pages (previously referenced in `pages.signIn`/`pages.error` but missing); added optional OAuth env vars to `env/index.ts` + `.env.example` + `src/test/setup.ts` + `.github/workflows/ci.yml` + `docker-compose.prod.yml` (**279 tests across 49 suites** + 10 E2E) |

---

## Contributing

### Development conventions

- **TypeScript strict mode** — no `any`, prefer `unknown`. Use type inference; avoid explicit return types unless necessary.
- **`interface` over `type`** — use `interface` for structural definitions; `type` for unions/intersections only.
- **Early returns** — avoid deeply nested conditionals.
- **Composition over inheritance** — no class hierarchies for business logic.
- **Library discipline** — if Shadcn UI / Radix provides a primitive, use it. Wrap for bespoke styling; never rebuild from scratch.
- **All UI states** — every component must handle: loading, error, empty, success. Show loading only when no data exists.
- **`queries.ts` boundary** — all DB access goes through feature-level `queries.ts` files. No raw Drizzle calls in components.

### TDD flow

```
RED → Write a failing test that describes the desired behaviour
GREEN → Write the minimum code to make the test pass
REFACTOR → Clean up while keeping tests green
```

### Pre-commit hooks

```bash
pnpm lint          # ESLint + Prettier check
pnpm tsc --noEmit  # Type-check
pnpm test          # Run affected test suites
```

---

## Architecture Decision Records

Key ADRs are documented in the [Project Architecture Document (PAD) v4.5](./docs/Project_Architecture_Document_v4.5.md):

| ADR | Decision | Core Rationale |
| :--- | :--- | :--- |
| ADR-001 | Next.js 16 App Router | Opt-in Cache Components eliminates v13/14 caching footguns. PPR + `proxy.ts` for edge prerendering. |
| ADR-002 | BullMQ v5 on Redis | Job priorities, parent-child Flows, built-in monitoring dashboard. No SQS or pg-boss. |
| ADR-003 | Drizzle ORM with Lazy Proxy | Zero runtime overhead. Lazy connection prevents Next.js build-time crashes. |
| ADR-004 | Auth.js v5 (pinned beta) | Native App Router, HttpOnly cookies, Drizzle adapter. Strict PRD v4.3 alignment. |
| ADR-005 | PostgreSQL FTS + `ts_rank_cd` BM25 | Search inside Postgres. No Elasticsearch operational burden. `pg_trgm` for autocomplete. |
| ADR-006 | Modular Monolith + Separate Worker | AI summarisation (2–10s) must not block HTTP handling. No microservices complexity. |
| ADR-007 | Turbopack as default bundler | 5–10× faster HMR. Fully compatible with all dependencies. |

---

---

## Phase 10: Landing Page & Design System — Lessons Learned

#### 1. Masthead Date Rendering — Server/Client Hydration Mismatch

**Issue**: Rendering `new Date()` or `new Date().toLocaleDateString()` directly in a Server Component causes a hydration mismatch because the server and client have different locales/timezones.

**Fix**: Use a Client Component wrapper for date/time display, or pass pre-formatted date strings from the server:

```tsx
"use client";
export function LiveDate() {
  const [date, setDate] = useState("");
  useEffect(() => {
    setDate(new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }));
  }, []);
  return <span>{date}</span>;
}
```

**Prevention**: Always wrap time-sensitive displays in `'use client'` or pass server-calculated strings as props.

#### 2. Saved HTML Staleness Trap

**Issue**: Saved HTML snapshots (`*.html` files captured from the browser) can become stale quickly during active development. The saved `dynamic_landing_page.html` reflected the old page state (3 sections only), creating the false impression that CSS/JS was broken.

**Fix**: When comparing static vs. dynamic pages, ALWAYS verify by checking the live server (`curl` or browser) before concluding that CSS/JS is broken:

```bash
curl http://localhost:3000 > current_page.html
diff current_page.html saved_page.html
```

**Prevention**: Label saved snapshots with timestamps. Prefer live verification over saved snapshots during active development.

#### 3. next.config.ts remotePatterns for External Images

**Issue**: Using external image URLs (e.g., `picsum.photos`, `images.unsplash.com`) without adding them to `next.config.ts` causes Next.js Image Optimization to fail with a security error.

**Fix**: Add all external image domains to `next.config.ts`:

```typescript
// next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};
```

**Prevention**: When adding external images, immediately update `remotePatterns`.

#### 4. Test Mocking for Browser-Only APIs

**Issue**: Tests using Intersection Observer (`useInView` from `framer-motion`) and date formatting fail in a headless environment because `IntersectionObserver` and `Intl.DateTimeFormat` are not available.

**Fix**: Mock these APIs in `vitest.setup.ts` or test files:

```typescript
// vitest.setup.ts
global.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof IntersectionObserver;

global.Intl.DateTimeFormat = class {
  format() { return "10 June 2026"; }
} as unknown as typeof Intl.DateTimeFormat;
```

**Prevention**: Check browser-only APIs before using them in testable components.

#### 5. Suspense + Server Components for Dynamic Pages

**Issue**: In Next.js 16 with `cacheComponents: true`, awaiting a database query directly in a page component blocks the entire page render. This triggers the `blocking-route` warning.

**Fix**: Extract data fetching into a separate Server Component and wrap it in `<Suspense>`:

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
```

**Prevention**: Never `await` a database query directly in a page component. Always use the `<Suspense>` + Server Component pattern.

---

## Phase 13: Critical Gaps Remediation — Lessons Learned

### 1. RSS Parser Selection — `rss-parser` Field Conflation

**Issue**: `rss-parser` conflates several source fields into its built-in `content` property:
- For RSS 2.0: `content` = `<content:encoded>` if present, else `<description>`
- For Atom: `content` = `<content>` if present, else `<summary>`

This makes it impossible to distinguish "body" from "excerpt" using `content` alone.

**Fix**: Read fields explicitly by feed type:
- RSS: use `content:encoded` (custom field) for body, `contentSnippet` for excerpt
- Atom: detect via root element `<feed>` in raw XML, use `content` for body, `summary` for excerpt

**Lesson**: Always check what a library conflates before relying on its built-in fields. For feeds, explicit field extraction by format is safer than generic fallbacks.

### 2. `feedType` is Undefined in `rss-parser` for Atom

**Issue**: `rss-parser` documentation suggests `parsed.feedType` returns `"rss"` | `"atom"` | `"rdf"`. In practice (v3.13.0), `feedType` is `undefined` for Atom feeds.

**Fix**: Detect feed type by inspecting the raw XML root element:
```typescript
const isAtom = /^\s*<\?xml[^>]*\?>\s*<feed[\s>]/i.test(content) ||
               /^\s*<feed[\s>]/i.test(content.trim());
```

### 3. Vercel AI SDK v6 — `generateObject` Returns `result.object`, Not `result`

**Issue**: The AI SDK v6 `generateObject()` returns `{ object, usage, ... }` — the validated output is in `result.object`, not `result` directly.

**Fix**: Spread `result.object` and add `model` + `tokensUsed` from `result.usage`:
```typescript
const result = await generateObject({ model, schema, messages, temperature: 0.1 });
return { ...result.object, model: PRIMARY_MODEL, tokensUsed: result.usage?.totalTokens ?? 0 };
```

### 4. `articles.body` Column — Schema Design Gap

**Issue**: The original schema had no `body` column, but `contentAvailabilityEnum` tiers (`partial_text` = 300–1500 chars body, `full_text` = >1500 chars body) imply body content exists. The `determineContentAvailability` function checks `body.length` — but body was never persisted.

**Fix**: Added nullable `body: text("body")` column via additive Drizzle migration (`drizzle/0003_strong_mac_gargan.sql`). The ingest worker now stores body extracted from feeds, and the summarize worker passes it to `callAISummary` instead of the previous `body: null` placeholder.

### 5. `vi.fn().mockImplementation()` Is NOT a Constructor

**Issue**: When mocking classes like `Redis` or `FlowProducer` that are called with `new`, `vi.fn(() => mockInstance)` doesn't work — `new` on a vi.fn returns an empty object, ignoring the return value.

**Fix**: Use a real class in the mock factory:
```typescript
vi.mock("ioredis", () => ({
  Redis: class MockRedis {
    incr = mockRedis.incr;
    expire = mockRedis.expire;
    // ...
  },
}));
```

### 6. Test Setup Environment Variable Override

**Issue**: The shell environment may contain values that fail the env schema (e.g., a SQLite `DATABASE_URL` from a parent project). Using `??=` (nullish coalescing assignment) in test setup doesn't override these.

**Fix**: Use direct assignment (`=`) in `src/test/setup.ts` to force test-safe values, and document why. Also note: `process.env.NODE_ENV` is typed as read-only by `@types/node` — vitest already sets it to `"test"`, so no manual assignment is needed.

### 7. CI Workflow — Missing Env Vars Break All Steps

**Issue**: `src/lib/env/index.ts` validates all required env vars at module load time and throws if any are missing/invalid. This means even `pnpm install` → `pnpm lint` would fail in CI if env vars aren't set, because linting imports modules that import `@/lib/env`.

**Fix**: Set all required env vars (with CI-safe dummy values) in the `env:` block of `.github/workflows/ci.yml`. Use values that pass the Zod schema (e.g., `DATABASE_URL=postgres://...`, `ANTHROPIC_API_KEY=sk-ant-...`, `PUSH_KEY_ENCRYPTION_KEY=0000...0000` 64 hex chars).

### 8. `clientSegmentCache` Not in `ExperimentalConfig` (Next.js 16.2.9)

**Issue**: PRD §5.2 / PAD §5.3 list `experimental.clientSegmentCache: true`, `turbopackPersistentCaching: true`, and `turbopackFileSystemCacheForBuild: true`. The installed Next.js 16.2.9 does not expose these flags in `ExperimentalConfig` — adding them produces `TS2353: Object literal may only specify known properties`.

**Fix**: Document the flags as deferred in `next.config.ts` with a comment explaining they'll be re-enabled once the upstream type includes them. Only `viewTransition: true` is currently enabled.

### 9. Content Change Detection via `(xmax = 0)` Trick

**Issue**: When using `onConflictDoUpdate`, how do you distinguish a newly INSERTed row from an UPDATEd row?

**Fix**: Use the PostgreSQL system column `xmax` in the RETURNING clause:
```typescript
.returning({
  id: articles.id,
  isNew: sql<boolean>`(xmax = 0)`,  // true for INSERT, false for UPDATE
})
```
`xmax = 0` is true only for newly inserted rows (no transaction ID to delete). For updated rows, `xmax` is non-zero. Combined with a `WHERE content_hash != excluded.content_hash` clause, this lets you detect content changes and only enqueue scoring for genuinely new articles.

### 10. Singleton Publisher Pattern for Cache Invalidation

**Issue**: The original `cacheInvalidation.ts` created a new Redis connection per call (`new Redis(...)` + `redis.quit()` in finally). Under high ingest load (50 concurrent workers), this caused connection churn.

**Fix**: Module-level singleton publisher:
```typescript
let _publisher: Redis | null = null;
function getPublisher(): Redis {
  if (!_publisher) {
    _publisher = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 3, connectTimeout: 5000 });
  }
  return _publisher;
}
```
The publisher stays alive for the process lifetime. The `flows.ts` FlowProducer uses the same singleton pattern.

---

## Phase 14: Validated Gaps Closure — Lessons Learned

### 1. `hashContent` Must Include Body for Content Change Detection

**Issue**: The original `hashContent(title, publishedAt)` only hashed title + date. If a feed updated an article's body (same title + pubDate, different content), the `contentHash` wouldn't change, and the `onConflictDoUpdate WHERE content_hash != excluded.content_hash` clause would skip the update.

**Fix**: Updated `hashContent(title, body, publishedAt)` to include body in the SHA-256 input: `${title.trim()}|${body ?? ""}|${publishedAt.toISOString()}`. Now content-only updates are detected.

**Lesson**: When hashing for change detection, include ALL fields that represent "content" — not just identifiers. Title + date identify the article; body IS the content.

### 2. Rate Limiter IP Extraction — Trusted Proxy Pattern

**Issue**: The `x-forwarded-for` header is spoofable. An attacker can send `X-Forwarded-For: 1.2.3.4` and bypass rate limiting by appearing as different IPs.

**Fix**: Added `TRUSTED_PROXY` env var. When `true`, the app uses the RIGHTMOST IP from `x-forwarded-for` (the trusted proxy's view of the client). When unset (default), uses the LEFTMOST IP (client-supplied, spoofable but documented).

**Lesson**: IP extraction from `x-forwarded-for` must distinguish between "direct exposure" (leftmost = client) and "behind trusted proxy" (rightmost = proxy's client). Use an env var to switch modes — don't hardcode either.

### 3. `pushSubscriptions.keys` Schema Convention Was Misleading

**Issue**: The encrypted push key envelope was stored as `keys: { p256dh: encryptedEnvelope, auth: "encrypted" }`. The schema type said `{ p256dh: string; auth: string }` but `p256dh` actually held the entire encrypted envelope for both keys, and `auth` was a hardcoded string.

**Fix**: Added a dedicated `encryptedKeys: text("encrypted_keys")` column. The old `keys` column is retained (now nullable) for backward compat. New subscriptions write to `encryptedKeys`; old `keys` column can be dropped in a future release.

**Lesson**: Schema types should match storage semantics. If a field stores an encrypted envelope, it should be a single string column — not stuffed into a typed object field. Additive migrations (new column) are safer than in-place type changes.

### 4. Article Detail Page — `generateMetadata` for Provenance

**Issue**: The article detail page was a placeholder rendering hardcoded mock data. No real data fetch, no `SummaryPanel`, no 3-layer provenance emission.

**Fix**: Implemented `getArticleWithSummary(id)` with 4-way JOIN. `ArticleData.tsx` fetches real data and renders `SummaryPanel`. `generateMetadata()` in `page.tsx` calls `generateProvenanceMetadata()` and emits all 3 layers via `metadata.other`.

**Lesson**: `generateMetadata()` is the correct Next.js 16 mechanism for emitting per-page HTTP headers and meta tags. Set `metadata.other = { "ai-provenance": metaTag, "X-AI-Provenance": httpHeader }` for the 3-layer provenance. JSON-LD can be emitted via a `<script type="application/ld+json">` tag rendered in the page body.

### 5. Property-Based Testing > Hardcoded Vectors

**Issue**: The `hashContent` test used a hardcoded SHA-256 vector (`expected = "28f1f634..."`). If the implementation changed (delimiter, date format), the test would fail with a cryptic mismatch.

**Fix**: Replaced with a property-based test that computes the expected hash via `node:crypto` inline: `createHash("sha256").update(expectedData, "utf8").digest("hex")`. This verifies the algorithm matches without hardcoding a specific output.

**Lesson**: Prefer property-based tests (determinism, collision resistance, algorithm verification) over hardcoded vectors. Hardcoded vectors are brittle and don't explain WHY the hash should be that value.

### 6. E2E Tests Require Config Separation

**Issue**: Playwright E2E tests (`e2e/*.spec.ts`) were picked up by vitest, causing import errors (`@playwright/test` not installed in vitest environment).

**Fix**: Excluded `e2e/` and `playwright.config.ts` from `vitest.config.ts` (`exclude`), `eslint.config.mjs` (`ignores`), and `tsconfig.json` (`exclude`). Playwright has its own config and runs via `pnpm test:e2e`.

**Lesson**: When using multiple test runners (vitest for unit/integration, Playwright for E2E), explicitly exclude each runner's files from the other's config. Otherwise, the runner without the dependency will fail to parse the files.

### 7. BullMQ Failure State — `needs_review` After Retries

**Issue**: When `callAISummary` failed, the catch block reset `summaryStatus` to `"none"` — allowing BullMQ retry but providing no observability. After 3 retries, the article's status stayed `"none"` (no summary, no error indication).

**Fix**: Created `getSummaryFailureState(attemptsMade, maxAttempts)` pure function. When `attemptsMade >= maxAttempts`, sets `summaryStatus: "needs_review"` — making failed summaries visible in the admin review queue.

**Lesson**: For retryable operations, distinguish between "temporary failure (retry)" and "permanent failure (escalate)". After exhausting retries, set a visible failure state — don't silently leave the entity in its initial state.

### 8. Mock Query Builder Chaining for Drizzle

**Issue**: Testing Drizzle queries requires mocking the chainable query builder: `db.select().from().innerJoin().leftJoin().leftJoin().where().limit()`. The mock must return the correct object at each step.

**Fix**: Created a self-referential mock: `leftJoinResult.leftJoin = leftJoin` so the second `leftJoin` call returns the same object (which has `where`).

**Lesson**: Drizzle's query builder is deeply chainable. Mock factories must handle arbitrary chaining depth. Self-referential mocks (`result.method = method`) are the cleanest pattern for this.

---

## Phase 15: Production Readiness — Lessons Learned

### 1. Dockerfile Drift — `node:22-alpine` vs `engines.node: ">=24.0.0"`

**Issue**: The production Dockerfiles (`Dockerfile.web`, `Dockerfile.worker`) pinned Node 22 while `package.json` requires Node 24. Additionally, `Dockerfile.worker` had malformed lines (missing newlines), referenced a non-existent `worker:build` script, and copied a non-existent `dist/` directory.

**Fix**: Pinned both Dockerfiles to `node:24-alpine`. Added `output: "standalone"` to `next.config.ts` so `Dockerfile.web` can copy the self-contained `.next/standalone/` directory. Rewrote `Dockerfile.worker` to run `tsx src/workers/index.ts` directly (since `tsx` is in `devDependencies`, the builder stage installs all deps; the runner stage copies `node_modules` + `src`).

**Lesson**: Dockerfiles must be validated as part of CI — not just visually reviewed. A `docker build --check` step (or equivalent) catches malformed lines and missing scripts before they reach production. Always pin to the exact Node version specified in `engines.node`.

### 2. `output: "standalone"` Required for Production Docker

**Issue**: `Dockerfile.web` copied `.next/standalone/server.js` but `next.config.ts` didn't set `output: "standalone"`. The build would fail because the standalone directory wasn't generated.

**Fix**: Added `output: "standalone"` to `next.config.ts`. This is the Next.js-recommended Docker pattern — it bundles only the production deps into a self-contained server.

**Lesson**: `output: "standalone"` is mandatory when using the standalone Docker pattern. Without it, the Dockerfile references a directory that doesn't exist. Always pair the config flag with the Dockerfile copy step.

### 3. Cursor-Based "Load More" — Server Fetch Initial, Client Fetches Subsequent

**Issue**: `getFeedArticles()` already returned `{ articles, nextCursor, hasMore }` but the UI never surfaced this. The home page had a `TODO: Restore Load More with cursor pagination` comment.

**Fix**: Created `FeedContainer` (client component) that receives `initialArticles` + `initialNextCursor` + `initialHasMore` from the Server Component (`FeedData`). On "Load More" click, it fetches `/api/articles?cursor=...` and appends results. Handles loading, error+retry, and "no more articles" states.

**Lesson**: The Next.js 16 App Router pattern for paginated feeds is: Server Component fetches page 1 (for fast initial render + SEO), Client Component fetches subsequent pages (for interactivity). The `<Suspense>` boundary wraps the Server Component so the page shell renders immediately.

### 4. Dropping a Deprecated Column — Additive Migration Verification

**Issue**: The `keys` column on `push_subscriptions` was marked `@deprecated` in Phase 14 but retained for "backward compat". Phase 15 verified no code reads it (via grep) and dropped it.

**Fix**: Removed `keys` from `schema.ts`, generated migration `0005_neat_wolverine.sql` (`ALTER TABLE push_subscriptions DROP COLUMN keys;`). The TDD-style verification: first removed `keys` from the test mock and confirmed tests still passed (proving no code reads it), THEN removed the column from the schema.

**Lesson**: Before dropping a column, grep the entire `src/` for references. Use the test mock as a canary — if removing the column from the mock doesn't break tests, no code reads it. Always generate a Drizzle migration (`drizzle-kit generate`) rather than writing SQL by hand.

### 5. OAuth Providers — Conditional Configuration for Backward Compat

**Issue**: Adding Google + GitHub OAuth providers naively (always-on) would break existing deployments that don't have OAuth env vars configured — Auth.js would throw at boot.

**Fix**: Extracted `buildProviders()` into a separate module (`src/lib/auth/providers.ts`) that conditionally includes Google/GitHub only when both `CLIENT_ID` and `CLIENT_SECRET` are present. The env vars are `.optional()` in the Zod schema. This preserves backward compat: deployments without OAuth continue to work with Credentials-only auth.

**Lesson**: When adding new auth providers, make them conditional on env vars. The `Provider` type from Auth.js v5 is a union (object form + function form) — use `'id' in p` narrowing to access the `id` property safely in tests.

### 6. Missing `/sign-in` and `/auth-error` Pages — Referenced but Non-Existent

**Issue**: `src/lib/auth/index.ts` had `pages.signIn: "/sign-in"` and `pages.error: "/auth-error"`, but neither page existed. The Credentials flow was broken (no UI to trigger it).

**Fix**: Created `src/app/sign-in/page.tsx` (Server Component that inspects env vars and passes `showGoogle`/`showGithub` to `SignInClient`) + `src/app/sign-in/SignInClient.tsx` (Client Component with OAuth buttons + Credentials form). Created `src/app/auth-error/page.tsx` (simple error landing). Used `<form action="/api/auth/signin/google" method="post">` for OAuth (progressive enhancement — works without client JS).

**Lesson**: Always verify that routes referenced in `pages.signIn`/`pages.error` actually exist. The Auth.js config silently accepts non-existent paths — the failure only appears at runtime when a user is redirected to a 404. Server-action forms (`<form action="..." method="post">`) are the simplest OAuth trigger pattern — no `SessionProvider` or client-side `signIn()` needed.

### 7. Mocking `global.fetch` in Vitest — `vi.stubGlobal` Pattern

**Issue**: Tests for `FeedContainer` (which calls `fetch("/api/articles?cursor=...")`) created a `vi.fn()` mock but never assigned it to `global.fetch`, so the real `fetch` was called (which failed since no server was running).

**Fix**: Used `vi.stubGlobal("fetch", mockFetch)` in `beforeEach()` to replace the global `fetch` with the mock. Reset in `beforeEach` via `mockFetch.mockReset()`.

**Lesson**: `vi.fn()` creates a mock function but doesn't replace anything by itself. For global APIs like `fetch`, use `vi.stubGlobal("fetch", mockFn)` (or assign `global.fetch = mockFn as unknown as typeof fetch`). Always reset between tests to avoid cross-test contamination.

## License

Proprietary. All rights reserved. See [LICENSE](./LICENSE) for details.
