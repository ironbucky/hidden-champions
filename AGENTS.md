<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Hidden Champions — Agent Guide

## Project

Greenfield Next.js 16 PWA connecting frustrated buyers in Lahore with "hidden" informal suppliers. Built with Next.js App Router, TypeScript, Tailwind CSS v4, Supabase, and Vitest.

## Available commands

- `npm run dev` — start the Next.js dev server
- `npm run build` — production build
- `npm run start` — start production server
- `npm run lint` — run ESLint
- `npm run lint:fix` — run ESLint with auto-fix
- `npm run format` — format with Prettier
- `npm run format:check` — check formatting
- `npm run typecheck` — run TypeScript without emitting
- `npm run test` — run Vitest in watch mode
- `npm run test:domain` — run domain-layer unit tests once
- `npm run test:coverage` — run Vitest with coverage

## Architecture

Four-layer, feature-sliced structure:

- `/app`, `/components` — presentation (Next.js App Router, UI components)
- `/features/*` — application use cases coordinated by feature (auth, suppliers, champions, requests, admin, anti-scrape)
- `/domain/*` — framework-free business rules and pure functions
- `/infrastructure/*` — swappable adapters for Supabase, OCR, auth, storage
- `/config` — typed config schema and defaults
- `/supabase/migrations` — versioned database migrations

## Important conventions

- Domain layer MUST NOT import Next.js, React, or Supabase. Keep it pure and unit-testable.
- Infrastructure adapters sit behind interfaces so they can be swapped (e.g., manual verification → WhatsApp OTP in Phase 2).
- Phone numbers live only in `supplier_contacts`, never in `suppliers`.
- All config thresholds are typed in `/config` and runtime-tunable via the `config` table.
- Run `npm run test:domain` and `npm run typecheck` before considering a slice complete.

## Design layer (Open Design owns the visual layer)

This project uses an external design tool (v0.dev / bolt.new) for all visual work. Open Design reads `DESIGN.md` in the project root for context.

### What Open Design owns

- All markup (JSX structure), Tailwind classes, `app/globals.css`
- All responsive design decisions — mobile vs desktop, breakpoint choices
- Colors, typography, spacing, shadows, border radii, animation
- Component styling, hover/focus/active states, loading skeletons, empty states
- SVG icons, decorative elements, imagery

### What OpenCode owns (do not let design tools touch)

- Import statements, `"use server"` / `"use client"` directives
- React hooks: `useActionState`, `useTransition`, `useState`, `useEffect`, `usePathname`, `useSearchParams`
- `form action={...}` / `formAction={...}` bindings
- `redirect("/path")` calls — these gate auth and routing
- ALL data fetching: `supabase.from(...)`, `createServiceRoleClient()`, `supabaseAuthAdapter.getSession()`
- Component props interface signatures — adding/removing/changing TYPE of props
- Server actions in `features/*/actions.ts`
- Route creation/deletion (new `app/**/page.tsx` files)
- Middleware (`proxy.ts`)
- Domain layer (`domain/*`), infrastructure (`infrastructure/*`), config (`config/*`)

### When creating new components or pages

1. Build the scaffold with correct imports, hooks, data fetching, and props
2. Add a prominent `{/* TODO: OPEN DESIGN — style this component */}` placeholder
3. Tell the user: `>> SWITCH TO OPEN DESIGN — [file path] needs styling`
4. Do NOT add Tailwind classes to new components — leave styling for Open Design

### When Open Design needs backend changes

If you receive a request like "Open Design needs [X] to implement this design", create the scaffold and hand back.

### Handoff format

```
>> SWITCH TO OPEN DESIGN
File: [path]
Needs: [what styling is required]
Current state: [what's already built]

>> SWITCH TO OPENCODE
Task: [backend change needed]
File: [path]
Reason: [why Open Design can't do it]
```

### Git safety

- All design changes are tracked in git. `git diff` before committing to review.
- If Open Design's output breaks functionality, revert with `git checkout -- <file>`.
- If Open Design creates new files that conflict, `git status` will show them as untracked.
