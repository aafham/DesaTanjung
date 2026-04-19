import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  Home,
  MessageCircleWarning,
  Phone,
  ReceiptText,
  UserRound,
} from "lucide-react";
import { ContactActions } from "@/components/contact-actions";
import { DataWarning } from "@/components/data-warning";
import { MonthFilter } from "@/components/month-filter";
import { PaymentTimeline } from "@/components/payment-timeline";
import { ReceiptPreviewModal } from "@/components/receipt-preview-modal";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAdminResidentDetailData } from "@/lib/data";
import { formatMalaysianPhoneNumber, formatMonthLabel, formatTimestamp } from "@/lib/utils";

export default async function AdminResidentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const {
    auditLogs,
    currentMonth,
    currentMonthLabel,
    currentPayment,
    currentProofUrl,
    dueDateLabel,
    history,
    resident,
    settings,
    warnings,
  } = await getAdminResidentDetailData(id, query.month);

  return (
    <div className="space-y-6">
      <DataWarning warnings={warnings} />
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            href={`/admin/residents?month=${currentMonth}`}
            className="inline-flex items-center gap-2 text-base font-bold text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to residents
          </Link>
          <p className="mt-4 text-sm font-bold uppercase tracking-[0.14em] text-primary">
            Resident detail
          </p>
          <h2 className="mt-2 font-display text-4xl font-bold leading-tight text-slate-950">
            {resident.house_number} - {resident.name}
          </h2>
          <p className="mt-3 max-w-2xl text-base text-muted">
            Review profile, current month status, uploaded proof, and the full payment history.
          </p>
        </div>
        <div className="w-full max-w-sm">
          <MonthFilter currentMonth={currentMonth} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
        <Card
          className="border-slate-900 text-white"
          style={{
            background:
              "linear-gradient(135deg, #07111f 0%, #0f2d3d 50%, #0f766e 100%)",
          }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-teal-100">
                Resident command view
              </p>
              <h3 className="mt-2 text-3xl font-bold leading-tight text-white">
                {resident.house_number} needs {currentPayment ? "payment review context" : "monthly follow-up"}
              </h3>
              <p className="mt-3 max-w-2xl text-base text-slate-100">
                Check the latest status, contact the resident quickly, and jump straight to the next admin action without leaving this page.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentPayment?.status === "pending" ? (
                <Link
                  href={`/admin/approvals?month=${currentMonth}`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-amber-200 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-white"
                >
                  Open approvals
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
              {currentPayment?.signed_proof_url ? (
                <ReceiptPreviewModal
                  src={currentPayment.signed_proof_url}
                  alt={`Receipt for ${resident.house_number}`}
                  triggerLabel="View receipt"
                  inline
                />
              ) : null}
            </div>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-3xl bg-white/10 px-4 py-4 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-teal-100">Current status</p>
              <div className="mt-3">
                <StatusBadge status={currentPayment?.display_status ?? "unpaid"} />
              </div>
            </div>
            <div className="rounded-3xl bg-white/10 px-4 py-4 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-teal-100">Last updated</p>
              <p className="mt-3 text-lg font-bold text-white">
                {currentPayment?.updated_at
                  ? formatTimestamp(currentPayment.updated_at)
                  : "No record yet"}
              </p>
            </div>
            <div className="rounded-3xl bg-white/10 px-4 py-4 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-teal-100">Payment method</p>
              <p className="mt-3 text-lg font-bold capitalize text-white">
                {currentPayment?.payment_method ?? "online"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-slate-50">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Contact and follow-up</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-950">Resident contact details</h3>
          <div className="mt-5 space-y-4">
            <div className="rounded-3xl bg-white px-4 py-4 shadow-sm">
              <p className="text-sm font-bold text-muted">Phone number</p>
              <p className="mt-1 text-xl font-bold text-slate-950">
                {resident.phone_number
                  ? formatMalaysianPhoneNumber(resident.phone_number)
                  : "No phone number saved yet"}
              </p>
            </div>
            <ContactActions phoneNumber={resident.phone_number} />
            <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4">
              <div className="flex items-start gap-3">
                <MessageCircleWarning className="mt-0.5 h-5 w-5 text-amber-700" />
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.12em] text-amber-800">
                    Follow-up note
                  </p>
                  <p className="mt-1 text-base text-amber-950">
                    Use WhatsApp or Call when payment is overdue, rejected, or still missing after the due date.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-slate-700">
                Suggested admin next step
              </p>
              <p className="mt-2 text-base text-slate-800">
                {currentPayment?.status === "pending"
                  ? "Open Approvals to review the uploaded receipt and confirm the payment."
                  : currentPayment?.status === "rejected"
                    ? "Contact the resident and ask for a clearer or corrected re-upload."
                    : currentPayment?.display_status === "overdue"
                      ? "Follow up immediately because this resident is already past the due date."
                      : currentPayment?.display_status === "paid"
                        ? "No urgent action is needed. You can review history or committee notes if required."
                        : "Remind the resident to make payment and upload the receipt for review."}
              </p>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="min-h-48">
          <UserRound className="h-5 w-5 text-primary" />
          <p className="mt-4 text-base font-bold text-muted">Owner</p>
          <p className="text-2xl font-bold text-slate-950">{resident.name}</p>
        </Card>
        <Card className="min-h-48">
          <Home className="h-5 w-5 text-primary" />
          <p className="mt-4 text-base font-bold text-muted">Address</p>
          <p className="text-xl font-bold text-slate-950">{resident.address}</p>
        </Card>
        <Card className="min-h-48">
          <Phone className="h-5 w-5 text-primary" />
          <p className="mt-4 text-base font-bold text-muted">Phone number</p>
          <p className="text-xl font-bold text-slate-950">
            {resident.phone_number
              ? formatMalaysianPhoneNumber(resident.phone_number)
              : "No phone number saved yet"}
          </p>
        </Card>
        <Card className="min-h-48">
          <Clock3 className="h-5 w-5 text-primary" />
          <p className="mt-4 text-base font-bold text-muted">Due date</p>
          <p className="text-xl font-bold text-slate-950">{dueDateLabel}</p>
          {settings.monthly_fee ? (
            <p className="mt-2 text-sm text-muted">RM {settings.monthly_fee.toFixed(2)} per month</p>
          ) : null}
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.88fr_1.12fr] xl:items-start">
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
                Current month
              </p>
              <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
                {currentMonthLabel}
              </h3>
            </div>
            <StatusBadge status={currentPayment?.display_status ?? "unpaid"} />
          </div>

          <div className="grid gap-3 rounded-3xl bg-slate-50 p-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-slate-700">
                Payment method
              </p>
              <p className="mt-2 text-xl font-bold capitalize text-slate-950">
                {currentPayment?.payment_method ?? "online"}
              </p>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-slate-700">
                Updated
              </p>
              <p className="mt-2 text-xl font-bold text-slate-950">
                {currentPayment?.updated_at
                  ? formatTimestamp(currentPayment.updated_at)
                  : "No record yet"}
              </p>
            </div>
            {currentPayment?.reject_reason ? (
              <p className="rounded-2xl bg-rose-50 px-3 py-2 text-base font-bold text-rose-900 md:col-span-2">
                Reject reason: {currentPayment.reject_reason}
              </p>
            ) : null}
            {currentPayment?.notes ? (
              <p className="rounded-2xl bg-white px-3 py-2 text-base text-slate-800 md:col-span-2">
                Admin note: {currentPayment.notes}
              </p>
            ) : null}
          </div>

          {currentProofUrl ? (
            <div className="overflow-hidden rounded-3xl border border-line">
              <Image
                src={currentProofUrl}
                alt={`Receipt for ${resident.house_number}`}
                width={1200}
                height={1200}
                className="h-auto w-full object-cover"
              />
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-line px-4 py-8 text-center text-base text-muted">
              No receipt uploaded for this month.
            </div>
          )}
        </Card>

        <Card className="self-start">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-teal-50 p-3">
              <ReceiptText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Timeline</p>
              <h3 className="mt-1 font-display text-3xl font-bold leading-tight text-slate-950">
                Payment activity
              </h3>
            </div>
          </div>
          <div className="mt-5">
            {currentPayment ? (
              <PaymentTimeline payment={currentPayment} auditLogs={auditLogs} />
            ) : (
              <div className="rounded-3xl bg-slate-50 px-4 py-6 text-base text-muted">
                No payment timeline exists yet for this resident in the selected month.
              </div>
            )}
          </div>
        </Card>
      </section>

      <Card className="p-0 overflow-hidden">
        <div className="border-b border-line bg-slate-50 px-4 py-4">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">History by month</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-950">Payment history</h3>
          <p className="mt-1 text-sm text-slate-600">
            Review older payment decisions, timestamps, notes, and receipt previews in one place.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-left">
            <thead className="bg-white">
              <tr className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
                <th className="px-4 py-4">Month</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Method</th>
                <th className="px-4 py-4">Updated</th>
                <th className="px-4 py-4">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-base text-slate-800">
              {history.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-4 py-4 text-lg font-bold text-slate-950">
                    {formatMonthLabel(payment.month)}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={payment.display_status} />
                  </td>
                  <td className="px-4 py-4 capitalize">{payment.payment_method}</td>
                  <td className="px-4 py-4">{formatTimestamp(payment.updated_at)}</td>
                  <td className="px-4 py-4">
                    <div className="space-y-2">
                      <p>{payment.notes || payment.reject_reason || "-"}</p>
                      {payment.signed_proof_url ? (
                        <ReceiptPreviewModal
                          src={payment.signed_proof_url}
                          alt={`Receipt for ${resident.house_number} in ${payment.month}`}
                          triggerLabel="View receipt"
                          inline
                        />
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
