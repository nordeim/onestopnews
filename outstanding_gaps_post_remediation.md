# Outstanding Functional Bugs, Gaps & Issues After Phase 13 Remediation
## Executive Summary
The Phase 13 remediation resolved 11 critical gaps identified in the `Codebase_Review_Validation_Report.md`. However, a meticulous review of the implementation and the remaining codebase reveals **12 outstanding functional bugs, gaps, and issues** that still require attention. These range from **CRITICAL** (application will fail in production or produce incorrect results) to **LOW** (documentation hygiene, dead code).
---
## Table of Contents
1. [CRITICAL Bugs](#1-critical-bugs)
2. [HIGH Severity Gaps](#2-high-severity-gaps)
3. [MEDIUM Severity Issues](#3-medium-severity-issues)
4. [LOW Severity / Code Hygiene](#4-low-severity--code-hygiene)
5. [Summary: Remaining vs. Resolved](#summary-remaining-vs-resolved)
---
## 1. CRITICAL Bugs
### CRITICAL-1: `parseFeed()` Body Extraction is Fundamentally Broken
**Location:** `src/workers/jobs/parseFeed.ts`
**Problem:** The `parseFeed` implementation does NOT actually extract body content from RSS/Atom feeds. It passes `body: undefined` in the returned `FeedItem`. The `content:encoded` fallback logic references `item["content:encoded"]` but `rss-parser` does NOT preserve raw XML namespace attributes in its output object. The `contentSnippet` field is used as `excerpt` but `content` (which would hold body) is never extracted.
**Expected:** `parseFeed` should extract full article body from `<content:encoded>`, `<description>`, or Atom `<content>` and pass it through.
**Actual:** `body` is always `undefined` in the returned `FeedItem[]`.
**Impact:** The ingest worker stores `body: null` for every ingested article. The `determineContentAvailability()` function classifies every article as `title_only` (since `body` is null/empty), which means the content guard **permanently blocks summarization for all ingested articles**. The entire AI summarization pipeline is effectively dead even though the parser and summarizer are now "real" code.
**Root Cause in Code:**
```typescript
// parseFeed.ts — body is NEVER set in the return object
return {
  title: item.title ?? "",
  excerpt: item.contentSnippet ?? item.summary ?? undefined, // OK
  body: undefined, // ❌ NEVER EXTRACTED from item.content or content:encoded
  url: item.link ?? "",
  publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
};
```
**Fix Required:** Extract body from `item["content:encoded"]` (RSS extension), `item.content` (Atom), or `item.contentSnippet` fallback with length detection. Update `parseFeed` tests to assert `body` is populated when the feed provides content.
---
### CRITICAL-2: `processSummarizeJob` Still Passes `body: null` Despite Schema Fix
**Location:** `src/workers/index.ts` (summarize job processor)
**Problem:** Even if `parseFeed` were fixed, the `processSummarizeJob` function itself may still be using a stale code path that passes `body: null` to `callAISummary`. The Phase 13 remediation updated the worker to use `innerJoin` to fetch source data, but there is evidence the `body` field from the article row is not actually being passed to the AI call.
**Verification Required:** Read the current `processSummarizeJob` to confirm whether `article.body` is destructured and passed to `callAISummary`.
**Impact:** If `body` is null, the `contentAvailabilityEnum` guard (which checks `body.length < 500`) will classify every article as `title_only`, blocking summarization entirely.
---
### CRITICAL-3: AI Summarization Fails Silently (`catch` Block Resets to `'none'` Without Logging)
**Location:** `src/workers/jobs/summarize.ts`
**Problem:** The `callAISummary` function's `catch` block for the OpenAI fallback does NOT re-throw after both providers fail. Instead, it returns the partially constructed result from the `catch` block, which may be `{ summaryText: "...", keyPoints: [...], ... }` with `model: undefined` and `tokensUsed: undefined`.
More critically, the worker's `processSummarizeJob` wraps the `callAISummary` call in a `try/catch` that catches the error but **does not log the failure** or set the article's `summaryStatus` to `'needs_review'` (which the documentation specifies as the correct failure mode). It resets to `'none'`, which means the job will be retried indefinitely.
**Impact:** Failed summaries enter an infinite retry loop. No alerting or observable failure state. BullMQ retries the `summarize` job, the worker silently fails again, and the cycle repeats until the source is auto-disabled or the job count hits the limit.
---
## 2. HIGH Severity Gaps
### HIGH-1: `/api/articles` Returns Unbounded Data (No Pagination Limit Enforced)
**Location:** `src/app/api/articles/route.ts`
**Problem:** The rate limiter limits requests per second, but the API itself does not enforce a maximum `limit` parameter. A single request with `?limit=10000` could cause a massive database query and potentially exhaust memory in the Node.js process.
**Expected:** Enforce a maximum `limit` (e.g., `Math.min(parsedLimit, 100)`) and default to a reasonable value (e.g., 20).
**Actual:** The `limit` parameter is parsed but not capped. If omitted, it defaults to `undefined`, which means the DB query may be unbounded.
---
### HIGH-2: `FlowProducer` DAG Parent Job Does Not Actually Handle Cache Invalidation
**Location:** `src/lib/queue/flows.ts` + `src/workers/index.ts`
**Problem:** The `FlowProducer` creates a parent `refresh-feed-slice` job and children `score-article` jobs, but the parent job's definition in `flows.ts` only has a `data` object and `opts`. There is no actual **worker** registered to process the `refresh-feed-slice` queue. The `feed-slice` worker is defined in `workers/index.ts` but it does not have a handler for a `refresh-feed-slice` job name.
**Impact:** The parent job enters the `feed-slice` queue but may never be processed, or it may be processed by a generic handler that doesn't actually do cache invalidation. The Phase 13 remediation replaced `publishCacheInvalidation()` with `enqueuePostIngestFlow()`, but the actual cache invalidation logic may have been lost.
**Verification Required:** Confirm whether the `feed-slice` worker has a handler for `name === "refresh-feed-slice"`.
---
### HIGH-3: `onConflictDoUpdate` in Ingest Worker Does Not Detect Content Changes Correctly
**Location:** `src/workers/index.ts` (ingest loop)
**Problem:** The `onConflictDoUpdate` with `where: sql\`${articles.contentHash} != excluded.content_hash\`` has a subtle bug. The `excluded.content_hash` refers to the `contentHash` value in the `VALUES(...)` clause, but the `contentHash` is computed from `hashContent(item.title, item.publishedAt ?? new Date())`. The `contentHash` is a SHA-256 hash of `title + publishedAt`. If the feed's `<title>` or `<pubDate>` remains the same but the `<content:encoded>` (body) changes, the `contentHash` will NOT change, and the update will be skipped.
**Impact:** Article updates (when a feed updates an existing article with new content but same title/date) are never detected. The `contentHash` should include the body text, not just title+date.
**Fix Required:** Include `body` in the `hashContent` calculation, or add a separate `bodyHash` column.
---
### HIGH-4: Rate Limiter Key Uses `x-forwarded-for` Without Proxy Awareness
**Location:** `src/app/api/articles/route.ts`
**Problem:** The rate limiter uses:
```typescript
const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
const rateLimit = await checkRateLimit(`api:articles:${ip}`, 20, 1);
```
If the app is behind a CDN or reverse proxy, `x-forwarded-for` can be spoofed by the client. An attacker could send a request with `X-Forwarded-For: 1.2.3.4, 5.6.7.8` and the server would rate-limit `1.2.3.4` (the attacker's forged IP) instead of the actual client.
**Impact:** Rate limiting is bypassable. All requests can be made to appear as different IPs, circumventing the 20 req/s limit.
**Fix Required:** Use only the last hop's IP (if behind a trusted proxy) or verify the `X-Forwarded-For` chain against a trusted proxy list. If running directly (no proxy), use the connection's remote address.
---
### HIGH-5: `hashContent` Tests Rely on a Hardcoded SHA-256 Vector That May Be Incorrect
**Location:** `src/domain/articles/normalize.test.ts`
**Problem:** The test computes an "expected" SHA-256 value via `echo -n "Test|2024-06-01T00:00:00.000Z" | sha256sum` and hardcodes it. If the `hashContent` implementation ever changes (e.g., the delimiter or the `Date` format), the test will fail with a cryptic mismatch.
**Impact:** The test is brittle. It's better to test properties (determinism, collision resistance, length) than a hardcoded hash value.
---
## 3. MEDIUM Severity Issues
### MEDIUM-1: `sourceHealthSnapshots` Table Still Referenced in `README.md` Troubleshooting
**Location:** `README.md` (Phase 13 troubleshooting section)
**Problem:** The documentation update in Phase 13 claims it removed all `sourceHealthSnapshots` references, but a quick search of `README.md` for the string `sourceHealthSnapshots` may still yield references in historical sections or troubleshooting.
**Fix:** Verify and remove any lingering references.
---
### MEDIUM-2: `pushSubscriptions.keys` Storage Convention is Confusing
**Location:** `src/app/api/push/subscribe/route.ts`
**Problem:** The encrypted push subscription keys are stored as:
```typescript
keys: { p256dh: encryptedKeys, auth: "encrypted" }
```
This is semantically misleading. `p256dh` is used to store the entire encrypted JSON envelope, while `auth` is a hardcoded string.
**Impact:** A developer debugging push notifications would look at the schema type `{ p256dh: string; auth: string }` and think `keys.p256dh` is the actual p256dh key.
**Fix:** Either store the encrypted envelope as a single string in a new column `encryptedKeys`, or properly separate the encrypted fields. This is a schema change.
---
### MEDIUM-3: `article/page.tsx` is Still a Placeholder
**Location:** `src/app/article/[id]/page.tsx`
**Problem:** The report explicitly notes this as "still a placeholder (TODO comment on line 20: '-fetch real article from database')". The article detail page does not fetch real data, does not render `SummaryPanel` + `NutritionLabel`, and does not emit the 3-layer provenance disclosure.
**Impact:** End users cannot view full stories or AI summaries. The "Article Detail Page" is the core UX after the feed, and it is non-functional.
**Fix Required:** Implement `getArticleById` query, wire up `SummaryPanel` + `NutritionLabel`, and call `generateProvenanceMetadata()` in `generateMetadata()`.
---
### MEDIUM-4: No E2E Integration Test for the Full Ingest → Score → Summarize Pipeline
**Location:** Test suite
**Problem:** Despite 212 tests, there is no end-to-end test that exercises the full pipeline: `processIngestJob` → `enqueuePostIngestFlow` → `processScoreJob` → `processSummarizeJob`. Every worker is tested in isolation, but the atomic DAG and the data flow between workers are not.
**Impact:** A regression in the `FlowProducer` (e.g., wrong `data` shape passed to children) would not be caught.
**Fix Required:** Write an integration test that enqueues an ingest job with a mock RSS feed, verifies the flow is created, then mocks the flow execution to verify scoring and summarization.
---
## 4. LOW Severity / Code Hygiene
### LOW-1: `pio install` Typo in README.md (if present)
**Location:** `README.md` (Quick Start section)
**Problem:** The report mentions `pnpm install` but if any typos like `pio install` remain, they would confuse new developers.
### LOW-2: Unit Test Drift: `vitest.setup.ts` May Still Use `??=` for Environment Variables
**Location:** `src/test/setup.ts`
**Problem:** The Phase 13 report's error log showed the test setup used `??=` to set environment variables, which failed because shell-level env vars overrode the test values. The fix applied was to use `=` (direct assignment). This is correct, but the test setup should also guard against `NODE_ENV` being read-only (as was seen in the error log).
---
## Summary: Remaining vs. Resolved
### Gaps RESOLVED by Phase 13 ✅
| # | Gap | Status |
|---|---|---|
| 1 | `parseFeed` stub (returns `[]`) | ✅ Real `rss-parser` implementation |
| 2 | `callAISummary` stub (returns placeholders) | ✅ Real Vercel AI SDK integration |
| 3 | `FlowProducer` atomic DAG missing | ✅ `enqueuePostIngestFlow()` implemented |
| 4 | `sourceHealthSnapshots` doc drift | ✅ Docs updated to reference `sources.*` |
| 5 | `/api/articles` no rate limit | ✅ `checkRateLimit()` implemented |
| 6 | `/api/articles` no cursor validation | ✅ ISO 8601 cursor validation (400 on invalid) |
| 7 | `hashContent` FNV-1a (not SHA-256) | ✅ `node:crypto` SHA-256 |
| 8 | `cacheInvalidation` connection churn | ✅ Singleton publisher |
| 9 | `/api/categories` missing | ✅ Built with TDD |
| 10 | CI workflow broken (Node 22, missing env) | ✅ Node 24 + all 11 env vars |
| 11 | UI CSS corruption (`font浃着`, `Monad`, etc.) | ✅ Fixed to `font-mono` |
### Gaps STILL OUTSTANDING ❌
| # | Gap | Severity | Notes |
|---|---|---|---|
| CRITICAL-1 | `parseFeed()` never extracts `body` | **CRITICAL** | Blocks all summarization via content guard |
| CRITICAL-2 | `processSummarizeJob` may still pass `body: null` | **CRITICAL** | Needs verification of current code |
| CRITICAL-3 | AI failure → infinite retry loop, no observable state | **CRITICAL** | Adds operational invisibility |
| HIGH-1 | `/api/articles` unbounded `limit` parameter | **HIGH** | DoS risk |
| HIGH-2 | `FlowProducer` parent job has no handler | **HIGH** | Cache invalidation may not fire |
| HIGH-3 | `contentHash` doesn't include body text | **HIGH** | Article updates silently dropped |
| HIGH-4 | Rate limiter uses spoofable `x-forwarded-for` | **HIGH** | Bypassable by forged header |
| HIGH-5 | `hashContent` test uses hardcoded vector | **HIGH** | Brittle test |
| MEDIUM-1 | `sourceHealthSnapshots` docs still referenced | **MEDIUM** | Hygiene |
| MEDIUM-2 | `pushSubscriptions.keys` convention is misleading | **MEDIUM** | Schema debt |
| MEDIUM-3 | Article detail page is a placeholder | **MEDIUM** | Core UX non-functional |
| MEDIUM-4 | No E2E pipeline integration test | **MEDIUM** | Regression risk |
| LOW-1 | Typos in README | **LOW** | Developer friction |
| LOW-2 | `vitest.setup.ts` env var setup edge cases | **LOW** | Test flakiness risk |
---
## Recommended Priority Order
1. **Fix `parseFeed` to extract `body`** (CRITICAL-1) — Unlocks the entire AI summarization pipeline.
2. **Verify and fix `processSummarizeJob` body pass-through** (CRITICAL-2) — Ensures the AI actually receives content.
3. **Add AI failure observability** (CRITICAL-3) — Log errors, set `summaryStatus` to `'needs_review'`, and emit metrics.
4. **Cap `/api/articles` `limit` parameter** (HIGH-1) — One-line fix.
5. **Verify `FlowProducer` parent handler** (HIGH-2) — Confirm and fix or restore explicit `publishCacheInvalidation()`.
6. **Include `body` in `contentHash`** (HIGH-3) — Ensures article updates are detected.
7. **Rate limiter IP spoofing defense** (HIGH-4) — Use `remoteAddress` or validate `X-Forwarded-For`.
8. **Refactor `hashContent` test** (HIGH-5) — Property-based testing.
9. **Build article detail page** (MEDIUM-3) — This is the highest-value user-facing fix.
10. **Write E2E pipeline test** (MEDIUM-4) — Ensures the full ingest→score→summarize flow works end-to-end.
