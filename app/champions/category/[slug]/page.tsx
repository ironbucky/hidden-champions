import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { createServiceRoleClient } from "@/infrastructure/supabase/serviceRole";
import { getCategoryLeaderboard } from "@/features/champions/actions";

export const metadata: Metadata = {
  title: "Category leaderboard — Hidden Champions",
};

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CategoryLeaderboardPage({ params }: Props) {
  const { slug } = await params;
  const service = createServiceRoleClient();

  const { data: category } = await service
    .from("categories")
    .select("id, name")
    .eq("slug", slug)
    .eq("status", "approved")
    .single();

  if (!category) notFound();

  const leaderboard = await getCategoryLeaderboard(category.id, 10);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 p-6">
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

      <div className="mb-6">
        <p className="eyebrow mb-1">Category</p>
        <h1 className="display text-2xl text-fg">
          Top {category.name} champions
        </h1>
        <p className="mt-1 text-sm text-muted">
          Ranked by reputation in this category
        </p>
      </div>

      {/* ===================== Top-3 podium ===================== */}
      {top3.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {top3.map((entry, i) => {
            const e = entry as unknown as {
              user_id: string;
              reputation_points: number;
              answered_count: number;
              confirmed_count: number;
              users: { display_name: string | null } | null;
            };
            return (
              <Link
                key={e.user_id}
                href={`/champions/${e.user_id}`}
                className="card-link p-5 text-center"
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
                <p className="font-semibold text-fg">
                  {e.users?.display_name ?? "Anonymous champion"}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {e.reputation_points} reputation
                </p>
                <p className="mt-1 text-xs text-muted">
                  {e.answered_count} answered · {e.confirmed_count} confirmed
                </p>
              </Link>
            );
          })}
        </div>
      )}

      {/* ===================== Remainder ranked list ===================== */}
      {rest.length > 0 && (
        <div className="mt-4 space-y-2">
          {rest.map((entry, i) => {
            const e = entry as unknown as {
              user_id: string;
              reputation_points: number;
              answered_count: number;
              confirmed_count: number;
              rejected_count: number;
              users: { display_name: string | null } | null;
            };
            return (
              <Link
                key={e.user_id}
                href={`/champions/${e.user_id}`}
                className="card-link flex items-center gap-4 p-4"
              >
                <span className="rank-badge">{i + 4}</span>
                <div className="flex-1">
                  <p className="font-medium text-fg">
                    {e.users?.display_name ?? "Anonymous champion"}
                  </p>
                  <p className="text-xs text-muted">
                    {e.answered_count} answered · {e.confirmed_count} confirmed
                  </p>
                </div>
                <span className="tier-badge">{e.reputation_points} pts</span>
              </Link>
            );
          })}
        </div>
      )}

      {leaderboard.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-muted">No champions in this category yet.</p>
          <Link
            href="/suppliers/upload"
            className="btn-primary mt-4 inline-flex"
          >
            Upload the first supplier
          </Link>
        </div>
      )}
    </main>
  );
}
