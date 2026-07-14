"use server";

import { supabaseAuthAdapter } from "@/infrastructure/supabaseAuthAdapter";
import { createServiceRoleClient } from "@/infrastructure/supabase/serviceRole";
import { contactUnlockPolicy } from "@/domain/contactUnlock";
import { loadConfigFromEnv } from "@/config";

export interface UnlockContactResult {
  success: boolean;
  message: string;
  phone?: string;
  remaining?: number;
}

export async function unlockContact(
  supplierId: string
): Promise<UnlockContactResult> {
  const session = await supabaseAuthAdapter.getSession();
  if (!session.userId) {
    return { success: false, message: "You must be logged in." };
  }
  if (!session.verifiedAt) {
    return {
      success: false,
      message: "Verified account required to unlock contacts.",
    };
  }

  const config = loadConfigFromEnv();
  const service = createServiceRoleClient();

  // Count today's unlocks
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { count, error: countError } = await service
    .from("contact_unlocks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.userId)
    .gte("unlocked_at", startOfDay.toISOString());

  if (countError) {
    return { success: false, message: "Could not check unlock quota." };
  }

  const dailyCount = count ?? 0;

  if (
    !contactUnlockPolicy.canUnlock(
      { verifiedAt: session.verifiedAt },
      dailyCount,
      config.contactUnlockDailyQuota
    )
  ) {
    return {
      success: false,
      message: `Daily unlock limit of ${config.contactUnlockDailyQuota} reached. Try again tomorrow.`,
    };
  }

  // Rate-limit anomaly check: flag if user approaching quota on consecutive days
  if (dailyCount >= config.contactUnlockDailyQuota * 0.8) {
    // Approaching quota — log for anomaly review
    const { data: recentUnlocks } = await service
      .from("contact_unlocks")
      .select("unlocked_at")
      .eq("user_id", session.userId)
      .gte("unlocked_at", new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString())
      .order("unlocked_at", { ascending: false });

    if (recentUnlocks && recentUnlocks.length >= config.contactUnlockDailyQuota * 3) {
      await service.from("admin_queue").insert({
        item_type: "user_verify",
        item_id: session.userId,
        metadata: {
          reason: "quota_anomaly",
          unlock_count_72h: recentUnlocks.length,
          note: "User approaching quota on multiple consecutive days",
        },
      });
    }
  }

  // Check if already unlocked for this supplier recently
  const recentStart = new Date();
  recentStart.setUTCHours(0, 0, 0, 0);

  const { data: existingUnlock } = await service
    .from("contact_unlocks")
    .select("id")
    .eq("user_id", session.userId)
    .eq("supplier_id", supplierId)
    .gte("unlocked_at", recentStart.toISOString())
    .single();

  if (existingUnlock) {
    // Already unlocked today — just return the phone
    const { data: contacts } = await service
      .from("supplier_contacts")
      .select("phone")
      .eq("supplier_id", supplierId);

    const remaining = contactUnlockPolicy.remainingQuota(
      dailyCount,
      config.contactUnlockDailyQuota
    );

    return {
      success: true,
      message: "Contact already unlocked today.",
      phone: (contacts?.[0] as { phone: string } | undefined)?.phone,
      remaining,
    };
  }

  // Insert unlock record
  const { error: unlockError } = await service.from("contact_unlocks").insert({
    user_id: session.userId,
    supplier_id: supplierId,
  });

  if (unlockError) {
    return { success: false, message: unlockError.message };
  }

  // Query contacts (RLS now permits)
  const { data: contacts } = await service
    .from("supplier_contacts")
    .select("phone")
    .eq("supplier_id", supplierId);

  const remaining = contactUnlockPolicy.remainingQuota(
    dailyCount + 1,
    config.contactUnlockDailyQuota
  );

  return {
    success: true,
    message: "Contact unlocked.",
    phone: (contacts?.[0] as { phone: string } | undefined)?.phone,
    remaining,
  };
}

export async function getContactUnlockQuota(): Promise<{
  used: number;
  quota: number;
  remaining: number;
}> {
  const session = await supabaseAuthAdapter.getSession();
  if (!session.userId) return { used: 0, quota: 0, remaining: 0 };

  const config = loadConfigFromEnv();
  const service = createServiceRoleClient();

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { count } = await service
    .from("contact_unlocks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.userId)
    .gte("unlocked_at", startOfDay.toISOString());

  const used = count ?? 0;
  const remaining = contactUnlockPolicy.remainingQuota(
    used,
    config.contactUnlockDailyQuota
  );

  return { used, quota: config.contactUnlockDailyQuota, remaining };
}
