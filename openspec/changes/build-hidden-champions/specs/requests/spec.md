## ADDED Requirements

### Requirement: Searcher can post a request for an unfindable supplier

The system SHALL allow a verified user to post a request describing a supplier they need but could not find online. A request MUST include: (a) what they need (free text with category auto-suggest), (b) where (area within Lahore), (c) at least one unfindable attestation checkbox confirming they searched and struck out via Google, Google Maps, IndiaMART/B2B directories, WhatsApp/social, or asking around. An optional free-text notes field SHALL be supported for quantity, urgency, or specs. The system SHALL auto-suggest similar open requests during typing and prompt the searcher to upvote an existing request instead of duplicating.

#### Scenario: Successful request post by verified user

- **WHEN** a verified user submits a request with all required fields and at least one unfindable attestation
- **THEN** the system creates the request in `open` state, visible to logged-in users only, with `expires_at` set to 7 days from creation and `stale_bounty_at` set to 4 days from creation

#### Scenario: Rejected for missing unfindable attestation

- **WHEN** a user submits a request without checking any unfindable attestation box
- **THEN** the system rejects the submission with an error stating at least one searched-and-struck-out channel MUST be attested

#### Scenario: Unverified user cannot post

- **WHEN** a user whose account is in `pending` state attempts to post a request
- **THEN** the system rejects the submission and informs the user their account is pending founder verification

#### Scenario: Duplicate-need suggestion during typing

- **WHEN** a user types the "what I need" field and a similar open request exists
- **THEN** the system surfaces the similar open request and prompts the user to upvote it instead of posting a duplicate

### Requirement: Open requests are visible only to logged-in users

The system SHALL NOT serve any open request content to unauthenticated visitors or to web crawlers. Request pages SHALL NOT be indexed by search engines (noindex headers, no sitemap entries). Only authenticated users MAY view the request board and individual request pages.

#### Scenario: Unauthenticated visitor denied

- **WHEN** an unauthenticated visitor attempts to view the request board or any request page
- **THEN** the system redirects to the login page and does not render any request content

#### Scenario: Search engine crawler denied

- **WHEN** a search engine crawler requests a request page URL
- **THEN** the system returns a noindex response and does not render request content in crawlable HTML

### Requirement: Logged-in users can upvote open requests

The system SHALL allow any logged-in user to upvote an open request once. Upvotes aggregate demand and increase the request's visibility and the reputation reward for answering it. A user MAY withdraw their upvote. The upvote count SHALL be displayed on the request.

#### Scenario: User upvotes an open request

- **WHEN** a logged-in user who has not upvoted a given open request clicks upvote
- **THEN** the system records the upvote, increments the request's upvote count, and prevents the same user from upvoting again

#### Scenario: User withdraws their upvote

- **WHEN** a user who previously upvoted a request clicks the upvote control again
- **THEN** the system removes the user's upvote and decrements the count

#### Scenario: Cannot upvote a non-open request

- **WHEN** a user attempts to upvote a request that is in `answered`, `confirmed`, `rejected`, `expired`, or `flagged-closed` state
- **THEN** the system disables the upvote control and shows the request's current state

### Requirement: Request lifecycle state machine

The system SHALL enforce a request state machine: `draft` → `open` → `answered` → (`confirmed` | `rejected`) and `open` → `expired` / `flagged-closed`. Transitions SHALL only occur via explicitly allowed events. An `answered` request that the searcher rejects SHALL return to `open`. An `open` request SHALL auto-expire to `expired` at `expires_at`. A `flagged-closed` request is one a champion has flagged as out-of-scope (supplier is actually findable online) and an admin has approved the flag.

#### Scenario: Auto-expiry of unanswered request

- **WHEN** an `open` request reaches its `expires_at` timestamp without being answered
- **THEN** the system transitions the request to `expired` state and removes it from the active browse board

#### Scenario: Answered request is rejected and reopens

- **WHEN** a searcher rejects the answer attached to their `answered` request
- **THEN** the system transitions the request back to `open` state, detaches the rejected answer, and the request is again visible to champions for new answers

#### Scenario: Confirmed request closes

- **WHEN** a searcher confirms the answer to their request
- **THEN** the system transitions the request to `confirmed` state, awards bonus reputation to the answering champion, and the request is no longer accepting answers

#### Scenario: Invalid state transition rejected

- **WHEN** any event attempts to transition a request from a state not in its allowed transitions
- **THEN** the system rejects the event and the request remains in its current state

### Requirement: Stale-bounty reputation boost at day 4

The system SHALL apply a stale-bounty reputation multiplier to any `open` request at its `stale_bounty_at` timestamp (4 days from creation by default, configurable in `/config`). The multiplier (default 3x, configurable) SHALL increase the reputation awarded to a champion who answers the request after that timestamp. The stale-bounty status SHALL be visually indicated on the request.

