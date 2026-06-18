/**
 * page.tsx — Sign-in page (Server Component).
 *
 * Inspects env vars at request time and conditionally enables Google and/or
 * GitHub OAuth buttons. The Credentials form is always shown.
 *
 * Per AGENTS.md: no data fetching in Layouts; this Page does the env check
 * and passes `showGoogle` / `showGithub` to the client component.
 *
 * The forms POST to Auth.js v5's built-in callback routes:
 *   - POST /api/auth/signin/google  → initiates Google OAuth flow
 *   - POST /api/auth/signin/github  → initiates GitHub OAuth flow
 *   - POST /api/auth/callback/credentials → Credentials validation
 *
 * This is the progressive-enhancement pattern: works without client JS.
 */

import { SignInClient } from "./SignInClient";

export default function SignInPage() {
  const showGoogle =
    !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
  const showGithub =
    !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET;

  return <SignInClient showGoogle={showGoogle} showGithub={showGithub} />;
}
