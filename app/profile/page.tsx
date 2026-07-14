import { redirect } from "next/navigation";
import { supabaseAuthAdapter } from "@/infrastructure/supabaseAuthAdapter";
import { createServiceRoleClient } from "@/infrastructure/supabase/serviceRole";
import { signOut } from "@/features/auth/actions";
import { DisplayNameForm } from "@/components/DisplayNameForm";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default async function ProfilePage() {
  const session = await supabaseAuthAdapter.getSession();

  if (!session.userId) {
    redirect("/login");
  }

  const service = createServiceRoleClient();

  const { data: user } = await service
    .from("users")
    .select("*")
    .eq("id", session.userId)
    .single();

  const { data: reputation } = await service
    .from("champion_reputation")
    .select("*, categories(name)")
    .eq("user_id", session.userId)
    .order("reputation_points", { ascending: false });

  const { data: ledger } = await service
    .from("finder_fee_ledger")
    .select("*, suppliers(name)")
    .eq("champion_user_id", session.userId)
    .order("triggered_at", { ascending: false });

  const verified = !!user?.verified_at;
  const totalRep = (reputation ?? []).reduce(
    (sum, r) => sum + (r.reputation_points as number),
    0
  );

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-6">
      {/* ===================== Profile header ===================== */}
      <div className="card overflow-hidden">
        <div className="ajrak-thin" aria-hidden="true" />
        <div className="p-5 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="display text-2xl text-fg">
                {user?.display_name ?? "Champion"}
              </h1>
              <p className="mt-1 font-mono text-sm text-muted">
                {user?.phone}
              </p>
            </div>
            <StatusBadge variant={verified ? "accent" : "amber"}>
              {verified ? "Verified" : "Pending verification"}
            </StatusBadge>
          </div>

          {/* Verification banner */}
          {!verified && (
            <div
              className="mt-4 flex items-start gap-3 rounded-input p-3"
              style={{ background: "var(--amber-bg)" }}
            >
              <svg
                viewBox="0 0 24 24"
                className="mt-0.5 h-5 w-5 flex-none"
                fill="none"
                stroke="var(--amber-fg)"
                strokeWidth="1.6"
              >
                <path d="M12 9v4M12 17h.01" />
                <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
              </svg>
              <p className="text-sm" style={{ color: "var(--amber-fg)" }}>
                Your account is pending founder verification. You can browse and
                upvote, but uploading suppliers, unlocking contacts, and
                answering requests require verification.
              </p>
            </div>
          )}

          <DisplayNameForm defaultValue={user?.display_name ?? ""} />
        </div>
      </div>

      {/* ===================== Reputation summary ===================== */}
      <section className="mt-6">
        <div className="flex items-baseline justify-between">
          <p className="eyebrow">Reputation by category</p>
          <span className="text-sm font-semibold text-fg">
            {totalRep} pts total
          </span>
        </div>
        {reputation && reputation.length > 0 ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {reputation.map((row) => (
              <div
                key={`${row.user_id}-${row.category_id}`}
                className="card flex items-center justify-between p-3"
              >
                <span className="text-sm font-medium text-fg">
                  {(row.categories as { name: string })?.name ?? "Unknown"}
                </span>
                <span className="tier-badge">{row.reputation_points} pts</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="card mt-3 p-6 text-center">
            <p className="text-sm text-muted">
              No reputation yet. Answer requests to earn points.
            </p>
          </div>
        )}
      </section>

      {/* ===================== Finder's fees ===================== */}
      <section className="mt-6">
        <p className="eyebrow mb-3">Pending finder&apos;s fees</p>
        {ledger && ledger.length > 0 ? (
          <div className="space-y-2">
            {ledger.map((row) => (
              <div key={row.id} className="card flex items-center justify-between p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-fg">
                    {(row.suppliers as { name: string })?.name ?? "Unknown"}
                  </p>
                  <p className="text-xs text-muted">
                    Payouts begin when paid tiers launch.
                  </p>
                </div>
                <span className="tier-badge flex-none">
                  {row.fee_percent}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-6 text-center">
            <p className="text-sm text-muted">
              No pending finder&apos;s fees yet.
            </p>
          </div>
        )}
      </section>

      {/* ===================== Sign out ===================== */}
      <form action={signOut} className="mt-6">
        <button type="submit" className="btn-outline">
          Sign out
        </button>
      </form>
    </main>
  );
}
