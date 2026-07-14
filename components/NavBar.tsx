import Link from "next/link";
import { createServiceRoleClient } from "@/infrastructure/supabase/serviceRole";
import { MobileNavMenu } from "./MobileNavMenu";

interface NavBarProps {
  isLoggedIn: boolean;
}

export async function NavBar({ isLoggedIn }: NavBarProps) {
  const service = createServiceRoleClient();
  const { data: categories } = await service
    .from("categories")
    .select("id, slug, name")
    .eq("status", "approved")
    .order("name")
    .limit(12);

  const cats =
    (categories as { id: string; slug: string; name: string }[] | null) ?? [];

  return (
    <header className="border-border bg-surface border-b">
      <nav className="mx-auto flex h-14 max-w-3xl items-center gap-5 px-4 sm:px-6 lg:max-w-6xl lg:px-8">
        <Link
          href="/"
          className="display text-fg flex items-center gap-2 text-base font-semibold"
        >
          <span
            className="rounded-pill flex h-7 w-7 items-center justify-center font-mono text-xs font-bold text-white"
            style={{ background: "var(--indigo)" }}
            aria-hidden="true"
          >
            HC
          </span>
          <span className="flex flex-col leading-none">
            <span>Hidden Champions</span>
            <span className="text-muted mt-0.5 hidden text-[10px] font-normal sm:block">
              Lahore garment trade
            </span>
          </span>
        </Link>

        <Link
          href="/suppliers"
          className="text-muted hover:text-fg hidden items-center gap-1 text-sm transition-colors sm:flex"
        >
          Browse
          <svg
            viewBox="0 0 12 12"
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M3 5l3 3 3-3" />
          </svg>
        </Link>

        <div className="ml-auto flex items-center gap-5">
          <MobileNavMenu categories={cats} isLoggedIn={isLoggedIn} />
          {isLoggedIn ? (
            <>
              <Link
                href="/requests"
                className="text-muted hover:text-fg hidden text-sm transition-colors sm:inline"
              >
                Requests
              </Link>
              <Link
                href="/champions"
                className="text-muted hover:text-fg hidden text-sm transition-colors sm:inline"
              >
                Champions
              </Link>
              <Link
                href="/profile"
                className="text-muted hover:text-fg hidden text-sm transition-colors sm:inline"
              >
                Profile
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/suppliers"
                className="text-muted hover:text-fg hidden text-sm transition-colors sm:inline"
              >
                Suppliers
              </Link>
              <Link
                href="/login"
                className="text-muted hover:text-fg hidden text-sm transition-colors sm:inline"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="btn-primary hidden sm:inline-flex"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
      <div className="ajrak-thin" aria-hidden="true" />
    </header>
  );
}
