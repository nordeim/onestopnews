/**
 * route.ts — Public REST API for articles.
 *
 * PRD §6: GET /api/articles?category=&cursor=&q=&limit=
 * MEP v5.1: CORS headers, cache-control, public access.
 */

import { NextRequest, NextResponse } from "next/server";
import { searchArticles } from "@/features/search/queries";
import { getFeedArticles } from "@/features/feed/queries";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") || "31"), 100);
  const category = searchParams.get("category") || undefined;

  try {
    let response;

    if (query) {
      // Search mode
      const { results, hasMore, nextCursor } = await searchArticles({
        query,
        cursor: cursor ? new Date(cursor) : undefined,
        limit,
      });

      response = {
        articles: results.map((r) => r.article),
        nextCursor,
        hasNextPage: hasMore,
      };
    } else {
      // Feed mode
      const { articles, hasMore, nextCursor } = await getFeedArticles({
        category,
        cursor: cursor ? new Date(cursor) : undefined,
        limit,
      });

      response = {
        articles,
        nextCursor,
        hasNextPage: hasMore,
      };
    }

    return NextResponse.json(response, {
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("[API /articles] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export function OPTIONS() {
  return NextResponse.json(null, { headers: CORS_HEADERS });
}
