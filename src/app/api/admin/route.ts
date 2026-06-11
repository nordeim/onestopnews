import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Verifies the current user has admin role.
 * Memoized per-request via React.cache().
 * @throws redirect to / if not admin
 */
export const verifyAdminSession = cache(async () => {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    redirect("/");
  }
  return session;
});
