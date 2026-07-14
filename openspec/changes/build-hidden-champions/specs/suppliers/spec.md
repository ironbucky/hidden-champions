## ADDED Requirements

### Requirement: Champion uploads a supplier with the 7 required fields

The system SHALL allow a verified champion to upload a supplier listing. The upload MUST include all 7 required fields: (1) supplier name, (2) category (selected from the approved category list), (3) area (Lahore neighborhood), (4) phone number (stored in the gated `supplier_contacts` table, never public), (5) at least one photo, (6) geo-tag auto-captured at upload time, (7) unfindable attestation (checkbox asserting the champion searched online and could not find this supplier). An optional "how I know them" free-text note SHALL be supported. A new upload creates a supplier at Tier 1.

#### Scenario: Successful supplier upload

- **WHEN** a verified champion submits a supplier with all 7 required fields and a valid category from the approved list
- **THEN** the system creates a supplier record at Tier 1, stores the phone in the gated contacts table, stores the photo with geo-tag and EXIF, records the unfindable attestation, and creates a `listing` record attributing the champion

#### Scenario: Upload rejected for missing geo-tag

- **WHEN** a champion submits a supplier upload but the geo-tag could not be auto-captured (e.g. permission denied)
- **THEN** the system rejects the upload and prompts the champion to enable location for the upload

#### Scenario: Upload rejected for missing photo

- **WHEN** a champion submits a supplier upload with no photo
- **THEN** the system rejects the upload with an error stating at least one photo is required

#### Scenario: Upload rejected for unapproved category

- **WHEN** a champion submits a supplier upload with a category that is not in the approved categories list
- **THEN** the system rejects the upload and offers the champion the option to suggest a new category for admin approval

### Requirement: Supplier trust ladder with four tiers

The system SHALL maintain a tier on every supplier: Tier 1 (single upload, no badge), Tier 2 (corroborated by a second independent knower), Tier 3 (claimed by the supplier via phone OTP to the listed number), Tier 4 (in-person verified — not implemented in MVP). Tier transitions SHALL be recorded with timestamp and triggering event. Tier 4 transitions SHALL be rejected at MVP with a message indicating the feature is not yet available.

#### Scenario: New supplier created at Tier 1

- **WHEN** a champion uploads a new supplier with no existing matching phone number
- **THEN** the system creates the supplier at Tier 1 with no badge

#### Scenario: Corroboration promotes to Tier 2

- **WHEN** a second independent champion uploads a supplier whose phone number exactly matches an existing Tier 1 supplier
- **THEN** the system merges the upload into the existing supplier and promotes the supplier to Tier 2 with a corroborated badge

#### Scenario: Supplier claim promotes to Tier 3

- **WHEN** a supplier claims their listing via the phone-OTP claim flow and the OTP is verified
- **THEN** the system promotes the supplier to Tier 3 with a claimed badge, links the supplier's user account as `claimed_by_user_id`, and grants the supplier edit rights to the listing

#### Scenario: Tier 4 promotion rejected at MVP

- **WHEN** any action attempts to promote a supplier to Tier 4
- **THEN** the system rejects the action with a message that in-person verification is not yet available

### Requirement: Phone-number auto-merge for corroboration

The system SHALL automatically merge a new champion upload into an existing supplier when the typed phone number exactly matches the existing supplier's phone. The merge SHALL promote the existing supplier to Tier 2 and SHALL record the second champion as a corroborating knower. The second champion SHALL receive a corroboration reputation event. The original champion SHALL remain the primary attributor unless the supplier is later claimed.

#### Scenario: Exact phone match triggers auto-merge

- **WHEN** a champion uploads a supplier whose typed phone number exactly matches an existing supplier's phone
- **THEN** the system does not create a duplicate supplier, merges the upload as a corroboration listing, promotes the supplier to Tier 2, and records both champions as knowers

#### Scenario: Phone differs but name and area similar — flagged for admin

- **WHEN** a champion uploads a supplier whose phone differs from an existing supplier but name and area are similar and the geo-points are within 100 meters
- **THEN** the system creates the new supplier at Tier 1 AND creates an admin-queue item of type `fuzzy_match` referencing both suppliers for manual merge review

#### Scenario: No match — separate listing

- **WHEN** a champion uploads a supplier whose phone, name, and area do not match any existing supplier
- **THEN** the system creates a new supplier at Tier 1 as a separate listing

### Requirement: Supplier claim via phone OTP

The system SHALL allow a person claiming to be the supplier to claim a listing by proving they control the listed phone number. The claim flow SHALL send an OTP to the listed phone number (via the configured verification method — manual founder relay at MVP, WhatsApp Business OTP at Phase 2). On successful OTP verification, the supplier's user account is linked as `claimed_by_user_id` and the supplier is promoted to Tier 3. The claiming supplier SHALL gain edit rights to: name, area, photos, business hours, and category. The supplier SHALL NOT be able to edit the original champion's attribution or delete the listing without admin review.

#### Scenario: Supplier successfully claims a listing

- **WHEN** a user initiates a claim on a supplier listing and successfully completes the OTP verification for the listed phone number
- **THEN** the system links the user as `claimed_by_user_id`, promotes the supplier to Tier 3, and grants edit rights to supplier fields

