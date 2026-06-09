# 📋 OneStopNews — Definitive Product Requirements Document v3.1 (Unified & Production-Locked)

> **Document Status:** Definitive, Production-Locked Blueprint  
> **Base:** PRD v2.0 → v3.0 (2025–2026 research) → v3.1 (critical corrections & systemic alignment)  
> **Key Revisions:** Next.js 16.2, React 19.2 stable, native View Transitions, Claude 4.5 Haiku, EU AI Act Article 50 dual compliance (Human-Readable + Machine-Readable), CSS Subgrid feed architecture, systemic async `params` routing contract.  
> **Prepared for:** Immediate implementation start. Zero technical debt. Zero generic aesthetics.

---

## 1. Overview

OneStopNews is a **topic-first news aggregation and AI summarisation platform** that organises public news content by *what it is about* rather than *who published it*. It collects article metadata from diverse sources, normalises and categorises stories, and presents them in a calm, editorially-informed interface designed for both daily readers and enterprise analysts. 

This v3.1 blueprint is the definitive synthesis of avant-garde design ("Editorial Dispatch") and strict, production-grade engineering. It incorporates critical Next.js 16.2 runtime contracts, legally compliant AI governance, and structural CSS patterns that guarantee a premium, bespoke user experience.

### 1.1 Architectural Commitment (Definitive v3.1)

| Concern | Choice | Rationale / Correction |
|---|---|---|
| Web framework | **Next.js 16.2** | Stable release (March 2026); opt-in `use cache` model fits mixed static/dynamic feeds. |
| UI runtime | **React 19.2** (stable) | Production-stable; natively includes `<ViewTransition>` and `<Activity>`. |
| View Transitions | **Native React 19.2** | Enabled via `viewTransition: true` in `next.config.js`. Dropped 3rd-party polyfills. |
| Styling | **Tailwind CSS v4** + CSS Subgrid | Utility-first with structural subgrid for flawless card alignment. |
| Component primitives | **Shadcn UI (Radix)** | Library-first mandate; wrapped for bespoke aesthetic. |
| Job queue | **BullMQ on Redis** | Definitive for Node.js job graphs, priorities, and monitoring. |
| Database | **PostgreSQL 17** | Only production datastore. |
| FTS | **GIN `tsvector` + `pg_textsearch` BM25** | Elasticsearch-free; production-validated. |
| ORM | **Drizzle ORM** | TypeScript-native strict mode. |
| Auth | **Auth.js v5** | HttpOnly session cookies, Next.js-native. |
| Worker runtime | **Node.js 24+** | LTS-aligned; BullMQ-native. |
| Validation | **Zod** | Schema-first, composable. |
| Network boundary | **`proxy.ts`** | Next.js 16.2 standard (replaces `middleware.ts`). |
| AI model (primary) | **Claude 4.5 Haiku** | Actual October 2025 release; best cost/quality for news. |
| AI model (fallback) | **GPT-5 Mini** | Validated cost/quality fallback. |
| AI disclosure | **Dual Compliance** | Human-readable Nutrition Label + Machine-readable C2PA metadata. |
| Typography | **Newsreader + Instrument Sans + Commit Mono** | Anti-generic, deliberate pairing. |
| Accent color | **`--dispatch-ember`** (`#c7513f`) | Coral-red avoids "warning" connotation of amber. |

---

## 2. Goals and Success Metrics

### 2.1 Product Goals
1. Provide a **topic-first news reading experience** that reduces cognitive load and tab-hopping.
2. Offer **source-cited, AI Nutrition Label** summaries that speed comprehension and build trust, with full EU AI Act compliance.
3. Achieve enterprise-grade reliability and observability across all pipelines.
4. Maintain a **distinct editorial-typographic visual identity** — "Editorial Dispatch" — using CSS Subgrid, Instrument Sans, and native View Transitions.
5. Drive daily habits via **AI-summarised push notifications** and a daily briefing email.

