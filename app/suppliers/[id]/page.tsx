import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { supabaseAuthAdapter } from "@/infrastructure/supabaseAuthAdapter";
import { createServiceRoleClient } from "@/infrastructure/supabase/serviceRole";
import { TrustTier, trustTierPolicy } from "@/domain/trustTier";
import { ContactUnlockButton } from "@/components/ContactUnlockButton";
import { SupplierActions } from "@/components/SupplierActions";
import { SupplierCard } from "@/components/SupplierCard";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const service = createServiceRoleClient();
  const { data: supplier } = await service
    .from("suppliers")
    .select("name, tier")
    .eq("id", id)
    .single();

  return {
    title: supplier
      ? `${supplier.name} — Hidden Champions`
      : "Supplier — Hidden Champions",
    robots: supplier && supplier.tier >= 2 ? "index, follow" : "noindex",
  };
}

export default async function SupplierPage({ params }: Props) {
  const { id } = await params;
  const session = await supabaseAuthAdapter.getSession();
  const service = createServiceRoleClient();

  const { data: supplier } = await service
    .from("suppliers")
    .select(
      "*, categories(name), listings(*, users(display_name)), supplier_photos(*)"
    )
    .eq("id", id)
    .single();

  if (!supplier || supplier.deleted_at) {
    notFound();
  }

  const isPublic = supplier.tier >= TrustTier.Tier2;

  if (!isPublic && !session.userId) {
    redirect("/login");
  }

  const championListing = (supplier.listings as unknown[] | null)?.[0] as
    | { champion_user_id: string; users: { display_name: string | null } }
    | undefined;
  const championName =
    championListing?.users?.display_name ?? "Anonymous champion";
  const championId = championListing?.champion_user_id ?? "";
  const categoryName =
    (supplier as unknown as { categories: { name: string } | null }).categories
      ?.name ?? "Uncategorised";

  const publicPhotos =
    (supplier.supplier_photos as unknown[] | null)?.filter(
      (photo) =>
        (photo as { ocr_status: string; published_at: string | null })
          .ocr_status === "clean" &&
        (photo as { ocr_status: string; published_at: string | null })
          .published_at !== null
    ) ?? [];

  const tier = supplier.tier as TrustTier;
  const isVerified = tier === TrustTier.Tier4;

  /* ---------- Related suppliers (same category, excluding this one) ---------- */
  const { data: relatedRaw } = await service
    .from("suppliers")
    .select(
      "id, name, area, tier, categories(name), listings(champion_user_id, users(display_name))"
    )
    .eq("category_id", supplier.category_id as string)
    .neq("id", id)
    .gte("tier", TrustTier.Tier2)
    .is("deleted_at", null)
    .order("tier", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(3);

  const related = (relatedRaw ?? []).map((s) => {
    const listings = (s as { listings?: unknown[] }).listings ?? [];
    const championListingRel = listings[0] as
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
      championName: championListingRel?.users?.display_name ?? null,
    };
  });

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-6">
      {/* Back link */}
      <Link
        href="/suppliers"
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
        Suppliers
      </Link>

      {/* ===================== Header band ===================== */}
      <div className="card overflow-hidden">
        {/* Ajrak hero strip */}
        <div className="ajrak-thin" aria-hidden="true" />

        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="display text-2xl text-fg sm:text-3xl">
                {supplier.name}
              </h1>
              <p className="mt-1 text-muted">
                {categoryName} · {supplier.area}
              </p>
            </div>
            <span
              className="tier-badge flex-none text-base"
              style={{
                background:
                  tier === TrustTier.Tier4
                    ? "oklch(94% 0.08 85)"
                    : tier === TrustTier.Tier3
                      ? "oklch(94% 0.06 38)"
                      : tier === TrustTier.Tier2
                        ? "oklch(94% 0.05 265)"
                        : undefined,
              }}
            >
              {isVerified && (
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3L12 19.2 7.2 21.4l.9-5.3L4.3 12.4l5.3-.8L12 2z" />
                </svg>
              )}
              {trustTierPolicy.badgeForTier(tier)}
              <span className="font-mono text-xs opacity-70">Tier {tier}</span>
            </span>
          </div>

          <p className="mt-4 text-sm text-muted">
            Championed by{" "}
            <Link
              href={`/champions/${championId}`}
              className="font-medium text-accent-ink underline underline-offset-2"
            >
              {championName}
            </Link>
          </p>
        </div>
      </div>

      {/* ===================== Photo grid ===================== */}
      <section className="mt-6">
        <p className="eyebrow mb-3">Workshop photos</p>
        {publicPhotos.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {publicPhotos.map((photo) => {
              const p = photo as { id: string; storage_path: string };
              return (
                <div
                  key={p.id}
                  className="photo-placeholder aspect-square rounded-input"
                  aria-hidden="true"
                >
                  <span className="rounded bg-surface/80 px-2 py-1 font-mono text-[11px] text-muted backdrop-blur-sm">
                    Photo — coming soon
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="photo-placeholder flex h-32 items-center justify-center rounded-input">
            <span className="rounded bg-surface/80 px-3 py-1.5 font-mono text-xs text-muted backdrop-blur-sm">
              No photos yet
            </span>
          </div>
        )}
      </section>

      {/* ===================== Contact unlock ===================== */}
      {session.verifiedAt && (
        <section className="mt-6">
          <ContactUnlockButton supplierId={supplier.id as string} />
        </section>
      )}

      {!session.verifiedAt && session.userId && (
        <section className="mt-6">
          <div className="card flex items-center gap-3 p-4">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 flex-none text-muted"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
            <p className="text-sm text-muted">
              Verified account required to unlock contact details.
            </p>
          </div>
        </section>
      )}

      {/* ===================== Actions (claim / edit / delist) ===================== */}
      {session.userId && (
        <section className="mt-6">
          <SupplierActions
            supplierId={supplier.id as string}
            isClaimed={!!supplier.claimed_by_user_id}
            claimedByUserId={supplier.claimed_by_user_id as string | null}
            currentUserId={session.userId}
            isVerified={!!session.verifiedAt}
          />
        </section>
      )}

      {/* ===================== Related suppliers ===================== */}
      {related.length > 0 && (
        <section className="mt-10">
          <p className="eyebrow mb-3">More in {categoryName}</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {related.map((s) => (
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
        </section>
      )}

      {!isPublic && <meta name="robots" content="noindex" />}

      {isPublic && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: supplier.name,
              description: `${supplier.name} — a hidden supplier in ${supplier.area}, Lahore`,
              address: {
                "@type": "PostalAddress",
                addressLocality: supplier.area,
                addressRegion: "Lahore",
                addressCountry: "PK",
              },
              ...(supplier.category_id
                ? {
                    category: (
                      supplier as unknown as {
                        categories: { name: string } | null;
                      }
                    ).categories?.name,
                  }
                : {}),
            }),
          }}
        />
      )}
    </main>
  );
}
