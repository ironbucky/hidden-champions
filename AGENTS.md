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
