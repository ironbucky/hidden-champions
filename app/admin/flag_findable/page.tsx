import Link from "next/link";
import { Metadata } from "next";
import { getAdminQueueItems, resolveAdminQueueItem } from "@/features/admin/actions";
import { RejectButton } from "@/components/ui/RejectButton";

export const metadata: Metadata = {
  title: "Flag-as-findable review — Admin",
  robots: "noindex",
};

export default async function AdminFlagFindablePage() {
  const items = await getAdminQueueItems("flag_findable");

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
        <h1 className="display text-2xl text-fg">Flag-as-findable review</h1>
        <p className="mt-1 text-sm text-muted">{items.length} pending</p>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const meta = item.metadata as Record<string, unknown> | null;
          const link = (meta?.link as string) ?? "";
          const flagNotes = (meta?.notes as string) ?? "";
          return (
            <div key={item.id} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-fg">Request flagged as findable</p>
                  <p className="mt-0.5 text-sm text-muted">
                    Request: {item.item_id as string}
                  </p>
                  {link && (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 block truncate text-sm text-indigo-ink underline underline-offset-2"
                    >
                      {link}
                    </a>
                  )}
                  {flagNotes && (
                    <p className="mt-1 text-xs text-muted">{flagNotes}</p>
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
                      Approve
                    </button>
                  </form>
                  <RejectButton queueId={item.id} />
                </div>
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="card p-12 text-center">
            <p className="text-muted">No pending flag-as-findable reviews.</p>
          </div>
        )}
      </div>
    </main>
  );
}
