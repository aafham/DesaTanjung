import { CheckCircle2, Clock3, UploadCloud, XCircle } from "lucide-react";
import type { PaymentAuditLog, PaymentRecord } from "@/lib/types";
import { formatTimestamp } from "@/lib/utils";

export function PaymentTimeline({
  payment,
  auditLogs,
}: {
  payment: PaymentRecord;
  auditLogs: PaymentAuditLog[];
}) {
  const steps = [
    {
      label: "Transfer record",
      done: payment.status !== "unpaid",
      icon: UploadCloud,
      description:
        payment.status === "unpaid"
          ? "No receipt uploaded yet."
          : "Receipt has been uploaded to the system.",
    },
    {
      label: "Under review",
      done: ["pending", "paid", "rejected"].includes(payment.status),
      icon: Clock3,
      description:
        payment.status === "pending"
          ? "Committee is checking your payment."
          : payment.status === "unpaid"
            ? "Waiting for receipt upload."
            : "Review completed.",
    },
    {
      label: payment.status === "rejected" ? "Rejected" : "Approved",
      done: ["paid", "rejected"].includes(payment.status),
      icon: payment.status === "rejected" ? XCircle : CheckCircle2,
      description:
        payment.status === "paid"
          ? "Your payment has been approved."
          : payment.status === "rejected"
            ? payment.reject_reason ?? "Please upload a corrected receipt."
            : "Final decision pending.",
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
                  step.done ? "text-primary" : "text-slate-400"
                }`}
              />
              <p className="mt-3 text-base font-bold text-slate-950">{step.label}</p>
              <p className="mt-1 text-sm text-muted">{step.description}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-3xl bg-slate-50 p-4">
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-primary">
          Activity log
        </p>
        <div className="mt-3 space-y-3">
          {auditLogs.length === 0 ? (
            <p className="text-base text-muted">No activity yet.</p>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="rounded-2xl bg-white px-4 py-3">
                <p className="text-base font-bold text-slate-950">{log.message}</p>
                <p className="mt-1 text-sm text-muted">{formatTimestamp(log.created_at)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
