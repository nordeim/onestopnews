# 📋 OneStopNews — Refined Product Requirements Document v3.0

> **Document Status:** Research-validated, production-aligned, “current & popular” refinement  
> **Base:** PRD v2.0 (2025 research) → v3.0 (June 2026 research)  
> **Research grounding:** 5 new dimensions — architecture, AI/trust, competitive landscape, browser APIs, design trends  
> **Key updates:** AI model refresh, EU AI Act compliance, cross-platform push notifications, “AI Nutrition Label” disclosure, Instrument Sans typography, Scroll-Driven Animations, blind-spot detection, daily briefing emails

---

## 1. Overview

OneStopNews is a **topic-first news aggregation and AI summarization platform** that organises public news content by *what it is about* rather than *who published it*. It collects article metadata from many sources, normalises and categorises stories, and presents them in a calm, editorially-informed interface designed for both daily readers and enterprise analysts. This v3.0 blueprint adds cross-platform push notifications, AI-summarised alerts, a daily briefing email, and a research-backed AI disclosure system that meets EU AI Act requirements.

### 1.1 Architectural Commitment (Definitive)

| Concern | Choice | Rationale |
|---|---|---|
| Web framework | **Next.js 16.1** (App Router, PPR, `use cache`) | Production-stable; opt-in caching model fits news feed’s mixed static/dynamic nature |
| UI runtime | **React 19.3** (`useOptimistic`, `Activity`, View Transitions) | Instant feedback for bookmark/save; background summary loading |
| Styling | **Tailwind CSS v4** + custom design tokens | Utility-first with zero generic defaults |
| Components | **Shadcn UI** (Radix primitives) wrapped for bespoke aesthetic | Library-first; custom styling for anti-generic look |
| View Transitions | **`next-view-transitions`** (Vercel library) | Declarative MPA transitions; cross-browser Baseline Widely Available |
| Job queue | **BullMQ on Redis** | Purpose-fit for complex job graphs, priorities, scheduled polling, and monitoring dashboard |
| Database | **PostgreSQL 17** | Only production datastore |
| FTS | **GIN-indexed `tsvector` + `pg_textsearch` BM25** | Elasticsearch-free; production-validated at 138M documents |
| ORM | **Drizzle ORM** | TypeScript-native, strict-mode compatible |
| Auth | **Auth.js v5** (session cookies, HttpOnly) | Modern, Next.js‑native |
| Worker runtime | **Node.js 24+** | LTS-aligned; BullMQ-native |
| Validation | **Zod** | Schema-first, composable |
| Network boundary | **`proxy.ts`** (replaces `middleware.ts`) | Next.js 16.1 boundary clarity |
| Push notifications | **Web Push API** (cross-platform, incl. iOS Safari 16.4+) | Opens push for entire user base |
| AI model (primary) | **Claude 4 Haiku** | Best cost/quality for news summarisation (June 2026) |
| AI model (fallback) | **GPT-5 Mini** | Lower cost, bulk/initial pass |

### 1.2 Scope

This PRD covers:
- Product requirements (features, UX, roles) for OneStopNews
- Concrete, production-grade architecture
- Non-functional requirements for performance, reliability, observability, and AI governance
- AI notification summaries, daily briefing email, and source transparency features (V1 & Phase 2)

**Out of scope (this iteration):** Full microservice decomposition, dedicated data warehouse, advanced ML personalisation, `pgvector` semantic search (Phase 3).

---

## 2. Goals and Success Metrics

### 2.1 Product Goals

1. Provide a **topic-first news reading experience** that reduces cognitive load and tab-hopping.
2. Offer **source-cited, disclosure-first AI summaries** that speed up comprehension while maintaining trust through “AI Nutrition Labels” and EU AI Act compliance.
3. Achieve enterprise-grade reliability and observability across all pipelines.
4. Maintain a **distinct editorial-typographic visual identity** that is anti-generic but highly usable.
5. Drive daily habit through **AI-summarised push notifications** and a **daily briefing email**.

### 2.2 Scale Assumptions

| Dimension | Target |
|---|---|
| Sources | 50–200 RSS/Atom/API sources |
| Ingestion volume | 20k–100k candidate articles/day post-dedup |
| Peak burst | 3–5× normal volume during major events |
| MAU (early enterprise) | Up to low hundreds of thousands |
| Read/write ratio | ~95% reads → aggressive feed caching |

### 2.3 Success Metrics (V1)

