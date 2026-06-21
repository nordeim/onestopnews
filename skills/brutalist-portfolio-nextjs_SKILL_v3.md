---
name: brutalist-portfolio-nextjs
version: 3
description: >
  Build or remediate an avant-garde, anti-generic personal portfolio using Next.js 16 App Router
  with a Tactile Brutalism + High-End Editorial design system. Covers the complete architectural
  lifecycle from Vite SPA migration to production: CSS-first design tokens with dual theme,
  client-side SPA orchestrator embedded in Next.js, hash-based routing, lazy-loaded sections
  with ErrorBoundary + Suspense, optional database with graceful null handling, centralized
  site configuration, API rate limiting, WCAG AAA accessibility, strict TypeScript with
  noUncheckedIndexedAccess, and full remediation workflow through three production cycles.
  Use this skill whenever building or porting a portfolio, personal site, creative showcase,
  or any web project that demands distinctive brutalist/editorial aesthetics with Next.js.
  Also use when performing code review remediation, type-safety auditing, CSS variable
  reconciliation, or migrating from Vite to Next.js on an existing project. Triggers on:
  portfolio, personal site, brutalist design, editorial design, Next.js port, SPA orchestrator,
  hash routing, dual theme, anti-generic design, design system tokens, CSS variable strategy,
  noUncheckedIndexedAccess, react-error-boundary, remediation, type consolidation, Vite migration,
  Next.js 16, Tailwind v4, rate limiting, site configuration.
---

# Brutalist Portfolio — Next.js 16 Architectural Blueprint & Remediation Guide (v3)

This skill distills the complete architectural knowledge, design system, phased workflow, patterns, anti-patterns, hard-won troubleshooting insights, and remediation methodology from building and remediating "The Engineered Soul" — a personal portfolio ported from a Vite SPA to Next.js 16 App Router with Tactile Brutalism aesthetics, through **three full remediation cycles** that resolved 34+ TypeScript errors, 14 undefined CSS variables, multiple architectural inconsistencies, and introduced centralized configuration, rate limiting, and a real contact API.

Any agent using this skill can reproduce a similar codebase from scratch, apply the same architectural decisions to a new project, or perform rigorous remediation on an existing Next.js codebase.

---

## Table of Contents

