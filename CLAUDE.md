# OneStopNews

**Topic-first news aggregation with source-cited AI summaries.**

A Next.js 16 + React 19.2 application backed by PostgreSQL 17, BullMQ v5 on Redis, and a separate Node.js 24 LTS worker service. The "Editorial Dispatch" design system uses Newsreader + Instrument Sans + Commit Mono with CSS Subgrid for feed alignment. Every AI summary carries a 3-layer machine-readable provenance disclosure (JSON-LD + HTTP header + HTML meta tag) for EU AI Act Article 50 compliance.

**Authoritative Sources:** `Project_Architecture_Document_v4.5.md` | `Project_Requirements_Document_v4.3.md` | `README.md`

---

## Foundational Principles

### 1. The Meticulous Approach (Mandatory for All Tasks)

Follow this six-phase workflow for every implementation:

1. **ANALYZE** — Deep requirement mining. Identify explicit, implicit, and edge-case needs. Explore multiple approaches. Assess risks.
2. **PLAN** — Structured execution roadmap. Present for explicit user confirmation before writing code.
3. **VALIDATE** — Obtain user approval. Address concerns. Never proceed without alignment.
4. **IMPLEMENT** — Modular, tested, documented builds. Use library components before custom ones.
5. **VERIFY** — Rigorous QA against success criteria. Test edge cases, accessibility (WCAG AAA), and performance.
6. **DELIVER** — Complete handoff with instructions, documentation, and next steps.

### 2. OneStopNews-Specific Principles

| Principle | Rationale |
| :--- | :--- |
| **Library Discipline** | If Shadcn UI / Radix provides the primitive, use it. Wrap for bespoke styling. Never rebuild from scratch. |
| **Single Source of Truth** | The Drizzle schema is the only source of truth for database types. Types derive from schema, not hand-written. |
| **Opt-In Caching** | Next.js 16 makes caching opt-in via `"use cache"`. Everything is dynamic by default. Don't cache without explicit intent. |
| **Progressive Enhancement** | View Transitions are progressive. They silently degrade on Firefox / reduced-motion. Never rely on them for core functionality. |
| **Zero `any`** | TypeScript strict mode, always. Prefer `unknown` over `any`. Use type inference; explicit types on public APIs only. |
| **Auth at the DAL** | `proxy.ts` is UX-only (optimistic redirect). Real authorization lives in `verifySession()` / `verifyAdminSession()`. |
| **Content Guard** | Never enqueue summarisation for `title_only` or `excerpt` articles. This prevents AI hallucination. |

---

## Implementation Standards

### TypeScript

```ts
// Prefer interface for object shapes
interface ArticleCardProps { title: string; }

// Prefer type for unions / intersections
type FeedType = 'rss' | 'atom' | 'json_api';

// Use early returns (guard clauses)
function processData(data: unknown) {
  if (!data) return null;
  if (typeof data !== 'object') throw new Error('Expected object');
  // Happy path
}

// Never use `any`. Prefer `unknown` with type guards.
function handle(input: unknown) {
  if (typeof input === 'string') return input.toUpperCase();
  return null;
}
```

- **`strict: true`** — non-negotiable.
- **`noUncheckedIndexedAccess: true`** — catches `arr[i]` returning `T | undefined`.
- **`interface` > `type`** for structural definitions. `type` for unions / intersections.
- **Early returns** over deeply nested conditionals.
- **Composition over inheritance** — no class hierarchies.
- **Avoid explicit return types** unless the function is a public API boundary.
- **No `enum` or `namespace`** — use string unions and ES modules instead.
- **`import type` for type‑only imports** — required when `verbatimModuleSyntax` is enabled.

### Next.js 16 App Router

- **Server Components by default.** Use `'use client'` only for interactivity.
- **Async `params` / `searchParams`** are `Promise<T>`. Always `await` them.
- **`cookies()` is async** — always `await` before calling `.get()`.
- **No data fetching in Layouts.** Fetch in Pages.
- **Route Handlers** (`app/api/.../route.ts`) for public HTTP endpoints. Server Actions for mutations.
- **`proxy.ts`** (not `middleware.ts`) is the network boundary. Cookie check + redirect only.

### Critical Configuration (verified positions)

| Flag | Placement | What Breaks if Wrong |
| :--- | :--- | :--- |
| `cacheComponents: true` | **Top-level** | Every `"use cache"` silently ignored. Zero caching. |
| `cacheLife: { stale, revalidate, expire }` | **Top-level** | `cacheLife('feed')` throws runtime — profile missing. |
| `turbopack: {}` | **Top-level** | Ignored or causes a config warning. |
| `experimental.viewTransition` | **Inside `experimental: {}`** | Transitions silently disabled. |
| `experimental.ppr` | **DO NOT INCLUDE** | Build error in Next.js 16 — removed entirely. |
| `experimental.dynamicIO` | **DO NOT INCLUDE** | Deprecated — replaced by `cacheComponents`. |

### Drizzle ORM & Database

- **Lazy Proxy Connection:** `lib/db/index.ts` defers connection until first query. Prevents build-time crashes.
- **Migrations:** `drizzle-kit generate` + `migrate`. **Never `push`** in production.
- **All queries via `queries.ts`** in the relevant feature module. No raw Drizzle calls in components.
- **Service Factory Pattern:** Encapsulate database queries in factory functions. Never call `db` directly in pages or server actions.

### Authentication & Authorization (Auth.js v5)

```ts
// lib/auth/dal.ts — The only correct pattern
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { auth } from './index';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const verifySession = cache(async () => {
  const session = await auth();
  if (!session?.user?.email) redirect('/sign-in');
  // ... fetch user, check role
});
```

- **`redirect()` not `throw new Error()`** in Server Components.
- **`cache()` from `react`** memoizes per-request.
- **Beta pin:** Auth.js v5 is pinned to `5.0.0-beta.31` with `@auth/core@0.41.2`. Monitor `authjs.dev` for stable release.

### Design System — "Editorial Dispatch"

| Role | Typeface | Weight | Usage |
| :--- | :--- | :--- | :--- |
| Headlines | Newsreader (variable) | 800 | `font-editorial` — `leading-tight`, `tracking-[-0.02em]` |
| UI / Body | Instrument Sans (variable) | 400–600 | `font-ui` — `leading-relaxed` |
| Metadata | Commit Mono | 400 | `font-mono` — `uppercase`, `tracking-widest`, `text-[10px]` |

