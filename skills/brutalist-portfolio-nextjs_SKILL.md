---
name: brutalist-portfolio-nextjs
description: >
  Build an avant-garde, anti-generic personal portfolio using Next.js 16 App Router with
  a Tactile Brutalism + High-End Editorial design system. Covers the full architectural
  lifecycle: design system with CSS-first tokens, client-side SPA orchestrator inside
  Next.js, hash-based routing, dual-theme system with FOUC prevention, lazy-loaded sections
  with ErrorBoundary + Suspense, optional database with graceful null handling, and
  WCAG AAA accessibility. Use this skill whenever building or porting a portfolio, personal
  site, creative showcase, or any web project that demands distinctive brutalist/editorial
  aesthetics with Next.js. Also use when remediation, type-safety auditing, or CSS variable
  reconciliation is needed on an existing Next.js project. Triggers on: portfolio, personal
  site, brutalist design, editorial design, Next.js port, SPA orchestrator, hash routing,
  dual theme, anti-generic design, design system tokens, CSS variable strategy.
---

# Brutalist Portfolio — Next.js 16 Architectural Blueprint

This skill distills the complete architectural knowledge, design system, phased workflow, patterns, anti-patterns, and hard-won troubleshooting insights from building "The Engineered Soul" — a personal portfolio ported from a Vite SPA to Next.js 16 App Router with Tactile Brutalism aesthetics.

Any agent using this skill can reproduce a similar codebase or apply the same architectural decisions to a new project.

---

## Table of Contents

