import { verifySession } from "@/lib/auth/dal";
import { getLinkedProviders } from "./actions";
import { AccountClient } from "./AccountClient";

/**
 * /account — Account settings page.
 *
 * Phase 19+ remediation, Batch 3 / F2.
 *
 * Shows the user's currently-linked auth providers (Credentials + any OAuth)
 * and lets them initiate linking a new OAuth provider. The actual OAuth flow
 * still goes through Auth.js `/api/auth/signin`, but the `linkOAuthProvider`
 * server action pre-creates the `accounts` row so the OAuth callback's
 * `adapter.linkAccount()` succeeds instead of throwing `OAuthAccountNotLinked`.
 *
 * This page closes the gap documented in:
 *   - src/lib/auth/index.ts:signIn() TODO
 *   - src/app/auth-error/AuthErrorMessage.tsx "link from your account settings"
 *
 * Auth: requires authenticated session (verifySession redirects to /sign-in
 * if not signed in).
 */
export default async function AccountPage() {
  const { user } = await verifySession();
  const linkedProviders = await getLinkedProviders();

  return (
    <main
      id="main-content"
      className="min-h-screen bg-paper-50 text-ink-600 font-ui"
    >
      <div className="mx-auto max-w-2xl px-6 py-12">
        <header className="mb-8 border-b border-ink-100 pb-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-300">
            Account
          </p>
          <h1 className="mt-2 font-editorial text-3xl font-[800] leading-tight tracking-[-0.02em] text-ink-900">
            Linked Providers
          </h1>
          <p className="mt-2 text-sm text-ink-600">
            Signed in as{" "}
            <span className="font-mono text-ink-900">
              {user.name ?? user.id}
            </span>
          </p>
        </header>

        <AccountClient linkedProviders={linkedProviders} />
      </div>
    </main>
  );
}
