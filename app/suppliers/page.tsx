import Link from "next/link";
import { Metadata } from "next";
import { supabaseAuthAdapter } from "@/infrastructure/supabaseAuthAdapter";
import { createServiceRoleClient } from "@/infrastructure/supabase/serviceRole";
import { getApprovedCategories } from "@/features/suppliers/actions";
import { SupplierCard } from "@/components/SupplierCard";

export const metadata: Metadata = {
  title: "Supplier directory — Hidden Champions",
};

interface Props {
  searchParams: Promise<{
    q?: string;
    category?: string;
    area?: string;
  }>;
}

export default async function SuppliersPage({ searchParams }: Props) {
  const session = await supabaseAuthAdapter.getSession();
  const service = createServiceRoleClient();

  const { q, category, area } = await searchParams;
  const categories = await getApprovedCategories();

  let builder = service
    .from("suppliers")
    .select(
      "id, name, area, tier, category_id, categories(name), listings(champion_user_id, users(display_name))"
    )
    .gt("tier", 1)
    .is("deleted_at", null)
    .order("tier", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  if (q) {
    builder = builder.or(`name.ilike.%${q}%,area.ilike.%${q}%`);
  }
  if (category) {
    builder = builder.eq("category_id", category);
  }
  if (area) {
    builder = builder.ilike("area", `%${area}%`);
  }

  const { data: suppliers } = await builder;

  const suppliersWithChampion = (suppliers ?? []).map((s) => {
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

  const hasFilters = !!(q || category || area);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="display text-2xl text-fg">Supplier directory</h1>
          <p className="mt-1 text-sm text-muted">
            {suppliersWithChampion.length} hidden suppliers in Lahore
          </p>
        </div>
        {session.verifiedAt && (
          <Link href="/suppliers/upload" className="btn-primary w-full sm:w-auto">
            Upload supplier
          </Link>
        )}
      </div>

      {/* Search & filters */}
      <div className="mb-5 space-y-3">
        <form className="flex flex-col gap-3 sm:flex-row">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search by name or area..."
            aria-label="Search suppliers by name or area"
            className="input flex-1"
          />
          <input
            name="area"
            defaultValue={area ?? ""}
            placeholder="Area filter..."
            aria-label="Filter by area"
            className="input sm:max-w-[200px]"
          />
          <button type="submit" className="btn-primary w-full sm:w-auto">
            Search
          </button>
          {hasFilters && (
            <Link href="/suppliers" className="btn-outline text-muted">
              Clear
            </Link>
          )}
        </form>

        {/* Category rail */}
        <div className="filter-rail">
          <Link
            href={area ? `/suppliers?area=${encodeURIComponent(area)}` : "/suppliers"}
            className={`cat-pill${!category ? " active" : ""}`}
          >
            All
          </Link>
          {(categories as { id: string; slug: string; name: string }[]).map(
            (cat) => (
              <Link
                key={cat.id}
                href={`/suppliers?category=${cat.id}${area ? `&area=${encodeURIComponent(area)}` : ""}`}
                className={`cat-pill${category === cat.id ? " active" : ""}`}
              >
                {cat.name}
              </Link>
            )
          )}
        </div>
      </div>

      {/* Supplier grid */}
      {suppliersWithChampion.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {suppliersWithChampion.map((s) => (
            <SupplierCard
              key={s.id}
              id={s.id}
              name={s.name}
              area={s.area}
              tier={s.tier}
              categoryName={s.categoryName}
              championName={s.championName}
            />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <p className="text-muted">
            {hasFilters
              ? "No suppliers match your filters."
              : "No public suppliers yet. Verified champions can upload the first one."}
          </p>
          {!hasFilters && session.verifiedAt && (
            <Link
              href="/suppliers/upload"
              className="btn-primary mt-4 inline-flex"
            >
              Upload the first supplier
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
