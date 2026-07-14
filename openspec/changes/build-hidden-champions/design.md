## Context

Greenfield build of a PWA web application connecting frustrated buyers (who have already struck out searching online) with "hidden" Pakistani suppliers — informal workshops and small manufacturers that have no online presence and are reachable only via personal networks. The product is request-driven: a searcher posts a need they couldn't find anywhere online, and a "champion" (someone who personally knows an unfindable supplier) answers by uploading that supplier. The supplier directory grows as a byproduct of fulfilled requests.

Constraints that shape every decision:

- **No budget at launch.** Founder cannot spend on infra, paid acquisition, or user incentives. Free tiers only.
- **AI-buildable.** The codebase must be structured so an AI agent can implement it in small verify-able slices without each change rippling into others. This rules out monolithic code organization.
- **Pakistani market.** Low credit-card penetration, heavy WhatsApp usage, informal cash/WhatsApp deal flow, strong "help your own" community culture, weak display-ad CPMs.
- **One-time usage pattern for searchers.** Discovery is a single event; the searcher finds the supplier and the relationship continues off-platform via WhatsApp/phone. The app is not a daily-use product for searchers.
- **Heavy use for champions.** Champions check the request board regularly, upload photos on-site, want push notifications — this is the daily-use segment.
- **No deal tracking is possible.** B2B transactions in Pakistan happen on phone + WhatsApp + cash, entirely off-platform. The system cannot attribute actual deal value and must not try to.

Current state: nothing exists. No code, no schema, no users. This design defines the foundation.

## Goals / Non-Goals

**Goals:**

- Ship a working MVP that proves the core loop: frustrated searcher posts need → champion answers with unfindable supplier → directory grows → loop repeats.
- Build on free-tier infrastructure that scales to thousands of users without spend.
- Preserve SEO on the public supplier directory (the one free acquisition channel).
- Make phone-number data unscrapable (RLS-enforced, not just UI-hidden).
- Structure the codebase in update-friendly layers so AI can build and so future changes (payments, multi-city, native companion) slot in without rewrites.
- Make every tunable threshold config-driven (expiry window, rate limits, tier rules, stale-bounty days) so tuning the app does not require editing logic.
- Build a trust ladder that is robust to junk uploads without paid verifiers.
- Make the champion identity meaningful (specialist routing + reputation + "Championed by \_\_\_" attribution) to recruit better knowers without cash.
- Keep the founder's launch cost in time, not money: founder seeds the request board and manually verifies the first ~50-200 users.

**Non-Goals:**

- No payments, subscriptions, ads, or paid verifiers in MVP.
- No Tier 4 in-person verification in MVP.
- No multi-city expansion in MVP (Lahore only).
- No native mobile app in MVP (PWA only).
- No in-app messaging between users in MVP (contact reveal is the only connection mechanism).
- No reviews/ratings in MVP (premature without density).
- No deal tracking or transaction attribution — explicitly out of scope, not just deferred.
- No automated WhatsApp OTP in MVP (manual founder verification; WhatsApp OTP is a Phase 2 swap on the same data model).

## Decisions

### D1: Request-driven want-list as the hero feature, not a browse directory

**Decision:** The primary user-facing flow is posting and answering requests. The supplier directory is a _byproduct_ of fulfilled requests, surfaced as a secondary browse/search experience.

**Rationale:** A supply-driven directory needs thousands of listings before it is useful to any searcher — the cold-start problem kills it. A request-driven board is useful on day 1 with zero listings, because a posted request is itself seed content. This is the single most important unlock for a no-budget launch.

**Alternatives considered:**

- _Supply-driven directory (build listings first, search later):_ Rejected. Cold-start death. The first searcher sees 12 thin listings and never returns.
- _Both equally prominent:_ Rejected. Splits user attention and brand message at launch when focus is scarce.

### D2: Web/PWA over native mobile

**Decision:** Build as a Next.js PWA (service worker + web manifest). Defer native until a power-champion segment actively demands it.

**Rationale:**

