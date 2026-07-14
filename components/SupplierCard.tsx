import Link from "next/link";
import { TrustTier, trustTierPolicy } from "@/domain/trustTier";

interface SupplierCardProps {
  id: string;
  name: string;
  area: string;
  tier: number;
  categoryName: string | null;
  championName?: string | null;
  variant?: "grid" | "list";
  className?: string;
}

export function SupplierCard({
  id,
  name,
  area,
  tier,
  categoryName,
  championName,
  variant = "grid",
  className,
}: SupplierCardProps) {
  const badge = trustTierPolicy.badgeForTier(tier as TrustTier);
  const isVerified = tier === TrustTier.Tier4;

  if (variant === "list") {
    return (
      <Link
        href={`/suppliers/${id}`}
        className={`card-link flex items-start justify-between gap-4 p-4${className ? ` ${className}` : ""}`}
      >
        <div className="min-w-0">
          <h2 className="text-fg font-semibold">{name}</h2>
          <p className="text-muted truncate text-sm">
            {categoryName ?? "Uncategorised"} · {area}
          </p>
          {championName && (
            <p className="text-muted mt-1 text-xs">
              Championed by{" "}
              <span className="text-fg font-medium">{championName}</span>
            </p>
          )}
        </div>
        <span className="tier-badge flex-none">
          {isVerified && <Rosette />}
          {badge}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={`/suppliers/${id}`}
      className={`card-link group overflow-hidden${className ? ` ${className}` : ""}`}
    >
      <div
        className="photo-placeholder relative flex min-h-[140px] items-end p-3"
        aria-hidden="true"
      >
        <span className="bg-surface/80 text-muted rounded px-2 py-1 font-mono text-[11px] backdrop-blur-sm">
          Workshop photo — coming soon
        </span>
        <span
          className="tier-badge absolute top-3 right-3"
          style={{ background: "oklch(99% 0.005 82 / 0.92)" }}
        >
          {isVerified && <Rosette />}
          {badge}
        </span>
      </div>
      <div className="p-4">
        <h2 className="text-fg group-hover:text-indigo-ink font-semibold">
          {name}
        </h2>
        <p className="text-muted mt-0.5 text-sm">
          {categoryName ?? "Uncategorised"} · {area}
        </p>
        {championName && (
          <p className="text-muted mt-2 text-xs">
            Championed by{" "}
            <span className="text-fg font-medium">{championName}</span>
          </p>
        )}
      </div>
    </Link>
  );
}

function Rosette() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3L12 19.2 7.2 21.4l.9-5.3L4.3 12.4l5.3-.8L12 2z" />
    </svg>
  );
}