| Metric | Target | Measurement |
|---|---|---|
| Feed freshness | 95% of category feeds show ≥20 stories from last 24h | Worker job monitoring |
| API p95 latency | ≤500ms server time for `GET /api/articles` under normal load | APM tracing |
| Page render p95 | ≤1.5s for main feed (PPR + Cache Components) | Core Web Vitals / RUM |
| Summarisation coverage | 30–50% of viewed high-interest articles have summaries within 24h | DB analytics |
| Summary trust rate | <1% of audited summaries flagged for material factual errors | Manual sampling |
| Availability | 99.5% monthly for read APIs + ingestion | Uptime monitoring |
| AI trust disclosure compliance | 100% of summaries shown with AI Nutrition Label + EU AI Act statement | UI audit |
| Push notification opt-in rate | ≥30% within first 30 days | Analytics |
| Daily briefing email open rate | ≥40% (industry avg 21%) | Email analytics |

---

## 3. Target Users and Personas

### 3.1 Daily Scanner
- Checks news multiple times daily; skims headlines and excerpts.
- Thinks in topics (“What’s happening with AI regulation?”) rather than outlets.
- Needs fast, clean interface on mobile and desktop. Appreciates AI summaries as time-savers **when clearly sourced**.
- Values push notifications that include a 1-sentence AI summary so they can stay informed without opening the app.

### 3.2 Enterprise Analyst / Researcher
- Works in finance, policy, or corporate strategy.
- Monitors specific companies, sectors, and regions continuously.
- Needs trustworthy topic grouping, accurate timestamps, source attribution, and AI summaries with **citations to specific sources used** — not a black-box compression.
- Appreciates blind-spot detection to see stories they might otherwise miss due to filter bubbles.

### 3.3 Editor / Admin
- Manages sources, categories, and ingestion policies.
- Monitors system health via BullMQ dashboard and application metrics.
- Reviews AI summaries for quality; flags, disables, or regenerates as needed.

---

## 4. Use Cases and User Stories

### 4.1 Topic-First Browsing
- As a user, I can select a topic (e.g., Tech News) and subtopic (e.g., AI & ML) to see the latest stories across sources.
- As a user, I can quickly switch topics via a sticky topic navigation ribbon with live story counts.

### 4.2 Search and Sorting
- As a user, I can search across all stories by keyword with BM25-ranked relevance results.
- As a user, I can filter by category, subcategory, and time range.
- As a user, I can sort results by: **Latest**, **Impact** (importance score), **Summary Ready**.

### 4.3 Article Exploration and Detail
- As a user, I can see a lead story for a topic and a dense grid of cards for remaining stories.
- As a user, I can click a card to see a detail view with metadata, an AI summary (if available) with **source citations and AI Nutrition Label**, and a link to the original article.
- As a user, I can switch to a clean **reading mode** that strips non-essential UI and presents the article excerpt with optimal typography.

### 4.4 AI Summarisation — Source-Cited with Nutrition Label
- As a user, I can request an AI summary for an article without one.
- Every AI summary shows the **AI Nutrition Label**: model name, generation date, token count, “what the AI did” statement, and sources used.
- As a user, I can toggle between “AI Summary” and “Original Excerpt” views.
- As an admin, I can review sampled summaries, mark problematic ones, and trigger regeneration.
- As an admin, I can see token usage, model used, and generation timestamp for every summary.

### 4.5 Source Transparency & Blind-Spot Detection (Phase 2)
- As a user, I can see the source outlet, category, subcategory, and time-ago for each article.
- As a user, I can see which stories are covered predominantly by one side of the political spectrum (blind-spot detection) and explore alternative perspectives.

### 4.6 Notifications & Daily Briefing
- As a user, I can opt into **AI-summarised push notifications** that deliver a 1-sentence summary of important stories directly to my device.
- As a user, I can subscribe to a **daily briefing email** personalised to my favourite topics, delivered each morning.
- As a user, I can manage notification and email preferences in settings.

### 4.7 Social & Trending (Lightweight)
- As a user, I can see a “Trending among readers” section on the main feed, showing stories gaining traction in the last hour.
- As a user, I can share an article via a generated OpenGraph link preview on social platforms.

### 4.8 Admin & Operations
- As an admin, I can configure sources (URLs, polling intervals, default categories).
- As an admin, I can view a **BullMQ dashboard** showing ingestion and summarisation queue states.
- As an admin, I can view application metrics (ingestion lag, summary error rates, API latency).
- As an admin, I can review and resolve blind-spot flags.

---

## 5. Information Architecture and Navigation

### 5.1 Topic Model

| Category | Example Subcategories |
|---|---|
| Top Stories | All, Breaking, Editor’s Picks |
| Local News | Transport, Housing, Local Business, Governance |
| Tech News | AI & ML, Apple & Devices, Startups, Cybersecurity, Open Source |
| Global News | China, US, Asia-Pacific, Europe, Middle East |
| Finance News | Markets, Earnings, Personal Finance, Crypto, Commodities |
| Politics | SG Politics, US Politics, China Politics, Geopolitics |
| Culture & Society | K-Culture, Internet Culture, SG Gossip, Global Entertainment |

