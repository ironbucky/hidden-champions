## 1. Project setup and architecture scaffold

- [x] 1.1 Initialize Next.js project (App Router, TypeScript, Tailwind) in the repo root
- [x] 1.2 Create the four-layer folder structure: `/app`, `/components`, `/features`, `/domain`, `/infrastructure`, `/config`, `/supabase/migrations`
- [x] 1.3 Add `/config/index.ts` with typed config schema (request expiry days, stale-bounty day, stale-bounty multiplier, contact-unlock daily quota, reputation weights, leaderboard sizes, OCR phone regex) loading defaults from env + a `config` table fallback
- [ ] 1.4 Create Supabase project (free tier), record URL + anon key + service role key in `.env.local` (service role NEVER shipped to client)
- [x] 1.5 Install and configure Supabase client libraries (`@supabase/supabase-js`, `@supabase/ssr` for server-side session in Next.js App Router)
- [x] 1.6 Install Tesseract.js (`tesseract.js`) for Edge Function OCR
- [ ] 1.7 Set up Vercel project + connect repo, confirm preview deploys work
- [x] 1.8 Add PWA scaffold: `public/manifest.json`, service worker via `next-pwa` or hand-rolled, install prompt component, app icons
- [x] 1.9 Add ESLint + Prettier + TypeScript strict mode config; add a `lint` and `typecheck` npm script; document the commands in AGENTS.md for future AI sessions
- [x] 1.10 Add Vitest test runner configured for the `/domain` layer (framework-free, pure unit tests)

## 2. Domain layer — pure business rules (framework-free, no Next.js / Supabase imports)

- [x] 2.1 Define `TrustTier` enum (1, 2, 3, 4) and `trustTierPolicy` with pure functions: `canPromoteTo(fromTier, toTier, trigger)`, `tierRequiresPublicIndexing(tier)` returning true only for Tier 2+, `badgeForTier(tier)`
- [x] 2.2 Define `RequestState` enum (`draft`, `open`, `answered`, `confirmed`, `rejected`, `expired`, `flagged-closed`) and `requestStatePolicy` with `allowedTransitions(fromState)` returning the set of valid next states and `canAcceptAnswers(state)` returning true only for `open`
- [x] 2.3 Define `reputationPolicy` pure functions: `awardForAnswered(baseRep)`, `awardForConfirmed(baseRep, bonusRep, staleBountyMultiplier, isStale)`, `awardForRejected()`, `awardForFlagApproved(flagRep)` — all read weights from a passed-in config object, no globals
- [x] 2.4 Define `matchingPolicy` pure functions: `isExactPhoneMatch(a, b)` (normalized E.164 equality), `isFuzzyMatch(supplierA, supplierB)` (name similarity threshold + area similarity + geo within 100m), `shouldAutoMergeToFuzzy(a, b)` returning `'auto-merge' | 'fuzzy-flag' | 'distinct'`
- [x] 2.5 Define `expiryPolicy` pure functions: `computeExpiry(createdAt, days)` returning `expires_at`, `computeStaleBountyAt(createdAt, staleDay)` returning `stale_bounty_at`, `isStaleBountyEligible(request, now)` returning boolean
- [x] 2.6 Define `contactUnlockPolicy` pure functions: `canUnlock(user, dailyCount, quota)` returning boolean, `remainingQuota(dailyCount, quota)` returning integer
- [x] 2.7 Define `categoryPolicy` pure functions: `isApprovedCategory(category, approvedList)`, `canSuggest(proposedName, existingNames)` for duplicate-check on suggestions
- [x] 2.8 Write unit tests for every domain policy function covering all branches (happy path, edge cases, invalid transitions) — domain layer MUST hit 100% coverage before moving on

## 3. Database schema and migrations (Supabase Postgres)