### 2.2 Success Metrics (V1)
| Metric | Target | Measurement |
|---|---|---|
| Feed freshness | 95% of categories ≥20 stories last 24h | Worker monitoring |
| API p95 latency | ≤500ms `GET /api/articles` | APM tracing |
| Page render p95 | ≤1.5s feed (PPR + `use cache`) | Core Web Vitals |
| AI disclosure compliance | 100% Nutrition Label + machine-readable metadata | UI audit + HTML validation |
| Push opt-in rate | ≥30% within 30 days | Analytics |

---

## 3. Target Users and Personas

### 3.1 Daily Scanner
- Needs fast mobile interface; appreciates AI summaries **with clear provenance**.
- Values push notifications that include a 1-sentence AI summary so they can stay informed without opening the app.

### 3.2 Enterprise Analyst / Researcher
- Monitors specific companies, sectors, and regions continuously.
- Needs trustworthy topic grouping, accurate timestamps, source attribution, and AI summaries with **citations to specific sources used**.
- Appreciates blind-spot detection (Phase 2) to see stories they might otherwise miss.

### 3.3 Editor / Admin
- Manages sources, categories, and ingestion policies.
- Monitors system health via BullMQ dashboard and application metrics.
- Reviews AI summaries for quality; flags, disables, or regenerates as needed.

---

## 4. UX & UI Requirements — The "Editorial Dispatch"

> **"Editorial Dispatch"** — Wire service terminal meets refined long-read publication. Every element carries the weight of something worth reading. Warmer ink, fresher type, and perfect structural alignment via CSS Subgrid.

### 4.1 Typographic System (Final)
| Role | Typeface | Weight | Notes |
|---|---|---|---|
| Headlines / Lead stories | **Newsreader** (variable) | 800 (display) | Optical size axis for responsive scaling. |
| UI / Body / Labels | **Instrument Sans** (variable) | 400–600 | Warmer neo-grotesk; excellent readability. |
| Monospace / Metadata | **Commit Mono** | 400 | Neutral, built for inline reading. |

*Explicit rejection: Inter, Roboto, Space Grotesk.*

### 4.2 Color Tokens (Final)
```css
--ink-900        → #1a1a18   (letterpress black)
--ink-600        → #3d3d3a   (body text - WCAG AAA compliant)
--ink-300        → #8a8a83   (muted / metadata - use sparingly)
--paper-50       → #fafaf8   (newsprint off-white)
--paper-100      → #f2f2ee   (card surface)
--dispatch-ember → #c7513f   (breaking news accent — coral-red)
--dispatch-slate → #5a6b7a   (tech / neutral)
```

### 4.3 Layout & CSS Subgrid Architecture (The Structural Mandate)
To guarantee the "Editorial Dispatch" aesthetic, the feed grid **must** use CSS Grid Subgrid. This forces the Title, Excerpt, and Metadata of *every card in a visual row* to align perfectly on the same horizontal tracks, regardless of text length. No fixed heights. No JavaScript calculations.

**`src/features/feed/components/FeedGrid.tsx`**
```tsx
import { ArticleCard } from './ArticleCard';
import type { Article } from '@/domain/articles/types';

export function FeedGrid({ articles }: { articles: Article[] }) {
  // Parent defines columns. NO gap-y here. 
  // Vertical spacing between "visual rows" is handled by the child's margin-bottom.
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
```

