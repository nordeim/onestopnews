import { Suspense } from "react";
import { FeedData } from "@/features/feed/components/FeedData";
import { FeedSkeleton } from "@/features/feed/components/FeedSkeleton";
import { Header } from "@/shared/components/layout/Header";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper-50">
      <Suspense fallback={null}>
        <Header activeCategory="top-stories" />
      </Suspense>
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="mb-12">
          <h2 className="font-editorial text-4xl font-[800] text-ink-900 mb-4">
            Top Stories
          </h2>
          <p className="font-ui text-ink-600 text-lg max-w-2xl">
            The most important stories of the day, summarised by AI with
            full source citation.
          </p>
        </section>

        <Suspense fallback={<FeedSkeleton />}>
          <FeedData limit={6} />
        </Suspense>

        {/* TODO: Restore Load More with cursor pagination */}
      </main>
    </div>
  );
}
