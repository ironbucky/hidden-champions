import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { supabaseAuthAdapter } from "@/infrastructure/supabaseAuthAdapter";
import { createServiceRoleClient } from "@/infrastructure/supabase/serviceRole";
import { EditSupplierForm } from "@/components/EditSupplierForm";

export const metadata: Metadata = {
  title: "Edit supplier — Hidden Champions",
  robots: "noindex",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditSupplierPage({ params }: Props) {
  const { id } = await params;
  const session = await supabaseAuthAdapter.getSession();
  if (!session.userId) redirect("/login");

  const service = createServiceRoleClient();

  const { data: supplier } = await service
    .from("suppliers")
    .select("id, name, area, claimed_by_user_id, deleted_at")
    .eq("id", id)
    .single();

  if (!supplier || supplier.deleted_at) notFound();

  if (supplier.claimed_by_user_id !== session.userId) {
    redirect(`/suppliers/${id}`);
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-6">
      <div className="rounded-card border border-border bg-surface">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-surface rounded-t-card">
          <Link href={`/suppliers/${id}`} className="text-muted hover:text-fg transition-colors" aria-label="Back">
            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4l-5 5 5 5"/></svg>
          </Link>
          <span className="text-sm font-medium text-fg">Edit</span>
        </div>
        <div className="p-5">
          <h1 className="display text-2xl text-fg">
            Edit listing
          </h1>
          <div className="mt-6">
            <EditSupplierForm
              supplierId={id}
              defaultName={supplier.name as string}
              defaultArea={supplier.area as string}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
