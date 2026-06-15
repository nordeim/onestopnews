/**
 * types.ts — Search domain types.
 *
 * PRD §6: Full-text search with pg_textsearch BM25 ranking.
 * PAD §3 (ADR-005): PostgreSQL FTS + pg_textsearch BM25.
 */

import type { ArticleWithSource } from "@/domain/articles/types";

/**
 * SearchParams — Parameters for searchArticles().
 */
export interface SearchParams {
  query: string;
  categorySlug?: string;
  cursor?: Date;
  limit?: number;
}

/**
 * SearchResult — A single search result with BM25 relevance rank.
 */
export interface SearchResult {
  article: ArticleWithSource;
  rank: number; // ts_rank_cd score
}

/**
 * SearchPage — Paginated search results.
 */
export interface SearchPage {
  results: SearchResult[];
  nextCursor: string | null;
  hasMore: boolean;
}
