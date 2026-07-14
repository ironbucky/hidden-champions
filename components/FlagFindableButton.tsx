"use client";

import { useState, useTransition } from "react";
import { flagAsFindable } from "@/features/requests/actions";

interface FlagFindableButtonProps {
  requestId: string;
}

export function FlagFindableButton({ requestId }: FlagFindableButtonProps) {
  const [showForm, setShowForm] = useState(false);
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="btn-outline"
      >
        Flag — actually findable
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          await flagAsFindable(requestId, link, notes);
          setShowForm(false);
          setLink("");
          setNotes("");
        });
      }}
      className="w-full space-y-3 rounded-card border border-border p-4"
    >
      <p className="text-sm font-medium text-muted">
        Provide a link to where this supplier can be found online:
      </p>
      <input
        type="url"
        required
        value={link}
        onChange={(e) => setLink(e.target.value)}
        placeholder="https://..."
        className="block w-full rounded-input border border-border px-3 py-2 text-sm text-fg"
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Optional notes"
        className="block w-full rounded-input border border-border px-3 py-2 text-sm text-fg"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending || !link}
          className="btn-primary disabled:opacity-50"
        >
          Submit flag
        </button>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="rounded-input px-4 py-2 text-sm font-medium text-muted hover:text-fg"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
