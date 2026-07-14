"use client";

import { useState, useTransition } from "react";
import { unlockContact } from "@/features/anti-scrape/actions";

interface ContactUnlockButtonProps {
  supplierId: string;
}

export function ContactUnlockButton({ supplierId }: ContactUnlockButtonProps) {
  const [phone, setPhone] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const handleUnlock = () => {
    startTransition(async () => {
      const result = await unlockContact(supplierId);
      if (result.success && result.phone) setPhone(result.phone);
      setMessage(result.message);
      if (result.remaining !== undefined) setRemaining(result.remaining);
    });
  };

  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <h2 className="font-semibold text-fg">Contact</h2>

      {phone ? (
        <div className="mt-3">
          <p className="text-lg font-semibold text-fg">{phone}</p>
          {remaining !== null && (
            <p className="mt-1 text-xs text-muted">{remaining} unlocks remaining today</p>
          )}
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted">
            Phone numbers are gated behind verified accounts and daily unlock limits to protect suppliers.
          </p>
          <button
            type="button"
            onClick={handleUnlock}
            disabled={pending}
            className="mt-4 btn-primary"
          >
            {pending ? "Unlocking…" : "Request contact"}
          </button>
        </>
      )}

      {message && !phone && (
        <p className="mt-3 text-sm text-amber-fg">{message}</p>
      )}
    </div>
  );
}
