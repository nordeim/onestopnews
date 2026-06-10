# Distilled Learnings & Tips — Next.js 16 + React 19 + Tailwind v4 + TypeScript + PostgreSQL + Drizzle

> Extracted from battle-tested LuxeVerse documentation. Filtered for relevance to: Next.js 16, React 19, Tailwind CSS v4, TypeScript 5.9+, PostgreSQL (pg), Drizzle ORM.

---

## 1. Next.js 16 — Critical Gotchas

### 1.1 `params` & `searchParams` Are Async (CRITICAL)

Next.js 16 types `params` as `Promise<any>` for page components. The runtime behavior differs by layer:

| Layer | Runtime Type | Must Use |
|-------|-------------|---------|
| **Layouts** (`layout.tsx`) | `Promise<...>` | `const { slug } = await params;` |
| **Pages** (`page.tsx`) | Plain object `{}` | `const { slug } = params;` (no await) |

```tsx
// ✅ Layout — MUST await
export default async function Layout({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
}

// ✅ Page — direct destructuring (no await)
export default function Page({ params }: { params: { slug: string } }) {
  const { slug } = params;
}
```

**Why the duality**: `.next/types/` generates `Promise<any>` for both, but at runtime pages get a plain object. `await` on a non-Promise returns the same value (no crash), but omitting it when types expect `Promise` causes tsc errors. The safe universal pattern: always type as `Promise<T>` and always `await` — it works for both cases.

### 1.2 `cookies()` Is Async in Next.js 15+

```tsx
// ❌ Next.js 14 style (breaks in 15+)
const token = cookies().get("session")?.value;

// ✅ Next.js 15+/16 style
const token = (await cookies()).get("session")?.value;
```

Forgetting `await` produces: `TS2339: Property 'get' does not exist on type 'Promise<ReadonlyRequestCookies>'`

### 1.3 `middleware.ts` Is Deprecated → Use `proxy.ts`

Next.js 16 replaces `middleware.ts` with `proxy.ts`. **Constraint**: `proxy.ts` runs on the **Node.js runtime only** — Edge Runtime is not supported.

### 1.4 `global-error.tsx` Must Define Its Own `<html>` and `<body>`

The global error boundary **replaces** the root layout entirely. It must render a complete document:

```tsx
"use client";
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body>
        <h2>Something went wrong</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}
```

### 1.5 Root Layout Should Be Minimal

If using i18n or nested layouts, the root `app/layout.tsx` should be a **pass-through** — no `<html>`, no `<body>`, no site components. Only the deepest layout that handles the document shell should render `<html>` and `<body>`.

```tsx
// app/layout.tsx — minimal pass-through
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

### 1.6 `next lint` Is Removed in Next.js 16

Do not use `npx next lint`. Use custom shell scripts or direct ESLint invocation:

```bash
eslint .
# or project-specific lint scripts
```

### 1.7 `experimental.ppr` Is Removed

Partial Prerendering is now opted into via `cacheComponents: true` in `next.config.ts` and the `"use cache"` directive in components.

### 1.8 Route Restructuring for Nested Layouts

Pages that need context from a nested layout (e.g., i18n providers) must live **inside** that layout's directory. Use route groups `(groupName)` for logical grouping without affecting URLs:

```
app/
├── layout.tsx                    # Minimal root (no <html>/<body>)
└── [locale]/
    ├── layout.tsx                # Locale layout (owns <html>/<body>)
    └── (routes)/                 # Group for locale-dependent pages
        ├── shop/
        └── editorial/
```

### 1.9 Hydration Mismatch: Single Document Root

Only one layout in the tree should render `<html>` and `<body>`. If both root and nested layouts render them, React sees conflicting attributes during hydration. Fix: remove `<html>`/`<body>` from root layout.

---

## 2. React 19 — Breaking Changes

### 2.1 `JSX.Element` Is Removed

The global `JSX` namespace no longer exists. Do not use `JSX.Element` as a return type.

```tsx
// ❌ BANNED
function Component(): JSX.Element { return <div />; }

// ✅ CORRECT — inferred return type
function Component() { return <div />; }

// ✅ Also valid — explicit import
import type { ReactElement } from "react";
function Component(): ReactElement { return <div />; }
```

### 2.2 Forms: Use `useActionState`

```tsx
"use client";
import { useActionState } from "react";

function Form() {
  const [state, formAction, isPending] = useActionState(
    async (prev: FormState, formData: FormData) => {
      // Server action or async logic
      return { success: true, errors: {} };
    },
    { success: false, errors: {} }
  );
  return <form action={formAction}>...</form>;
}
```

### 2.3 Instant UI: `useOptimistic` + `startTransition`

For complex state that needs instant feedback with server confirmation:

```tsx
const [optimisticItems, addOptimistic] = useOptimistic(items, (state, newItem) => [
  ...state,
  { ...newItem, pending: true },
]);

