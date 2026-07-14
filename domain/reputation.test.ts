import { describe, expect, it } from "vitest";
import { ReputationWeights } from "@/config";
import { reputationPolicy } from "./reputation";

const weights: ReputationWeights = {
  answered: 10,
  confirmed: 20,
  rejected: -10,
  flagApproved: 5,
};

describe("reputationPolicy", () => {
  describe("awardForAnswered", () => {
    it("returns base reputation", () => {
      expect(reputationPolicy.awardForAnswered(weights.answered)).toBe(10);
    });
  });

  describe("awardForConfirmed", () => {
    it("returns base + bonus when not stale", () => {
      expect(
        reputationPolicy.awardForConfirmed(
          weights.answered,
          weights.confirmed,
          3,
          false
        )
      ).toBe(30);
    });

    it("multiplies total by stale bounty multiplier when stale", () => {
      expect(
        reputationPolicy.awardForConfirmed(
          weights.answered,
          weights.confirmed,
          3,
          true
        )
      ).toBe(90);
    });
  });

  describe("awardForRejected", () => {
    it("returns zero reputation", () => {
      expect(reputationPolicy.awardForRejected()).toBe(0);
    });
  });

  describe("awardForFlagApproved", () => {
    it("returns flag reputation", () => {
      expect(reputationPolicy.awardForFlagApproved(weights.flagApproved)).toBe(
        5
      );
    });
  });

  describe("pointsForEvent", () => {
    it("computes answered points", () => {
      expect(reputationPolicy.pointsForEvent("answered", weights)).toBe(10);
    });

    it("computes confirmed points without stale", () => {
      expect(reputationPolicy.pointsForEvent("confirmed", weights)).toBe(30);
    });

    it("computes confirmed points with stale multiplier", () => {
      expect(
        reputationPolicy.pointsForEvent("confirmed", weights, {
          isStale: true,
          staleBountyMultiplier: 3,
        })
      ).toBe(90);
    });

    it("computes rejected points", () => {
      expect(reputationPolicy.pointsForEvent("rejected", weights)).toBe(0);
    });

    it("computes flag approved points", () => {
      expect(reputationPolicy.pointsForEvent("flag_approved", weights)).toBe(5);
    });

    it("returns zero for unknown event type", () => {
      expect(
        reputationPolicy.pointsForEvent("unknown" as "answered", weights)
      ).toBe(0);
    });
  });
});
