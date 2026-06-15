/**
 * SearchResults.tsx — Server side search results display.
 *
 * Shows loading state, empty state, or a list of ArticleCards.
 * Pure Server Component — no 'use client' needed.
 */

import type { SearchResult } from "../types";
import { ArticleCard } from "@/features/feed/components/ArticleCard";

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  isLoading?: boolean;
}

export function SearchResults({ results, query, isLoading = false }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="py-12 flex flex-col items-center gap-3">
        <div className="w-5 h-5 border-2 border-ink-300 border-t-dispatch-ember rounded-full animate-spin" />
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink-300">
          Searching
        </p>
      </div>
    );
  }

  if (results.length === 0 && query) {
    return (
      <div className="py-24 flex flex-col items-center gap-3">
        <span className="block w-1.5 h-1.5 rounded-full bg-dispatch-ember" aria-hidden="true" />
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink-300">
          No results for &quot;{query}&quot;
        </p>
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
        {results.length} result{results.length !== 1 ? "s" : ""}
      </p>
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8"
        role="feed"
        aria-label={`Search results for "${query}"`}
      >
        {results.map(({ article }) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