**Color Contract:**
- `ink-900 (#1a1a18)` — headings
- `ink-600 (#3d3d3a)` — body text (WCAG AAA on `paper-50`)
- `ink-300 (#8a8a83)` — muted / metadata
- `paper-50 (#fafaf8)` — page background
- `paper-100 (#f2f2ee)` — card surface
- `dispatch-ember (#c7513f)` — breaking news, AI badge, focus rings
- `dispatch-slate (#5a6b7a)` — tech / neutral accent

**CSS Subgrid Feed:**
- Parent defines columns with `gap-x` only.
- Each `ArticleCard`: `grid grid-rows-subgrid row-span-3`.
- Last card in column: `last:mb-0`.

---

## Development Workflow

### Prerequisites
- **Node.js** ≥24 LTS
- **pnpm** ≥9.x
- **PostgreSQL** ≥17
- **Redis** ≥7.x

### Setup Commands
```bash
pnpm install
cp .env.example .env.local
# Edit .env.local — all required vars validated by Zod at src/lib/env/index.ts
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
pnpm dev              # Next.js (Turbopack)
pnpm worker           # Worker service (BullMQ + RSS ingestion + AI summarization)
pnpm db:seed          # Seed sample data (idempotent)
```

### Build & Quality Commands
| Command | Purpose |
| :--- | :--- |
| `pnpm dev` | Next.js dev server with Turbopack |
| `pnpm worker` | Worker service (BullMQ consumers + RSS + AI) |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint (`--max-warnings 0`) |
| `pnpm check` | `tsc --noEmit && pnpm lint` (combined gate) |
| `pnpm tsc --noEmit` | TypeScript strict check |
| `pnpm test` | Run all test suites (vitest run) |
| `pnpm test:watch` | Vitest in watch mode |
| `pnpm test:e2e` | Playwright E2E tests |
| `pnpm drizzle-kit generate` | Generate migration SQL from schema |
| `pnpm drizzle-kit migrate` | Apply pending migrations |
| `pnpm db:seed` | Seed sample articles/categories/sources |
| `pnpm db:studio` | Drizzle Studio (DB GUI) |
| `pnpm format` | Prettier write |
| `pnpm format:check` | Prettier check |

### Pre-Commit Gate
```bash
pnpm check          # tsc --noEmit && pnpm lint
pnpm test
```

---

## Testing Strategy

| Category | Tool | Target |
| :--- | :--- | :--- |
| Unit | Vitest | Domain logic, utilities, Zod parsing |
| Integration | Vitest + Docker | Drizzle queries, BullMQ jobs |
| E2E | Playwright | Critical user journeys |
| A11y | axe-core + Playwright | WCAG 2.1 AAA |

---

## Code Quality Standards

- **Zero `any`** — use `unknown` with type guards.
- **`interface` > `type`** for structural definitions.
- **No `enum` / `namespace`** — string unions only.
- **`import type` for type‑only imports**.
- **All UI states** — loading, error, empty, success.

---

## Anti-Patterns to Avoid

