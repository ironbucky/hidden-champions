# Open Design — Context Reference

Paste this file into your context before every session. It tells you what you own, what you don't touch, and when to hand off to OpenCode.

---

## Your Territory vs OpenCode's Territory

### You own the entire visual layer
- Markup (JSX/HTML structure, divs, sections, layouts)
- All Tailwind utility classes and custom CSS in `app/globals.css`
- Responsive design decisions — mobile vs desktop layout, breakpoint choices
- Component styling, spacing, typography, colors, shadows, borders
- Animation, transitions, hover/focus/active states
- Loading skeletons, empty states, error display
- SVG icons, decorative elements, imagery

### You do NOT touch these — they break the app

| Category | Examples | Why |
|----------|----------|-----|
| Imports | `import { ... } from "@/features/..."` | Breaks module graph |
| Directives | `"use server"`, `"use client"` | Flips React boundary |
| Form binding | `action={serverAction}`, `formAction={...}` | Breaks form submission |
| React hooks | `useActionState(...)`, `useTransition(...)`, `useState(...)`, `useEffect(...)`, `usePathname(...)`, `useSearchParams(...)` | Breaks state machine/client boundary |
| Redirects | `redirect("/path")`, `import { redirect } from "next/navigation"` | Breaks auth gating / routing |
| Data fetching | `supabase.from("...").select(...)`, `createServiceRoleClient()`, `supabaseAuthAdapter.getSession()`, `await service.from(...)` | Breaks page content |
| Route files | Creating/renaming/deleting `app/**/page.tsx` or `app/**/layout.tsx` | Routes created only by OpenCode |
| Server actions | Anything in `features/*/actions.ts` with `"use server"` | Business logic |
| Prop interfaces | Adding/removing/changing the TYPE of props | Parent components break |

### The safe zone in every file

In most files, the untouchable code is only the first 5–30 lines (imports, hooks, data fetching). Everything after that — the JSX returned — is yours. Example:

```tsx
// === DO NOT TOUCH (lines 1-35) ===
"use client";
import { useActionState } from "react";
import { logIn } from "@/features/auth/actions";

export function LoginForm() {                           // <-- keep function signature
  const [state, formAction, pending] = useActionState(logIn, null);
  const searchParams = useSearchParams();
  const pendingParam = searchParams.get("pending");
  // ...

  // === YOU CAN CHANGE EVERYTHING BELOW ===
  return (
    <main className="...">
      {/* Redesign this markup however you want */}
    </main>
  );
}
```

---

## Breakpoint Reference

| Prefix | Min width | Typical device |
|--------|-----------|---------------|
| (none) | 0px | Mobile (all phones) |
| `sm:`  | 640px | Large phones / small tablets |
| `md:`  | 768px | Tablets |
| `lg:`  | 1024px | Laptops / small desktops |
| `xl:`  | 1280px | Desktops |

The codebase uses **mobile-first** responsive design. Base styles are for mobile; prefixed classes override for larger screens.

---

## Per-File Map

Every UI file in the project, what it controls visually, and what's untouchable.

### App Shell

| File | Controls | Untouchable lines |
|------|----------|-------------------|
| `app/layout.tsx` | Root HTML shell, fonts, metadata, `<NavBar>` placement, `<MobileTabBar>` placement, `<PwaInstallPrompt>` | Lines 1–47 (imports, fonts, metadata, viewport, `async function RootLayout`, session fetch) |
| `components/NavBar.tsx` | Top nav bar — brand logo, category dropdown, auth links | Lines 1–23 (imports, category fetch, server component structure). The `Link href` values keep routes working. |
| `components/MobileNavMenu.tsx` | Hamburger slide-out panel — categories grid, auth links, sign-up CTA | Lines 1–42 (imports, `"use client"`, `useState`, `usePathname`, `useEffect` for scroll lock). `Link href` values. |
| `components/MobileTabBar.tsx` | Bottom fixed tab bar (mobile only) — 5 tabs with SVGs | Lines 1–18 (imports, `"use client"`, `usePathname`, `isActive` logic, tabs array creation). `Link href` values. |
| `components/PwaInstallPrompt.tsx` | PWA install banner (floating card) | Lines 1–31 (imports, `"use client"`, `useState`, `useEffect` with `beforeinstallprompt` listener) |
| `proxy.ts` | Middleware — auth gating, admin protection, unverified blocking | **DO NOT TOUCH THIS FILE AT ALL** — routes are defined here |