function handleAdd(item: Item) {
  startTransition(async () => {
    addOptimistic(item);
    await addItemToServer(item);
  });
}
```

### 2.4 `"use client"` Must Be First Line

The directive must appear before any imports:

```tsx
"use client"; // MUST be first line
import { useState } from "react";
```

### 2.5 RSC: No Browser APIs

Server Components cannot access `window`, `document`, `localStorage`, `requestAnimationFrame`, or any browser-only API. Use `"use client"` components for anything requiring these.

---

## 3. Tailwind CSS v4 — Migration & Patterns

### 3.1 Zero Config — CSS-First

No `tailwind.config.js` / `tailwind.config.ts`. All configuration lives in `globals.css`:

```css
@import "tailwindcss";

@theme inline {
  --color-brand: oklch(0.65 0.28 350);
  --font-display: "Cormorant Garamond", serif;
}
```

### 3.2 Critical Utility Migrations

| v3 Utility | v4 Replacement | Why |
|-----------|---------------|-----|
| `bg-gradient-to-r` | `bg-linear-to-r` | Build error if not migrated |
| `bg-gradient-to-t` | `bg-linear-to-t` | Build error if not migrated |
| `outline-none` | `outline-hidden` | **Critical a11y fix** — preserves Forced Colors Mode |
| `flex-shrink-0` | `shrink-0` | Silent style failure |

### 3.3 Custom Utilities

```css
/* ❌ v3 style */
@layer utilities {
  .font-display { font-family: var(--font-display); }
}

/* ✅ v4 style */
@utility font-display {
  font-family: var(--font-display);
}
```

### 3.4 CSS Variables

```tsx
// ❌ v3 bracket syntax
<div className="bg-[--brand]">

// ✅ v4 parenthesis syntax
<div className="bg-(--brand)">
```

### 3.5 Negative Values

Single hyphen: `-bottom-24`, not `bottom--24`.

### 3.6 No Raw Hex Colors

```tsx
// ❌ BANNED
<div className="bg-[#1a1a2e]">

// ✅ Use design tokens
<div className="bg-obsidian-900">
```

### 3.7 Variant Stacking Order

Left-to-right: `*:first:pt-0` (not `first:*:pt-0`).

### 3.8 Scanning for Deprecated Utilities

```bash
grep -rEn '\bbg-gradient-to-[a-z]+\b|\boutline-none\b|\bflex-shrink-0\b' src/
grep -rEn 'text-\[#[0-9A-Fa-f]{3,6}\]|bg-\[#[0-9A-Fa-f]{3,6}\]' src/
```

---

## 4. TypeScript — Strict Mode Enforcement

### 4.1 Zero Enums, Zero Namespaces

```ts
// ❌ BANNED (erasableSyntaxOnly)
enum Status { ACTIVE = "ACTIVE", DRAFT = "DRAFT" }
namespace MySpace { export interface Config {} }

// ✅ CORRECT
type Status = "ACTIVE" | "DRAFT";
interface Config { /* ... */ }
```

### 4.2 No `any` — Use `unknown` or Typed Interfaces

```ts
// ❌ BANNED
function process(data: any) { /* ... */ }
const ctx = {} as any;

// ✅ CORRECT
function process(data: unknown) { /* ... */ }
const ctx: Record<string, never> = {};
```

### 4.3 `import type` for Type-Only Imports

```ts
// ❌ BANNED with verbatimModuleSyntax
import { ReactElement } from "react";

// ✅ CORRECT
import type { ReactElement } from "react";
```

### 4.4 Interface Over Type for Structures

```ts
// Preferred for structural definitions
interface ProductCardProps {
  title: string;
  price: number;
}

// Use type for unions/intersections
type SortOption = "newest" | "price-asc" | "price-desc";
```

### 4.5 Verification Command

```bash
tsc --noEmit
# Or: pnpm typecheck
```

---

## 5. PostgreSQL + Drizzle ORM

### 5.1 Schema Sync Is Mandatory After Changes

After modifying `drizzle.config.ts` or schema files, regenerate:

```bash
npx drizzle-kit generate
npx drizzle-kit push   # or: npx drizzle-kit migrate
```

Symptom of stale types: `TS2339: Property 'X' does not exist on type 'Y'`

### 5.2 No Business-Logic Fields Without Schema backing

If a field like `relevance` makes business sense but isn't in your Drizzle schema, it does **not** exist at runtime. Always verify against the schema before using in queries.

### 5.3 Drizzle `decimal` → `number` Conversion

Drizzle's `decimal` type returns strings by default. Convert in your service layer before passing to client components:

```ts
// Service layer
const products = await db.select().from(productsTable);
return products.map(p => ({
  ...p,
  price: Number(p.price),
}));
```

### 5.4 Typed Query Results

Use Drizzle's inferred types for full type safety:

```ts
import { type InferSelectModel } from "drizzle-orm";
import { products } from "@/db/schema";

type Product = InferSelectModel<typeof products>;