#### Scenario: Stale-bounty activates at day 4

- **WHEN** an `open` request reaches its `stale_bounty_at` timestamp
- **THEN** the system marks the request as stale-bounty-eligible and displays a visual indicator, and any subsequent answer that gets confirmed awards 3x (configurable) the base reputation

#### Scenario: Stale-bounty does not apply before day 4

- **WHEN** a champion answers and gets confirmed on a request before its `stale_bounty_at` timestamp
- **THEN** the system awards only the base reputation, with no multiplier

### Requirement: Champion answers a request by uploading a new supplier

The system SHALL allow a verified user (champion) to answer an `open` request by uploading a new supplier listing that satisfies the supplier upload requirements. Attaching an already-existing supplier from the directory as an answer SHALL NOT be allowed — the answer MUST create a new supplier or a corroboration upload that merges into an existing supplier (per the suppliers corroboration requirement).

#### Scenario: Champion uploads a new supplier as an answer

- **WHEN** a verified champion uploads a new supplier listing in response to an `open` request, with all required supplier fields satisfied
- **THEN** the system creates the supplier at Tier 1, attaches it as an answer to the request, transitions the request to `answered` state, and awards base reputation to the champion

#### Scenario: Corroborating upload merges and counts as an answer

- **WHEN** a champion uploads a supplier whose phone number exactly matches an existing supplier and the upload is in response to an `open` request
- **THEN** the system merges the upload into the existing supplier, promotes the existing supplier to Tier 2, attaches the existing supplier as the answer, transitions the request to `answered`, and awards base reputation to the champion

#### Scenario: Attempt to link an existing supplier without uploading is rejected

- **WHEN** a champion attempts to attach an already-existing supplier to a request without performing a new upload
- **THEN** the system rejects the action and informs the champion that answers require a new or corroborating upload

### Requirement: Searcher can confirm or reject an answer

The system SHALL allow the requester to confirm or reject the answer attached to their `answered` request. Confirmation awards bonus reputation to the champion and contributes to the supplier's trust progression. Rejection returns the request to `open` state and awards zero reputation to the champion. The requester MAY also take no action (ghost), in which case the answer remains in `answered` state without confirmation.

#### Scenario: Searcher confirms the answer

- **WHEN** the requester clicks confirm on their `answered` request
- **THEN** the system transitions the request to `confirmed`, awards the answering champion the configured confirmation-reputation bonus, and records a confirmation event in the reputation ledger

#### Scenario: Searcher rejects the answer

- **WHEN** the requester clicks reject on their `answered` request
- **THEN** the system transitions the request back to `open`, awards zero reputation to the champion for this answer, and detaches the answer

#### Scenario: Searcher takes no action (ghost)

- **WHEN** the requester views their `answered` request but takes no confirm/reject action
- **THEN** the system leaves the request in `answered` state, the champion retains the base answered reputation, and no confirmation bonus is awarded

### Requirement: Champion can flag a request as findable-online

The system SHALL allow a verified champion to flag an `open` request as out-of-scope by asserting the requested supplier is actually findable online and providing a link to the online source. A flagged request transitions to `flagged-closed` state only after an admin approves the flag. If the admin rejects the flag, the request returns to `open`. A champion whose flag is approved SHALL earn a small reputation reward (configurable).

#### Scenario: Champion flags a request as findable

- **WHEN** a verified champion submits a findable-flag with a link to an online source for an `open` request
- **THEN** the system creates an admin-queue item of type `flag_findable`, and the request remains in `open` state pending admin review

#### Scenario: Admin approves the flag

- **WHEN** an admin approves a pending flag-findable review item
- **THEN** the system transitions the request to `flagged-closed` state, awards the flagging champion the configured flag-approved reputation, and the request is no longer accepting answers

#### Scenario: Admin rejects the flag

- **WHEN** an admin rejects a pending flag-findable review item
- **THEN** the system leaves the request in `open` state, awards no reputation to the flagging champion, and records the rejected flag for audit

### Requirement: Request browse board with visibility decay and escalation

The system SHALL present a browse board of `open` requests filterable by category and area. Unanswered requests SHALL rise in prominence over time (inverted visibility decay) and SHALL be broadcast to a widening pool of champions as they age. The browse board SHALL NOT show `expired`, `confirmed`, `rejected`, or `flagged-closed` requests.

#### Scenario: Aged unanswered request rises in browse prominence

- **WHEN** an `open` request has not been answered and is approaching its `stale_bounty_at` or `expires_at`
- **THEN** the system surfaces the request higher in the browse board than newer requests and includes it in widening champion notifications

#### Scenario: Board filters exclude non-open requests

- **WHEN** a user views the browse board
- **THEN** the system shows only `open` requests and provides filters by category and area
