import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { supabase, response } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return response;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, verified_at")
    .eq("id", user.id)
    .single();

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Block gated routes for pending users
  const gatedPrefixes = ["/requests", "/suppliers/upload", "/suppliers/claim"];
  const isGated = gatedPrefixes.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix)
  );

  if (isGated && !profile?.verified_at) {
    return NextResponse.redirect(new URL("/profile?pending=true", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
