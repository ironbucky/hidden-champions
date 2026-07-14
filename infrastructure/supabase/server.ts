import { createClient } from "@/utils/supabase/server";

export async function createServerSupabaseClient() {
  return createClient();
}