### Pages (app/**/page.tsx)

| File | Controls | Untouchable lines |
|------|----------|-------------------|
| `app/page.tsx` | Hero, search bar, CTAs, category rail, top suppliers grid, hot requests list, top champions, trust tiers explainer | Lines 1–107 (imports, TrustTier enum, `async function HomePage`, ALL `supabaseAuthAdapter.getSession()`, ALL `service.from(...)` queries, ALL data mapping). Link `href` values. `redirect()` calls. |
| `app/login/page.tsx` | Thin wrapper — imports `<LoginForm>` inside Suspense | Lines 1–11 (imports, metadata, `async function LoginPage`, Suspense wrapper) |
| `app/signup/page.tsx` | Sign-up form page | Lines 1–3 (`"use client"`), lines 8–15 (`useActionState`, `signUp`), `formAction` binding |
| `app/profile/page.tsx` | Profile header, display name form, reputation cards, finder's fees, sign-out | Lines 1–40 (imports, `async function ProfilePage`, `getSession`, `redirect("/login")`, ALL `service.from(...)` queries, `verified` check) |
| `app/suppliers/page.tsx` | Header with count, search/area filter form, category pill rail, supplier card grid | Lines 1–64 (imports, metadata, `async function SuppliersPage`, `searchParams`, ALL `service.from(...)` queries) |
| `app/suppliers/[id]/page.tsx` | Back link, supplier detail card, tier badge, photo grid, contact unlock button, supplier actions, related suppliers | Lines 1–110 (imports, metadata, `async function SupplierPage`, `getSession`, ALL `service.from(...)` queries, ALL data extraction) |
| `app/suppliers/[id]/edit/page.tsx` | Back link, `<EditSupplierForm>` | Lines 1–20 (imports, metadata, `async function EditSupplierPage`, `getSession`, `redirect`, `service.from(...)` query) |
| `app/suppliers/upload/page.tsx` | Back link, `<SupplierUploadForm>` with optional `answeringRequestId` | Lines 1–22 (imports, metadata, `async function UploadSupplierPage`, `getSession`, `redirect`, `searchParams`) |
| `app/requests/page.tsx` | Header with count, search/area form, category pill rail, request card list | Lines 1–58 (imports, metadata, `timeAgo`, `async function RequestsPage`, `getSession`, `redirect`, ALL `service.from(...)` queries, `isStale` helper) |
| `app/requests/[id]/page.tsx` | Back link, request detail, status badge, upvote button, answers list, confirm/reject buttons, flag button | Lines 1–140 (imports, metadata, `async function RequestPage`, `getSession`, `redirect`, ALL `service.from(...)` queries) |
| `app/requests/new/page.tsx` | Back link, `<RequestForm>` | Lines 1–16 (imports, metadata, `async function NewRequestPage`, `getSession`, `redirect` check) |
| `app/champions/page.tsx` | Podium display, ranked list, category browse grid | Lines 1–40 (imports, metadata, `async function ChampionsPage`, `getSession`, `redirect`, ALL `service.from(...)` queries) |
| `app/champions/[id]/page.tsx` | Champion profile header, reputation cards, championed suppliers list, finder's fees | Lines 1–50 (imports, metadata, `async function ChampionProfilePage`, ALL `service.from(...)` queries) |
| `app/champions/category/[slug]/page.tsx` | Category title, podium, ranked list, empty state | Lines 1–45 (imports, metadata, `async function CategoryLeaderboardPage`, `getSession`, `redirect`, ALL `service.from(...)` queries) |

### Admin Pages

All admin pages in `app/admin/*/page.tsx` share the same pattern:

| What's untouchable | What you can redesign |
|---------------------|----------------------|
| Lines 1–25: imports, metadata, `async function`, `service.from(...)` queries | The JSX returned — card layouts, badges, approve/reject button styling |

