# OneStopNews

> **This file has been consolidated into [`AGENTS.md`](./AGENTS.md).**
>
> As of the post-Phase 19 remediation (and the Phase 20 documentation alignment),
> AGENTS.md is the single source of truth for all project standards, anti-patterns,
> phase histories, file inventories, and lessons learned. CLAUDE.md is now a stub
> and is no longer maintained as a parallel document.
>
> **All instructions that previously lived in CLAUDE.md now live in AGENTS.md:**
>
> - Foundational Principles (the Meticulous Approach + OneStopNews-Specific Principles)
> - Implementation Standards (TypeScript, Next.js 16 App Router, Drizzle, Auth.js, Design System, Worker/BullMQ, AI Pipeline, React 19)
> - Development Workflow (prerequisites, setup, build, pre-commit gate)
> - Testing Strategy, Code Quality Standards
> - Anti-Patterns to Avoid (89 entries post-Phase 20 — 78 from Phase 19 + 11 new from Phase 20)
> - Quick Reference: Layer Model + File Locations (81-entry table)
> - Phase Status Tracker (Phases 1–20, all COMPLETE)
> - Lessons Learned for every phase from Phase 5 through Phase 20
> - Updated File Inventories (Post-Phase 6, Post-Phase 17, Post-Phase 18, Post-Phase 20)
> - Contact & Maintenance footer
>
> If you arrived here expecting to read project standards, please open
> [`AGENTS.md`](./AGENTS.md) instead. If you have a tool or workflow that
> references `CLAUDE.md` (e.g., the Claude Code agent), it will read this stub
> and follow the pointer.
>
> **Why the consolidation?** AGENTS.md was already a 70% superset of CLAUDE.md.
> Maintaining two near-duplicate files caused real drift: Phase 18 references
> in CLAUDE.md were stale while AGENTS.md was up-to-date, the "Security &
> Compliance" section and the three file-inventory tables were never copied
> over, and every update had to be applied twice (and sometimes wasn't). The
> decision was made in the Phase 19+ remediation plan (recommendation Q1=B)
> to merge the unique CLAUDE.md sections into AGENTS.md and reduce CLAUDE.md
> to this stub. Phase 20 / D1 executed the consolidation; Phase 20's
> documentation alignment pass (this update) confirms CLAUDE.md remains a
> stub pointing to AGENTS.md.
>
> **Current project state (post-Phase 20):**
>
> - 452 tests across 66 suites + 10 Playwright E2E + 4 axe-core a11y scans + 4 DB integration tests
> - Coverage: 88.82% lines / 80.35% branches / 84.83% functions / 89.93% statements (thresholds 80/80/70/80)
> - `pnpm check` + `pnpm test -- --coverage` + `pnpm test:integration` all green
> - MEP v6.0 is the authoritative engineering blueprint (`MASTER_EXECUTION_PLAN.md`)

**Project summary (for quick context):**

OneStopNews is a topic-first news aggregation + AI summarisation platform
built on Next.js 16.2.9 + React 19.2 + PostgreSQL 17 + BullMQ v5 on Redis +
a standalone Node.js 24 LTS worker service. The "Editorial Dispatch" design
system uses Newsreader + Instrument Sans + Commit Mono with CSS Subgrid for
feed alignment. Every AI summary carries a 3-layer machine-readable provenance
disclosure (JSON-LD + HTTP header + HTML meta tag) for EU AI Act Article 50
compliance.

For the full project instructions, **see [`AGENTS.md`](./AGENTS.md).**
For the user-facing project overview, see [`README.md`](./README.md).
For the engineering blueprint, see [`MASTER_EXECUTION_PLAN.md`](./MASTER_EXECUTION_PLAN.md) (v6.0).
