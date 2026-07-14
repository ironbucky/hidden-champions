import { describe, expect, it } from "vitest";
import { trustTierPolicy, TrustTier, TierTransitionTrigger } from "./trustTier";

describe("trustTierPolicy", () => {
  describe("canPromoteTo", () => {
    it.each<[TrustTier, TrustTier, TierTransitionTrigger, boolean]>([
      [TrustTier.Tier1, TrustTier.Tier2, "corroboration", true],
      [TrustTier.Tier1, TrustTier.Tier3, "corroboration", false],
      [TrustTier.Tier1, TrustTier.Tier2, "claim_otp", false],
      [TrustTier.Tier2, TrustTier.Tier3, "claim_otp", true],
      [TrustTier.Tier2, TrustTier.Tier3, "corroboration", false],
      [TrustTier.Tier3, TrustTier.Tier4, "in_person_verification", false],
      [TrustTier.Tier1, TrustTier.Tier1, "corroboration", false],
      [TrustTier.Tier4, TrustTier.Tier4, "claim_otp", false],
    ])("from %s to %s via %s returns %s", (from, to, trigger, expected) => {
      expect(trustTierPolicy.canPromoteTo(from, to, trigger)).toBe(expected);
    });
  });

  describe("tierRequiresPublicIndexing", () => {
    it.each([
      [TrustTier.Tier1, false],
      [TrustTier.Tier2, true],
      [TrustTier.Tier3, true],
      [TrustTier.Tier4, true],
    ])("tier %s public indexing = %s", (tier, expected) => {
      expect(trustTierPolicy.tierRequiresPublicIndexing(tier)).toBe(expected);
    });
  });

  describe("badgeForTier", () => {
    it.each([
      [TrustTier.Tier1, "New"],
      [TrustTier.Tier2, "Corroborated"],
      [TrustTier.Tier3, "Claimed"],
      [TrustTier.Tier4, "Verified"],
    ])("tier %s badge = %s", (tier, expected) => {
      expect(trustTierPolicy.badgeForTier(tier)).toBe(expected);
    });

    it("returns New for unknown tier", () => {
      expect(trustTierPolicy.badgeForTier(99 as TrustTier)).toBe("New");
    });
  });
});
