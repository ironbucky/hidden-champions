import { resolveAdminQueueItem } from "@/features/admin/actions";

interface RejectButtonProps {
  queueId: string;
  label?: string;
}

export function RejectButton({ queueId, label = "Reject" }: RejectButtonProps) {
  return (
    <form
      action={async () => {
        "use server";
        await resolveAdminQueueItem(queueId, "rejected");
      }}
    >
      <button type="submit" className="btn-reject text-sm">
        {label}
      </button>
    </form>
  );
}