### Components

| File | Controls | Untouchable lines |
|------|----------|-------------------|
| `components/LoginForm.tsx` | Login page form | Lines 1–9 (imports, `"use client"`, `useActionState(logIn, null)`, `useSearchParams`, `pendingParam`). Keep the `<form action={formAction}>`. |
| `components/SupplierCard.tsx` | Supplier card — name, tier, area, category, rank badge | Lines 1–12 (imports, `TrustTier`, `supplierTierLabel`). Props interface signature. `Link href` uses `id` prop. |
| `components/CategoryRail.tsx` | Horizontal scrollable category pills | Lines 1–6 (imports, props interface `{ categories: { id, slug, name }[] }`). Link destination pattern: `href={`/suppliers?category=${cat.id}`}`. |
| `components/UnifiedSearch.tsx` | Search bar with autocomplete | Lines 1–14 (imports, `"use client"`, `useState` for query/open state, `useRouter`). `onSubmit` handler that calls `router.push(...)`. |
| `components/SupplierUploadForm.tsx` | Upload supplier form — name, category, area, phone, photos, attestations | Lines 1–35 (imports, `"use client"`, `useActionState(uploadSupplier, null)`, `useState` for categories/location, `useEffect` for fetching categories). Keep the `<form action={formAction}>`. |
| `components/EditSupplierForm.tsx` | Edit supplier form — pre-filled, same structure as upload | Lines 1–30 (imports, `"use client"`, `useActionState(editSupplier, null)`, `useState` for categories). Keep the `<form action={formAction}>`. |
| `components/DisplayNameForm.tsx` | Display name input form | Lines 1–8 (imports, `"use client"`, `useActionState(updateDisplayName, null)`). Keep the `<form action={formAction}>`. |
| `components/RequestForm.tsx` | Post request form — category, what, area, attestations | Lines 1–25 (imports, `"use client"`, `useActionState(postRequest, null)`, `useState` for categories/location, `useEffect`). Keep the `<form action={formAction}>`. |
| `components/ContactUnlockButton.tsx` | Unlock contact button with state | Lines 1–15 (imports, `"use client"`, `useTransition`, `useState` for unlocked state, `startTransition` call). Keep the `<form action={...}>`. |
| `components/SupplierActions.tsx` | Claim/edit/delist action buttons | Lines 1–20 (imports, `"use client"`, `useTransition`, `useState` for confirm states). Keep `<form action={...}>` bindings. |
| `components/UpvoteButton.tsx` | Upvote toggle button with count | Lines 1–18 (imports, `"use client"`, `useTransition`, `useState` for optimistic count, `startTransition`). Keep the server action call pattern. |
| `components/ConfirmRejectButtons.tsx` | Confirm/reject answer buttons | Lines 1–15 (imports, `"use client"`, `useTransition`, `useState`). Keep `<form action={...}>` bindings. |
| `components/FlagFindableButton.tsx` | Flag request as findable button | Lines 1–12 (imports, `"use client"`, `useTransition`). Keep server action call pattern. |
| `components/ui/StatusBadge.tsx` | Badge component — variant (amber/accent/indigo) + children | **FULLY YOURS TO REDESIGN** — no imports beyond React, no hooks, no data fetching. Keep the `variant` and `children` props. |
| `components/ui/RejectButton.tsx` | Reject button with inline server action | **DO NOT TOUCH THE `<form action={...}>`** — it contains a `"use server"` block. You can restyle the button itself. |
| `components/ui/AttestationFieldset.tsx` | Checkboxes for "couldn't find" attestations | Lines 1–2 (`"use client"`, `ATTESTATIONS` array). Keep the 5 checkboxes with their `name="unfindableAttestation"` and `value` keys — the server action reads these. |
| `components/DesktopStage.tsx` | Desktop-only animations — IntersectionObserver, card tilt, hero-atmos SVG | **FULLY YOURS** — this is purely visual. Can be removed, replaced, or redesigned. |

### Design System

