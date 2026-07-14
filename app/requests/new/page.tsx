import Link from "next/link";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { supabaseAuthAdapter } from "@/infrastructure/supabaseAuthAdapter";
import { RequestForm } from "@/components/RequestForm";

export const metadata: Metadata = {
  title: "Post a request — Hidden Champions",
  robots: "noindex",
};

export default async function NewRequestPage() {
  const session = await supabaseAuthAdapter.getSession();
  if (!session.userId) redirect("/login");
  if (!session.verifiedAt) redirect("/profile?pending=true");

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-6">
      <Link
        href="/requests"
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
        Request board
      </Link>

      <div className="card overflow-hidden">
        <div className="ajrak-thin" aria-hidden="true" />
        <div className="p-5 sm:p-6">
          <h1 className="display text-2xl text-fg">Post a request</h1>
          <p className="mt-2 text-sm text-muted">
            Describe the supplier you need but couldn&apos;t find online.
            Champions who personally know hidden Lahore suppliers will answer.
          </p>
          <div className="mt-6">
            <RequestForm />
          </div>
        </div>
      </div>
    </main>
  );
}
