# OneStopNews — Gemini CLI Context

This project is an elite, topic-first news aggregation platform with AI-generated summaries and machine-readable provenance. It follows the **"Editorial Dispatch"** design system and adheres to a strict **Meticulous Approach** for all engineering tasks.

## Project Overview

*   **Goal:** Reorganize public news around subjects, providing calm, source-cited AI summaries.
*   **Target Personas:** Daily scanners, enterprise analysts, and platform editors.
*   **Compliance:** EU AI Act Article 50 (3-layer AI provenance disclosure).
*   **Design Philosophy:** **Anti-Generic**. Rejects "AI slop" and safe templates. Uses Newsreader, Instrument Sans, and Commit Mono.

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Web Framework** | Next.js 16.2.9+ (App Router, PPR, Cache Components) |
| **UI Runtime** | React 19.2 (stable) |
| **Language** | TypeScript 5.x (Strict mode, no `any`) |
| **Styling** | Tailwind CSS v4 (with PostCSS plugin), CSS Subgrid |
| **Database** | PostgreSQL 17 + Drizzle ORM |
| **Search** | Postgres-native FTS (BM25 `ts_rank_cd`) + `pg_trgm` |
| **Job Queue** | BullMQ v5 on Redis (Upstash) |
| **Worker Service** | Node.js 24 LTS (Krypton) |
| **AI Models** | Claude 4.5 Haiku (Primary), GPT-5 Mini (Fallback) |
| **Authentication** | Auth.js v5 (beta.31) |

## Core Commands

| Action | Command |
| :--- | :--- |
| **Install** | `pnpm install` |
| **Development** | `pnpm dev` (Next.js) and `pnpm worker:dev` (Worker) |
| **Build** | `pnpm build` |
| **Testing** | `pnpm test` (Unit/Integration), `pnpm test:e2e` (Playwright) |
| **Lint & Typecheck** | `pnpm check` (Runs `tsc --noEmit && pnpm lint`) |
| **Database** | `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:seed` |

## Architecture & Layer Model

Adhere strictly to this 5-layer model to prevent security and consistency bugs:

1.  **Layer 0: `proxy.ts`** — Network boundary. Cookie check + redirect only. No DB, no logic.
2.  **Layer 1: App Router** — Routes, metadata, PPR, Suspense. Pages fetch data; Layouts do not.
3.  **Layer 2: Feature Modules** — UI composition, data binding, mutations. All DB access via `queries.ts`.
4.  **Layer 3: Domain Services** — Pure business logic. No Next.js or DB client imports.
5.  **Layer 4: Infrastructure** — Drizzle, Auth.js, BullMQ. Side-effecting operations.

## Development Conventions

### 1. The Meticulous Approach (Mandatory)
*   **ANALYZE:** Deep requirement mining.
*   **PLAN:** Structured roadmap presented for approval.
*   **VALIDATE:** Explicit user confirmation.
*   **IMPLEMENT:** Modular, tested, documented builds.
*   **VERIFY:** Rigorous QA (edge cases, accessibility, performance).
*   **DELIVER:** Complete handoff.

### 2. Implementation Standards
*   **Next.js 16:** Always `await` `params`, `searchParams`, and `cookies()`.
*   **Suspense Pattern:** Wrap all database queries in Server Components with `<Suspense>` fallback to avoid `blocking-route` errors.
*   **TypeScript:** `strict: true`, `noUncheckedIndexedAccess: true`. Zero `any`. Use `interface` for shapes, `type` for unions.
*   **Drizzle:** Use the Lazy Proxy Connection in `src/lib/db/index.ts`. Never `push` in production; use `generate` + `migrate`.
*   **AI Guard:** Never summarize `title_only` or `excerpt` articles (prevents hallucination).
*   **Time Rendering:** Never use `new Date()` in Server Components during prerender. Use Client Components with `useEffect` or wrap in `<Suspense>`.

## Key Files & Directories

*   `AGENTS.md`: Detailed agent instructions (Authoritative).
*   `CLAUDE.md`: Implementation standards and patterns.
*   `Project_Architecture_Document_v4.5.md`: Core architecture source of truth.
*   `Project_Requirements_Document_v4.3.md`: Detailed project requirements.
*   `src/lib/db/schema.ts`: Drizzle schema definition.
*   `src/lib/db/index.ts`: Lazy database client.
*   `src/lib/auth/dal.ts`: Data Access Layer for session verification.
*   `src/workers/`: BullMQ worker implementation.
*   `src/features/`: Modularized feature logic (feed, search, summaries).

---
*Refer to **AGENTS.md** for more granular technical rules and anti-patterns.*
