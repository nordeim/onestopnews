"# OneStopNews

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
# Edit .env.local
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
pnpm dev              # Next.js
pnpm worker:dev       # Worker service
```

### Build & Quality Commands
| Command | Purpose |
| :--- | :--- |
| `pnpm dev` | Next.js dev server with Turbopack |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint + Prettier |
| `pnpm tsc --noEmit` | TypeScript strict check |
| `pnpm test` | Run all test suites |
| `pnpm drizzle-kit generate` | Generate migration SQL |
| `pnpm drizzle-kit migrate` | Apply pending migrations |

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
| Admin auth in `proxy.ts` | Layer 0 has no DB access | `verifyAdminSession()` in `(admin)/layout.tsx` |
| `pg_textsearch` extension (PG 17) | Doesn't exist; `ts_rank_cd` is built-in | Use `ts_rank_cd` directly |

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
| **Phase 2** — Database Schema & Infrastructure | **COMPLETE** | Drizzle schema (10 tables), lazy DB client, Auth.js v5, BullMQ queues |
| **Phase 3** — Design System & Shared Components | **COMPLETE** | Button, Badge, Skeleton, Header, Footer, useDebounce, useReducedMotion, PageTransition |
| **Phase 4** — Core Feed Feature | **COMPLETE** | Domain layer, feed queries, FeedGrid, ArticleCard, home/topic/article routes |
| **Phase 5** — AI Summarisation Pipeline | **COMPLETE** | Zod schema, prompts, 3-layer provenance, NutritionLabel, SummaryPanel, actions, API endpoint |
| **Phase 6** — Search, Admin & Public API | **COMPLETE** | FTS search with BM25 (`ts_rank_cd`), admin routes (`/admin/sources`, `/admin/summaries`), public REST API (`/api/articles`), 103+ tests |
| **Phase 7** — Worker Service, Push & Observability | **NOT STARTED** | 4 workers, content guard, push encryption, quiet hours, health endpoint |
| **Phase 8** — Testing, CI/CD & Deployment | **NOT STARTED** | Vitest, Playwright, Lighthouse CI, Dockerfiles, GitHub Actions |

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

### 6. CORS on Public API

**Lesson**: The `/api/articles` endpoint must include CORS headers (`Access-Control-Allow-Origin: *`) for external consumers. Always include an `OPTIONS` handler.

---

## Quick Reference: File Locations

| Component/Service | Path |
| :--- | :--- |
| Database Schema | `src/lib/db/schema.ts` |
| Lazy DB Client | `src/lib/db/index.ts` |
| Auth Configuration | `src/lib/auth/index.ts` |
| Auth DAL | `src/lib/auth/dal.ts` |
| BullMQ Queues | `src/lib/queue/index.ts` |
| Feed Queries | `src/features/feed/queries.ts` |
| Search Queries | `src/features/search/queries.ts` |
| Search Types | `src/features/search/types.ts` |
| Public API | `src/app/api/articles/route.ts` |
| Admin Layout | `src/app/(admin)/layout.tsx` |
| Admin Sources | `src/app/(admin)/sources/page.tsx` |
| Admin Summaries | `src/app/(admin)/summaries/page.tsx` |
| Summarisation Schema | `src/features/summaries/lib/summariseSchema.ts` |
| AI Prompts | `src/lib/ai/prompts.ts` |
| Provenance Generator | `src/lib/ai/provenance.ts` |
| Summary Components | `src/features/summaries/components/*.tsx` |
| Next.js Config | `next.config.ts` |
| Proxy | `proxy.ts` |

---

## Contact & Maintenance

- **Maintained by**: Senior Engineering, Tech Leads, DevOps
- **Authoritative Sources**: `Project_Architecture_Document_v4.5.md` | `Project_Requirements_Document_v4.3.md` | `README.md`
- **Last Updated**: June 15, 2026
- **Total Tests**: 103+ across 20 suites
