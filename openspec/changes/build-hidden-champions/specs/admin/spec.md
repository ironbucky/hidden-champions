## ADDED Requirements

### Requirement: Admin panel access control

The system SHALL restrict admin panel access to users with the `admin` role. The first admin (the founder) SHALL be seeded manually in the database. Additional admins SHALL be assignable only by an existing admin via the admin panel. Non-admin users SHALL NOT be able to view or invoke any admin panel route or action.

#### Scenario: Admin can access admin panel

- **WHEN** a user with the `admin` role navigates to the admin panel
- **THEN** the system grants access to the admin dashboard and all review queues

#### Scenario: Non-admin denied admin panel

- **WHEN** a user without the `admin` role attempts to access any admin panel route
- **THEN** the system denies access and redirects the user to the home page

### Requirement: Photo review queue

The system SHALL present an admin review queue for all photos with `ocr_status = held`. The admin SHALL be able to: approve the photo as-is (publishes it), crop-and-replace the photo to remove the phone number (publishes the cropped version), request the champion to re-upload a cropped version (notifies the champion, photo stays held), or reject the photo (removes it from the supplier's gallery). Each action SHALL be recorded with the admin's user id and a timestamp.

#### Scenario: Admin approves a held photo

- **WHEN** an admin clicks approve on a held photo
- **THEN** the system marks the photo `reviewed` with `published_at` set, publishes it to the supplier's public gallery, and removes the item from the admin queue

#### Scenario: Admin crops and replaces a held photo

- **WHEN** an admin crops the phone-number region out of a held photo and saves
- **THEN** the system stores the cropped version, marks the photo `reviewed` and `clean`, publishes the cropped version, and removes the item from the admin queue

#### Scenario: Admin requests champion re-upload

- **WHEN** an admin clicks "request re-upload" on a held photo
- **THEN** the system notifies the champion to re-upload a cropped version, the photo remains `held`, and the admin-queue item remains open until the champion re-uploads or the admin resolves it

#### Scenario: Admin rejects a held photo

- **WHEN** an admin clicks reject on a held photo
- **THEN** the system removes the photo from the supplier's gallery, marks the photo `reviewed` and `rejected`, and records the rejection in the admin-queue item

### Requirement: Fuzzy supplier-match review queue

The system SHALL present an admin review queue for fuzzy supplier-match cases (uploads where name and area are similar and geo-points are within 100 meters but phone numbers differ). The admin SHALL be able to: merge the two suppliers (keeping the older one as primary, reattributing the newer upload as a corroboration listing, promoting to Tier 2), or mark them as distinct suppliers (no merge). Each action SHALL be recorded.

#### Scenario: Admin merges two fuzzy-matched suppliers

- **WHEN** an admin clicks merge on a fuzzy-match review item
- **THEN** the system reattributes the newer upload as a corroboration listing on the older supplier, promotes the older supplier to Tier 2, deletes or soft-deletes the newer supplier record, and resolves the admin-queue item

#### Scenario: Admin marks fuzzy matches as distinct

- **WHEN** an admin clicks "distinct" on a fuzzy-match review item
- **THEN** the system leaves both suppliers as separate Tier 1 listings and resolves the admin-queue item

### Requirement: Manual user verification queue

The system SHALL present an admin queue of pending user signups awaiting manual founder verification. The admin SHALL be able to view the phone number, click a "contact" action (which opens WhatsApp or the phone dialer with the user's number), and after personally confirming, click verify to transition the user to `verified` state. The admin SHALL also be able to reject a pending user (e.g. suspicious number, duplicate) which deletes the pending account.

#### Scenario: Admin verifies a pending user

- **WHEN** an admin clicks verify on a pending user after personally contacting them
- **THEN** the system transitions the user to `verified` state, sets `verified_at` and `verified_by`, and removes the item from the queue

#### Scenario: Admin rejects a pending user

- **WHEN** an admin clicks reject on a pending user
- **THEN** the system deletes the pending user account and records the rejection reason in an audit log

### Requirement: Flag-as-findable review queue

The system SHALL present an admin queue of `flag_findable` items submitted by champions against open requests. Each item SHALL display the original request, the flagging champion, the link to the online source the champion provided, and approve/reject actions. Approving SHALL transition the request to `flagged-closed` and award the flagging champion the configured reputation. Rejecting SHALL leave the request in `open` state and award nothing.

#### Scenario: Admin approves a findable flag

- **WHEN** an admin clicks approve on a flag-findable item after verifying the provided link indeed shows the supplier is findable online
- **THEN** the system transitions the request to `flagged-closed`, awards the flagging champion the configured flag-approved reputation, and resolves the queue item

#### Scenario: Admin rejects a findable flag

- **WHEN** an admin clicks reject on a flag-findable item because the provided link does not show the supplier is findable
- **THEN** the system leaves the request in `open` state, awards no reputation to the flagging champion, and resolves the queue item with the rejection recorded

### Requirement: Category suggestion review queue

The system SHALL present an admin queue of champion-suggested new categories. The admin SHALL be able to approve (with optional rename), reject, or soft-delete a suggested category. Approving SHALL make the category selectable for future uploads and update any placeholder-attributed uploads to the now-approved category. Rejecting SHALL notify the suggesting champion and flag their placeholder-attributed uploads for re-categorization.

#### Scenario: Admin approves a suggested category

- **WHEN** an admin clicks approve on a category suggestion (optionally editing the name first)
- **THEN** the system marks the category `approved` with the final name, makes it selectable for future uploads, updates any placeholder-attributed uploads to this category, and resolves the queue item

#### Scenario: Admin rejects a suggested category

- **WHEN** an admin clicks reject on a category suggestion
- **THEN** the system marks the category `rejected`, notifies the suggesting champion, flags any placeholder-attributed uploads for re-categorization, and resolves the queue item

### Requirement: Listing moderation and delisting

The system SHALL present an admin queue for listing moderation, including: delisting requests from claimed suppliers, delisting requests from unclaimed suppliers (routed via founder contact), and any other listing issues flagged by the system or champions. The admin SHALL be able to soft-delete a listing (sets `deleted_at`, removes from public search and SEO, retains the record for audit), edit a listing's fields, or dismiss the moderation item. The system SHALL NOT support hard deletion of supplier records.

#### Scenario: Admin approves a delisting request

- **WHEN** an admin clicks approve on a delisting request
- **THEN** the system soft-deletes the supplier (sets `deleted_at`, removes from public search and SEO), notifies the requesting party, and resolves the queue item

#### Scenario: Admin edits a listing

- **WHEN** an admin edits fields on a supplier listing via the admin panel
- **THEN** the system updates the supplier record, records the edit in an audit log with the admin's user id and timestamp

#### Scenario: Hard deletion not supported

- **WHEN** any action attempts to hard-delete a supplier record
- **THEN** the system rejects the action; only soft-delete is supported for audit integrity

### Requirement: Runtime config tuning

The system SHALL provide an admin panel interface for runtime-tunable config values stored in the `config` table. The admin SHALL be able to view and update: request expiry days, stale-bounty trigger day, stale-bounty multiplier, contact-unlock daily quota, reputation weights (answered/confirmed/rejected/flag-approved), leaderboard sizes, and the OCR phone-pattern regex. Changes SHALL take effect immediately for new actions without a redeploy.

#### Scenario: Admin tunes the contact-unlock quota

- **WHEN** an admin updates the `contact_unlock_daily_quota` value in the config panel
- **THEN** the system stores the new value in the `config` table and all subsequent contact-unlock quota checks use the new value without a redeploy

#### Scenario: Admin tunes the stale-bounty multiplier

- **WHEN** an admin updates the `stale_bounty_multiplier` value
- **THEN** the system stores the new value and all subsequent stale-bounty reputation calculations use the new multiplier

#### Scenario: Admin updates the OCR phone regex

- **WHEN** an admin updates the `ocr_phone_regex` value to catch a new phone-pattern style
- **THEN** the system stores the new regex and all subsequent photo OCR scans use the new pattern