### 5.2 Navigation Model
- **Sticky topic navigation ribbon** near top of the app workspace.
- Each topic opens a panel with description + subtopic grid with per-subtopic story counts.
- **Controls panel** shows current view, selected category, result count, filters, and sort.
- **Dual-pane on large screens** (feed + sticky detail panel); stacked on smaller screens.
- **View Transitions** (`next-view-transitions`) for topic-switching animations: crossfade + subtle scale (200ms), respectful of `prefers-reduced-motion`.
- **Reading mode** accessible from article detail: toggles a clean, typography-focused view.

### 5.3 URL & Routing Schema

```
/                           → Default feed (Top Stories / All)
/topics/[category]          → Default subtopic for category
/topics/[category]/[sub]    → Feed filtered by both
/article/[id]               → Standalone article detail (deep link, shareable)
/admin                      → Admin workspace (protected)
/admin/sources              → Source management
/admin/jobs                 → Ingestion + summarisation job monitor
```

---

## 6. UX & UI Requirements

### 6.1 Design Philosophy — “Editorial Dispatch” v2

> **“Editorial Dispatch”** — The aesthetic of a wire service terminal meets a refined long-read publication. Not a news app. A *briefing room*. Every element has the weight of something worth reading. This update brings warmer ink, fresher type, and subtle materiality.

**Aesthetic Directives (reinforced):**
- **NOT:** rounded cards, purple gradients, Inter font at 16px, hero stock photos, predictable 3-column grids.
- **YES:** tight typographic hierarchy, ink-weight contrast, structured information density, purposeful whitespace as a grid element, category-coded accents that feel like editorial ink — not UI chrome.

### 6.2 Typographic System (v3.0)

| Role | Typeface | Rationale |
|---|---|---|
| **Headlines / Lead stories** | **Newsreader** (variable, optical size axis) | Purpose-built editorial serif; high contrast stroke weight; optical size ensures readability at display sizes |
| **UI / Body / Labels** | **Instrument Sans** (variable) | Warmer than Space Grotesk, excellent readability at small sizes, designed for UI, pairs harmoniously with Newsreader |
| **Monospace accents** | **Commit Mono** | Optimised for inline use in reading interfaces; less distracting than JetBrains Mono for timestamps, source tags, metadata |

**Explicit rejection:** Inter, Roboto, Space Grotesk as primary typefaces. (Space Grotesk has become overexposed in the indie dev ecosystem.)

### 6.3 Color System (Updated Design Tokens)

```
--ink-900        → #1a1a18 — letterpress black, slightly warm
--ink-600        → #3d3d3a — body text
--ink-300        → #8a8a83 — muted / metadata
--paper-50       → #fafaf8 — newsprint off-white
--paper-100      → #f2f2ee — card surface
--dispatch-ember → #c7513f — breaking / high-impact accent (coral-red, not amber)
--dispatch-sage  → #6b8f71 — finance / stable
--dispatch-slate → #5a6b7a — tech / neutral
--dispatch-clay  → #8b6d5a — politics / warm
--dispatch-violet → #7a6b8f — culture / expressive
```

**Why ember over amber:** Amber reads as “warning” (think traffic lights, error states). Ember (coral-red) conveys urgency and importance without feeling like an alert — more “breaking news” than “caution.”

### 6.4 Layout System

**Desktop (≥1280px):**
- 12-column grid, `max-width: 1440px`.
- Left: Topic nav ribbon (fixed, 240px) + feed (8 cols).
- Right: Sticky detail panel (4 cols) — article detail, summary, source info.
- Lead story: full-width editorial block with large serif headline and image.
- Sub-stories: 3-column dense grid of compact cards.
- Reading mode: overlays the detail panel with a clean, centred reading view.

**Tablet (768px–1279px):**
- Collapsible topic nav (full-width drawer on demand).
- Single-column feed; detail view as overlay or separate route.

**Mobile (<768px):**
- Stacked: sticky mini-header → topic carousel → controls strip → feed → detail.
- Bottom-sheet for article detail.
- Thumb-friendly bottom navigation.

### 6.5 AI Summary UX — AI Nutrition Label (EU AI Act Compliant)

Every AI summary must include:

1. **“AI Nutrition Label”** — compact panel showing:
   - Model name (e.g., “Claude 4 Haiku”)
   - Generation timestamp
   - Token count
   - **What the AI did** (e.g., “This is a 3-point summary of a 1,200-word article, generated from the article text as its only source.”)
   - Number of source citations
