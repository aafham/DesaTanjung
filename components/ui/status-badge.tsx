import type { PaymentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const labelMap: Record<PaymentStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  rejected: "Rejected",
  unpaid: "Unpaid",
};

const styleMap: Record<PaymentStatus, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  rejected: "bg-rose-100 text-rose-700",
  unpaid: "bg-rose-100 text-rose-700",
};

export function StatusBadge({
  status,
  className,
}: {
  status: PaymentStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
        styleMap[status],
        className,
      )}
    >
      {labelMap[status]}
    </span>
  );
}
