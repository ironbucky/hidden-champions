## ADDED Requirements

### Requirement: Champion account with upload and answer rights

The system SHALL treat any verified user as a potential champion. A verified user MAY upload suppliers and answer open requests. An unverified (`pending`) user SHALL NOT be permitted to upload or answer. The system SHALL track each champion's contributions: count of uploads, count of answers, count of confirmations, count of rejections, and category-tagged reputation points.

#### Scenario: Verified user can upload

- **WHEN** a verified user attempts to upload a supplier
- **THEN** the system permits the upload and records the user as the champion attributor

#### Scenario: Unverified user cannot upload

- **WHEN** a `pending` user attempts to upload a supplier
- **THEN** the system rejects the upload and informs the user their account is pending founder verification

#### Scenario: Champion contributions tracked

- **WHEN** a champion's upload is confirmed by a requester
- **THEN** the system increments the champion's confirmed count and category-tagged reputation points for the relevant category

### Requirement: Specialist reputation earned per answered request

The system SHALL award reputation to a champion when they answer a request. The base reputation for an `answered` request SHALL be a configurable value. A `confirmed` answer SHALL award an additional configurable bonus. A `rejected` answer SHALL award zero reputation. A stale-bounty-eligible answer that is confirmed SHALL award the base plus bonus multiplied by the configured stale-bounty multiplier. Reputation SHALL be category-tagged — points earned answering a garment request accrue to the champion's garment category reputation, not a global pool.

#### Scenario: Base reputation on answered

- **WHEN** a champion's upload is attached as an answer to a request (transitioning it to `answered`)
- **THEN** the system awards the configured base reputation to the champion, tagged to the request's category

#### Scenario: Bonus reputation on confirmed

- **WHEN** a requester confirms the champion's answer
- **THEN** the system awards the configured confirmation bonus reputation to the champion, tagged to the request's category, in addition to the base already awarded

#### Scenario: Zero reputation on rejected

- **WHEN** a requester rejects the champion's answer
- **THEN** the system awards zero reputation for the rejection event and revokes the base reputation previously awarded for the answer

#### Scenario: Stale-bounty multiplier on confirmed stale answer

- **WHEN** a champion's answer to a stale-bounty-eligible request is confirmed
- **THEN** the system awards (base + bonus) × stale-bounty-multiplier reputation to the champion

### Requirement: Category-affinity specialist routing

The system SHALL route new open requests to champions with the highest category-tagged reputation first. When a new request is posted in category C, the system SHALL push-notify the top-N (configurable) champions by reputation in category C before widening to general browse. If a request is not answered within a configurable time window, the system SHALL widen the notification pool to more champions and increase browse prominence.

#### Scenario: New request routed to category specialists

- **WHEN** a new open request is posted in category C
- **THEN** the system sends push notifications to the top-N champions by reputation in category C, in addition to surfacing the request in the browse board

#### Scenario: Unanswered request escalates to wider pool

- **WHEN** an open request in category C has not been answered within the configured escalation window
- **THEN** the system widens the notification pool to additional champions beyond the initial top-N and increases the request's browse prominence

#### Scenario: Champion with no category reputation is not in initial routing

- **WHEN** a new request is posted in category C and a champion has zero reputation in category C
- **THEN** the system does not include that champion in the initial top-N push notification but they may see the request in general browse

### Requirement: Champion identity attribution on listings

The system SHALL display a "Championed by [champion display name]" attribution on every supplier listing the champion has uploaded. The attribution SHALL be visible on both the public supplier page (Tier 2+) and the logged-in-only Tier 1 view. The champion display name SHALL be set by the champion in their profile. The attribution SHALL link to the champion's public profile showing their specialist categories and contribution counts (but not their phone number or contact details).

#### Scenario: Attribution shown on public supplier page

- **WHEN** a visitor views a Tier 2+ supplier page that has a champion attributor
- **THEN** the system displays "Championed by [champion display name]" with a link to the champion's public profile

#### Scenario: Champion public profile shows specialties

- **WHEN** a visitor views a champion's public profile
- **THEN** the system displays the champion's display name, their top specialist categories by reputation, and aggregate contribution counts, and does NOT display the champion's phone number or contact details

### Requirement: Champion leaderboards by category

The system SHALL maintain and display leaderboards of top champions ranked by category-tagged reputation. Leaderboards SHALL show the top-N (configurable, default 5) champions per category, displaying display name, reputation, and contribution counts. A global leaderboard SHALL also be maintained showing top champions across all categories. Leaderboards SHALL be public (visible to logged-in users) to reinforce champion identity and status.

#### Scenario: Category leaderboard displayed

- **WHEN** a logged-in user views the leaderboard for a given category
- **THEN** the system displays the top-N champions for that category ranked by category-tagged reputation, with display name, reputation, and counts

#### Scenario: Global leaderboard displayed

- **WHEN** a logged-in user views the global leaderboard
- **THEN** the system displays the top-N champions across all categories ranked by total reputation, with display name, total reputation, and total counts

### Requirement: Deferred finder's-fee ledger

The system SHALL record a finder's-fee entitlement on the `finder_fee_ledger` whenever a champion uploads a new supplier. The ledger entry SHALL record: champion user id, supplier id, configured fee percentage, and `triggered_at` timestamp. The ledger SHALL NOT pay out at MVP — `paid_out_at` and `paid_amount` remain null. The ledger pays out only at Phase 2+ when the supplier upgrades to a paid tier (out of MVP scope). The ledger SHALL be visible to the champion in their profile as "pending finder's fees" with a clear note that payouts begin when paid tiers launch.

#### Scenario: Ledger entry created on upload

- **WHEN** a champion uploads a new supplier (not a corroboration merge)
- **THEN** the system creates a `finder_fee_ledger` entry with the champion's user id, the supplier id, the configured fee percentage, current timestamp as `triggered_at`, and null `paid_out_at` / `paid_amount`

#### Scenario: Corroboration upload does not create a new ledger entry

- **WHEN** a champion uploads a supplier that merges into an existing supplier via phone auto-merge
- **THEN** the system does not create a new finder's-fee ledger entry for the corroborating champion (only the original attributor champion holds the finder's fee entitlement)

#### Scenario: Champion views their pending finder's fees

- **WHEN** a champion views their profile's finder's-fee section
- **THEN** the system displays all their ledger entries with supplier name, fee percentage, and "pending — payouts begin when paid tiers launch" note, with no payout amounts shown

### Requirement: Champion profile and display name

The system SHALL allow a verified user to set and update a display name shown in their attributions and leaderboard entries. The display name SHALL NOT be their phone number. The system SHALL allow the champion to view their own contributions, reputation breakdown by category, finder's-fee ledger, and contribution history. The champion SHALL NOT be able to view their own phone number's verification status history (admin-only).

#### Scenario: Champion sets display name

- **WHEN** a verified user sets or updates their display name in their profile
- **THEN** the system stores the display name and uses it in all attributions and leaderboard entries going forward

#### Scenario: Display name cannot be a phone number

- **WHEN** a user attempts to set a display name that matches a Pakistani phone number pattern
- **THEN** the system rejects the display name with an error explaining display names cannot be phone numbers