- **SEO:** The public supplier directory must be Google-indexable for free acquisition. Native apps cannot be crawled by Googlebot. This was the deciding factor.
- **Searcher friction:** Searchers are one-time, already-frustrated users. An install barrier on top of three failed searches is a real conversion tax. A URL hits immediately.
- **Pakistani payment rails:** Suppliers will pay via JazzCash/EasyPaisa, not Apple/Google IAP. Web lets us meet them where their money already lives and keep ~97% vs ~70% with store cut. Low PK credit-card penetration makes store billing largely unusable for our supplier base anyway.
- **AI-buildable:** Next.js + Supabase is the most-represented stack in AI training data. Fewer hallucinations, faster build.
- **Champion needs met by PWA APIs:** Camera (`<input type="file" capture>` / `getUserMedia`), push notifications (Notification API + service worker), geo-tagging (`navigator.geolocation`), offline caching (service worker), home-screen install (PWA prompt). No native-only feature is missing for the champion use case.

**Alternatives considered:**

- _Native iOS + Android:_ Rejected. Zero SEO, install barrier for one-time users, 2x build cost, app-store review delays, 30% payment cut, PK payment-rail mismatch.
- _Web + native companion:_ Deferred. Power-champions may eventually want a native shell; build then. PWA covers all current needs.

### D3: Next.js + Supabase + Vercel stack

**Decision:** Next.js (App Router, React) for frontend, Supabase for Postgres + Auth + Storage + Row-Level Security + PostGIS + Edge Functions, Vercel for hosting. All free-tier at launch.

**Rationale:**

- **Next.js SSR/SSG:** Server-side rendering produces full HTML for Googlebot on supplier pages — direct enabler of the SEO goal. Client-only React (e.g. plain Vite) would not.
- **Supabase RLS:** Phone numbers can be made _unqueryable_ at the database level unless the requesting user passes the contact-gate. This is the technical foundation of the anti-scrape moat — UI hiding alone is bypassable by any scraper with a session.
- **PostGIS:** Native support for "suppliers near me" geo-queries, needed for the geo-tagged upload + area-filtered search.
- **Edge Functions:** Run Tesseract.js OCR on photo upload without a separate server. Stays in free tier.
- **Single backend choice:** Supabase bundles DB + auth + storage + functions, reducing integration surface for AI to build against.
- **AI familiarity:** This exact stack dominates AI training data — the highest-reliability build path.

**Alternatives considered:**

- _Firebase:_ Rejected. NoSQL limits the relational trust-ladder / matching / reputation queries. No RLS equivalent as clean as Postgres.
- _SvelteKit + Supabase:_ Rejected. SvelteKit is excellent but less represented in AI training data; build reliability matters more than framework elegance here.
- _Self-hosted Postgres + custom backend:_ Rejected. Operations cost the founder cannot afford at launch.

### D4: Four-layer architecture with feature-based vertical slices

**Decision:** Strict layering — `presentation` → `application` → `domain` → `infrastructure` — with dependencies flowing downward only. Within the application layer, organize by feature vertical (`/features/requests`, `/features/suppliers`, `/features/champions`, `/features/auth`, `/features/admin`). Domain layer is framework-free (no Next.js, no Supabase imports). Infrastructure is behind interfaces (swappable).

```
/app, /components        presentation   (Next.js App Router, UI only)
/features/*             application    (use cases — coordinate domain + infra)
/domain/*               domain         (pure entities & rules — framework-free)
/infrastructure/*       infrastructure (Supabase, OCR, auth — behind interfaces)
/config                 thresholds     (expiry, rate limits, tier rules, stale-bounty)
/supabase/migrations    schema         (versioned, ordered, reversible)
```

**Rationale:**

- **AI-buildable in slices:** Each feature vertical can be implemented and tested independently. A new feature is one folder, doesn't ripple.
- **Update-friendly:** Tuning thresholds = edit `/config`, no logic change. Swapping OCR provider = one file in `/infrastructure`. Changing tier rules = `/domain` only, UI/DB/infra untouched. Redesigning a page = `/app` + `/components` only, logic untouched.
- **Testable domain:** Business rules (trust tier transitions, request state machine, reputation math, matching policy) live in `/domain` with zero framework imports, so they are unit-testable in isolation and stable across framework upgrades.
- **Swappable infra:** Supabase client, OCR adapter, auth provider all sit behind interfaces in `/infrastructure`. Phase 2 swap from manual verification to WhatsApp OTP = one adapter change, domain/application untouched.

**Alternatives considered:**

