import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for trusted server operations only.
 * This client bypasses RLS and must NEVER be used in browser code.
 */
export function createServiceRoleClient() {
  if (typeof window !== "undefined") {
    throw new Error("Service role client cannot be created in the browser");
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