- [x] 3.1 Create migration `0001_init_extensions` enabling `postgis` and `pgcrypto` extensions
- [x] 3.2 Create migration `0002_users` with `users` table (id uuid pk, phone text unique not null, verification_method text not null default 'manual', verified_at timestamptz null, verified_by uuid null, role text not null default 'user', reputation_total int not null default 0, display_name text null, created_at timestamptz not null default now())
- [x] 3.3 Create migration `0003_categories` with `categories` table (id, slug, name, status text check in approved|pending|rejected, suggested_by uuid, created_at) and seed ~25-30 flat granular categories (garments-heavy + cross-industry) with status `approved`
- [x] 3.4 Create migration `0004_suppliers_and_contacts` with `suppliers` table (id, name, category_id, area, geopoint geography, tier int check 1-4 default 1, tier_updated_at, claimed_by_user_id null, claimed_at null, deleted_at null, created_at) and separate `supplier_contacts` table (id, supplier_id, phone, source text check in champion_typed|ocr_detected|claim_otp, added_by_user_id, added_at) — suppliers has NO phone column
- [x] 3.5 Create migration `0005_photos` with `supplier_photos` table (id, supplier_id, storage_path, geopoint geography, exif_taken_at, ocr_status text check in clean|held|reviewed|rejected, ocr_detected_phone text null, published_at timestamptz null, reviewed_by uuid null, reviewed_at timestamptz null, created_at)
- [x] 3.6 Create migration `0006_listings` with `listings` table (id, supplier_id, champion_user_id, how_i_know_note text null, unfindable_attestations jsonb not null, created_at) — a second listing on an existing supplier represents corroboration
- [x] 3.7 Create migration `0007_requests_and_answers` with `requests` table (id, requester_user_id, what text, category_id, area, unfindable_attestations jsonb, upvotes int default 0, state text check in draft|open|answered|confirmed|rejected|expired|flagged-closed default 'open', created_at, expires_at, stale_bounty_at, answered_at null, confirmed_at null) and `answers` table (id, request_id, champion_user_id, supplier_id, state text check in answered|confirmed|rejected, created_at, resolved_at null)
- [x] 3.8 Create migration `0008_request_upvotes` with `request_upvotes` table (request_id, user_id, created_at, primary key (request_id, user_id))
- [x] 3.9 Create migration `0009_reputation` with `champion_reputation` table (user_id, category_id, reputation_points int default 0, answered_count int default 0, confirmed_count int default 0, rejected_count int default 0, primary key (user_id, category_id)) and `reputation_events` table (id, user_id, category_id, event_type text, points int, request_id uuid null, created_at)
- [x] 3.10 Create migration `0010_finder_fee_ledger` with `finder_fee_ledger` table (id, champion_user_id, supplier_id, fee_percent numeric not null, triggered_at timestamptz not null default now(), paid_out_at timestamptz null, paid_amount numeric null, unique (champion_user_id, supplier_id))
- [x] 3.11 Create migration `0011_contact_unlocks` with `contact_unlocks` table (id, user_id, supplier_id, unlocked_at timestamptz not null default now()) — used for RLS check + daily quota count
- [x] 3.12 Create migration `0012_admin_queue` with `admin_queue` table (id, item_type text check in photo|fuzzy_match|flag_findable|category_suggest|user_verify|listing_moderation, item_id uuid, status text check in pending|resolved|rejected default 'pending', assigned_to uuid null, created_at, resolved_at null, metadata jsonb null)
- [x] 3.13 Create migration `0013_config_table` with `config` table (key text pk, value jsonb not null, updated_by uuid, updated_at timestamptz default now()) and seed defaults for every tunable threshold matching `/config` defaults
- [x] 3.14 Create migration `0014_audit_log` with `audit_log` table (id, actor_user_id, action text, target_type text, target_id uuid, before jsonb null, after jsonb null, created_at) for admin action audit trail
- [x] 3.15 Create migration `0015_rls_users` enabling RLS on `users` with policy: users can SELECT their own row; admins can SELECT all; only admins can UPDATE verification fields and role
- [x] 3.16 Create migration `0016_rls_supplier_contacts` enabling RLS on `supplier_contacts` with the four policies from spec anti-scrape: (a) champion who added the contact can SELECT, (b) claimed_by_user_id can SELECT, (c) verified user with a row in `contact_unlocks` within their daily quota can SELECT, (d) admins can SELECT all
- [x] 3.17 Create migration `0017_rls_suppliers` enabling RLS on `suppliers` with policy: anyone (including unauthenticated) can SELECT Tier 2+ non-deleted suppliers; logged-in users can SELECT all non-deleted suppliers; champions can UPDATE only their own unclaimed listings' fields; claimed_by_user_id can UPDATE their claimed listing's editable fields; admins can UPDATE all
- [x] 3.18 Create migration `0018_rls_remaining` enabling RLS on `supplier_photos`, `listings`, `requests`, `answers`, `request_upvotes`, `champion_reputation`, `reputation_events`, `finder_fee_ledger`, `contact_unlocks`, `categories`, `admin_queue`, `config` with appropriate policies (logged-in users read most; verified users insert where applicable; admins read/write all; pending users read only public suppliers)
- [x] 3.19 Create migration `0019_storage_bucket` creating a private Supabase Storage bucket `supplier-photos` with policies: champions can upload to their own folder; anyone can read photos with `ocr_status = clean` and `published_at not null`; only admins can read `held` photos
- [ ] 3.20 Run all migrations against the dev Supabase instance and confirm schema + RLS policies are active