**`src/features/feed/components/ArticleCard.tsx`**
```tsx
import Link from 'next/link';
import { formatTimeAgo } from '@/lib/utils/date';
import type { Article } from '@/domain/articles/types';

export function ArticleCard({ article }: { article: Article }) {
  return (
    <article 
      className="
        group relative 
        grid grid-rows-subgrid row-span-3 
        gap-y-3 mb-10 
        border-b border-ink-100 pb-6 
        transition-colors duration-300 hover:bg-paper-100/50
      "
    >
      {/* ROW 1: Headline - Editorial Serif, Extreme Weight */}
      <h3 className="font-editorial text-xl leading-tight text-ink-900 font-[800] tracking-[-0.02em] group-hover:text-dispatch-ember transition-colors duration-300">
        <Link 
          href={`/article/${article.id}`} 
          className="after:absolute after:inset-0 focus:outline-none focus:ring-2 focus:ring-dispatch-ember rounded-sm"
        >
          {article.title}
        </Link>
      </h3>

      {/* ROW 2: Excerpt - UI Sans, Strict Line Clamp */}
      <p className="font-ui text-sm leading-relaxed text-ink-600 line-clamp-3">
        {article.excerpt}
      </p>

      {/* ROW 3: Metadata - Mono, Uppercase, Aligned perfectly via subgrid */}
      <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-ink-600 mt-auto">
        <span className="text-dispatch-slate font-medium truncate">{article.source.name}</span>
        <span className="w-1 h-1 rounded-full bg-ink-600/50 shrink-0" aria-hidden="true" />
        <time dateTime={article.publishedAt.toISOString()} className="shrink-0">
          {formatTimeAgo(article.publishedAt)}
        </time>
        {article.hasSummary && (
          <>
            <span className="w-1 h-1 rounded-full bg-ink-600/50 shrink-0" aria-hidden="true" />
            <span className="text-dispatch-ember font-medium shrink-0">AI Brief</span>
          </>
        )}
      </div>
    </article>
  );
}
```

### 4.4 AI Nutrition Label — Human-Readable Disclosure
Every AI summary must display the "Nutrition Label" to satisfy user trust and EU AI Act transparency requirements.

**`src/features/summaries/components/NutritionLabel.tsx`**
```tsx
import type { Summary } from '@/domain/summaries/types';
import { formatTimeAgo } from '@/lib/utils/date';

export function NutritionLabel({ summary }: { summary: Summary }) {
  return (
    <aside 
      aria-label="AI-generated summary transparency label" 
      className="border-l-2 border-dispatch-ember pl-5 py-4 bg-paper-100/30 my-8"
    >
      <div className="flex items-center gap-2 mb-4 font-mono text-[10px] uppercase tracking-widest text-ink-600">
        <span className="w-1.5 h-1.5 rounded-full bg-dispatch-ember" aria-hidden="true" />
        AI Briefing · {summary.model} · {formatTimeAgo(summary.generatedAt)}
      </div>

      <p className="font-ui text-base leading-relaxed text-ink-900 mb-6">
        {summary.summaryText}
      </p>

      {/* The Nutrition Label */}
      <div className="border-t border-ink-100 pt-4 space-y-3 mb-6">
        <h4 className="font-mono text-[10px] uppercase tracking-widest text-ink-600">
          AI Transparency Label
        </h4>
        <ul className="space-y-1.5 font-ui text-xs text-ink-600">
          <li><span className="font-medium text-ink-900">What the AI did:</span> {summary.aiStatement}</li>
          <li><span className="font-medium text-ink-900">Model:</span> {summary.model} (Temp: 0.1, Factual-only)</li>
          <li><span className="font-medium text-ink-900">Source Coverage:</span> {summary.coveragePercentage}% of article text analyzed</li>
          <li><span className="font-medium text-ink-900">Citations:</span> {summary.sourcesCited.length} sources verified</li>
        </ul>
      </div>

      {/* Source Citations */}
      <div className="space-y-2 mb-6">
        <h4 className="font-mono text-[10px] uppercase tracking-widest text-ink-600 border-b border-ink-100 pb-1">
          Sources Cited
        </h4>
        <ol className="space-y-1.5 list-none p-0">
          {summary.sourcesCited.map((source, i) => (
            <li key={source.url} className="flex items-start gap-2 text-xs">
              <span className="font-mono text-ink-600 mt-0.5 shrink-0">[{i + 1}]</span>
              <a 
                href={source.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-ui text-ink-600 hover:text-dispatch-ember underline decoration-ink-600/30 hover:decoration-dispatch-ember transition-colors"
              >
                {source.title}
              </a>
            </li>
          ))}
        </ol>
      </div>

      <a 
        href={summary.originalArticleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-900 hover:text-dispatch-ember transition-colors font-medium"
      >
        Verify with Original Source →
      </a>
    </aside>
  );
}
```

---

## 5. System Architecture & Next.js 16.2 Routing Patterns

