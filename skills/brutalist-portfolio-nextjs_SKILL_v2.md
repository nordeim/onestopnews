---
name: brutalist-portfolio-nextjs
description: >
  Build or remediate an avant-garde, anti-generic personal portfolio using Next.js 16 App Router
  with a Tactile Brutalism + High-End Editorial design system. Covers the complete architectural
  lifecycle from Vite SPA migration to production: CSS-first design tokens with dual theme,
  client-side SPA orchestrator embedded in Next.js, hash-based routing, lazy-loaded sections
  with ErrorBoundary + Suspense, optional database with graceful null handling, WCAG AAA
  accessibility, strict TypeScript with noUncheckedIndexedAccess, and full remediation workflow.
  Use this skill whenever building or porting a portfolio, personal site, creative showcase,
  or any web project that demands distinctive brutalist/editorial aesthetics with Next.js.
  Also use when performing code review remediation, type-safety auditing, CSS variable
  reconciliation, or migrating from Vite to Next.js on an existing project. Triggers on:
  portfolio, personal site, brutalist design, editorial design, Next.js port, SPA orchestrator,
  hash routing, dual theme, anti-generic design, design system tokens, CSS variable strategy,
  noUncheckedIndexedAccess, react-error-boundary, remediation, type consolidation, Vite migration,
  Next.js 16, Tailwind v4.
---

# Brutalist Portfolio — Next.js 16 Architectural Blueprint & Remediation Guide

This skill distills the complete architectural knowledge, design system, phased workflow, patterns, anti-patterns, hard-won troubleshooting insights, and remediation methodology from building and remediating "The Engineered Soul" — a personal portfolio ported from a Vite SPA to Next.js 16 App Router with Tactile Brutalism aesthetics, through two full remediation cycles that resolved 34+ TypeScript errors and numerous architectural inconsistencies.

Any agent using this skill can reproduce a similar codebase from scratch, apply the same architectural decisions to a new project, or perform rigorous remediation on an existing Next.js codebase.

---

## Table of Contents

