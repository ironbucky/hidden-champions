"use client";

import { useActionState } from "react";
import { editClaimedSupplier } from "@/features/suppliers/claim-actions";

interface EditSupplierFormProps {
  supplierId: string;
  defaultName: string;
  defaultArea: string;
}

export function EditSupplierForm({
  supplierId,
  defaultName,
  defaultArea,
}: EditSupplierFormProps) {
  const [state, formAction, pending] = useActionState(
    editClaimedSupplier,
    null as { success: boolean; message: string } | null
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="supplierId" value={supplierId} />

      <div>
        <label
          htmlFor="name"
          className="label"
        >
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaultName}
          className="input mt-1"
        />
      </div>

      <div>
        <label
          htmlFor="area"
          className="label"
        >
          Area
        </label>
        <input
          id="area"
          name="area"
          required
          defaultValue={defaultArea}
          className="input mt-1"
        />
      </div>

      {state?.message && (
        <p
          className={`text-sm ${
            state.success
              ? "text-accent-ink"
              : "text-terra-ink"
          }`}
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full btn-primary disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
