import Link from "next/link";
import { Metadata } from "next";
import { getAdminQueueItems, verifyUser } from "@/features/admin/actions";
import { createServiceRoleClient } from "@/infrastructure/supabase/serviceRole";
import { RejectButton } from "@/components/ui/RejectButton";

export const metadata: Metadata = {
  title: "User verification — Admin",
  robots: "noindex",
};

export default async function AdminUserVerifyPage() {
  const items = await getAdminQueueItems("user_verify");
  const service = createServiceRoleClient();

  const users = await Promise.all(
    items.map(async (item) => {
      const { data: user } = await service
        .from("users")
        .select("id, phone, display_name, created_at, verified_at")
        .eq("id", item.item_id)
        .single();
      return { queue: item, user };
    })
  );

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
        <h1 className="display text-2xl text-fg">User verification</h1>
        <p className="mt-1 text-sm text-muted">
          {items.length} pending verifications
        </p>
      </div>

      <div className="space-y-3">
        {users.map(({ queue, user }) => (
          <div key={queue.id} className="card p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-fg">
                  {user?.display_name ?? "No display name"}
                </p>
                <p className="font-mono text-sm text-muted">{user?.phone}</p>
                <p className="mt-0.5 text-xs text-muted">
                  Signed up{" "}
                  {user?.created_at
                    ? new Date(user.created_at as string).toLocaleDateString()
                    : "unknown"}
                  {user?.verified_at ? " · Already verified" : ""}
                </p>
              </div>
              <div className="flex flex-none gap-2">
                <form
                  action={async () => {
                    "use server";
                    await verifyUser(queue.item_id as string);
                  }}
                >
                  <button type="submit" className="btn-primary px-3 py-1.5 text-sm">
                    Verify
                  </button>
                </form>
                <RejectButton queueId={queue.id} />
              </div>
            </div>
          </div>
        ))}

        {users.length === 0 && (
          <div className="card p-12 text-center">
            <p className="text-muted">No pending user verifications.</p>
          </div>
        )}
      </div>
    </main>
  );
}