| Anti-Pattern | Why Forbidden | Replacement |
| :--- | :--- | :--- |
| `any` in TypeScript | Breaks strict mode contract | `unknown` + type guards |
| `enum` / `namespace` | Compile to runtime IIFE/closure | String unions + ES modules |
| Custom component over Shadcn | Violates Library Discipline | Shadcn UI / Radix primitive |
| `throw new Error()` in RSC auth | Triggers full-page error boundary | `redirect('/sign-in')` |
| `drizzle-kit push` in production | Overwrites schema without history | `generate` + `migrate` only |
| Summarising `title_only` / `excerpt` | AI hallucination risk | Content availability guard |
| `new Date()` in Server Component | Prerender non-deterministic; Next.js 16 blocks it with `next-prerender-current-time` | Move to Client Component with `useEffect`, or wrap in `<Suspense>` |
| `new Date()` in Client Component without `<Suspense>` | Prerender still fails; client needs Suspense boundary | Wrap Client Component in `<Suspense>` |
| `.reveal` class on above-the-fold elements | Hydration mismatch: server renders `reveal`, client wants `reveal visible` | Only use `.reveal` for below-the-fold elements |
| Merge artifact in CSS (e.g. ` INCLUDED`) | Corrupts Tailwind v4 `@theme` block, poisoning entire theme | Review diffs after merge; run `pnpm build` before pushing |
| Corrupted className (e.g. `font浃着`, `Monad`) | Invalid CSS class silently ignored; element falls back to wrong font | Review CSS class strings after edits; use `font-mono` consistently |
| Admin auth in `proxy.ts` | Layer 0 has no DB access | `verifyAdminSession()` in `(admin)/layout.tsx` |
| `pg_textsearch` extension (PG 17) | Doesn't exist; `ts_rank_cd` is built-in | Use `ts_rank_cd` directly |
| `revalidateTag` in workers | Next.js-only API, not available in Node.js | Use Redis pub/sub for cache invalidation |
| `as any` with Drizzle `.with()` | Type inference broken for relational queries | Use explicit `.innerJoin()` instead |
| Direct `await` of DB query in page | Blocks page render in Next.js 16 with `cacheComponents` | Wrap in `<Suspense>` with Server Component |
| Missing `@tailwindcss/postcss` plugin | Tailwind v4 generates zero utility classes — only `@theme` custom properties | Install `@tailwindcss/postcss` + create `postcss.config.mjs` |
| `next/font/google` for Commit Mono | Not available on Google Fonts | Use `next/font/local` with woff2 file |
| Stale `.next/` cache after config change | Serves pre-fix CSS; masks the fix | Always `rm -rf .next/` after PostCSS/Tailwind/Next.js config changes |
| FNV-1a hash for `contentHash` (Phase 13) | 8-char hash is not collision-resistant; doesn't match PAD §7.1 SHA-256 spec | Use `node:crypto` `createHash("sha256")` returning 64-char hex |
| `parseFeed` stub returning `[]` (Phase 13) | Ingestion pipeline produces zero articles; system appears healthy but never ingests | Use real `rss-parser` implementation in `src/workers/jobs/parseFeed.ts` |
| `callAISummary` stub returning placeholder (Phase 13) | Summaries contain fake data; no real AI call | Use Vercel AI SDK `generateObject()` in `src/workers/jobs/summarize.ts` |
| Individual `scoreQueue.add()` per article (Phase 13) | Not atomic; cache invalidation can fire before all scoring completes | Use `enqueuePostIngestFlow()` FlowProducer atomic DAG |
| `new Redis()` per cache invalidation call (Phase 13) | Connection churn under high ingest load (50 workers × N calls) | Module-level singleton publisher |
| Missing env vars in CI (Phase 13) | `src/lib/env/index.ts` validates at module load; breaks ALL CI steps including lint | Set all 11 required env vars in `ci.yml` `env:` block with CI-safe dummy values |
| `??=` for test env vars (Phase 13) | Shell env may contain values that fail Zod schema (e.g., SQLite `DATABASE_URL`) | Use direct `=` assignment in `src/test/setup.ts` |
| `vi.fn(() => mockInstance)` for constructors | `new` on vi.fn returns empty object, ignoring return value | Use `class MockX { ... }` in the mock factory |
| `clientSegmentCache` flag (Next.js 16.2.9) | Not in `ExperimentalConfig` type; produces `TS2353` | Document as deferred in `next.config.ts`; re-enable when upstream type includes it |
| `hashContent` without body (Phase 14) | Content-only updates (same title+date, different body) silently dropped | Include body in SHA-256: `hashContent(title, body, publishedAt)` |
| Leftmost `x-forwarded-for` IP behind CDN (Phase 14) | Spoofable — attacker can bypass rate limiting | Use `TRUSTED_PROXY=true` env var to switch to rightmost IP |
| `keys: { p256dh: encryptedEnvelope, auth: "encrypted" }` (Phase 14) | Semantically misleading schema convention | Use dedicated `encryptedKeys` text column |
| `summaryStatus: "none"` after all retries exhausted (Phase 14) | No observability — failed summaries invisible | Set `summaryStatus: "needs_review"` via `getSummaryFailureState()` |
| Hardcoded SHA-256 vector in test (Phase 14) | Brittle — fails if delimiter/date format changes | Property-based test: compute expected via `node:crypto` inline |
| E2E tests in vitest (Phase 14) | `@playwright/test` not installed in vitest env → import errors | Exclude `e2e/` from `vitest.config.ts`, `eslint.config.mjs`, `tsconfig.json` |
| `node:22-alpine` in Dockerfile (Phase 15) | Violates `package.json` `engines.node: ">=24.0.0"` — runtime crashes on Node 22-only APIs | Pin to `node:24-alpine` in all Dockerfiles |
| Missing `output: "standalone"` in `next.config.ts` (Phase 15) | `Dockerfile.web` copies `.next/standalone/` which doesn't exist → build fails | Add `output: "standalone"` top-level in `next.config.ts` |
| `Dockerfile.worker` referencing `worker:build` script (Phase 15) | Script doesn't exist — `pnpm run worker:build` fails | Run `tsx src/workers/index.ts` directly; copy `node_modules` + `src` to runner |
| `Dockerfile.worker` copying non-existent `dist/` (Phase 15) | No build step produces `dist/` — `COPY --from=builder /app/dist` fails | Don't compile the worker; run from `src/` via `tsx` |
| Malformed Dockerfile lines (`COPY . .RUN`) (Phase 15) | Missing newline between commands — Docker parses as single command, fails | Each `RUN`/`COPY`/`WORKDIR` must be on its own line |
| `Dockerfile.dev` copying `packages/` (Phase 15) | Directory doesn't exist (not a monorepo) — `COPY packages/ ./packages/` fails | Remove the `COPY packages/` line |
| Always-on OAuth providers (Phase 15) | Auth.js throws at boot if `CLIENT_ID`/`CLIENT_SECRET` env vars are missing | Make providers conditional via `buildProviders()` — only include when env vars present |
| Missing `/sign-in` page referenced in `pages.signIn` (Phase 15) | Auth.js silently accepts non-existent path; user redirected to 404 at runtime | Create `src/app/sign-in/page.tsx` + `SignInClient.tsx` |
| Missing `/auth-error` page referenced in `pages.error` (Phase 15) | Auth errors redirect to non-existent page → 404 | Create `src/app/auth-error/page.tsx` |
| `vi.fn()` for `global.fetch` without `vi.stubGlobal` (Phase 15) | Real `fetch` is called instead of mock — tests fail with network errors | Use `vi.stubGlobal("fetch", mockFetch)` in `beforeEach()` |
| Accessing `provider.id` without type narrowing (Phase 15) | `Provider` type is a union (object form + function form) — `TS2339` | Use `'id' in p ? p.id : "unknown"` narrowing |
| Direct `<FeedGrid>` rendering in `FeedData` (Phase 15) | No "Load More" pagination — users see only the initial 6 articles | Render `<FeedContainer>` which manages article list + load more state |

---

## Layer Model (Golden Rule)

```
Layer 0: proxy.ts           — Cookie check, redirect. NO DB. NO logic.
Layer 1: App Router           — Route structure, metadata, PPR, Suspense.
Layer 2: Feature Modules     — UI composition, data binding, mutations.
Layer 3: Domain Services      — Pure business logic. No framework imports.
Layer 4: Infrastructure       — Drizzle, BullMQ, Auth.js. Side effects only.
```

**Deviation from this order creates security and consistency bugs.**

---

