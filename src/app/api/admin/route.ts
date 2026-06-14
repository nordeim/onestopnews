import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth/dal";

/**
 * Admin API Route — Stub for Phase 4
 *
 * Uses DAL-layer `verifyAdminSession()` which:
 * - Redirects unauthenticated users to `/sign-in`
 * - Redirects non-admin users to `/`
 * - Only proceeds if the user has role === "admin"
 *
 * TODO: Replace stub with actual admin endpoints in Phase 4.
 */
export async function GET() {
  const user = await verifyAdminSession();

  return NextResponse.json({
    status: "ok",
    message: "Admin API — stub endpoint for Phase 4",
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
    },
  });
}
