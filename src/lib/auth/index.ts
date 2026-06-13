import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { env } from "@/lib/env";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

/**
 * Auth.js v5 (beta) configuration using DrizzleAdapter.
 * Http-only session cookies, same-site, secure in production.
 */

// ─── Credentials Provider (Admin Authentication) ──────────────────────────
// Validates email/password, authenticates user, and returns user with role
// ────────────────────────────────────────────────────────────────────────────
const credentialsProvider = Credentials({
  id: "credentials",
  name: "Credentials",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials) {
    if (!credentials) return null;

    // Parse and validate the incoming credentials
    const parsed = z
      .object({
        email: z.string().email(),
        password: z.string().min(1),
      })
      .safeParse(credentials);

    if (!parsed.success) return null;

    const { email, password } = parsed.data;

    // TODO: Replace with real user lookup from DB in Phase 2
    // For now, use a basic in-memory check for development
    if (email === "admin@onestopnews.com" && password === "admin") {
      return {
        id: "dev-admin-id",
        email: "admin@onestopnews.com",
        name: "Admin User",
        role: "admin",
      };
    }

    return null;
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
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
  providers: [credentialsProvider],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.role = (user as any).role ?? "reader";
      }
      if (trigger === "update" && session?.name) {
        token.name = session.name;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).id = token.id as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },
});
