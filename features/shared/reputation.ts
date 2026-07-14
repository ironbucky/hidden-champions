"use server";

import { createServiceRoleClient } from "@/infrastructure/supabase/serviceRole";

export async function addReputation(
  userId: string,
  categoryId: string,
  eventType: "answered" | "confirmed" | "rejected" | "corroboration",
  points: number,
  counts: { answered?: number; confirmed?: number; rejected?: number },
  requestId?: string
) {
  const service = createServiceRoleClient();

  // Insert event log
  await service.from("reputation_events").insert({
    user_id: userId,
    category_id: categoryId,
    event_type: eventType,
    points,
    request_id: requestId ?? null,
  });

  // Upsert champion_reputation
  const { data: existing } = await service
    .from("champion_reputation")
    .select("reputation_points, answered_count, confirmed_count, rejected_count")
    .eq("user_id", userId)
    .eq("category_id", categoryId)
    .single();

  if (existing) {
    await service
      .from("champion_reputation")
      .update({
        reputation_points: existing.reputation_points + points,
        answered_count: existing.answered_count + (counts.answered ?? 0),
        confirmed_count: existing.confirmed_count + (counts.confirmed ?? 0),
        rejected_count: existing.rejected_count + (counts.rejected ?? 0),
      })
      .eq("user_id", userId)
      .eq("category_id", categoryId);
  } else {
    await service.from("champion_reputation").insert({
      user_id: userId,
      category_id: categoryId,
      reputation_points: points,
      answered_count: counts.answered ?? 0,
      confirmed_count: counts.confirmed ?? 0,
      rejected_count: counts.rejected ?? 0,
    });
  }

  // Update users.reputation_total
  if (points !== 0) {
    const { data: user } = await service
      .from("users")
      .select("reputation_total")
      .eq("id", userId)
      .single();

    const currentTotal = (user?.reputation_total as number) ?? 0;
    await service
      .from("users")
      .update({ reputation_total: currentTotal + points })
      .eq("id", userId);
  }
}
