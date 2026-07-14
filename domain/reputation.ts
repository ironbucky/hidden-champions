import { ReputationWeights } from "@/config";

export const reputationPolicy = {
  awardForAnswered(baseRep: number): number {
    return baseRep;
  },

  awardForConfirmed(
    baseRep: number,
    bonusRep: number,
    staleBountyMultiplier: number,
    isStale: boolean
  ): number {
    const total = baseRep + bonusRep;
    return isStale ? Math.round(total * staleBountyMultiplier) : total;
  },

  awardForRejected(): number {
    return 0;
  },

  awardForFlagApproved(flagRep: number): number {
    return flagRep;
  },

  /**
   * Compute the net points to record for a champion reputation event,
   * reading all weights from the supplied config object (no globals).
   */
  pointsForEvent(
    eventType: "answered" | "confirmed" | "rejected" | "flag_approved",
    weights: ReputationWeights,
    options: { isStale?: boolean; staleBountyMultiplier?: number } = {}
  ): number {
    switch (eventType) {
      case "answered":
        return this.awardForAnswered(weights.answered);
      case "confirmed":
        return this.awardForConfirmed(
          weights.answered,
          weights.confirmed,
          options.staleBountyMultiplier ?? 1,
          options.isStale ?? false
        );
      case "rejected":
        return this.awardForRejected();
      case "flag_approved":
        return this.awardForFlagApproved(weights.flagApproved);
      default:
        return 0;
    }
  },
};
