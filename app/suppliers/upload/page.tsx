import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseAuthAdapter } from "@/infrastructure/supabaseAuthAdapter";
import { SupplierUploadForm } from "@/components/SupplierUploadForm";

export default async function UploadSupplierPage({
  searchParams,
}: {
  searchParams: Promise<{ answeringRequestId?: string }>;
}) {
  const session = await supabaseAuthAdapter.getSession();

  if (!session.userId) {
    redirect("/login");
  }

  if (!session.verifiedAt) {
    redirect("/profile?pending=true");
  }

  const { answeringRequestId } = await searchParams;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-6">
      <div className="rounded-card border border-border bg-surface">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-surface rounded-t-card">
          <Link href="/suppliers" className="text-muted hover:text-fg transition-colors" aria-label="Back">
            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4l-5 5 5 5"/></svg>
          </Link>
          <span className="text-sm font-medium text-fg">Upload</span>
        </div>
        <div className="p-5">
          <h1 className="display text-2xl text-fg">
            Upload a hidden supplier
          </h1>
          <p className="mt-2 text-sm text-muted">
            Champion a supplier you personally know. Their phone number will be
            gated; it is never shown on public pages.
          </p>

          <div className="mt-6">
            <SupplierUploadForm answeringRequestId={answeringRequestId} />
          </div>
        </div>
      </div>
    </main>
  );
}
