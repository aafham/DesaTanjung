import { ReceiptPreviewModal } from "@/components/receipt-preview-modal";
import type { ResidentPaymentRecord } from "@/lib/types";
import { formatMonthLabel, formatTimestamp } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";

export function PaymentHistoryTable({ history }: { history: ResidentPaymentRecord[] }) {
  return (
    <div className="overflow-hidden rounded-4xl border border-line bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-line text-left">
          <thead className="bg-slate-50">
            <tr className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
              <th className="px-4 py-4">Month</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4">Method</th>
              <th className="px-4 py-4">Receipt</th>
              <th className="px-4 py-4">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-base text-slate-800">
            {history.map((payment) => (
              <tr key={payment.id}>
                <td className="px-4 py-5 text-lg font-bold text-slate-950">
                  {formatMonthLabel(payment.month)}
                </td>
                <td className="px-4 py-5">
                  <StatusBadge status={payment.display_status} />
                </td>
                <td className="px-4 py-5 capitalize">{payment.payment_method}</td>
                <td className="px-4 py-5">
                  {payment.signed_proof_url ? (
                    <ReceiptPreviewModal
                      src={payment.signed_proof_url}
                      alt={`Receipt for ${formatMonthLabel(payment.month)}`}
                      triggerLabel="View receipt"
                      inline
                    />
                  ) : (
                    <span className="text-sm text-muted">No receipt</span>
                  )}
                </td>
                <td className="px-4 py-5">{formatTimestamp(payment.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