// For complex joins
const results = await db
  .select()
  .from(products)
  .leftJoin(categories, eq(products.categoryId, categories.id));
// results type is inferred automatically
```

### 5.5 Raw `pg` Driver — Connection Management

```ts
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Always use pool.query() or pool.connect() with release
const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
```

---

## 6. Server/Client Component Patterns

### 6.1 RSC Data Fetching → Client Component Rendering

```tsx
// Server Component (RSC) — fetches data
import { ProductGrid } from "./ProductGrid";

export default async function ShopPage() {
  const products = await getProducts(); // runs on server
  return <ProductGrid products={products} />; // passes to client
}

// Client Component — handles interactivity
"use client";
export function ProductGrid({ products }: { products: Product[] }) {
  // interactive UI here
}
```

### 6.2 Server Actions for Mutations

```tsx
// actions/cart.ts
"use server";
import { cookies } from "next/headers";

export async function addToCart(productId: string) {
  const session = (await cookies()).get("session")?.value;
  if (!session) throw new Error("Unauthorized");
  // ... mutation logic
}
```

### 6.3 Never Access Browser APIs in RSC

```tsx
// ❌ BANNED in Server Components
export default function Page() {
  const width = window.innerWidth; // CRASH
}

// ✅ Extract to client component
"use client";
import { useState, useEffect } from "react";
export function WindowWidth() {
  const [width, setWidth] = useState(0);
  useEffect(() => setWidth(window.innerWidth), []);
  return <span>{width}px</span>;
}
```

---

## 7. Testing Patterns

### 7.1 `getByText` with Duplicate Text

```ts
// ❌ Fails with "Found multiple elements"
const el = screen.getByText("Sale");

// ✅ Use getAllByText
const els = screen.getAllByText("Sale");

// ✅ Or use container.querySelector for precision
const el = container.querySelector('[data-testid="sale-badge"]');
```

### 7.2 Mocking `cookies()` in Tests

```ts
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({ get: vi.fn().mockReturnValue(undefined) })),
}));
```

### 7.3 Mocking `requestAnimationFrame`

```ts
// In setup.ts
vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => setTimeout(cb, 0));
vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
```

### 7.4 TDD Workflow

1. **RED**: Write failing test
2. **GREEN**: Implement minimal code to pass
3. **REFACTOR**: Clean up while keeping tests green
4. **VERIFY**: Run `tsc --noEmit` + test suite

---

## 8. Verification Pipeline

```bash
# Full verification (must all pass before completion)
tsc --noEmit && eslint . && vitest run && next build
```

### Individual Commands

```bash
tsc --noEmit        # TypeScript check
eslint .            # Linting
vitest run          # Unit/component tests
next build          # Production build
```

### Post-Schema-Change Verification

```bash
npx drizzle-kit generate && tsc --noEmit
```

---

## 9. Common Error → Fix Reference

| Error / Symptom | Cause | Fix |
|----------------|-------|-----|
| `TS2339: Property 'X' does not exist` | Stale generated types | Regenerate: `drizzle-kit generate` + `tsc --noEmit` |
| `Property 'get' does not exist on type 'Promise<...>'` | Missing `await cookies()` | `(await cookies()).get("key")` |
| `JSX.Element` not found | React 19 removed global namespace | Use inferred return or `import type { ReactElement }` |
| `outline-none` not working a11y | Tailwind v4 renamed it | Use `outline-hidden` |
| `bg-gradient-to-r` build error | Tailwind v4 renamed it | Use `bg-linear-to-r` |
| `flex-shrink-0` silent failure | Tailwind v4 renamed it | Use `shrink-0` |
| `enum` / `namespace` errors | `erasableSyntaxOnly` bans them | Use string unions and ES modules |
| `window is not defined` in RSC | Browser API in Server Component | Move to `"use client"` component |
| `Type 'string' is not assignable to type 'Date'` | Decimal/date serialization | Convert in service layer before client |
| `middleware.ts deprecation warning` | Next.js 16 deprecated it | Rename to `proxy.ts` |
| Hydration mismatch on `<html>` | Two layouts render document shell | Root layout: pass-through only; nested layout: owns `<html>`/`<body>` |

---

## 10. Anti-Pattern Checklist

Before submitting code, verify:

- [ ] No `enum` or `namespace` in TypeScript files
- [ ] No `any` type annotations
- [ ] No `JSX.Element` return types
- [ ] No `bg-gradient-to-*` (use `bg-linear-to-*`)
- [ ] No `outline-none` (use `outline-hidden`)
- [ ] No `flex-shrink-0` (use `shrink-0`)
- [ ] No raw hex colors in Tailwind classes
- [ ] No `window`/`document` access in Server Components
- [ ] No `cookies()` calls without `await`
- [ ] No direct `params` destructuring without `await` in layouts
- [ ] All `"use client"` directives are first line of file
- [ ] Schema changes followed by `drizzle-kit generate`