## Phase Status (as of latest update)

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
| **Phase 10** — Landing Page & Design System | **COMPLETE** | 10-section landing page (NewsTicker, Masthead, LeadStory, AI Nutrition Label, Stats, FAQ, Newsletter), design system tokens (cat-label, btn-ember, animations), db:seed, test mocking |
| **Phase 11** — Landing Page Bug Fixes & SSR Remediation | **COMPLETE** | Fixed CSS merge artifact, added `.reveal` scroll animations, resolved `next-prerender-current-time` via client-side footer, fixed hydration mismatch, wrapped `Footer` in `Suspense`, converted `ArticleCard` to client component |
| **Phase 12** — Tailwind v4 PostCSS & Commit Mono Font Fix | **COMPLETE** | Installed `@tailwindcss/postcss@4.3.1`, created `postcss.config.mjs`, added Commit Mono woff2 via `next/font/local`, enhanced `.font-editorial` block, cleared `.next` cache |
| **Phase 13** — Critical Gaps Remediation | **COMPLETE** | Real RSS/Atom/JSON parser (`rss-parser`), real AI summarization (Vercel AI SDK: Anthropic primary + OpenAI fallback), `FlowProducer` atomic DAG, `/api/articles` cursor validation + Redis rate limiting (20 req/s per IP), `hashContent` SHA-256, `/api/categories` endpoint, `cacheInvalidation` singleton publisher, CI workflow fixed (Node 24 + all env vars), UI CSS class corruption fixes (`font浃着`→`font-mono`, `Monad`→`font-mono`), `accountablePerson.name` provenance fidelity, `body` column added to articles schema, content-change-detection upserts via `(xmax = 0)` trick |
| **Phase 14** — Validated Gaps Closure | **COMPLETE** | `hashContent` includes body (content-only updates detected), rate limiter `TRUSTED_PROXY` env var (rightmost IP for CDN), property-based `node:crypto` SHA-256 test, `pushSubscriptions.encryptedKeys` column (replaced misleading `keys.p256dh`), article detail page with real data + `SummaryPanel` + 3-layer provenance via `generateMetadata()`, Playwright config + 10 E2E tests, 8 pipeline integration tests, `getSummaryFailureState` (permanent failure → `needs_review`), `e2e/` excluded from vitest/ESLint/tsc (**251 tests across 45 suites** + 10 E2E) |
| **Phase 15** — Production Readiness (Dockerfiles, Load More, Drop keys, OAuth) | **COMPLETE** | Pinned Dockerfiles to `node:24-alpine` + `output: "standalone"` in `next.config.ts`; rewrote `Dockerfile.worker` to run `tsx src/workers/index.ts` directly (fixing malformed lines + non-existent scripts/paths); cursor-based "Load More" pagination (`FeedContainer` + `LoadMoreButton` client components); dropped deprecated `push_subscriptions.keys` column (migration `0005_neat_wolverine.sql`); added Google + GitHub OAuth providers (conditional on env vars, backward-compatible); created `/sign-in` + `/auth-error` pages (previously missing); added OAuth env vars to `env/index.ts` + `.env.example` + `src/test/setup.ts` + CI + `docker-compose.prod.yml` (**279 tests across 49 suites** + 10 E2E) |

---

## Latest Lessons Learned (Phase 6)

### 1. PostgreSQL FTS Extension Availability

**Issue**: `pg_textsearch` is NOT a separate extension in PostgreSQL 17. `ts_rank_cd()` and `to_tsvector` are built-in.

**Fix**: Only `pg_trgm` needs explicit installation. Use `ts_rank_cd` and `websearch_to_tsquery` natively via Drizzle `sql` template literals.

```typescript
import { sql } from "drizzle-orm";
const tsQuery = sql`websearch_to_tsquery('english', ${query})`;
const rank = sql<number>`ts_rank_cd('{0.1, 0.2, 0.4, 1.0}', ${articles.searchVector}, ${tsQuery})`;
```

### 2. Admin Route Guard — Correct Layer

**Issue**: Placing `verifyAdminSession()` in `proxy.ts` is wrong. `proxy.ts` is Layer 0 (network boundary, no DB access).

**Fix**: Guard admin routes at `(admin)/layout.tsx`:
```typescript
export default async function AdminLayout({ children }) {
  await verifyAdminSession(); // Redirects non-admins to '/'
  return <AdminShell>{children}</AdminShell>;
}
```

### 3. Search UI: Server/Client Component Split

**Issue**: Search needs both server-rendered initial results and client-side interactivity.

**Fix**: Use a Server Component page to fetch initial results, and a Client Component wrapper (`SearchPageClient`) for interactivity. The `SearchBar` is `'use client'`; `SearchResults` can be RSC.

### 4. `websearch_to_tsquery` vs `to_tsquery`

**Lesson**: `to_tsquery` does not handle user input safely. `websearch_to_tsquery` handles natural language queries, quoted phrases, and negation.

### 5. `pg_trgm` for Autocomplete

**Lesson**: `pg_trgm` is not enabled by default. Run `CREATE EXTENSION IF NOT EXISTS pg_trgm;` on database setup.

### 6. Cache Invalidation: Workers Cannot Use `revalidateTag()`

**Issue**: `revalidateTag()` is a Next.js-only API. Workers run in a separate Node.js process and cannot call it. Attempting to do so throws `TypeError: revalidateTag is not a function`.

**Fix**: Use Redis pub/sub for worker-to-web-app cache invalidation. Workers publish invalidation events to a Redis channel; the Next.js app subscribes and calls `revalidateTag()` locally.

**Phase 13 refinement**: The original implementation created a new Redis connection per call. Phase 13 refactored to a module-level singleton publisher to avoid connection churn under high ingest load:

```typescript
// src/workers/lib/cacheInvalidation.ts (Phase 13 singleton pattern)
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
  return _publisher;
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
    return false; // Best-effort: don't crash the worker
  }
}
```

### 7. Type Safety: `as any` Cast in Score Worker

**Issue**: Using `db.query.articles.findFirst({ with: { source: true } })` does not properly narrow the `source` type, forcing an `as any` cast to access `source.priority`.

**Fix**: Use explicit `innerJoin` for type-safe source data.

```typescript
// ❌ Before (type unsafe)
const article = await db.query.articles.findFirst({
  with: { source: true },
});
const priority = (article as any).source?.priority ?? 2; // Yuck

// ✅ After (type safe)
const rows = await db
  .select({ article: articles, source: sources })
  .from(articles)
  .innerJoin(sources, eq(articles.sourceId, sources.id))
  .where(eq(articles.id, articleId));
const row = rows[0];
if (!row) throw new Error('Article not found');
const priority = row.source.priority; // Fully typed
```

### 8. GitHub Actions YAML Syntax Errors

**Issue**: YAML files are extremely sensitive to indentation and special characters. A single bad quote or misplaced space can cause the entire workflow to fail silently or with cryptic errors.

**Fix**: Always validate YAML syntax before pushing:
```bash
# Install actionlint for local validation
brew install actionlint  # macOS
actionlint .github/workflows/ci.yml
```

### 9. Docker Multi-Stage Build Context

**Issue**: Docker build context includes the entire repo by default, which can be slow and include sensitive files.

