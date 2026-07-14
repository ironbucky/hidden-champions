## ADDED Requirements

### Requirement: Phone numbers stored in a separate gated table

The system SHALL store supplier phone numbers in a dedicated `supplier_contacts` table, separate from the `suppliers` table. The `suppliers` table SHALL NOT contain phone number columns. This separation is the foundation for Row-Level Security gating — phone numbers are queryable only via the gated table under strict RLS policies.

#### Scenario: Supplier record has no phone column

- **WHEN** any query selects from the `suppliers` table
- **THEN** no phone number data is returned because the `suppliers` table has no phone column

#### Scenario: Phone stored in supplier_contacts

- **WHEN** a champion uploads a supplier with a phone number
- **THEN** the system inserts the phone into `supplier_contacts` with `supplier_id`, the phone value, source (`champion_typed`), `added_by_user_id`, and timestamp — never into `suppliers`

### Requirement: Row-Level Security denies phone queries to unauthorized users

The system SHALL enforce Supabase Row-Level Security policies on `supplier_contacts` that deny SELECT to all users except: (a) the champion who uploaded that supplier (`added_by_user_id` matches the authenticated user), (b) the supplier's `claimed_by_user_id` after claim, (c) any `verified` user who has an active contact-unlock record for that supplier within their daily quota. The policies SHALL be enforced at the database level, not in application code, so scrapers cannot bypass them by calling APIs directly.

#### Scenario: Champion who uploaded can read the phone

- **WHEN** the champion who uploaded a supplier queries `supplier_contacts` for that supplier
- **THEN** the RLS policy permits the SELECT and returns the phone number

#### Scenario: Claimed supplier can read their own phone

- **WHEN** the user who claimed a supplier queries `supplier_contacts` for that supplier
- **THEN** the RLS policy permits the SELECT and returns the phone number

#### Scenario: Verified user with active unlock can read the phone

- **WHEN** a verified user with an active contact-unlock record for a supplier (within daily quota) queries `supplier_contacts` for that supplier
- **THEN** the RLS policy permits the SELECT and returns the phone number

#### Scenario: Unauthorized user denied

- **WHEN** any user who does not meet conditions (a), (b), or (c) queries `supplier_contacts`
- **THEN** the RLS policy denies the SELECT and returns zero rows

#### Scenario: Pending user denied even with unlock attempt

- **WHEN** a `pending` user attempts any query on `supplier_contacts`
- **THEN** the RLS policy denies the SELECT because the policy requires `verified` status

### Requirement: Contact-unlock action with daily quota

The system SHALL provide a "Request contact" action on supplier pages that, when invoked by a verified user, creates a contact-unlock record and grants that user RLS access to the supplier's phone for the configured unlock window. The system SHALL enforce a daily quota of unlocks per user (configurable in `/config`, default 10). Once the daily quota is exceeded, further unlock attempts SHALL be rejected until the next quota window.

#### Scenario: Verified user unlocks a contact

- **WHEN** a verified user clicks "Request contact" on a supplier page and is within their daily quota
- **THEN** the system creates a contact-unlock record, increments the user's daily unlock count, and the phone number becomes visible to that user via RLS

#### Scenario: Daily quota exceeded

- **WHEN** a verified user who has reached the daily unlock quota attempts another unlock
- **THEN** the system rejects the unlock with a "daily quota reached" message and the phone remains inaccessible

#### Scenario: Pending user cannot unlock

- **WHEN** a `pending` user clicks "Request contact"
- **THEN** the system rejects the unlock with a "pending verification" message

### Requirement: Phone numbers never present in public HTML

The system SHALL ensure that no public supplier page (Tier 2+ server-side rendered HTML) contains the supplier's phone number in any form: visible text, hidden HTML, alt attributes, data attributes, JSON-LD structured data, or image OCR-leakable content. The phone number SHALL be loaded lazily via the gated contact-unlock API only after a verified user unlocks it.

#### Scenario: Public supplier page HTML contains no phone

- **WHEN** the system server-side renders a public supplier page
- **THEN** the rendered HTML contains no occurrence of the supplier's phone number in any form

#### Scenario: Phone loads only after unlock

- **WHEN** a verified user clicks "Request contact" and the unlock succeeds
- **THEN** the system fetches the phone number via the gated API and renders it client-side in the user's browser; before the unlock click, no phone data is fetched

### Requirement: OCR scan on photo upload with auto-publish and admin-hold

The system SHALL run Tesseract.js OCR against every uploaded supplier photo via a Supabase Edge Function. The OCR SHALL scan for Pakistani phone-number patterns (configurable regex in `/config`, defaulting to `03XX-XXXXXXX` and `+92XX-XXXXXXX` variants). Photos with no detected phone pattern SHALL be marked `ocr_status = clean` and published instantly to the supplier's gallery. Photos with a detected phone pattern SHALL be marked `ocr_status = held` and SHALL NOT be published; they SHALL enter the admin review queue. The OCR-detected phone (if any) SHALL be stored on the photo record as `ocr_detected_phone` for the secondary corroboration signal.

#### Scenario: Clean photo auto-publishes

- **WHEN** a champion uploads a photo and OCR detects no phone pattern
- **THEN** the system marks the photo `clean` and publishes it to the supplier's public gallery instantly

#### Scenario: Photo with detected phone is held

- **WHEN** a champion uploads a photo and OCR detects a Pakistani phone pattern
- **THEN** the system marks the photo `held`, does NOT publish it, and creates an admin-queue item of type `photo` referencing the photo for review

#### Scenario: OCR failure does not block upload

- **WHEN** OCR processing fails (e.g. Edge Function timeout, Tesseract error)
- **THEN** the system marks the photo `held` for manual review (fail-safe: prefer holding over leaking) and creates an admin-queue item

### Requirement: OCR-detected phone vs typed phone corroboration signal

The system SHALL compare the OCR-detected phone (when present) against the champion's typed phone number for the same supplier. A match SHALL be recorded as a positive corroboration signal on the supplier record. A mismatch SHALL be flagged in the admin review queue for the founder to investigate (possible wrong entry, old banner, or fake upload).

#### Scenario: OCR matches typed phone

- **WHEN** a held photo's OCR-detected phone exactly matches the champion's typed phone for the supplier
- **THEN** the system records a positive corroboration signal on the supplier and the photo review item is annotated with "OCR matches typed"

#### Scenario: OCR differs from typed phone

- **WHEN** a held photo's OCR-detected phone differs from the champion's typed phone
- **THEN** the system annotates the photo review item with "OCR mismatch" for founder investigation

### Requirement: Rate-limit monitoring and anomaly flagging

The system SHALL monitor contact-unlock rates per user and flag anomalous patterns to the admin queue: a user approaching their daily quota repeatedly, a user unlocking an unusually high number of contacts in a short window, or a user unlocking contacts across many unrelated categories in succession. Flagged anomalies SHALL be reviewed by the founder for possible scraper activity.

#### Scenario: User repeatedly hitting daily quota

- **WHEN** a verified user reaches their daily unlock quota on N consecutive days (configurable threshold)
- **THEN** the system creates an admin-queue item of type `user_verify` with reason `quota_anomaly` for founder review

#### Scenario: Unusual cross-category unlock pattern

- **WHEN** a verified user unlocks contacts across more than the configured threshold of distinct categories in a 24-hour window
- **THEN** the system creates an admin-queue item flagging the pattern for scraper review