2. **EU AI Act compliance statement** — “This content was generated with AI and labelled in accordance with EU Regulation 2024/1689, Article 50.”
3. **Source citations inline** — links to specific articles used.
4. **“Read original source”** — always a primary action.
5. **Confidence/coverage indicator** — shows how much of the original content was available to the model.
6. **“Report inaccuracy”** — user flagging mechanism (required by Singapore IMDA guidelines).

### 6.6 Micro-Interactions (Purposeful, Not Decorative)

1. **Topic switch:** View Transition crossfade + subtle scale (200ms). Disabled when `prefers-reduced-motion: reduce`.
2. **Bookmark toggle:** `useOptimistic` instant feedback — star “inks in” with spring animation (200ms).
3. **Summary reveal:** Panel slides in from right (desktop) / up from bottom (mobile) — 300ms ease-out. Nutrition Label fades in after 500ms.
4. **Reading progress:** Scroll-Driven Animation — 2px ink bar at top of article detail, driven by `scroll-timeline` (CSS native, no JS).
5. **Skeleton loading:** Not generic grey boxes — animated text blocks with word-level shimmer that mimics actual layout.

### 6.7 Dark Mode

A bespoke dark theme — not auto-generated — using inverted paper/ink values:
- `--paper-900` for background
- `--ink-50` for text
- Accents retain identity but with reduced saturation
- Respects `prefers-color-scheme` media query

### 6.8 Accessibility

- **WCAG AA minimum**, target AAA for body text.
- All interactive elements keyboard-accessible.
- ARIA roles for topic nav (`navigation`), article cards (`article`), summary panels (`region` with `aria-label="AI-generated summary"`).
- Respect `prefers-reduced-motion`, `prefers-contrast`, `prefers-color-scheme`.
- Dyslexia-friendly: Instrument Sans has clear letterforms; avoid justified text in reading mode.

---

## 7. Functional Requirements

### 7.1 Ingestion Pipeline
(unchanged core, with source health monitoring)

- Ingest from configured sources via RSS, Atom, JSON APIs, or custom adapters.
- **BullMQ scheduler** launches ingestion jobs per-source schedule (5–30 minute intervals by priority tier).
- Steps: load config → fetch with timeout & backoff → parse & normalise (`ArticleCandidate` schema, Zod) → deduplicate by canonical URL + content hash → apply category/subcategory mapping → persist via Drizzle → update `SourceHealthSnapshot` → enqueue `compute-importance` job.
- Dead-letter queue with full error context for failures.

### 7.2 Article Lifecycle
(unchanged)

### 7.3 Ranking and Importance Score
(unchanged)

### 7.4 Summarisation — AI Nutrition Label Model

- Users request via article detail view.
- `POST /api/summarize/[id]` → validate auth → enqueue `summarize-article` job (BullMQ, `high` priority) → return `{ status: 'pending', jobId }`.
- **Summarisation job steps:**
  1. Fetch article + source record.
  2. Attempt full-text retrieval if `content_availability` insufficient (robots.txt compliant).
  3. Run structured prompt through **Claude 4 Haiku** (primary) or **GPT-5 Mini** (fallback) with:
     - Fidelity-over-brevity instruction
     - Source citation extraction instruction
     - Factual-only (no interpretation) constraint
     - EU AI Act compliance: output must include “what the AI did” phrasing
  4. Parse model response into `{ summary_text, key_points[], sources_cited[], model, tokens_used, generated_at, ai_statement }`.
  5. Store in `summaries` table; update `articles.has_summary = true`.
- UI refreshes via React 19.3 `Activity` — background render, no layout shift.
- Admin can set `summary_status` to `needs_review | disabled`.

### 7.5 Search and Filtering
(unchanged — PostgreSQL `tsvector` GIN + BM25)

### 7.6 Push Notifications & Daily Briefing (New)

**Push Notifications (V1):**
- Web Push API subscription flow (via service worker).
- Backend stores subscriptions in `push_subscriptions` table.
- Trigger: worker job monitors breaking news / high-importance stories.
- AI generates a 1-sentence summary of the story; included in notification payload.
- Click-through opens the article detail in-app.
- Notification preferences: per-category opt-in/out, quiet hours, max alerts/day.

**Daily Briefing Email (Phase 2):**
- Worker job runs at configurable time (user timezone).
- Aggregates top 5–10 stories across user’s favourite topics.
- Each story includes: headline, AI-summarised key point, link to in-app article.
- Sent via transactional email service (Resend / SendGrid).

### 7.7 Source Transparency & Blind-Spot Detection (Phase 2)

