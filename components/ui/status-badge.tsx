import type { DisplayPaymentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const labelMap: Record<DisplayPaymentStatus, string> = {
  paid: "Selesai",
  pending: "Dalam semakan",
  rejected: "Ditolak",
  unpaid: "Belum bayar",
  overdue: "Lewat bayar",
};

const styleMap: Record<DisplayPaymentStatus, string> = {
  paid: "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200",
  pending: "bg-amber-100 text-amber-900 ring-1 ring-amber-200",
  rejected: "bg-rose-100 text-rose-900 ring-1 ring-rose-200",
  unpaid: "bg-rose-100 text-rose-900 ring-1 ring-rose-200",
  overdue: "bg-rose-700 text-white ring-1 ring-rose-800",
};

export function StatusBadge({
  status,
  className,
}: {
  status: DisplayPaymentStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.12em]",
        styleMap[status],
        className,
      )}
    >
      {labelMap[status]}
    </span>
  );
}