- _3 layers (no separate domain):_ Rejected. Mixing business logic with framework code makes the trust-ladder and state-machine logic harder to test and more fragile to Next.js version bumps. The domain layer is small but essential.
- _Full hexagonal / ports-and-adapters:_ Rejected as over-engineered for MVP. The 4-layer approach captures most of the benefit (swappable infra, testable domain) without the port-definition boilerplate.

### D5: Phone-number signup with manual founder verification at MVP

**Decision:** User signs up with phone number only (no email required). Account starts in `pending` state. Founder is notified, personally texts the user to confirm, founder flips account to `verified` via admin panel. Only `verified` users can upload, answer requests, or unlock contacts. Data model is designed so the manual step is replaceable by WhatsApp Business OTP at Phase 2 with no schema change.

**Rationale:**

- **No money:** SMS OTP via Twilio costs ~$0.05/SMS — unaffordable at no-budget launch. Manual verification substitutes founder attention for automation, which works at MVP scale (first ~50-200 users).
- **Pakistani user base:** Email is weak here; phone is the universal identifier. WhatsApp OTP is the right Phase 2 automation (free, fits habits), but its Meta Business API setup is fiddly and AI is less reliable building it — defer.
- **Personal touch at launch:** Early users expecting a personal founder interaction is a feature, not a bug, for a community-driven product.
- **Same data model:** `users` table has `phone`, `verification_method` (`manual` | `whatsapp_otp`), `verified_at`, `verified_by`. Swapping methods changes one adapter, not the schema.

**Alternatives considered:**

- _Twilio SMS OTP from day 1:_ Rejected. Costs money the founder doesn't have. It's the only paid thing in the stack but it's still paid.
- _WhatsApp OTP from day 1:_ Deferred. Right technology, wrong time — setup complexity and AI-build reliability favor deferring to Phase 2.
- _Email OTP:_ Rejected. Most Pakistanis don't check email; trust signal is weak.

### D6: Trust ladder with four tiers, MVP implements Tiers 1-3

**Decision:** Every listing has a tier: 1 (single upload, no badge), 2 (corroborated by second independent knower), 3 (claimed by supplier via phone OTP to listed number), 4 (in-person verified — Phase 2 only). Tier controls visibility in search and the level of trust badge shown.

**Rationale:**

- **Solves verification without paid verifiers:** Trust accumulates with evidence (multiple knowers, supplier consent) instead of paid inspection.
- **Solves consent:** Supplier-claim at Tier 3 is the consent mechanism — the supplier takes over the listing by proving they control the listed phone number.
- **Routes around the documents trap:** Most informal Pakistani suppliers have no business registration. Demanding documents filters out the exact target user. This ladder doesn't require docs at lower tiers.
- **Filters gaming:** Junk uploads stay at Tier 1 with no contact info visible publicly and no payout — no benefit to faking them.
- **Tier 4 deferred:** In-person verification is a paid operation (verifier compensation or founder time). Phase 2.

**Alternatives considered:**

- _Binary verified/unverified:_ Rejected. Too coarse — loses the corroboration signal and the supplier-claim progression that drives onboarding.
- _Document-based verification:_ Rejected. Filters out the target user base.

### D7: Corroboration via phone-number auto-merge, fuzzy-match is admin-manual

**Decision:** When a champion uploads a supplier whose phone number exactly matches an existing listing, the system auto-merges the new upload into the existing listing and auto-bumps it to Tier 2. When name + area + geo are similar but phone differs, the case is flagged into the admin review queue for manual merge. No automated fuzzy matching at MVP.

**Rationale:**

- **Phone is the strongest identity signal in this market:** Pakistani suppliers identify themselves by phone. Same phone = same supplier, high confidence.
- **Fuzzy matching is a rabbit hole:** Name transliteration from Urdu/English variants, area-name ambiguity, geo-jitter all make fuzzy matching noisy and high-maintenance. At MVP volume (low double-digit uploads/day), admin manual review is faster to ship and more accurate than any automated matcher.
- **Duplicates are tolerable:** Some duplicates will exist until admin merges them. Not fatal — the directory still works.

**Alternatives considered:**

- _Automated fuzzy matching (name + area + geo within X meters):_ Deferred. Build when volume forces it. Risk of false merges is worse than risk of duplicate listings at MVP.