## 4. Infrastructure layer — adapters behind interfaces (in `/infrastructure`)

- [x] 4.1 Create `SupabaseClient` adapter interface and implementation (singleton server client using service role for trusted server operations, singleton browser client using anon key for user-scoped operations)
- [x] 4.2 Create `supabaseAuthAdapter` implementing an `AuthProvider` interface with methods `signUpWithPhone(phone)`, `getSession()`, `signOut()` — designed so the Phase 2 WhatsApp OTP swap replaces only this adapter
- [x] 4.3 Create `supabaseStorageAdapter` implementing a `PhotoStorage` interface with `upload(file, path)`, `getPublicUrl(path)`, `getPrivateUrl(path, expiresIn)`
- [x] 4.4 Create `supabaseDataAdapter` implementing a `DataGateway` interface with typed methods for each entity (findSupplierById, insertSupplier, insertSupplierContact, insertPhoto, searchSuppliers, etc.) — all RLS-protected queries go through here
- [x] 4.5 Create `tesseractOcrAdapter` implementing an `OcrScanner` interface with `scanForPhonePatterns(imageBuffer, regex): {detected: boolean, phone: string|null}` — runs in Supabase Edge Function context
- [x] 4.6 Create `configRepository` implementing a `ConfigRepository` interface with `get(key)`, `getAll()`, `set(key, value, userId)` — reads from `config` table with in-memory cache invalidated on write
- [x] 4.7 Create `geolocationAdapter` thin wrapper over `navigator.geolocation` for client-side capture (with permission-denied fallback) and a server-side PostGIS distance function for proximity queries
- [x] 4.8 Create `auditLogger` adapter writing to `audit_log` table for all admin actions
- [ ] 4.9 Write integration tests for each adapter against a test Supabase instance (use local Supabase CLI for CI)

## 5. Auth and verification feature (`/features/auth`)

- [x] 5.1 Sign-up page: phone input with Pakistani format normalization to E.164 client-side, submits to `supabaseAuthAdapter.signUpWithPhone`, shows "pending verification" state
- [x] 5.2 Login page: phone input identifying existing account, restores session via `supabaseAuthAdapter.getSession`
- [x] 5.3 Server-side session middleware for App Router: attach user to request, block gated routes for `pending` users with "pending verification" message
- [x] 5.4 Profile page: display name set/update (reject phone-pattern display names per spec), view verification status, view own contributions + reputation + finder's-fee ledger
- [x] 5.5 Sign-up notification to founder: on new pending user, insert an `admin_queue` row of type `user_verify` — the founder's admin panel lights up
- [ ] 5.6 E2E test: signup → pending → admin verifies → user can perform gated actions

## 6. Suppliers feature (`/features/suppliers`)

