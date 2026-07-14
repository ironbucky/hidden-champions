export interface UnlockUser {
  role?: string;
  verifiedAt?: Date | null;
}

export const contactUnlockPolicy = {
  canUnlock(user: UnlockUser, dailyCount: number, quota: number): boolean {
    if (!user.verifiedAt) return false;
    if (user.role === "pending") return false;
    return dailyCount < quota;
  },

  remainingQuota(dailyCount: number, quota: number): number {
    return Math.max(0, quota - dailyCount);
  },
};
