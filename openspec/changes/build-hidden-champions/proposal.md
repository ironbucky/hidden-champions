## Why

Pakistan's informal manufacturing and supplier economy is invisible online. Workshops, fabricators, small manufacturers, and cottage producers in cities like Lahore exist on personal networks and foot traffic, not the internet. A trader or SME that needs "a thin copper sheet supplier three blocks away" can search Google, Google Maps, IndiaMART, and ask around — and still find nothing, because the supplier has no online presence at all. There is currently no channel whose explicit job is to surface these _unfindable_ suppliers. Generic "local supplier" directories compete with Google Maps and lose; the defensible position is the directory of suppliers you cannot find anywhere else.

This change builds that directory, request-driven and crowd-sourced, with no cash cost at launch.

## What Changes

- **New hero feature: request-driven want-list.** A frustrated searcher who has already struck out online posts what they need (e.g. "thin copper sheet in Lahore, searched Google/Maps/IndiaMART, no luck"). Champions who personally know unfindable suppliers answer by uploading that supplier. Solves the supply-side cold-start: the app is useful on day 1 with zero listings, because a posted request is itself seed content.
- **New supplier directory as a byproduct.** Every fulfilled request grows a permanent, public, SEO-indexed directory of hidden suppliers. Supplier pages show name, category, area, photos, tier, and champion; phone numbers are gated behind login + rate limits + verified-account requirement.
- **New trust ladder (Tiers 1-4).** A listing starts at Tier 1 (single upload, no badge, contact gated). It moves to Tier 2 when corroborated by a second independent knower (phone-number auto-merge). Tier 3 when the supplier claims the listing via phone OTP. Tier 4 is a future in-person verification tier, out of MVP scope.
- **New champion incentive model (zero cash).** Champions are recruited via specialist reputation + community cause + a _deferred_ finder's fee that triggers only when an uploaded supplier later upgrades to a paid tier (Phase 2+). No bounties, no per-upload payments, no permanent liability before revenue exists.
- **New anti-scrape layer.** Phone numbers never appear on public pages (enforced via Supabase Row-Level Security, not just UI hiding). Supplier photos are OCR-scanned on upload via Tesseract.js; photos with detected phone patterns are held for admin review, all others publish instantly.
- **New auth model.** Phone-number signup with manual founder verification at MVP (the founder personally texts each new user to confirm), switching to WhatsApp Business OTP at Phase 2. "Verified account" status gates contact unlock and upload rights.
- **New platform: PWA (web-first, installable).** Web/PWA chosen over native for: full SEO on the public directory (the one free acquisition channel), lowest friction for one-time frustrated searchers, direct Pakistani payment rails (JazzCash/EasyPaisa, keeping ~97% vs ~70% with app-store IAP), and fastest AI-buildable path. Champions get camera, push, and offline via PWA APIs — no app store, no install barrier.
- **New layered architecture.** Four-layer design (presentation / application / domain / infrastructure) with feature-based vertical slices, config-driven thresholds, and versioned DB migrations, so the app is update-friendly and AI can build it in small verify-able slices without each change rippling.
- **Out of MVP scope (Phase 2+):** payments (featured listings, verified badge, lead credits), display ads, in-person Tier 4 verification, multi-city expansion, native companion app, messaging between users, reviews/ratings, automated WhatsApp OTP.

## Capabilities

### New Capabilities

- `requests`: The request-driven want-list — posting needs, browsing open requests, answering by uploading an unfindable supplier, the request lifecycle (open/answered/confirmed/rejected/expired/flagged-closed), upvote aggregation, stale-bounty boost, 7-day auto-expiry, ghost-town defenses, and the unfindable-attestation gate at post time.
- `suppliers`: The supplier directory — listings with the 7 required upload fields (name, category, area, phone, photo, geo-tag, unfindable attestation), the 4-tier trust ladder, corroboration matching (phone-auto-merge to Tier 2, fuzzy-match flagged for admin), supplier-claim flow, public SEO-indexed supplier pages with contact gated, and flat-granular category taxonomy (~25-30 categories, admin-controlled).
- `champions`: Champion accounts, upload rights, specialist reputation earned via answered/confirmed requests, category-affinity routing (specialists get pushed first in their categories), champion identity shown on listings ("Championed by \_\_\_"), leaderboards, and the deferred finder's-fee ledger (records entitlement, pays out only at Phase 2+ when supplier upgrades).
- `auth-verification`: Phone-number signup, manual founder verification flow at MVP (account starts "pending", founder texts user, founder flips to "verified" via admin), verified-account status as the gate for upload rights and contact unlock, and the planned Phase 2 swap to WhatsApp Business OTP (same data model, automated).
- `anti-scrape`: Contact-reveal gating (rate-limited, verified-account-required), Supabase Row-Level Security policies that make phone numbers unqueryable unless the requesting user passes the gate, photo OCR scan on upload (Tesseract.js in Supabase Edge Function) with auto-publish for clean photos and admin-hold for photos with detected phone patterns, and the secondary OCR-vs-typed-phone corroboration signal.
- `admin`: Admin tools — photo review queue (approve/crop/blur/reject), fuzzy supplier-match review queue, manual user verification, flag-as-findable review (community flags a request as out-of-scope when the supplier is actually findable online), taxonomy management (approve/reject champion-suggested categories), and listing moderation (edit/take-down/merge).

### Modified Capabilities

<!-- None. Greenfield project — no existing specs to modify. -->

## Impact

- **New codebase.** No existing code; this change creates the entire application from scratch.
- **Tech stack:** Next.js (React, App Router, SSR/SSG for SEO) + Supabase (Postgres, Auth, Storage, Row-Level Security, PostGIS, Edge Functions) + Vercel (hosting, free tier). PWA via service worker + web manifest.
- **Architecture:** Four layers — `/app` and `/components` (presentation), `/features/*` (application, feature-based vertical slices), `/domain/*` (framework-free business rules — trust tiers, request states, reputation, matching policies), `/infrastructure/*` (Supabase client, OCR adapter, auth, storage — all behind swappable interfaces). Config-driven thresholds in `/config` (expiry window, rate limits, tier rules, stale-bounty days). Versioned Supabase migration files for schema.
- **External dependencies:** Supabase (free tier), Vercel (free tier), Tesseract.js (OCR, runs in Edge Function), JazzCash/EasyPaisa APIs (Phase 2 only, not in MVP build).
- **Data:** New Postgres schema — users, suppliers, listings, requests, answers, champion_reputation, leaderboards, photos, admin_queue, taxonomy, migrations.
- **Operational:** Founder must seed the request board with ~10-20 real unfindable-supplier needs from known people, plus ~5 personally-vouched hidden suppliers as seeded answers, before public launch. Without this the board launches dead. Founder must also personally verify the first ~50-200 users by text. Both are founder-hustle costs, not code costs.
- **Launch scope:** Lahore only, garments as the dense seed category (with the all-industry brand surface preserved via ~25-30 flat categories), no payments, no paid verifiers, no ads, no native app.