**Fix**: Use `.dockerignore` to exclude `node_modules`, `.git`, `.env*`, and other unnecessary files.

### 10. Lighthouse CI Requires Production Build

**Issue**: Lighthouse CI cannot run against the development server. It requires a production build (`next build`) and a running server (`next start`).

**Fix**: The `lighthouserc.js` configuration uses `startServerCommand` to build and start the production server before auditing.

---

## Quick Reference: File Locations

| Component/Service | Path |
| :--- | :--- |
| Database Schema | `src/lib/db/schema.ts` |
| Lazy DB Client | `src/lib/db/index.ts` |
| Auth Configuration | `src/lib/auth/index.ts` |
| Auth DAL | `src/lib/auth/dal.ts` |
| Env Validation | `src/lib/env/index.ts` |
| BullMQ Queues | `src/lib/queue/index.ts` |
| FlowProducer DAG | `src/lib/queue/flows.ts` (Phase 13) |
| Rate Limiter | `src/lib/rateLimit.ts` (Phase 13) |
| Feed Queries | `src/features/feed/queries.ts` |
| Search Queries | `src/features/search/queries.ts` |
| Search Types | `src/features/search/types.ts` |
| Public API (Articles) | `src/app/api/articles/route.ts` |
| Public API (Categories) | `src/app/api/categories/route.ts` (Phase 13) |
| Health Check | `src/app/api/health/route.ts` |
| Push Subscribe | `src/app/api/push/subscribe/route.ts` |
| Admin Layout | `src/app/(admin)/layout.tsx` |
| Admin Sources | `src/app/(admin)/sources/page.tsx` |
| Admin Summaries | `src/app/(admin)/summaries/page.tsx` |
| Summarisation Schema | `src/features/summaries/lib/summariseSchema.ts` |
| AI Prompts | `src/lib/ai/prompts.ts` |
| Provenance Generator | `src/lib/ai/provenance.ts` |
| Summary Components | `src/features/summaries/components/*.tsx` |
| Next.js Config | `next.config.ts` |
| Proxy | `proxy.ts` |
| Worker Entry Point | `src/workers/index.ts` |
| RSS Feed Parser | `src/workers/jobs/parseFeed.ts` (Phase 13) |
| AI Summarization | `src/workers/jobs/summarize.ts` (Phase 13) |
| Job Scheduler | `src/workers/jobs/scheduler.ts` |
| Content Guard | `src/workers/jobs/determineContentAvailability.ts` |
| Content Hashing (SHA-256) | `src/domain/articles/normalize.ts` |
| Importance Scoring | `src/domain/ranking/score.ts` |
| Push Encryption | `src/lib/security/encrypt.ts` |
| Quiet Hours | `src/workers/push/isWithinQuietHours.ts` |
| Cache Invalidation | `src/workers/lib/cacheInvalidation.ts` |
| CI Pipeline | `.github/workflows/ci.yml` |
| E2E Pipeline | `.github/workflows/e2e.yml` |
| Web Dockerfile | `Dockerfile.web` |
| Worker Dockerfile | `Dockerfile.worker` |
| Production Compose | `docker-compose.prod.yml` |
| Lighthouse Config | `lighthouserc.js` |
| Deploy Script | `scripts/deploy.sh` |
| Feed Data (Suspense) | `src/features/feed/components/FeedData.tsx` |
| Feed Container (Load More) | `src/features/feed/components/FeedContainer.tsx` (Phase 15) |
| Load More Button | `src/features/feed/components/LoadMoreButton.tsx` (Phase 15) |
| Feed Skeleton | `src/features/feed/components/FeedSkeleton.tsx` |
| Landing Page | `src/app/(public)/page.tsx` |
| News Ticker | `src/shared/components/layout/NewsTicker.tsx` |
| Masthead | `src/shared/components/layout/Masthead.tsx` |
| Lead Story | `src/features/feed/components/LeadStory.tsx` |
| AI Nutrition Label | `src/features/summaries/components/NutritionLabel.tsx` |
| Stats Section | `src/shared/components/ui/StatsSection.tsx` |
| FAQ | `src/shared/components/ui/Accordion.tsx` |
| Newsletter CTA | `src/shared/components/ui/NewsletterCTA.tsx` |
| Reveal Provider | `src/shared/components/providers/RevealProvider.tsx` |
| DB Seed | `src/lib/db/seed.ts` |
| Global CSS | `src/app/globals.css` |
| PostCSS Config | `postcss.config.mjs` |
| Commit Mono Font | `public/fonts/commit-mono-400.woff2` |
| Test Setup | `src/test/setup.ts` |
| Vitest Config | `vitest.config.ts` |
| Article Detail Queries | `src/features/articles/queries.ts` (Phase 14) |
| Article Detail Component | `src/features/articles/components/ArticleData.tsx` (Phase 14) |
| Summary Failure State | `src/workers/jobs/summarizeFailure.ts` (Phase 14) |
| Pipeline Integration Test | `src/workers/pipeline.integration.test.ts` (Phase 14) |
| Push Subscribe Route | `src/app/api/push/subscribe/route.ts` |
| Playwright Config | `playwright.config.ts` (Phase 14) |
| E2E Smoke Tests | `e2e/smoke.spec.ts` (Phase 14) |
| Auth Providers Builder | `src/lib/auth/providers.ts` (Phase 15) |
| Sign-In Page | `src/app/sign-in/page.tsx` (Phase 15) |
| Sign-In Client Component | `src/app/sign-in/SignInClient.tsx` (Phase 15) |
| Auth Error Page | `src/app/auth-error/page.tsx` (Phase 15) |
| Migration 0005 (Drop keys) | `drizzle/0005_neat_wolverine.sql` (Phase 15) |

---

## Latest Lessons Learned (Phase 10)

### 1. Masthead Date Rendering — Server/Client Hydration Mismatch

**Issue**: Rendering `new Date()` or `new Date().toLocaleDateString()` directly in a Server Component causes a hydration mismatch because the server and client have different locales/timezones.

**Fix**: Use a Client Component wrapper for date/time display, or pass pre-formatted date strings from the server.

**Prevention**: Always wrap time-sensitive displays in `'use client'` or pass server-calculated strings as props.

### 2. Saved HTML Staleness Trap

