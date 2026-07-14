"use server";

import { createServiceRoleClient } from "@/infrastructure/supabase/serviceRole";

export async function getGlobalLeaderboard(limit = 10) {
  const service = createServiceRoleClient();
  const { data } = await service
    .from("champion_reputation")
    .select("user_id, reputation_points, users(display_name)")
    .order("reputation_points", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as {
    user_id: string;
    reputation_points: number;
    users: { display_name: string | null } | null;
  }[];
}

export async function getCategoryLeaderboard(categoryId: string, limit = 5) {
  const service = createServiceRoleClient();
  const { data } = await service
    .from("champion_reputation")
    .select(
      "user_id, reputation_points, answered_count, confirmed_count, rejected_count, users(display_name)"
    )
    .eq("category_id", categoryId)
    .order("reputation_points", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getChampionProfile(userId: string) {
  const service = createServiceRoleClient();

  const { data: user } = await service
    .from("users")
    .select("display_name, created_at")
    .eq("id", userId)
    .single();

  const { data: reputation } = await service
    .from("champion_reputation")
    .select("*, categories(name, slug)")
    .eq("user_id", userId)
    .order("reputation_points", { ascending: false });

  const { data: listings } = await service
    .from("listings")
    .select("supplier_id, suppliers(name, tier, area)")
    .eq("champion_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: finderFees } = await service
    .from("finder_fee_ledger")
    .select("*, suppliers(name)")
    .eq("champion_user_id", userId)
    .order("triggered_at", { ascending: false });

  return {
    user,
    reputation: reputation ?? [],
    listings: listings ?? [],
    finderFees: finderFees ?? [],
  };
}

export async function topChampionsForCategory(
  categoryId: string,
  limit = 5
) {
  const service = createServiceRoleClient();
  const { data } = await service
    .from("champion_reputation")
    .select("user_id, reputation_points, users(display_name)")
    .eq("category_id", categoryId)
    .order("reputation_points", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getChampionReputationSummary(userId: string) {
  const service = createServiceRoleClient();

  const { data: reps } = await service
    .from("champion_reputation")
    .select("reputation_points, answered_count, confirmed_count, rejected_count")
    .eq("user_id", userId);

  if (!reps || reps.length === 0) {
    return { totalRep: 0, totalAnswered: 0, totalConfirmed: 0, totalRejected: 0 };
  }

  return reps.reduce(
    (acc, r) => ({
      totalRep: acc.totalRep + (r.reputation_points as number),
      totalAnswered: acc.totalAnswered + (r.answered_count as number),
      totalConfirmed: acc.totalConfirmed + (r.confirmed_count as number),
      totalRejected: acc.totalRejected + (r.rejected_count as number),
    }),
    { totalRep: 0, totalAnswered: 0, totalConfirmed: 0, totalRejected: 0 }
  );
}