- [x] 6.1 Upload form with the 7 required fields: name, category (select from approved), area, phone (captured but never displayed back), photo (file input with `capture` attr for mobile camera), geo-tag (auto-captured on submit via `geolocationAdapter`), unfindable attestation checkboxes; optional "how I know" note
- [x] 6.2 Upload submission flow: insert `suppliers` row at Tier 1, insert `supplier_contacts` row, upload photo to storage, insert `supplier_photos` row with `ocr_status = pending`, trigger OCR Edge Function, create `listings` row attributing champion, create `finder_fee_ledger` row (only for new suppliers, not corroborations)
- [x] 6.3 Corroboration-on-upload flow: before inserting, run `matchingPolicy.shouldAutoMergeToFuzzy` against typed phone; if exact match exists, do not create new supplier — insert a second `listings` row on the existing supplier, promote existing supplier to Tier 2, award corroboration reputation event to the second champion, do NOT create new finder's-fee ledger entry
- [x] 6.4 Fuzzy-match flagging flow: if `shouldAutoMergeToFuzzy` returns `fuzzy-flag`, create the new supplier at Tier 1 AND insert an `admin_queue` row of type `fuzzy_match` referencing both supplier IDs
- [ ] 6.5 Public supplier page (SSR, indexable) for Tier 2+: render name, category, area, photos (only `clean` and `published_at not null`), tier badge, "Championed by [display name]" attribution; NO phone anywhere in HTML; JSON-LD schema for LocalBusiness without telephone
- [ ] 6.6 Tier 1 supplier page (noindex, logged-in only): renders same fields but with noindex meta + login redirect for unauthenticated visitors
- [ ] 6.7 Supplier search page (SSR): full-text search on name/category, filter by category, filter by area, geo-proximity ordering using PostGIS, results exclude Tier 1 and deleted suppliers, ordered by tier then recency
- [ ] 6.8 Claim flow: user clicks "Claim this listing" on a supplier page, system initiates OTP send to the listed phone (MVP: notify founder admin to relay OTP manually via `admin_queue` type `user_verify` with metadata; Phase 2: WhatsApp adapter sends directly), on verified OTP set `claimed_by_user_id`, promote to Tier 3, grant edit rights
- [ ] 6.9 Claimed supplier edit form: edit name, area, photos, business hours, category; NOT editable: original champion attribution, listing deletion (delist goes through admin queue per spec)
- [ ] 6.10 Delisting request flow: claimed supplier clicks "Request delisting" → inserts `admin_queue` type `listing_moderation` with reason `delist_request` → listing is hidden from public view pending admin action
- [x] 6.11 Category suggestion flow during upload: if champion's typed category is not in approved list, allow submit-as-suggestion → insert `categories` row with status `pending` → insert `admin_queue` type `category_suggest` → upload proceeds with placeholder category id
- [ ] 6.12 E2E test: champion uploads supplier → photo goes through OCR (mock for test) → supplier appears at Tier 1 → second champion uploads same phone → auto-merges to Tier 2 → supplier page goes public and indexable

## 7. Champions feature (`/features/champions`)

- [ ] 7.1 Reputation event writer: on `answered` insert `reputation_events` row + upsert `champion_reputation` incrementing answered_count and reputation_points for the request's category; on `confirmed` add bonus; on `rejected` revoke the base points (set to 0 for that event) and increment rejected_count
- [ ] 7.2 Category-affinity routing query: function `topChampionsForCategory(categoryId, limit)` returning champions ranked by `champion_reputation.reputation_points` for that category — used by request notification flow
- [ ] 7.3 Push notification sender: on new request in category C, send push to top-N champions (PWA Notification API via service worker; for MVP, since push requires VAPID setup, fall back to in-app "new requests for your specialties" banner on next visit if push infra is not ready)
- [ ] 7.4 Escalation worker: cron/scheduled function checking `open` requests past their escalation window → widen notification pool to additional champions and bump browse prominence (sort weight)
- [ ] 7.5 Leaderboard pages: per-category top-N + global top-N, public to logged-in users, display name + reputation + counts
- [ ] 7.6 Champion public profile page: display name, top specialist categories, aggregate contribution counts; NO phone or contact info; SSR for shareability
- [ ] 7.7 "Championed by" attribution component used on every supplier page (Tier 1 and public Tier 2+) linking to champion profile
- [ ] 7.8 Finder's-fee ledger view in profile: list of pending entitlements with "payouts begin when paid tiers launch" note, no payout amounts shown
- [ ] 7.9 E2E test: champion answers request → requester confirms → champion's category reputation increments by (base + bonus) → leaderboard reflects new rank

## 8. Requests feature (`/features/requests`)

