"use client";

import { useTransition } from "react";
import { confirmAnswer, rejectAnswer } from "@/features/requests/actions";

interface ConfirmRejectButtonsProps {
  requestId: string;
  answerId: string;
}

export function ConfirmRejectButtons({
  requestId,
  answerId,
}: ConfirmRejectButtonsProps) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await confirmAnswer(requestId, answerId);
          })
        }
        className="btn-primary disabled:opacity-50"
      >
        Confirm — found them
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await rejectAnswer(requestId, answerId);
          })
        }
        className="btn-reject disabled:opacity-50"
      >
        Reject — wrong supplier
      </button>
    </div>
  );
}