1. [Project Execution Phases](#project-execution-phases)
2. [Architecture Blueprint](#architecture-blueprint)
3. [Design System: Tactile Brutalism + High-End Editorial](#design-system-tactile-brutalism--high-end-editorial)
4. [CSS Strategy for Tailwind v4](#css-strategy-for-tailwind-v4)
5. [Theme System Design](#theme-system-design)
6. [Component Architecture](#component-architecture)
7. [Data & Type Strategy](#data--type-strategy)
8. [Type Safety: noUncheckedIndexedAccess Deep Dive](#type-safety-nouncheckedindexedaccess-deep-dive)
9. [Error Boundary Architecture](#error-boundary-architecture)
10. [Hash Routing Design](#hash-routing-design)
11. [Database as Optional Feature](#database-as-optional-feature)
12. [Accessibility (WCAG AAA)](#accessibility-wcag-aaa)
13. [Security Headers & Metadata](#security-headers--metadata)
14. [Build & Verification Pipeline](#build--verification-pipeline)
15. [Patterns](#patterns)
16. [Anti-Patterns](#anti-patterns)
17. [Troubleshooting Guide](#troubleshooting-guide)
18. [Remediation Methodology](#remediation-methodology)
19. [Lessons Learnt](#lessons-learnt)
20. [Outstanding Issues & Recommendations](#outstanding-issues--recommendations)
21. [File Structure Reference](#file-structure-reference)
22. [Type Reference](#type-reference)

---

## Project Execution Phases

Every project follows this disciplined multi-phase sequence. Each phase has explicit deliverables and verification gates. Skipping phases introduces defects that compound exponentially.

### Phase 1: ANALYZE — Deep Requirement Mining

- Never make surface-level assumptions. Identify explicit requirements, implicit needs, and ambiguities.
- Research existing codebases, documentation, and relevant resources before proposing solutions.
- Explore multiple approaches, evaluating technical feasibility, alignment with project goals, and long-term implications.
- Perform risk assessment: identify dependencies, challenges, and mitigation strategies.
- **For a port**: Audit the source project (if porting), catalog every component, interaction, and design token. Identify what must be preserved and what can evolve.
- **For remediation**: Read ALL documentation files (CLAUDE.md, AGENTS.md, README.md, any code review reports, status files) before touching code. These contain critical project-specific constraints and gotchas that are not obvious from the code alone.

### Phase 2: PLAN — Structured Execution Roadmap

- Create a detailed plan with sequential phases, clear objectives, integrated checklists, success criteria, and validation checkpoints.
- Present the plan for explicit user confirmation before writing any code.
- Include estimated effort for each phase.
- **For a port**: Map every source component to its target implementation. Identify which components need redesign vs. faithful port.
- **For remediation**: Identify the full scope of changes — new types, renamed fields, import path corrections, dependency additions — before extracting any files. Cross-reference the remediation report against the current codebase state.

### Phase 3: VALIDATE — Explicit Confirmation

- Obtain explicit user approval of the plan.
- Address concerns or modifications to the plan.
- Ensure alignment on all aspects before implementation begins.

### Phase 4: IMPLEMENT — Modular, Tested, Documented

- Set up environment: dependencies, configurations, prerequisites.
- Implement in logical, testable components.
- Practice continuous testing: verify each component before integration.
- Follow library-first approach: use existing UI/component libraries when available.
- Apply bespoke styling only when necessary to achieve the design vision.
- Track progress against the plan and communicate deviations.
- **Critical for remediation**: After extracting files from a remediation report, verify package versions against npm BEFORE running `npm install`. Remediation reports often specify versions that don't exist on npm.

### Phase 5: VERIFY — Rigorous QA

- Run typecheck (`npx tsc --noEmit`) — zero errors required.
- Run production build (`npm run build`) — zero errors required.
- Run lint (`npm run lint`) — zero warnings required.
- Review for accessibility (skip links, focus-visible, reduced motion, ARIA).
- Consider edge cases: missing environment variables, null database connections, empty data arrays.
- Verify visual fidelity against the design system.
- **After remediation**: Run a full codebase audit — check for stale references to removed/renamed files, verify CSS variable references resolve, verify Tailwind class names are defined, check for duplicate type definitions, verify component integration status (active vs dormant).

### Phase 6: DELIVER — Complete Handoff

- Provide clear usage instructions.
- Document challenges encountered and solutions implemented.
- Classify components as "active" (wired into the app) vs. "dormant" (exist but not integrated).
- Update all documentation (README.md, CLAUDE.md, AGENTS.md) to reflect the current state.
- List outstanding issues and recommendations for future work.
- Create archive of the codebase for repo refresh if needed.

---

## Architecture Blueprint

### Core Architectural Decision: Client-Side SPA Orchestrator inside Next.js

The portfolio uses a **Client-Side SPA Orchestrator** pattern embedded within the Next.js App Router. This preserves complex animations, hash-based routing, and kinetic interactions from the original Vite SPA while gaining Next.js benefits (metadata API, code splitting via Turbopack, security headers, structured data).

**Why this pattern**: A pure Server Component approach would lose the hash-based routing and interactive state management that makes the portfolio feel like a "digital installation." The orchestrator pattern gives you both worlds — SEO metadata from Server Components, interactive SPA behavior from Client Components.

### Architectural Layers

```
layout.tsx (Server Component)
  └── metadata, viewport, FOUC prevention script, skip-link, <body>
      └── page.tsx (Client Component — "use client")
          └── ErrorBoundary (react-error-boundary, wraps everything)
              └── dynamic import with ssr: false
                  └── PortfolioApp.tsx (Client Component — orchestrator)
                      ├── AccessibilityProvider
                      ├── Navigation (eager)
                      ├── HeroKinetic (eager — above fold)
                      ├── Sections (lazy via React.lazy + Suspense)
                      │   ├── BentoGrid (About)
                      │   ├── ProjectsSection > ProjectCard
                      │   ├── SkillsSection
                      │   ├── Timeline (Experience)
                      │   ├── BlogSection
                      │   ├── Terminal
                      │   └── ContactSection
                      └── Footer (lazy)
```

### Key Architectural Rules

1. **`layout.tsx` is a Server Component** — exports `metadata` and `viewport`, contains the FOUC-prevention script (via `ThemeScript`), renders the skip-link.
2. **`page.tsx` is a Client Component** — required because it uses `next/dynamic` with `ssr: false`. Uses `react-error-boundary` (NOT a custom ErrorBoundary) at the top level. This is a deliberate trade-off: no SSR for the page content, but metadata from `layout.tsx` still works for SEO.
3. **`PortfolioApp.tsx` is the orchestrator** — manages theme state, hash routing, and section composition. All sections are wrapped in a custom class-based `ErrorBoundary` + `Suspense`. **File location: `src/app/PortfolioApp.tsx`, NOT `src/components/PortfolioApp.tsx`** — the App Router co-locates the orchestrator with the route.
4. **Above-the-fold content is eager** — `Navigation` and `HeroKinetic` are imported directly (not lazy).
5. **Below-the-fold sections are lazy** — uses `React.lazy()` + `Suspense` for code splitting.
6. **Dual error boundary system** — `react-error-boundary` at the page level (catches everything), custom class-based `ErrorBoundary` per section (isolates failures to individual sections).

### `useRouteHash` Hook — Returns a Tuple, Not an Object

The `useRouteHash` hook returns a **tuple** `[string, (section: string) => void]`, NOT an object with named properties. This is a critical distinction that caused a real bug during remediation:

```typescript
// CORRECT — array destructuring
const [currentHash, navigateTo] = useRouteHash();

// WRONG — object destructuring (causes runtime error)
const { currentHash, navigateTo } = useRouteHash();
```

The hook signature:
```typescript
export function useRouteHash(): [string, (section: string) => void]
```

It reads and writes `window.location.hash`, validates against a `VALID_SECTIONS` array, and handles accessibility by focusing the target section after navigation.

---

## Design System: Tactile Brutalism + High-End Editorial

### Design Philosophy

The aesthetic is deliberately anti-generic. Every visual decision must earn its place through calculated purpose. The design rejects:
- Predictable Bootstrap-style grids and card layouts
- Safe "Inter/Roboto" pairings without distinctive typographical hierarchy
- Purple-gradient-on-white clichés
- Rounded corners (border-radius is zero everywhere)
- Homogenized "AI slop" aesthetic

### The 28px Mathematical Grid

All spacing is governed by a 28px unit. This creates a visible structural rhythm that reinforces the brutalist aesthetic. Define the grid as CSS custom properties in the `@theme` block:

```css
@theme {
  --spacing-grid: 28px;
  --spacing-half: 14px;    /* grid / 2 */
  --spacing-quarter: 7px;  /* grid / 4 */
  --spacing-double: 56px;  /* grid * 2 */
  --spacing-triple: 84px;  /* grid * 3 */
  --spacing-quad: 112px;   /* grid * 4 */
}
```

**Gotcha**: If these derived spacing tokens are not defined in `@theme`, components that reference `var(--spacing-half)` etc. will silently get `unset`, causing layout collapse. Every CSS variable used in a component MUST be defined in `@theme` — undefined variables fail silently with no error or warning.

### Typography Hierarchy — Three Voices

Every font choice serves a distinct role. Do not use Inter or Roboto as the body font — that is the "safe default" this design rejects.

| Role | Font | CSS Variable | Tailwind Class | Purpose |
|---|---|---|---|---|
| **Editorial** | Cormorant Garamond | `--font-editorial` / `--font-serif` | `font-editorial` | Headings, narrative, hero text |
| **Body** | DM Sans | `--font-body` / `--font-sans` | `font-body` | General content, paragraphs |
| **Utility** | IBM Plex Mono | `--font-utility` / `--font-mono` | `font-utility` | Labels, stats, Machine Mode, terminal |

**Why DM Sans instead of Inter**: Inter is the default system-ui stand-in used by every startup landing page. DM Sans provides similar readability with a distinctive geometric character that breaks the "AI slop" pattern.

**Note**: The variable `--font-display` is used by multiple active components as an alias for `--font-editorial`, but is NOT currently defined in `@theme`. Either add it as an alias or rewrite components to use `--font-editorial` directly.

### Brutalist Enforcement

Zero border-radius is non-negotiable. Enforce it globally:

```css
* {
  border-radius: 0 !important;
}
```

### Color System: Dual Theme with `--color-` Prefix Convention

Define all design tokens with the `--color-` prefix in the `@theme` block. This convention must be consistent across the entire codebase — mixing naming conventions creates a maintenance nightmare.

**Night theme (default) — dark palette:**
```css
@theme {
  --color-bg: #0a0a0a;
  --color-bg-soft: #111111;
  --color-surface: #1a1a1a;
  --color-border: #222222;
  --color-border-strong: #333333;
  --color-text-primary: #f0ece4;
  --color-text-secondary: #a8a29e;
  --color-text-muted: #6b6560;
  --color-accent: #e8c547;
  --color-accent-hover: #f0d060;
  --color-accent-muted: #e8c54733;
}
```

**Day theme overrides via `[data-theme="day"]` selector:**
```css
[data-theme="day"] {
  --color-bg: #f5f0e8;
  --color-bg-soft: #ede8df;
  --color-surface: #e5e0d6;
  --color-border: #d5cfc4;
  --color-border-strong: #b8b0a2;
  --color-text-primary: #1a1612;
  --color-text-secondary: #5c5650;
  --color-text-muted: #8a8478;
  --color-accent: #b8860b;
  --color-accent-hover: #996f08;
  --color-accent-muted: #b8860b22;
}
```

**Critical rule**: Use `--color-` prefix consistently. Do NOT introduce shorthand variants like `--border-color`, `--text-primary`, or `--bg-surface`. If components need different names, define alias variables in `globals.css` rather than creating a parallel naming system.

### Shadows: Brutal Offsets

Shadows are hard-edged offsets (no blur), reinforcing the brutalist aesthetic. These MUST be defined in `@theme`:

```css
@theme {
  --shadow-brutal: 4px 4px 0px 0px var(--color-border);
  --shadow-brutal-sm: 2px 2px 0px 0px var(--color-border);
  --shadow-brutal-lg: 6px 6px 0px 0px var(--color-border);
}
```

**Gotcha**: If `--shadow-brutal` and `--shadow-brutal-sm` are not defined, `box-shadow: var(--shadow-brutal)` silently resolves to `unset` — cards render without shadows and look broken. No error, no warning.

### Additional Required Design Tokens

These tokens are used by active components and MUST be defined in `@theme` with day-theme overrides where applicable:

| Token | Used By | Day Override Needed |
|---|---|---|
| `--font-display` | HeroKinetic, Timeline, BlogSection, ContactSection, BentoGrid, ProjectCard | No (alias for `--font-editorial`) |
| `--spacing-double` | HeroKinetic, SectionBlock, ProjectsSection, ContactSection | No |
| `--spacing-half` | Navigation, ProjectsSection, SkillsSection, Timeline, ContactSection, ThemeSwitch, Terminal, BentoGrid, ErrorBoundary | No |
| `--spacing-quarter` | Navigation, ProjectsSection, SkillsSection, Timeline, ContactSection, ThemeSwitch, ErrorBoundary | No |
| `--transition-fast` | Navigation, HeroKinetic, ProjectsSection, ProjectCard, ThemeSwitch, ContactSection, Footer, BentoGrid | No |
| `--shadow-brutal` | HeroKinetic, ContactSection, Terminal | Yes |
| `--shadow-brutal-sm` | SkillsSection, ProjectCard, BentoGrid | Yes |
| `--color-text-inverse` | HeroKinetic, ProjectsSection, ProjectCard, ContactSection | Yes |
| `--color-border-subtle` | Navigation, HeroKinetic, ProjectsSection, ProjectCard, SkillsSection, BlogSection | Yes |
| `--color-bg-sunken` | ProjectCard, ContactSection, Terminal | Yes |
| `--color-bg-elevated` | Terminal, ErrorBoundary | Yes |
| `--color-error` | ContactSection, Terminal, ErrorBoundary | Yes |
| `--color-accent-subtle` | ContactSection | Yes |

---

## CSS Strategy for Tailwind v4

### Import Order (Build-Breaking If Wrong)

This is the single most common build failure. The order must be:

```css
/* 1. External font imports — MUST come first */
@import url("https://fonts.googleapis.com/css2?family=...");

/* 2. Tailwind v4 — expands to @layer rules */
@import "tailwindcss";

/* 3. Your @theme block and custom styles */
@theme { ... }
```

**Why**: Tailwind v4's `@import "tailwindcss"` expands to `@layer base`, `@layer components`, and `@layer utilities`. CSS specification requires `@import` rules to precede all other rules except `@charset` and `@layer` statements. If `@import url(...)` comes after `@import "tailwindcss"`, the CSS optimizer rejects it with a warning and the fonts will not load.

**Alternative**: Load Google Fonts via `<link>` tags in `layout.tsx` `<head>` with `preconnect`. This avoids the CSS import ordering issue entirely.

### Design Tokens in `@theme`, Not `tailwind.config`

Tailwind v4 uses CSS-first configuration. Define all tokens in the `@theme` block of `globals.css`:

```css
@theme {
  --font-editorial: "Cormorant Garamond", Georgia, serif;
  --font-body: "DM Sans", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", monospace;
  --color-bg: #0a0a0a;
  --spacing-grid: 28px;
}
```

These become available as Tailwind utilities automatically: `font-editorial`, `bg-bg`, `p-grid`, etc.

### Custom Tailwind Utility Classes

If components need custom utility classes (e.g., `font-utility`, `font-editorial`, `z-grain`), they MUST be defined in the `@theme` block. Undefined classes silently fail — the element renders with browser defaults.

Required z-index layers for layered overlays:
```css
@theme {
  --z-index-grain: 50;
  --z-index-machine: 40;
  --z-index-mobile-backdrop: 45;
  --z-index-mobile-drawer: 46;
  --z-index-skip-link: 100;
  --z-index-loader: 60;
}
```

These map to Tailwind utilities: `z-grain`, `z-machine`, `z-mobile-backdrop`, `z-mobile-drawer`.

### CSS Variable Naming: The Two-Convention Problem

Active components use `--color-` prefix: `--color-border`, `--color-text-primary`, `--color-bg`. Dormant components use shorthand names that do NOT exist: `--border-color`, `--text-primary`, `--bg-surface`, `--bg-primary`, `--bg-elevated`, `--text-secondary`, `--text-muted`, `--border-strong`, `--color-accent-code`, `--color-accent-poetry`.

Before integrating any dormant component, either:
1. Define alias variables in `globals.css` (quick fix)
2. Rewrite the component to use the `--color-` prefix convention (proper fix)

---

## Theme System Design

### Architecture: `data-theme` Attribute

The theme system uses a `data-theme` attribute, toggled between `"day"` and `"night"`. CSS selectors target `[data-theme="day"]`.

**Do NOT use class-based theme switching** (`theme-night` / `theme-day`). The `data-attribute` approach is more semantic, works with FOUC prevention, and avoids class name collisions.

### Theme Target Inconsistency (Known Issue)

There is a current inconsistency in the codebase:
- **ThemeScript** (in `layout.tsx`) sets `data-theme` on `document.documentElement` (`<html>`)
- **PortfolioApp.tsx** sets `data-theme` on `document.body`
- CSS `[data-theme="day"]` rules only match the element they're set on

**Recommendation**: Pick ONE target consistently. Use `<html>` (`document.documentElement`) since that's what ThemeScript already targets and it covers the full document before React hydration.

### FOUC Prevention Script

Place an inline `<script>` via the `ThemeScript` component in `layout.tsx`'s `<head>` that reads `localStorage` and sets `data-theme` before the first paint:

```tsx
export function ThemeScript() {
  const script = `
    (function() {
      try {
        var theme = localStorage.getItem('theme');
        if (theme) {
          document.documentElement.setAttribute('data-theme', theme);
        }
      } catch (e) {}
    })();
  `;
  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}
```

The FOUC script runs before React hydration, when `<body>` may not exist yet. Setting on `documentElement` covers the interim.

### Theme Change Handler

In the orchestrator component, handle theme changes with accessibility announcements:

```tsx
const handleThemeChange = useCallback((theme: "day" | "night") => {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);

  const announcement = document.getElementById("theme-announcement");
  if (announcement) {
    announcement.textContent = `Switched to ${theme} theme`;
  }
}, []);
```

Include a live region for the announcement:
```tsx
<div id="theme-announcement" aria-live="polite" aria-atomic="true" className="sr-only" />
```

---

## Component Architecture

### Active vs. Dormant Classification

Components fall into two categories. Track this explicitly in documentation — assuming all components are wired in causes confusion.

**Active** (18, wired into `PortfolioApp.tsx`):
- `Navigation`, `HeroKinetic`, `SectionBlock`, `ErrorBoundary`, `AccessibilityProvider`
- `BentoGrid`, `ProjectsSection`, `ProjectCard`, `SkillsSection`, `Timeline`
- `BlogSection`, `Terminal`, `ContactSection`, `Footer`, `ThemeSwitch`
- `ScrollReveal`, `ThemeScript`

**Dormant** (14, exist in `src/components/` but NOT wired into the orchestrator):
- `AboutFlow`, `ArchiveSpread`, `ArchiveItemCard`, `BentoTile`, `BrandMark`
- `ClientOnly`, `CodeRain`, `ContentBody`, `DitherOverlay`, `GrainOverlay`
- `LayoutShell`, `MachineOverlay`, `MobileDrawer`, `SocialIcon`, `ThemeToggle`

**Why dormant components exist**: They may be from an earlier iteration or planned for future integration. They must not be deleted without confirmation, but they must also not be assumed to work — they likely reference undefined CSS variables or Tailwind classes.

**Dead code** (never imported by anyone): `src/lib/data.ts`, `src/lib/content.ts`, `src/lib/utils.ts`, `src/lib/testimonials.ts`, `src/lib/sounds.ts`, `src/hooks/useViewTransitions.ts`, `src/hooks/useWeightedScroll.ts`.

### Section Composition Pattern

Each section follows this pattern in the orchestrator:

```tsx
<section id="section-id" aria-label="Section Name">
  <ErrorBoundary fallback={<SectionError name="Section Name" />}>
    <Suspense fallback={<SectionSkeleton />}>
      <SectionBlock id="section-content" title="Section Title">
        <SectionComponent />
      </SectionBlock>
    </Suspense>
  </ErrorBoundary>
</section>
```

The three-layer wrapping provides:
1. **ErrorBoundary** — catches runtime errors, shows fallback UI
2. **Suspense** — shows skeleton while lazy-loaded component loads
3. **SectionBlock** — provides consistent section layout with title

### Stateless Component Principle

Keep components in `src/components/` as stateless as possible. State management belongs in:
- Custom hooks (`src/hooks/`) for interaction logic
- The orchestrator (`PortfolioApp.tsx`) for app-level state

---

## Data & Type Strategy

### Static TypeScript Data

Content is managed as static TypeScript data, not fetched from a CMS or database. This ensures type safety at build time, zero network requests for content, instant page loads, and easy version control.

Organize data files by domain:
```
src/lib/
  ├── types.ts        — Shared TypeScript interfaces (CANONICAL type definitions)
  ├── projects.ts     — Project entries (imports and re-exports from types.ts)
  ├── skills.ts       — Skill categories and items
  └── timeline.ts     — Career timeline entries
```

### Type Consolidation Rule

If two files export the same interface name (e.g., `Project` in both `types.ts` and `projects.ts`), they must be compatible or consolidated. The canonical approach: define all shared types in `types.ts`, import them in domain-specific files.

**The consolidated `Project` type** (from Remediation 2):

```typescript
export interface Project {
  id: string;
  title: string;
  description: string;
  role: string;
  period: string;
  category: ProjectCategory;
  tech: readonly string[];    // NOT "tags"
  links: ProjectLink;         // NOT top-level "github"/"live"
  image?: string;             // Optional project screenshot
  featured?: boolean;
}

export interface ProjectLink {
  live?: string;
  repo?: string;              // NOT top-level "github"
}

export type ProjectCategory =
  | "full-stack" | "frontend" | "systems"
  | "research" | "tool" | "design" | "other";
```

**Field mapping gotchas** (from actual bugs found and fixed):
| Old Field | New Field | Where it was wrong |
|---|---|---|
| `tags: string[]` | `tech: readonly string[]` | `ProjectCard.tsx` used `project.tags` |
| `github: string` | `links.repo: string` | `ProjectCard.tsx` used `project.github` |
| `live: string` | `links.live: string` | `ProjectCard.tsx` used `project.live` |
| — | `image?: string` | New optional field for project screenshots |
| — | `featured?: boolean` | New optional field for featured projects |

**Re-export pattern**: `projects.ts` imports `Project` from `types.ts` and re-exports it, so consumers can import from either location:
```typescript
import type { Project } from "./types";
export type { Project, ProjectCategory, ProjectLink } from "./types";
```

### `SocialLink` Type

```typescript
export interface SocialLink {
  platform: string;   // NOT "label"
  url: string;        // NOT "href"
  icon?: string;
}
```

**Field mapping gotchas**: `MobileDrawer.tsx` originally used `link.href` and `link.label` — fixed to `link.url` and `link.platform`.

---

## Type Safety: noUncheckedIndexedAccess Deep Dive

### Why This Matters

`noUncheckedIndexedAccess: true` in `tsconfig.json` means array index access returns `T | undefined`, not `T`. This catches real bugs where runtime errors were possible. During Remediation 2, enabling this flag revealed 6+ actual defect sites.

### Common Patterns and Fixes

**1. Array element access in loops:**
```typescript
// WRONG — CHARS[index] might be undefined
const char = CHARS[Math.floor(Math.random() * CHARS.length)];

// CORRECT — provide fallback
const char = CHARS[Math.floor(Math.random() * CHARS.length)] ?? "0";
```

**2. Column/value access in canvas rendering:**
```typescript
// WRONG — columns[i] might be undefined
const y = columns[i] * FONT_SIZE;

// CORRECT — null coalesce
const colValue = columns[i] ?? 0;
const y = colValue * FONT_SIZE;
```

**3. IntersectionObserver callback destructuring:**
```typescript
// WRONG — ([entry]) assumes entries[0] exists
const observer = new IntersectionObserver(([entry]) => { ... });

// CORRECT — safe access
const observer = new IntersectionObserver((entries) => {
  const entry = entries[0];
  if (entry?.isIntersecting) {
    setIsVisible(true);
  }
});
```

**4. Focus management:**
```typescript
// WRONG — focusable[0] might be undefined
focusable[0].focus();

// CORRECT — optional chaining
focusable[0]?.focus();
```

**5. Command history access:**
```typescript
// WRONG — commandHistory[newIndex] might be undefined
setInput(commandHistory[newIndex]);

// CORRECT — null coalesce
setInput(commandHistory[newIndex] ?? "");
```

### Enabling noUncheckedIndexedAccess

Add to `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

After enabling, run `npx tsc --noEmit` and systematically fix every `Type 'T | undefined' is not assignable to type 'T'` error. The fixes are almost always `?.` or `??` — never type assertions (`as T`).

---

## Error Boundary Architecture

### Dual Error Boundary System

The project uses two complementary error boundary systems:

1. **Page-level: `react-error-boundary`** (in `page.tsx`) — wraps the entire `PortfolioApp`. Catches catastrophic failures. Uses the `FallbackComponent` pattern.

2. **Section-level: Custom class-based `ErrorBoundary`** (in `PortfolioApp.tsx`) — wraps each section individually. Isolates failures so one broken section doesn't take down the whole app.

### `react-error-boundary` v4 Type Change

**Critical gotcha**: In `react-error-boundary` v4, `FallbackProps.error` is typed as `unknown`, NOT `Error`. Custom fallback components must type it accordingly:

```typescript
// CORRECT — react-error-boundary v4
function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: unknown;
  resetErrorBoundary: () => void;
}) {
  const message = error instanceof Error ? error.message : "An unknown error occurred";
  // ...
}

// WRONG — TypeScript error in v4
function ErrorFallback({ error }: { error: Error }) {
  // Type 'unknown' is not assignable to type 'Error'
}
```

**Must install**: `npm install react-error-boundary` — this is a required dependency that was missing in the original package.json.

### Custom Section-Level ErrorBoundary

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
```

### Section Error Fallback

```tsx
function SectionError({ name }: { name: string }) {
  return (
    <div role="alert" style={{
      padding: "var(--spacing-grid)",
      border: "2px solid var(--color-error, #c0392b)",
      fontFamily: "var(--font-mono)",
      fontSize: "0.8125rem",
    }}>
      <p>Failed to load the {name} section.</p>
    </div>
  );
}
```

---

## Hash Routing Design

### `useRouteHash` Hook

The custom `useRouteHash` hook provides client-side SPA navigation within the Next.js App Router by reading and writing `window.location.hash`.

```typescript
export function useRouteHash(): [string, (section: string) => void] {
  const [activeSection, setActiveSectionState] = useState<string>(getHashFromWindow);

  const setActiveSection = useCallback((section: string) => {
    const valid = VALID_SECTIONS.includes(section as Section) ? section : "hero";
    window.location.hash = valid;
    setActiveSectionState(valid);
  }, []);

  useEffect(() => {
    function handleHashChange() {
      const hash = window.location.hash.replace("#", "");
      const valid = VALID_SECTIONS.includes(hash as Section) ? hash : "hero";
      setActiveSectionState(valid);
    }
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return [activeSection, setActiveSection];
}
```

**Critical: Returns a tuple, not an object.** Use array destructuring: `const [currentHash, navigateTo] = useRouteHash()`.

### VALID_SECTIONS Must Match Actual Section IDs

The `VALID_SECTIONS` array in `useRouteHash.ts` must exactly match the section IDs rendered in `PortfolioApp.tsx`. A mismatch breaks `aria-current` indicators and active link highlighting.

**Current known mismatch**: `VALID_SECTIONS` is `["hero","who","work","skills","music","now","contact"]` but actual section IDs are `["hero","about","projects","skills","experience","blog","terminal","contact"]`. Only `hero`, `skills`, and `contact` match.

**Fix**: Update `VALID_SECTIONS` to match the actual section IDs.

---

## Database as Optional Feature

### Graceful Degradation Pattern

The database connection is optional. The app must function fully without `DATABASE_URL`:

```typescript
// src/db/index.ts
function createDb() {
  if (!process.env.DATABASE_URL) return null;
  try {
    const client = postgres(process.env.DATABASE_URL);
    return drizzle(client, { schema });
  } catch {
    console.warn("Failed to connect to database. Features disabled.");
    return null;
  }
}
export const db = createDb();
```

### Null Guard in API Routes

Every API route that uses `db` must guard against null:

```typescript
export async function GET() {
  try {
    if (!db) {
      return Response.json({ ok: false, error: "Database not configured" }, { status: 503 });
    }
    await db.execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
```

### Drizzle Config: Use Environment Variables

Do NOT hardcode database credentials in `drizzle.config.json`. Replace `postgresql://postgres:postgres@127.0.0.1:5432/app_db` with `process.env.DATABASE_URL`.

---

## Accessibility (WCAG AAA)

### Skip-to-Content Link

Place exactly ONE skip-link in `layout.tsx` (Server Component). Do NOT duplicate it in the client orchestrator.

```tsx
<a className="skip-link" href="#main-content">Skip to main content</a>
```

Style it to be invisible until focused:
```css
.skip-link { position: absolute; top: -100%; left: 16px; z-index: var(--z-index-skip-link); }
.skip-link:focus { top: 16px; outline: 2px solid var(--color-accent); outline-offset: 2px; }
```

### Focus Styles

High-contrast focus rings for keyboard navigation:
```css
*:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
```

### Reduced Motion

Respect `prefers-reduced-motion` for all animations. Use the `useReducedMotion` hook:

```typescript
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true); // SSR-safe default
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mql.matches);
    function handleChange(e: MediaQueryListEvent) { setPrefersReducedMotion(e.matches); }
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);
  return prefersReducedMotion;
}
```

Also add a CSS fallback:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Screen Reader Utilities

Include a `.sr-only` class and use `aria-live` regions for dynamic announcements (theme changes, navigation).

### Section Landmarks

Every section must have an `aria-label`:
```tsx
<section id="projects" aria-label="Projects">
```

### AccessibilityProvider vs. useReducedMotion

The project has both an `AccessibilityProvider` (with a `useAccessibility()` context hook) and a standalone `useReducedMotion()` hook. Components that need reduced-motion checks currently use `useReducedMotion()` directly or inline `window.matchMedia`. For consistency, consume `useAccessibility()` instead — but this requires refactoring.

---

## Security Headers & Metadata

### Security Headers in next.config.ts

```typescript
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];
```

### OG/Twitter Metadata + JSON-LD

Add comprehensive metadata in `layout.tsx` including `openGraph`, `twitter` card, `robots`, and JSON-LD `Person` schema. This works even though `page.tsx` is a Client Component because metadata is exported from the Server Component `layout.tsx`.

---

## Build & Verification Pipeline

### Commands

| Command | Purpose | Must Pass |
|---|---|---|
| `npm run typecheck` | `tsc --noEmit` | Zero errors |
| `npm run build` | typecheck + `next build` | Zero errors |
| `npm run lint` | ESLint | Zero warnings |
| `npm run dev` | Development server (Turbopack) | — |

### Pre-Build Checklist

Before running `npm run build`, verify:
1. `package.json` versions exist on npm (`npm view <pkg> dist-tags`)
2. `globals.css` import order: `@import url()` before `@import "tailwindcss"`
3. No `optimizeFonts` in `next.config.ts` (removed in Next.js 16)
4. All `"use client"` directives are present where needed
5. `db` usage includes null guards
6. No unused imports (TS6133)
7. All `var(--*)` references in components have corresponding `@theme` definitions
8. `noUncheckedIndexedAccess` is enabled — all array index access uses `?.` or `??`
9. `react-error-boundary` is installed and `error` prop is typed as `unknown`
10. `useRouteHash` is destructured as a tuple, not an object

---

## Patterns

### Pattern: CSS Variable Naming Convention

Always use the `--color-` prefix for all color tokens in `@theme`:
- `--color-bg`, `--color-text-primary`, `--color-border`, `--color-accent`
- Day theme overrides in `[data-theme="day"]` selector

### Pattern: Lazy Section Loading

```tsx
const SectionComponent = lazy(() => import("@/components/SectionComponent"));
<section id="section" aria-label="Section">
  <ErrorBoundary fallback={<SectionError name="Section" />}>
    <Suspense fallback={<SectionSkeleton />}>
      <SectionComponent />
    </Suspense>
  </ErrorBoundary>
</section>
```

### Pattern: Optional Feature Guard

```typescript
if (!feature) { return gracefulFallback(); }
```

### Pattern: Accessibility-First Component Design

Every interactive component must:
1. Have an `aria-label` or associated `<label>`
2. Show visible focus indicators (`:focus-visible`)
3. Announce state changes to screen readers (`aria-live`)
4. Respect reduced motion preferences
5. Be keyboard-navigable

### Pattern: Section Skeleton for Loading State

```tsx
function SectionSkeleton() {
  return (
    <div aria-hidden="true" style={{ minHeight: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      Loading&hellip;
    </div>
  );
}
```

### Pattern: FOUC-Free Theme Initialization

Use `ThemeScript` component with `suppressHydrationWarning` to set theme before React hydration.

### Pattern: Type Re-Export for Consumer Convenience

Define types in `types.ts`, re-export from domain files:
```typescript
// types.ts — canonical definition
export interface Project { ... }

// projects.ts — re-export for convenience
import type { Project } from "./types";
export type { Project, ProjectCategory, ProjectLink } from "./types";
```

### Pattern: Safe Array Index Access

With `noUncheckedIndexedAccess: true`, always guard array index access:
```typescript
const item = arr[i] ?? defaultValue;   // null coalescing
const result = arr[i]?.method();       // optional chaining
```

---

## Anti-Patterns

### Anti-Pattern: Object Destructuring on Tuple-Returning Hooks

`useRouteHash` returns `[string, (section: string) => void]`. Using object destructuring (`const { currentHash, navigateTo } = useRouteHash()`) causes a runtime error — the tuple elements have no named properties. Always use array destructuring.

### Anti-Pattern: Mixed CSS Variable Naming Conventions

Do NOT use different naming conventions for the same concept:
- `--color-border` (canonical) vs `--border-color` (shorthand)
- `--color-text-primary` (canonical) vs `--text-primary` (shorthand)

### Anti-Pattern: Class-Based Theme Switching

Do NOT toggle themes by adding/removing CSS classes. Use `data-theme` attribute on `<html>`.

### Anti-Pattern: `optimizeFonts` in next.config.ts

This property was removed in Next.js 16. Font optimization is automatic.

### Anti-Pattern: `@import url()` After `@import "tailwindcss"`

The CSS optimizer will reject external font imports placed after the Tailwind import.

### Anti-Pattern: Unguarded Database Access

Do NOT assume `db` is always available. The database connection can be `null`.

### Anti-Pattern: Duplicate Skip-Links

Do NOT render skip-links in both `layout.tsx` and client components. One skip-link in `layout.tsx` is sufficient.

### Anti-Pattern: Duplicate Type Definitions

Do NOT export the same interface name from multiple files with different shapes. Consolidate into a single canonical definition in `types.ts`.

### Anti-Pattern: Generic Typography Choices

Do NOT use Inter, Roboto, or system-ui as the primary body font. Choose a distinctive typeface that reinforces the design identity.

### Anti-Pattern: Wrong Import Paths for Co-Located Files

`PortfolioApp.tsx` lives in `src/app/`, NOT `src/components/`. Import as `@/app/PortfolioApp`, not `@/components/PortfolioApp`. The App Router co-locates the orchestrator with the route.

### Anti-Pattern: Typing `react-error-boundary` Error Prop as `Error`

In v4, `FallbackProps.error` is `unknown`. Type it as `unknown` and use `instanceof Error` guard.

### Anti-Pattern: Importing from Dead Code Files

Do NOT import from `src/lib/data.ts`, `src/lib/content.ts`, `src/lib/utils.ts`, `src/lib/testimonials.ts`, or `src/lib/sounds.ts` — these are dead code with potentially stale or incorrect data.

### Anti-Pattern: Undefined CSS Variables in Components

Every `var(--something)` reference in a component MUST have a corresponding definition in `@theme`. Undefined variables silently resolve to `unset` with no error or warning.

---

## Troubleshooting Guide

### Build Errors

| Symptom | Root Cause | Fix |
|---|---|---|
| `npm install` fails with `ETARGET` | Package version doesn't exist on npm | Verify with `npm view <pkg> dist-tags`. Update to the latest available. |
| `optimizeFonts` not in `NextConfig` | Property removed in Next.js 16 | Remove from `next.config.ts` |
| `ssr: false` not allowed in Server Components | `page.tsx` was a Server Component | Add `"use client"` directive |
| CSS `@import url()` warning | Font import after `@import "tailwindcss"` | Move `@import url(...)` to the top of `globals.css` or use `<link>` in layout |
| `db is possibly null` (TS18047) | Database connection is optional | Add `if (!db) { return ... }` guard |
| Unused import (TS6133) | Variable declared but never read | Remove the unused import |
| `Property X does not exist on type [...]` | `noUncheckedIndexedAccess: true` | Use `?.` or `??` for array index access |
| `Type 'unknown' is not assignable to type 'Error'` | `react-error-boundary` v4 | Type as `error: unknown`, guard with `instanceof Error` |
| Cannot find module `react-error-boundary` | Not installed | `npm install react-error-boundary` |
| Cannot find module `@/components/PortfolioApp` | Wrong import path | Import from `@/app/PortfolioApp` |
| Object destructuring on useRouteHash returns undefined | Hook returns tuple, not object | Use `const [currentHash, navigateTo] = useRouteHash()` |
| `tags` does not exist on `Project` | Old field name | Use `tech` (consolidated type) |
| `github`/`live` does not exist on `Project` | Old field names | Use `links.repo`/`links.live` |
| `href`/`label` does not exist on `SocialLink` | Wrong field names | Use `url`/`platform` |

### Visual Issues

| Symptom | Root Cause | Fix |
|---|---|---|
| Component renders with wrong font | Missing `@theme` font family entry | Verify the font variable is in `@theme` |
| Theme toggle doesn't work | Using class-based switching | Change to `data-theme` attribute |
| Flash of wrong theme on load | Missing FOUC prevention script | Add `ThemeScript` to `layout.tsx` |
| CSS variables resolve to empty | Variable name mismatch or undefined | Check `globals.css` for exact variable name |
| Missing shadows on cards | `--shadow-brutal` not defined | Add to `@theme` block |
| Broken transitions | `--transition-fast` not defined | Add to `@theme` block |
| Active nav link not highlighted | `VALID_SECTIONS` doesn't match section IDs | Update to match actual section IDs |
| Z-index layering broken | Custom z-index tokens not defined | Add `--z-index-*` to `@theme` |

### Version Compatibility

| Package | Verified Working Version | Notes |
|---|---|---|
| `next` | 16.2.9 | `optimizeFonts` removed; `ssr: false` requires `"use client"` |
| `react` | 19.2.7 | Latest stable at time of writing |
| `react-dom` | 19.2.7 | Must match React version |
| `@types/react` | 19.2.17 | Latest available |
| `@types/react-dom` | 19.2.3 | Max available (NOT 19.2.6+) |
| `tailwindcss` | 4.1.17 | CSS-first config, `@import "tailwindcss"` |
| `drizzle-orm` | 0.45.2 | |
| `typescript` | 5.9.3 | Strict mode + noUncheckedIndexedAccess |
| `react-error-boundary` | 4.x | `FallbackProps.error` is `unknown` |

---

## Remediation Methodology

When applying a remediation (a batch of fixes from a code review or audit), follow this rigorous process:

### Step 1: Deep Reconnaissance

Read ALL documentation files before touching code:
- `CLAUDE.md`, `AGENTS.md`, `README.md` — project constraints and gotchas
- Any code review reports — identified issues and proposed fixes
- `status.md` — current project state and remediation history
- Existing SKILL files — architectural knowledge

### Step 2: Extract Files from Remediation Report

Remediation reports often embed file contents in markdown code blocks or heredoc-wrapped sections. Extract each file carefully:
- Use the LAST occurrence of each file path (later fixes supersede earlier ones)
- Verify the file path is correct relative to the project root
- Check that the content is complete (not truncated)
- For large remediation files (4000+ lines), use specialized subagents to extract all files systematically

### Step 3: Verify Package Versions

Before running `npm install`, verify every version in `package.json` against npm:
```bash
npm view <package> dist-tags
```

Remediation reports may specify versions that don't exist. Update to the nearest available version. This happened in real remediation: `@types/react-dom@^19.2.6` was specified but max available was 19.2.3.

### Step 4: Install Dependencies

```bash
npm install
```

Check for missing dependencies that the remediation introduces (e.g., `react-error-boundary` was missing and needed manual installation).

### Step 5: Typecheck First

```bash
npx tsc --noEmit
```

Fix all type errors before proceeding to build. Common categories:
- Wrong import paths (e.g., `@/components/PortfolioApp` → `@/app/PortfolioApp`)
- Tuple vs. object destructuring on hooks
- `noUncheckedIndexedAccess` violations (array index access without `?.` or `??`)
- Type mismatches from consolidated types (e.g., `tags` → `tech`, `github` → `links.repo`)
- `react-error-boundary` v4 `unknown` error type
- Missing type exports

### Step 6: Build and Fix

```bash
npm run build
```

Fix any build errors (CSS import order, Server/Client Component violations, etc.). Re-run until clean.

### Step 7: Full Codebase Audit

After remediation, perform a comprehensive audit:
- Check for stale references to removed/renamed files
- Verify ALL CSS variable references (`var(--*)`) in components resolve to `@theme` definitions
- Verify Tailwind class names are defined in `@theme`
- Check for duplicate type definitions across files
- Verify component integration status (active vs dormant)
- Verify `VALID_SECTIONS` matches actual section IDs
- Check for duplicate skip-links
- Verify theme target consistency (`<html>` vs `<body>`)
- Check for dead code that's never imported
- Verify all dependencies are in `package.json`

### Step 8: Update Documentation

Update README.md, CLAUDE.md, and AGENTS.md to reflect:
- New issues found and fixed
- Updated gotchas and troubleshooting tips
- Lessons learnt from this remediation cycle
- Outstanding issues and recommendations
- Updated component classification (active vs dormant)

### Remediation History

**Remediation 1** (initial Vite → Next.js port):
- Fixed non-existent npm package versions
- Removed `optimizeFonts` from `next.config.ts`
- Added `"use client"` to `page.tsx`
- Fixed CSS `@import` order in `globals.css`
- Added null guard for `db` in API route
- Removed unused imports

**Remediation 2** (type consolidation + strictness):
- Consolidated duplicate `Project` type into single canonical definition
- Added 6+ missing type exports to `types.ts`
- Enabled `noUncheckedIndexedAccess: true`, fixed 6+ array index access patterns
- Installed `react-error-boundary`, updated `FallbackProps.error` to `unknown`
- Fixed `useRouteHash` destructuring (tuple, not object)
- Fixed `page.tsx` import path (`@/app/PortfolioApp`, not `@/components/PortfolioApp`)
- Rewrote `ProjectCard.tsx` to use consolidated `Project` type fields
- Fixed `MobileDrawer.tsx` to use `SocialLink` type fields (`url`/`platform`)
- Added `@theme` tokens (fonts, z-index, animations)
- Added day-theme color overrides
- Added security headers and OG/Twitter metadata
- Added JSON-LD structured data

---

## Lessons Learnt

### 1. Verify npm Versions Before Pinning

Remediation specified `@types/react-dom@^19.2.6` which didn't exist (max was 19.2.3). Similarly, `react@^19.2.6` and `next@^16.2.6` were specified but didn't exist. Always verify with `npm view <pkg> dist-tags`. Just because a version number follows a logical sequence doesn't mean it was published.

### 2. CSS Import Order Is Critical in Tailwind v4

`@import "tailwindcss"` expands to `@layer` rules. External font imports (`@import url(...)`) must come before the Tailwind import, or the CSS optimizer will reject them.

### 3. `optimizeFonts` Is Gone in Next.js 16

This `next.config.ts` option no longer exists in the `NextConfig` type. Font optimization is automatic.

### 4. `ssr: false` Requires Client Components

In Next.js 16, `next/dynamic` with `ssr: false` cannot be used in Server Components. The build will fail.

### 5. Two Design Token Systems Create Technical Debt

Dormant components use shorthand CSS variable names (`--border-color`) while `@theme` uses `--color-` prefix (`--color-border`). Must reconcile before integration.

### 6. Null-Safe Database Access Is Mandatory

Since `DATABASE_URL` is optional, `db` can be `null`. Always guard.

### 7. `noUncheckedIndexedAccess` Catches Real Bugs

Array index access returning `T | undefined` revealed 6+ places where runtime errors were possible. Always use `?.` or `??`.

### 8. `react-error-boundary` v4 Changed `FallbackProps.error`

From `Error` to `unknown`. Must use `instanceof Error` guard.

### 9. File Location Matters for App Router Imports

`PortfolioApp.tsx` in `src/app/` must be imported as `@/app/PortfolioApp`, not `@/components/PortfolioApp`.

### 10. Undefined CSS Variables Fail Silently

`var(--font-display)` resolving to `unset` produces no error, no warning — the style just doesn't apply. Audit all `var()` references against `@theme` after any refactoring.

### 11. Hook Return Types Must Match Destructuring

A hook returning `[string, function]` (tuple) cannot be destructured with `{ currentHash, navigateTo }` (object pattern). This is an easy mistake when a hook's interface changes or documentation is ambiguous.

### 12. Type Consolidation Requires Consumer Updates

When you consolidate a type (e.g., `Project`), every file that consumes it must be updated to use the new field names. A type change in `types.ts` that isn't propagated to `ProjectCard.tsx`, `ProjectsSection.tsx`, etc. will cause type errors.

### 13. Remediation Reports May Introduce New Dependencies

`react-error-boundary` was used in `page.tsx` but was not listed in the original `package.json`. Always check for new imports after extracting files.

### 14. Hash Routing Section Names Must Match Actual IDs

If `VALID_SECTIONS` in `useRouteHash` doesn't match the section IDs rendered in the orchestrator, navigation breaks silently — no error, just broken `aria-current` and highlighting.

### 15. Theme Target Consistency Matters

Setting `data-theme` on different elements (`<html>` vs `<body>`) in different parts of the code means CSS selectors only match some of the time. Pick one target and use it everywhere.

### 16. Dead Code Creates Maintenance Confusion

~40% of the codebase (14 dormant components, 5 lib files, 2 hooks) is never imported. This makes it unclear which code is active, which CSS variables are needed, and which types are important. Regular dead code audits are essential.

### 17. Contact Info Must Be Centralized

Different files hardcoding different email addresses, GitHub URLs, and LinkedIn profiles creates inconsistency. Export from a single source (`src/lib/config.ts`) and import everywhere.

---

## Outstanding Issues & Recommendations

| Priority | Issue | Recommendation |
|---|---|---|
| 1 | 14 undefined CSS variables in active components | Add `--font-display`, `--spacing-half`, `--spacing-quarter`, `--spacing-double`, `--transition-fast`, `--shadow-brutal`, `--shadow-brutal-sm`, `--color-text-inverse`, `--color-border-subtle`, `--color-bg-sunken`, `--color-bg-elevated`, `--color-error`, `--color-accent-subtle` to `@theme` with day-theme overrides |
| 2 | Hash routing section names mismatch | Update `VALID_SECTIONS` to `["hero","about","projects","skills","experience","blog","terminal","contact"]` |
| 3 | Theme target inconsistency | Use `<html>` consistently for `data-theme` |
| 4 | Duplicate skip-link | Remove from `PortfolioApp.tsx`, keep in `layout.tsx` |
| 5 | Dead code (~40% of codebase) | Delete or integrate dormant components and unused lib/hook files |
| 6 | CSS variable naming mismatch for dormant components | If keeping any, add aliases or rewrite to `--color-` prefix |
| 7 | Missing portrait assets | Place webp images in `public/portraits/` |
| 8 | Centralize contact info | Export email/GitHub/LinkedIn from `src/lib/config.ts` |
| 9 | Hardcoded DB credentials in drizzle.config.json | Use `process.env.DATABASE_URL` |
| 10 | Contact form is simulated | Create `/api/contact` route or integrate third-party service |
| 11 | No SSR for SEO | Consider re-enabling SSR with `Suspense` boundaries |
| 12 | `useAccessibility()` hook never consumed | Replace scattered `window.matchMedia` checks with context hook |

---

## File Structure Reference

The canonical file structure for a project built with this skill:

```
project-root/
├── .env.example                    # Environment variable template
├── next.config.ts                  # Security headers, strict mode, poweredByHeader: false
├── package.json                    # Verified dependency versions
├── tsconfig.json                   # strict: true, noUncheckedIndexedAccess: true, @/ alias
├── drizzle.config.json             # DB config (use env vars!)
├── eslint.config.mjs
├── postcss.config.mjs
│
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Server Component: metadata, FOUC script, skip-link, JSON-LD
│   │   ├── page.tsx                # Client Component: dynamic import + react-error-boundary
│   │   ├── PortfolioApp.tsx        # Client Component: SPA orchestrator (IN src/app/, NOT src/components/)
│   │   ├── error.tsx               # Next.js error page
│   │   ├── not-found.tsx           # 404 page
│   │   ├── globals.css             # Design tokens, theme rules, utility classes
│   │   └── api/
│   │       └── health/route.ts     # DB health check (null-safe)
│   │
│   ├── components/
│   │   ├── Navigation.tsx          # Active (eager)
│   │   ├── HeroKinetic.tsx         # Active (eager)
│   │   ├── SectionBlock.tsx        # Active
│   │   ├── ErrorBoundary.tsx       # Active (class-based, per-section)
│   │   ├── AccessibilityProvider.tsx # Active
│   │   ├── ThemeScript.tsx         # Active (FOUC prevention)
│   │   ├── ThemeSwitch.tsx         # Active
│   │   ├── ScrollReveal.tsx        # Active
│   │   ├── BentoGrid.tsx           # Active (lazy)
│   │   ├── ProjectsSection.tsx     # Active (lazy)
│   │   ├── ProjectCard.tsx         # Active (used by ProjectsSection)
│   │   ├── SkillsSection.tsx       # Active (lazy)
│   │   ├── Timeline.tsx            # Active (lazy)
│   │   ├── ContactSection.tsx      # Active (lazy)
│   │   ├── BlogSection.tsx         # Active (lazy)
│   │   ├── Terminal.tsx            # Active (lazy)
│   │   ├── Footer.tsx              # Active (lazy)
│   │   └── ... (dormant components — see Component Architecture)
│   │
│   ├── hooks/
│   │   ├── useRouteHash.ts         # Hash-based routing (returns tuple!)
│   │   └── useReducedMotion.ts     # Prefers-reduced-motion detection
│   │
│   ├── lib/
│   │   ├── types.ts                # CANONICAL type definitions
│   │   ├── projects.ts             # Project data (re-exports from types.ts)
│   │   ├── skills.ts               # Skill data
│   │   └── timeline.ts             # Timeline data
│   │
│   └── db/
│       ├── index.ts                # Optional DB connection (null-safe)
│       └── schema.ts               # Drizzle schema
│
├── public/
│   ├── favicon.svg
│   └── portraits/                  # (add portrait assets here)
│
└── docs/                           # Project documentation
```

---

## Type Reference

### Core Types (defined in `src/lib/types.ts`)

```typescript
export interface NavLink {
  label: string;
  href: string;
}

export interface SocialLink {
  platform: string;    // NOT "label"
  url: string;         // NOT "href"
  icon?: string;
}

export interface SiteConfig {
  name: string;
  title: string;
  email: string;
  github: string;
  githubUrl: string;
  linkedin: string;
  linkedinUrl: string;
  location: string;
}

export interface ProjectLink {
  live?: string;
  repo?: string;       // NOT top-level "github"
}

export type ProjectCategory =
  | "full-stack" | "frontend" | "systems"
  | "research" | "tool" | "design" | "other";

export interface Project {
  id: string;
  title: string;
  description: string;
  role: string;
  period: string;
  category: ProjectCategory;
  tech: readonly string[];  // NOT "tags"
  links: ProjectLink;
  image?: string;
  featured?: boolean;
}
```

### Dormant Types (defined in `src/lib/types.ts`, only used by dormant components)

```typescript
export interface AboutPillar {
  title: string;
  paragraphs: readonly string[];
}

export interface ParsedCollectionItem {
  slug: string;
  title: string;
  description: string;
  category: string;
  status: string;
  medium?: string;
  image?: string;
  body?: string;
  document?: string;
  link?: string;
  linkLabel?: string;
  accent: string;
}

export interface Collection {
  slug: string;
  title: string;
  description: string;
  accent: string;
}

export interface ParsedPortfolioItem {
  slug: string;
  title: string;
  description: string;
  category: string;
  accent: string;
  status: string;
  image?: string;
  medium?: string;
  body?: string;
  link?: string;
  linkLabel?: string;
}

export interface MachineOverlayData {
  buildVersion: string;
  route: string;
  collections: Record<string, number>;
  activeData: unknown;
}

export type SocialIconVariant = "mail" | "linkedin" | "instagram" | "github";
```

---

## Critical "Never" List

- **Never** use `border-radius` (unless explicitly requested for a specific non-UI element)
- **Never** use `any` in TypeScript
- **Never** use Vite-specific features like `import.meta.glob`
- **Never** add speculative "AI slop" or safe defaults (e.g., rounded cards, Inter-only typography)
- **Never** add `optimizeFonts` to `next.config.ts` (removed in Next.js 16)
- **Never** put `@import url()` after `@import "tailwindcss"` in `globals.css`
- **Never** use class-based theme switching (`theme-night` / `theme-day`). Use `data-theme` attribute
- **Never** use `db` from `@/db` without a null guard
- **Never** access array indices without `?.` or `??` (enforced by `noUncheckedIndexedAccess`)
- **Never** import `PortfolioApp` from `@/components/PortfolioApp` — it's at `@/app/PortfolioApp`
- **Never** type `react-error-boundary` fallback `error` prop as `Error` — it's `unknown`
- **Never** import data from `@/lib/data` — it's dead code with stale section names
- **Never** use object destructuring on `useRouteHash()` — it returns a tuple
- **Never** reference CSS variables that aren't defined in `@theme` — they silently resolve to `unset`
