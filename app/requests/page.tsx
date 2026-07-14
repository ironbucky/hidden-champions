import Link from "next/link";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { supabaseAuthAdapter } from "@/infrastructure/supabaseAuthAdapter";
import { createServiceRoleClient } from "@/infrastructure/supabase/serviceRole";
import { getApprovedCategories } from "@/features/requests/actions";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const metadata: Metadata = {
  title: "Request board — Hidden Champions",
  robots: "noindex",
};

interface Props {
  searchParams: Promise<{ q?: string; category?: string; area?: string }>;
}

function timeAgo(dateStr: string): string {
  const days = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 86400000
  );
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

export default async function RequestsPage({ searchParams }: Props) {
  const session = await supabaseAuthAdapter.getSession();
  if (!session.userId) redirect("/login");

  const service = createServiceRoleClient();
  const categories = await getApprovedCategories();
  const { q, category, area } = await searchParams;

  await service
    .from("requests")
    .update({ state: "expired" })
    .eq("state", "open")
    .lt("expires_at", new Date().toISOString());

  let builder = service
    .from("requests")
    .select(
      "id, what, category_id, area, upvotes, state, stale_bounty_at, created_at, categories(name)"
    )
    .eq("state", "open")
    .order("upvotes", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  if (q) builder = builder.ilike("what", `%${q}%`);
  if (category) builder = builder.eq("category_id", category);
  if (area) builder = builder.ilike("area", `%${area}%`);

  const { data: requests } = await builder;

  const isStale = (s: string | null) =>
    s ? new Date().getTime() >= new Date(s).getTime() : false;

  const hasFilters = !!(q || category || area);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="display text-2xl text-fg">Request board</h1>
          <p className="mt-1 text-sm text-muted">
            {requests?.length ?? 0} open requests
          </p>
        </div>
        {session.verifiedAt && (
          <Link href="/requests/new" className="btn-primary">
            Post a request
          </Link>
        )}
      </div>

      {/* Search + area filter */}
      <form className="mb-3 flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search requests..."
          aria-label="Search requests by description"
          className="input min-w-[180px] flex-1"
        />
        <input
          name="area"
          defaultValue={area ?? ""}
          placeholder="Area..."
          aria-label="Filter by area"
          className="input max-w-[180px]"
        />
        <button type="submit" className="btn-primary text-sm py-2">
          Filter
        </button>
        {hasFilters && (
          <Link href="/requests" className="btn-outline text-sm py-2">
            Clear
          </Link>
        )}
      </form>

      {/* Category pill rail */}
      <div className="filter-rail mb-6">
        <Link
          href={area ? `/requests?area=${encodeURIComponent(area)}` : "/requests"}
          className={`cat-pill${!category ? " active" : ""}`}
        >
          All
        </Link>
        {(categories as { id: string; name: string }[]).map((c) => (
          <Link
            key={c.id}
            href={`/requests?category=${c.id}${area ? `&area=${encodeURIComponent(area)}` : ""}`}
            className={`cat-pill${category === c.id ? " active" : ""}`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {/* Request list */}
      {requests?.length ? (
        <div className="space-y-3">
          {requests.map((req) => {
            const stale = isStale(req.stale_bounty_at as string | null);
            const upvotes = req.upvotes as number;
            return (
              <Link
                key={req.id}
                href={`/requests/${req.id}`}
                className="card-link block p-5"
              >
                <div className="flex items-center gap-2 text-xs text-muted">
                  <StatusBadge variant={stale ? "amber" : "accent"}>
                    {stale ? "Stale bounty" : "Open"}
                  </StatusBadge>
                  <span>
                    {(req.categories as unknown as { name: string } | null)
                      ?.name ?? "Unknown"}
                  </span>
                  <span>· {timeAgo(req.created_at as string)}</span>
                </div>

                <p className="mt-2 font-semibold text-fg">{req.what}</p>

                <div className="mt-3 flex items-center gap-3 text-sm text-muted">
                  <span className="flex items-center gap-1">
                    <svg
                      viewBox="0 0 12 12"
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    >
                      <path d="M6 1C4.3 1 3 2.3 3 4c0 2.5 3 6 3 6s3-3.5 3-6c0-1.7-1.3-3-3-3z" />
                      <circle cx="6" cy="4" r="1.2" />
                    </svg>
                    {req.area}
                  </span>

                  <span className="ml-auto flex items-center gap-1.5">
                    <svg
                      viewBox="0 0 12 12"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    >
                      <path d="M6 2v7M3 6l3-4 3 4" />
                    </svg>
                    <span className="font-semibold text-terra-ink">
                      {upvotes}
                    </span>
                    <span>
                      {upvotes === 1 ? "person needs" : "people need"} this
                    </span>
                  </span>

                  {stale && (
                    <span className="badge-status amber">3x bounty</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <p className="text-muted">
            {hasFilters
              ? "No open requests match your filters."
              : "No open requests right now."}
          </p>
          {session.verifiedAt && !hasFilters && (
            <Link
              href="/requests/new"
              className="btn-primary mt-4 inline-flex"
            >
              Post the first request
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