**Issue**: Saved HTML snapshots (`*.html` files captured from the browser) can become stale quickly during active development.

**Fix**: When comparing static vs. dynamic pages, ALWAYS verify by checking the live server (`curl` or browser) before concluding that CSS/JS is broken.

**Prevention**: Label saved snapshots with timestamps. Prefer live verification over saved snapshots during active development.

### 3. next.config.ts remotePatterns for External Images

**Issue**: Using external image URLs without adding them to `next.config.ts` causes Next.js Image Optimization to fail with a security error.

**Fix**: Add all external image domains to `next.config.ts`:
```typescript
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};
```

### 4. Test Mocking for Browser-Only APIs

**Issue**: Tests using `useInView` (Intersection Observer) and `Intl.DateTimeFormat` fail in a headless environment.

**Fix**: Mock these APIs in `vitest.setup.ts` or test files.

**Prevention**: Check browser-only APIs before using them in testable components.

### 5. `new Date()` in Server Components (Next.js 16 `cacheComponents`)

**Issue**: Accessing `new Date()` in a Server Component during prerendering throws `next-prerender-current-time` in Next.js 16 with `cacheComponents: true`.

**Fix**: Move time-sensitive computation to a Client Component (`'use client'`) with `useEffect`, or compute from request headers (`headers().get('date')`).

```typescript
// ❌ Don't: Server Component with new Date()
export default function Page() {
  const year = new Date().getFullYear(); // ERROR during prerender
  return <Footer year={year} />;
}

// ✅ Do: Client Component computes its own year
"use client";
export function Footer() {
  const year = new Date().getFullYear(); // Safe: runs in browser
  return <footer>© {year}</footer>;
}
```

### 6. `new Date()` in Client Components Requires `<Suspense>` Boundary

**Issue**: Even when moved to a Client Component, `new Date()` still fails during prerendering unless the Client Component is inside a `<Suspense>` boundary.

**Fix**: Wrap the Client Component in `<Suspense>`:

```tsx
// ✅ page.tsx
<Suspense fallback={null}>
  <Footer />
</Suspense>
```

### 7. Scroll-Reveal Animations and SSR Hydration Mismatch

**Issue**: Applying `.reveal` class to above-the-fold elements causes hydration mismatch. Server renders `class="reveal"` but the client's `IntersectionObserver` (in `useEffect`) would add `.visible`, creating a mismatch.

**Fix**: Only use `.reveal` (and `RevealProvider`) for below-the-fold elements. Above-the-fold elements should be visible immediately.

**Implementation**:
- `globals.css`: Define `.reveal` (hidden) and `.reveal.visible` (shown) styles
- `RevealProvider.tsx`: Client Component with `useEffect` + `IntersectionObserver` that adds `.visible` when elements enter viewport
- Only apply `className="reveal"` to elements below the initial viewport
- For reduced-motion users: immediately reveal all (`prefers-reduced-motion: reduce`)

### 8. Merge Artifacts in CSS Can Poison Tailwind v4 `@theme`

**Issue**: A git merge can inject text (e.g. ` INCLUDED`) into CSS variable declarations, corrupting the entire `@theme` block.

**Example corruption**:
```css
@theme {
  --color-ink-600: #3d3 INCLUDED-500: #525250; /* BROKEN */
}
```

**Fix**: Regularly run `pnpm build` to catch CSS parsing errors early. Review all CSS diffs after merges.

### 9. Footer Year: Client-Side Computation Pattern

**Issue**: The footer copyright year needs to be current but cannot be computed server-side during prerender.

**Fix**: Convert `Footer` to a Client Component (`'use client'`) that computes `new Date().getFullYear()` internally. Remove `currentYear` prop from `FooterProps`. Wrap `<Footer />` in `<Suspense>` in page components.

## Previous Lessons Learned (Phase 9)

### Next.js 16 `blocking-route` Error — `cacheComponents` + `<Suspense>`

**Issue**: When `cacheComponents: true` is enabled in Next.js 16, any uncached data fetch (e.g., Drizzle query) outside of a `<Suspense>` boundary blocks the entire page from rendering, triggering the `blocking-route` error:

> "Route '/': Uncached data or `connection()` was accessed outside of `<Suspense>`. This delays the entire page from rendering, resulting in a slow user experience."

**Root Cause**: Next.js 16's opt-in caching model requires all asynchronous data fetching to be either:
1. Wrapped in `<Suspense>` to allow streaming the fallback UI immediately
2. Inside a Cache Component (`"use cache"`) with a `cacheLife` profile for static prerendering

**Fix**: Extract data fetching into a separate Server Component and wrap it in `<Suspense>`:

```tsx
// ✅ page.tsx — Correct pattern
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

// ✅ FeedData.tsx — Server Component that fetches data
export async function FeedData({ limit }: { limit: number }) {
  const feed = await getFeedArticles({ limit });
  return <FeedGrid articles={feed.articles} />;
}
```

**Anti-Pattern (DO NOT DO)**:
```tsx
// ❌ page.tsx — Direct await blocks the page
export default async function HomePage() {
  const feed = await getFeedArticles(); // BLOCKS the page!
  return <FeedGrid articles={feed.articles} />;
}
```

**Key Rule**: In Next.js 16 with `cacheComponents: true`, **never `await` a database query directly in a page component**. Always use the `<Suspense>` + Server Component pattern.

---

## Contact & Maintenance

- **Maintained by**: Senior Engineering, Tech Leads, DevOps
- **Authoritative Sources**: `Project_Architecture_Document_v4.5.md` | `Project_Requirements_Document_v4.3.md` | `README.md`
- **Last Updated**: June 18, 2026
- **Total Tests**: 279 across 49 suites + 10 Playwright E2E (Phase 15)
- **Quality Gate**: `pnpm check` (tsc --noEmit + ESLint --max-warnings 0) + `pnpm test` (vitest run) — all green

---

## Latest Lessons Learned (Phase 12)

### 1. Missing `@tailwindcss/postcss` — Zero Utility Classes

**Issue**: Tailwind CSS v4 requires `@tailwindcss/postcss` as a PostCSS plugin. Without `postcss.config.mjs`, `@import "tailwindcss"` is treated as plain CSS — `@theme` custom properties render but no utility classes are generated from template class usage. Compiled CSS is ~16KB instead of hundreds of KB.

