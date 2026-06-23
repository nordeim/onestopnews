"use server";

/**
 * actions.ts — Admin-only Server Actions for source management.
 *
 * PRD §6: Source CRUD with verifyAdminSession() guard.
 */

import { revalidatePath } from "next/cache";
import { verifyAdminSession } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { sources } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const sourceSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  feedUrl: z.string().url(),
  feedFormat: z.enum(["rss", "atom", "json_api"]),
  categoryId: z.string().uuid().optional(),
  priority: z.number().min(1).max(5).default(2),
  pollIntervalMinutes: z.number().min(5).default(15),
});

export async function addSource(data: unknown) {
  await verifyAdminSession();

  const parsed = sourceSchema.parse(data);
  const [newSource] = await db.insert(sources).values(parsed).returning();

  revalidatePath("/admin/sources");
  return newSource;
}

export async function updateSource(id: string, data: unknown) {
  await verifyAdminSession();

  const parsed = sourceSchema.partial().parse(data);
  const [updated] = await db
    .update(sources)
    .set(parsed)
    .where(eq(sources.id, id))
    .returning();

  revalidatePath("/admin/sources");
  return updated;
}

export async function pauseSource(id: string) {
  await verifyAdminSession();

  const [updated] = await db
    .update(sources)
    .set({ isActive: false })
    .where(eq(sources.id, id))
    .returning();

  revalidatePath("/admin/sources");
  return updated;
}

export async function deleteSource(id: string) {
  await verifyAdminSession();

  // TODO: Wire to UI — admin sources page currently has no delete button.
  // This action is tested (actions.test.ts) and ready for use once a
  // delete button + confirmation dialog is added to SourcesData.tsx.
  // Q3 fix: HARD DELETE — permanently removes the source from the database.
  // The schema has onDelete: "cascade" on articles.sourceId, so this
  // cascade-deletes all associated articles too. Use pauseSource() instead
  // if you only want to temporarily disable ingestion without losing data.
  //
  // WARNING: This operation is irreversible. All articles from this source
  // will be permanently deleted. Use with caution.
  const [deleted] = await db
    .delete(sources)
    .where(eq(sources.id, id))
    .returning();

  revalidatePath("/admin/sources");
  return deleted;
}
