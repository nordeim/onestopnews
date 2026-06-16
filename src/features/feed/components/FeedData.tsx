import { FeedGrid } from "./FeedGrid";
import { getFeedArticles } from "@/features/feed/queries";

interface FeedDataProps {
  category?: string;
  cursor?: Date;
  limit?: number;
}

/**
 * FeedData — Server Component for fetching and rendering feed articles.
 *
 * This component fetches data from the database and renders the FeedGrid.
 * It should be wrapped in <Suspense> by the parent to prevent blocking
 * the page render in Next.js 16 with cacheComponents enabled.
 */
export async function FeedData({ category, cursor, limit = 6 }: FeedDataProps) {
  const feed = await getFeedArticles({ category, cursor, limit });

  return <FeedGrid articles={feed.articles} />;
}
