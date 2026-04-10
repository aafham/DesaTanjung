import type { PaymentRecord } from "@/lib/types";
import { formatMonthLabel, formatTimestamp } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";

export function PaymentHistoryTable({ history }: { history: PaymentRecord[] }) {
  return (
    <div className="overflow-hidden rounded-4xl border border-line bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-line text-left">
          <thead className="bg-slate-50">
            <tr className="text-xs uppercase tracking-[0.18em] text-muted">
              <th className="px-4 py-3">Month</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-sm text-slate-700">
            {history.map((payment) => (
              <tr key={payment.id}>
                <td className="px-4 py-4 font-medium text-slate-900">
                  {formatMonthLabel(payment.month)}
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={payment.status} />
                </td>
                <td className="px-4 py-4 capitalize">{payment.payment_method}</td>
                <td className="px-4 py-4">{formatTimestamp(payment.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
