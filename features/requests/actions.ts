"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseAuthAdapter } from "@/infrastructure/supabaseAuthAdapter";
import { createServiceRoleClient } from "@/infrastructure/supabase/serviceRole";
import { expiryPolicy } from "@/domain/expiry";
import { reputationPolicy } from "@/domain/reputation";
import { loadConfigFromEnv } from "@/config";
import { addReputation } from "@/features/shared/reputation";

export async function getApprovedCategories() {
  const service = createServiceRoleClient();
  const { data } = await service
    .from("categories")
    .select("id, slug, name")
    .eq("status", "approved")
    .order("name");
  return data ?? [];
}

export async function searchSimilarRequests(query: string) {
  if (!query || query.length < 3) return [];
  const service = createServiceRoleClient();
  const { data } = await service
    .from("requests")
    .select("id, what, category_id, area, upvotes, categories(name)")
    .eq("state", "open")
    .ilike("what", `%${query}%`)
    .order("upvotes", { ascending: false })
    .limit(5);
  return data ?? [];
}

export interface PostRequestResult {
  success: boolean;
  message: string;
}

export async function postRequest(
  _state: PostRequestResult | null,
  formData: FormData
): Promise<PostRequestResult> {
  const session = await supabaseAuthAdapter.getSession();
  if (!session.userId) {
    return { success: false, message: "You must be logged in." };
  }
  if (!session.verifiedAt) {
    return {
      success: false,
      message: "Account pending verification. Verified accounts only.",
    };
  }

  const what = (formData.get("what") as string)?.trim();
  const categoryId = formData.get("categoryId") as string;
  const area = (formData.get("area") as string)?.trim();
  const notes = (formData.get("notes") as string)?.trim() || null;

  const attestationsRaw = formData.getAll("unfindableAttestation") as string[];
  const unfindableAttestations = Object.fromEntries(
    attestationsRaw.map((key) => [key, true])
  );

  if (!what || !categoryId || !area) {
    return { success: false, message: "All required fields must be filled." };
  }

  const service = createServiceRoleClient();

  // Validate category exists and is approved
  const { data: category } = await service
    .from("categories")
    .select("id, status")
    .eq("id", categoryId)
    .single();
  if (!category || category.status !== "approved") {
    return { success: false, message: "Selected category is not valid." };
  }

  if (attestationsRaw.length === 0) {
    return {
      success: false,
      message:
        "Please confirm at least one unfindable attestation — you must attest you searched and struck out.",
    };
  }

  const config = loadConfigFromEnv();
  const now = new Date();
  const expiresAt = expiryPolicy.computeExpiry(now, config.requestExpiryDays);
  const staleBountyAt = expiryPolicy.computeStaleBountyAt(
    now,
    config.staleBountyDay
  );
  const { data: request, error } = await service
    .from("requests")
    .insert({
      requester_user_id: session.userId,
      what,
      category_id: categoryId,
      area,
      unfindable_attestations: unfindableAttestations,
      notes,
      upvotes: 0,
      state: "open",
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      stale_bounty_at: staleBountyAt.toISOString(),
    })
    .select("id")
    .single();

  if (error || !request) {
    return { success: false, message: error?.message ?? "Request creation failed" };
  }

  revalidatePath("/requests");
  redirect(`/requests/${request.id}`);
}

export async function toggleUpvote(
  requestId: string,
  userId: string,
  currentlyUpvoted: boolean
) {
  const service = createServiceRoleClient();

  // Check request state
  const { data: request } = await service
    .from("requests")
    .select("state, upvotes")
    .eq("id", requestId)
    .single();

  if (!request || request.state !== "open") return;

  if (currentlyUpvoted) {
    await service
      .from("request_upvotes")
      .delete()
      .eq("request_id", requestId)
      .eq("user_id", userId);

    await service
      .from("requests")
      .update({ upvotes: Math.max(0, (request.upvotes as number) - 1) })
      .eq("id", requestId);
  } else {
    await service.from("request_upvotes").upsert(
      { request_id: requestId, user_id: userId },
      { onConflict: "request_id, user_id" }
    );

    await service
      .from("requests")
      .update({ upvotes: (request.upvotes as number) + 1 })
      .eq("id", requestId);
  }

  revalidatePath(`/requests/${requestId}`);
}

