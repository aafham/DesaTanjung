import { ReceiptPreviewModal } from "@/components/receipt-preview-modal";
import { ServerPaginationControls } from "@/components/ui/server-pagination-controls";
import type { PaginationMeta, ResidentPaymentRecord } from "@/lib/types";
import { formatMonthLabel, formatTimestamp } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";

export function PaymentHistoryTable({
  history,
  pagination,
}: {
  history: ResidentPaymentRecord[];
  pagination?: PaginationMeta;
}) {
  if (history.length === 0) {
    return (
      <div className="rounded-4xl border border-line bg-slate-50 px-5 py-8 text-base font-medium text-muted">
        Belum ada rekod bayaran. Resit yang dimuat naik dan keputusan jawatankuasa akan muncul di sini.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pagination ? (
        <div className="rounded-3xl border border-line bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          Memaparkan {pagination.totalItems === 0 ? 0 : (pagination.currentPage - 1) * pagination.pageSize + 1}-
          {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} of{" "}
          {pagination.totalItems} rekod bayaran.
        </div>
      ) : null}

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
                <span className="font-bold text-slate-700">Kaedah</span>
                <span className="font-semibold capitalize text-slate-950">{payment.payment_method}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-slate-700">Resit</span>
                {payment.signed_proof_url ? (
                  <ReceiptPreviewModal
                    src={payment.signed_proof_url}
                    alt={`Receipt for ${formatMonthLabel(payment.month)}`}
                    triggerLabel="Lihat resit"
                    inline
                  />
                ) : (
                  <span className="font-semibold text-slate-700">Tiada resit</span>
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
            Sejarah bayaran penduduk mengikut bulan, status, kaedah bayaran, resit, dan masa kemas kini.
          </caption>
          <thead className="bg-slate-50">
            <tr className="text-xs font-bold uppercase tracking-[0.12em] text-slate-700">
              <th className="px-4 py-4">Bulan</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4">Kaedah</th>
              <th className="px-4 py-4">Resit</th>
              <th className="px-4 py-4">Dikemas kini</th>
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
                      triggerLabel="Lihat resit"
                      inline
                    />
                  ) : (
                    <span className="text-sm font-medium text-slate-700">Tiada resit</span>
                  )}
                </td>
                <td className="px-4 py-5">{formatTimestamp(payment.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>

      {pagination ? (
        <ServerPaginationControls
          pagination={pagination}
          getHref={(page) => (page <= 1 ? "/dashboard" : `/dashboard?historyPage=${page}`)}
        />
      ) : null}
    </div>
  );
}