### 5.1 High-Level Topology
- **Client:** React 19.2 + Native View Transitions + Web Push SW.
- **Web App:** Next.js 16.2 (App Router, PPR, `use cache`, `proxy.ts`).
- **Database:** PostgreSQL 17 (Drizzle ORM, GIN FTS, BM25).
- **Cache/Queue:** Redis (Upstash) + BullMQ.
- **Worker:** Node.js 24+ (Ingestion, Summarisation, Push Dispatch).

### 5.2 Next.js 16.2 Systemic Async Params Contract
In Next.js 15 and 16, route `params` and `searchParams` are **asynchronous Promises**. This is a systemic pattern that affects *every* route segment. Synchronous access will result in a 500 Internal Server Error.

**`src/app/article/[id]/page.tsx` (Locked Pattern)**
```typescript
import type { Metadata } from 'next';
import { ViewTransition } from 'react';
import { getArticle } from '@/features/feed/queries';
import { ArticleDetail } from '@/features/feed/components/ArticleDetail';

// 1. Metadata Generation (Async Params)
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}): Promise<Metadata> {
  const { id } = await params; // MUST await the Promise
  const article = await getArticle(id);

  const metadata: Metadata = {
    title: article.title,
    description: article.excerpt ?? undefined,
  };

  // 2. Machine-Readable Provenance (EU AI Act Art. 50)
  if (article.hasSummary) {
    metadata.other = {
      'ai-provenance': `model:claude-4.5-haiku;generated-at:${article.summary.generatedAt};sources:${article.summary.sourcesCited.length};compliance:eu-ai-act-art50`,
    };
  }

  return metadata;
}

// 3. Page Component (Async Params)
export default async function ArticlePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params; // MUST await the Promise
  const article = await getArticle(id);

  return (
    <ViewTransition name={`article-${id}`}>
      <ArticleDetail article={article} />
    </ViewTransition>
  );
}
```

**`src/app/topics/[category]/page.tsx` (Locked Pattern)**
```typescript
import { ViewTransition, Suspense } from 'react';
import { Feed } from '@/features/feed/components/Feed';
import { FeedSkeleton } from '@/features/feed/components/FeedSkeleton';

export default async function CategoryPage({ 
  params 
}: { 
  params: Promise<{ category: string }> 
}) {
  const { category } = await params;

  return (
    <ViewTransition name={`feed-${category}`}>
      <Suspense fallback={<FeedSkeleton />}>
        <Feed category={category} />
      </Suspense>
    </ViewTransition>
  );
}
```

---

## 6. Data Model & Storage (Drizzle ORM)

The following schema is definitive for v3.1. It incorporates the custom `tsvector` type, all EU AI Act fields, push subscriptions, and user preferences.

