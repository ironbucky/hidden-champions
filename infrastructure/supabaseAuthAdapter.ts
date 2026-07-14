import { AuthProvider } from "./interfaces";
import { createServiceRoleClient } from "./supabase/serviceRole";
import { createServerSupabaseClient } from "./supabase/server";
import { normalizePhone } from "@/domain/matching";

export interface LoginResult {
  userId: string | null;
  error: Error | null;
}

export class SupabaseAuthAdapter implements AuthProvider {
  async signUpWithPhone(
    phone: string,
    password: string
  ): Promise<{ userId: string | null; error: Error | null }> {
    const normalized = normalizePhone(phone);
    const service = createServiceRoleClient();

    // Reject duplicate phone signups
    const { data: existing } = await service
      .from("users")
      .select("id")
      .eq("phone", normalized)
      .maybeSingle();

    if (existing) {
      return {
        userId: null,
        error: new Error(
          "An account with this phone already exists. Please log in."
        ),
      };
    }

    // Create auth user with a placeholder email derived from phone.
    // The real identifier is the phone column in public.users.
    const email = `${normalized.replace(/\+/g, "")}@hiddenchampions.phone`;

    const { data, error } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { phone: normalized },
    });

    if (error || !data.user) {
      return {
        userId: null,
        error: error ?? new Error("User creation failed"),
      };
    }

    // Mirror into public.users as pending
    const { error: profileError } = await service.from("users").insert({
      id: data.user.id,
      phone: normalized,
      verification_method: "manual",
      verified_at: null,
      role: "user",
    });

    if (profileError) {
      // Best-effort cleanup
      await service.auth.admin.deleteUser(data.user.id);
      return { userId: null, error: new Error(profileError.message) };
    }

    return { userId: data.user.id, error: null };
  }

  async loginWithPhone(phone: string, password: string): Promise<LoginResult> {
    const normalized = normalizePhone(phone);
    const email = `${normalized.replace(/\+/g, "")}@hiddenchampions.phone`;

    const client = await createServerSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return { userId: null, error: error ?? new Error("Login failed") };
    }

    return { userId: data.user.id, error: null };
  }

  async getSession(): Promise<{
    userId: string | null;
    phone: string | null;
    role: string | null;
    verifiedAt: Date | null;
    error: Error | null;
  }> {
    const client = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await client.auth.getUser();

    if (error || !user) {
      return {
        userId: null,
        phone: null,
        role: null,
        verifiedAt: null,
        error: error ?? null,
      };
    }

    const { data: profile } = await client
      .from("users")
      .select("phone, role, verified_at")
      .eq("id", user.id)
      .single();

    return {
      userId: user.id,
      phone: profile?.phone ?? null,
      role: profile?.role ?? null,
      verifiedAt: profile?.verified_at ? new Date(profile.verified_at) : null,
      error: null,
    };
  }

  async signOut(): Promise<{ error: Error | null }> {
    const client = await createServerSupabaseClient();
    const { error } = await client.auth.signOut();
    return { error };
  }
}

export const supabaseAuthAdapter = new SupabaseAuthAdapter();
