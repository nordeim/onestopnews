/**
 * route.ts — Public REST API for articles.
 *
 * PRD §6: GET /api/articles?category=&cursor=&q=&limit=
 * MEP v5.1: CORS headers, cache-control, public access.
 *
 * Phase 13 hardening:
 *   - Cursor validation (returns 400 for invalid ISO 8601 date)
 *   - Rate limiting via Redis fixed-window (max 20 req/s per IP)
 */

import { NextRequest, NextResponse } from "next/server";
import { searchArticles } from "@/features/search/queries";
import { getFeedArticles } from "@/features/feed/queries";
import { checkRateLimit } from "@/lib/rateLimit";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Rate limit: 20 requests per second per IP (fixed window).
// Burst is naturally absorbed by the 1-second window.
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_SEC = 1;

/**
 * Extracts and validates the client IP from request headers.
 *
 * IP extraction strategy:
 *   - If TRUSTED_PROXY env var is set ("true"), the app is behind a trusted
 *     reverse proxy / CDN. Use the RIGHTMOST IP in x-forwarded-for (the
 *     trusted proxy's view of the client). This prevents spoofing because
 *     only the trusted proxy can set the header.
 *   - Otherwise (default, no proxy), use the LEFTMOST IP in x-forwarded-for
 *     (the client-supplied value). This is spoofable but documented —
 *     suitable for development or direct-exposure deployments.
 *   - If x-forwarded-for is absent, fall back to x-real-ip.
 *   - If no IP headers present, return "unknown".
 *
 * @param request — The NextRequest to extract the client IP from
 * @returns The client IP string (or "unknown")
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map((ip) => ip.trim());
    // When behind a trusted proxy, use the rightmost (last) IP — the proxy's
    // view of the client. Otherwise use the leftmost (first) IP.
    const isTrustedProxy = process.env.TRUSTED_PROXY === "true";
    const ip = isTrustedProxy ? ips[ips.length - 1] : ips[0];
    return ip ?? "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function GET(request: NextRequest) {
  // ── Rate limit check ─────────────────────────────────────────────────────
  const ip = getClientIp(request);
  const rateLimitResult = await checkRateLimit(
    `api:articles:${ip}`,
    RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW_SEC
  );
  if (!rateLimitResult.allowed) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)
    );
    return NextResponse.json(
      { error: "Rate limit exceeded. Please retry later." },
      {
        status: 429,
        headers: {
          ...CORS_HEADERS,
          "Retry-After": String(retryAfterSec),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  // ── Parse + validate query params ────────────────────────────────────────
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const rawCursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") || "31"), 100);
  const category = searchParams.get("category") || undefined;

  // Cursor validation: must be a parseable ISO 8601 date if present.
  let cursorDate: Date | undefined;
  if (rawCursor) {
    cursorDate = new Date(rawCursor);
    if (isNaN(cursorDate.getTime())) {
      return NextResponse.json(
        {
          error:
            "Invalid cursor format. Expected ISO 8601 date string (e.g., 2024-06-01T00:00:00Z).",
        },
        { status: 400, headers: CORS_HEADERS }
      );
    }
  }

  try {
    let response;

    if (query) {
      // Search mode
      const { results, hasMore, nextCursor } = await searchArticles({
        query,
        cursor: cursorDate,
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
        cursor: cursorDate,
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
        "X-RateLimit-Remaining": String(rateLimitResult.remaining),
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
