"use server";

import { supabaseAuthAdapter } from "@/infrastructure/supabaseAuthAdapter";
import { createServiceRoleClient } from "@/infrastructure/supabase/serviceRole";

export interface ClaimResult {
  success: boolean;
  message: string;
}

export async function claimSupplier(supplierId: string): Promise<ClaimResult> {
  const session = await supabaseAuthAdapter.getSession();
  if (!session.userId) {
    return { success: false, message: "You must be logged in." };
  }
  if (!session.verifiedAt) {
    return {
      success: false,
      message: "Verified account required to claim a listing.",
    };
  }

  const service = createServiceRoleClient();

  const { data: supplier } = await service
    .from("suppliers")
    .select("id, claimed_by_user_id, tier")
    .eq("id", supplierId)
    .single();

  if (!supplier) {
    return { success: false, message: "Supplier not found." };
  }

  if (supplier.claimed_by_user_id) {
    return { success: false, message: "This listing is already claimed." };
  }

  // MVP: Insert admin queue for founder to initiate manual OTP relay
  await service.from("admin_queue").insert({
    item_type: "listing_moderation",
    item_id: supplierId,
    metadata: {
      claim_by_user_id: session.userId,
      phone: session.phone,
      reason: "claim_request",
      note: "Supplier claim request — founder should text OTP to the listed phone, then verify the claim.",
    },
  });

  return {
    success: true,
    message:
      "Claim submitted. The founder will verify your claim to the listed phone number.",
  };
}

export async function approveClaim(supplierId: string, claimantUserId: string) {
  const session = await supabaseAuthAdapter.getSession();
  if (!session.userId || session.role !== "admin") {
    return { success: false, message: "Admin only." };
  }

  const service = createServiceRoleClient();

  await service
    .from("suppliers")
    .update({
      claimed_by_user_id: claimantUserId,
      claimed_at: new Date().toISOString(),
      tier: 3,
      tier_updated_at: new Date().toISOString(),
    })
    .eq("id", supplierId);

  return { success: true };
}

export interface EditSupplierResult {
  success: boolean;
  message: string;
}

export async function editClaimedSupplier(
  _state: EditSupplierResult | null,
  formData: FormData
): Promise<EditSupplierResult> {
  const session = await supabaseAuthAdapter.getSession();
  if (!session.userId) {
    return { success: false, message: "You must be logged in." };
  }

  const supplierId = formData.get("supplierId") as string;
  const name = (formData.get("name") as string)?.trim();
  const area = (formData.get("area") as string)?.trim();

  if (!supplierId || !name || !area) {
    return { success: false, message: "Name and area are required." };
  }

  const service = createServiceRoleClient();

  const { data: supplier } = await service
    .from("suppliers")
    .select("claimed_by_user_id")
    .eq("id", supplierId)
    .single();

  if (!supplier || supplier.claimed_by_user_id !== session.userId) {
    return {
      success: false,
      message: "You can only edit listings you have claimed.",
    };
  }

  const { error } = await service
    .from("suppliers")
    .update({ name, area })
    .eq("id", supplierId);

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, message: "Supplier updated." };
}

export interface DelistResult {
  success: boolean;
  message: string;
}

export async function requestDelisting(
  supplierId: string,
  reason: string
): Promise<DelistResult> {
  const session = await supabaseAuthAdapter.getSession();
  if (!session.userId) {
    return { success: false, message: "You must be logged in." };
  }

  const service = createServiceRoleClient();

  const { data: supplier } = await service
    .from("suppliers")
    .select("claimed_by_user_id, tier")
    .eq("id", supplierId)
    .single();

  if (!supplier) {
    return { success: false, message: "Supplier not found." };
  }

  await service.from("admin_queue").insert({
    item_type: "listing_moderation",
    item_id: supplierId,
    metadata: {
      reason: reason || "delist_request",
      requested_by: session.userId,
    },
  });

  return {
    success: true,
    message:
      "Delisting request submitted. An admin will review it shortly.",
  };
}
