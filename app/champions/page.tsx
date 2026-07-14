import Link from "next/link";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { supabaseAuthAdapter } from "@/infrastructure/supabaseAuthAdapter";
import { createServiceRoleClient } from "@/infrastructure/supabase/serviceRole";
import { getGlobalLeaderboard } from "@/features/champions/actions";

export const metadata: Metadata = {
  title: "Champion leaderboard — Hidden Champions",
};

export default async function ChampionsPage() {
  const session = await supabaseAuthAdapter.getSession();
  if (!session.userId) redirect("/login");

  const leaderboard = await getGlobalLeaderboard(10);
  const service = createServiceRoleClient();

  const { data: categories } = await service
    .from("categories")
    .select("id, slug, name")
    .eq("status", "approved")
    .order("name");

  const top3 = leaderboard.slice(0, 3);
  const seen = new Set(top3.map((e) => e.user_id));
  const rest = leaderboard.slice(3).filter((e) => {
    if (seen.has(e.user_id)) return false;
    seen.add(e.user_id);
    return true;
  });

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 p-6">
      <div className="mb-6">
        <h1 className="display text-fg text-2xl">Champion leaderboard</h1>
        <p className="text-muted mt-1 text-sm">
          Top champions by total reputation across all categories
        </p>
      </div>

      {/* ===================== Top-3 podium ===================== */}
      {top3.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {top3.map((entry, i) => (
            <Link
              key={entry.user_id}
              href={`/champions/${entry.user_id}`}
              className={`card-link p-5 text-center ${
                i === 0 ? "sm:-mt-2 sm:pb-6" : ""
              }`}
              style={
                i === 0
                  ? { borderColor: "var(--gold)" }
                  : i === 1
                    ? { borderColor: "var(--indigo)" }
                    : i === 2
                      ? { borderColor: "var(--terracotta)" }
                      : undefined
              }
            >
              <span
                className={`rank-badge mx-auto mb-3 ${i === 0 ? "r1" : i === 1 ? "r2" : "r3"}`}
                style={{ width: 44, height: 44, fontSize: 18 }}
              >
                {i + 1}
              </span>
              <p className="text-fg font-semibold">
                {entry.users?.display_name ?? "Anonymous champion"}
              </p>
              <p className="text-muted mt-1 text-sm">
                {entry.reputation_points} reputation
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* ===================== Remainder ranked list ===================== */}
      {rest.length > 0 && (
        <div className="mt-4 space-y-2">
          {rest.map((entry, i) => (
            <Link
              key={entry.user_id}
              href={`/champions/${entry.user_id}`}
              className="card-link flex items-center gap-4 p-4"
            >
              <span className="rank-badge">{i + 4}</span>
              <span className="text-fg flex-1 font-medium">
                {entry.users?.display_name ?? "Anonymous champion"}
              </span>
              <span className="tier-badge">{entry.reputation_points} rep</span>
            </Link>
          ))}
        </div>
      )}

      {leaderboard.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-muted">
            No champions yet. Be the first to upload a supplier or answer a
            request.
          </p>
        </div>
      )}

      {/* ===================== Category browse grid ===================== */}
      {categories && categories.length > 0 && (
        <section className="mt-10">
          <p className="eyebrow mb-3">Browse by category</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {(categories as { id: string; slug: string; name: string }[]).map(
              (cat) => (
                <Link
                  key={cat.id}
                  href={`/champions/category/${cat.slug}`}
                  className="card-link group flex items-center gap-2 p-3"
                >
                  <span
                    className="rounded-input flex h-8 w-8 flex-none items-center justify-center"
                    style={{ background: "var(--surface-2)" }}
                    aria-hidden="true"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      className="text-muted h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M3 6l7-3 7 3v8l-7 3-7-3V6z" />
                      <path d="M3 6l7 3 7-3M10 9v8" />
                    </svg>
                  </span>
                  <span className="text-fg group-hover:text-indigo-ink text-sm font-medium">
                    {cat.name}
                  </span>
                </Link>
              )
            )}
          </div>
        </section>
      )}
    </main>
  );
}
