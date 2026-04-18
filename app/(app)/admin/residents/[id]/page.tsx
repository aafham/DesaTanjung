import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock3, Home, ReceiptText, UserRound } from "lucide-react";
import { MonthFilter } from "@/components/month-filter";
import { PaymentTimeline } from "@/components/payment-timeline";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAdminResidentDetailData } from "@/lib/data";
import { formatMonthLabel, formatTimestamp } from "@/lib/utils";

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
  } = await getAdminResidentDetailData(id, query.month);

  return (
    <div className="space-y-6">
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

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <UserRound className="h-5 w-5 text-primary" />
          <p className="mt-4 text-base font-bold text-muted">Owner</p>
          <p className="text-2xl font-bold text-slate-950">{resident.name}</p>
        </Card>
        <Card>
          <Home className="h-5 w-5 text-primary" />
          <p className="mt-4 text-base font-bold text-muted">Address</p>
          <p className="text-xl font-bold text-slate-950">{resident.address}</p>
        </Card>
        <Card>
          <Clock3 className="h-5 w-5 text-primary" />
          <p className="mt-4 text-base font-bold text-muted">Due date</p>
          <p className="text-xl font-bold text-slate-950">{dueDateLabel}</p>
          {settings.monthly_fee ? (
            <p className="mt-2 text-sm text-muted">RM {settings.monthly_fee.toFixed(2)} per month</p>
          ) : null}
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
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

          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-base font-bold text-slate-950">
              Payment method:{" "}
              <span className="capitalize">{currentPayment?.payment_method ?? "online"}</span>
            </p>
            <p className="mt-2 text-base text-muted">
              Updated:{" "}
              {currentPayment?.updated_at
                ? formatTimestamp(currentPayment.updated_at)
                : "No record yet"}
            </p>
            {currentPayment?.reject_reason ? (
              <p className="mt-3 rounded-2xl bg-rose-50 px-3 py-2 text-base font-bold text-rose-900">
                Reject reason: {currentPayment.reject_reason}
              </p>
            ) : null}
            {currentPayment?.notes ? (
              <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-base text-slate-800">
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

        <Card>
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
          <h3 className="text-2xl font-bold text-slate-950">History by month</h3>
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
                    {payment.notes || payment.reject_reason || "-"}
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
