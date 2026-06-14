import Link from "next/link";
import { Button } from "@/shared/components/ui/Button";
import { FeedGrid } from "@/features/feed/components/FeedGrid";
import { getFeedArticles } from "@/features/feed/queries";
import { Header } from "@/shared/components/layout/Header";
import { Footer } from "@/shared/components/layout/Footer";

export default async function HomePage() {
  const feed = await getFeedArticles({ limit: 6 });

  return (
    <div className="min-h-screen bg-paper-50">
      <Header activeCategory="top-stories" />
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

        <FeedGrid articles={feed.articles} />

        {feed.hasMore && (
          <div className="mt-12 text-center">
            <Button variant="secondary" asChild>
              <Link href={`?cursor=${feed.nextCursor}`}>Load More Stories</Link>
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
