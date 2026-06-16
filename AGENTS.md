---
IMPORTANT: Read fresh for every conversation. This file encodes the institutional knowledge of the OneStopNews codebase. When in doubt, consult PAD v4.5 and PRD v4.3 as the authoritative sources.
---

# OneStopNews

**Topic-first news aggregation with source-cited AI summaries.**

A Next.js 16 + React 19.2 application backed by PostgreSQL 17, BullMQ v5 on Redis, and a separate Node.js 24 LTS worker service. The "Editorial Dispatch" design system uses Newsreader + Instrument Sans + Commit Mono with CSS Subgrid for feed alignment. Every AI summary carries a 3-layer machine-readable provenance disclosure (JSON-LD + HTTP header + HTML meta tag) for EU AI Act Article 50 compliance.

**Maintained by:** Senior Engineering, Tech Leads, DevOps
**Authoritative Sources:** `Project_Architecture_Document_v4.5.md` | `Project_Requirements_Document_v4.3.md` | `README.md`

---

## Foundational Principles

### 1. The Meticulous Approach (Mandatory for All Tasks)

Follow this six substantial six-phase workflow for every implementation:

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
- **`noUncheckedIndexedAccess: true`** — catches undefined array access at compile time. Without this flag, `arr[i]` returns `T` instead of `T | undefined`, hiding potential runtime errors. This is the single highest-value strictness improvement available.
- **`interface` > `type`** for structural definitions. `type` for unions / intersections.
- **Early returns** over deeply nested conditionals.
- **Composition over inheritance** — no class hierarchies for business logic.
- **Avoid explicit return types** unless the function is a public API boundary.
- **No `enum` or `namespace`** — use string unions and ES modules instead. Enums compile to runtime IIFEs and violate `erasableSyntaxOnly`.
- **`import type` for type‑only imports** — required when `verbatimModuleSyntax` is enabled.

### Next.js 16 App Router

- **Server Components by default.** Use `'use client'` only for interactivity (state, effects, browser APIs).
- **Async `params` / `searchParams`** are `Promise<T>`. Always `await` them. Synchronous access causes a runtime 500.
- **`cookies()` is async** — always `await` before calling `.get()`. In Next.js 15/16, `cookies()` returns a `Promise<ReadonlyRequestCookies>`; failing to `await` produces `TS2339: Property 'get' does not exist on type 'Promise<...>'`.
- **No data fetching in Layouts.** Layouts cause re-renders. Fetch in Pages.
- **Route Handlers** (`app/api/.../route.ts`) for public HTTP endpoints. Server Actions for mutations.
- **`proxy.ts`** (not `middleware.ts`) is the network boundary. Cookie check + redirect only. No DB calls. The proxy function runs on Node.js only — Edge runtime is not supported.

#### Critical Configuration (verified positions — wrong placement = silent breakage)

| Flag | Placement | What Breaks if Wrong |
| :--- | :--- | :--- |
| `cacheComponents: true` | **Top-level** | Every `"use cache"` silently ignored. Zero caching. |
| `cacheLife: { stale, revalidate, expire }` | **Top-level** | `cacheLife('feed')` throws runtime — profile missing. All three fields (`stale`, `revalidate`, `expire`) are required; `expire` controls max stale duration before dynamic rendering. |
| `turbopack: {}` | **Top-level** | Ignored or config warning. |
| `experimental.viewTransition` | **Inside `experimental: {}`** | Transitions silently disabled. |
| `experimental.ppr` | **DO NOT INCLUDE** | Build error in Next.js 16 — removed; `cacheComponents` implements PPR as default. |
| `experimental.dynamicIO` | **DO NOT INCLUDE** | Deprecated — replaced by `cacheComponents`. |

#### `proxy.ts` Matcher

The proxy file uses a broad matcher pattern to intercept all routes except static assets:

```ts
// src/proxy.ts
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
```

### Drizzle ORM & Database

 - **Lazy Proxy Connection:** `lib/db/index.ts` defers connection until first query. Prevents build-time crashes. See `src/lib/db/index.ts` for implementation.
   - **CRITICAL PHASE 3 FIX**: The Lazy Proxy must NOT be confused with a plain object. A raw `return {}` causes `TypeError: Cannot read properties of undefined` at runtime when Drizzle methods are called. The `Proxy<T>` must intercept every property access and forward to the real `db`.
   - **Tested**: `src/lib/db/index.test.ts` has 5 tests verifying the proxy behavior including missing `DATABASE_URL`, first-query execution, and repeated access returns same instance.
- **Migrations:** `drizzle-kit generate` + `migrate`. **Never `push`** in production.
- **Additive-only deployments:** when removing a column, deploy code first (stop reading it), drop column in next release.
- **Connection Pool:** `max: 10` assumes **dedicated Node.js runtime** (Docker, Railway, ECS). For serverless (Vercel, Lambda), swap to a connection pooler (PgBouncer / Supavisor).
- **All queries via `queries.ts`** in the relevant feature module. No raw Drizzle calls in components.
- **Service Factory Pattern (Recommended):** Encapsulate database queries in factory functions. Never call `db` directly in pages or server actions.