**Fix**: `pnpm add -D @tailwindcss/postcss@4.3.1` + create `postcss.config.mjs` with `{ plugins: { '@tailwindcss/postcss': {} } }`.

**Prevention**: If utility classes are missing, check `postcss.config.*` first. Clear `.next/` after adding.

### 2. Commit Mono Requires `next/font/local`

**Issue**: Commit Mono is not on Google Fonts. `next/font/google` cannot load it.

**Fix**: Use `next/font/local` with a woff2 file extracted from `@fontsource/commit-mono`:

```tsx
import localFont from "next/font/local";
const commitMono = localFont({
  src: "../../public/fonts/commit-mono-400.woff2",
  variable: "--font-mono",
  weight: "400",
  display: "swap",
});
```

### 3. `.next` Cache Must Be Cleared After Config Changes

**Issue**: After creating `postcss.config.mjs`, stale `.next/` cache serves pre-fix CSS.

**Fix**: `rm -rf .next/` then restart dev server. Make this a reflex for any PostCSS/Tailwind/Next.js config change.

### 4. `.font-editorial` Needs Explicit Weight + Tracking

**Issue**: `next/font/google` only applies the font family. The display weight (800), tight leading (1.1), negative tracking (-0.02em), and OpenType features must be specified separately.

**Fix**: Added enhancement block in `globals.css`:
```css
.font-editorial { font-weight: 800; line-height: 1.1; letter-spacing: -0.02em; text-rendering: optimizeLegibility; font-feature-settings: "ss01", "ss02"; }
```

**Redundancy**: Since `.font-editorial` bakes in weight 800, leading 1.1, and tracking -0.02em, do NOT add `font-[800]`, `leading-tight`, or `tracking-[-0.02em]` alongside `font-editorial`. Only add overrides for different values (e.g., `tracking-[-0.03em]`, `font-[700]`, `leading-[1.05]`).

---

## Latest Lessons Learned (Phase 13)

### 1. `rss-parser` Field Conflation

**Issue**: `rss-parser` conflates `<content:encoded>`, `<description>`, and `<content>` into its built-in `content` field. You cannot distinguish "body" from "excerpt" using `content` alone.

**Fix**: Read fields explicitly by feed type. Detect Atom via raw XML root element (`<feed>`), not `parsed.feedType` (which is `undefined` in v3.13.0). For RSS: use `content:encoded` (custom field) for body, `contentSnippet` for excerpt. For Atom: use `content` for body, `summary` for excerpt.

### 2. Vercel AI SDK v6 `generateObject` Return Shape

**Issue**: `generateObject()` returns `{ object, usage, ... }` — the validated output is in `result.object`, not `result` directly.

**Fix**:
```typescript
const result = await generateObject({ model, schema, messages, temperature: 0.1 });
return { ...result.object, model: PRIMARY_MODEL, tokensUsed: result.usage?.totalTokens ?? 0 };
```

### 3. `articles.body` Column — Schema Design Gap

**Issue**: `contentAvailabilityEnum` tiers (`partial_text` = 300–1500 chars body, `full_text` = >1500 chars) imply body content exists, but the original schema had no `body` column. The `determineContentAvailability` function checked `body.length` on input that was never persisted.

**Fix**: Added nullable `body: text("body")` column via additive migration (`drizzle/0003_strong_mac_gargan.sql`). Ingest worker now stores body from feeds; summarize worker passes it to `callAISummary`.

### 4. `vi.fn().mockImplementation()` Is NOT a Constructor

**Issue**: When mocking classes called with `new` (like `Redis` or `FlowProducer`), `vi.fn(() => mockInstance)` doesn't work — `new` on a vi.fn returns an empty object.

**Fix**: Use a real class in the mock factory:
```typescript
vi.mock("ioredis", () => ({
  Redis: class MockRedis {
    incr = mockRedis.incr;
    expire = mockRedis.expire;
  },
}));
```

### 5. Test Setup Environment Variable Override

**Issue**: Shell environment may contain values that fail the Zod env schema (e.g., a SQLite `DATABASE_URL`). Using `??=` doesn't override these.

**Fix**: Use direct assignment (`=`) in `src/test/setup.ts` to force test-safe values. Note: `process.env.NODE_ENV` is read-only per `@types/node` — vitest already sets it to `"test"`.

### 6. CI Workflow — Missing Env Vars Break All Steps

**Issue**: `src/lib/env/index.ts` validates env vars at module load. Even `pnpm lint` imports modules that import `@/lib/env`, so missing env vars break ALL CI steps.

**Fix**: Set all 11 required env vars in `.github/workflows/ci.yml` `env:` block with CI-safe dummy values that pass the Zod schema.

### 7. `clientSegmentCache` Not in `ExperimentalConfig` (Next.js 16.2.9)

**Issue**: PRD §5.2 / PAD §5.3 list `experimental.clientSegmentCache`, `turbopackPersistentCaching`, and `turbopackFileSystemCacheForBuild`. Next.js 16.2.9 doesn't expose these in `ExperimentalConfig` — adding them produces `TS2353`.

**Fix**: Document as deferred in `next.config.ts`. Only `viewTransition: true` is currently enabled. Re-enable when upstream types include them.

### 8. Content Change Detection via `(xmax = 0)` Trick

**Issue**: With `onConflictDoUpdate`, how do you distinguish INSERT from UPDATE?

**Fix**: Use PostgreSQL system column `xmax` in RETURNING:
```typescript
.returning({
  id: articles.id,
  isNew: sql<boolean>`(xmax = 0)`,  // true for INSERT, false for UPDATE
})
```
Combined with `WHERE content_hash != excluded.content_hash`, this detects content changes and only enqueues scoring for genuinely new articles.

### 9. Singleton Publisher Pattern for Cache Invalidation

**Issue**: Original `cacheInvalidation.ts` created a new Redis connection per call. Under 50 concurrent ingest workers, this caused connection churn.

**Fix**: Module-level singleton publisher. The `flows.ts` FlowProducer uses the same singleton pattern. See `src/workers/lib/cacheInvalidation.ts` and `src/lib/queue/flows.ts`.

### 10. Corrupted CSS Class Names (Silent Failures)

