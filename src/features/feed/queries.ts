/**
 * queries.ts — Feed data access layer.
 *
 * PRD §5.4: "Feed queries must explicitly join with the sources table
to populate article.source.name."
 * MEP v5.1: LIMIT 31 pattern for cursor pagination.
 */

import { desc, eq, lt, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { articles, sources, categories } from "@/lib/db/schema";
import type { ArticleWithSource } from "@/domain/articles/types";

const FEED_PAGE_SIZE = 30;

export interface FeedQueryOptions {
  category?: string;
  cursor?: Date;
  limit?: number;
}

export interface FeedPage {
  articles: ArticleWithSource[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * getFeedArticles — Primary feed query with cursor pagination.
 *
 * REQUIRED JOIN CONTRACT:
 * This query MUST innerJoin with sources to populate article.source.name.
 */
export async function getFeedArticles(options: FeedQueryOptions = {}): Promise<FeedPage> {
  const { category, cursor, limit = FEED_PAGE_SIZE } = options;

  let categoryId: string | undefined;
  if (category) {
    const categoryRow = await db.query.categories.findFirst({
      where: eq(categories.slug, category),
    });
    if (!categoryRow) {
      return { articles: [], nextCursor: null, hasMore: false };
    }
    categoryId = categoryRow.id;
  }

  const whereClause = and(
    categoryId ? eq(articles.categoryId, categoryId) : undefined,
    cursor ? lt(articles.publishedAt, cursor) : undefined
  );

  // Fetch limit + 1 to determine if there's a next page
  const rows = await db
    .select({
      id: articles.id,
      title: articles.title,
      excerpt: articles.excerpt,
      canonicalUrl: articles.canonicalUrl,
      publishedAt: articles.publishedAt,
      hasSummary: articles.hasSummary,
      summaryStatus: articles.summaryStatus,
      source: {
        id: sources.id,
        name: sources.name,
        url: sources.url,
      },
    })
    .from(articles)
    .innerJoin(sources, eq(articles.sourceId, sources.id))
    .where(whereClause)
    .orderBy(desc(articles.publishedAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const resultRows = rows.slice(0, limit) as ArticleWithSource[];

  const nextCursor = hasMore
    ? resultRows[resultRows.length - 1]?.publishedAt.toISOString() ?? null
    : null;

  return {
    articles: resultRows,
    nextCursor,
    hasMore,
  };
}
