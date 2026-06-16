"use cache";

/**
 * queries.ts — Sources data access layer.
 *
 * Uses "use cache" to prevent blocking-route errors in Next.js 16.
 * Admin data changes infrequently; cached for feed profile duration.
 */

import { db } from "@/lib/db";
import { sources, categories } from "@/lib/db/schema";
import { cacheLife } from "next/cache";

export interface SourceRow {
  id: string;
  name: string;
  feedUrl: string | null;
  categoryId: string | null;
  isActive: boolean;
  failureCount: number;
}

export interface CategoryMap {
  [id: string]: string;
}

export async function getAllSources(): Promise<SourceRow[]> {
  cacheLife("feed");
  return db.select().from(sources);
}

export async function getCategoryMap(): Promise<CategoryMap> {
  cacheLife("feed");
  const rows = await db.select({ id: categories.id, name: categories.name }).from(categories);
  const map: CategoryMap = {};
  for (const row of rows) {
    map[row.id] = row.name;
  }
  return map;
}