- [ ] 8.1 Post request form: what (free text + auto-suggest similar open requests), area, unfindable attestation checkboxes (at least one required), optional notes; on submit create `requests` row in `open` state with `expires_at` and `stale_bounty_at` computed by `expiryPolicy`
- [ ] 8.2 Similar-requests suggestion: debounced query against `open` requests matching the typed `what` text; show "this might be the same need — upvote instead?" prompt
- [ ] 8.3 Request board page (logged-in only, noindex): list `open` requests with inverted visibility decay sort, filters by category and area, no `expired`/`confirmed`/`rejected`/`flagged-closed`
- [ ] 8.4 Request detail page (logged-in only, noindex): shows full request, upvote control, answer submission (links to supplier upload form pre-filled with the request's category/area), confirm/reject controls for the requester
- [ ] 8.5 Upvote flow: insert `request_upvotes` row (unique per user per request), increment `requests.upvotes`; toggle to withdraw
- [ ] 8.6 Answer submission flow: from a request page, champion clicks "Answer with a supplier" → routes to supplier upload form with `answering_request_id` in state → on successful upload (per suppliers feature), insert `answers` row linking request and new supplier, transition request to `answered`, award base reputation via champions feature
- [ ] 8.7 Confirm/reject flow: requester clicks confirm → transition request to `confirmed`, award confirmation bonus via champions feature; requester clicks reject → transition back to `open`, detach answer (set answer state `rejected`), revoke base reputation
- [ ] 8.8 Auto-expiry scheduled function: cron scans `open` requests past `expires_at` → transition to `expired`, remove from board
- [ ] 8.9 Stale-bounty scheduled function: cron scans `open` requests at `stale_bounty_at` → set a `stale_bounty_active` flag used by reputation calc and visual indicator on the request
- [ ] 8.10 Flag-as-findable flow: champion clicks "This is actually findable" on a request → form requires a link → inserts `admin_queue` type `flag_findable` with the link in metadata → request stays `open` until admin approves/rejects
- [ ] 8.11 Escalation sort weight: browse board sort incorporates `stale_bounty_active` flag and age so aged unanswered requests rise in prominence
- [ ] 8.12 E2E test: searcher posts request → champion answers → searcher confirms → request transitions through `open`→`answered`→`confirmed` with reputation awarded at each step

## 9. Anti-scrape feature (`/features/anti-scrape`)

- [ ] 9.1 OCR Supabase Edge Function `scan-photo-ocr`: receives photo storage path, fetches image, runs `tesseractOcrAdapter.scanForPhonePatterns` with regex from `configRepository`, updates `supplier_photos.ocr_status` to `clean` (publish + set `published_at`) or `held` (insert `admin_queue` type `photo`), stores `ocr_detected_phone`; on OCR failure mark `held` (fail-safe)
- [ ] 9.2 OCR-vs-typed comparison: after OCR, if a phone was detected, compare to the typed phone for the same supplier → record corroboration signal on supplier if match → annotate admin-queue item with "OCR matches" or "OCR mismatch" if no match
- [ ] 9.3 Contact-unlock action endpoint: verified user clicks "Request contact" → server checks `contactUnlockPolicy.canUnlock` against today's unlock count for the user → if allowed, insert `contact_unlocks` row → RLS now permits the user to SELECT from `supplier_contacts` for this supplier → return the phone
- [ ] 9.4 Daily quota counter: query `contact_unlocks` count for the user in the current 24h window (or rolling day); enforce in the unlock endpoint and surface remaining quota in the UI
- [ ] 9.5 Rate-limit anomaly monitor scheduled function: scan `contact_unlocks` for users approaching quota on N consecutive days (config) or unlocking across more than the configured threshold of distinct categories in 24h → insert `admin_queue` type `user_verify` with reason `quota_anomaly` or `cross_category_anomaly`
- [ ] 9.6 Public-supplier-page audit test: automated test fetches every public supplier page and asserts no phone number appears in HTML, JSON-LD, or alt attributes (regression guard against future leaks)
- [ ] 9.7 E2E test: champion uploads photo containing a phone pattern in the image → OCR detects → photo held → admin approves/crops → photo publishes; verified user unlocks contact → phone visible; pending user blocked

## 10. Admin feature (`/features/admin`)

- [ ] 10.1 Admin panel route protection: middleware checks `users.role = 'admin'` for all `/admin/*` routes; non-admins redirected
- [ ] 10.2 Admin dashboard: counts of pending items per queue type, links to each queue
- [ ] 10.3 Photo review queue UI: list `admin_queue` type `photo` items, show the held photo, show OCR-detected phone (admin-only), buttons: Approve / Crop-and-replace (in-browser cropper) / Request re-upload / Reject; actions update `supplier_photos` and resolve the queue item with audit log
- [ ] 10.4 Fuzzy-match review queue UI: list `admin_queue` type `fuzzy_match`, show both suppliers side-by-side (name, area, phone-redacted-but-visible-to-admin, geo on a mini-map), buttons: Merge / Distinct; merge reattributes newer listing as corroboration on the older supplier, promotes to Tier 2, soft-deletes newer supplier
- [ ] 10.5 User verification queue UI: list `admin_queue` type `user_verify`, show phone, "Open WhatsApp" / "Dial" links, Verify / Reject buttons; verify sets `verified_at` + `verified_by`; reject deletes pending account with audit log
- [ ] 10.6 Flag-as-findable review queue UI: list `admin_queue` type `flag_findable`, show original request + flagging champion + provided link, Approve (transition request to `flagged-closed`, award flag reputation) / Reject (leave `open`, no award)
- [ ] 10.7 Category suggestion review queue UI: list `admin_queue` type `category_suggest`, show suggested name + existing similar categories, Approve (optionally rename) / Reject; approve makes category selectable and updates placeholder-attributed uploads
- [ ] 10.8 Listing moderation queue UI: list `admin_queue` type `listing_moderation`, show listing + reason, Approve delist (soft-delete) / Edit listing / Dismiss; hard-delete button MUST NOT exist
- [ ] 10.9 Config tuning UI: list all `config` rows, edit values (typed form per key: int for quotas, numeric for multipliers, text for regex), save → update `config` table → invalidate cache; changes take effect immediately for new actions
- [ ] 10.10 E2E test: founder admin navigates each queue, performs each action, verifies the corresponding downstream state change and audit log entry

## 11. PWA, SEO, and final integration

- [ ] 11.1 Service worker: cache static assets and supplier directory pages for offline viewing; push notification handler for "new request in your specialty" (or in-app banner fallback)
- [ ] 11.2 Web manifest: name "Hidden Champions", icons, theme color, display standalone, start URL
- [ ] 11.3 Install prompt component: surface the PWA install prompt for returning champions; explain "install for faster uploads and notifications"
- [ ] 11.4 Sitemap: generate `sitemap.xml` including all Tier 2+ public supplier pages and the home + search pages; explicitly exclude request pages (noindex + not in sitemap)
- [ ] 11.5 `robots.txt`: allow crawling of supplier directory and public pages; disallow `/requests`, `/admin`, `/login`, `/signup`, `/profile`
- [x] 11.6 Home page: brand positioning ("Lahore's hidden suppliers, findable here"), hero CTA to post a request, secondary link to browse the directory, leaderboard teaser
- [ ] 11.7 SSR audit: confirm Tier 2+ supplier pages render full content server-side (curl the URL, verify name/category/area appear in raw HTML); confirm Tier 1 pages return noindex
- [ ] 11.8 Lighthouse PWA + SEO audit pass: PWA installable, SEO score green on supplier pages
- [ ] 11.9 End-to-end happy path test: signup (mock verify) → post request → another user (mock verify) answers by uploading supplier with photo → OCR passes → request answered → requester confirms → supplier at Tier 1 → second champion uploads same phone → auto-merge to Tier 2 → supplier page now public + indexable → third verified user unlocks contact → phone visible only to them

## 12. Pre-launch content and go-to-market (founder hustle, not code)

- [ ] 12.1 Manually insert the founder as the first `admin` role user in the database (SQL insert or admin seeding script)
- [ ] 12.2 Founder collects ~10-20 real unfindable-supplier needs from people in their network (WhatsApp, calls, in-person) — document each as a request draft ready to post on launch day
- [ ] 12.3 Founder identifies ~5 hidden suppliers from their personal network to seed as answers — collect name, category, area, phone, photo, geo-tag for each, ready to upload on launch day
- [ ] 12.4 On launch day: deploy to Vercel production, run all migrations on the production Supabase instance, seed the request board with the collected requests, seed the 5 vouched suppliers as answers (creating the first Tier 1 listings)
- [ ] 12.5 Founder begins manual user verification: monitor the user_verify admin queue, text each new signup via WhatsApp, verify in admin panel
- [ ] 12.6 Founder drives first ~200 users: post in personal WhatsApp trade groups, Lahore entrepreneurship communities (FB groups, university entrepreneurship clubs), personal network outreach; track which channel produces the most verified signups
- [ ] 12.7 After first 50 verified users: review OCR regex effectiveness on held photos, tune via admin config panel if patterns are being missed
- [ ] 12.8 After first 100 verified users: review fuzzy-match queue volume, decide if/when automated fuzzy matching becomes worth building
- [ ] 12.9 Set up Vercel + Supabase free-tier usage monitoring alerts (Vercel bandwidth, Supabase DB size + auth + storage) so the founder knows when free-tier limits are approaching and a paid tier or revenue is needed
