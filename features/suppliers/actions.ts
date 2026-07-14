"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseAuthAdapter } from "@/infrastructure/supabaseAuthAdapter";
import { createServiceRoleClient } from "@/infrastructure/supabase/serviceRole";
import { supabaseStorageAdapter } from "@/infrastructure/supabaseStorageAdapter";
import { matchingPolicy, normalizePhone } from "@/domain/matching";
import { defaultConfig } from "@/config";
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

export interface UploadSupplierResult {
  success: boolean;
  message: string;
  supplierId?: string;
}

export async function uploadSupplier(
  _state: UploadSupplierResult | null,
  formData: FormData
): Promise<UploadSupplierResult> {
  const session = await supabaseAuthAdapter.getSession();
  if (!session.userId) {
    return { success: false, message: "You must be logged in." };
  }
  if (!session.verifiedAt) {
    return { success: false, message: "Account pending verification." };
  }

  const name = (formData.get("name") as string)?.trim();
  const categoryId = formData.get("categoryId") as string;
  const suggestedCategoryName = (
    formData.get("suggestedCategoryName") as string
  )?.trim();
  const area = (formData.get("area") as string)?.trim();
  const phone = normalizePhone(formData.get("phone") as string);
  const howIKnow = (formData.get("howIKnow") as string)?.trim() || null;
  const lat = parseFloat(formData.get("latitude") as string);
  const lng = parseFloat(formData.get("longitude") as string);
  const photo = formData.get("photo") as File | null;
  const answeringRequestId =
    (formData.get("answeringRequestId") as string) || null;

  const attestationsRaw = formData.getAll("unfindableAttestation") as string[];
  const unfindableAttestations = Object.fromEntries(
    attestationsRaw.map((key) => [key, true])
  );

  if (!name || !categoryId || !area || !phone || !photo) {
    return { success: false, message: "All required fields must be filled." };
  }

  if (attestationsRaw.length === 0) {
    return {
      success: false,
      message: "Please confirm at least one unfindable attestation.",
    };
  }

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return { success: false, message: "Location is required for upload." };
  }

  const service = createServiceRoleClient();

  // Validate or suggest category
  let finalCategoryId = categoryId;

  if (categoryId === "__suggest__") {
    if (!suggestedCategoryName || suggestedCategoryName.length < 2) {
      return {
        success: false,
        message: "Please enter a category name to suggest.",
      };
    }

    const slug = suggestedCategoryName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const { data: existing } = await service
      .from("categories")
      .select("id, status")
      .eq("slug", slug)
      .single();

    if (existing && existing.status === "approved") {
      finalCategoryId = existing.id;
    } else {
      const { data: placeholder } = await service
        .from("categories")
        .select("id")
        .eq("slug", "pending-review")
        .single();

      const { data: newCategory } = await service
        .from("categories")
        .insert({
          slug,
          name: suggestedCategoryName,
          status: "pending",
          suggested_by: session.userId,
        })
        .select("id")
        .single();

      const pendingCategoryId =
        newCategory?.id ?? placeholder?.id ?? categoryId;
      finalCategoryId = pendingCategoryId;

      await service.from("admin_queue").insert({
        item_type: "category_suggest",
        item_id: pendingCategoryId,
        metadata: { suggested_by: session.userId, name: suggestedCategoryName },
      });
    }
  } else {
    const { data: category } = await service
      .from("categories")
      .select("id, status")
      .eq("id", categoryId)
      .single();

    if (!category || category.status !== "approved") {
      return { success: false, message: "Please select an approved category." };
    }
  }

  // Check for exact phone match
  const { data: existingContacts } = await service
    .from("supplier_contacts")
    .select("supplier_id, phone")
    .eq("phone", phone);

  const exactMatch = existingContacts?.[0];

  if (exactMatch) {
    const supplierId = exactMatch.supplier_id;

    // Insert corroboration listing
    await service.from("listings").insert({
      supplier_id: supplierId,
      champion_user_id: session.userId,
      how_i_know_note: howIKnow,
      unfindable_attestations: unfindableAttestations,
    });

    // Promote to Tier 2
    await service
      .from("suppliers")
      .update({ tier: 2, tier_updated_at: new Date().toISOString() })
      .eq("id", supplierId);

    // Award corroboration reputation to the second champion
    await addReputation(
      session.userId,
      finalCategoryId,
      "corroboration",
      defaultConfig.reputationWeights.confirmed,
      { confirmed: 1 }
    );

    if (answeringRequestId) {
      await attachAnswer(answeringRequestId, supplierId, session.userId);
    }

    revalidatePath(`/suppliers/${supplierId}`);
    redirect(`/suppliers/${supplierId}`);
  }

  // Check for fuzzy match
  const { data: candidates } = await service
    .from("suppliers")
    .select("id, name, area, geopoint, tier")
    .is("deleted_at", null)
    .neq("id", "00000000-0000-0000-0000-000000000000");

  let fuzzyMatchId: string | null = null;
  const newSupplierGeo = { latitude: lat, longitude: lng };

  for (const candidate of candidates ?? []) {
    const decision = matchingPolicy.shouldAutoMergeToFuzzy(
      { name, area, phone, geopoint: newSupplierGeo },
      {
        name: candidate.name,
        area: candidate.area,
        phone: "",
        geopoint: candidate.geopoint
          ? {
              latitude: (
                candidate.geopoint as { coordinates: [number, number] }
              ).coordinates[1],
              longitude: (
                candidate.geopoint as { coordinates: [number, number] }
              ).coordinates[0],
            }
          : undefined,
      }
    );
    if (decision === "fuzzy-flag") {
      fuzzyMatchId = candidate.id;
      break;
    }
  }

  // Create new supplier
  const { data: newSupplier, error: supplierError } = await service
    .from("suppliers")
    .insert({
      name,
      category_id: finalCategoryId,
      area,
      geopoint: `POINT(${lng} ${lat})`,
      tier: 1,
    })
    .select("id")
    .single();

  if (supplierError || !newSupplier) {
    return {
      success: false,
      message: supplierError?.message ?? "Supplier creation failed",
    };
  }

  const supplierId = newSupplier.id;

  // Insert contact
  await service.from("supplier_contacts").insert({
    supplier_id: supplierId,
    phone,
    source: "champion_typed",
    added_by_user_id: session.userId,
  });

  // Upload photo
  const ext = photo.name.split(".").pop() || "jpg";
  const storagePath = `${session.userId}/${supplierId}/${Date.now()}.${ext}`;
  const { error: uploadError } = await supabaseStorageAdapter.upload(
    photo,
    storagePath
  );

  if (uploadError) {
    return { success: false, message: uploadError.message };
  }

  // Insert photo row with pending OCR
  const { data: photoRow, error: photoInsertError } = await service
    .from("supplier_photos")
    .insert({
      supplier_id: supplierId,
      storage_path: storagePath,
      geopoint: `POINT(${lng} ${lat})`,
      ocr_status: "held", // fail-safe: held until Edge Function processes
    })
    .select("id")
    .single();

  if (photoInsertError || !photoRow) {
    return { success: false, message: "Photo record creation failed" };
  }

  const photoId = photoRow.id;

  // Trigger OCR Edge Function (fire-and-forget)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && supabaseKey) {
    fetch(`${supabaseUrl}/functions/v1/scan-photo-ocr`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        photoId,
        storagePath,
        supplierId,
      }),
    }).catch((err) => {
      console.error("OCR Edge Function trigger failed:", err);
    });
  }

  // Always create admin queue item as safety net (resolved by Edge Function if clean)
  await service.from("admin_queue").insert({
    item_type: "photo",
    item_id: supplierId,
    metadata: {
      storage_path: storagePath,
      champion_id: session.userId,
      photo_id: photoId,
    },
  });

  // Create listing
  await service.from("listings").insert({
    supplier_id: supplierId,
    champion_user_id: session.userId,
    how_i_know_note: howIKnow,
    unfindable_attestations: unfindableAttestations,
  });

  // Finder fee ledger (only for new suppliers)
  await service.from("finder_fee_ledger").insert({
    champion_user_id: session.userId,
    supplier_id: supplierId,
    fee_percent: defaultConfig.finderFeePercent,
  });

  // Fuzzy flag if applicable
  if (fuzzyMatchId) {
    await service.from("admin_queue").insert({
      item_type: "fuzzy_match",
      item_id: supplierId,
      metadata: { other_supplier_id: fuzzyMatchId },
    });
  }

  if (answeringRequestId) {
    await attachAnswer(answeringRequestId, supplierId, session.userId);
  }

  revalidatePath(`/suppliers/${supplierId}`);
  redirect(`/suppliers/${supplierId}`);
}

async function attachAnswer(
  requestId: string,
  supplierId: string,
  championUserId: string
) {
  const service = createServiceRoleClient();

  const { data: request } = await service
    .from("requests")
    .select("state, category_id")
    .eq("id", requestId)
    .single();

  if (request?.state !== "open") return;

  const { data: answer, error: answerError } = await service
    .from("answers")
    .insert({
      request_id: requestId,
      champion_user_id: championUserId,
      supplier_id: supplierId,
      state: "answered",
    })
    .select("id")
    .single();

  if (answerError) {
    console.error("attachAnswer failed:", answerError.message);
    return;
  }

  if (!answer) return;

  await service.from("requests").update({
    state: "answered",
    answered_at: new Date().toISOString(),
  });

  await addReputation(
    championUserId,
    request.category_id,
    "answered",
    defaultConfig.reputationWeights.answered,
    { answered: 1 },
    requestId
  );
}
