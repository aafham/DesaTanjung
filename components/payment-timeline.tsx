import { CheckCircle2, Clock3, UploadCloud, XCircle } from "lucide-react";
import type { PaginationMeta, PaymentAuditLog, ResidentPaymentRecord } from "@/lib/types";
import { ServerPaginationControls } from "@/components/ui/server-pagination-controls";
import { formatTimestamp } from "@/lib/utils";

export function PaymentTimeline({
  payment,
  auditLogs,
  auditPagination,
  getAuditPageHref,
}: {
  payment: ResidentPaymentRecord;
  auditLogs: PaymentAuditLog[];
  auditPagination?: PaginationMeta;
  getAuditPageHref?: (page: number) => string;
}) {
  const displayStatus = payment.display_status;
  const steps = [
    {
      label: "Rekod bayaran",
      done: payment.status !== "unpaid",
      icon: UploadCloud,
      description:
        payment.status === "unpaid"
          ? "Belum ada resit dimuat naik."
          : "Resit sudah dimuat naik ke sistem.",
    },
    {
      label: "Dalam semakan",
      done: ["pending", "paid", "rejected"].includes(payment.status),
      icon: Clock3,
      description:
        payment.status === "pending"
          ? "Jawatankuasa sedang menyemak bayaran anda."
          : payment.status === "unpaid"
            ? "Menunggu resit dimuat naik."
            : "Semakan selesai.",
    },
    {
      label: payment.status === "rejected" ? "Ditolak" : "Diluluskan",
      done: ["paid", "rejected"].includes(payment.status),
      icon: payment.status === "rejected" || displayStatus === "overdue" ? XCircle : CheckCircle2,
      description:
        payment.status === "paid"
          ? "Bayaran anda sudah disahkan."
          : payment.status === "rejected"
            ? payment.reject_reason ?? "Sila muat naik resit yang betul."
            : displayStatus === "overdue"
              ? "Bayaran bulan ini sudah melepasi tarikh akhir."
            : "Menunggu keputusan akhir.",
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
              Log aktiviti
            </p>
            {auditPagination ? (
              <p className="mt-1 text-sm font-semibold text-slate-600">
                Memaparkan {auditLogs.length} daripada {auditPagination.totalItems} rekod aktiviti.
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-3 space-y-3">
          {auditLogs.length === 0 ? (
            <p className="text-base font-medium text-muted">Belum ada aktiviti.</p>
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
            <ServerPaginationControls
              pagination={auditPagination}
              getHref={getAuditPageHref}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