#### Scenario: Claim rejected for wrong OTP

- **WHEN** a user submits an incorrect OTP during a claim flow
- **THEN** the system rejects the claim attempt, does not promote the supplier, and records the failed attempt for rate-limiting purposes

#### Scenario: Already-claimed supplier cannot be claimed again

- **WHEN** a user attempts to claim a supplier that already has a `claimed_by_user_id`
- **THEN** the system rejects the claim and informs the user the listing is already claimed

### Requirement: Right to be delisted

The system SHALL allow a supplier who has claimed their listing to request delisting. A delisting request SHALL enter the admin review queue and SHALL be actioned by an admin (soft-delete the listing, retain data for audit). A supplier who has not yet claimed MAY request delisting via a contact-the-founder channel, also routed to admin review. The system SHALL NOT allow hard deletion of supplier records for audit integrity.

#### Scenario: Claimed supplier requests delisting

- **WHEN** a supplier who has claimed their listing submits a delisting request
- **THEN** the system creates an admin-queue item of type `listing_moderation` with reason `delist_request` and the listing is hidden from public view pending admin action

#### Scenario: Admin approves delisting

- **WHEN** an admin approves a delisting request
- **THEN** the system soft-deletes the listing (sets `deleted_at`, removes from public search and SEO), retains the record for audit, and notifies the requesting supplier

### Requirement: Public supplier directory pages with contact gating

The system SHALL publish public web pages for Tier 2 and above suppliers, server-side rendered and indexable by search engines (no sitemap restrictions, indexable HTML). Tier 1 suppliers SHALL NOT be public-indexed (visible only to logged-in users). Public supplier pages SHALL display: supplier name, category, area, photos (with OCR-clean status), tier badge, champion attribution ("Championed by [name]"). Public supplier pages SHALL NOT display the phone number or any contact information — the phone is gated behind the contact-unlock flow (see `anti-scrape` capability).

#### Scenario: Tier 2 supplier page is public and indexed

- **WHEN** a supplier is at Tier 2 or above and a visitor (including search engine crawlers) requests its public URL
- **THEN** the system returns a server-side rendered HTML page with name, category, area, photos, tier badge, and champion attribution, with indexable headers, and no phone number anywhere in the HTML

#### Scenario: Tier 1 supplier page is not public

- **WHEN** a visitor requests the URL of a Tier 1 supplier
- **THEN** the system returns a noindex response and redirects unauthenticated visitors to login; only logged-in users see the Tier 1 listing details

#### Scenario: Phone number never in public HTML

- **WHEN** any public supplier page is rendered
- **THEN** the rendered HTML does not contain the supplier's phone number in any form (text, alt, data attribute, JSON-LD, image OCR-leakable content)

### Requirement: Flat granular category taxonomy

The system SHALL maintain a category taxonomy of approximately 25-30 flat granular categories (no nesting), such as "Garment Stitching", "Embroidery", "Fabric Cutting", "Fabric Dyeing", "Leather Tanning" as separate categories. Champions SHALL select from the approved list at upload time. Champions SHALL NOT be able to invent categories. Champions SHALL be able to suggest a new category, which enters the admin review queue. Admins SHALL be able to approve, reject, rename, or soft-delete categories. Approved categories become selectable for new uploads.

#### Scenario: Champion selects from approved categories

- **WHEN** a champion uploads a supplier and selects a category
- **THEN** the system presents only approved categories for selection and stores the selected category on the supplier

#### Scenario: Champion suggests a new category

- **WHEN** a champion submits a new category suggestion during upload
- **THEN** the system creates an admin-queue item of type `category_suggest` with the suggested name, and the champion's upload proceeds with a placeholder category pending admin approval

#### Scenario: Admin approves a suggested category

- **WHEN** an admin approves a pending category suggestion
- **THEN** the system marks the category as `approved`, makes it selectable for future uploads, and updates any placeholder-attributed uploads to the now-approved category

#### Scenario: Admin rejects a suggested category

- **WHEN** an admin rejects a pending category suggestion
- **THEN** the system marks the category as `rejected` and notifies the suggesting champion; any placeholder-attributed uploads are flagged for the champion to re-categorize

### Requirement: Supplier search and filtering

The system SHALL provide a supplier search experience over the public directory (Tier 2+) supporting: full-text search on name and category, filter by category, filter by area, and geo-proximity ordering ("suppliers near me" using PostGIS). Results SHALL be ordered by a combination of tier (higher tier first), recency, and search relevance. Tier 1 suppliers SHALL NOT appear in public search results.

#### Scenario: Search by category and area

- **WHEN** a visitor searches for suppliers filtered by a category and an area
- **THEN** the system returns Tier 2+ suppliers matching both filters, ordered by tier then recency, and renders the results server-side for SEO

#### Scenario: Tier 1 suppliers excluded from public search

- **WHEN** a visitor runs any public search
- **THEN** the system excludes Tier 1 suppliers from the results

#### Scenario: Geo-proximity ordering

- **WHEN** a logged-in user searches with "near me" enabled and the system has the user's current location
- **THEN** the system returns Tier 2+ suppliers ordered by PostGIS distance from the user's location
