import Link from "next/link";
import { Metadata } from "next";
import { getAdminQueueCounts } from "@/features/admin/actions";

export const metadata: Metadata = {
  title: "Admin — Hidden Champions",
  robots: "noindex",
};

const QUEUES: {
  type: string;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    type: "user_verify",
    label: "User verification",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 11l-3 3-2-2" />
      </svg>
    ),
  },
  {
    type: "photo",
    label: "Photo review",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    ),
  },
  {
    type: "listing_moderation",
    label: "Listing moderation",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M9 13l2 2 4-4" />
      </svg>
    ),
  },
  {
    type: "fuzzy_match",
    label: "Fuzzy match review",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 2v20M2 12h20" />
        <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
      </svg>
    ),
  },
  {
    type: "flag_findable",
    label: "Flag-as-findable review",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 22V4M4 4l13 2-3 4 3 4-13-2" />
      </svg>
    ),
  },
  {
    type: "category_suggest",
    label: "Category suggestions",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 7l9-4 9 4v10l-9 4-9-4V7z" />
        <path d="M3 7l9 4 9-4M12 11v10" />
      </svg>
    ),
  },
];

export default async function AdminPage() {
  const counts = await getAdminQueueCounts();
  const totalPending = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 p-6">
      <Link
        href="/"
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
        Home
      </Link>

      <div className="mb-6">
        <h1 className="display text-2xl text-fg">Admin dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          {totalPending > 0 ? (
            <>
              <span className="font-semibold text-terra-ink">{totalPending}</span>{" "}
              pending items across all queues
            </>
          ) : (
            "All queues clear"
          )}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {QUEUES.map(({ type, label, icon }) => {
          const count = counts[type] ?? 0;
          return (
            <Link
              key={type}
              href={`/admin/${type}`}
              className="card-link flex items-center gap-4 p-5"
            >
              <span
                className="flex h-11 w-11 flex-none items-center justify-center rounded-input"
                style={{
                  background: count > 0 ? "var(--amber-bg)" : "var(--surface-2)",
                  color: count > 0 ? "var(--amber-fg)" : "var(--muted)",
                }}
              >
                <span className="block h-5 w-5">{icon}</span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-fg">{label}</p>
                <p
                  className={`mt-0.5 text-2xl font-semibold ${
                    count > 0 ? "text-fg" : "text-muted"
                  }`}
                >
                  {count}
                </p>
              </div>
              {count > 0 && (
                <span
                  className="rounded-pill px-2 py-0.5 text-xs font-semibold"
                  style={{
                    background: "var(--amber-bg)",
                    color: "var(--amber-fg)",
                  }}
                >
                  pending
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </main>
  );
}
