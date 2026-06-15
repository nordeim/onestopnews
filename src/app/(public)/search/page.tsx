/**
 * page.tsx — Search page with server-rendered initial results.
 *
 * PRD §6: Server-rendered search page with client-side updates.
 * MEP v5.1: Uses searchParams for query persistence.
 */

import { searchArticles } from "@/features/search/queries";
import { SearchPageClient } from "./SearchPageClient";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const initialResults = q ? await searchArticles({ query: q }) : { results: [], hasMore: false, nextCursor: null };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-8">
        <h1 className="font-editorial text-3xl font-[800] tracking-[-0.02em] text-ink-900">
          Search News
        </h1>
        <p className="mt-2 font-ui text-sm text-ink-600">
          Find articles across all topics
        </p>
      </header>

      <SearchPageClient initialResults={initialResults.results} initialQuery={q} />
    </main>
  );
}
