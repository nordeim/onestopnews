import { Suspense } from "react";
import { headers } from "next/headers";
import { FeedData } from "@/features/feed/components/FeedData";
import { FeedSkeleton } from "@/features/feed/components/FeedSkeleton";
import { Header } from "@/shared/components/layout/Header";
import { Footer } from "@/shared/components/layout/Footer";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ cursor?: string }>;
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { category } = await params;
  const { cursor: cursorString } = await searchParams;
  const cursor = cursorString ? new Date(cursorString) : undefined;

  // Fix A: Derive year from request headers to avoid next-prerender-current-time
  const dateHeader = (await headers()).get("date");
  const currentYear = dateHeader ? new Date(dateHeader).getFullYear() : 2026;

  return (
    <div className="min-h-screen bg-paper-50">
      <Header activeCategory={category} />
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="mb-12">
          <h2 className="font-editorial text-4xl font-[800] text-ink-900 mb-4 capitalize">
            {category.replace(/-/g, " ")}
          </h2>
          <p className="font-ui text-ink-600 text-lg max-w-2xl">
            Latest news and analysis from the {category.replace(/-/g, " ")} category.
          </p>
        </section>

        <Suspense fallback={<FeedSkeleton />}>
          <FeedData category={category} cursor={cursor} limit={6} />
        </Suspense>
      </main>
      <Footer currentYear={currentYear} />
    </div>
  );
}
