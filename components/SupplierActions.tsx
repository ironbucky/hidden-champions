"use client";

import { useState, useTransition } from "react";
import {
  claimSupplier,
  requestDelisting,
} from "@/features/suppliers/claim-actions";
import Link from "next/link";

interface SupplierActionsProps {
  supplierId: string;
  isClaimed: boolean;
  claimedByUserId: string | null;
  currentUserId: string;
  isVerified: boolean;
}

export function SupplierActions({
  supplierId,
  isClaimed,
  claimedByUserId,
  currentUserId,
  isVerified,
}: SupplierActionsProps) {
  const [claimMessage, setClaimMessage] = useState<string | null>(null);
  const [delistMessage, setDelistMessage] = useState<string | null>(null);
  const [showDelist, setShowDelist] = useState(false);
  const [delistReason, setDelistReason] = useState("");
  const [pending, startTransition] = useTransition();

  const handleClaim = () => {
    startTransition(async () => {
      const result = await claimSupplier(supplierId);
      setClaimMessage(result.message);
    });
  };

  const handleDelist = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await requestDelisting(supplierId, delistReason);
      setDelistMessage(result.message);
      setShowDelist(false);
    });
  };

  const isOwner = claimedByUserId === currentUserId;

  return (
    <div className="mt-8 space-y-4 rounded-card border border-border p-4">
      {!isClaimed && isVerified && (
        <div>
          <p className="text-sm text-muted">
            Is this your business? Claim it to manage the listing.
          </p>
          <button
            type="button"
            onClick={handleClaim}
            disabled={pending}
            className="btn-primary mt-2 disabled:opacity-50"
          >
            {pending ? "Submitting…" : "Claim this listing"}
          </button>
          {claimMessage && (
            <p className="mt-2 text-sm text-accent-ink">
              {claimMessage}
            </p>
          )}
        </div>
      )}

      {isClaimed && (
        <p className="text-sm text-muted">
          {isOwner
            ? "You own this listing."
            : "This listing has been claimed by the supplier."}
        </p>
      )}

      {isOwner && (
        <>
          <Link
            href={`/suppliers/${supplierId}/edit`}
            className="inline-block btn-outline"
          >
            Edit listing
          </Link>

          {!showDelist ? (
            <button
              type="button"
              onClick={() => setShowDelist(true)}
              className="ml-3 text-sm text-terra-ink underline"
            >
              Request delisting
            </button>
          ) : (
            <form onSubmit={handleDelist} className="space-y-2">
              <textarea
                value={delistReason}
                onChange={(e) => setDelistReason(e.target.value)}
                placeholder="Why would you like to delist? (optional)"
                rows={2}
                className="block w-full rounded-input border border-border px-3 py-2 text-sm text-fg"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-input bg-terracotta px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  Submit delist request
                </button>
                <button
                  type="button"
                  onClick={() => setShowDelist(false)}
                  className="rounded-input px-3 py-1.5 text-sm font-medium text-muted hover:text-fg"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          {delistMessage && (
            <p className="text-sm text-accent-ink">
              {delistMessage}
            </p>
          )}
        </>
      )}
    </div>
  );
}
