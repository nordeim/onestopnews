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
  const [newSource] = await db
    .insert(sources)
    .values(parsed)
    .returning();

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

  // Soft delete: set status to disabled
  const [updated] = await db
    .update(sources)
    .set({ isActive: false })
    .where(eq(sources.id, id))
    .returning();

  revalidatePath("/admin/sources");
  return updated;
}
