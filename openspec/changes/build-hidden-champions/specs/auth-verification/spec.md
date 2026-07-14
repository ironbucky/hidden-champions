## ADDED Requirements

### Requirement: Phone-number signup creates pending account

The system SHALL allow a new user to sign up using only a phone number (no email required). On signup, the system SHALL create a user record in `pending` state with the phone number, current timestamp, `verification_method` set to `manual` (MVP) or `whatsapp_otp` (Phase 2), and null `verified_at`. A pending user SHALL NOT be permitted to upload suppliers, answer requests, unlock contacts, or vote on requests. The system SHALL notify the founder (admin) of the new pending signup for manual verification.

#### Scenario: New user signs up with phone

- **WHEN** a new user submits a phone number not already registered
- **THEN** the system creates a user record in `pending` state and notifies the founder admin of the pending verification

#### Scenario: Duplicate phone signup rejected

- **WHEN** a user submits a phone number that is already registered to an existing account
- **THEN** the system rejects the signup and prompts the user to log in with the existing account

#### Scenario: Pending user denied action

- **WHEN** a `pending` user attempts to upload, answer, unlock contact, or vote
- **THEN** the system rejects the action and informs the user their account is pending founder verification

### Requirement: Manual founder verification at MVP

The system SHALL support a manual verification flow where the founder (admin) personally contacts the pending user via text/WhatsApp, confirms their identity, and then transitions the user from `pending` to `verified` via the admin panel. On verification, the system SHALL set `verified_at` to the current timestamp and `verified_by` to the founder admin's user id. The manual flow SHALL be replaceable by the Phase 2 WhatsApp Business OTP flow with no schema change — only the `verification_method` field and the verification adapter in `/infrastructure` change.

#### Scenario: Founder verifies a pending user

- **WHEN** the founder admin opens a pending user in the admin panel and clicks verify after personally contacting the user
- **THEN** the system transitions the user to `verified` state, sets `verified_at` and `verified_by`, and the user gains upload/answer/unlock/vote rights

#### Scenario: Verified user can perform gated actions

- **WHEN** a `verified` user attempts to upload, answer, unlock contact, or vote
- **THEN** the system permits the action (subject to other rules such as rate limits)

#### Scenario: Verification method recorded for future swap

- **WHEN** any user is verified
- **THEN** the system records the `verification_method` used (e.g. `manual` at MVP) so the Phase 2 swap to `whatsapp_otp` is identifiable per user

### Requirement: Verification status gates all contribution and contact actions

The system SHALL enforce that the following actions require a `verified` user: uploading a supplier, answering a request, upvoting a request, flagging a request as findable, unlocking a supplier's contact, claiming a supplier listing, and suggesting a new category. The system SHALL check verification status before any of these actions and SHALL reject with a clear "account pending verification" message if the user is not verified.

#### Scenario: Unverified user blocked from all gated actions

- **WHEN** an unverified user attempts any of the gated actions
- **THEN** the system rejects the action with a "pending verification" message and does not execute the action

#### Scenario: Verified user proceeds through gated actions

- **WHEN** a verified user attempts any of the gated actions subject to other rules
- **THEN** the system proceeds with the action (rate limits, quotas, and other capability-specific rules still apply)

### Requirement: Phone number is the primary identifier

The system SHALL use the phone number as the primary unique identifier for user accounts. Email SHALL be optional and SHALL NOT be required for signup or any MVP feature. The phone number SHALL be stored in a normalized format (e.g. E.164 with Pakistan country code). Login SHALL be by phone number plus the verification flow (manual at MVP, WhatsApp OTP at Phase 2).

#### Scenario: Phone number normalized on signup

- **WHEN** a user submits a phone number in any common Pakistani format (e.g. `0300-1234567`, `+923001234567`)
- **THEN** the system normalizes it to E.164 format (`+923001234567`) before storage and uniqueness check

#### Scenario: Login by phone

- **WHEN** a user returns to the app and submits their phone number for login
- **THEN** the system identifies the existing account by phone and proceeds with the verification flow (or restores the verified session if one exists)

### Requirement: Session management

The system SHALL establish an authenticated session for a verified user that persists across browser sessions (using Supabase Auth session management). A returning verified user SHALL be auto-logged-in via their persisted session. A `pending` user SHALL have a limited session that allows viewing public supplier pages and the request board (logged-in view) but blocks gated actions.

#### Scenario: Verified user session persists

- **WHEN** a verified user closes and reopens the browser
- **THEN** the system restores their authenticated session from Supabase Auth and the user is logged in without re-verifying

#### Scenario: Pending user can view but not act

- **WHEN** a `pending` user with an active limited session attempts to view the request board or a public supplier page
- **THEN** the system permits viewing but blocks gated actions with a "pending verification" message
