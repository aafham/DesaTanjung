import { ReceiptPreviewModal } from "@/components/receipt-preview-modal";
import type { ResidentPaymentRecord } from "@/lib/types";
import { formatMonthLabel, formatTimestamp } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";

export function PaymentHistoryTable({ history }: { history: ResidentPaymentRecord[] }) {
  if (history.length === 0) {
    return (
      <div className="rounded-4xl border border-line bg-slate-50 px-5 py-8 text-base font-medium text-muted">
        No payment records are available yet. Your future uploads and committee decisions will appear here.
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3 md:hidden">
        {history.map((payment) => (
          <div key={payment.id} className="rounded-4xl border border-line bg-white p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold text-slate-950">{formatMonthLabel(payment.month)}</p>
                <p className="mt-1 text-sm font-medium text-muted">{formatTimestamp(payment.updated_at)}</p>
              </div>
              <StatusBadge status={payment.display_status} />
            </div>

            <div className="mt-4 grid gap-3 rounded-3xl bg-slate-50 p-4 text-sm text-slate-800">
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-slate-700">Method</span>
                <span className="font-semibold capitalize text-slate-950">{payment.payment_method}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-slate-700">Receipt</span>
                {payment.signed_proof_url ? (
                  <ReceiptPreviewModal
                    src={payment.signed_proof_url}
                    alt={`Receipt for ${formatMonthLabel(payment.month)}`}
                    triggerLabel="View receipt"
                    inline
                  />
                ) : (
                  <span className="font-semibold text-slate-700">No receipt</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-4xl border border-line bg-white md:block">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-line text-left">
          <caption className="sr-only">
            Resident payment history with month, status, payment method, receipt preview, and latest update time.
          </caption>
          <thead className="bg-slate-50">
            <tr className="text-xs font-bold uppercase tracking-[0.12em] text-slate-700">
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
                    <span className="text-sm font-medium text-slate-700">No receipt</span>
                  )}
                </td>
                <td className="px-4 py-5">{formatTimestamp(payment.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </>
  );
}
