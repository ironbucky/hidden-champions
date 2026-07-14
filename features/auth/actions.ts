"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseAuthAdapter } from "@/infrastructure/supabaseAuthAdapter";
import { createServiceRoleClient } from "@/infrastructure/supabase/serviceRole";
import { normalizePhone } from "@/domain/matching";

export async function signUp(
  _state: { message: string } | null,
  formData: FormData
) {
  const phone = formData.get("phone") as string;
  const password = formData.get("password") as string;

  if (!phone || !password || password.length < 6) {
    return {
      message: "Phone and a password of at least 6 characters are required.",
    };
  }

  const { userId, error } = await supabaseAuthAdapter.signUpWithPhone(
    phone,
    password
  );

  if (error || !userId) {
    return { message: error?.message ?? "Signup failed" };
  }

  // Notify founder admin via user_verify queue
  const service = createServiceRoleClient();
  await service.from("admin_queue").insert({
    item_type: "user_verify",
    item_id: userId,
    status: "pending",
    metadata: { phone: normalizePhone(phone), source: "signup" },
  });

  revalidatePath("/");
  redirect("/login?pending=true");
}

export async function logIn(
  _state: { message: string } | null,
  formData: FormData
) {
  const phone = formData.get("phone") as string;
  const password = formData.get("password") as string;

  if (!phone || !password) {
    return { message: "Phone and password are required." };
  }

  const { error } = await supabaseAuthAdapter.loginWithPhone(phone, password);

  if (error) {
    return { message: error.message };
  }

  revalidatePath("/");
  redirect("/profile");
}

export async function signOut() {
  await supabaseAuthAdapter.signOut();
  redirect("/login");
}

export async function updateDisplayName(
  _state: { message: string } | null,
  formData: FormData
) {
  const displayName = formData.get("displayName") as string;

  if (!displayName || displayName.length < 2) {
    return { message: "Display name must be at least 2 characters." };
  }

  // Reject phone-pattern display names
  const phoneLike = /^(\+?92|0)?3\d{2}[-\s]?\d{7}$/;
  if (phoneLike.test(displayName.replace(/\s/g, ""))) {
    return { message: "Display names cannot look like phone numbers." };
  }

  const session = await supabaseAuthAdapter.getSession();
  if (!session.userId) {
    return { message: "You must be logged in." };
  }

  const service = createServiceRoleClient();
  const { error } = await service
    .from("users")
    .update({ display_name: displayName })
    .eq("id", session.userId);

  if (error) {
    return { message: error.message };
  }

  revalidatePath("/profile");
  return { message: "Display name updated." };
}