- For articles, store political leaning metadata where available (e.g., AllSides / Media Bias Fact Check integration, or self-assigned tags).
- “Blind spot” algorithm: compare coverage by left-leaning vs right-leaning sources in each topic. Surface stories that are heavily covered by one side but not the other.
- UI: “See what the other side is reporting” button.

### 7.8 Social & Trending (V1)

- **Trending among readers:** Lightweight counter of unique article views in the last hour; normalised by time decay. Displayed as a “Trending” feed section.
- **Social sharing:** Article detail pages include OpenGraph meta tags for rich link previews. “Copy link” and native share API (mobile).

### 7.9 User Features

**V1:**
- Session-persisted default topic, subtopic, sort preference.
- Push notification management.
- Bookmark/save articles (`useOptimistic` toggle).
- Reading mode toggle.

**Phase 2:**
- Blind-spot detection.
- Daily briefing email.
- Muted sources, saved searches.

**Phase 3:**
- Audio summaries (AI narration).
- `pgvector` semantic search.
- Enterprise SSO.

### 7.10 Admin Features
(unchanged from v2.0, plus push notification analytics)

---

## 8. System Architecture

### 8.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSERS                         │
│    (React 19.3 + View Transitions + Activity + Web Push SW)     │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────────┐
│                  NEXT.JS 16.1 WEB APP                           │
│  • App Router (PPR + `use cache` + proxy.ts)                   │
│  • Server Components (data-fetching, layouts)                  │
│  • Client Components (interactivity islands only)              │
│  • Server Actions (mutations, auth)                            │
│  • Route Handlers (public API, webhooks)                       │
│  • Auth.js v5 (HttpOnly session cookies)                       │
│  • `next-view-transitions` (declarative transitions)           │
│  • Web Push subscription endpoint                              │
└──────────┬──────────────────────────────┬───────────────────────┘
           │ Drizzle ORM                  │ BullMQ (enqueue)
           │                              │
┌──────────▼──────────┐      ┌────────────▼───────────────────────┐
│   POSTGRESQL 17     │      │        REDIS (Upstash / Managed)   │
│  • Articles         │      │  • BullMQ queues                   │
│  • Summaries        │      │  • Feed slice cache (hot feeds)    │
│  • Sources          │      │  • Push subscriptions (optional)   │
│  • Push subscriptions│     │                                    │
│  • GIN FTS indexes  │      └────────────┬───────────────────────┘
│  • BM25 extension   │                   │ BullMQ (consume)
└─────────────────────┘      ┌────────────▼───────────────────────┐
                             │        WORKER SERVICE               │
                             │   (Node.js 24+ / TypeScript)        │
                             │  • Ingestion jobs                   │
                             │  • Importance scoring jobs          │
                             │  • Summarisation jobs               │
                             │  • SourceHealth snapshot jobs       │
                             │  • Push notification dispatch       │
                             │  • Daily briefing email generation  │
                             └────────────────────────────────────┘
```

### 8.2 Internal Layering (Both Web App and Worker)

```
src/
├── app/                          ← Next.js App Router
│   ├── (public)/
│   │   ├── page.tsx              ← / — Default feed
│   │   ├── topics/[category]/
│   │   └── article/[id]/
│   ├── (admin)/
│   │   ├── layout.tsx            ← Auth guard via proxy.ts
│   │   └── ...
│   └── api/                      ← Public Route Handlers
│       ├── articles/route.ts
│       ├── summarize/[id]/route.ts
│       ├── categories/route.ts
│       └── push/                 ← Web Push subscription
│
├── features/                     ← Feature modules
│   ├── feed/
│   │   ├── components/           ← Feed, ArticleCard, LeadStory, ReadingMode
│   │   ├── actions.ts            ← Server Actions
│   │   └── queries.ts            ← DB queries
│   ├── summaries/
│   │   ├── components/           ← SummaryPanel, NutritionLabel, CitationList
│   │   ├── actions.ts
│   │   └── queries.ts
│   ├── notifications/
│   │   ├── components/           ← Push opt-in, preferences
│   │   └── actions.ts
│   ├── search/
│   └── admin/
│
├── domain/                       ← Pure business logic
│   ├── articles/
│   ├── ranking/
│   ├── summaries/
│   ├── notifications/
│   └── sources/
│
├── lib/                          ← Infrastructure integrations
│   ├── db/                       ← Drizzle client + schema
│   ├── queue/                    ← BullMQ client + job types
│   ├── ai/                       ← Claude 4 Haiku / GPT-5 Mini client
│   ├── push/                     ← Web Push helpers
│   └── auth/                     ← Auth.js v5 config
│
├── shared/
│   ├── components/               ← Design system (Shadcn wrapped)
│   ├── hooks/
│   └── types/
│
└── proxy.ts                      ← Network boundary