1. [Project Execution Phases](#project-execution-phases)
2. [Architecture Blueprint](#architecture-blueprint)
3. [Design System: Tactile Brutalism + High-End Editorial](#design-system-tactile-brutalism--high-end-editorial)
4. [CSS Strategy for Tailwind v4](#css-strategy-for-tailwind-v4)
5. [Theme System Design](#theme-system-design)
6. [Component Architecture](#component-architecture)
7. [Data, Type & Configuration Strategy](#data-type--configuration-strategy)
8. [Type Safety: noUncheckedIndexedAccess Deep Dive](#type-safety-nouncheckedindexedaccess-deep-dive)
9. [Error Boundary Architecture](#error-boundary-architecture)
10. [Hash Routing Design](#hash-routing-design)
11. [API Design: Contact Endpoint with Rate Limiting](#api-design-contact-endpoint-with-rate-limiting)
12. [Database as Optional Feature](#database-as-optional-feature)
13. [Accessibility (WCAG AAA)](#accessibility-wcag-aaa)
14. [Security Headers & Metadata](#security-headers--metadata)
15. [Build & Verification Pipeline](#build--verification-pipeline)
16. [Patterns](#patterns)
17. [Anti-Patterns](#anti-patterns)
18. [Troubleshooting Guide](#troubleshooting-guide)
19. [Remediation Methodology](#remediation-methodology)
20. [Lessons Learnt](#lessons-learnt)
21. [Outstanding Issues & Recommendations](#outstanding-issues--recommendations)
22. [File Structure Reference](#file-structure-reference)
23. [Type Reference](#type-reference)

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
- **Audit the actual code**: Don't trust documentation alone. Read every source file that the remediation report claims to change. Documentation describes what *should* be; the code shows what *is*. Cross-reference every finding against actual file contents.

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
- **Centralize early**: If you find configuration values (name, email, URLs) hardcoded in 3+ places, create a `site-config.ts` immediately. Don't wait for a remediation pass.

### Phase 5: VERIFY — Rigorous QA

- Run typecheck (`npx tsc --noEmit`) — zero errors required.
- Run production build (`npm run build`) — zero errors required.
- Run lint (`npm run lint`) — zero warnings required.
- Review for accessibility (skip links, focus-visible, reduced motion, ARIA).
- Consider edge cases: missing environment variables, null database connections, empty data arrays.
- Verify visual fidelity against the design system.
- **After remediation**: Run a full codebase audit — check for stale references to removed/renamed files, verify CSS variable references resolve, verify Tailwind class names are defined, check for duplicate type definitions, verify component integration status (active vs archived).
- **Audit all `var()` references**: Undefined CSS variables fail silently. After any refactoring, grep for every `var(--*)` reference and verify it's defined in `@theme`.

### Phase 6: DELIVER — Complete Handoff

- Provide clear usage instructions.
- Document challenges encountered and solutions implemented.
- Classify components as "active" (wired into the app) vs. "archived" (in `_archive/` directories).
- Update all documentation (README.md, CLAUDE.md, AGENTS.md) to reflect the current state.
- List outstanding issues and recommendations for future work.
- Create archive of the codebase for repo refresh if needed.
- **Update documentation BEFORE delivery**: Stale documentation is worse than no documentation — it misleads future agents into fixing things that are already fixed, or missing things that are still broken.

---

## Architecture Blueprint

### Core Architectural Decision: Client-Side SPA Orchestrator inside Next.js

The portfolio uses a **Client-Side SPA Orchestrator** pattern embedded within the Next.js App Router. This preserves complex animations, hash-based routing, and kinetic interactions from the original Vite SPA while gaining Next.js benefits (metadata API, code splitting via Turbopack, security headers, structured data).

**Why this pattern**: A pure Server Component approach would lose the hash-based routing and interactive state management that makes the portfolio feel like a "digital installation." The orchestrator pattern gives you both worlds — SEO metadata from Server Components, interactive SPA behavior from Client Components.

### Architectural Layers

```
layout.tsx (Server Component)
  └── metadata, viewport, FOUC prevention script, skip-link, structured data, <body>
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

1. **`layout.tsx` is a Server Component** — exports `metadata` and `viewport`, contains the FOUC-prevention script (via `ThemeScript`), renders the skip-link, loads Google Fonts via `<link>` tags.
2. **`page.tsx` is a Client Component** — required because it uses `next/dynamic` with `ssr: false`. Uses `react-error-boundary` (NOT a custom ErrorBoundary) at the top level. This is a deliberate trade-off: no SSR for the page content, but metadata from `layout.tsx` still works for SEO.
3. **`PortfolioApp.tsx` is the orchestrator** — manages theme state, hash routing, and section composition. All sections are wrapped in a custom class-based `ErrorBoundary` + `Suspense`. **File location: `src/app/PortfolioApp.tsx`, NOT `src/components/PortfolioApp.tsx`** — the App Router co-locates the orchestrator with the route.
4. **Above-the-fold content is eager** — `Navigation` and `HeroKinetic` are imported directly (not lazy).
5. **Below-the-fold sections are lazy** — uses `React.lazy()` + `Suspense` for code splitting.
6. **Dual error boundary system** — `react-error-boundary` at the page level (catches everything), custom class-based `ErrorBoundary` per section (isolates failures to individual sections).
7. **Site configuration is centralized** — `src/lib/site-config.ts` is the single source of truth for name, email, URLs. All components import from here. No hardcoding.
8. **Archived code lives in `_archive/`** — dormant components, hooks, and lib files are moved to `_archive/` subdirectories to make the active/dormant distinction immediately clear.

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
- Rounded corners (border-radius is zero everywhere — with one known deviation: scrollbar thumb)
- Homogenized "AI slop" aesthetic

### The 28px Mathematical Grid

All spacing is governed by a 28px unit. This creates a visible structural rhythm that reinforces the brutalist aesthetic. Define the grid as CSS custom properties in the `@theme` block:

```css
@theme {
  --spacing-grid: 28px;
  --spacing-half: 14px;    /* grid / 2 */
  --spacing-quarter: 7px;  /* grid / 4 */
  --spacing-double: 56px;  /* grid * 2 */
}
```

**Critical lesson**: If these derived spacing tokens are not defined in `@theme`, components that reference `var(--spacing-half)` etc. will silently get `unset`, causing layout collapse. Every CSS variable used in a component MUST be defined in `@theme` — undefined variables fail silently with no error or warning.

### Typography Hierarchy — Three Voices

Every font choice serves a distinct role. Do not use Inter or Roboto as the body font — that is the "safe default" this design rejects.

| Role | Font | CSS Variable | Tailwind Class | Purpose |
|---|---|---|---|---|
| **Editorial** | Cormorant Garamond | `--font-editorial` / `--font-serif` / `--font-display` | `font-editorial` | Headings, narrative, hero text |
| **Body** | DM Sans | `--font-body` / `--font-sans` | `font-body` | General content, paragraphs |
| **Utility** | IBM Plex Mono | `--font-utility` / `--font-mono` | `font-utility` | Labels, stats, Machine Mode, terminal |

**Why DM Sans instead of Inter**: Inter is the default system-ui stand-in used by every startup landing page. DM Sans provides similar readability with a distinctive geometric character that breaks the "AI slop" pattern.

**`--font-display` is defined in `@theme`** as an alias for Cormorant Garamond (same as `--font-editorial`). Multiple active components reference `var(--font-display)`. If you remove this alias, those components will silently lose their font.

### Brutalist Enforcement

Zero border-radius is non-negotiable. Enforce it globally:

```css
* {
  border-radius: 0 !important;
}
```

**Known deviation**: The custom scrollbar in `globals.css` uses `border-radius: 3px` on the thumb. This should be `0` for consistency but is a low-priority visual issue.

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

  /* Semantic tokens (CRITICAL — define these!) */
  --color-text-inverse: #0a0a0a;
  --color-border-subtle: #1a1a1a;
  --color-bg-sunken: #070707;
  --color-bg-elevated: #222222;
  --color-error: #c0392b;
  --color-accent-subtle: #e8c5471a;
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

  /* Day-specific semantic overrides (REQUIRED) */
  --color-text-inverse: #f5f0e8;
  --color-border-subtle: #e5e0d6;
  --color-bg-sunken: #ece7dd;
  --color-bg-elevated: #faf6ef;
  --color-error: #a93226;
  --color-accent-subtle: #b8860b1a;
}
```

**Critical rule**: Use `--color-` prefix consistently. Do NOT introduce shorthand variants like `--border-color`, `--text-primary`, or `--bg-surface`. If components need different names, define alias variables in `globals.css` rather than creating a parallel naming system.

**Day theme coverage rule**: Every semantic token that needs different values in light mode MUST have a `[data-theme="day"]` override. If you add a new color token, immediately add its day override — do not defer it. Deferred day overrides silently inherit dark values, causing invisible breakage in light mode.

### Shadows: Brutal Offsets

Shadows are hard-edged offsets (no blur), reinforcing the brutalist aesthetic. These MUST be defined in `@theme` with day overrides:

```css
@theme {
  --shadow-brutal: 4px 4px 0 0 var(--color-border-strong);
  --shadow-brutal-sm: 2px 2px 0 0 var(--color-border);
}

[data-theme="day"] {
  --shadow-brutal: 4px 4px 0 0 var(--color-border-strong);
  --shadow-brutal-sm: 2px 2px 0 0 var(--color-border);
}
```

**Why the day override exists**: Both themes use the same shadow pattern, but since the shadows reference `--color-border-strong` and `--color-border`, and those colors change per theme, the shadows automatically adjust. The explicit override ensures the variables are resolvable in both theme contexts.

**Gotcha**: If `--shadow-brutal` and `--shadow-brutal-sm` are not defined, `box-shadow: var(--shadow-brutal)` silently resolves to `unset` — cards render without shadows and look broken. No error, no warning. This was a real issue affecting 6+ components.

### Complete Design Token Checklist

When building a similar project, ensure ALL these tokens are defined in `@theme`:

| Category | Tokens | Day Override Required |
|---|---|---|
| **Backgrounds** | `--color-bg`, `--color-bg-soft`, `--color-surface`, `--color-bg-sunken`, `--color-bg-elevated` | Yes for sunken, elevated |
| **Text** | `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`, `--color-text-inverse` | Yes for inverse |
| **Borders** | `--color-border`, `--color-border-strong`, `--color-border-subtle` | Yes for subtle |
| **Accent** | `--color-accent`, `--color-accent-hover`, `--color-accent-muted`, `--color-accent-subtle` | Yes for subtle |
| **Semantic** | `--color-error` | Yes |
| **Fonts** | `--font-sans`, `--font-mono`, `--font-serif`, `--font-editorial`, `--font-utility`, `--font-body`, `--font-display` | No |
| **Spacing** | `--spacing-grid`, `--spacing-double`, `--spacing-half`, `--spacing-quarter` | No |
| **Transitions** | `--transition-fast` | No |
| **Shadows** | `--shadow-brutal`, `--shadow-brutal-sm` | Yes (even if values are same pattern) |
| **Z-Index** | `--z-index-grain`, `--z-index-machine`, `--z-index-mobile-backdrop`, `--z-index-mobile-drawer`, `--z-index-skip-link`, `--z-index-loader` | No |
| **Animations** | `--animate-fade-in`, `--animate-fade-up`, `--animate-slide-in` | No |

---

## CSS Strategy for Tailwind v4

### Import Order (Build-Breaking If Wrong)

This is the single most common build failure. The current project uses `<link>` tags in `layout.tsx` for Google Fonts, avoiding the CSS import ordering issue entirely. If you ever add `@import url()` back to `globals.css`, the order must be:

```css
/* 1. External font imports — MUST come first */
@import url("https://fonts.googleapis.com/css2?family=...");

/* 2. Tailwind v4 — expands to @layer rules */
@import "tailwindcss";

/* 3. Your @theme block and custom styles */
@theme { ... }
```

**Why**: Tailwind v4's `@import "tailwindcss"` expands to `@layer base`, `@layer components`, and `@layer utilities`. CSS specification requires `@import` rules to precede all other rules except `@charset` and `@layer` statements. If `@import url(...)` comes after `@import "tailwindcss"`, the CSS optimizer rejects it with a warning and the fonts will not load.

**Recommended**: Load Google Fonts via `<link>` tags in `layout.tsx` `<head>` with `preconnect`. This avoids the CSS import ordering issue entirely and provides better performance through early connection establishment.

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

### Archived Components and CSS Variable Naming

Archived components in `_archive/` directories use shorthand CSS variable names that **do not exist** in `@theme`: `--border-color`, `--text-primary`, `--bg-surface`, `--bg-primary`, `--bg-elevated`, `--text-secondary`, `--text-muted`, `--border-strong`, `--color-accent-code`, `--color-accent-poetry`.

Before integrating any archived component, either:
1. Define alias variables in `globals.css` (quick fix)
2. Rewrite the component to use the `--color-` prefix convention (proper fix)

---

## Theme System Design

### Architecture: `data-theme` Attribute on `<html>`

The theme system uses a `data-theme` attribute on `document.documentElement` (`<html>`), toggled between `"day"` and `"night"`. CSS selectors target `[data-theme="day"]`.

**Do NOT use class-based theme switching** (`theme-night` / `theme-day`). The `data-attribute` approach is more semantic, works with FOUC prevention, and avoids class name collisions.

**Do NOT set `data-theme` on `<body>`** — always use `document.documentElement`. The FOUC script runs before `<body>` exists, so setting on `<html>` covers the interim between first paint and React hydration.

### Theme Target Consistency (Resolved)

Both `ThemeScript` (initial paint) and `PortfolioApp` (runtime toggle) now consistently target `document.documentElement`:

```typescript
// ThemeScript (runs before React hydration)
document.documentElement.setAttribute('data-theme', theme);

// PortfolioApp (runtime toggle)
const handleThemeChange = useCallback((theme: "day" | "night") => {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}, []);
```

**Why this matters**: CSS `[data-theme="day"]` rules only match the element they're set on. If `ThemeScript` sets `data-theme` on `<html>` but `PortfolioApp` sets it on `<body>`, the theme override only applies from `<body>` downward, and the FOUC-prevention script's setting on `<html>` gets overridden — or vice versa, depending on specificity.

### System Preference Detection

When no `localStorage` value exists, `ThemeScript` falls back to the user's OS preference:

```typescript
var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.setAttribute('data-theme', prefersDark ? 'night' : 'day');
```

This means a user's first visit respects their OS preference. After they manually toggle the theme, the stored value takes precedence.

### FOUC Prevention Script

Place an inline `<script>` via the `ThemeScript` component in `layout.tsx`'s `<head>` that reads `localStorage` and sets `data-theme` before the first paint:

```tsx
export function ThemeScript() {
  const script = `
    (function() {
      try {
        var stored = localStorage.getItem('theme');
        if (stored === 'night' || stored === 'day') {
          document.documentElement.setAttribute('data-theme', stored);
          return;
        }
        var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'night' : 'day');
      } catch (e) {
        document.documentElement.setAttribute('data-theme', 'night');
      }
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

Key details:
- `try/catch` handles private browsing where `localStorage` is unavailable
- `suppressHydrationWarning` prevents React from complaining about the mismatch between server (no `data-theme`) and client (theme set by script)
- Default fallback is `"night"` if everything else fails

### Theme Change Handler with Accessibility

In the orchestrator component, handle theme changes with ARIA announcements:

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

### Active vs. Archived Classification

Components fall into two categories. Track this explicitly in documentation — assuming all components are wired in causes confusion.

**Active** (17, wired into `PortfolioApp.tsx`):
- `Navigation`, `HeroKinetic`, `SectionBlock`, `ErrorBoundary`, `AccessibilityProvider`
- `BentoGrid`, `ProjectsSection`, `ProjectCard`, `SkillsSection`, `Timeline`
- `BlogSection`, `Terminal`, `ContactSection`, `Footer`, `ThemeSwitch`
- `ScrollReveal`, `ThemeScript`

**Archived** (14, in `src/components/_archive/`):
- `AboutFlow`, `ArchiveSpread`, `ArchiveItemCard`, `BentoTile`, `BrandMark`
- `ClientOnly`, `CodeRain`, `ContentBody`, `DitherOverlay`, `GrainOverlay`
- `LayoutShell`, `MachineOverlay`, `MobileDrawer`, `SocialIcon`, `ThemeToggle`

**Why `_archive/` directories**: Moving dormant code to `_archive/` makes the active/dormant distinction immediately clear. It prevents accidental imports of dead code and reduces confusion about what's "wired in" vs. what's just sitting there.

**Archived code is NOT dead-deleted**: It may be from an earlier iteration or planned for future integration. Do not delete without confirmation. But also do not assume it works — it likely references undefined CSS variables or uses old type shapes.

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

## Data, Type & Configuration Strategy

### Static TypeScript Data

Content is managed as static TypeScript data, not fetched from a CMS or database. This ensures type safety at build time, zero network requests for content, instant page loads, and easy version control.

Organize data files by domain:
```
src/lib/
  ├── site-config.ts  — Centralized site configuration (name, email, URLs)
  ├── types.ts        — Shared TypeScript interfaces (CANONICAL type definitions)
  ├── projects.ts     — Project entries (imports and re-exports from types.ts)
  ├── skills.ts       — Skill categories and items
  ├── timeline.ts     — Career timeline entries
  └── rate-limit.ts   — Rate limiting utility for API routes
```

### Centralized Site Configuration

Create `src/lib/site-config.ts` as the single source of truth for all site-wide constants:

```typescript
export const siteConfig = {
  name: "Nicholas Yun",
  title: "Nicholas Yun — Software Engineer & Designer",
  email: "hello@nicholasyun.com",
  github: "nordeim",
  githubUrl: "https://github.com/nordeim",
  linkedin: "nicholasyun",
  linkedinUrl: "https://linkedin.com/in/nicholasyun",
  location: "New York",
  url: "https://nicholasyun.com",
} as const;

export function getSocialLinks(): ReadonlyArray<{
  readonly name: string;
  readonly url: string;
}> {
  return [
    { name: "GitHub", url: siteConfig.githubUrl },
    { name: "LinkedIn", url: siteConfig.linkedinUrl },
    { name: "Email", url: `mailto:${siteConfig.email}` },
  ];
}
```

**Why this matters**: Before centralization, contact info was hardcoded in 4+ places (Footer, Terminal, layout.tsx structured data, Navigation). This created drift risk — updating one location but forgetting another. `site-config.ts` eliminates this class of bug entirely.

**Never hardcode site config in components** — always import from `site-config.ts`.

### Type Consolidation Rule

If two files export the same interface name (e.g., `Project` in both `types.ts` and `projects.ts`), they must be compatible or consolidated. The canonical approach: define all shared types in `types.ts`, import them in domain-specific files.

**The consolidated `Project` type:**

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

**5. Command history navigation:**
```typescript
// WRONG — commandHistory[newIndex] might be undefined
setInputValue(commandHistory[newIndex]);

// CORRECT — null coalescing
setInputValue(commandHistory[newIndex] ?? "");
```

---

## Error Boundary Architecture

### Dual Error Boundary System

The project uses two error boundary systems that serve different purposes:

1. **`react-error-boundary` at the page level** (`page.tsx`) — Catches catastrophic errors that crash the entire app. Shows a full-page error with a "Try Again" button. Uses the `ErrorBoundary` component from the `react-error-boundary` package.

2. **Custom class-based `ErrorBoundary` per section** (`PortfolioApp.tsx`) — Catches errors in individual sections without taking down the rest of the app. Shows a compact inline error message.

### `react-error-boundary` v4 Type Gotcha

`FallbackProps.error` is typed as `unknown`, NOT `Error`. This is a breaking change from v3. Custom fallback components must type the prop correctly:

```typescript
// CORRECT
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

// WRONG — TypeScript error: Type 'unknown' is not assignable to type 'Error'
function ErrorFallback({ error }: { error: Error }) { ... }
```

---

## Hash Routing Design

### `useRouteHash` Hook

The hash routing system preserves the SPA-like navigation from the original Vite version. The hook reads `window.location.hash` and validates against a `VALID_SECTIONS` constant:

```typescript
const VALID_SECTIONS = [
  "hero", "about", "projects", "skills",
  "experience", "blog", "terminal", "contact",
] as const;
```

### Critical Rule: `VALID_SECTIONS` Must Match Actual Section IDs

The `VALID_SECTIONS` array in `useRouteHash` must exactly match the `id` attributes of `<section>` elements rendered by `PortfolioApp`. If they diverge:
- `aria-current="page"` indicators silently break for mismatched sections
- Active link highlighting stops working
- Navigation to mismatched sections fails silently (falls back to "hero")

**This was a real bug**: `VALID_SECTIONS` originally contained `["hero","who","work","skills","music","now","contact"]` — leftover from the Vite version. Only `hero`, `skills`, and `contact` matched the actual Next.js section IDs.

---

## API Design: Contact Endpoint with Rate Limiting

### Contact API Route

The `/api/contact` endpoint provides a production-ready structure for contact form submissions:

```typescript
export async function POST(request: Request) {
  // 1. Rate limiting
  const ip = getClientIp(request);
  const limit = await rateLimit(ip, { maxRequests: 5, windowMs: 60_000 });
  if (!limit.success) {
    return Response.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.retryAfterMs ?? 60_000) / 1000)) } },
    );
  }

  // 2. Parse and validate
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON body." }, { status: 400 }); }

  // 3. Server-side validation (mirrors client-side)
  const errors = validateContact(data);
  if (errors.length > 0) { return Response.json({ error: "Validation failed.", details: errors }, { status: 422 }); }

  // 4. Process (TODO: integrate email service)
  console.log("[Contact Form]", { name: data.name!.trim(), email: data.email!.trim() });
  return Response.json({ success: true, message: "Message received." }, { status: 200 });
}
```

### Rate Limiting Utility

`src/lib/rate-limit.ts` implements a token bucket / sliding window algorithm:

```typescript
export async function rateLimit(identifier: string, config: RateLimitConfig): Promise<RateLimitResult>
export function getClientIp(request: Request): string
```

**Current limitation**: Uses an in-memory `Map`. Does not persist across server instances or restarts. For production multi-instance deployments (Vercel, Docker), replace with Redis/Upstash rate limiting.

**Every new API route MUST use rate limiting** — import `rateLimit` and `getClientIp` from `@/lib/rate-limit`.

---

## Database as Optional Feature

The database (PostgreSQL + Drizzle) is entirely optional. The app runs without `DATABASE_URL` set.

### Graceful Degradation Pattern

```typescript
// src/db/index.ts
function createDb() {
  if (!databaseUrl) {
    return null;
  }
  try {
    const client = postgres(databaseUrl);
    return drizzle(client, { schema });
  } catch {
    console.warn("Failed to connect to database. Analytics features disabled.");
    return null;
  }
}
export const db = createDb();
```

### Null Guard in API Routes

Every API route that uses `db` must include a null guard:

```typescript
if (!db) {
  return Response.json({ ok: false, error: "Database not configured" }, { status: 503 });
}
```

The health endpoint (`/api/health`) returns 503 when the database is unavailable.

### `drizzle.config.json` Gotcha

The Drizzle config file still uses hardcoded credentials: `postgresql://postgres:postgres@127.0.0.1:5432/app_db`. This MUST be replaced with `process.env.DATABASE_URL` before any deployment.

---

## Accessibility (WCAG AAA)

### Skip Link

One skip-link, in `layout.tsx` only (Server Component, always present). Do NOT duplicate in `PortfolioApp.tsx`.

```html
<a className="skip-link" href="#main-content">Skip to main content</a>
```

CSS for the skip link (visible only on focus):
```css
.skip-link {
  position: absolute;
  top: -100%;
  left: 16px;
  z-index: var(--z-index-skip-link);
  /* ... */
}
.skip-link:focus {
  top: 16px;
}
```

### Focus Styles

Global focus-visible style using the accent color:
```css
*:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

### Reduced Motion

CSS media query that disables ALL animations and transitions:
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

Plus a React hook (`useReducedMotion`) and context provider (`AccessibilityProvider`) for JS-based motion gating.

### Section Landmarks

Every section uses semantic HTML with `aria-label`:
```tsx
<section id="projects" aria-label="Projects">
<nav aria-label="Main navigation">
<footer role="contentinfo">
```

### Screen Reader Utilities

The `sr-only` Tailwind utility class is used for visually hidden text that screen readers should announce:
```tsx
<span className="sr-only">Loading portfolio...</span>
```

---

## Security Headers & Metadata

### Security Headers (in `next.config.ts`)

```typescript
headers: async () => [
  {
    source: "/(.*)",
    headers: [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ],
  },
],
```

### OG/Twitter Metadata (in `layout.tsx`)

Comprehensive Open Graph and Twitter card metadata, including image, description, and locale. The `metadataBase` uses the `NEXT_PUBLIC_SITE_URL` environment variable with a fallback:

```typescript
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nicholasyun.com";
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // ...
};
```

### JSON-LD Structured Data

A `Person` schema is embedded in `layout.tsx` for search engine rich results:
```typescript
const structuredData = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: siteConfig.name,
  jobTitle: "Software Engineer & Designer",
  url: siteConfig.url,
  sameAs: [siteConfig.githubUrl, siteConfig.linkedinUrl],
};
```

---

## Build & Verification Pipeline

### Commands

| Command | Purpose | When to Run |
|---|---|---|
| `npm run typecheck` | TypeScript validation | Before every commit, after any file change |
| `npm run build` | Typecheck + Production build | Before deployment, after major changes |
| `npm run lint` | ESLint check | Before commits |
| `npm run dev` | Development server | During development |

### Pre-Build Checklist

Before running `npm run build`, verify:
- [ ] All `var(--*)` references in components are defined in `@theme`
- [ ] Day theme overrides exist for all semantic tokens
- [ ] No hardcoded config values in components (use `site-config.ts`)
- [ ] `VALID_SECTIONS` in `useRouteHash` matches actual section IDs
- [ ] `data-theme` is set on `document.documentElement` everywhere
- [ ] No `@import url()` after `@import "tailwindcss"` in `globals.css`
- [ ] All API routes have null guards for `db` and rate limiting
- [ ] No `any` types, all array access uses `?.` or `??`
- [ ] `react-error-boundary` fallbacks type `error` as `unknown`

---

## Patterns

### 1. CSS Variable Naming: `--color-` Prefix

All CSS variables use the `--color-` prefix convention. This is non-negotiable. If you need a new variable, name it `--color-<semantic-name>`.

### 2. Lazy Section Loading with ErrorBoundary + Suspense

Every below-the-fold section uses three-layer wrapping:
```
ErrorBoundary → Suspense → SectionBlock → Component
```

### 3. Optional Feature Guard

Database and any optional features use a null guard pattern:
```typescript
if (!db) { return Response.json({...}, { status: 503 }); }
```

### 4. Centralized Configuration

Site-wide constants live in `site-config.ts`. Components import from here, never hardcode.

### 5. Accessibility-First Design

Every interactive element has `aria-*` attributes. Theme changes are announced via live regions. Skip links and focus management are built in from the start.

### 6. Section Skeleton

Lazy-loaded sections show a skeleton during loading:
```tsx
function SectionSkeleton() {
  return (
    <div aria-hidden="true" style={{ minHeight: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      Loading&hellip;
    </div>
  );
}
```

### 7. FOUC-Free Theme Init

The `ThemeScript` component runs before React hydration, preventing any flash of unstyled content. The script reads localStorage, checks system preference, and sets `data-theme` on `<html>`.

### 8. Rate Limiting for API Routes

Every public API route uses `rateLimit()` from `@/lib/rate-limit`. The rate limiter extracts client IP via `x-forwarded-for`, `x-real-ip`, or `cf-connecting-ip` headers, supporting Vercel, Cloudflare, and generic proxies.

### 9. Archived Code Separation

Dormant components, hooks, and lib files live in `_archive/` subdirectories. Active code stays in the canonical locations. This makes the active/dormant distinction immediately visible in the file tree.

---

## Anti-Patterns

### 1. Mixed CSS Variable Naming

NEVER mix `--color-` prefix with shorthand names (`--border-color`, `--text-primary`). This creates two parallel naming systems that silently fail. Pick one convention and enforce it everywhere.

### 2. Class-Based Theme Switching

NEVER use `theme-night` / `theme-day` CSS classes. Use `data-theme="night"` / `data-theme="day"` on `<html>`. Class-based switching doesn't work with FOUC prevention and creates specificity issues.

### 3. `optimizeFonts` in Next.js 16

NEVER add `optimizeFonts` to `next.config.ts`. It was removed in Next.js 16. Font optimization is automatic.

### 4. Wrong CSS Import Order

NEVER put `@import url()` after `@import "tailwindcss"` in `globals.css`. Better yet, load fonts via `<link>` tags in `layout.tsx` to avoid the issue entirely.

### 5. Unguarded Database Access

NEVER use `db` from `@/db` without a null guard. The database is optional and `db` can be `null`.

### 6. Duplicate Skip-Links

NEVER render skip-links in both `layout.tsx` and `PortfolioApp.tsx`. One skip-link in `layout.tsx` only (server-rendered, always present).

### 7. Duplicate Type Definitions

NEVER define the same interface in multiple files. Define once in `types.ts`, re-export from domain files.

### 8. Generic Typography

NEVER use Inter or Roboto as the body font. These are the "safe defaults" that make every site look the same. Choose distinctive typefaces that express the project's identity.

### 9. Hardcoded Site Configuration

NEVER hardcode name, email, URLs, or social links in components. Import from `site-config.ts` to prevent drift.

### 10. API Routes Without Rate Limiting

NEVER create a public API route without rate limiting. Even simple endpoints need protection against abuse.

### 11. Setting `data-theme` on `<body>`

NEVER set `data-theme` on `<body>`. Always use `document.documentElement` (`<html>`). The FOUC script runs before `<body>` exists.

---

## Troubleshooting Guide

### Build Errors

| Symptom | Cause | Fix |
|---|---|---|
| `npm install` fails with `ETARGET` | Package version doesn't exist on npm | Check `package.json` versions against `npm view <pkg> dist-tags` |
| `optimizeFonts` not in `NextConfig` | Property removed in Next.js 16 | Remove from `next.config.ts` |
| `ssr: false` not allowed in Server Components | `page.tsx` was a Server Component using `next/dynamic` with `ssr: false` | Add `"use client"` directive |
| `@import url()` CSS warning | Google Fonts import must precede all other rules | Move `@import url(...)` before `@import "tailwindcss"` or load via `<link>` tags |
| `db is possibly null` | Database connection is optional | Add null guard: `if (!db) { return Response.json({...}, { status: 503 }); }` |
| `Property X does not exist on type [...]` | `noUncheckedIndexedAccess: true` flags array index access | Use optional chaining (`arr[i]?.`) or null coalescing (`arr[i] ?? default`) |
| `Type 'unknown' is not assignable to type 'Error'` | `react-error-boundary` v4 changed `FallbackProps.error` to `unknown` | Type the prop as `error: unknown` and use `instanceof Error` guard |
| Cannot find module `react-error-boundary` | Package not installed | Run `npm install react-error-boundary` |
| Cannot find module `@/components/PortfolioApp` | `PortfolioApp.tsx` lives in `src/app/`, not `src/components/` | Import from `@/app/PortfolioApp` |
| `useRouteHash` destructuring mismatch | Hook returns a tuple `[string, fn]`, not an object | Destructure as `[currentHash, navigateTo]` not `{ currentHash, navigateTo }` |
| `Project` type missing `tags`/`github`/`live` fields | Old Vite-era shape; consolidated `Project` uses `tech`, `links.repo`, `links.live` | Update imports to use `@/lib/projects` re-export |

### Visual Issues

| Symptom | Cause | Fix |
|---|---|---|
| Cards have no shadows | `--shadow-brutal` / `--shadow-brutal-sm` not defined in `@theme` | Add to `@theme` block with day overrides |
| Transitions not working | `--transition-fast` not defined | Add `--transition-fast: 150ms ease;` to `@theme` |
| Text invisible on certain backgrounds | `--color-text-inverse` not defined or missing day override | Define with day override |
| Spacing wrong (too much/little) | `--spacing-half` / `--spacing-quarter` / `--spacing-double` not defined | Add derived spacing tokens to `@theme` |
| Theme only partially changes | `data-theme` set on `<body>` instead of `<html>`, or only some tokens have day overrides | Target `<html>` consistently; add missing day overrides |
| Error text not red | `--color-error` not defined or missing day override | Add `--color-error` with day override |
| Navigation active state wrong | `VALID_SECTIONS` doesn't match actual section IDs | Update `VALID_SECTIONS` in `useRouteHash` |

### Version Compatibility

| Package | Correct Version | Common Mistake |
|---|---|---|
| `next` | `^16.2.9` | `^16.2.6` (doesn't exist) |
| `react` | `^19.2.7` | `^19.2.6` (doesn't exist) |
| `react-dom` | `^19.2.7` | `^19.2.6` (doesn't exist) |
| `@types/react-dom` | `^19.2.3` | `^19.2.6` (doesn't exist) |

**Always check with `npm view <pkg> dist-tags` before pinning versions in `package.json`.**

---

## Remediation Methodology

When performing remediation on an existing codebase, follow this disciplined process:

### Step 1: Read ALL Documentation First

Before touching any code, read every documentation file in the repository:
- `CLAUDE.md` — project-specific constraints and gotchas
- `AGENTS.md` — operational gotchas and "Never" list
- `README.md` — known issues and troubleshooting
- Any `Code_Review_Report_*.md` files — detailed findings
- Any `Remediation_*.md` files — changes to apply
- Any `status*.md` files — project state history

These contain critical project-specific constraints that are NOT obvious from the code alone.

### Step 2: Validate Remediation Against Actual Code

Don't trust the remediation report blindly. Read every source file it claims to change:
- Verify the described state matches the actual code
- Check that proposed fixes target the right lines
- Identify any changes the report missed or got wrong

### Step 3: Extract and Apply

Extract file changes from the remediation report. Apply them carefully, matching existing code style.

### Step 4: Verify Package Versions

Before running `npm install`, verify all package versions against the npm registry:
```bash
npm view next dist-tags
npm view react dist-tags
npm view react-dom dist-tags
```

Remediation reports often specify versions that don't exist on npm.

### Step 5: Typecheck and Build

Run `npm run typecheck` first (faster feedback). Fix all errors. Then run `npm run build`. Fix any remaining issues.

### Step 6: Full Codebase Audit

After the build passes, audit the entire codebase:
- Check for stale references to removed/renamed files
- Verify CSS variable references resolve against `@theme`
- Verify Tailwind class names are defined
- Check for duplicate type definitions
- Verify component integration status (active vs archived)
- Grep for every `var(--*)` reference and verify it's defined

### Step 7: Update All Documentation

After remediation, update README.md, CLAUDE.md, and AGENTS.md to reflect the new state. Stale documentation is worse than no documentation — it misleads future agents.

---

## Lessons Learnt

1. **Verify npm versions before pinning** — Remediation specified `@types/react-dom@^19.2.6` which didn't exist (max was 19.2.3). Always check with `npm view <pkg> dist-tags`.

2. **CSS import order matters in Tailwind v4** — `@import url()` for fonts must precede `@import "tailwindcss"`. Better: load fonts via `<link>` tags to avoid the issue entirely.

3. **`optimizeFonts` is gone in Next.js 16** — Font optimization is automatic; the config key no longer exists.

4. **`ssr: false` requires `"use client"`** — Next.js 16 enforces this at build time for Server Components.

5. **Null-safe DB access is mandatory** — Optional database means `db` can be `null`; always guard.

6. **Two design token systems = technical debt** — The shorthand and `--color-` prefix conventions must be reconciled. Moving dormant code to `_archive/` reduces confusion.

7. **`noUncheckedIndexedAccess` catches real bugs** — Array index access returning `T | undefined` revealed 6+ places where runtime errors were possible. Always use `?.` or `??`.

8. **Undefined CSS variables fail silently** — `var(--font-display)` resolving to `unset` produces no error, no warning — the style just doesn't apply. Define every referenced variable in `@theme`. Audit `var()` references after any refactoring.

9. **`react-error-boundary` v4 changed `FallbackProps.error`** — From `Error` to `unknown`. Must use `instanceof Error` guard.

10. **File location matters for App Router imports** — `PortfolioApp.tsx` in `src/app/` must be imported as `@/app/PortfolioApp`, not `@/components/PortfolioApp`.

11. **Centralize configuration early** — Contact info and social links hardcoded in 4+ places created drift risk. `site-config.ts` eliminated this entirely.

12. **Theme target must be consistent** — Setting `data-theme` on `<html>` vs `<body>` breaks CSS selectors. Pick one target (`<html>`) and use it everywhere — both in `ThemeScript` and `PortfolioApp`.

13. **Hash routing section names must match actual IDs** — When `VALID_SECTIONS` diverges from actual section IDs, `aria-current` indicators silently break.

14. **Rate limiting is essential for public API routes** — Even a simple in-memory algorithm provides meaningful protection. Without it, the contact endpoint is vulnerable to abuse.

15. **Archiving dormant code reduces confusion** — `_archive/` directories make it immediately clear what code is active vs. dormant, reducing the risk of importing dead code.

16. **Day theme overrides must cover ALL semantic tokens** — Deferring day overrides means dark values silently leak into light mode. Add day overrides immediately when adding new semantic tokens.

17. **Don't trust documentation over code** — After three remediation cycles, documentation was consistently out of date. Always verify against actual source files.

---

## Outstanding Issues & Recommendations

| # | Issue | Severity | Recommendation |
|---|---|---|---|
| 1 | `drizzle.config.json` hardcoded credentials | Moderate | Use `process.env.DATABASE_URL` |
| 2 | Contact API logs to console | Moderate | Integrate email service (Resend, SendGrid) |
| 3 | No error reporting | Moderate | Integrate Sentry in `error.tsx` |
| 4 | `useAccessibility()` never consumed | Low | Replace scattered `matchMedia` checks with context hook |
| 5 | Scrollbar `border-radius: 3px` | Low | Change to `0` for brutalist consistency |
| 6 | Archived components use old CSS variable names | Low | Rewrite or add aliases before reintegration |
| 7 | Missing portrait assets | Low | Add webp images to `public/portraits/` |
| 8 | No SSR for SEO | Low | Consider `Suspense` boundaries instead of `ssr: false` |
| 9 | Analytics table never written to | Low | Implement tracking middleware or remove schema |
| 10 | In-memory rate limiting only | Low | Replace with Redis/Upstash for multi-instance |

---

## File Structure Reference

```
src/
  app/
    globals.css              — Design system: @theme tokens, day overrides, base styles
    layout.tsx               — Server Component: metadata, ThemeScript, skip-link, fonts
    page.tsx                 — Client Component: dynamic import with ssr: false
    PortfolioApp.tsx         — SPA orchestrator: routing, theming, section composition
    error.tsx                — Global error boundary (Next.js convention)
    not-found.tsx            — 404 page
    api/
      contact/route.ts       — Contact form endpoint with validation + rate limiting
      health/route.ts        — Health check endpoint with DB null guard
  components/
    Navigation.tsx           — Sticky nav with hash links, mobile menu, theme switch
    HeroKinetic.tsx          — Hero section (eager loaded)
    SectionBlock.tsx         — Section wrapper with consistent layout
    ErrorBoundary.tsx        — Custom class-based error boundary (per-section)
    AccessibilityProvider.tsx — Context provider for reduced motion / high contrast
    BentoGrid.tsx            — About section bento grid layout
    ProjectsSection.tsx      — Projects gallery container
    ProjectCard.tsx          — Individual project card (uses consolidated Project type)
    SkillsSection.tsx        — Skills visualization
    Timeline.tsx             — Experience timeline
    BlogSection.tsx          — Blog preview section
    Terminal.tsx             — Interactive terminal with command history
    ContactSection.tsx       — Contact form with validation
    Footer.tsx               — Site footer (uses site-config.ts)
    ThemeSwitch.tsx          — Day/night toggle button
    ScrollReveal.tsx         — IntersectionObserver-based reveal animation
    ThemeScript.tsx          — FOUC prevention inline script
    _archive/                — 14 dormant components (not wired in)
  hooks/
    useRouteHash.ts          — Hash routing hook (returns tuple)
    useReducedMotion.ts      — Reduced motion preference hook
    _archive/                — 2 dormant hooks
  lib/
    site-config.ts           — Single source of truth for site-wide constants
    types.ts                 — CANONICAL type definitions
    projects.ts              — Project data + re-exports from types.ts
    skills.ts                — Skills data
    timeline.ts              — Career timeline data
    rate-limit.ts            — Sliding window rate limiter + IP extraction
    _archive/                — 5 dormant lib files (data.ts, content.ts, etc.)
  db/
    index.ts                 — Optional DB connection (returns null if no DATABASE_URL)
    schema.ts                — Drizzle table definitions
public/
  favicon.svg               — Site favicon
```

---

## Type Reference

### Core Types (`src/lib/types.ts`)

```typescript
export interface NavLink {
  label: string;
  href: string;
}

export interface SocialLink {
  platform: string;
  url: string;
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
  url: string;
}

export interface ProjectLink {
  live?: string;
  repo?: string;
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
  tech: readonly string[];
  links: ProjectLink;
  image?: string;
  featured?: boolean;
}

// Types used only by archived components:
export interface AboutPillar { title: string; paragraphs: readonly string[]; }
export interface ParsedCollectionItem { slug: string; title: string; description: string; category: string; status: string; medium?: string; image?: string; body?: string; document?: string; link?: string; linkLabel?: string; accent: string; }
export interface Collection { slug: string; title: string; description: string; accent: string; }
export interface ParsedPortfolioItem { slug: string; title: string; description: string; category: string; accent: string; status: string; image?: string; medium?: string; body?: string; link?: string; linkLabel?: string; }
export interface MachineOverlayData { buildVersion: string; route: string; collections: Record<string, number>; activeData: unknown; }
export type SocialIconVariant = "mail" | "linkedin" | "instagram" | "github";
```

### Rate Limiting Types (`src/lib/rate-limit.ts`)

```typescript
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  retryAfterMs?: number;
}
```
