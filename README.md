<div align="center">

# OneStopNews

**Topic-first news aggregation with source-cited AI summaries.**

[![Next.js](https://img.shields.io/badge/Next.js-%E2%89%A516.2.6-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
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
| **Web Framework** | Next.js | ≥16.2.6 | App Router, PPR, Cache Components, `proxy.ts` |
| **UI Runtime** | React | 19.2 (stable) | View Transitions, `<Activity>` for zero-shift summary loading |
| **Language** | TypeScript | 5.x (Strict) | Zero `any`. Type inference preferred. |
| **Styling** | Tailwind CSS | v4 | Utility-first with `@theme` tokens. CSS Subgrid for feed alignment. |
| **Components** | Shadcn UI + Radix | Latest | Accessible primitives, wrapped for bespoke aesthetic. No custom rebuilds. |
| **ORM** | Drizzle ORM | Latest | TypeScript-native, SQL-fluent, lazy proxy connection pattern. |
| **Validation** | Zod | 3.x | Schema-first, composable. Enforces AI output constraints. |
| **Auth** | Auth.js | 5.0.0-beta.31 | HttpOnly session cookies, Drizzle adapter. Pinned exact beta. Next-auth aligns with `@auth/drizzle-adapter` on `@auth/core@0.41.2`. |
| **Database** | PostgreSQL | 17 | Primary datastore. GIN FTS + `ts_rank_cd` BM25. |
| **Search** | `tsvector` + `ts_rank_cd` | Built-in | BM25 relevance ranking natively in Postgres. `pg_trgm` for autocomplete. |
| **Job Queue** | BullMQ | 5.x | Job graphs (Flows), priorities, built-in monitoring dashboard. |
| **Queue Backend** | Redis (Upstash) | 7.x | AOF persistence, `noeviction`, `maxRetriesPerRequest: null`. |
| **Worker Runtime** | Node.js | 24 LTS ("Krypton") | BullMQ-native. LTS through April 2028. |
| **AI (Primary)** | Claude 4.5 Haiku | `claude-haiku-4-5` | $1/$5 per M tokens. Best cost/quality for news summarisation. |
| **AI (Fallback)** | GPT-5 Mini | `gpt-5-mini` | Validated cost/quality fallback model. |
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
onestopnews-web/
├── 📄 proxy.ts                  ← Network boundary (Layer 0): cookie check + redirect only
├── 📄 next.config.ts            ← Cache Components, cacheLife profiles, Turbopack, experimental flags
├── 📄 drizzle.config.ts         ← Drizzle kit: schema path, migration output
│
├── 📂 app/                      ← Next.js App Router (Layer 1)
│   ├── 📄 layout.tsx            ← Root layout: fonts, providers. No data fetching.
│   ├── 📂 (public)/             ← Unauthenticated routes
│   │   ├── 📄 page.tsx          ← / — 10-section landing page (Phase 10)
│   │   │   ├── NewsTicker       ← Animated breaking headlines marquee
│   │   │   ├── Masthead         ← Edition bar, wordmark, live badge
│   │   │   ├── LeadStory        ← 7:5 grid hero with breaking badge
│   │   │   ├── Feed             ← Article card grid (PPR)
│   │   │   ├── AI Nutrition     ← Transparency panel for AI summaries
│   │   │   ├── Stats            ← Trust indicators (247, 1.2M, 450K)
│   │   │   ├── FAQ              ← Accordion with 6 Q&A items
│   │   │   └── Newsletter       ← Email signup CTA
│   │   ├── 📂 topics/[category]/← /topics/:category — PPR + Cache Component
│   │   ├── 📂 topics/[category]/← /topics/:category — PPR + Cache Component
│   │   ├── 📂 article/[id]/     ← /article/:id — Fully dynamic (summary status)
│   │   └── 📂 search/           ← /search — Full-text search (Phase 6)
│   ├── 📂 (admin)/              ← Protected admin routes
│   │   ├── 📄 layout.tsx        ← Admin layout: verifies session via auth()
│   │   ├── 📂 sources/          ← /admin/sources — Source management (Phase 6)
│   │   └── 📂 summaries/        ← /admin/summaries — Summary review (Phase 6)
│   └── 📂 api/                  ← Route Handlers: public HTTP API
│       ├── 📂 articles/         ← GET /api/articles (feed + search, Phase 6)
│       └── 📂 summarize/[id]/   ← POST /api/summarize/:id (enqueue only)
│
├── 📂 features/                 ← Feature modules (Layer 2)
│   ├── 📂 feed/
│   │   ├── 📂 components/       ← Feed.tsx, ArticleCard.tsx, TopicNav.tsx, **NewsTicker.tsx**, **Masthead.tsx**, **LeadStory.tsx**, **Stats.tsx**, **FAQ.tsx**, **Newsletter.tsx**
│   │   ├── 📂 ai/               ← AI NutritionLabel.tsx (transparency panel)
│   │   ├── 📂 stats/            ← Stats.tsx (trust indicators)
│   │   ├── 📂 faq/              ← FAQ.tsx (accordion)
│   │   ├── 📂 newsletter/       ← Newsletter.tsx (email CTA)
│   │   ├── 📄 queries.ts        ← Drizzle queries with explicit sources JOIN
│   │   └── 📄 actions.ts        ← Server Actions: savePreference, setFavoriteCategory
│   ├── 📂 summaries/
│   │   ├── 📂 components/       ← NutritionLabel.tsx, SummaryPanel.tsx, DisclosureBadge.tsx
│   │   └── 📄 actions.ts        ← Server Action: requestSummary
│   └── 📂 search/               ← (Phase 6)
│       ├── 📂 components/       ← SearchBar.tsx (client), SearchResults.tsx (RSC)
│       ├── 📄 queries.ts          ← FTS query builder (tsvector + ts_rank_cd BM25)
│       └── 📄 types.ts            ← SearchResult, SearchPage, SearchParams
│
├── 📂 domain/                   ← Pure domain logic (Layer 3)
│   ├── 📂 articles/normalize.ts ← URL normalization, content hashing
│   └── 📂 ranking/score.ts      ← Importance scoring formula
│
├── 📂 lib/                      ← Infrastructure integrations (Layer 4)
│   ├── 📂 db/
│   │   ├── 📄 index.ts          ← Lazy Proxy DB client (defers connection to first query)
│   │   ├── 📄 schema.ts         ← Complete Drizzle schema: users, articles, summaries, sources, etc.
│   │   └── 📄 seed.ts           ← Database seed script (Phase 10): sample articles, categories, sources
│   ├── 📂 queue/
│   │   └── 📄 index.ts          ← BullMQ Queue instances (producer side)
│   ├── 📂 ai/
│   │   ├── 📄 prompts.ts        ← Prompt templates with Zod response schemas
│   │   └── 📄 provenance.ts     ← 3-layer AI provenance generator (JSON-LD + HTTP header + meta)
│   └── 📂 auth/
│       ├── 📄 index.ts          ← Auth.js v5 server instance
│       └── 📄 dal.ts            ← Data Access Layer: verifySession(), verifyAdminSession()
│
└── 📂 shared/
    ├── 📂 components/           ← Shadcn UI wrapped for bespoke "Editorial Dispatch" aesthetic
    └── 📂 hooks/
        ├── 📄 useDebounce.ts    ← 300ms debounce for search input
        └── 📄 useReducedMotion.ts ← MediaQueryList API for prefers-reduced-motion
```

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

# Terminal 2 — Worker service
pnpm worker:dev
```

### 6. Verify setup

| Check | Expected |
| :--- | :--- |
| `curl http://localhost:3000` | HTML response with PPR shell |
| `curl http://localhost:3000/api/articles?category=tech` | JSON array of articles with `source` objects |
| `curl "http://localhost:3000/api/articles?q=AI+regulation"` | JSON array of search results with `rank` |
| `curl http://localhost:3000/api/health` | `{ status: "ok", ... }` |
| BullMQ dashboard at `http://localhost:3001` | Active queues: `ingest`, `summarize`, `score` |
| `pnpm tsc --noEmit` | Zero type errors |
| `pnpm test` | All tests pass |

---

## Environment Variables

```bash
# ── Database ──────────────────────────────────────────────
DATABASE_URL=postgresql://user:pass@localhost:5432/onestopnews
# Connection pooler URL for serverless (PgBouncer / Supavisor)
# DATABASE_URL_UNPOOLED=postgresql://user:pass@localhost:5432/onestopnews

# ── Redis ─────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ── Authentication (Auth.js v5) ───────────────────────────
AUTH_SECRET=  # Generate with: openssl rand -base64 33
AUTH_URL=http://localhost:3000  # Production: your canonical URL

# ── AI Models ─────────────────────────────────────────────
ANTHROPIC_API_KEY=             # Claude 4.5 Haiku (primary)
OPENAI_API_KEY=                # GPT-5 Mini (fallback)

# ── Web Push (VAPID) ──────────────────────────────────────
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@onestopnews.com

# ── Observability (Optional) ──────────────────────────────
SENTRY_DSN=
AXIOM_TOKEN=
```

---

## API Reference

| Endpoint | Method | Auth | Description |
| :--- | :--- | :--- | :--- |
| `/api/articles` | `GET` | Public | Feed articles with cursor pagination. Query: `?category=tech&cursor=2026-06-10T12:00:00Z` |
| `/api/articles` | `GET` | Public | Full-text search. Query: `?q=AI+regulation&category=tech` |
| `/api/summarize/[id]` | `POST` | Session | Enqueue summarisation job for article `id`. Returns `202` with job ID. |
| `/admin/sources` | `GET` | Admin | Source management dashboard. |
| `/admin/sources` | `POST` | Admin | Add new RSS/Atom/JSON feed source. |
| `/admin/summaries` | `GET` | Admin | Summary review queue for flagged content. |

**Public API Response Shape:**
```json
{
  "articles": [...],
  "nextCursor": "2026-06-10T12:00:00Z",
  "hasNextPage": true
}
```

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

## Security & Compliance

| Concern | Posture |
| :--- | :--- |
| **Next.js version** | Pinned to ≥16.2.6. Mitigates CVE-2025-55182 (React2Shell RCE) and 13-advisory DoS/SSRF bundle. |
| **AI Disclosure** | 3-layer machine-readable: JSON-LD + HTTP header + HTML meta. C2PA explicitly rejected (no text standard exists). EU AI Act Art. 50 compliant. |
| **Authentication** | Auth.js v5 with HttpOnly session cookies. No JWT tokens in localStorage. |
| **Network boundary** | `proxy.ts` provides optimistic UX redirects. Real auth enforcement in `(admin)/layout.tsx`. |
| **Content availability guard** | `contentAvailabilityEnum` prevents AI summarisation of `title_only` or `excerpt` articles — eliminating fabrication risk. |
| **Push key encryption** | VAPID keys encrypted at rest with AES-256-GCM. |
| **Accessibility** | WCAG AAA focus indicators (`focus-visible:ring-dispatch-ember`). `prefers-reduced-motion` disables all animations entirely. |
| **DB connections** | Eager connection with graceful fallback when `DATABASE_URL` is unavailable at build time. `max: 10` pool for dedicated runtimes; serverless requires PgBouncer/Supavisor. |

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

**Lesson**: The `/api暴晒/api/articles` endpoint must include CORS headers (`Access-Control-Allow-Origin: *`) for external consumers. Always include an `OPTIONS` handler.

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

---

## Recommendations

1. **Auth.js Stable Release**: Monitor `authjs.dev` for stable v5 release. Remove `as any` casts and eslint-disable comments when adapter types are fixed.

2. **Serverless Build Strategy**: For Vercel/Cloudflare Pages builds, inject a dummy `DATABASE_URL` at build time (e.g., via `NEXT_PUBLIC_DATABASE_URL` or build environment variables) to prevent connection errors. Replace with real connection at runtime.

3. **ESLint Config**: Consider migrating to `@next/eslint-plugin-next` directly once it supports flat config natively.

4. **Dependency Monitoring**: Regularly run `pnpm outdated` and `pnpm why @auth/core` to catch version mismatches early.

5. **AI Model Evaluation**: Monitor summarisation quality across models. Claude 4.5 Haiku is primary, GPT-5 Mini is fallback. Consider adding a quality scoring metric to the `summaries` table for model comparison.

6. **Zod Schema Evolution**: As LLM capabilities improve, schema constraints may need adjustment. Keep the Zod schema and tests version-controlled. Changes to `summaryText` min/max lengths or `keyPoints` count should be accompanied by new tests.

7. **Provenance Verification**: Periodically verify all three provenance layers (JSON-LD, HTTP header, meta tag) are correctly generated and conform to EU AI Act Art. 50 requirements. Consider automating this in CI.

8. **testSuite Growth**: Phase 5 added 47 tests; Phase 6 added 4 tests; Phase 7 added 21 tests. Current total: 124+ tests across 24 suites. Monitor test duration — if it exceeds 15s, investigate slow tests.

9. **BM25 Search Tuning**: The `ts_rank_cd('{0.1, 0.2, 0.4, 1.0}', ...)` weights may need adjustment based on real user queries. Consider A/B testing different weight configurations.

10. **Rate Limiting Implementation**: The `/api/articles` endpoint currently has no rate limiting. Implement Redis-based burst limiting in Phase 9 (e.g., max 20 req/s per IP, burst 50). The `ioredis` package is already a dependency.

11. **CI Pipeline Monitoring**: Monitor GitHub Actions pipeline duration. If it exceeds 10 minutes, investigate slow steps (likely `npx playwright install --with-deps`).

12. **Docker Image Size**: Monitor Docker image sizes. If the web image exceeds 500MB, investigate `node_modules` pruning or multi-stage build optimization.

13. **Lighthouse CI Budgets**: Start with conservative budgets (Perf ≥ 90, A11y ≥ 95) and tighten as the app matures. PPR helps with performance but heavy AI components can slow LCP.

14. **Blocking Route Prevention**: In Next.js 16 with `cacheComponents: true`, always wrap database queries in `<Suspense>` with a fallback UI (e.g., `FeedSkeleton`). Never `await` data fetches directly in the main page component body — this triggers the `blocking-route` error.

---

## Outstanding Issues & Future Work

### No Rate Limiting on Public API (Known Gap — Phase 9)

**Impact**: Medium — The `GET /api/articles` endpoint currently has no rate limiting. A malicious or buggy client could make many requests, consuming database connections and compute.

**Planned Fix**: Phase 9 will implement Redis-based rate limiting (e.g., max 20 req/s per IP via `ioredis` token bucket).

**Mitigation**: The endpoint is public (no auth required) and returns cached data. Monitor server metrics and alert on anomalies.

### Summarisation Worker AI Integration (Phase 9)

**Impact**: High — Phase 7 built the worker infrastructure (entry point, scheduler, queue definitions), but the actual `summarize.ts` worker that calls Anthropic/OpenAI is a stub returning placeholder data.

**Status**: The `summarizeQueue` is defined and jobs are enqueued correctly. The worker infrastructure is ready. Integration with Vercel AI SDK (Anthropic/OpenAI) is deferred to Phase 9.

### Test Flakiness Risk

**Impact**: Low — `useOptimistic` tests may be timing-sensitive due to React's internal batching and transition scheduling.

**Mitigation**: Tests already wrap `useOptimistic` calls in `act()` and await transitions. If flakiness appears, consider mocking `startTransition` or using `@testing-library/react`'s `waitFor` with longer timeout.

---

## Project Status

| Phase | Status | Key Deliverables |
| :--- | :--- | :--- |
| **Phase 1** — Foundation & Configuration | **COMPLETE** | next.config.ts, proxy.ts, tsconfig.json, docker-compose |
| **Phase 2** — Database Schema & Infrastructure | **COMPLETE** | Drizzle schema (10 tables), lazy DB client, Auth.js v5, BullMQ queues |
| **Phase 3** — Design System & Shared Components | **COMPLETE** | Button, Badge, Skeleton, Header, Footer, useDebounce, useReducedMotion, PageTransition |
| **Phase 4** — Core Feed Feature | **COMPLETE** | Domain layer, feed queries, FeedGrid, ArticleCard, home/topic/article routes |
| **Phase 5** — AI Summarisation Pipeline | **COMPLETE** | Zod schema, prompts, 3-layer provenance, NutritionLabel, SummaryPanel, actions, API endpoint |
| **Phase 6** — Search, Admin & Public API | **COMPLETE** | FTS search with BM25 (`ts_rank_cd`), admin routes (`/admin/sources`, `/admin/summaries`), public REST API (`/api/articles`), 103+ tests |
| **Phase 7** — Worker Service, Push & Observability | **COMPLETE** | 4 BullMQ workers, scheduler, content guard, AES-256-GCM push encryption, DST-safe quiet hours, cache invalidation, push subscribe API (124 tests, 24 suites) |
| **Phase 8** — Testing, CI/CD & Deployment | **COMPLETE** | GitHub Actions CI/E2E pipelines, multi-stage Dockerfiles (web + worker), docker-compose.prod.yml, Lighthouse CI, Vitest coverage thresholds, deployment script |

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
    setDate(new Date().toLocaleDateString("en-GB",犯罪行为", "month": "long", "year": "numeric" }));
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

## License

Proprietary. All rights reserved. See [LICENSE](./LICENSE) for details.
