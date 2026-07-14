import Link from "next/link";
import { Metadata } from "next";
import { getAdminQueueItems, resolveAdminQueueItem } from "@/features/admin/actions";
import { RejectButton } from "@/components/ui/RejectButton";

export const metadata: Metadata = {
  title: "Fuzzy match review — Admin",
  robots: "noindex",
};

export default async function AdminFuzzyMatchPage() {
  const items = await getAdminQueueItems("fuzzy_match");

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-6">
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
      >
        <svg viewBox="0 0 18 18" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4l-5 5 5 5" />
        </svg>
        Admin
      </Link>

      <div className="mb-6">
        <h1 className="display text-2xl text-fg">Fuzzy match review</h1>
        <p className="mt-1 text-sm text-muted">{items.length} pending</p>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const meta = item.metadata as Record<string, unknown> | null;
          const otherId = (meta?.other_supplier_id as string) ?? "";
          return (
            <div key={item.id} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-fg">Potential duplicate</p>
                  <p className="mt-0.5 text-sm text-muted">
                    Supplier: {item.item_id as string}
                  </p>
                  {otherId && (
                    <p className="font-mono text-xs text-muted">vs. {otherId}</p>
                  )}
                </div>
                <div className="flex flex-none gap-2">
                  <form
                    action={async () => {
                      "use server";
                      await resolveAdminQueueItem(item.id, "resolved");
                    }}
                  >
                    <button type="submit" className="btn-primary px-3 py-1.5 text-sm">
                      Merge
                    </button>
                  </form>
                  <RejectButton queueId={item.id} label="Distinct" />
                </div>
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="card p-12 text-center">
            <p className="text-muted">No pending fuzzy matches.</p>
          </div>
        )}
      </div>
    </main>
  );
}