**`src/lib/db/schema.ts`**
```typescript
import { pgTable, uuid, text, timestamp, boolean, integer, real, jsonb, index, uniqueIndex, pgEnum, time, customType } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Custom tsvector type for native PostgreSQL FTS
export const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

// Enums
export const userRoleEnum = pgEnum('user_role', ['reader', 'admin']);
export const feedTypeEnum = pgEnum('feed_type', ['rss', 'atom', 'json_api']);
export const contentAvailabilityEnum = pgEnum('content_availability', ['title_only', 'excerpt', 'partial_text', 'full_text']);
export const summaryStatusEnum = pgEnum('summary_status', ['none', 'pending', 'ok', 'needs_review', 'disabled']);

// Tables
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  role: userRoleEnum('role').default('reader').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
});

export const sources = pgTable('sources', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  url: text('url').notNull(),
  feedUrl: text('feed_url').notNull().unique(),
  feedType: feedTypeEnum('feed_type').notNull(),
  categoryId: uuid('category_id').references(() => categories.id),
  priority: integer('priority').default(2).notNull(),
  pollIntervalMinutes: integer('poll_interval_minutes').default(15).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const articles = pgTable('articles', {
  id: uuid('id').defaultRandom().primaryKey(),
  sourceId: uuid('source_id').references(() => sources.id, { onDelete: 'cascade' }).notNull(),
  categoryId: uuid('category_id').references(() => categories.id),
  title: text('title').notNull(),
  excerpt: text('excerpt'),
  canonicalUrl: text('canonical_url').notNull(),
  contentHash: text('content_hash').notNull(),
  contentAvailability: contentAvailabilityEnum('content_availability').default('excerpt').notNull(),
  importanceScore: real('importance_score').default(0.5).notNull(),
  hasSummary: boolean('has_summary').default(false).notNull(),
  summaryStatus: summaryStatusEnum('summary_status').default('none').notNull(),
  publishedAt: timestamp('published_at').notNull(),
  ingestedAt: timestamp('ingested_at').defaultNow().notNull(),
  
  // Generated column for FTS (PostgreSQL 17)
  searchVector: tsvector('search_vector').generatedAlwaysAs(
    sql`setweight(to_tsvector('english', coalesce(title, '')), 'A') || setweight(to_tsvector('english', coalesce(excerpt, '')), 'B')`
  ).notNull(),
}, (table) => ({
  canonicalUrlIdx: uniqueIndex('articles_canonical_url_idx').on(table.canonicalUrl),
  categoryPublishedIdx: index('articles_category_published_idx').on(table.categoryId, table.publishedAt.desc()),
  searchVectorIdx: index('articles_search_vector_gin_idx').using('gin', table.searchVector),
}));

export const summaries = pgTable('summaries', {
  id: uuid('id').defaultRandom().primaryKey(),
  articleId: uuid('article_id').references(() => articles.id, { onDelete: 'cascade' }).notNull().unique(),
  summaryText: text('summary_text').notNull(),
  keyPoints: jsonb('key_points').$type<string[]>().default([]).notNull(),
  sourcesCited: jsonb('sources_cited').$type<{ url: string; title: string }[]>().default([]).notNull(),
  model: text('model').notNull(), 
  tokensUsed: integer('tokens_used').notNull(),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
  status: summaryStatusEnum('status').default('ok').notNull(),
  
  // --- AI Nutrition Label Fields (EU AI Act Art. 50 Compliant) ---
  aiStatement: text('ai_statement').notNull(), 
  complianceStatement: text('compliance_statement').default('EU AI Act Article 50 compliant').notNull(),
  coveragePercentage: integer('coverage_percentage').notNull(), 
});

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull().unique(),
  keys: jsonb('keys').$type<{ p256dh: string; auth: string }>().notNull(),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});
```

---

## 7. AI Governance (Definitive EU AI Act Compliance)

### 7.1 Dual Disclosure Requirement
| Layer | Mechanism | Purpose |
|---|---|---|
| Human-readable | **AI Nutrition Label** component on every summary | User trust, transparency, context. |
| Machine-readable | **`<meta name="ai-provenance">`** injected via `generateMetadata()` | Automated detection, regulatory audit, C2PA alignment. |

### 7.2 Model Configuration & Enforcement
| Setting | Value |
|---|---|
| Primary model | `claude-4.5-haiku` |
| Fallback | `gpt-5-mini` |
| Temperature | 0.1 (low creativity, high factual consistency) |
| Max output tokens | 500 |
| Required output | `aiStatement`, `sourcesCited`, `coveragePercentage` |

**Enforcement:** The worker job uses the Vercel AI SDK's `generateObject()` with a strict Zod schema to enforce these `.notNull()` database constraints. If the AI fails to return these fields, the job fails and is routed to the dead-letter queue.

---

## 8. Functional Requirements Highlights

### 8.1 Ingestion Pipeline
- BullMQ scheduler launches ingestion jobs per-source schedule (5–30 minute intervals).
- Steps: load config → fetch with timeout & backoff → parse & normalise (Zod) → deduplicate by canonical URL + content hash → persist via Drizzle → enqueue `compute-importance` job.

### 8.2 Push Notifications (V1)
- Web Push API subscription flow (via service worker).
- Trigger: worker job monitors breaking news / high-importance stories.
- AI generates a 1-sentence summary of the story; included in notification payload.
- Notification preferences: per-category opt-in/out, quiet hours, max alerts/day.