| File | Controls | Notes |
|------|----------|-------|
| `app/globals.css` | Global CSS — design tokens, utility classes, component classes, decorations, responsive rules | **FULLY YOURS.** Overwrite the entire file. The app only depends on it for visual styling — not for functionality. Keep `@import "tailwindcss"` and `@theme inline { ... }` block structure. |

### Do NOT Touch

| File | Why |
|------|-----|
| `features/*/actions.ts` | Server actions — business logic, data writes |
| `domain/*` | Pure business rules, no UI |
| `infrastructure/*` | Supabase adapters, auth, storage |
| `config/*` | Typed config |
| `utils/supabase/*` | Supabase client factories |
| `supabase/migrations/*` | Database schema |
| `proxy.ts` | Middleware |
| `next.config.ts` | Build config |

---

## Handoff Protocol

When you hit something outside your territory, tell the user:

```
>> SWITCH TO OPENCODE

I need OpenCode to make a backend change before I can implement this design:

Task: [what needs to happen — e.g., "add an imageUrl field to the supplier query",
       "create a new /checkout route", "add a useState hook for this toggle"]

File: [which file or new file]

Why: [why you can't do this yourself — e.g., "this is a server action / data query"]
```

OpenCode uses the same protocol in reverse when it needs design:

```
>> SWITCH TO OPEN DESIGN — [file path] needs styling
```

---

## Git Safety Net

Before committing any design changes:

```bash
git diff                    # Review every change
git diff --name-only        # List changed files
git checkout -- <file>      # Revert a single file
git checkout .              # Revert everything
```

OpenCode handles commits. If something breaks, revert is one command away.

---

## Design Tokens Reference

Current design system (change freely — this is just reference, not constraint):

| Token | CSS Var | Use |
|-------|---------|-----|
| Background | `--bg: oklch(96% 0.014 82)` | Page bg |
| Surface | `--surface: oklch(99% 0.005 82)` | Cards, inputs |
| Foreground | `--fg: oklch(24% 0.02 55)` | Body text |
| Muted | `--muted: oklch(48% 0.014 60)` | Secondary text |
| Border | `--border: oklch(86% 0.012 70)` | Hairline borders |
| Accent (green) | `--accent: oklch(42% 0.1 165)` | Primary buttons, links |
| Accent dark | `--accent-ink: oklch(30% 0.09 165)` | Link color |
| Indigo (ajrak) | `--indigo: oklch(38% 0.13 265)` | Pills, Tier 2 |
| Indigo dark | `--indigo-ink: oklch(28% 0.1 265)` | Text variant |
| Terracotta | `--terracotta: oklch(60% 0.14 38)` | Upvotes, Tier 3 |
| Terra dark | `--terra-ink: oklch(48% 0.14 38)` | Error text, eyebrow |
| Gold | `--gold: oklch(74% 0.12 85)` | Tier 4, rank 1 |
| Card radius | `--r-card: 14px` | Card corners |
| Pill radius | `--r-pill: 999px` | Button/pill corners |
| Input radius | `--r-input: 12px` | Input corners |

Fonts: `--font-display` (Spectral), `--font-sans` (Geist), `--font-mono` (Geist Mono).

Current class patterns for reference: `.btn-primary`, `.btn-outline`, `.btn-reject`, `.card`, `.card-link`, `.badge-status`, `.tier-badge`, `.rank-badge`, `.cat-pill`, `.upvote`, `.input`, `.label`, `.display`, `.eyebrow`, `.ajrak-band`, `.ajrak-thin`, `.truck-dots`, `.rosette`, `.photo-placeholder`, `.mobile-tab-bar`, `.mobile-tab`, `.filter-rail`, `.showcase-section`.

---

## Test Login Credentials

Use these accounts to visually test the app at different auth states:

| Phone | Password | Role | Display Name | Verified |
|-------|----------|------|-------------|----------|
| `03001111111` | `password123` | user | Usman Malik | Yes |
| `03002222222` | `password123` | user | Fatima Iqbal | Yes |
| `03003333333` | `password123` | user | Ahmed Shah | Yes |
| `03004444444` | `password123` | user | Bilal Khan | Yes |
| `03005555555` | `password123` | user | (none) | No |
| (original admin) | (original password) | admin | Admin Sahab | Yes |
