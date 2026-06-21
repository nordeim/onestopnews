"use client";

/**
 * AuthErrorMessage — Client component that reads the ?error= query param
 * and renders an actionable message.
 *
 * Phase 19 (M6): Previously the auth-error page rendered a generic
 * "Something went wrong" message regardless of the error type. Now we
 * detect the `OAuthAccountNotLinked` error specifically and tell the user
 * to sign in with their original method first (the proper account-linking
 * flow is a follow-up — see the TODO in src/lib/auth/index.ts).
 */

import { useSearchParams } from "next/navigation";

export function AuthErrorMessage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (error === "OAuthAccountNotLinked") {
    return (
      <p className="font-ui text-sm text-ink-600 mb-8 max-w-md mx-auto">
        An account with this email already exists using a different sign-in
        method. Please sign in with your original method first, then link the
        new provider from your account settings.
      </p>
    );
  }

  if (error === "CredentialsSignin") {
    return (
      <p className="font-ui text-sm text-ink-600 mb-8 max-w-md mx-auto">
        Invalid email or password. Please check your credentials and try again.
      </p>
    );
  }

  if (error === "AccessDenied") {
    return (
      <p className="font-ui text-sm text-ink-600 mb-8 max-w-md mx-auto">
        Access denied. You may not have permission to sign in, or your account
        has been disabled. Contact an administrator if you believe this is an
        error.
      </p>
    );
  }

  if (error === "Verification") {
    return (
      <p className="font-ui text-sm text-ink-600 mb-8 max-w-md mx-auto">
        The sign-in link has expired or already been used. Please request a new
        sign-in link.
      </p>
    );
  }

  // Default: unknown error.
  return (
    <p className="font-ui text-sm text-ink-600 mb-8 max-w-md mx-auto">
      Something went wrong during the sign-in process. The link may have
      expired, the session may have timed out, or the provider may be
      temporarily unavailable. Please try again.
    </p>
  );
}