worker/
├── jobs/
│   ├── ingest.ts
│   ├── importance.ts
│   ├── summarize.ts
│   ├── push.ts                   ← Push notification dispatch
│   └── briefing.ts               ← Daily briefing email
├── queues/
│   └── index.ts
└── scheduler/
    └── index.ts
```

### 8.3 Next.js 16.1 Caching Strategy

| Route | Strategy | Rationale |
|---|---|---|
| `/` (Top Stories) | PPR + `<CacheComponent>` for feed shell, dynamic for counts | Shell prerendered; counts dynamic |
| `/topics/[category]` | PPR + `use cache` (revalidate: 120s) | Relatively stable; tolerate 2-min lag |
| `/article/[id]` | Dynamic (always fresh) | Summary status changes |
| `GET /api/articles` | Redis feed slices for hot categories | Feed freshness SLA |
| `GET /api/categories` | `use cache` (revalidate: 300s) | Rarely changes |

### 8.4 Data Flow

**Push notification dispatch:**
```
Worker job (triggered by high-importance article detection)
  → Fetch push subscriptions (filtered by category preference)
  → AI generates 1-sentence summary
  → Web Push API dispatch (via web-push library)
  → Log delivery/failure per subscription
```

**Daily briefing email (Phase 2):**
```
Scheduler (user timezone-based)
  → Worker queries top articles per user’s favourite topics
  → AI generates per-story key point
  → Render email template (React Email + Resend)
  → Send; track open/click rate
```

---

## 9. Data Model & Storage

### 9.1 Core Schema Additions

```typescript
// New tables for v3.0

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  endpoint: text('endpoint').notNull(),
  keys: jsonb('keys').$type<{ p256dh: string; auth: string }>().notNull(),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
  lastUsedAt: timestamp('last_used_at'),
  isActive: boolean('is_active').default(true),
});

export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull().unique(),
  favoriteCategories: jsonb('favorite_categories').$type<string[]>().default([]),
  mutedSources: jsonb('muted_sources').$type<string[]>().default([]),
  pushEnabled: boolean('push_enabled').default(false),
  pushCategories: jsonb('push_categories').$type<string[]>().default([]),
  pushQuietStart: time('push_quiet_start'),
  pushQuietEnd: time('push_quiet_end'),
  pushMaxPerDay: integer('push_max_per_day').default(10),
  briefingEnabled: boolean('briefing_enabled').default(false),
  briefingTime: time('briefing_time'),
  briefingTimezone: text('briefing_timezone'),
  readingModeDefault: boolean('reading_mode_default').default(false),
});
```

### 9.2 Updated `articles` Table Fields

```typescript
// Add to existing articles table
politicalLeaning: text('political_leaning'), // 'left', 'center-left', 'center', 'center-right', 'right', null
```

### 9.3 Updated `summaries` Table Fields

```typescript
// Add to existing summaries table
aiStatement: text('ai_statement').notNull(), // "This is a 3-point summary of a 1,200-word article..."
complianceStatement: text('compliance_statement').default('EU AI Act Article 50 compliant'),
coveragePercentage: integer('coverage_percentage'), // e.g., 85 for 85% of article text available
```

---

## 10. API Design

### 10.1 HTTP Endpoints (New / Updated)

```
GET  /api/categories                    → Categories + subcategories with article counts
GET  /api/articles                      → Feed with ?category, ?sub, ?sort, ?search, ?limit, ?cursor
GET  /api/articles/[id]                 → Single article with summary + nutrition label
POST /api/summarize/[id]               → Enqueue summarisation; returns { jobId, status }
GET  /api/summarize/[id]/status        → Poll summarisation job status
GET  /api/source-health                → Source health snapshots (admin-gated)
POST /api/push/subscribe               → Store push subscription
DELETE /api/push/unsubscribe            → Remove push subscription
GET  /api/preferences                   → Get user preferences
PUT  /api/preferences                   → Update user preferences
GET  /api/trending                      → Trending articles (last hour)
```

**Internal mutations (Server Actions):**
```
features/admin/actions.ts    → createSource, updateSource, toggleSource
features/admin/actions.ts    → flagSummary, regenerateSummary
features/feed/actions.ts     → savePreference, setFavoriteCategory, toggleBookmark
features/notifications/actions.ts → updatePushPreferences, unsubscribePush
```

### 10.2 Authentication & Authorization
(unchanged — Auth.js v5, HttpOnly cookies, proxy.ts)

### 10.3 Error Handling
(unchanged — JSON error format, all states handled)

---

## 11. Caching, Performance & Scalability

### 11.1 Caching Strategy (Updated)

**Next.js 16.1 `use cache` (stable):**
```tsx
import { unstable_cache as cache } from 'next/cache';
// ... usage as before, now stable
```

**View Transitions with `next-view-transitions`:**
```tsx
import { Link } from 'next-view-transitions';

