/**
 * page.tsx — Article detail page.
 *
 * Phase 14 (MEDIUM-3): Fetches real article data, renders ArticleData
 * (which includes SummaryPanel + NutritionLabel), and emits 3-layer
 * provenance via generateMetadata() when an AI summary exists.
 *
 * The page is fully dynamic (no "use cache") because summary status
 * is real-time. Wrapped in <Suspense> to prevent blocking-route errors.
 */

import { Suspense } from "react";
import type { Metadata } from "next";
import { Header } from "@/shared/components/layout/Header";
import { ArticleData } from "@/features/articles/components/ArticleData";
import { ArticleSkeleton } from "@/features/articles/components/ArticleSkeleton";
import { getArticleWithSummary } from "@/features/articles/queries";
import { generateProvenanceMetadata } from "@/lib/ai/provenance";

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

/**
 * generateMetadata — Emits SEO metadata + 3-layer AI provenance.
 *
 * When the article has an 'ok' summary, this function:
 *   1. Calls generateProvenanceMetadata() to produce all 3 layers
 *   2. Sets the JSON-LD as a <script type="application/ld+json"> tag via `other`
 *   3. Sets the X-AI-Provenance HTTP header via `other`
 *   4. Sets the <meta name="ai-provenance"> tag via `other`
 *
 * This is the EU AI Act Article 50 compliant disclosure mechanism.
 */
export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticleWithSummary(id);

  if (!article) {
    return {
      title: "Article Not Found",
      description: "The requested article could not be found.",
    };
  }

  const metadata: Metadata = {
    title: article.title,
    description: article.excerpt ?? undefined,
    openGraph: {
      title: article.title,
      description: article.excerpt ?? undefined,
      type: "article",
      publishedTime: article.publishedAt.toISOString(),
      authors: [article.source.name],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt ?? undefined,
    },
  };

  // Emit 3-layer provenance when an approved summary exists.
  // Layer 1 (JSON-LD <script>) is rendered directly in ArticleData.tsx body
  // (NOT via metadata.other — Next.js renders metadata.other keys as <meta>
  // tags, not <script> tags, so JSON-LD via metadata.other is semantically
  // wrong and was never actually emitted as a script tag).
  // Layer 2 (HTTP header X-AI-Provenance) + Layer 3 (<meta name="ai-provenance">)
  // are emitted here via metadata.other.
  if (article.summary && article.summary.status === "ok") {
    const provenance = generateProvenanceMetadata({
      summary: {
        summaryText: article.summary.summaryText,
        keyPoints: article.summary.keyPoints,
        sourcesCited: article.summary.sourcesCited,
        aiStatement: article.summary.aiStatement,
        coveragePercentage: article.summary.coveragePercentage,
      },
      articleId: article.id,
      articleUrl: article.canonicalUrl,
      articleTitle: article.title,
      model: article.summary.model,
      generatedAt: article.summary.generatedAt.toISOString(),
    });

    metadata.other = {
      "ai-provenance": provenance.metaTag,
      "X-AI-Provenance": provenance.httpHeader,
    };
  }

  return metadata;
}

export default function ArticlePage({ params }: ArticlePageProps) {
  return (
    <div className="min-h-screen bg-paper-50">
      <Suspense fallback={null}>
        <Header />
      </Suspense>
      <main id="main-content">
        <Suspense fallback={<ArticleSkeleton />}>
          <ArticleData params={params} />
        </Suspense>
      </main>
    </div>
  );
}