export async function confirmAnswer(requestId: string, answerId: string) {
  const session = await supabaseAuthAdapter.getSession();
  if (!session.userId) redirect("/login");

  const service = createServiceRoleClient();

  const { data: request } = await service
    .from("requests")
    .select("state, requester_user_id, category_id, stale_bounty_at")
    .eq("id", requestId)
    .single();

  if (
    !request ||
    request.state !== "answered" ||
    request.requester_user_id !== session.userId
  ) {
    return;
  }

  const { data: answer } = await service
    .from("answers")
    .select("champion_user_id, state")
    .eq("id", answerId)
    .eq("request_id", requestId)
    .single();

  if (!answer || answer.state !== "answered") return;

  const config = loadConfigFromEnv();
  const now = new Date();
  const isStale = request.stale_bounty_at
    ? now.getTime() >= new Date(request.stale_bounty_at as string).getTime()
    : false;

  const points = reputationPolicy.pointsForEvent("confirmed", config.reputationWeights, {
    isStale,
    staleBountyMultiplier: config.staleBountyMultiplier,
  });

  await service
    .from("requests")
    .update({
      state: "confirmed",
      confirmed_at: now.toISOString(),
    })
    .eq("id", requestId);

  await service
    .from("answers")
    .update({ state: "confirmed", resolved_at: now.toISOString() })
    .eq("id", answerId);

  // Reject all other answered answers for this request
  await service
    .from("answers")
    .update({ state: "rejected", resolved_at: now.toISOString() })
    .eq("request_id", requestId)
    .eq("state", "answered")
    .neq("id", answerId);

  await addReputation(
    answer.champion_user_id as string,
    request.category_id as string,
    "confirmed",
    points,
    { confirmed: 1 },
    requestId
  );

  revalidatePath(`/requests/${requestId}`);
}

export async function rejectAnswer(requestId: string, answerId: string) {
  const session = await supabaseAuthAdapter.getSession();
  if (!session.userId) redirect("/login");

  const service = createServiceRoleClient();

  const { data: request } = await service
    .from("requests")
    .select("state, requester_user_id, category_id")
    .eq("id", requestId)
    .single();

  if (
    !request ||
    request.state !== "answered" ||
    request.requester_user_id !== session.userId
  ) {
    return;
  }

  const { data: answer } = await service
    .from("answers")
    .select("champion_user_id, state")
    .eq("id", answerId)
    .eq("request_id", requestId)
    .single();

  if (!answer || answer.state !== "answered") return;

  const now = new Date();

  await service
    .from("requests")
    .update({ state: "open", answered_at: null })
    .eq("id", requestId);

  await service
    .from("answers")
    .update({ state: "rejected", resolved_at: now.toISOString() })
    .eq("id", answerId);

  await addReputation(
    answer.champion_user_id as string,
    request.category_id as string,
    "rejected",
    0,
    { rejected: 1 },
    requestId
  );

  revalidatePath(`/requests/${requestId}`);
}

export async function flagAsFindable(
  requestId: string,
  link: string,
  notes: string
) {
  const session = await supabaseAuthAdapter.getSession();
  if (!session.userId) return;

  const service = createServiceRoleClient();

  const { data: request } = await service
    .from("requests")
    .select("state")
    .eq("id", requestId)
    .single();

  if (!request || request.state !== "open") return;

  await service.from("admin_queue").insert({
    item_type: "flag_findable",
    item_id: requestId,
    metadata: { champion_id: session.userId, link, notes },
  });

  revalidatePath(`/requests/${requestId}`);
}

export async function getRequestWithAnswers(requestId: string) {
  const service = createServiceRoleClient();
  const { data } = await service
    .from("requests")
    .select(
      "*, categories(name), answers(*, users(display_name), suppliers(id, name))"
    )
    .eq("id", requestId)
    .single();
  return data;
}

export async function getUserUpvote(requestId: string, userId: string) {
  const service = createServiceRoleClient();
  const { data } = await service
    .from("request_upvotes")
    .select("created_at")
    .eq("request_id", requestId)
    .eq("user_id", userId)
    .single();
  return data !== null;
}
