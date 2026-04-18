import Image from "next/image";
import { approvePaymentAction, rejectPaymentAction } from "@/lib/actions";
import { formatMalaysianPhoneNumber, formatMonthLabel, formatTimestamp } from "@/lib/utils";
import { ContactActions } from "@/components/contact-actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { ReceiptPreviewModal } from "@/components/receipt-preview-modal";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

type ApprovalCardProps = {
  payment: {
    id: string;
    month: string;
    status: "pending" | "rejected";
    display_status?: "pending" | "rejected";
    created_at: string;
    notes: string | null;
    reject_reason: string | null;
    signedProofUrl: string | null;
    auditLogs?: Array<{
      id: string;
      action: string;
      message: string;
      created_at: string;
    }>;
    users: {
      house_number: string;
      name: string;
      address: string;
      phone_number: string | null;
    };
  };
};

export function AdminApprovalCard({ payment }: ApprovalCardProps) {
  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
            {payment.users.house_number}
          </p>
          <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
            {payment.users.name}
          </h3>
          <p className="mt-1 text-base text-muted">{payment.users.address}</p>
          <p className="mt-1 text-sm text-muted">
            {payment.users.phone_number
              ? formatMalaysianPhoneNumber(payment.users.phone_number)
              : "No phone number saved yet"}
          </p>
          <ContactActions phoneNumber={payment.users.phone_number} compact className="mt-3" />
        </div>
        <StatusBadge status={payment.display_status ?? payment.status} />
      </div>

      <div className="grid gap-3 rounded-3xl bg-slate-50 p-4 text-base text-slate-800 sm:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Month</p>
          <p className="mt-1 font-semibold text-slate-900">{formatMonthLabel(payment.month)}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Submitted</p>
          <p className="mt-1 font-semibold text-slate-900">{formatTimestamp(payment.created_at)}</p>
        </div>
      </div>

      {payment.signedProofUrl ? (
        <div className="relative overflow-hidden rounded-4xl border border-line">
          <ReceiptPreviewModal
            src={payment.signedProofUrl}
            alt={`Receipt from ${payment.users.house_number}`}
          />
          <Image
            src={payment.signedProofUrl}
            alt={`Receipt from ${payment.users.house_number}`}
            width={1200}
            height={1200}
            className="h-auto w-full object-cover"
          />
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
          No receipt image was uploaded for this record.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <form action={approvePaymentAction}>
          <input type="hidden" name="payment_id" value={payment.id} />
          <input type="hidden" name="month" value={payment.month} />
          <label
            htmlFor={`approve-notes-${payment.id}`}
            className="mb-2 block text-base font-bold text-slate-950"
          >
            Admin notes
          </label>
          <textarea
            id={`approve-notes-${payment.id}`}
            name="notes"
            defaultValue={payment.notes ?? ""}
            placeholder="Optional note for committee records"
            className="mb-3 h-24 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
          />
          <ConfirmSubmitButton
            confirmMessage={`Approve payment for ${payment.users.house_number}?`}
            confirmTitle="Approve this payment proof?"
            className="w-full"
          >
            Approve payment
          </ConfirmSubmitButton>
        </form>
        <form action={rejectPaymentAction}>
          <input type="hidden" name="payment_id" value={payment.id} />
          <input type="hidden" name="month" value={payment.month} />
          <label
            htmlFor={`reject-reason-${payment.id}`}
            className="mb-2 block text-base font-bold text-slate-950"
          >
            Reject reason
          </label>
          <select
            id={`reject-reason-${payment.id}`}
            name="reject_reason"
            defaultValue={payment.reject_reason ?? "Receipt image is not clear."}
            className="mb-3 min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
          >
            <option>Receipt image is not clear.</option>
            <option>Wrong month selected.</option>
            <option>Payment amount does not match.</option>
            <option>Receipt is not a valid transaction proof.</option>
            <option>Duplicate or already reviewed payment.</option>
          </select>
          <textarea
            name="notes"
            defaultValue={payment.notes ?? ""}
            placeholder="Optional extra note"
            className="mb-3 h-24 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
          />
          <ConfirmSubmitButton
            confirmMessage={`Reject payment proof from ${payment.users.house_number}?`}
            confirmTitle="Reject this payment proof?"
            variant="danger"
            className="w-full bg-rose-700 hover:bg-rose-800"
          >
            Reject proof
          </ConfirmSubmitButton>
        </form>
      </div>

      <p className="rounded-3xl bg-amber-50 px-4 py-3 text-base text-amber-900">
        Use <span className="font-bold">Reject proof</span> only when the uploaded receipt is wrong,
        unclear, or does not match the month.
      </p>

      <div className="rounded-3xl bg-slate-50 p-4">
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-primary">Timeline</p>
        <div className="mt-3 space-y-3">
          {payment.auditLogs && payment.auditLogs.length > 0 ? (
            payment.auditLogs.map((log) => (
              <div key={log.id} className="rounded-2xl bg-white px-4 py-3">
                <p className="text-base font-bold text-slate-950">{log.message}</p>
                <p className="mt-1 text-sm text-muted">{formatTimestamp(log.created_at)}</p>
              </div>
            ))
          ) : (
            <p className="text-base text-muted">No timeline entries yet.</p>
          )}
        </div>
      </div>
    </Card>
  );
}
