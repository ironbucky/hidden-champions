import { AppConfig } from "./schema";

export * from "./schema";

/**
 * Default application configuration.
 * These values match the seeded defaults in the `config` table.
 * Runtime values can be loaded from environment variables or the database.
 */
export const defaultConfig: AppConfig = {
  requestExpiryDays: 7,
  staleBountyDay: 4,
  staleBountyMultiplier: 3,
  contactUnlockDailyQuota: 10,
  finderFeePercent: 10,
  reputationWeights: {
    answered: 10,
    confirmed: 20,
    rejected: -10,
    flagApproved: 5,
  },
  leaderboardSizes: {
    category: 5,
    global: 10,
  },
  ocrPhoneRegex: String.raw`(?:\+?92|0)?3\d{2}[-\s]?\d{7}`,
};

function parseIntOrDefault(
  value: string | undefined,
  fallback: number
): number {
  if (value === undefined || value === "") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function parseFloatOrDefault(
  value: string | undefined,
  fallback: number
): number {
  if (value === undefined || value === "") return fallback;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

/**
 * Load configuration from environment variables.
 * Falls back to `defaultConfig` for any missing or invalid value.
 */
export function loadConfigFromEnv(): AppConfig {
  return {
    requestExpiryDays: parseIntOrDefault(
      process.env.REQUEST_EXPIRY_DAYS,
      defaultConfig.requestExpiryDays
    ),
    staleBountyDay: parseIntOrDefault(
      process.env.STALE_BOUNTY_DAY,
      defaultConfig.staleBountyDay
    ),
    staleBountyMultiplier: parseFloatOrDefault(
      process.env.STALE_BOUNTY_MULTIPLIER,
      defaultConfig.staleBountyMultiplier
    ),
    contactUnlockDailyQuota: parseIntOrDefault(
      process.env.CONTACT_UNLOCK_DAILY_QUOTA,
      defaultConfig.contactUnlockDailyQuota
    ),
    finderFeePercent: parseIntOrDefault(
      process.env.FINDER_FEE_PERCENT,
      defaultConfig.finderFeePercent
    ),
    reputationWeights: {
      answered: parseIntOrDefault(
        process.env.REPUTATION_ANSWERED,
        defaultConfig.reputationWeights.answered
      ),
      confirmed: parseIntOrDefault(
        process.env.REPUTATION_CONFIRMED,
        defaultConfig.reputationWeights.confirmed
      ),
      rejected: parseIntOrDefault(
        process.env.REPUTATION_REJECTED,
        defaultConfig.reputationWeights.rejected
      ),
      flagApproved: parseIntOrDefault(
        process.env.REPUTATION_FLAG_APPROVED,
        defaultConfig.reputationWeights.flagApproved
      ),
    },
    leaderboardSizes: {
      category: parseIntOrDefault(
        process.env.LEADERBOARD_CATEGORY_SIZE,
        defaultConfig.leaderboardSizes.category
      ),
      global: parseIntOrDefault(
        process.env.LEADERBOARD_GLOBAL_SIZE,
        defaultConfig.leaderboardSizes.global
      ),
    },
    ocrPhoneRegex: process.env.OCR_PHONE_REGEX || defaultConfig.ocrPhoneRegex,
  };
}
