import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/mock-data";
import { STATUS_LABEL } from "@/lib/mock-data";

const STATUS_CLASSES: Record<OrderStatus, string> = {
  NEW: "bg-status-new-bg text-status-new-fg",
  IN_CREATION: "bg-status-creation-bg text-status-creation-fg",
  WAITING_APPROVAL: "bg-status-approval-bg text-status-approval-fg",
  READY_FOR_PRINT: "bg-status-print-bg text-status-print-fg",
  PRINTING: "bg-status-printing-bg text-status-printing-fg",
  FINISHED: "bg-status-done-bg text-status-done-fg",
  DELIVERED: "bg-status-delivered-bg text-status-delivered-fg",
  CANCELED: "bg-status-cancel-bg text-status-cancel-fg",
};

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap",
        STATUS_CLASSES[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
