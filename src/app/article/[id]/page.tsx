/**
 * page.tsx — Article detail page.
 *
 * NOTE: Data fetching is delegated to ArticleData.tsx (Server Component)
 * and wrapped in <Suspense> to prevent blocking-route errors in Next.js 16
 * with cacheComponents enabled. The page itself is synchronous.
 */

import { Suspense } from "react";
import { Header } from "@/shared/components/layout/Header";
import { ArticleData } from "@/features/articles/components/ArticleData";
import { ArticleSkeleton } from "@/features/articles/components/ArticleSkeleton";

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

export default function ArticlePage({ params }: ArticlePageProps) {
  return (
    <div className="min-h-screen bg-paper-50">
      <Suspense fallback={null}>
        <Header />
      </Suspense>
      <Suspense fallback={<ArticleSkeleton />}>
        <ArticleData params={params} />
      </Suspense>
    </div>
  );
}
