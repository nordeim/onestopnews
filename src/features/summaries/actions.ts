"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { articles, summaries } from "@/lib/db/schema";
import { summarizeQueue } from "@/lib/queue";
import { verifySession, verifyAdminSession } from "@/lib/auth/dal";
import { checkRateLimit } from "@/lib/rateLimit";
import { revalidatePath } from "next/cache";

/**
 * Server Actions for AI summarisation.
 *
 * All functions are marked with 'use server' and run on the server only.
 * The content availability guard (anti-hallucination) is enforced here.
 *
 * Phase 19 (Critical C3): requestSummary now mirrors the HTTP route's auth
 * (verifySession) and per-user rate limiting (5 req/min/user) — closing the
 * gap where any client could trigger BullMQ jobs without authentication.
 *
 * Phase 19 (Critical C5): approveSummary added for the admin review queue's
 * Approve button, which was previously inert.
 */

export interface SummariseResponse {
  success: boolean;
  jobId: string | null;
  error: string | null;
}

// Per-user rate limit: 5 summarize requests per minute.
// Matches the HTTP route at /api/summarize/[id]/route.ts.
const SUMMARIZE_RATE_LIMIT_MAX = 5;
const SUMMARIZE_RATE_LIMIT_WINDOW_SEC = 60;

/**
 * Requests an AI summary for an article.
 *
 * Validates UUID, checks content availability guard, enqueues to BullMQ.
 * Returns { success: true, jobId } or { success: false, error }.
 *
 * The content availability guard per PRD §8.1:
 *   - title_only → REJECTED (insufficient content)
 *   - excerpt → REJECTED (insufficient content)
 *   - partial_text → ALLOWED
 *   - full_text → ALLOWED
 */
export async function requestSummary(
  articleId: string,
): Promise<SummariseResponse> {
  // ── Auth: every Server Action must verify the session ──────────────────
  // Phase 19 (Critical C3): this was missing. The HTTP route had it; the
  // Server Action did not. Any client could import this action and trigger
  // BullMQ jobs without authentication.
  const session = await verifySession();
  if (!session) {
    return { success: false, jobId: null, error: "Authentication required" };
  }

  // ── Rate limit: per user, 5 req/min ─────────────────────────────────────
  // Phase 19 (Critical C3): mirrors the HTTP route's protection. Without
  // this, an authenticated user could iterate article UUIDs and fan out
  // unlimited BullMQ jobs → unbounded AI spend.
  const rateLimitResult = await checkRateLimit(
    `api:summarize:${session.user.id}`,
    SUMMARIZE_RATE_LIMIT_MAX,
    SUMMARIZE_RATE_LIMIT_WINDOW_SEC,
  );
  if (!rateLimitResult.allowed) {
    return {
      success: false,
      jobId: null,
      error: "Rate limit exceeded. Please retry later.",
    };
  }

  // Validate UUID
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(articleId)) {
    return { success: false, jobId: null, error: "Invalid article ID format" };
  }

  // Fetch article
  const article = await db.query.articles.findFirst({
    where: eq(articles.id, articleId),
  });

  if (!article) {
    return { success: false, jobId: null, error: "Article not found" };
  }

  // Content availability guard (anti-hallucination)
  if (
    article.contentAvailability === "title_only" ||
    article.contentAvailability === "excerpt"
  ) {
    return {
      success: false,
      jobId: null,
      error: `Cannot summarise articles with only ${article.contentAvailability}. Insufficient content prevents accurate summarisation.`,
    };
  }

  // Check if summary already exists
  if (article.summaryStatus !== "none") {
    return {
      success: false,
      jobId: null,
      error: `Summary already exists with status: ${article.summaryStatus}`,
    };
  }

  // Update article status to pending
  await db
    .update(articles)
    .set({ summaryStatus: "pending" })
    .where(eq(articles.id, articleId));

  // Enqueue summarisation job
  const job = await summarizeQueue.add("summarize", {
    articleId,
    content: article.excerpt ?? article.title,
  });

  if (!job) {
    return {
      success: false,
      jobId: null,
      error: "Failed to enqueue summarisation job",
    };
  }

  return { success: true, jobId: job!.id!, error: null };
}

/**
 * Flags a summary for editorial review (admin only).
 */
export async function flagSummary(
  summaryId: string,
  flagReason: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    await verifyAdminSession();

    await db
      .update(summaries)
      .set({
        status: "needs_review",
        flagReason,
      })
      .where(eq(summaries.id, summaryId));

    revalidatePath("/admin/summaries");
    return { success: true, error: null };
  } catch {
    return { success: false, error: "Admin access required" };
  }
}

/**
 * Disables a summary (admin only).
 * Permanently disables a summary from appearing in the UI.
 */
export async function disableSummary(
  summaryId: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    await verifyAdminSession();

    await db
      .update(summaries)
      .set({ status: "disabled" })
      .where(eq(summaries.id, summaryId));

    revalidatePath("/admin/summaries");
    return { success: true, error: null };
  } catch {
    return { success: false, error: "Admin access required" };
  }
}

/**
 * Approves a flagged summary, restoring it to 'ok' status (admin only).
 *
 * Phase 19 (Critical C5): Previously the admin review queue's Approve button
 * was inert — it rendered as <button type="button"> with no onClick, no form
 * action, and no server action binding. This action wires the button to a
 * real admin-guarded mutation.
 */
export async function approveSummary(
  summaryId: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    await verifyAdminSession();

    await db
      .update(summaries)
      .set({ status: "ok", flagReason: null })
      .where(eq(summaries.id, summaryId));

    revalidatePath("/admin/summaries");
    return { success: true, error: null };
  } catch {
    return { success: false, error: "Admin access required" };
  }
}
