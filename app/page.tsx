import Link from "next/link";
import { supabaseAuthAdapter } from "@/infrastructure/supabaseAuthAdapter";
import { createServiceRoleClient } from "@/infrastructure/supabase/serviceRole";
import { TrustTier, trustTierPolicy } from "@/domain/trustTier";
import { getGlobalLeaderboard } from "@/features/champions/actions";
import { CategoryRail } from "@/components/CategoryRail";
import { SupplierCard } from "@/components/SupplierCard";
import { DesktopStage } from "@/components/DesktopStage";

const TIERS = [
  TrustTier.Tier1,
  TrustTier.Tier2,
  TrustTier.Tier3,
  TrustTier.Tier4,
];

export default async function HomePage() {
  const session = await supabaseAuthAdapter.getSession();
  const service = createServiceRoleClient();

  /* ---------- Categories ---------- */
  const { data: categoryRows } = await service
    .from("categories")
    .select("id, slug, name")
    .eq("status", "approved")
    .order("name");
  const categories = (categoryRows ?? []) as {
    id: string;
    slug: string;
    name: string;
  }[];

  /* ---------- Championed suppliers (Tier >= 3, top 3) ---------- */
  const { data: topSuppliersRaw } = await service
    .from("suppliers")
    .select(
      "id, name, area, tier, categories(name), listings(champion_user_id, users(display_name))"
    )
    .gte("tier", TrustTier.Tier3)
    .is("deleted_at", null)
    .order("tier", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(3);

  const topSuppliers = (topSuppliersRaw ?? []).map((s) => {
    const listings = (s as { listings?: unknown[] }).listings ?? [];
    const championListing = listings[0] as
      | { users: { display_name: string | null } }
      | undefined;
    return {
      id: s.id as string,
      name: s.name as string,
      area: s.area as string,
      tier: s.tier as number,
      categoryName:
        (s as unknown as { categories: { name: string } | null }).categories
          ?.name ?? null,
      championName: championListing?.users?.display_name ?? null,
    };
  });

  /* ---------- Hot requests (open, top 4 by upvotes) ---------- */
  await service
    .from("requests")
    .update({ state: "expired" })
    .eq("state", "open")
    .lt("expires_at", new Date().toISOString());

  const { data: hotRequestsRaw } = await service
    .from("requests")
    .select(
      "id, what, area, upvotes, stale_bounty_at, created_at, categories(name)"
    )
    .eq("state", "open")
    .order("upvotes", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(4);

  const hotRequests = (hotRequestsRaw ?? []).map((r) => ({
    id: r.id as string,
    what: r.what as string,
    area: r.area as string,
    upvotes: r.upvotes as number,
    stale: r.stale_bounty_at
      ? new Date().getTime() >= new Date(r.stale_bounty_at as string).getTime()
      : false,
    categoryName:
      (r as unknown as { categories: { name: string } | null }).categories
        ?.name ?? null,
  }));

  /* ---------- Top champions (global, top 3) ---------- */
  const topChampions = await getGlobalLeaderboard(3);

  /* ---------- Live counts for desktop hero stats ---------- */
  const { count: supplierCount } = await service
    .from("suppliers")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null);
  const { count: championCount } = await service
    .from("champion_reputation")
    .select("user_id", { count: "exact", head: true });
  const { count: requestCount } = await service
    .from("requests")
    .select("id", { count: "exact", head: true })
    .eq("state", "open");

  return (
    <main className="bg-bg flex flex-1 flex-col pt-8 pb-6 text-left sm:pt-12 sm:pb-16">
      {/* ===================== Hero ===================== */}
      <section id="heroSection" className="relative w-full overflow-hidden">
        {/* Drifting ajrak atmosphere (desktop only) */}
        <div className="hero-atmos" aria-hidden="true" />

        {/* SVG defs for ajrak star pattern + clip — referenced by DesktopStage */}
        <svg
          width="0"
          height="0"
          style={{
            position: "absolute",
            width: 0,
            height: 0,
            overflow: "hidden",
          }}
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <pattern
              id="ajrakFill"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <rect width="24" height="24" fill="oklch(38% 0.13 265)" />
              <g
                fill="none"
                stroke="oklch(96% 0.014 82)"
                strokeWidth="0.7"
                opacity="0.55"
              >
                <rect x="6" y="6" width="12" height="12" />
                <rect
                  x="6"
                  y="6"
                  width="12"
                  height="12"
                  transform="rotate(45 12 12)"
                />
              </g>
              <circle cx="12" cy="12" r="1.3" fill="oklch(64% 0.14 42)" />
            </pattern>
            <clipPath id="starClip">
              <rect x="60" y="60" width="180" height="180" />
              <rect
                x="60"
                y="60"
                width="180"
                height="180"
                transform="rotate(45 150 150)"
              />
            </clipPath>
          </defs>
        </svg>

        <div className="relative z-10 mx-auto max-w-2xl px-6 lg:max-w-6xl lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16">
            {/* Left column — text */}
            <div className="text-left sm:text-center lg:text-left">
              <p className="eyebrow mb-4">
                Lahore&apos;s supplier trust network
              </p>
              <h1 className="display text-fg text-4xl leading-tight sm:text-5xl lg:text-6xl">
                Hidden suppliers,{" "}
                <em className="text-accent-ink italic">findable here</em>
              </h1>
              <p className="text-muted mt-6 text-lg leading-8">
                Couldn&apos;t find a supplier on Google, Maps, or IndiaMART?
                Post what you need. Champions who personally know hidden
                workshops will answer.
              </p>

              {/* CTAs */}
              <div className="mt-6 flex flex-row flex-wrap gap-3 sm:justify-center sm:gap-4 lg:justify-start">
                {session.verifiedAt ? (
                  <Link href="/requests/new" className="btn-primary">
                    Post a request
                  </Link>
                ) : (
                  <Link href="/login" className="btn-primary">
                    Post a request
                  </Link>
                )}
                <Link href="/suppliers" className="btn-outline">
                  Browse suppliers
                </Link>
              </div>

              {!session.userId && (
                <p className="text-muted mt-6 text-sm">
                  <Link
                    href="/signup"
                    className="text-accent-ink underline underline-offset-2"
                  >
                    Sign up
                  </Link>{" "}
                  to upload suppliers and unlock contacts.
                </p>
              )}
            </div>

            {/* Right column — 3D ajrak star sculpture (desktop only) */}
            <DesktopStage
              supplierCount={supplierCount ?? 0}
              championCount={championCount ?? 0}
              requestCount={requestCount ?? 0}
            />
          </div>
        </div>
      </section>

      {/* ===================== Category rail ===================== */}
      {categories.length > 0 && (
        <section className="reveal w-full py-10 lg:py-12">
          <div className="mx-auto max-w-3xl px-6 lg:max-w-6xl lg:px-8">
            <div className="mb-4 flex items-baseline justify-between">
              <p className="eyebrow" style={{ color: "var(--indigo-ink)" }}>
                Browse the network
              </p>
              <span className="text-muted font-mono text-xs tracking-wider">
                LIVE
              </span>
            </div>
            <CategoryRail categories={categories} />
          </div>
        </section>
      )}

      {/* ===================== Championed suppliers ===================== */}
      {topSuppliers.length > 0 && (
        <section className="reveal w-full py-10 lg:py-16">
          <div className="mx-auto max-w-3xl px-6 lg:max-w-6xl lg:px-8">
            <div className="mb-7 flex items-baseline justify-between">
              <p className="eyebrow">Championed suppliers</p>
              <Link
                href="/suppliers"
                className="text-accent-ink text-sm font-medium hover:underline"
              >
                View all →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 lg:gap-5">
              {topSuppliers.map((s) => (
                <SupplierCard
                  key={s.id}
                  id={s.id}
                  name={s.name}
                  area={s.area}
                  tier={s.tier}
                  categoryName={s.categoryName}
                  championName={s.championName}
                  className="card-3d"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===================== Hot requests (surface-2 band on desktop) ===================== */}
      {hotRequests.length > 0 && (
        <section className="reveal lg:bg-surface-2 w-full py-10 lg:py-16">
          <div className="mx-auto max-w-3xl px-6 lg:max-w-6xl lg:px-8">
            <div className="mb-7 flex items-baseline justify-between">
              <p className="eyebrow" style={{ color: "var(--indigo-ink)" }}>
                Hot requests
              </p>
              <Link
                href="/requests"
                className="text-accent-ink text-sm font-medium hover:underline"
              >
                View all →
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:gap-4">
              {hotRequests.map((r) => (
                <Link
                  key={r.id}
                  href={`/requests/${r.id}`}
                  className="card-link card-3d p-4 text-left"
                  style={{ background: "var(--surface)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-fg font-medium">{r.what}</p>
                    <span
                      className="rounded-pill border-border text-terra-ink flex flex-none items-center gap-1 border px-2.5 py-1 text-xs font-semibold"
                      style={{ background: "var(--surface-2)" }}
                    >
                      <svg
                        viewBox="0 0 12 12"
                        className="h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.4"
                      >
                        <path d="M6 2v7M3 6l3-4 3 4" />
                      </svg>
                      {r.upvotes}
                    </span>
                  </div>
                  <div className="text-muted mt-2 flex items-center gap-2 text-xs">
                    {r.stale && (
                      <span className="badge-status amber">3x bounty</span>
                    )}
                    <span>{r.categoryName ?? "Uncategorised"}</span>
                    <span>· {r.area}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===================== Top champions ===================== */}
      {topChampions.length > 0 && (
        <section className="reveal w-full py-10 lg:py-16">
          <div className="mx-auto max-w-3xl px-6 lg:max-w-6xl lg:px-8">
            <div className="mb-7 flex items-baseline justify-between">
              <p className="eyebrow">Top champions</p>
              <Link
                href="/champions"
                className="text-accent-ink text-sm font-medium hover:underline"
              >
                Leaderboard →
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:gap-4">
              {topChampions.map((c, i) => (
                <Link
                  key={c.user_id}
                  href={`/champions/${c.user_id}`}
                  className="card-link card-3d flex items-center gap-3 p-4 text-left"
                >
                  <span
                    className={`rank-badge ${i === 0 ? "r1" : i === 1 ? "r2" : i === 2 ? "r3" : ""}`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-fg truncate font-medium">
                      {c.users?.display_name ?? "Anonymous champion"}
                    </p>
                    <p className="text-muted text-xs">
                      {c.reputation_points} reputation
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===================== How trust grows ===================== */}
      <section className="reveal w-full py-10 lg:pb-16">
        <div className="mx-auto max-w-3xl px-6 lg:max-w-6xl lg:px-8">
          <div className="mb-7">
            <p className="eyebrow" style={{ color: "var(--indigo-ink)" }}>
              How trust grows
            </p>
          </div>
          <div className="card p-6 lg:p-9">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {TIERS.map((tier, i) => (
                <div key={tier} className="flex flex-1 flex-col gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="rounded-pill flex h-9 w-9 items-center justify-center font-mono text-sm font-bold text-white"
                      style={{
                        background:
                          tier === TrustTier.Tier4
                            ? "var(--gold)"
                            : tier === TrustTier.Tier3
                              ? "var(--terracotta)"
                              : tier === TrustTier.Tier2
                                ? "var(--indigo)"
                                : "var(--muted)",
                        color: tier === TrustTier.Tier4 ? "var(--fg)" : "#fff",
                      }}
                    >
                      {tier === TrustTier.Tier4 ? (
                        <svg
                          viewBox="0 0 24 24"
                          className="h-[18px] w-[18px]"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        >
                          <path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3L12 19.2 7.2 21.4l.9-5.3L4.3 12.4l5.3-.8L12 2z" />
                        </svg>
                      ) : (
                        tier
                      )}
                    </span>
                    <span className="text-fg font-semibold">
                      {trustTierPolicy.badgeForTier(tier)}
                    </span>
                  </div>
                  <p className="text-muted text-xs leading-relaxed">
                    {tier === TrustTier.Tier1 &&
                      "Just added by a champion — awaiting corroboration."}
                    {tier === TrustTier.Tier2 &&
                      "A second champion vouches for this supplier."}
                    {tier === TrustTier.Tier3 &&
                      "The supplier claimed the listing via OTP."}
                    {tier === TrustTier.Tier4 &&
                      "Verified in person — the highest trust level."}
                  </p>
                  {i < TIERS.length - 1 && (
                    <span
                      className="text-terra-ink hidden self-center sm:block"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===================== Footer ===================== */}
      <footer className="reveal w-full">
        <div className="ajrak-band w-full" aria-hidden="true" />
        <div className="bg-surface border-border border-t">
          <div className="mx-auto max-w-3xl px-6 py-10 lg:max-w-6xl lg:px-8 lg:py-12">
            <div className="flex flex-wrap items-start justify-between gap-10">
              <div>
                <Link
                  href="/"
                  className="display text-fg flex items-center gap-2.5 text-base font-semibold"
                >
                  <span
                    className="rounded-pill flex h-7 w-7 items-center justify-center font-mono text-xs font-bold text-white"
                    style={{ background: "var(--indigo)" }}
                    aria-hidden="true"
                  >
                    HC
                  </span>
                  Hidden Champions
                </Link>
                <p className="text-muted mt-3 max-w-[38ch] text-sm">
                  Lahore&apos;s hidden garment workshops — findable through the
                  people who know them.
                </p>
              </div>
              <div className="flex gap-12">
                <div>
                  <p
                    className="mb-3.5 text-xs tracking-wider uppercase"
                    style={{
                      color: "var(--terra-ink)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    Network
                  </p>
                  <div className="flex flex-col gap-2.5">
                    <Link
                      href="/suppliers"
                      className="text-muted hover:text-fg text-sm transition-colors"
                    >
                      Suppliers
                    </Link>
                    <Link
                      href="/requests"
                      className="text-muted hover:text-fg text-sm transition-colors"
                    >
                      Requests
                    </Link>
                    <Link
                      href="/champions"
                      className="text-muted hover:text-fg text-sm transition-colors"
                    >
                      Champions
                    </Link>
                  </div>
                </div>
                <div>
                  <p
                    className="mb-3.5 text-xs tracking-wider uppercase"
                    style={{
                      color: "var(--terra-ink)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    Account
                  </p>
                  <div className="flex flex-col gap-2.5">
                    {session.userId ? (
                      <Link
                        href="/profile"
                        className="text-muted hover:text-fg text-sm transition-colors"
                      >
                        Profile
                      </Link>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          className="text-muted hover:text-fg text-sm transition-colors"
                        >
                          Log in
                        </Link>
                        <Link
                          href="/signup"
                          className="text-muted hover:text-fg text-sm transition-colors"
                        >
                          Sign up
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="truck-dots mt-8 mb-4" aria-hidden="true" />
            <p className="text-muted text-xs">
              Built in Lahore · Open source · For the people who keep the trade
              running.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
