import { ReceiptPreviewModal } from "@/components/receipt-preview-modal";
import { ServerPaginationControls } from "@/components/ui/server-pagination-controls";
import type { PaginationMeta, ResidentPaymentRecord } from "@/lib/types";
import type { Locale } from "@/lib/i18n";
import { formatMonthLabel, formatTimestamp } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";

const historyCopy = {
  ms: {
    empty: "Belum ada rekod bayaran. Resit yang dimuat naik dan keputusan jawatankuasa akan muncul di sini.",
    showing: "Memaparkan",
    of: "daripada",
    records: "rekod bayaran.",
    method: "Kaedah",
    receipt: "Resit",
    noReceipt: "Tiada resit",
    viewReceipt: "Lihat resit",
    month: "Bulan",
    status: "Status",
    updated: "Dikemas kini",
    caption: "Sejarah bayaran penduduk mengikut bulan, status, kaedah bayaran, resit, dan masa kemas kini.",
  },
  en: {
    empty: "No payment records yet. Uploaded receipts and committee decisions will appear here.",
    showing: "Showing",
    of: "of",
    records: "payment records.",
    method: "Method",
    receipt: "Receipt",
    noReceipt: "No receipt",
    viewReceipt: "View receipt",
    month: "Month",
    status: "Status",
    updated: "Updated",
    caption: "Resident payment history by month, status, payment method, receipt, and update time.",
  },
} as const;

export function PaymentHistoryTable({
  history,
  pagination,
  locale = "en",
}: {
  history: ResidentPaymentRecord[];
  pagination?: PaginationMeta;
  locale?: Locale;
}) {
  const copy = historyCopy[locale];

  if (history.length === 0) {
    return (
      <div className="rounded-4xl border border-line bg-slate-50 px-5 py-8 text-base font-medium text-muted">
        {copy.empty}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pagination ? (
        <div className="rounded-3xl border border-line bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          {copy.showing} {pagination.totalItems === 0 ? 0 : (pagination.currentPage - 1) * pagination.pageSize + 1}-
          {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} {copy.of}{" "}
          {pagination.totalItems} {copy.records}
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
              <StatusBadge status={payment.display_status} locale={locale} />
            </div>

            <div className="mt-4 grid gap-3 rounded-3xl bg-slate-50 p-4 text-sm text-slate-800">
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-slate-700">{copy.method}</span>
                <span className="font-semibold capitalize text-slate-950">{payment.payment_method}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-slate-700">{copy.receipt}</span>
                {payment.signed_proof_url ? (
                  <ReceiptPreviewModal
                    src={payment.signed_proof_url}
                    alt={`${copy.receipt} ${formatMonthLabel(payment.month)}`}
                    triggerLabel={copy.viewReceipt}
                    inline
                  />
                ) : (
                  <span className="font-semibold text-slate-700">{copy.noReceipt}</span>
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
            {copy.caption}
          </caption>
          <thead className="bg-slate-50">
            <tr className="text-xs font-bold uppercase tracking-[0.12em] text-slate-700">
              <th className="px-4 py-4">{copy.month}</th>
              <th className="px-4 py-4">{copy.status}</th>
              <th className="px-4 py-4">{copy.method}</th>
              <th className="px-4 py-4">{copy.receipt}</th>
              <th className="px-4 py-4">{copy.updated}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-base text-slate-800">
            {history.map((payment) => (
              <tr key={payment.id}>
                <td className="px-4 py-5 text-lg font-bold text-slate-950">
                  {formatMonthLabel(payment.month)}
                </td>
                <td className="px-4 py-5">
                  <StatusBadge status={payment.display_status} locale={locale} />
                </td>
                <td className="px-4 py-5 capitalize">{payment.payment_method}</td>
                <td className="px-4 py-5">
                  {payment.signed_proof_url ? (
                    <ReceiptPreviewModal
                      src={payment.signed_proof_url}
                      alt={`${copy.receipt} ${formatMonthLabel(payment.month)}`}
                      triggerLabel={copy.viewReceipt}
                      inline
                    />
                  ) : (
                    <span className="text-sm font-medium text-slate-700">{copy.noReceipt}</span>
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
