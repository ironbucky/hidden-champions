export interface ReputationWeights {
  answered: number;
  confirmed: number;
  rejected: number;
  flagApproved: number;
}

export interface LeaderboardSizes {
  category: number;
  global: number;
}

export interface AppConfig {
  requestExpiryDays: number;
  staleBountyDay: number;
  staleBountyMultiplier: number;
  contactUnlockDailyQuota: number;
  finderFeePercent: number;
  reputationWeights: ReputationWeights;
  leaderboardSizes: LeaderboardSizes;
  ocrPhoneRegex: string;
}
