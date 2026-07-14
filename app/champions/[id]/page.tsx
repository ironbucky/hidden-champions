import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { getChampionProfile } from "@/features/champions/actions";

export const metadata: Metadata = {
  title: "Champion profile — Hidden Champions",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChampionProfilePage({ params }: Props) {
  const { id } = await params;
  const profile = await getChampionProfile(id);

  if (!profile.user) notFound();

  const { user, reputation, listings, finderFees } = profile;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-6">
      <Link
        href="/champions"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
      >
        <svg
          viewBox="0 0 18 18"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M11 4l-5 5 5 5" />
        </svg>
        Leaderboard
      </Link>

      {/* ===================== Header ===================== */}
      <div className="card overflow-hidden">
        <div className="ajrak-thin" aria-hidden="true" />
        <div className="p-5 sm:p-8">
          <h1 className="display text-2xl text-fg">
            {(user as { display_name: string | null }).display_name ??
              "Anonymous champion"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Champion since{" "}
            {new Date(
              (user as { created_at: string }).created_at
            ).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* ===================== Specialist reputation ===================== */}
      {reputation.length > 0 && (
        <section className="mt-6">
          <p className="eyebrow mb-3">Specialist reputation</p>
          <div className="space-y-2">
            {(reputation as unknown[]).map((rep) => {
              const r = rep as {
                category_id: string;
                reputation_points: number;
                answered_count: number;
                confirmed_count: number;
                rejected_count: number;
                categories: { name: string; slug: string } | null;
              };
              return (
                <div
                  key={r.category_id}
                  className="card flex items-center justify-between p-4"
                >
                  <div>
                    <span className="font-medium text-fg">
                      {r.categories?.name ?? "Unknown"}
                    </span>
                    <p className="mt-0.5 text-xs text-muted">
                      {r.answered_count} answered · {r.confirmed_count}{" "}
                      confirmed · {r.rejected_count} rejected
                    </p>
                  </div>
                  <span className="tier-badge">{r.reputation_points} pts</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ===================== Championed suppliers ===================== */}
      {listings.length > 0 && (
        <section className="mt-6">
          <p className="eyebrow mb-3">Championed suppliers</p>
          <div className="space-y-2">
            {(listings as unknown[]).map((listing) => {
              const l = listing as {
                supplier_id: string;
                suppliers: {
                  name: string;
                  tier: number;
                  area: string;
                } | null;
              };
              if (!l.suppliers) return null;
              return (
                <Link
                  key={l.supplier_id}
                  href={`/suppliers/${l.supplier_id}`}
                  className="card-link flex items-center justify-between p-4"
                >
                  <div>
                    <span className="font-medium text-fg">
                      {l.suppliers.name}
                    </span>
                    <p className="text-xs text-muted">{l.suppliers.area}</p>
                  </div>
                  <span className="tier-badge">Tier {l.suppliers.tier}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ===================== Finder's fees ===================== */}
      {finderFees.length > 0 && (
        <section className="mt-6">
          <p className="eyebrow mb-1">Pending finder&apos;s fees</p>
          <p className="mb-3 text-xs text-muted">
            Payouts begin when suppliers upgrade to paid tiers.
          </p>
          <div className="space-y-2">
            {(finderFees as unknown[]).map((fee) => {
              const f = fee as {
                id: string;
                supplier_id: string;
                fee_percent: number;
                triggered_at: string;
                suppliers: { name: string } | null;
              };
              return (
                <div
                  key={f.id}
                  className="card flex items-center justify-between p-4"
                >
                  <div>
                    <Link
                      href={`/suppliers/${f.supplier_id}`}
                      className="font-medium text-fg hover:underline"
                    >
                      {f.suppliers?.name ?? "Unknown supplier"}
                    </Link>
                    <p className="text-xs text-muted">
                      {new Date(f.triggered_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-muted">
                    {f.fee_percent}%
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
