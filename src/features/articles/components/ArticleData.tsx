/**
 * ArticleData.tsx — Server Component for article detail page.
 *
 * Fetches the article data and renders the detail page layout.
 * Wrapped in <Suspense> by the parent to prevent blocking-route
 * errors in Next.js 16 with cacheComponents enabled.
 */

import { Footer } from "@/shared/components/layout/Footer";
import { Button } from "@/shared/components/ui/Button";
import Link from "next/link";

interface ArticleDataProps {
  params: Promise<{ id: string }>;
}

export async function ArticleData({ params }: ArticleDataProps) {
  const { id } = await params;

  // TODO: Fetch real article from database
  // For now, render placeholder
  const article = {
    id,
    title: "Article Title Placeholder",
    excerpt: "This is a placeholder excerpt for the article detail page.",
    publishedAt: new Date(),
    source: { name: "Example Source" },
    hasSummary: false,
    summaryStatus: "none",
  };

  return (
    <>
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="max-w-3xl mx-auto">
          <header className="mb-8">
            <h1 className="font-editorial text-3xl sm:text-4xl text-ink-900 mb-4">
              {article.title}
            </h1>
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-ink-600">
              <span>{article.source.name}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={article.publishedAt.toISOString()}>
                {article.publishedAt.toLocaleDateString()}
              </time>
            </div>
          </header>
          <p className="font-ui text-ink-600 text-lg leading-relaxed mb-8">
            {article.excerpt}
          </p>
          {!article.hasSummary && (
            <div className="bg-paper-100 border-l-2 border-dispatch-ember p-6 my-8">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-ink-300 mb-2">
                AI Summary
              </h3>
              <p className="text-ink-600 mb-4">
                No AI summary is available for this article yet.
              </p>
              <Button variant="primary" size="sm">
                Request AI Summary
              </Button>
            </div>
          )}
          <div className="mt-12">
            <Link
              href="/"
              className="font-mono text-[11px] uppercase tracking-widest text-ink-600 hover:text-dispatch-ember transition-colors"
            >
              ← Back to Top Stories
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