**Issue**: The codebase had corrupted className strings (`font浃着` in `NutritionLabel.tsx`, `Monad` and `monospace` in `SummaryPanel.tsx`). These are invalid CSS classes — browsers silently ignore them, and the elements fall back to the wrong font. No build error or warning is thrown.

**Fix**: Changed all to `font-mono`. Review CSS class strings after any edit, especially after merges or AI-generated code.

**Prevention**: Add a lint rule or pre-commit hook that flags non-ASCII characters in className strings. Consider a visual regression test that verifies metadata text renders in Commit Mono.

---

## Latest Lessons Learned (Phase 14)

### 1. `hashContent` Must Include Body for Content Change Detection

**Issue**: `hashContent(title, publishedAt)` only hashed title + date. Content-only updates (same title+date, different body) were silently dropped by `onConflictDoUpdate WHERE content_hash != excluded.content_hash`.

**Fix**: `hashContent(title, body, publishedAt)` — hash input is now `${title.trim()}|${body ?? ""}|${publishedAt.toISOString()}`.

**Lesson**: When hashing for change detection, include ALL fields that represent "content" — not just identifiers. Title + date identify the article; body IS the content.

### 2. Rate Limiter `TRUSTED_PROXY` Pattern

**Issue**: `x-forwarded-for` is spoofable. Leftmost IP (client-supplied) allows bypass.

**Fix**: `TRUSTED_PROXY=true` env var → use rightmost IP (trusted proxy's client view). Default (unset) → leftmost IP (direct exposure, documented as spoofable).

**Lesson**: IP extraction must distinguish "direct exposure" (leftmost) from "behind trusted proxy" (rightmost). Use env var to switch — don't hardcode either.

### 3. `pushSubscriptions.encryptedKeys` Schema Fix

**Issue**: `keys: { p256dh: encryptedEnvelope, auth: "encrypted" }` was semantically misleading. Schema type said `{ p256dh: string; auth: string }` but `p256dh` held the entire encrypted envelope.

**Fix**: Added `encryptedKeys: text("encrypted_keys")` column. Old `keys` column retained (nullable, deprecated). New subscriptions write to `encryptedKeys`.

**Lesson**: Schema types should match storage semantics. Additive migrations (new column) are safer than in-place type changes.

### 4. Article Detail Page — `generateMetadata` for Provenance

**Issue**: Article detail page was a placeholder. No real data fetch, no `SummaryPanel`, no 3-layer provenance.

**Fix**: `getArticleWithSummary(id)` with 4-way JOIN. `ArticleData.tsx` renders real data + `SummaryPanel`. `generateMetadata()` calls `generateProvenanceMetadata()` and emits all 3 layers via `metadata.other`.

**Lesson**: `generateMetadata()` is the Next.js 16 mechanism for per-page HTTP headers + meta tags. Set `metadata.other = { "ai-provenance": metaTag, "X-AI-Provenance": httpHeader }`.

### 5. Property-Based Testing > Hardcoded Vectors

**Issue**: `hashContent` test used hardcoded SHA-256 vector. Brittle — fails if delimiter or date format changes.

**Fix**: Replaced with property-based test computing expected hash via `node:crypto` inline: `createHash("sha256").update(expectedData, "utf8").digest("hex")`.

**Lesson**: Prefer property-based tests (determinism, collision resistance, algorithm verification) over hardcoded vectors.

### 6. E2E Tests Require Config Separation

**Issue**: Playwright E2E tests (`e2e/*.spec.ts`) picked up by vitest → import errors (`@playwright/test` not installed in vitest env).

**Fix**: Excluded `e2e/` + `playwright.config.ts` from `vitest.config.ts`, `eslint.config.mjs`, `tsconfig.json`.

**Lesson**: When using multiple test runners, explicitly exclude each runner's files from the other's config.

### 7. BullMQ `getSummaryFailureState` — Permanent Failure Visibility

**Issue**: After 3 BullMQ retries, `summaryStatus` stayed `"none"` — no observability for failed summaries.

**Fix**: `getSummaryFailureState(attemptsMade, maxAttempts)` returns `{ summaryStatus: "needs_review", flagReason: "AI summarization failed after N attempts" }` when `attemptsMade >= maxAttempts`.

**Lesson**: For retryable operations, distinguish "temporary failure (retry)" from "permanent failure (escalate)". After exhausting retries, set a visible failure state.

### 8. Drizzle Mock Query Builder Chaining

**Issue**: Testing Drizzle queries requires mocking the chainable builder: `select().from().innerJoin().leftJoin().leftJoin().where().limit()`.

**Fix**: Self-referential mock: `leftJoinResult.leftJoin = leftJoin` so the second `leftJoin` returns the same object (which has `where`).

**Lesson**: Drizzle's query builder is deeply chainable. Self-referential mocks (`result.method = method`) handle arbitrary chaining depth.

---

## Latest Lessons Learned (Phase 15)

### 1. Dockerfile Drift — Node Version Mismatch + Malformed Lines

**Issue**: Production Dockerfiles pinned `node:22-alpine` while `package.json` requires Node 24. Additionally, `Dockerfile.worker` had malformed lines (missing newlines: `COPY . .RUN`, `WORKDIR /appENV`), referenced a non-existent `worker:build` script, and copied a non-existent `dist/` directory.

**Fix**: Pinned both Dockerfiles to `node:24-alpine`. Rewrote `Dockerfile.worker` to run `tsx src/workers/index.ts` directly (copying `node_modules` + `src` to the runner stage). Fixed `Dockerfile.dev`/`Dockerfile.worker.dev` (removed non-existent `packages/` copy + corrected script names).

**Lesson**: Dockerfiles must be validated as part of CI — not just visually reviewed. Always pin to the exact Node version specified in `engines.node`. Each Dockerfile instruction (`RUN`, `COPY`, `WORKDIR`) must be on its own line.

### 2. `output: "standalone"` Required for Production Docker

**Issue**: `Dockerfile.web` copied `.next/standalone/server.js` but `next.config.ts` didn't set `output: "standalone"` — the build would fail because the standalone directory wasn't generated.

**Fix**: Added `output: "standalone"` to `next.config.ts` (top-level, alongside `cacheComponents: true`).

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

**Lesson**: `vi.fn()` creates a mock function but doesn't replace anything by itself. For global APIs like `fetch`, use `vi.stubGlobal("fetch", mockFn)`. Always reset between tests to avoid cross-test contamination.
