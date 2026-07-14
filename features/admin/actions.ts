"use server";

import { supabaseAuthAdapter } from "@/infrastructure/supabaseAuthAdapter";
import { createServiceRoleClient } from "@/infrastructure/supabase/serviceRole";

export async function getAdminQueueCounts() {
  const service = createServiceRoleClient();

  const types = [
    "photo",
    "fuzzy_match",
    "flag_findable",
    "category_suggest",
    "user_verify",
    "listing_moderation",
  ];

  const counts: Record<string, number> = {};

  for (const type of types) {
    const { count } = await service
      .from("admin_queue")
      .select("*", { count: "exact", head: true })
      .eq("item_type", type)
      .eq("status", "pending");
    counts[type] = count ?? 0;
  }

  return counts;
}

export async function getAdminQueueItems(type: string, status = "pending") {
  const service = createServiceRoleClient();
  const { data } = await service
    .from("admin_queue")
    .select("*")
    .eq("item_type", type)
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(50);
  return data ?? [];
}

export async function resolveAdminQueueItem(
  queueId: string,
  resolution: "resolved" | "rejected",
  metadata?: Record<string, unknown>
) {
  const session = await supabaseAuthAdapter.getSession();
  if (!session.userId || session.role !== "admin") {
    return { success: false, message: "Admin access required." };
  }

  const service = createServiceRoleClient();
  const { error } = await service
    .from("admin_queue")
    .update({
      status: resolution,
      assigned_to: session.userId,
      resolved_at: new Date().toISOString(),
      metadata,
    })
    .eq("id", queueId);

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true };
}

export async function verifyUser(userId: string) {
  const session = await supabaseAuthAdapter.getSession();
  if (!session.userId || session.role !== "admin") {
    return { success: false, message: "Admin access required." };
  }

  const service = createServiceRoleClient();
  const { error } = await service
    .from("users")
    .update({
      verified_at: new Date().toISOString(),
      verified_by: session.userId,
    })
    .eq("id", userId);

  if (error) {
    return { success: false, message: error.message };
  }

  // Resolve the user_verify queue item
  await service
    .from("admin_queue")
    .update({
      status: "resolved",
      assigned_to: session.userId,
      resolved_at: new Date().toISOString(),
    })
    .eq("item_type", "user_verify")
    .eq("item_id", userId)
    .eq("status", "pending");

  return { success: true };
}

export async function approveCategory(categoryId: string) {
  const session = await supabaseAuthAdapter.getSession();
  if (!session.userId || session.role !== "admin") {
    return { success: false, message: "Admin access required." };
  }

  const service = createServiceRoleClient();
  const { error } = await service
    .from("categories")
    .update({ status: "approved" })
    .eq("id", categoryId);

  if (error) {
    return { success: false, message: error.message };
  }

  await service
    .from("admin_queue")
    .update({
      status: "resolved",
      assigned_to: session.userId,
      resolved_at: new Date().toISOString(),
    })
    .eq("item_type", "category_suggest")
    .eq("item_id", categoryId)
    .eq("status", "pending");

  return { success: true };
}
