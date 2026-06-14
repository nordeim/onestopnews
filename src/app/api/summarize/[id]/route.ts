import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { summarizeQueue } from "@/lib/queue";
import { verifySession } from "@/lib/auth/dal";

/**
 * POST /api/summarize/:id — Request AI summarisation for an article.
 *
 * PRD §7: Enqueue summarisation job with content availability guard.
 * PAD §7.1: Route Handler for public HTTP endpoint.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id: articleId } = await params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(articleId)) {
      return NextResponse.json({ error: "Invalid article ID format" }, { status: 400 });
    }

    const article = await db.query.articles.findFirst({
      where: eq(articles.id, articleId),
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (article.contentAvailability === "title_only" || article.contentAvailability === "excerpt") {
      return NextResponse.json(
        { error: `Cannot summarise articles with only ${article.contentAvailability}. Insufficient content.` },
        { status: 400 }
      );
    }

    if (article.summaryStatus !== "none") {
      return NextResponse.json(
        { error: `Summary already exists with status: ${article.summaryStatus}` },
        { status: 409 }
      );
    }

    await db.update(articles).set({ summaryStatus: "pending" }).where(eq(articles.id, articleId));

    const job = await summarizeQueue.add("summarize", {
      articleId,
      content: article.excerpt ?? article.title,
    });

    if (!job) {
      return NextResponse.json({ error: "Failed to enqueue summarisation job" }, { status: 502 });
    }

    return NextResponse.json({ jobId: job.id }, { status: 202 });
  } catch (error) {
    console.error("[summarize] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