### D8: Contact gating via RLS + rate limits + verified-account requirement

**Decision:** Phone numbers are stored in a separate `supplier_contacts` table with Supabase RLS policies that deny SELECT to all users except: (a) the champion who uploaded the supplier, (b) the supplier themselves after claiming, (c) any `verified` user who has hit a "Request contact" action and is within their daily unlock quota. Rate limit: configurable in `/config` (e.g. 10 unlocks/day per user). No public page, no API endpoint, no client-side fetch can retrieve a phone number unless these conditions are met.

**Rationale:**

- **RLS is the moat, not UI hiding:** UI hiding (CSS, conditional rendering) is bypassable by any scraper with a session token and a network tab. RLS denies at the database level — the query returns no rows. This is the difference between a real anti-scrape layer and security theater.
- **Rate limits + verified-account requirement = anti-scraper:** A scraper would need to (a) be a verified account (founder-verified at MVP, hard to scale fake accounts) and (b) stay within 10 unlocks/day. Slow, detectable, uneconomical.
- **Future monetization lever:** The point of highest willingness-to-pay is the moment of contact reveal. Building the gate now means monetization is a config change later (paid tiers get higher quotas, or pay-per-unlock), not a re-architecture.

**Alternatives considered:**

- _Click-to-call proxy that never reveals the real number:_ Stronger anti-scrape but heavier build and breaks the Pakistani user habit of saving the number to contacts. Defer to a future hardening pass.

### D9: Hybrid OCR photo scan — auto-publish clean, hold risky for admin review

**Decision:** On photo upload, a Supabase Edge Function runs Tesseract.js OCR against the image. If a Pakistani phone-number pattern (e.g. `03XX-XXXXXXX`, `+92XX-XXXXXXX`) is detected, the photo is held in an admin review queue (not published on the supplier page). If no phone pattern is detected, the photo publishes instantly. Admin can approve / crop-and-replace / reject held photos. As a secondary signal, the detected phone (if any) is compared to the champion's typed phone for the listing — a match is a corroboration boost, a mismatch is flagged for review.

**Rationale:**

- **Closes the photo-scrape leak:** Supplier shopfront photos in Pakistan routinely display phone numbers on banners. Without OCR scan, every public photo becomes a phone-number firehose for any scraper with free OCR (Google Lens, Tesseract). The anti-scrape moat leaks out through the images.
- **Low champion friction for the majority:** Product photos, interior photos, work-in-progress photos contain no phone numbers and publish instantly — champions get the dopamine of "I posted, it's live."
- **Acceptable build cost:** Tesseract.js in an Edge Function is a known pattern AI can build reliably.
- **Honest weakness:** OCR will occasionally miss stylized/calligraphic numbers and those leak. At MVP volume the founder eyeballs enough listings to tune the regex and catch patterns. Acceptable, decreasing risk.

**Alternatives considered:**

- _Manual review of all photos:_ Rejected. Kills champion instant-gratification; they are unpaid, friction is unaffordable.
- _Full auto-blur:_ Rejected as more build than needed at MVP, with OCR occasionally blurring legit text or missing stylized numbers.
- _Forbid shopfront photos:_ Rejected. Loses the strongest anti-fake signal — a real workshop photo with its name on it is what proves the place exists.

### D10: Specialist reputation + deferred finder's fee, zero cash at launch

**Decision:** Champion reputation is earned per answered request (base rep) with a bonus on searcher confirmation and zero on rejection. Reputation is category-tagged — a champion who confirms 5 garment requests becomes "the garment guy" and gets push-routed to new garment requests first. Leaderboards surface top champions by category. The finder's fee is _recorded_ (a ledger entry: champion X is entitled to Y% of supplier Z's first-year paid-tier payment) but _not paid out_ at MVP, because no supplier is paying yet. The ledger pays out only at Phase 2+ when a supplier upgrades.

**Rationale:**

