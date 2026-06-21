"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

/**
 * UserMenu — Auth-aware user menu rendered in the Header.
 *
 * Phase 19 (High H2): Previously the Header had no sign-in/sign-out button.
 * Users could only sign in by typing /sign-in directly, and could not sign
 * out from any page. This component renders:
 *   - "Sign In" link to /sign-in when unauthenticated
 *   - "Sign Out" button (form action calling signOut()) when authenticated
 *
 * Wrapping the root layout in <SessionProvider> is required for useSession()
 * to work on the client side.
 *
 * WCAG AAA: focus-visible:ring-* classes on every interactive element.
 */

export function UserMenu() {
  const { data: session, status } = useSession();

  // While the session is being fetched, render nothing — avoids a flash
  // of the wrong state (e.g., showing "Sign In" briefly to an authenticated
  // user before the cookie is parsed).
  if (status === "loading") {
    return null;
  }

  if (!session) {
    return (
      <Link
        href="/sign-in"
        className="inline-flex items-center justify-center h-9 px-3 rounded-sm text-sm font-medium text-ink-600 hover:text-ink-900 hover:bg-paper-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dispatch-ember focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50"
        aria-label="Sign in"
      >
        Sign In
      </Link>
    );
  }

  return (
    <form
      action={async () => {
        await signOut({ redirectTo: "/" });
      }}
    >
      <button
        type="submit"
        className="inline-flex items-center justify-center h-9 px-3 rounded-sm text-sm font-medium text-ink-600 hover:text-ink-900 hover:bg-paper-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dispatch-ember focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50"
        aria-label="Sign out"
      >
        Sign Out
      </button>
    </form>
  );
}
