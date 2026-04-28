import { CheckCircle2, Clock3, History, UploadCloud, XCircle } from "lucide-react";
import type { PaginationMeta, PaymentAuditLog, ResidentPaymentRecord } from "@/lib/types";
import type { Locale } from "@/lib/i18n";
import { CompactServerPaginationControls } from "@/components/ui/compact-server-pagination-controls";
import { formatTimestamp } from "@/lib/utils";

const timelineCopy = {
  ms: {
    record: "Rekod bayaran",
    review: "Dalam semakan",
    rejected: "Ditolak",
    approved: "Diluluskan",
    noReceipt: "Belum ada resit dimuat naik.",
    receiptUploaded: "Resit sudah dimuat naik ke sistem.",
    reviewing: "Jawatankuasa sedang menyemak bayaran anda.",
    waitingReceipt: "Menunggu resit dimuat naik.",
    reviewDone: "Semakan selesai.",
    paid: "Bayaran anda sudah disahkan.",
    uploadCorrect: "Sila muat naik resit yang betul.",
    overdue: "Bayaran bulan ini sudah melepasi tarikh akhir.",
    waitingDecision: "Menunggu keputusan akhir.",
    activityLog: "Log aktiviti",
    showing: "Memaparkan",
    from: "daripada",
    records: "rekod aktiviti.",
    empty: "Belum ada aktiviti.",
    emptyTitle: "Aktiviti belum bermula",
    emptyHelp: "Log akan muncul selepas resit dimuat naik, bayaran disemak, atau jawatankuasa mengemas kini status.",
  },
  en: {
    record: "Transfer record",
    review: "Under review",
    rejected: "Rejected",
    approved: "Approved",
    noReceipt: "No receipt has been uploaded yet.",
    receiptUploaded: "Receipt has been uploaded to the system.",
    reviewing: "The committee is reviewing your payment.",
    waitingReceipt: "Waiting for receipt upload.",
    reviewDone: "Review completed.",
    paid: "Your payment has been approved.",
    uploadCorrect: "Please upload the correct receipt.",
    overdue: "This month payment is past the due date.",
    waitingDecision: "Waiting for the final decision.",
    activityLog: "Activity log",
    showing: "Showing",
    from: "of",
    records: "activity records.",
    empty: "No activity yet.",
    emptyTitle: "Activity has not started",
    emptyHelp: "Logs will appear after a receipt is uploaded, a payment is reviewed, or the committee updates the status.",
  },
} as const;

export function PaymentTimeline({
  payment,
  auditLogs,
  auditPagination,
  getAuditPageHref,
  locale = "en",
}: {
  payment: ResidentPaymentRecord;
  auditLogs: PaymentAuditLog[];
  auditPagination?: PaginationMeta;
  getAuditPageHref?: (page: number) => string;
  locale?: Locale;
}) {
  const copy = timelineCopy[locale];
  const displayStatus = payment.display_status;
  const steps = [
    {
      label: copy.record,
      done: payment.status !== "unpaid",
      icon: UploadCloud,
      description:
        payment.status === "unpaid"
          ? copy.noReceipt
          : copy.receiptUploaded,
    },
    {
      label: copy.review,
      done: ["pending", "paid", "rejected"].includes(payment.status),
      icon: Clock3,
      description:
        payment.status === "pending"
          ? copy.reviewing
          : payment.status === "unpaid"
            ? copy.waitingReceipt
            : copy.reviewDone,
    },
    {
      label: payment.status === "rejected" ? copy.rejected : copy.approved,
      done: ["paid", "rejected"].includes(payment.status),
      icon: payment.status === "rejected" || displayStatus === "overdue" ? XCircle : CheckCircle2,
      description:
        payment.status === "paid"
          ? copy.paid
          : payment.status === "rejected"
            ? payment.reject_reason ?? copy.uploadCorrect
            : displayStatus === "overdue"
              ? copy.overdue
            : copy.waitingDecision,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        {steps.map((step) => {
          const Icon = step.icon;

          return (
            <div
              key={step.label}
              className={`rounded-3xl border px-4 py-4 ${
                step.done
                  ? "border-teal-200 bg-teal-50"
                  : "border-line bg-slate-50"
              }`}
            >
              <Icon
                className={`h-5 w-5 ${
                  step.done ? "text-primary" : "text-slate-600"
                }`}
              />
              <p className="mt-3 text-base font-bold text-slate-950">{step.label}</p>
              <p className="mt-1 text-sm font-medium text-muted">{step.description}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-3xl bg-slate-50 p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-primary">
              {copy.activityLog}
            </p>
            {auditPagination ? (
              <p className="mt-1 text-sm font-semibold text-slate-600">
                {copy.showing} {auditLogs.length} {copy.from} {auditPagination.totalItems} {copy.records}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-3 space-y-3">
          {auditLogs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-line bg-white px-4 py-6 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-primary">
                <History className="h-5 w-5" />
              </div>
              <p className="mt-3 text-lg font-bold text-slate-950">{copy.emptyTitle}</p>
              <p className="mx-auto mt-1 max-w-md text-base leading-7 text-muted">{copy.empty}</p>
              <p className="mx-auto mt-1 max-w-md text-sm font-semibold leading-6 text-slate-600">
                {copy.emptyHelp}
              </p>
            </div>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="rounded-2xl bg-white px-4 py-3">
                <p className="text-base font-bold text-slate-950">{log.message}</p>
                <p className="mt-1 text-sm font-medium text-muted">{formatTimestamp(log.created_at)}</p>
              </div>
            ))
          )}
        </div>
        {auditPagination && getAuditPageHref ? (
          <div className="mt-4">
            <CompactServerPaginationControls
              pagination={auditPagination}
              getHref={getAuditPageHref}
              locale={locale}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
