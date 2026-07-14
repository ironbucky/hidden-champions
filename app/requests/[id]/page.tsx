import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { supabaseAuthAdapter } from "@/infrastructure/supabaseAuthAdapter";
import { createServiceRoleClient } from "@/infrastructure/supabase/serviceRole";
import { UpvoteButton } from "@/components/UpvoteButton";
import { ConfirmRejectButtons } from "@/components/ConfirmRejectButtons";
import { FlagFindableButton } from "@/components/FlagFindableButton";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const metadata: Metadata = {
  title: "Request — Hidden Champions",
  robots: "noindex",
};

interface Props {
  params: Promise<{ id: string }>;
}

const STATE_VARIANT: Record<string, "default" | "amber" | "accent" | "indigo"> =
  {
    open: "accent",
    answered: "indigo",
    confirmed: "accent",
    rejected: "default",
    expired: "default",
    draft: "default",
    "flagged-closed": "amber",
  };

export default async function RequestPage({ params }: Props) {
  const { id } = await params;
  const session = await supabaseAuthAdapter.getSession();
  if (!session.userId) redirect("/login");

  const service = createServiceRoleClient();

  const { data: request } = await service
    .from("requests")
    .select(
      "*, categories(name), answers(*, users(display_name), suppliers(id, name))"
    )
    .eq("id", id)
    .single();

  if (!request) notFound();

  const { data: userUpvote } = await service
    .from("request_upvotes")
    .select("created_at")
    .eq("request_id", id)
    .eq("user_id", session.userId)
    .single();

  const hasUpvoted = userUpvote !== null;
  const isRequester = request.requester_user_id === session.userId;
  const isOpen = request.state === "open";
  const isAnswered = request.state === "answered";
  const isStale = !!(
    request.stale_bounty_at &&
    new Date().getTime() >= new Date(request.stale_bounty_at as string).getTime()
  );

  const answers = (request.answers as unknown[] | null) ?? [];
  const activeAnswer = answers.find(
    (a) => (a as { state: string }).state === "answered"
  );

  const stateLabel = {
    draft: "Draft",
    open: "Open",
    answered: "Answered",
    confirmed: "Confirmed",
    rejected: "Rejected",
    expired: "Expired",
    "flagged-closed": "Flagged (findable)",
  }[request.state as string];

  const categoryName =
    (request as unknown as { categories: { name: string } | null }).categories
      ?.name ?? "Unknown";

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-6">
      {/* Back link */}
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

      {/* ===================== Main card ===================== */}
      <div className="card overflow-hidden">
        <div className="ajrak-thin" aria-hidden="true" />
        <div className="p-5 sm:p-6">
          {/* Status badges */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <StatusBadge variant={STATE_VARIANT[request.state as string] ?? "default"}>
              {stateLabel}
            </StatusBadge>
            {isStale && isOpen && (
              <StatusBadge variant="amber">
                Stale bounty — 3x reputation
              </StatusBadge>
            )}
          </div>

          <h1 className="display text-2xl text-fg sm:text-3xl">
            {request.what}
          </h1>

          {/* Metadata */}
          <dl className="mt-5 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                Category
              </dt>
              <dd className="mt-0.5 text-fg">{categoryName}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                Area
              </dt>
              <dd className="mt-0.5 text-fg">{request.area}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                Posted
              </dt>
              <dd className="mt-0.5 text-fg">
                {new Date(request.created_at as string).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                Expires
              </dt>
              <dd className="mt-0.5 text-fg">
                {new Date(request.expires_at as string).toLocaleDateString()}
              </dd>
            </div>
          </dl>

          {!!request.notes && (
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Notes
              </p>
              <p className="mt-0.5 text-sm text-fg">
                {request.notes as string}
              </p>
            </div>
          )}

          {/* Unfindable attestations */}
          {!!request.unfindable_attestations && (
            <div className="mt-4 rounded-input border border-border bg-surface-2 p-3">
              <p className="text-xs font-medium text-muted">
                Searcher attested they searched and struck out on:
              </p>
              <ul className="mt-1 list-inside list-disc text-xs text-muted">
                {Object.entries(
                  request.unfindable_attestations as Record<string, boolean>
                )
                  .filter(([, v]) => v)
                  .map(([key]) => (
                    <li key={key}>
                      {{
                        searched_google: "Google",
                        searched_maps: "Google Maps",
                        searched_b2b: "IndiaMART / B2B directories",
                        searched_social: "WhatsApp / social media",
                        asked_around: "Asked people they know",
                      }[key] ?? key}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Upvote section */}
          {isOpen && (
            <div className="mt-6 flex items-center gap-3 border-t border-border pt-6">
              <UpvoteButton
                requestId={id}
                userId={session.userId}
                initiallyUpvoted={hasUpvoted}
                upvoteCount={request.upvotes as number}
              />
              <span className="text-sm text-muted">
                <span className="font-semibold text-terra-ink">
                  {request.upvotes as number}
                </span>{" "}
                {request.upvotes === 1 ? "person" : "people"} need this
              </span>
            </div>
          )}

          {!isOpen && (
            <div className="mt-6 border-t border-border pt-6">
              <span className="text-sm text-muted">
                <span className="font-semibold text-terra-ink">
                  {request.upvotes}
                </span>{" "}
                upvotes
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ===================== Answers ===================== */}
      {answers.length > 0 && (
        <section className="mt-6">
          <p className="eyebrow mb-3">
            Answers ({answers.length})
          </p>
          <div className="space-y-3">
            {answers.map((answer) => {
              const a = answer as {
                id: string;
                state: string;
                supplier_id: string;
                suppliers: { id: string; name: string } | null;
                users: { display_name: string | null } | null;
              };
              return (
                <div key={a.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/suppliers/${a.supplier_id}`}
                        className="font-medium text-fg hover:underline"
                      >
                        {a.suppliers?.name ?? "Unknown supplier"}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted">
                        by {a.users?.display_name ?? "Anonymous champion"}
                      </p>
                    </div>
                    <StatusBadge
                      variant={
                        a.state === "answered"
                          ? "indigo"
                          : a.state === "confirmed"
                            ? "accent"
                            : a.state === "rejected"
                              ? "default"
                              : "default"
                      }
                    >
                      {a.state}
                    </StatusBadge>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ===================== Requester actions (confirm/reject) ===================== */}
      {isRequester && isAnswered && !!activeAnswer && (
        <section className="mt-6">
          <div
            className="card p-5"
            style={{ borderColor: "var(--indigo)", background: "oklch(96% 0.03 265)" }}
          >
            <p className="eyebrow mb-1">Your call</p>
            <h2 className="display text-lg text-fg">
              Was this answer helpful?
            </h2>
            <p className="mt-1 text-sm text-muted">
              Confirm if the champion found your supplier, or reject if not.
            </p>
            <div className="mt-4">
              <ConfirmRejectButtons
                requestId={id}
                answerId={(activeAnswer as { id: string }).id}
              />
            </div>
          </div>
        </section>
      )}

      {/* ===================== Champion actions (answer, flag) ===================== */}
      {isOpen && session.verifiedAt && !isRequester && (
        <section className="mt-6">
          <div
            className="card p-5"
            style={{ borderColor: "var(--accent)", background: "oklch(96% 0.03 165)" }}
          >
            <p className="eyebrow mb-1">Champion</p>
            <h2 className="display text-lg text-fg">Know a supplier?</h2>
            <p className="mt-1 text-sm text-muted">
              Answer with a hidden supplier you personally know, or flag if this
              request is actually findable online.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={`/suppliers/upload?answeringRequestId=${id}`}
                className="btn-primary w-full sm:w-auto"
              >
                Answer with a supplier
              </Link>
              <FlagFindableButton requestId={id} />
            </div>
          </div>
        </section>
      )}

      {/* Message for unanswered, non-requester, non-champion */}
      {isOpen && !session.verifiedAt && !isRequester && (
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
              Verification required to answer requests.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
