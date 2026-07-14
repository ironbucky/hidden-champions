export interface ExpirableRequest {
  createdAt: Date;
  staleBountyAt?: Date | null;
}

export const expiryPolicy = {
  computeExpiry(createdAt: Date, days: number): Date {
    const expiresAt = new Date(createdAt);
    expiresAt.setUTCDate(expiresAt.getUTCDate() + days);
    expiresAt.setUTCHours(23, 59, 59, 999);
    return expiresAt;
  },

  computeStaleBountyAt(createdAt: Date, staleDay: number): Date {
    const staleAt = new Date(createdAt);
    staleAt.setUTCDate(staleAt.getUTCDate() + staleDay);
    staleAt.setUTCHours(0, 0, 0, 0);
    return staleAt;
  },

  isStaleBountyEligible(request: ExpirableRequest, now: Date): boolean {
    if (!request.staleBountyAt) return false;
    return now.getTime() >= request.staleBountyAt.getTime();
  },
};