```ts
// services/articles.service.ts
import { db } from '@/lib/db';
import { articles } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export function createArticlesService() {
  return {
    async getFeed(limit = 31) {
      return db.select().from(articles).orderBy(desc(articles.publishedAt)).limit(limit);
    },
    async getById(id: string) {
      return db.query.articles.findFirst({ where: eq(articles.id, id) });
    },
  };
}
```

**Why factories:** Injectable, mockable, testable, consistent type conversion, single source of truth for query logic.

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

  const user = await db.query.users.findFirst({
    where: eq(users.email, session.user.email),
    columns: { id: true, role: true, name: true },
  });

  if (!user) redirect('/sign-in');
  return { user, sessionId: session.user.id };
});

export const verifyAdminSession = cache(async () => {
  const { user } = await verifySession();
  if (user.role !== 'admin') redirect('/');
  return user;
});
```

- **`redirect()` not `throw new Error()`** in Server Components. `throw` triggers full-page error boundaries; `redirect()` preserves invisible UX.
- **`cache()` from `react`** memoizes per-request. Multiple components calling `verifySession()` in one render tree execute **one** validation.
 - **Beta pin:** Auth.js v5 is pinned to `5.0.0-beta.31` with `@auth/core@0.41.2`. Monitor `authjs.dev` for stable release.
   - **`verifyAdminSession` canonical location**: `src/lib/auth/dal.ts` is the single source of truth for admin verification. Any future admin checks must import from there. The duplicate in `src/app/api/admin/route.ts` was deleted in Phase 1-2 remediation.

### Design System — "Editorial Dispatch"

The visual identity is **architectural, not cosmetic.** Every element carries the weight of something worth reading.

| Role | Typeface | Weight | Usage |
| :--- | :--- | :--- | :--- |
| Headlines | Newsreader (variable) | 800 | `font-editorial` — `leading-tight`, `tracking-[-0.02em]` |
| UI / Body | Instrument Sans (variable) | 400–600 | `font-ui` — `leading-relaxed` |
| Metadata | Commit Mono | 400 | `font-mono` — `uppercase`, `tracking-widest`, `text-[10px]` |

**Explicit Rejections:** Inter, Roboto, Space Grotesk. Never use them.

**Color Contract:**
- `ink-900 (#1a1a18)` — headings
- `ink-600 (#3d3d3a)` — body text (WCAG AAA on `paper-50`)
- `ink-300 (#8a8a83)` — muted / metadata
- `paper-50 (#fafaf8)` — page background
- `paper-100 (#f2f2ee)` — card surface
- `dispatch-ember (#c7513f)` — breaking news, AI badge, focus rings
- `dispatch-slate (#5a6b7a)` — tech / neutral accent

**Design Token Discipline:** Never use raw hex colors in Tailwind classes (e.g., `bg-[#1a1a2e]`). All colors must come from the design token system (`bg-ink-900`, `text-paper-50`, etc.). Raw hex values bypass the theme and break maintainability.
**Phase 3 Components Built:**
- `src/shared/components/ui/Button.tsx` — cva + Radix Slot, 5 variants, loading spinner, disabled state
- `src/shared/components/ui/Badge.tsx` — 6 colour variants, font-mono, accessible
- `src/shared/components/ui/Skeleton.tsx` — reduced-motion aware, ArticleCard/Feed skeletons
- `src/shared/components/layout/Header.tsx` — sticky, cat-nav, mobile dialog (Radix Dialog)
- `src/shared/components/layout/Footer.tsx` — AI disclosure, role="contentinfo"
- `src/shared/hooks/useDebounce.ts` — generic <T>, cleanup
- `src/shared/hooks/useReducedMotion.ts` — MediaQueryList API, `prefers-reduced-motion: reduce`
- `src/components/primitives/PageTransition.tsx` — `document.startViewTransition` with graceful degradation

**CSS Subgrid Feed:**
```css
/* Parent defines columns with gap-x only */
/* Each ArticleCard: grid grid-rows-subgrid row-span-3 */
/* Last card in column: last:mb-0 */
```

### Worker & BullMQ

- **Redis config:** `maxRetriesPerRequest: null`, `noeviction` policy. Without these, BullMQ loses jobs.
- **Connection splitting (production best practice):**
  - **Worker connection:** `maxRetriesPerRequest: null`, `enableOfflineQueue: true` — workers must persist during Redis outages.
  - **Queue (producer) connection:** `enableOfflineQueue: false` — prevents memory leaks and stale job accumulation.
- **Concurrency:** `ingest: 50` (I/O), `summarize: 5` (AI rate-limited), `score: 20` (CPU/DB), `feed-slice: 10` (Redis).
- **Job scheduling:** `upsertJobScheduler()` for RSS polling. Idempotent — restart-safe.
- **Flows:** `FlowProducer` for atomic DAG (ingest → score → feed-slice refresh). Parent runs only after all children complete.
- **Graceful shutdown:** `SIGTERM` / `SIGINT` handlers close all workers before process exit.

### AI Pipeline & 3-Layer Disclosure

**Content Availability Guard (Anti-Hallucination):**
- `title_only` → **DO NOT summarise**
- `excerpt` → **DO NOT summarise**
- `partial_text` → Summarise permitted (300–1500 chars)
- `full_text` → Summarise preferred (>1500 chars)

**3-Layer Machine-Readable Disclosure (`provenance.ts`):**
1. **JSON-LD** — `schema.org/CreativeWork` embedded in page `<script>` tag.
2. **HTTP Header** — `X-AI-Provenance` base64-encoded JSON.
3. **HTML Meta Tag** — `<meta name="ai-provenance" content="...">`

**C2PA is explicitly rejected.** It is a media (image/video/audio) cryptographic standard with no established text specification.

**Summary Review Workflow:**
```
ok → needs_review → ok          (approve / regenerate)
              → disabled      (permanent disable)
```
- `flagReason` field is populated when admin flags a summary.
- `needs_review` hides the `NutritionLabel` from users.
- Disabled summaries show no UI; `flagReason` retained for audit.

### React 19 Patterns (Optional)

**Forms: Use `useActionState`**
```tsx
"use client";
import { useActionState } from 'react';

function Form() {
  const [state, formAction, isPending] = useActionState(
    async (prev: FormState, formData: FormData) => {
      // Server action or async logic
      return { success: true, errors: {} };
    },
    { success: false, errors: {} }
  );
  return <form action={formAction}>...</form>;
}
```

**Instant UI: `useOptimistic` + `startTransition`**
```tsx
const [optimisticItems, addOptimistic] = useOptimistic(items, (state, newItem) => [
  ...state,
  { ...newItem, pending: true },
]);

function handleAdd(item: Item) {
  startTransition(async () => {
    addOptimistic(item);
    await addItemToServer(item);
  });
}
```

- **`"use client"` must be first line** — appears before any imports.
- **RSC: No browser APIs** — Server Components cannot access `window`, `document`, `localStorage`, etc.

---

## Development Workflow

### Prerequisites
- **Node.js** ≥24 LTS ("Krypton")
- **pnpm** ≥9.x
- **PostgreSQL** ≥17
- **Redis** ≥7.x (or Upstash managed)

### Setup Commands

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local — see README.md §Environment Variables

# 3. Generate and apply database migrations
pnpm drizzle-kit generate
pnpm drizzle-kit migrate

# 4. Start development
pnpm dev              # Next.js (Turbopack) on http://localhost:3000
pnpm worker:dev       # Worker service (separate terminal)
```

### Build & Quality Commands

| Command | Purpose |
| `pnpm dev` | Next.js dev server with Turbopack Fast Refresh |
| `pnpm build` | Production build (Next.js) |
| `pnpm start` | Production server (Next.js) |
| `pnpm lint` | ESLint + Prettier |
| `pnpm tsc --noEmit` | TypeScript strict check |
| `pnpm test` | Run all test suites |
| `pnpm drizzle-kit generate` | Generate migration SQL from schema |
| `pnpm drizzle-kit migrate` | Apply pending migrations |
| `pnpm worker:dev` | Worker service (BullMQ + Node.js) |

### Pre-Commit Gate
```bash
pnpm check          # Runs tsc --noEmit && pnpm lint
pnpm test           # Run all test suites
```
Must pass before any PR is merged. No exceptions.

**Note**: `pnpm check` is a convenience script that runs `tsc --noEmit && pnpm lint`. This replaced separate commands to ensure TypeScript and ESLint are always checked together.

---

## Testing Strategy

| Category | Tool | Scope | Target |
| :--- | :--- | :--- | :--- |
| Unit | Vitest | Domain logic, utilities, Zod parsing | 80%+ coverage |
| Integration | Vitest + Docker | Drizzle queries, BullMQ jobs | CI gate |
| E2E | Playwright | Critical user journeys (feed → article → summary) | Zero visual regressions |
| Perf | k6 | `GET /api/articles`, search | `< 300ms` p95 |
| A11y | axe-core + Playwright | Keyboard nav, screen reader labels | WCAG 2.1 AAA |

**Test Infrastructure:**
- PostgreSQL and Redis run in ephemeral Docker containers for integration tests.
- No Prisma or Meilisearch in the test suite.
- TypeScript strict mode enforced in test files.
- **vitest.config.ts** is at root, with `@/` path alias mapped to `src/`.

---

## Code Quality Standards

 - **Lint:** ESLint + Prettier, enforced in CI.
- **Types:** `tsc --noEmit` with `strict: true` and `noUncheckedIndexedAccess: true`. Zero `any`.
- **Naming:**
  - Components: PascalCase (`ArticleCard.tsx`)
  - Utilities/hooks: camelCase (`useDebounce.ts`)
  - Feature folders: kebab-case (`/features/feed/`)
  - Database tables: snake_case in Drizzle, camelCase in TypeScript
- **Comments:** Explain *why*, not *what*. Self-documenting code is the goal.

---

## Security & Compliance

| Concern | Posture |
| :--- | :--- |
| Next.js version | Pinned to `>=16.0.7`. CVE-2025-55182 (React2Shell RCE) + 13-advisory DoS/SSRF fix. |
| Auth | Auth.js v5 beta, HttpOnly session cookies. Drizzle adapter, same PostgreSQL instance. |
| AI Disclosure | 3-layer: JSON-LD + HTTP header + HTML meta. C2PA rejected. EU AI Act Art. 50 compliant. |
| Push keys | AES-256-GCM encryption at rest. `PUSH_KEY_ENCRYPTION_KEY` 64-char hex. |
| DB connections | Eager connection with graceful fallback when `DATABASE_URL` is missing at build time. `max: 10` for dedicated runtimes. Serverless: use PgBouncer/Supavisor or inject dummy URI at build time. |
| Access control | DAL-layer enforcement. `verifyAdminSession()` redirects non-admins. |

---

## Anti-Patterns to Avoid

| Anti-Pattern | Why Forbidden | Replacement |
| :--- | :--- | :--- |
| `any` in TypeScript | Breaks strict mode contract and type inference. | `unknown` + type guards. |
| `enum` / `namespace` | Compile to runtime IIFE/closure; violate `erasableSyntaxOnly`. | String unions (`type Status = "ACTIVE" \| "DRAFT"`) and ES modules. |
| Custom component over Shadcn | Violates Library Discipline. Wastes engineering time. | Shadcn UI / Radix primitive, wrapped for styling. |
| `throw new Error()` in RSC auth | Triggers full-page error boundary. Bad UX. | `redirect('/sign-in')` from `next/navigation`. |
| Lazy proxy for DrizzleAdapter | Incorrectly documented. Lazy proxy IS correct for DrizzleAdapter. See src/lib/db/index.ts for implementation. | |
| `drizzle-kit push` in production | Overwrites schema without migration history. Irreversible. | `generate` + `migrate` only. |
| Caching without `cacheComponents: true` | `"use cache"` is silently inert. Zero caching occurs. | Ensure flag is top-level in `next.config.ts`. |
| Summarising `title_only` / `excerpt` | AI hallucination risk — fabricating content from insufficient input. | `contentAvailabilityEnum` guard: only `partial_text` or `full_text`. |
| Synchronous `params` access | Runtime 500 in Next.js 16 App Router. | Always `await params` (Promise). |
| Synchronous `cookies()` access | `TS2339` error; runtime undefined. | `(await cookies()).get('key')`. |
| Generic fonts (Inter, Roboto) | Violates "Editorial Dispatch" anti-generic mandate. | Newsreader, Instrument Sans, Commit Mono only. |
| Raw hex colors in Tailwind | Bypasses design token system; breaks theming and maintainability. | Use design tokens (`bg-ink-900`, `text-paper-50`). |
| Stale `.next/` cache after route deletion | `TS2307: Cannot find module` from old generated types. | `rm -rf .next/` + `tsc --noEmit`. |
| Missing `noUncheckedIndexedAccess` | `arr[i]` returns `T` instead of `T \| undefined`, hiding runtime errors. | Enable in `tsconfig.json`. |
| Mismatched `@auth/core` versions | `DrizzleAdapter` fails at build time with type errors. | Run `pnpm why @auth/core`. Upgrade `next-auth` to align. |
| Beta adapter `as any` without eslint-disable | Triggers `--max-warnings 0` lint failures. | Add `eslint-disable-next-line @typescript-eslint/no-explicit-any` with justification. |

---

## Phase 7: Worker Service, Push & Observability — Lessons Learned

### Phase 7 Gotchas Discovered

#### 1. Cache Invalidation: Workers Cannot Use `revalidateTag()`

**Issue**: `revalidateTag()` is a Next.js-only API. Workers run in a separate Node.js process and cannot call it. Attempting to do so throws `TypeError: revalidateTag is not a function`.

**Fix**: Use Redis pub/sub for worker-to-web-app cache invalidation. Workers publish invalidation events to a Redis channel; the Next.js app subscribes and calls `revalidateTag()` locally.

```typescript
// src/workers/lib/cacheInvalidation.ts
import { publisher } from '@/lib/queue';

export async function publishCacheInvalidation(tag: string): Promise<boolean> {
  try {
    await publisher.publish(`cache:invalidate:${tag}`, '1');
    return true;
  } catch {
    return false; // Best-effort: don't crash the worker
  }
}
```

**TDD**: 3 tests in `cacheInvalidation.test.ts` verify publish, error handling, and Redis integration.

#### 2. Type Safety: `as any` Cast in Score Worker

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

**Lesson**: Prefer explicit `.innerJoin()` over relational `.with()` when type safety is critical. The `.with()` pattern has known TypeScript inference limitations.

#### 3. Content Availability Guard — Double Enforcement

**Issue**: The content guard must be enforced at **both** the Server Action layer AND the API Route layer. The API route is public; the Server Action is called from the UI. Both need validation.

**Fix**:
```typescript
// In BOTH actions.ts AND route.ts
if (['title_only', 'excerpt'].includes(article.contentAvailability)) {
  return { error: "Cannot summarise articles with only title or excerpt" }; // 400
}
```

#### 4. BullMQ `job.id` is `string | undefined`

**Issue**: BullMQ's `Job` type has `id` as `string | undefined`, causing `TS2339` when accessing `job.id`.

**Fix**: Assert presence before use:
```typescript
const job = await summarizeQueue.add(...);
if (!job?.id) throw new Error("Job creation failed");
// Now job.id is string
```

#### 5. `summaryStatus` Does NOT Have an `"error"` State

**Critical**: The schema does not include `"error"` as a valid `summaryStatus`. When the summarisation worker fails, it should leave the status as `"none"` (allowing retry) or `"needs_review"` (for manual review). Do not use `"error"` — it will cause type errors.

### Phase 7 Recommendations

1. **Zod Schema Evolution**: Keep `summariseSchema.ts` version-controlled. When LLM capabilities improve, adjust constraints with new tests.
2. **Provenance Audit Trail**: The `flagReason` field is populated when an admin flags a summary. Disabled summaries retain `flagReason` for audit but show no UI.
3. **Rate Limiting Deferral**: Rate limiting for summarisation was deferred to Phase 6/8 (Redis-based). The API route currently has no rate limiting — document this in security reviews.
4. **Worker Implementation**: Phase 7 built the worker infrastructure (entry point, scheduler, encryption, quiet hours). The actual summarisation worker (calling Anthropic/OpenAI) is Phase 9.
5. **Test Monitoring**: Phase 7 added 21 tests (from 103 to 124). Monitor for test flakiness — `useOptimistic` tests may be timing-sensitive.

---

## Phase 8: Testing, CI/CD & Deployment — Lessons Learned

### Phase 8 Gotchas Discovered

#### 1. GitHub Actions YAML Syntax Errors

**Issue**: YAML files are extremely sensitive to indentation and special characters. A single bad quote or misplaced space can cause the entire workflow to fail silently or with cryptic errors.

**Fix**: Always validate YAML syntax before pushing:
```bash
# Install actionlint for local validation
brew install actionlint  # macOS
actionlint .github/workflows/ci.yml

# Or use GitHub's web editor for syntax highlighting
```

#### 2. Docker Multi-Stage Build Context

**Issue**: Docker build context includes the entire repo by default, which can be slow and include sensitive files.

**Fix**: Use `.dockerignore` to exclude `node_modules`, `.git`, `.env*`, and other unnecessary files.

#### 3. Lighthouse CI Requires Production Build

**Issue**: Lighthouse CI cannot run against the development server. It requires a production build (`next build`) and a running server (`next start`).

**Fix**: The `lighthouserc.js` configuration uses `startServerCommand` to build and start the production server before auditing.

#### 4. Vitest Coverage Thresholds

**Issue**: Setting coverage thresholds too high initially causes CI failures until the test suite matures.

**Fix**: Start with moderate thresholds (80% lines, 70% branches) and increase as coverage improves. The current configuration is:
```typescript
thresholds: {
  lines: 80,
  functions: 80,
  branches: 70,
  statements: 80,
}
```

### Phase 8 Recommendations

1. **CI Pipeline Monitoring**: Monitor CI pipeline duration. If it exceeds 10 minutes, investigate slow steps (likely `npx playwright install --with-deps`).
2. **Docker Image Size**: Monitor Docker image size. If the web image exceeds 500MB, investigate `node_modules` pruning or multi-stage build optimization.
3. **Lighthouse CI Budgets**: Start with conservative budgets (Perf ≥ 90, A11y ≥ 95) and tighten as the app matures. PPR helps with performance but heavy AI components can slow LCP.
4. **Deployment Automation**: The `scripts/deploy.sh` script supports tagged releases. Consider adding Slack/Discord notifications on deployment success/failure.

---

## Phase 9: Blocking Route Error Fix — Lessons Learned

### Next.js 16 `cacheComponents` + Uncached Data Outside `<Suspense>`

**Issue**: When `cacheComponents: true` is enabled in Next.js 16, any uncached data fetch (e.g., database query via Drizzle) outside of a `<Suspense>` boundary blocks the entire page from rendering. This triggers the `blocking-route` error:

> "Route '/': Uncached data or `connection()` was accessed outside of `<Suspense>`. This delays the entire page from rendering, resulting in a slow user experience."

**Root Cause**: Next.js 16's opt-in caching model requires all asynchronous data fetching to be either:
1. Wrapped in `<Suspense>` to allow streaming the fallback UI immediately
2. Inside a Cache Component (`"use cache"`) with a `cacheLife` profile for static prerendering

**Fix**: Extract data fetching into a separate Server Component and wrap it in `<Suspense>`:

```tsx
// ✅ page.tsx — NO direct await; wrap data fetch in Suspense
import { Suspense } from "react";
import { FeedData } from "@/features/feed/components/FeedData";
import { FeedSkeleton } from "@/features/feed/components/FeedSkeleton";

export default function HomePage() {
  return (
    <main>
      <Suspense fallback={<FeedSkeleton />}>
        <FeedData limit={6} />
      </Suspense>
    </main>
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

## Quick Reference: Layer Model

```
Layer 0: proxy.ts           — Cookie check, redirect. NO DB. NO logic.
Layer 1: App Router           — Route structure, metadata, PPR, Suspense.
Layer 2: Feature Modules     — UI composition, data binding, mutations.
Layer 3: Domain Services      — Pure business logic. No framework imports.
Layer 4: Infrastructure       — Drizzle, BullMQ, Auth.js. Side effects only.
```

**Golden Rule:** Deviation from this order creates security and consistency bugs.

---

## Phase 5: AI Summarisation Pipeline — Lessons Learned

### Phase 5 Gotchas Discovered

#### 1. Zod `safeParse()` Type Narrowing

**Issue**: TypeScript does not automatically narrow `result.error` to `ZodError` after checking `!result.success`.

**Fix**: Access `result.error.issues` only within the `if (!result.success)` branch. The type system guarantees `.error` is a `ZodError` when `.success` is `false`.

```typescript
const result = summarisationOutputSchema.safeParse(rawOutput);
if (!result.success) {
  // result.error is ZodError here
  return result.error.issues.map(i => i.message).join("; ");
}
```

#### 2. `useOptimistic` Warning in Tests

**Issue**: Warning: "An optimistic state update occurred outside a transition or action."

**Cause**: Tests do not wrap `useOptimistic` calls in `startTransition()`. This is expected; production code must wrap in `startTransition()`.

**Fix**: In production, always use `startTransition()`:
```typescript
startTransition(async () => {
  addOptimistic({ type: "request_summary" });
  await requestSummary(articleId);
});
```

#### 3. Content Availability Guard — Double Enforcement Required

**Lesson**: The content guard must be enforced at **both** the Server Action layer AND the API Route layer. The API route is public; the Server Action is called from the UI. Both need validation.

```typescript
// In BOTH actions.ts AND route.ts
if (['title_only', 'excerpt'].includes(article.contentAvailability)) {
  return { error: "Cannot summarise articles with only title or excerpt" }; // 400
}
```

#### 4. Type Safety with `job.id` from BullMQ

**Issue**: BullMQ's `Job` type has `id` as `string | undefined`, causing `TS2339` when accessing `job.id`.

**Fix**: Assert presence before use:
```typescript
const job = await summarizeQueue.add(...);
if (!job?.id) throw new Error("Job creation failed");
// Now job.id is string
```

#### 5. Schema Enum vs Type Union Mismatch

**Issue**: The `summaryStatusEnum` in Drizzle schema defines 5 values. TypeScript unions derived from the schema may not match exactly.

**Fix**: Always derive types from the schema, not hand-written:
```typescript
import { summaryStatusEnum } from "@/lib/db/schema";

// ✅ Correct — derives from schema
type SummaryStatus = typeof summaryStatusEnum.enumValues[number];

// ❌ Wrong — hand-written, may drift
type SummaryStatus = 'none' | 'pending' | 'ok' | 'needs_review' | 'disabled';
```

#### 6. `summaryStatus` Does NOT Have an `"error"` State

**Critical**: The schema does not include `"error"` as a valid `summaryStatus`. When the summarisation worker fails, it should leave the status as `"none"` (allowing retry) or `"needs_review"` (for manual review). Do not use `"error"` — it will cause type errors.

### Phase 5 Recommendations

1. **Zod Schema Evolution**: Keep `summariseSchema.ts` version-controlled. When LLM capabilities improve, adjust constraints with new tests.
2. **Provenance Audit Trail**: The `flagReason` field is populated when an admin flags a summary. Disabled summaries retain `flagReason` for audit but show no UI.
3. **Rate Limiting Deferral**: Rate limiting for summarisation was deferred to Phase 6/8 (Redis-based). The API route currently has no rate limiting — document this in security reviews.
4. **Worker Implementation**: Phase 5 only built the enqueue endpoint and UI. The actual summarisation worker (calling Anthropic/OpenAI) is Phase 7.
5. **Test Monitoring**: Phase 5 added 47 tests. Monitor for test flakiness — `useOptimistic` tests may be timing-sensitive.

---

## Phase 6: Search, Admin & Public API — Lessons Learned

### Phase 6 Gotchas Discovered

#### 1. PostgreSQL FTS Extension Availability

**Issue**: `pg_textsearch` is NOT a separate extension in PostgreSQL 17. `ts_rank_cd()` and `to_tsvector` are built-in. Searching for "pg_textsearch extension" leads to misleading documentation.

**Fix**: Only `pg_trgm` needs explicit installation for autocomplete. Use `ts_rank_cd` and `websearch_to_tsquery` natively via Drizzle `sql` template literals.

```typescript
import { sql } from "drizzle-orm";

const tsQuery = sql`websearch_to_tsquery('english', ${query})`;
const rank = sql<number>`ts_rank_cd('{0.1, 0.2, 0.4, 1.0}', ${articles.searchVector}, ${tsQuery})`;
```

#### 2. `searchVector` Column `.notNull()` Contract

**Issue**: The `searchVector` generated column in `schema.ts` must include `.notNull()`. Omitting it causes Drizzle type mismatches.

**Fix**:
```typescript
searchVector: tsvector("search_vector")
  .generatedAlwaysAs(sql`...`)
  .notNull(),
```

#### 3. Drizzle `sql` Template Type Safety with SELECT

**Issue**: When using `sql<number>` for `ts_rank_cd` in a `.select()`, the value may return as a string or number depending on the driver. Always coerce with `Number()`. Also, ensure proper escaping when using `sql` for `where` clauses.

**Fix**:
```typescript
const rows = await db.select({ rank: sql<number>`ts_rank_cd(...)` }).from(articles);
// Coerce in mapping:
const rank = Number(row.rank) || 0;
```

#### 4. Admin Route Guard — Correct Layer

**Issue**: Placing `verifyAdminSession()` in `proxy.ts` is wrong. `proxy.ts` is Layer 0 (network boundary, no DB access). Admin auth belongs in Layer 1 (App Router layout).

**Fix**: Guard admin routes at `(admin)/layout.tsx`:
```typescript
export default async function AdminLayout({ children }) {
  await verifyAdminSession(); // Redirects non-admins to '/'
  return <AdminShell>{children}</AdminShell>;
}
```

#### 5. Search UI: Server/Client Component Boundary

**Issue**: Search needs both server-rendered initial results and client-side interactivity (debounce, URL sync, loading).

**Fix**: Use a Server Component page to fetch initial results, and a Client Component wrapper for interactivity.

```
page.tsx (Server) → fetches initial results
  └── SearchPageClient (Client) → state, debounce, URL sync
       ├── SearchBar (Client) → input, ⌘K shortcut
       └── SearchResults (RSC) → receives results via props
```

#### 6. pg_trgm Extension for Autocomplete

**Issue**: `pg_trgm` is not enabled by default on new PostgreSQL installations. `getSearchSuggestions()` using `similarity()` will fail silently if the extension is missing.

**Fix**: Run on database setup:
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

#### 7. CORS Headers on Public API

**Issue**: Forgetting `Access-Control-Allow-Origin` on `/api/articles` breaks external consumers.

**Fix**: Always include CORS headers and an `OPTIONS` handler:
```typescript
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
```

#### 8. `websearch_to_tsquery` vs `to_tsquery`

**Issue**: `to_tsquery` does not handle user input safely (requires `&`, `|` operators). `websearch_to_tsquery` handles natural language queries, quoted phrases, and negation.

**Fix**: Always use `websearch_to_tsquery('english', $query)` for user-facing search.

#### 9. API Route `cursor` Parsing

**Issue**: The `cursor` parameter in `/api/articles?cursor=...` is an ISO date string. Parsing it as a number or forgetting to validate it causes 500 errors.

**Fix**: Parse and validate the cursor before use:
```typescript
const cursor = searchParams.get("cursor");
const cursorDate = cursor ? new Date(cursor) : undefined;
if (cursor && isNaN(cursorDate.getTime())) {
  return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
}
```

#### 10. LIMIT 31 + 1 Pattern for Pagination

**Issue**: The `searchArticles()` query fetches `limit + 1` to determine `hasMore`. Forgetting to slice off the extra row causes off-by-one errors in the UI.

**Fix**:
```typescript
const rows = await db.select().from(articles).limit(limit + 1);
const hasMore = rows.length > limit;
const resultRows = rows.slice(0, limit); // Remove the extra row
```

### Phase 6 Recommendations

1. **BM25 Weight Tuning**: The `ts_rank_cd('{0.1, 0.2, 0.4, 1.0}', ...)` weights (D, C, B, A) may need adjustment based on real user queries. Title (A=1.0) and excerpt (B=0.4) weights seem correct for news, but monitor search quality metrics.

2. **Rate Limiting on Public API**: The `/api/articles` endpoint currently has no rate limiting. Implement Redis-based burst limiting in Phase 8 (max 20 req/s per IP, burst 50). `ioredis` is already a dependency.

3. **Autocomplete Debounce**: The `getSearchSuggestions()` function is called on every keystroke. Consider debouncing at the UI layer (already done in `SearchBar` with `useDebounce`) AND adding a minimum character threshold (≥2 chars).

4. **Admin Table Pagination**: The `/admin/sources` and `/admin/summaries` pages fetch ALL rows. For production with many sources, add server-side pagination.

5. **Source Soft Delete**: The `deleteSource()` action sets `isActive = false` rather than removing the row. This preserves referential integrity with `articles.sourceId` but means "deleted" sources still appear in the database. Consider archiving to a separate table if source count grows.

6. **Search Result Caching**: Search results are not currently cached. Consider caching frequent queries with `cacheLife('search')` profile. Cache invalidation strategy: clear on article ingestion (when new articles may match existing queries).

7. **Cross-Field Search**: Currently search only looks at `title` and `excerpt`. Consider adding `sources.name` or `categories.name` to the `searchVector` if users want to search by source or category.

---

## Updated File Inventory (Post-Phase 6)

| New Files | Phase | Purpose |
|-----------|-------|---------|
| `src/features/summaries/lib/summariseSchema.ts` | 5 | Zod schema for AI output validation |
| `src/features/summaries/lib/summariseSchema.test.ts` | 5 | 10 TDD tests |
| `src/lib/ai/prompts.ts` | 5 | Prompt templates with EU AI Act compliance |
| `src/lib/ai/provenance.ts` | 5 | 3-layer provenance (JSON-LD, HTTP header, meta) |
| `src/lib/ai/provenance.test.ts` | 5 | 4 TDD tests |
| `src/features/summaries/components/DisclosureBadge.tsx` | 5 | Status indicator with accessible dot |
| `src/features/summaries/components/DisclosureBadge.test.tsx` | 5 | 6 TDD tests |
| `src/features/summaries/components/NutritionLabel.tsx` | 5 | Source-cited transparency panel |
| `src/features/summaries/components/NutritionLabel.test.tsx` | 5 | 6 TDD tests |
| `src/features/summaries/components/SummaryPanel.tsx` | 5 | 5-state state machine |
| `src/features/summaries/components/SummaryPanel.test.tsx` | 5 | 6 TDD tests |
| `src/features/summaries/actions.ts` | 5 | Server Actions for requesting summaries |
| `src/app/api/summarize/[id]/route.ts` | 5 | POST endpoint with content guard |
| `src/features/search/queries.ts` | 6 | FTS queries with `ts_rank_cd` BM25 ranking |
| `src/features/search/queries.test.ts` | 6 | Edge case tests (empty query, whitespace) |
| `src/features/search/types.ts` | 6 | `SearchResult`, `SearchPage`, `SearchParams` |
| `src/features/search/components/SearchBar.tsx` | 6 | Client input with debounce, ⌘K shortcut, clear button |
| `src/features/search/components/SearchResults.tsx` | 6 | Server results display with loading/empty states |
| `src/app/(public)/search/page.tsx` | 6 | Server-rendered search page with URL persistence |
| `src/app/(public)/search/SearchPageClient.tsx` | 6 | Client wrapper for interactivity |
| `src/app/api/articles/route.ts` | 6 | Public REST API with CORS, cache-control |
| `src/app/(admin)/layout.tsx` | 6 | Admin layout with `verifyAdminSession()` guard |
| `src/app/(admin)/sources/page.tsx` | 6 | Source management table with status badges |
| `src/app/(admin)/sources/actions.ts` | 6 | CRUD Server Actions for sources |
| `src/app/(admin)/summaries/page.tsx` | 6 | Summary review queue for `needs_review` |
| `src/workers/index.ts` | 7 | Worker entry point (4 BullMQ workers, graceful shutdown) |
| `src/workers/jobs/scheduler.ts` | 7 | Idempotent job scheduler via `upsertJobScheduler()` |
| `src/workers/jobs/determineContentAvailability.ts` | 7 | Content guard (title_only → full_text classification) |
| `src/workers/jobs/determineContentAvailability.test.ts` | 7 | 8 TDD tests covering all four content availability classes |
| `src/lib/security/encrypt.ts` | 7 | AES-256-GCM push key encryption/decryption |
| `src/lib/security/encrypt.test.ts` | 7 | 4 TDD tests (round-trip, IV randomness, invalid format) |
| `src/workers/push/isWithinQuietHours.ts` | 7 | DST-safe quiet hours with luxon |
| `src/workers/push/isWithinQuietHours.test.ts` | 7 | 6 TDD tests (overnight wrap, same-day, DST transitions) |
| `src/app/api/push/subscribe/route.ts` | 7 | Zod-validated push subscription endpoint with encryption |
| `src/workers/lib/cacheInvalidation.ts` | 7 | Redis-based cache invalidation for worker-to-web-app communication |
| `src/workers/lib/cacheInvalidation.test.ts` | 7 | 3 TDD tests for cache invalidation (publish, error handling, Redis integration) |
| `.github/workflows/ci.yml` | 8 | GitHub Actions CI pipeline (TypeScript, lint, tests, build, schema validation) |
| `.github/workflows/e2e.yml` | 8 | GitHub Actions E2E pipeline (Playwright on Chromium, Firefox, WebKit) |
| `lighthouserc.js` | 8 | Lighthouse CI configuration with performance budgets (Perf ≥90, A11y ≥95) |
| `Dockerfile.web` | 8 | Multi-stage production Dockerfile for Next.js 16 web app |
| `Dockerfile.worker` | 8 | Production Dockerfile for Node.js 24 worker service |
| `docker-compose.prod.yml` | 8 | Production Docker Compose (web + worker + PostgreSQL 17 + Redis 7) |
| `scripts/deploy.sh` | 8 | Tagged release deployment script with rollback support |
| `src/test/setup.ts` | 8 | Global Vitest test setup file |
| `src/features/feed/components/FeedData.tsx` | 9 | Server Component for Suspense-bound data fetching (blocking-route fix) |
| `src/features/feed/components/FeedSkeleton.tsx` | 9 | Loading fallback for feed grid during data fetch |

---

## Phase Status Tracker

| Phase | Status | Key Deliverables |
| :--- | :--- | :--- |
| **Phase 1** — Foundation & Configuration | **COMPLETE** | next.config.ts, proxy.ts, tsconfig.json, docker-compose |
| **Phase 2** — Database Schema & Infrastructure | **COMPLETE** | Drizzle schema (10 tables), lazy DB client, Auth.js v5, BullMQ queues |
| **Phase 3** — Design System & Shared Components | **COMPLETE** | Button, Badge, Skeleton, Header, Footer, useDebounce, useReducedMotion, PageTransition |
| **Phase 4** — Core Feed Feature | **COMPLETE** | Domain layer, feed queries, FeedGrid, ArticleCard, home/topic/article routes |
| **Phase 5** — AI Summarisation Pipeline | **COMPLETE** | Zod schema, prompts, 3-layer provenance, NutritionLabel, SummaryPanel, actions, API route |
| **Phase 6** — Search, Admin & Public API | **COMPLETE** | FTS search (`ts_rank_cd` BM25), admin routes, source CRUD, summary review, `/api/articles` (103+ tests) |
| **Phase 7** — Worker Service, Push & Observability | **COMPLETE** | Worker entry point, 4 BullMQ workers, scheduler, content guard, AES-256-GCM encryption, DST-safe quiet hours, push subscribe API, cache invalidation (124 tests, 24 suites) |
| **Phase 8** — Testing, CI/CD & Deployment | **COMPLETE** | GitHub Actions CI/E2E pipelines, multi-stage Dockerfiles (web + worker), docker-compose.prod.yml, Lighthouse CI, Vitest coverage thresholds, deployment script |

---

*This AGENTS.md mirrors the authoritative Project Architecture Document v4.5 and Project Requirements Document v4.3. When the instructions here and the PAD/PRD diverge, the PAD/PRD are the source of truth.*
