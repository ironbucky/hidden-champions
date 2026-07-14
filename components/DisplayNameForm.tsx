"use client";

import { useActionState } from "react";
import { updateDisplayName } from "@/features/auth/actions";

export function DisplayNameForm({ defaultValue }: { defaultValue?: string }) {
  const [state, formAction, pending] = useActionState(updateDisplayName, null);

  return (
    <>
      <form action={formAction} className="mt-6 flex flex-col gap-2 sm:flex-row">
        <input
          name="displayName"
          defaultValue={defaultValue ?? ""}
          placeholder="Set a display name"
          minLength={2}
          className="input flex-1"
        />
        <button
          type="submit"
          disabled={pending}
          className="btn-primary disabled:opacity-50"
        >
          {pending ? "Saving…" : "Update name"}
        </button>
      </form>
      {state?.message && (
        <p className="mt-2 text-sm text-muted">
          {state.message}
        </p>
      )}
    </>
  );
}