- **No money → no bounties, no per-upload cash:** Cash incentives without verification produce a junk flood. The zero-cash design is a feature, not a constraint — it accidentally recruits the right people (industry insiders with a stake in their supplier getting discovered) instead of the wrong people (students with time but no knowledge).
- **Specialist identity recruits better knowers:** "The copper guy" is an identity; "data contributor" is not. Routing by category affinity builds the identity automatically.
- **Deferred finder's fee has zero liability before revenue:** It only triggers when money is already flowing (supplier upgrades). No permanent cash liability on the books at launch.
- **Rejection signal does heavy lifting:** Confirmation rates will be low (searchers ghost after getting the contact). The reject signal is the main quality check that doesn't depend on searcher goodwill.

**Alternatives considered:**

- _Share-of-profits model:_ Rejected as unworkable. Deals happen off-platform; there is no observable transaction to share profits from.
- _Per-upload bounty:_ Rejected. Burns cash, attracts junk.
- _Pure altruism (no finder's fee):_ Rejected. The deferred fee is a meaningful long-term incentive that costs nothing now.

### D11: Request lifecycle — 7-day expiry, new-upload answers only, logged-in visibility, stale-bounty at day 4

**Decision:** A request has states: `draft`, `open`, `answered`, `confirmed`, `rejected`, `expired`, `flagged-closed`. Open requests auto-expire after 7 days. A "stale-bounty" reputation boost triggers at day 4 (before expiry) to pull champions to neglected requests. A champion answers by uploading a _new_ supplier (or a corroborating upload that merges into an existing one) — they cannot simply link an existing listing. Requests are visible only to logged-in users (not Google-indexed). Other searchers can upvote an existing open request to aggregate demand; high-upvote requests are worth more reputation to answer.

**Rationale:**

- **7-day expiry:** Balanced — long enough for weekly-checking champions to see it, short enough to prevent graveyard accumulation.
- **Stale-bounty at day 4 (not 7):** The boost needs time to attract a champion _before_ expiry closes the request. Day 4 gives a 3-day window.
- **New-upload answers only:** Forces fresh discovery and grows the directory with every answer. The "corroborating upload merges into existing" exception preserves this without creating duplicates.
- **Logged-in-only visibility:** Strengthens anti-scrape on the transient request content. Trade-off: kills SEO on requests, but the _supplier directory_ (the permanent asset) carries the SEO load instead. Public request titles for SEO can be revisited post-launch.
- **Upvote aggregation:** Aggregates demand, cuts duplicates, and forms a natural market — high-demand requests are worth more reputation, pulling champions to where demand is.

**Alternatives considered:**

- _Never expire:_ Rejected. Board becomes a graveyard over time; new searchers see dead posts and don't post.
- _14-day expiry:_ Rejected. Too slow; board feels stagnant.
- _Existing-listing answers allowed:_ Rejected. Slows directory growth and disincentivizes fresh discovery.

### D12: Public supplier directory SEO, contact gated

**Decision:** Supplier pages (Tier 2+ only) are public web pages, server-side rendered, indexed by Google. They show name, category, area, photos, tier badge, and champion attribution. Phone number is never on the public page — it is gated behind the contact-unlock flow (D8). Tier 1 listings are not public-indexed (visible only to logged-in users) to keep SEO surface showing only corroborated-or-better listings.

**Rationale:**

- **SEO is the only free acquisition channel:** `"stainless steel workshop Lahore"` typed by the next frustrated searcher should land on a supplier page. This is the compound free-growth loop.
- **Tier 2+ for public:** Tier 1 is single-knower, uncorroborated; exposing it to Google risks indexing unverified content. Tier 2 (corroborated) is the right floor for the public surface.
- **Contact gating coexists with SEO:** Everything except the phone number is safe to expose and valuable to index.

### D13: Config-driven thresholds

**Decision:** All tunable numbers live in `/config` (or a `config` table for runtime-tunable values): request expiry days (7), stale-bounty trigger day (4), stale-bounty multiplier (3x), contact-unlock daily quota (10), reputation weights (answered/confirmed/rejected/flagged), tier-promotion rules, leaderboard sizes, OCR phone-pattern regex. None of these are hardcoded in logic.

**Rationale:** Update-friendly. Tuning the app after launch (the thing the founder will do most) is editing config, not editing logic and redeploying. Some values can be runtime-tunable via a `config` table so the founder can tune from the admin panel without a deploy.

### D14: Data model sketch (key tables)

```
users
  id, phone, verification_method, verified_at, verified_by, role,
  reputation_total, created_at

categories
  id, slug, name, status (approved|pending), suggested_by, created_at

suppliers
  id, name, category_id, area, geopoint (PostGIS), created_at,
  tier (1|2|3|4), tier_updated_at, claimed_by_user_id, claimed_at

supplier_contacts          -- separate table for RLS gating
  supplier_id, phone, source (champion_typed|ocr_detected|claim_otp),
  added_by_user_id, added_at

supplier_photos
  id, supplier_id, storage_path, geopoint, exif_taken_at,
  ocr_status (clean|held|reviewed), ocr_detected_phone,
  published_at, reviewed_by, reviewed_at

listings                    -- the "champion uploads supplier" event
  id, supplier_id, champion_user_id, how_i_know_note,
  unfindable_attestations (jsonb), created_at
  -- a second listing for an existing supplier = corroboration → Tier 2

requests
  id, requester_user_id, what (text), category_id, area,
  unfindable_attestations (jsonb), upvotes, state, created_at,
  expires_at, stale_bounty_at, confirmed_at, answered_at

answers
  id, request_id, champion_user_id, supplier_id (newly uploaded),
  state (answered|confirmed|rejected), created_at, resolved_at

champion_reputation
  user_id, category_id, reputation_points, answered_count,
  confirmed_count, rejected_count

reputation_events
  id, user_id, category_id, event_type, points, request_id, created_at

finder_fee_ledger          -- records entitlement, pays out Phase 2+
  id, champion_user_id, supplier_id, fee_percent, triggered_at,
  paid_out_at, paid_amount

admin_queue
  id, item_type (photo|fuzzy_match|flag_findable|category_suggest|
                 user_verify|listing_moderation),
  item_id, status (pending|resolved|rejected), assigned_to,
  created_at, resolved_at

config                     -- runtime-tunable thresholds
  key, value (jsonb), updated_by, updated_at
```

## Risks / Trade-offs

- **[Risk] Response-side cold start — the request board becomes a graveyard of unanswered posts.** → Mitigation: founder seeds ~10-20 real requests + ~5 personally-vouched answers at launch (the board cannot open empty); stale-bounty reputation boost pulls champions to neglected requests at day 4; unanswered requests get _more_ visible over time via broadcast escalation, not less; auto-expiry at 7 days keeps the board clean.

- **[Risk] Manual founder verification doesn't scale past ~200 users.** → Mitigation: data model is designed for the Phase 2 swap to WhatsApp Business OTP with no schema change. The swap is one adapter replacement in `/infrastructure`. Trigger the swap when verification queue exceeds founder capacity.

- **[Risk] Champion specialist capture — one champion becomes "the copper guy," gets every copper request, others don't enter, category dies when he quits.** → Mitigation: routing widens the net for any request that the top specialist hasn't answered within N hours; leaderboard shows top 5 per category, not top 1, to keep multiple specialists visible; reputation system rewards _answered_ not just _first to answer_ so latecomers still earn.

- **[Risk] OCR misses stylized/calligraphic phone numbers on shopfront banners → phone leaks to public photo.** → Mitigation: at MVP volume, founder eyeballs enough listings to tune the OCR regex and catch patterns; secondary signal (OCR-detected phone vs champion-typed phone) flags mismatches for review; Tier 2+ requirement for public indexing means only corroborated listings reach Google, and the founder has reviewed those photos. Acceptable, decreasing risk.

- **[Risk] Junk uploads flood the directory at launch.** → Mitigation: Tier 1 listings have no contact info visible publicly and no payout — zero benefit to faking; unfindable attestation is a required field (forces the champion to claim they searched); geo-tag is the anti-fake signal (proves the champion was physically there); founder reviews all Tier 1→Tier 2 promotions; rejection signal zero-out on reputation punishes junk answers.

- **[Risk] Scrapers extract the directory via logged-in sessions at scale.** → Mitigation: RLS denies phone-number queries unless contact-unlock conditions are met; daily unlock quota (config: 10/day) caps any single account; verified-account requirement (manual at MVP) makes fake-account farming slow and detectable; rate-limit anomalies flagged to admin. Determined scrapers can still extract non-contact data (names, categories, areas) — accepted as lower-value leakage.

- **[Risk] Supplier consent — listing someone who doesn't know they're listed.** → Mitigation: Tier 3 claim flow is the consent mechanism (supplier takes over via phone OTP); right-to-be-delisted is a first-class admin action; Tier 1 listings are not Google-indexed (only Tier 2+), limiting exposure of unclaimed listings; phone number is never public until claim, so being listed doesn't expose the supplier's contact to scrapers.

- **[Risk] No-SEO-on-requests + no-budget launch = the first 200 users don't arrive.** → Mitigation: founder-driven distribution via personal network, WhatsApp trade groups, Lahore entrepreneurship communities, university entrepreneurship clubs; public supplier directory SEO kicks in once Tier 2+ listings accumulate (compound growth). This is a real founder-hustle cost, not a code cost — named explicitly so it doesn't surprise.

- **[Risk] Heavy-traffic promise cannot be honored on free tiers indefinitely.** → Mitigation: architecture is scale-capable (stateless Next.js on Vercel edge, Postgres on Supabase); free tiers cover thousands of users; the day revenue exists (Phase 2+ supplier upgrades), it funds paid tiers. The "withstand heavy traffic" goal is sequenced, not abandoned — build for it now, pay for it later.

- **[Trade-off] Logged-in-only requests sacrifice SEO on the hero feature.** → Accepted. The permanent supplier directory (Tier 2+) carries the SEO load instead. Public request _titles_ for SEO can be revisited post-launch if distribution is weak.

- **[Trade-off] No deal tracking means attribution is fuzzy.** → Accepted by design. The reputation system runs on answered/confirmed/rejected signals, not deal value. Chasing deal attribution would waste months and produce noisy data — explicit non-goal.

- **[Trade-off] Lahore-only, garments-seed launch is narrower than the founder's "all industries" instinct.** → Accepted as sequencing, not narrowing. The brand can still be "all of Lahore's hidden suppliers" but execution seeds one category to cross the density threshold, then expands. All-industries-from-day-1 dies the cold-start death.

## Migration Plan

Greenfield — no migration from existing systems. Deployment is initial launch.

**Pre-launch sequence:**

1. Build MVP per `tasks.md` (layered order: domain → infrastructure → application → presentation).
2. Founder collects ~10-20 real unfindable-supplier needs from known people (parallel to build — hustle work, not code).
3. Founder identifies ~5 hidden suppliers from personal network to seed as answers (parallel to build).
4. Seed the category taxonomy with ~25-30 flat granular categories (garments-heavy).
5. Deploy to Vercel + Supabase free tiers.
6. Founder seeds the request board with the collected requests and the vouched suppliers as answers.
7. Founder begins manual verification of first users (text each signup).
8. Founder drives first ~200 users via WhatsApp trade groups, personal network, Lahore entrepreneurship communities.

**Rollback strategy:** Since launch is greenfield and MVP-scope, rollback = take the app offline (Vercel unpause) and notify users. No data migration concerns at this scale. Database backups via Supabase automatic daily backups; point-in-time recovery available if bad data is inserted.

**Phase 2 swap points (not in this change):**

- Manual verification → WhatsApp Business OTP (one adapter in `/infrastructure`, no schema change).
- No payments → JazzCash/EasyPaisa for featured listings, verified badge, lead credits (new `/features/payments` vertical, new `payments` tables).
- Lahore only → multi-city (data model already has `area`; add `city` column).
- PWA only → native companion for power-champions (separate codebase, shares API).

## Open Questions

- **Exact reputation math weights** (answered = X, confirmed = Y, rejected = -Z, flag-as-findable = W). Decided to start simple (count of confirmed answers per category) and refine when gaming appears. Exact numbers to be tuned from `/config` after early launch data.
- **"Unfindable" strictness line** — does a dead 2019 Facebook page with 12 followers count as "findable"? Starting strict (any web presence = findable) and loosening with edge-case data. Boundary cases adjudicated by admin via the flag-as-findable review queue.
- **Lead-credit pricing and finder's-fee percentage** — explicitly deferred to Phase 2 design, not this change. Ledger records the entitlement now; pricing is decided when payments ship.
- **Go-to-market channel sequencing** — which WhatsApp trade groups, which Lahore subreddits/FB groups, in what order, with what messaging. Founder-hustle work, not a code or spec question. To be planned in parallel with build.
