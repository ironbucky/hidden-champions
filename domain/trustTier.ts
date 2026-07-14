export enum TrustTier {
  Tier1 = 1,
  Tier2 = 2,
  Tier3 = 3,
  Tier4 = 4,
}

export type TierTransitionTrigger =
  | "corroboration"
  | "claim_otp"
  | "in_person_verification";

export const trustTierPolicy = {
  /**
   * Determine whether a transition from one tier to another is allowed.
   * - Tier 1 → Tier 2: corroboration
   * - Tier 2 → Tier 3: claim_otp
   * - Tier 3 → Tier 4: in_person_verification (rejected in MVP)
   * - No demotions, no skipping.
   */
  canPromoteTo(
    fromTier: TrustTier,
    toTier: TrustTier,
    trigger: TierTransitionTrigger
  ): boolean {
    if (toTier <= fromTier) return false;
    if (toTier - fromTier > 1) return false;

    const rules: Record<TrustTier, Record<TierTransitionTrigger, boolean>> = {
      [TrustTier.Tier1]: {
        corroboration: true,
        claim_otp: false,
        in_person_verification: false,
      },
      [TrustTier.Tier2]: {
        corroboration: false,
        claim_otp: true,
        in_person_verification: false,
      },
      [TrustTier.Tier3]: {
        corroboration: false,
        claim_otp: false,
        in_person_verification: false,
      },
      [TrustTier.Tier4]: {
        corroboration: false,
        claim_otp: false,
        in_person_verification: false,
      },
    };

    return rules[fromTier][trigger];
  },

  tierRequiresPublicIndexing(tier: TrustTier): boolean {
    return tier >= TrustTier.Tier2;
  },

  badgeForTier(tier: TrustTier): string {
    switch (tier) {
      case TrustTier.Tier1:
        return "New";
      case TrustTier.Tier2:
        return "Corroborated";
      case TrustTier.Tier3:
        return "Claimed";
      case TrustTier.Tier4:
        return "Verified";
      default:
        return "New";
    }
  },
};
