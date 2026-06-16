"use client";

/**
 * SearchPageClient.tsx — Client-side search interactivity.
 *
 * Wraps SearchBar and SearchResults with URL sync.
 * NOTE: Imports search action from actions.ts (Server Action), NOT queries.ts (DB layer).
 */

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchBar } from "@/features/search/components/SearchBar";
import { SearchResults } from "@/features/search/components/SearchResults";
import { searchArticlesAction } from "@/features/search/actions";
import type { SearchResult } from "@/features/search/types";

interface SearchPageClientProps {
  initialResults: SearchResult[];
  initialQuery: string;
}

export function SearchPageClient({ initialResults, initialQuery }: SearchPageClientProps) {
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const [results, setResults] = useState<SearchResult[]>(initialResults);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuery, setCurrentQuery] = useState(initialQuery);

  const handleSearch = useCallback(async (query: string) => {
    setCurrentQuery(query);

    // Update URL without full page reload
    const params = new URLSearchParams(urlSearchParams);
    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }
    router.push(`/search?${params.toString()}`, { scroll: false });

    setIsLoading(true);
    try {
      const { results: newResults } = await searchArticlesAction({ query });
      setResults(newResults);
    } finally {
      setIsLoading(false);
    }
  }, [router, urlSearchParams]);

  return (
    <div className="space-y-8">
      <SearchBar defaultValue={initialQuery} onSearch={handleSearch} isLoading={isLoading} />
      <SearchResults results={results} query={currentQuery} isLoading={isLoading} />
    </div>
  );
}
