import { AppConfig, defaultConfig, loadConfigFromEnv } from "@/config";
import { ConfigRepository } from "./interfaces";
import { createServerSupabaseClient } from "./supabase/server";

const dbKeyToConfigKey: Record<string, keyof AppConfig> = {
  request_expiry_days: "requestExpiryDays",
  stale_bounty_day: "staleBountyDay",
  stale_bounty_multiplier: "staleBountyMultiplier",
  contact_unlock_daily_quota: "contactUnlockDailyQuota",
  finder_fee_percent: "finderFeePercent",
  reputation_weights: "reputationWeights",
  leaderboard_sizes: "leaderboardSizes",
  ocr_phone_regex: "ocrPhoneRegex",
};

const configKeyToDbKey: Record<keyof AppConfig, string> = {
  requestExpiryDays: "request_expiry_days",
  staleBountyDay: "stale_bounty_day",
  staleBountyMultiplier: "stale_bounty_multiplier",
  contactUnlockDailyQuota: "contact_unlock_daily_quota",
  finderFeePercent: "finder_fee_percent",
  reputationWeights: "reputation_weights",
  leaderboardSizes: "leaderboard_sizes",
  ocrPhoneRegex: "ocr_phone_regex",
};

export class ConfigRepositoryImpl implements ConfigRepository {
  private cache: Partial<AppConfig> | null = null;
  private cacheLoaded = false;

  async get<K extends keyof AppConfig>(key: K): Promise<AppConfig[K]> {
    if (!this.cacheLoaded) {
      await this.loadCache();
    }

    // DB cache overrides defaults, env overrides everything
    const merged = { ...defaultConfig, ...this.cache, ...loadConfigFromEnv() };
    return merged[key];
  }

  async getAll(): Promise<AppConfig> {
    const envConfig = loadConfigFromEnv();

    if (!this.cacheLoaded) {
      await this.loadCache();
    }

    return { ...defaultConfig, ...this.cache, ...envConfig };
  }

  async set<K extends keyof AppConfig>(
    key: K,
    value: AppConfig[K],
    userId: string
  ): Promise<{ error: Error | null }> {
    const dbKey = configKeyToDbKey[key];
    const client = await createServerSupabaseClient();

    const { error } = await client.from("config").upsert(
      {
        key: dbKey,
        value: value as unknown,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );

    if (error) {
      return { error: new Error(error.message) };
    }

    // Invalidate cache
    this.cache = null;
    this.cacheLoaded = false;
    return { error: null };
  }

  private async loadCache(): Promise<void> {
    const client = await createServerSupabaseClient();
    const { data, error } = await client.from("config").select("key, value");

    if (error || !data) {
      this.cache = {};
      this.cacheLoaded = true;
      return;
    }

    const partial: Partial<AppConfig> = {};
    for (const row of data) {
      const configKey = dbKeyToConfigKey[row.key];
      if (configKey) {
        (partial as Record<typeof configKey, unknown>)[configKey] = row.value;
      }
    }

    this.cache = partial;
    this.cacheLoaded = true;
  }
}

export const configRepository = new ConfigRepositoryImpl();
