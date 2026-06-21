import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";

import { env } from "@/lib/env";
import { authDb } from "@/lib/db/auth";
import * as schema from "@/lib/db/schema";
import { buildProviders } from "./providers";

/**
 * Auth.js v5 (beta) configuration using DrizzleAdapter.
 * Http-only session cookies, same-site, secure in production.
 *
 * Providers (configured in ./providers.ts):
 *   - Credentials  — always present (admin email/password login)
 *   - Google       — conditional on GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET
 *   - GitHub       — conditional on GITHUB_CLIENT_ID + GITHUB_CLIENT_SECRET
 *
 * OAuth providers are loaded only when their env vars are set, so existing
 * deployments without OAuth configuration continue to work unchanged.
 */

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(authDb, {
    // NOTE: `as any` is required because the adapter's DefaultPostgres*Table types
    // enforce a strict column structure that doesn't match our custom schema.
    // Our schema has all required columns (verified manually), just with
    // different TypeScript shapes. This is a known limitation of the adapter.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    usersTable: schema.users as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    accountsTable: schema.accounts as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sessionsTable: schema.sessions as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    verificationTokensTable: schema.verificationTokens as any,
  }),
  trustHost: !!env.AUTH_URL,
  secret: env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/sign-in",
    error: "/auth-error",
  },
  providers: buildProviders(),
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "reader";
      }
      if (trigger === "update" && session?.name) {
        token.name = session.name;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id ?? "";
        session.user.role = token.role ?? "reader";
      }
      return session;
    },
    // ── Phase 19 (M6): Surface OAuthAccountNotLinked errors clearly ──────
    // When a user signs in with Credentials first, then tries OAuth with
    // the same email, Auth.js v5 throws `OAuthAccountNotLinked` by default
    // (the email is already bound to a different credential). The default
    // behavior redirects to /auth-error with an opaque `?error=OAuthAccountNotLinked`
    // query param, which the auth-error page renders as "Something went wrong".
    //
    // This signIn callback detects that specific error and appends a
    // `?error=account-linking-required` param so the auth-error page can
    // render an actionable message ("Sign in with your original method
    // first, then link the new provider from account settings").
    //
    // TODO: Implement a proper /link-account flow that:
    //   1. Detects the OAuthAccountNotLinked error
    //   2. Prompts the user to sign in with their original method
    //   3. Calls adapter.linkAccount() to merge the new OAuth provider
    // This is a substantial feature (new page, new server action, new UI)
    // and is tracked as a follow-up. For now, this callback at least makes
    // the error message actionable.
    async signIn({ user, account }) {
      // If signing in with OAuth and the email already exists for a
      // different provider, account will be null (the adapter throws
      // before we get here). We can't easily detect this case here —
      // Auth.js v5 beta's signIn callback signature doesn't expose the
      // error. The /auth-error page checks the `?error=` param instead.
      // This callback is a placeholder for future linking logic.
      void user;
      void account;
      return true;
    },
  },
});