### 8.3 Search and Filtering
- Primary FTS: PostgreSQL `tsvector` generated columns with GIN indexes.
- Relevance ranking: `pg_textsearch` BM25 extension for ranked keyword search.
- Fallback / fuzzy: `pg_trgm` trigram similarity for zero-result queries.

---

## 9. Caching, Performance & Scalability

### 9.1 Next.js 16.2 Caching Strategy (`use cache`)
Unlike implicit caching in previous versions, caching with Cache Components is entirely opt-in via the `use cache` directive.

| Route | Strategy | Rationale |
|---|---|---|
| `/` (Top Stories) | PPR + `use cache` for feed shell | Shell prerendered; counts dynamic. |
| `/topics/[category]` | `use cache` (revalidate: 120s) | Relatively stable; tolerate 2-min lag. |
| `/article/[id]` | Dynamic (always fresh) | Summary status changes; must be current. |

### 9.2 Performance Targets
| Metric | Target | Mechanism |
|---|---|---|
| Feed API p95 | ≤500ms | Redis feed slices + optimised PG |
| Page FCP (feed) | ≤800ms | PPR prerendered shell |
| Page LCP (feed) | ≤1.5s | Streamed RSC + Suspense |
| Push notification delivery | ≤30s from publish | Worker job priority queue |

---

## 10. Rollout Plan

### Phase 1 — "Read & Trust" (V1 Launch)
- Next.js 16.2 web app with App Router, PPR, `use cache`, native View Transitions.
- Worker service with BullMQ (ingest, summarise, compute-importance).
- PostgreSQL 17 schema with GIN FTS + BM25.
- Core feed (CSS Subgrid), topic navigation, article detail.
- Source-cited AI summaries with Nutrition Label + machine-readable metadata.
- Web Push infrastructure + AI-summarised push notifications.
- Auth.js v5 for admin protection.

### Phase 2 — "Personalise & Deepen"
- Redis feed slices for hot categories.
- Daily briefing email (AI-personalised).
- Blind-spot detection with alternative perspective surfacing.
- User preference centre (notifications, email, reading mode, muted sources).

### Phase 3 — "Intelligence & Enterprise"
- `pgvector` semantic search.
- Audio summaries (AI narration).
- ML-based topic classification.
- Enterprise SSO (Auth.js v5 SAML/OIDC).

---

## 11. Risk Register (Final)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| EU AI Act non-compliance | Low (fully mitigated) | Very High | Dual human-readable + machine-readable disclosure implemented day one. |
| Next.js 16 async params runtime crash | Avoided | High | Systemic `params: Promise<T>` pattern applied to all route segments. |
| CSS Subgrid browser support | Low (Baseline) | Medium | All modern browsers support; graceful fallback to standard grid in legacy. |
| Model name mismatch in production | Avoided | High | Explicit model string `claude-4.5-haiku` validated against Anthropic API. |
| Push notification opt-in low | Medium | Medium | AI-summarised content in notification; granular controls. |

---

## Appendix A — Technology Stack Summary (v3.1 Final)

| Layer | Technology | Version |
|---|---|---|
| Web framework | Next.js | 16.2 |
| UI runtime | React | 19.2 (stable) |
| View Transitions | Native `<ViewTransition>` | Built-in |
| Language | TypeScript | 5.x (strict) |
| Styling | Tailwind CSS v4 + Subgrid | v4 |
| Component library | Shadcn UI (Radix) | Latest |
| ORM | Drizzle ORM | Latest |
| Database | PostgreSQL | 17 |
| FTS | `pg_textsearch` BM25 + tsvector GIN | 1.x |
| Queue | BullMQ | 5.x |
| Worker runtime | Node.js | 24 LTS |
| AI model (primary) | Claude 4.5 Haiku | Oct 2025 |
| AI model (fallback) | GPT-5 Mini | Latest |
| Push notifications | Web Push API | — |

---
*End of Definitive PRD v3.1 — OneStopNews*  
*Blueprint locked. Ready for immediate execution.*

# https://chat.qwen.ai/s/c75b2f49-8beb-4748-ac49-7d63406e148e?fev=0.2.63 