1. [Six-Phase Workflow](#six-phase-workflow)
2. [Architecture Blueprint](#architecture-blueprint)
3. [Design System: Tactile Brutalism + High-End Editorial](#design-system-tactile-brutalism--high-end-editorial)
4. [CSS Strategy for Tailwind v4](#css-strategy-for-tailwind-v4)
5. [Theme System Design](#theme-system-design)
6. [Component Architecture](#component-architecture)
7. [Data & Content Strategy](#data--content-strategy)
8. [Database as Optional Feature](#database-as-optional-feature)
9. [Accessibility (WCAG AAA)](#accessibility-wcag-aaa)
10. [Security Headers](#security-headers)
11. [Build & Verification Pipeline](#build--verification-pipeline)
12. [Patterns](#patterns)
13. [Anti-Patterns](#anti-patterns)
14. [Troubleshooting Guide](#troubleshooting-guide)
15. [Remediation Process](#remediation-process)
16. [Lessons Learnt](#lessons-learnt)
17. [Outstanding Issues & Recommendations](#outstanding-issues--recommendations)
18. [File Structure Reference](#file-structure-reference)

---

## Six-Phase Workflow

Every task follows this disciplined sequence. Skipping phases introduces defects.

### Phase 1: ANALYZE — Deep Requirement Mining

- Never make surface-level assumptions. Identify explicit requirements, implicit needs, and ambiguities.
- Research existing codebases, documentation, and relevant resources before proposing solutions.
- Explore multiple approaches, evaluating technical feasibility, alignment with project goals, and long-term implications.
- Perform risk assessment: identify dependencies, challenges, and mitigation strategies.
- **For a new project**: Audit the source project (if porting), catalog every component, interaction, and design token. Identify what must be preserved and what can evolve.

### Phase 2: PLAN — Structured Execution Roadmap

- Create a detailed plan with sequential phases, clear objectives, integrated checklists, success criteria, and validation checkpoints.
- Present the plan for explicit user confirmation before writing any code.
- Include estimated effort for each phase.
- **For a port**: Map every source component to its target implementation. Identify which components need redesign vs. faithful port.

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

### Phase 5: VERIFY — Rigorous QA

- Run typecheck (`tsc --noEmit`) — zero errors required.
- Run production build (`next build`) — zero errors required.
- Run lint (`next lint`) — zero warnings required.
- Review for accessibility (skip links, focus-visible, reduced motion, ARIA).
- Consider edge cases: missing environment variables, null database connections, empty data arrays.
- Verify visual fidelity against the design system.

### Phase 6: DELIVER — Complete Handoff

- Provide clear usage instructions.
- Document challenges encountered and solutions implemented.
- Classify components as "active" (wired into the app) vs. "dormant" (exist but not integrated).
- Update all documentation (README.md, CLAUDE.md, AGENTS.md) to reflect the current state.
- List outstanding issues and recommendations for future work.

---

## Architecture Blueprint

### Core Architectural Decision: Client-Side SPA Orchestrator inside Next.js

The portfolio uses a **Client-Side SPA Orchestrator** pattern embedded within the Next.js App Router. This preserves complex animations, hash-based routing, and kinetic interactions from the original Vite SPA while gaining Next.js benefits (metadata API, code splitting via Turbopack).

**Why this pattern**: A pure Server Component approach would lose the hash-based routing and interactive state management that makes the portfolio feel like a "digital installation." The orchestrator pattern gives you both worlds.

### Architectural Layers

```
layout.tsx (Server Component)
  └── metadata, viewport, FOUC prevention script, skip-link, <body>
      └── page.tsx (Client Component — "use client")
          └── dynamic import with ssr: false
              └── PortfolioApp.tsx (Client Component — orchestrator)
                  ├── Navigation (eager)
                  ├── HeroKinetic (eager — above fold)
                  ├── Sections (lazy via React.lazy + Suspense)
                  │   ├── BentoGrid
                  │   ├── ProjectsSection
                  │   ├── SkillsSection
                  │   ├── Timeline
                  │   ├── BlogSection
                  │   ├── Terminal
                  │   └── ContactSection
                  └── Footer (lazy)
```

### Key Architectural Rules

1. **`layout.tsx` is a Server Component** — exports `metadata` and `viewport`, contains the FOUC-prevention script, renders the skip-link.
2. **`page.tsx` is a Client Component** — required because it uses `next/dynamic` with `ssr: false`. This is a deliberate trade-off: no SSR for the page content, but metadata from `layout.tsx` still works for SEO.
3. **`PortfolioApp.tsx` is the orchestrator** — manages theme state, hash routing, and section composition. All sections are wrapped in `ErrorBoundary` + `Suspense`.
4. **Above-the-fold content is eager** — `Navigation` and `HeroKinetic` are imported directly (not lazy).
5. **Below-the-fold sections are lazy** — uses `React.lazy()` + `Suspense` for code splitting.

### Hash-Based Routing

The portfolio uses `useRouteHash` — a custom hook that reads and writes `window.location.hash` for client-side navigation (e.g., `#hero`, `#projects`, `#contact`). This preserves the SPA feel while living inside Next.js.

```typescript
// The hook provides:
interface UseRouteHashReturn {
  readonly currentHash: string;
  readonly navigateTo: (hash: string) => void;
}
```

The hook also handles accessibility: when navigating to a section, it sets `tabindex="-1"` on the target and focuses it, enabling screen reader users to follow navigation.

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

All spacing is governed by a 28px unit. This creates a visible structural rhythm that reinforces the brutalist aesthetic. Define the grid as CSS custom properties:

```css
@theme {
  --spacing-grid: 28px;
  --spacing-half: 14px;
  --spacing-quarter: 7px;
  --spacing-double: 56px;
  --spacing-triple: 84px;
  --spacing-quad: 112px;
}
```

### Typography Hierarchy — Three Voices

Every font choice serves a distinct role. Do not use Inter or Roboto as the body font — that is the "safe default" this design rejects.

| Role | Font | CSS Variable | Purpose |
|---|---|---|---|
| **Editorial** | Cormorant Garamond | `--font-display` | Headings, narrative, hero text |
| **Body** | DM Sans | `--font-body` | General content, paragraphs |
| **Utility** | IBM Plex Mono | `--font-mono` | Labels, stats, Machine Mode, terminal |

**Why DM Sans instead of Inter**: Inter is the default system-ui stand-in used by every startup landing page. DM Sans provides similar readability with a distinctive geometric character that breaks the "AI slop" pattern.

### Brutalist Enforcement

Zero border-radius is non-negotiable. Enforce it globally:

```css
@theme {
  --radius-none: 0px;
}
```

And in the base reset:
```css
* {
  border-radius: 0 !important;
}
```

### Color System: Dual Theme with `--color-` Prefix Convention

Define all design tokens with the `--color-` prefix in the `@theme` block. This convention must be consistent across the entire codebase — mixing naming conventions creates a maintenance nightmare (see Lessons Learnt).

```css
@theme {
  /* Day theme (default) — warm cream palette */
  --color-bg: #f5f0e8;
  --color-text-primary: #1a1a1a;
  --color-accent: #c0392b;
  --color-border: #2d2d2d;

  /* Night theme — stored as separate variables */
  --color-night-bg: #0d0d0d;
  --color-night-text-primary: #f0ece4;
  --color-night-accent: #e8c547;
  --color-night-border: #f5f0e8;
}
```

**Critical**: Use `--color-` prefix consistently. Do NOT introduce shorthand variants like `--border-color`, `--text-primary`, or `--bg-surface`. If components need different names, define alias variables in `globals.css` rather than creating a parallel naming system.

### Shadows: Brutal Offsets

Shadows are hard-edged offsets (no blur), reinforcing the brutalist aesthetic:

```css
@theme {
  --shadow-brutal: 4px 4px 0px 0px var(--color-border);
  --shadow-brutal-sm: 2px 2px 0px 0px var(--color-border);
  --shadow-brutal-lg: 6px 6px 0px 0px var(--color-border);
}
```

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

### Design Tokens in `@theme`, Not `tailwind.config`

Tailwind v4 uses CSS-first configuration. Define all tokens in the `@theme` block of `globals.css`:

```css
@theme {
  --font-display: "Cormorant Garamond", Georgia, serif;
  --font-body: "DM Sans", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", monospace;
  --color-bg: #f5f0e8;
  --spacing-grid: 28px;
}
```

These become available as Tailwind utilities automatically: `font-display`, `bg-bg`, `p-grid`, etc.

### Custom Tailwind Utility Classes

If components need custom utility classes (e.g., `font-utility`, `font-editorial`, `z-grain`), they MUST be defined in the `@theme` block. Undefined classes silently fail — the element renders with browser defaults.

Required z-index layers for layered overlays:
```css
@theme {
  --z-grain: 10;
  --z-machine: 20;
  --z-mobile-backdrop: 30;
  --z-mobile-drawer: 40;
}
```

Font family aliases (if needed for backward compatibility):
```css
@theme {
  --font-editorial: var(--font-display);
  --font-utility: var(--font-mono);
}
```

### Custom Utility Classes in globals.css

Define reusable utility classes after the `@theme` block:

```css
.brutal-border { border: 2px solid var(--color-border); }
.brutal-shadow { box-shadow: var(--shadow-brutal); }
.brutal-hover { transition: box-shadow var(--transition-fast), transform var(--transition-fast); }
.brutal-hover:hover { box-shadow: var(--shadow-brutal-hover); transform: translate(-2px, -2px); }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border-width: 0; }
.skip-link { position: absolute; top: -100%; left: var(--spacing-half); z-index: 9999; ... }
.skip-link:focus { top: var(--spacing-half); }
```

---

## Theme System Design

### Architecture: `data-theme` Attribute on `<body>`

The theme system uses a `data-theme` attribute on the `<body>` element, toggled between `"day"` (default) and `"night"`. CSS selectors target `body[data-theme="night"]`.

**Do NOT use class-based theme switching** (`theme-night` / `theme-day` on `<html>`). The `data-attribute` approach is more semantic, works with FOUC prevention, and avoids class name collisions.

### FOUC Prevention Script

Place an inline `<script>` in `layout.tsx`'s `<head>` that reads `localStorage` and sets `data-theme` before the first paint. This prevents the flash of wrong-theme content:

```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `
      (function() {
        try {
          var theme = localStorage.getItem('theme');
          if (theme === 'night') {
            document.documentElement.setAttribute('data-theme', 'night');
            document.body && document.body.setAttribute('data-theme', 'night');
          } else if (!theme) {
            var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
              document.documentElement.setAttribute('data-theme', 'night');
              document.body && document.body.setAttribute('data-theme', 'night');
            }
          }
        } catch(e) {}
      })();
    `,
  }}
/>
```

**Why set both `documentElement` and `body`**: The FOUC script runs before React hydration, when `<body>` may not exist yet. Setting on `documentElement` covers the interim. CSS rules should target `body[data-theme="night"]` for specificity.

### Theme Change Handler

In the orchestrator component, handle theme changes with accessibility announcements:

```tsx
const handleThemeChange = useCallback((theme: "day" | "night") => {
  document.body.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);

  // Announce to screen readers
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

### CSS Theme Rules Pattern

Define day theme as the default on `body`, then override for night:

```css
body { background-color: var(--color-bg); color: var(--color-text-primary); }
body[data-theme="night"] { background-color: var(--color-night-bg); color: var(--color-night-text-primary); }
```

Repeat for every themed element: links, scrollbars, borders, shadows, focus rings.

---

## Component Architecture

### Active vs. Dormant Classification

Components fall into two categories. Track this explicitly in documentation:

**Active** — wired into `PortfolioApp.tsx`, rendered in the application:
- `Navigation`, `HeroKinetic`, `SectionBlock`, `ErrorBoundary`, `AccessibilityProvider`
- `BentoGrid`, `ProjectsSection`, `SkillsSection`, `Timeline`, `BlogSection`, `Terminal`, `ContactSection`
- `Footer`, `ThemeSwitch`, `ScrollReveal`

**Dormant** — exist in `src/components/` but not imported by the orchestrator:
- `AboutFlow`, `ArchiveSpread`, `ArchiveItemCard`, `BentoTile`, `BrandMark`, `ClientOnly`, `CodeRain`, `ContentBody`, `DitherOverlay`, `GrainOverlay`, `LayoutShell`, `MachineOverlay`, `MobileDrawer`, `SocialIcon`, `ThemeToggle`

**Why dormant components exist**: They may be from an earlier iteration, or planned for future integration. They must not be deleted without confirmation, but they must also not be assumed to work (they may reference undefined CSS variables or Tailwind classes).

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

### ErrorBoundary Component

Create a class-based ErrorBoundary (React requires class components for error boundaries):

```tsx
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
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
```

---

## Data & Content Strategy

### Static TypeScript Data

Content is managed as static TypeScript data, not fetched from a CMS or database. This ensures:
- Type safety at build time
- Zero network requests for content
- Instant page loads
- Easy version control of content changes

Organize data files by domain:

```
src/lib/
  ├── content.ts      — Site-wide content (headings, descriptions)
  ├── projects.ts     — Project entries
  ├── skills.ts       — Skill categories and items
  ├── timeline.ts     — Career timeline entries
  ├── testimonials.ts — Testimonial quotes
  ├── types.ts        — Shared TypeScript interfaces
  ├── utils.ts        — Utility functions (cn, formatDate, slugify, debounce)
  └── data.ts         — Legacy data (hero slides, social links, portrait maps)
```

### Type Consolidation Rule

If two files export the same interface name (e.g., `Project` in both `types.ts` and `projects.ts`), they must be compatible or one must be renamed. Duplicate types with different shapes create confusion and type errors.

The canonical approach: define all shared types in `types.ts`, import them in domain-specific files. Do not re-export incompatible versions.

---

## Database as Optional Feature

### Graceful Degradation Pattern

The database connection is optional. The app must function fully without `DATABASE_URL`. Implement this pattern:

```typescript
// src/db/index.ts
function createDb() {
  if (!process.env.DATABASE_URL) {
    return null;
  }
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

Do NOT hardcode database credentials in `drizzle.config.json`:

```json
{
  "dialect": "postgresql",
  "url": "postgresql://postgres:postgres@127.0.0.1:5432/app_db"  // WRONG
}
```

Instead, reference `process.env.DATABASE_URL` or `.env` variables.

---

## Accessibility (WCAG AAA)

### Skip-to-Content Link

Place exactly ONE skip-link in `layout.tsx` (Server Component). Do NOT duplicate it in the client orchestrator.

```tsx
<a href="#main-content" className="skip-link">Skip to main content</a>
```

Style it to be invisible until focused:
```css
.skip-link { position: absolute; top: -100%; }
.skip-link:focus { top: var(--spacing-half); outline: 3px solid var(--color-focus-ring); }
```

### Focus Styles

High-contrast focus rings for keyboard navigation:
```css
:focus-visible { outline: 3px solid var(--color-focus-ring); outline-offset: 2px; }
:focus:not(:focus-visible) { outline: none; }  /* Remove for mouse users */
```

### Reduced Motion

Respect `prefers-reduced-motion` for all animations:
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

---

## Security Headers

Define security headers in `next.config.ts`:

```typescript
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];
```

---

## Build & Verification Pipeline

### Commands

| Command | Purpose | Must Pass |
|---|---|---|
| `npm run typecheck` | `tsc --noEmit` | Zero errors |
| `npm run build` | typecheck + `next build` | Zero errors |
| `npm run lint` | ESLint | Zero warnings |

### Pre-Build Checklist

Before running `npm run build`, verify:
1. `package.json` versions exist on npm (`npm view <pkg> dist-tags`)
2. `globals.css` import order: `@import url()` before `@import "tailwindcss"`
3. No `optimizeFonts` in `next.config.ts` (removed in Next.js 16)
4. All `"use client"` directives are present where needed (any file using `next/dynamic` with `ssr: false`, React hooks, or browser APIs)
5. `db` usage includes null guards
6. No unused imports (TS6133)

---

## Patterns

### Pattern: CSS Variable Naming Convention

Always use the `--color-` prefix for all color tokens in `@theme`:
- `--color-bg`, `--color-text-primary`, `--color-border`, `--color-accent`
- Night variants: `--color-night-bg`, `--color-night-text-primary`

This makes theme switching systematic: swap from `var(--color-X)` to `var(--color-night-X)`.

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
// Database, external services, or any feature that may not be configured
if (!feature) {
  return gracefulFallback();
}
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

```tsx
// In layout.tsx <head> — runs before React hydration
<script dangerouslySetInnerHTML={{
  __html: `(function(){ try { var t = localStorage.getItem('theme'); if(t==='night') { document.documentElement.setAttribute('data-theme','night'); document.body&&document.body.setAttribute('data-theme','night'); } } catch(e){} })();`
}} />
```

---

## Anti-Patterns

### Anti-Pattern: Mixed CSS Variable Naming Conventions

**DO NOT** use different naming conventions for the same concept:
- `--color-border` (canonical) vs `--border-color` (shorthand)
- `--color-text-primary` (canonical) vs `--text-primary` (shorthand)
- `--color-bg` (canonical) vs `--bg-primary` (shorthand)

When dormant components use a different convention, either:
1. Define alias variables in `globals.css` (quick fix)
2. Rewrite the component to use the canonical convention (proper fix)

### Anti-Pattern: Class-Based Theme Switching

**DO NOT** toggle themes by adding/removing CSS classes on `<html>`:
```tsx
// WRONG
document.documentElement.classList.add('theme-night');
```

Use `data-theme` attribute on `<body>`:
```tsx
// CORRECT
document.body.setAttribute('data-theme', 'night');
```

### Anti-Pattern: `optimizeFonts` in next.config.ts

**DO NOT** add `optimizeFonts: true` to `next.config.ts`. This property was removed in Next.js 16. Font optimization is now automatic.

### Anti-Pattern: `@import url()` After `@import "tailwindcss"`

**DO NOT** place external font imports after the Tailwind import in `globals.css`. The CSS optimizer will reject them.

### Anti-Pattern: Unguarded Database Access

**DO NOT** assume `db` is always available. The database connection can be `null` when `DATABASE_URL` is not set.

### Anti-Pattern: Duplicate Skip-Links

**DO NOT** render skip-links in both `layout.tsx` and client components. One skip-link in `layout.tsx` (Server Component) is sufficient and more reliable.

### Anti-Pattern: Duplicate Type Definitions

**DO NOT** export the same interface name from multiple files with different shapes. If `Project` exists in `types.ts` and `projects.ts` with incompatible fields, rename one or consolidate.

### Anti-Pattern: Generic Typography Choices

**DO NOT** use Inter, Roboto, or system-ui as the primary body font. Choose a distinctive typeface that reinforces the design identity. DM Sans is the body font in this system — similar readability to Inter, but with character.

---

## Troubleshooting Guide

### Build Errors

| Symptom | Root Cause | Fix |
|---|---|---|
| `npm install` fails with `ETARGET` | Package version doesn't exist on npm | Verify with `npm view <pkg> dist-tags`. Update `package.json` to the latest available version. |
| `optimizeFonts` not in `NextConfig` | Property removed in Next.js 16 | Remove from `next.config.ts` |
| `ssr: false` not allowed in Server Components | `page.tsx` was a Server Component using `next/dynamic` with `ssr: false` | Add `"use client"` directive to `page.tsx` |
| CSS `@import url()` warning | Font import comes after `@import "tailwindcss"` | Move `@import url(...)` to the top of `globals.css`, before `@import "tailwindcss"` |
| `db is possibly null` (TS18047) | Database connection is optional | Add `if (!db) { return ... }` guard |
| Unused import (TS6133) | Variable declared but never read | Remove the unused import |
| `font-utility` class has no effect | Custom Tailwind class not defined in `@theme` | Add `--font-utility` to the `@theme` block |

### Visual Issues

| Symptom | Root Cause | Fix |
|---|---|---|
| Component renders with wrong font | Missing `@theme` font family entry, or class name typo | Verify the font variable is in `@theme` and the class name matches |
| Theme toggle doesn't work | Using class-based switching instead of `data-theme` attribute | Change to `document.body.setAttribute('data-theme', theme)` |
| Flash of wrong theme on load | Missing FOUC prevention script in `layout.tsx` | Add the inline script to `<head>` |
| CSS variables resolve to empty | Variable name mismatch (shorthand vs `--color-` prefix) | Check `globals.css` for the exact variable name |
| Z-index layering broken | Custom z-index tokens not defined in `@theme` | Add `--z-grain`, `--z-machine`, etc. to `@theme` |
| Focus ring invisible on night theme | Only day-theme focus ring defined | Add `body[data-theme="night"] :focus-visible` rule |

### Version Compatibility

| Package | Verified Working Version | Notes |
|---|---|---|
| `next` | 16.2.9 | `optimizeFonts` removed; `ssr: false` requires `"use client"` |
| `react` | 19.2.7 | Latest stable |
| `react-dom` | 19.2.7 | Must match React version |
| `@types/react` | 19.2.17 | Latest available |
| `@types/react-dom` | 19.2.3 | Latest available (NOT 19.2.6+) |
| `tailwindcss` | 4.1.17 | CSS-first config, `@import "tailwindcss"` |
| `drizzle-orm` | 0.45.2 | |
| `typescript` | 5.9.3 | Strict mode |

---

## Remediation Process

When applying a remediation (a batch of fixes from a code review or audit), follow this process:

### Step 1: Extract Files from Remediation Report

Remediation reports often embed file contents in markdown code blocks. Extract each file's content carefully:
- Use the LAST occurrence of each file path (later fixes supersede earlier ones)
- Verify the file path is correct relative to the project root
- Check that the content is complete (not truncated)

### Step 2: Verify Package Versions

Before running `npm install`, verify every version in `package.json` against npm:
```bash
npm view <package> dist-tags
```

Remediation reports may specify versions that don't exist. Update to the nearest available version.

### Step 3: Apply Files, Then Typecheck

1. Write all extracted files to their paths
2. Run `npm install`
3. Run `npx tsc --noEmit` — fix all type errors before proceeding to build

### Step 4: Build and Fix

1. Run `npm run build`
2. Fix any build errors (CSS import order, Server/Client Component violations, etc.)
3. Re-run until clean

### Step 5: Audit for New Issues

After remediation, perform a full codebase audit:
- Check for stale references to removed/renamed files
- Verify CSS variable references resolve
- Verify Tailwind class names are defined
- Check for duplicate type definitions
- Verify component integration status (active vs dormant)

---

## Lessons Learnt

### 1. Verify npm Versions Before Pinning

The remediation specified `@types/react-dom@^19.2.6` which didn't exist on npm (max was 19.2.3). Similarly, `react@^19.2.6` and `next@^16.2.6` were specified but didn't exist. Always verify with `npm view <pkg> dist-tags` before updating `package.json`. Just because a version number follows a logical sequence doesn't mean it was published.

### 2. CSS Import Order Is Critical in Tailwind v4

`@import "tailwindcss"` expands to `@layer` rules. The CSS specification requires `@import` rules to precede all other rules except `@charset` and `@layer` statements. External font imports (`@import url(...)`) must come before the Tailwind import, or the CSS optimizer will reject them with a warning and the fonts will fail to load.

### 3. `optimizeFonts` Is Gone in Next.js 16

This `next.config.ts` option no longer exists in the `NextConfig` type. Font optimization is now handled automatically by Next.js. Including it causes a TypeScript error.

### 4. `ssr: false` Requires Client Components

In Next.js 16, `next/dynamic` with `ssr: false` cannot be used in Server Components. The build will fail with a clear error. The page must have the `"use client"` directive.

### 5. Two Design Token Systems Create Technical Debt

The remediation introduced CSS variables using a shorthand naming convention (`--border-color`, `--text-primary`) that differs from the `@theme` block's `--color-` prefix convention (`--color-border`, `--color-text-primary`). Dormant components use the shorthand, active components use the prefix. This must be reconciled before dormant components can be integrated. Choose one convention and stick with it.

### 6. Null-Safe Database Access Is Mandatory

Since `DATABASE_URL` is optional, `db` can be `null`. Any API route using `db` must include a null guard. The health endpoint should return 503 when the database is unavailable.

### 7. Duplicate Skip-Links Cause Accessibility Confusion

Having skip-links in both `layout.tsx` (Server Component) and the client orchestrator results in two skip-links in the DOM. Screen reader users encounter both, which is confusing. Keep the skip-link in `layout.tsx` only — it's server-rendered and always present.

### 8. Duplicate Type Definitions Create Hidden Bugs

Two incompatible `Project` interfaces in different files mean code that imports the wrong one gets incorrect type information. Consolidate into a single canonical definition in `types.ts`.

### 9. Contact Info Must Be Consistent

Different files using different email addresses (`nicholas@example.com` vs `hello@nicholasyun.com`) and GitHub URLs (`nicholasyun` vs `nordeim`) creates confusion. Standardize across all files.

### 10. Hardcoded Credentials in Config Files Are a Security Risk

`drizzle.config.json` with `postgresql://postgres:postgres@127.0.0.1:5432/app_db` should use environment variables. This is a common oversight in configuration files.

---

## Outstanding Issues & Recommendations

When evaluating the current state of a project built with this skill, check for these known issues:

| Priority | Issue | Recommendation |
|---|---|---|
| 1 | CSS variable naming mismatch between active and dormant components | Define alias variables or rewrite dormant components to use `--color-` prefix |
| 2 | Missing Tailwind utility tokens (`font-utility`, `z-grain`, etc.) | Add to `@theme` block in `globals.css` |
| 3 | Duplicate `Project` type | Consolidate into single definition in `types.ts` |
| 4 | Dormant components (10+ files) | Either integrate with CSS fixes or remove to reduce confusion |
| 5 | Duplicate skip-link | Remove from client orchestrator, keep in `layout.tsx` |
| 6 | Missing portrait assets | Add images to `public/portraits/` or remove references |
| 7 | Inconsistent contact info | Standardize email and GitHub URLs |
| 8 | Hardcoded DB credentials | Use environment variable in `drizzle.config.json` |
| 9 | Contact form is simulated | Create `/api/contact` route or integrate third-party service |
| 10 | No SSR for SEO | Consider re-enabling SSR with `Suspense` boundaries |

---

## File Structure Reference

The canonical file structure for a project built with this skill:

```
project-root/
├── .env.example                    # Environment variable template
├── next.config.ts                  # Security headers, strict mode
├── package.json                    # Verified dependency versions
├── tsconfig.json                   # Strict mode, @/ alias
├── drizzle.config.json             # DB config (use env vars)
├── eslint.config.mjs
├── postcss.config.mjs
│
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Server Component: metadata, FOUC script, skip-link
│   │   ├── page.tsx                # Client Component: dynamic import with ssr: false
│   │   ├── PortfolioApp.tsx        # Client Component: SPA orchestrator
│   │   ├── error.tsx               # Error page
│   │   ├── not-found.tsx           # 404 page
│   │   ├── globals.css             # Design tokens, theme rules, utility classes
│   │   └── api/
│   │       └── health/route.ts     # DB health check (null-safe)
│   │
│   ├── components/
│   │   ├── Navigation.tsx          # Active
│   │   ├── HeroKinetic.tsx         # Active (eager load)
│   │   ├── SectionBlock.tsx        # Active
│   │   ├── ErrorBoundary.tsx       # Active
│   │   ├── AccessibilityProvider.tsx # Active
│   │   ├── BentoGrid.tsx           # Active (lazy)
│   │   ├── ProjectsSection.tsx     # Active (lazy)
│   │   ├── ProjectCard.tsx         # Used by ProjectsSection
│   │   ├── SkillsSection.tsx       # Active (lazy)
│   │   ├── Timeline.tsx            # Active (lazy)
│   │   ├── ContactSection.tsx      # Active (lazy)
│   │   ├── BlogSection.tsx         # Active (lazy)
│   │   ├── Terminal.tsx            # Active (lazy)
│   │   ├── ThemeSwitch.tsx         # Active
│   │   ├── ScrollReveal.tsx        # Active
│   │   ├── Footer.tsx              # Active (lazy)
│   │   └── ... (dormant components)
│   │
│   ├── hooks/
│   │   ├── useRouteHash.ts         # Hash-based routing
│   │   ├── useReducedMotion.ts     # Prefers-reduced-motion detection
│   │   ├── useWeightedScroll.ts    # Scroll velocity → font-weight
│   │   └── useViewTransitions.ts   # View transition API
│   │
│   ├── lib/
│   │   ├── types.ts                # Shared TypeScript interfaces
│   │   ├── content.ts              # Site content
│   │   ├── projects.ts             # Project data
│   │   ├── skills.ts               # Skill data
│   │   ├── timeline.ts             # Timeline data
│   │   ├── testimonials.ts         # Testimonials data
│   │   ├── utils.ts                # Utility functions
│   │   ├── sounds.ts               # Sound effects
│   │   └── data.ts                 # Legacy/hero data
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