<Link href="/topics/tech" transitionName="topic-feed">
  Tech News
</Link>
```

**Speculation Rules for prerendering (progressive enhancement):**
```html
<script type="speculationrules">
{
  "prerender": [
    { "source": "document", "where": { "selector": "a[data-prerender]" } }
  ]
}
</script>
```
Top 3 feed articles get `data-prerender` attribute.

### 11.2 Performance Targets

| Metric | Target | Mechanism |
|---|---|---|
| Feed API p95 | ≤500ms | Redis feed slices + optimised PG |
| Page FCP (feed) | ≤800ms | PPR prerendered shell |
| Page LCP (feed) | ≤1.5s | Streamed RSC + Suspense |
| Summarisation trigger | Return ≤200ms | Enqueue only; async job |
| Search p95 | ≤300ms | GIN-indexed tsvector |
| Push notification delivery | ≤30s from article publish | Worker job priority queue |

### 11.3 Scalability
(unchanged)

---

## 12. Observability & Operations

### 12.1 BullMQ Dashboard
(unchanged — plus push/briefing queues)

### 12.2 Metrics (New)

- **Push notifications:** opt-in rate, delivery rate, click-through rate, unsubscription rate
- **Briefing emails:** delivery rate, open rate, click rate
- **Blind spot:** stories flagged, user interactions with alternative perspectives

### 12.3 Alerting (Updated)

| Condition | Alert |
|---|---|
| Source ingestion failed 3× consecutive | PagerDuty / Slack |
| Summarisation error rate > 5% over 1h | Slack warning |
| Feed freshness < 10 articles in top category | PagerDuty |
| API p95 > 1s for 5 minutes | PagerDuty |
| BullMQ DLQ > 50 items | Slack |
| Push delivery failure rate > 10% | Slack warning |
| Daily briefing job failures > 3 consecutive | Slack warning |

---

## 13. AI Governance (Revised)

### 13.1 AI Nutrition Label (EU AI Act Compliant)

Every AI summary displays:

1. **Provenance:** “AI-generated summary using [Model Name]”
2. **What the AI did:** “This is a [N]-point summary of a [word count]-word article, generated from the article text as its only source.”
3. **Generation timestamp**
4. **Token count**
5. **Source citations:** list of articles/sources used
6. **EU AI Act compliance statement:** “This content was generated with AI and labelled in accordance with EU Regulation 2024/1689, Article 50.”
7. **Human verification status** (if reviewed by editor)
8. **“Report inaccuracy”** button → sets `summary_status = 'needs_review'`

### 13.2 Summary Quality Standards
(unchanged — fidelity over brevity, factual-only, no speculation)

### 13.3 Quality Control Process
(unchanged — automated + manual sampling + user reporting)

### 13.4 AI Model Configuration

| Setting | Value |
|---|---|
| Primary model | Claude 4 Haiku |
| Fallback model | GPT-5 Mini |
| Temperature | 0.1 (low creativity, high factual consistency) |
| Max output tokens | 500 (keeps summaries concise) |
| Source citation | Required in structured output |
| AI statement | Required in structured output |

### 13.5 Security
(unchanged — API keys in env secrets, input sanitisation, Zod output validation, rate limiting)

---

## 14. Rollout Plan

### Phase 1 — “Read & Trust” (V1 Launch)
**Deliverables:**
- Next.js 16.1 web app with App Router, PPR, `use cache`
- Worker service with BullMQ (ingest, summarise, compute-importance)
- PostgreSQL 17 schema with GIN FTS + BM25
- Core feed, topic navigation, article detail, source-cited AI summaries with Nutrition Label
- Web Push infrastructure + AI-summarised push notifications
- Reading mode (clean article view)
- Trending among readers section
- OpenGraph social sharing
- Auth.js v5 for admin protection
- `next-view-transitions` for topic switching
- Scroll-Driven reading progress indicator
- Speculation Rules prerendering (progressive enhancement)
- Bespoke dark mode (inverted tokens)

### Phase 2 — “Personalise & Deepen”
**Deliverables:**
- Redis feed slices for hot categories
- Daily briefing email (AI-personalised)
- Blind-spot detection with alternative perspective surfacing
- User preference centre (notifications, email, reading mode, muted sources)
- Enhanced admin summarisation audit
- Feed freshness alerting runbooks

### Phase 3 — “Intelligence & Enterprise”
**Deliverables:**
- `pgvector` semantic search
- Audio summaries (AI narration)
- ML-based topic classification
- Enterprise SSO (Auth.js v5 SAML/OIDC)
- Multi-tenant source collections
- Advanced personalisation

---

## 15. Risk Register (Updated)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| EU AI Act non-compliance | Low (mitigated) | Very High | AI Nutrition Label + compliance statement implemented from day one |
| Push notification opt-in rate low | Medium | Medium | AI-summarised alerts (Particle pattern) + granular preferences + quiet hours |
| Claude 4 Haiku availability/cost change | Low | Medium | GPT-5 Mini as fallback; model version pinned in config |
| Instrument Sans overexposure over time | Low (currently fresh) | Low | Token-based design system makes font swap straightforward |
| iOS Web Push reliability issues | Medium | Medium | Monitor delivery rates; fallback to email for critical alerts |
| Daily briefing email deliverability | Medium | Medium | Reputable ESP (Resend); domain warming; spam compliance |
| Blind-spot detection accuracy | Medium | Low-Medium | Start with self-assigned source leaning tags; iterate |

---

## Appendix A — Technology Stack Summary (v3.0)

| Layer | Technology | Version | Change from v2.0 |
|---|---|---|---|
| Web Framework | Next.js | 16.1 | Updated |
| UI Runtime | React | 19.3 | Updated |
| View Transitions | `next-view-transitions` | Latest | **New** |
| Language | TypeScript | 5.x (strict) | — |
| Styling | Tailwind CSS | v4 | — |
| Component Library | Shadcn UI + Radix | Latest | — |
| ORM | Drizzle ORM | Latest | — |
| Validation | Zod | 3.x | — |
| Auth | Auth.js | v5 | — |
| Database | PostgreSQL | 17 | — |
| FTS | `pg_textsearch` BM25 + tsvector GIN | 1.x | — |
| Queue | BullMQ | 5.x | — |
| Queue Backend | Redis (Upstash) | 7.x | — |
| Worker Runtime | Node.js | 24 LTS | — |
| AI Client (primary) | Anthropic SDK (Claude 4 Haiku) | Latest | **Updated** |
| AI Client (fallback) | OpenAI SDK (GPT-5 Mini) | Latest | **Added** |
| Push Notifications | Web Push API + `web-push` | Latest | **New** |
| Transactional Email | Resend + React Email | Latest | **New** |
| Containerization | Docker + Docker Compose | Latest | — |
| Dev Bundler | Turbopack | Default in 16.1 | **New default** |

---

## Appendix B — Design Decision Log (v2.0 → v3.0)

| Decision | v2.0 | v3.0 | Rationale & Evidence |
|---|---|---|---|
| UI Typeface | Space Grotesk | **Instrument Sans** | Warmer, designed for UI, pairs with Newsreader, avoids Space Grotesk saturation |
| Mono Typeface | JetBrains Mono | **Commit Mono** | Designed for inline reading metadata; less distracting |
| Breaking Accent | `--dispatch-amber` | **`--dispatch-ember`** | Amber reads as “warning”; ember conveys urgency without alarm |
| AI Model | Claude 3.5 Haiku / GPT-4o-mini | **Claude 4 Haiku** (primary), GPT-5 Mini (fallback) | 2026 model landscape; best cost/quality for news |
| AI Disclosure | Label + citations | **AI Nutrition Label** + EU AI Act statement | Reuters 2025, Nieman 2026, EU AI Act Article 50 |
| Push Notifications | Roadmap only | **Web Push (V1)** with AI summaries | iOS Safari 16.4+ support; Particle pattern (40% opt-in) |
| Daily Briefing | Not specified | **Phase 2** | Bulletin/1440 retention habit |
| Source Transparency | Source attribution only | **Blind-spot detection (Phase 2)** | Ground News differentiator |
| Scroll Effects | Not specified | **Scroll-Driven Animations** (CSS native) | Baseline Widely Available; no JS overhead |
| Prerendering | Not specified | **Speculation Rules** (progressive enhancement) | Chrome/Firefox; graceful Safari fallback |
| Dark Mode | Not specified | **Bespoke dark theme** (inverted tokens) | User expectation; `prefers-color-scheme` |
| Dev Bundler | Webpack (default) | **Turbopack** (default in 16.1) | Faster dev iteration |

---

*End of Refined PRD v3.0 — OneStopNews*  
*Document grounded in June 2026 research. All decisions traceable to evidence.*

# https://chat.deepseek.com/share/p3dbmxcsjozszbtswl 
