import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, Download, FileText, WalletCards } from "lucide-react";
import { MonthFilter } from "@/components/month-filter";
import { DataWarning } from "@/components/data-warning";
import { PageToast } from "@/components/page-toast";
import { PrintPageButton } from "@/components/print-page-button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAdminReportData } from "@/lib/data";
import { formatTimestamp } from "@/lib/utils";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const { currentMonth, currentMonthLabel, dueDateLabel, residents, settings, totals, warnings } =
    await getAdminReportData(params.month);
  const collectionRate =
    totals.totalResidents > 0
      ? Math.round((totals.paidCount / totals.totalResidents) * 100)
      : 0;
  const residentsNeedingFollowUp = residents.filter((resident) => {
    const displayStatus = resident.currentPayment?.display_status ?? "unpaid";
    return ["unpaid", "overdue", "rejected"].includes(displayStatus);
  });
  const pendingReviewResidents = residents.filter(
    (resident) => resident.currentPayment?.display_status === "pending",
  );
  const topFollowUpResidents = residentsNeedingFollowUp.slice(0, 4);
  const meetingHighlights = [
    {
      label: "Collected",
      value: `RM ${totals.collectedAmount.toFixed(2)}`,
      help: `${totals.paidCount} houses already settled this month.`,
      tone: "border-emerald-200 bg-emerald-50",
    },
    {
      label: "Outstanding",
      value: `RM ${totals.outstandingAmount.toFixed(2)}`,
      help: `${totals.unsettledCount} houses still need follow-up.`,
      tone: "border-rose-200 bg-rose-50",
    },
    {
      label: "Pending review",
      value: String(totals.pendingCount),
      help: pendingReviewResidents.length > 0
        ? "Receipts are uploaded and waiting for committee review."
        : "No proof is waiting for review right now.",
      tone: "border-amber-200 bg-amber-50",
    },
  ] as const;

  return (
    <div className="space-y-6 print:space-y-4">
      <PageToast message={params.message} error={params.error} />
      <DataWarning warnings={warnings} />

      <section className="hidden rounded-3xl border border-slate-300 bg-white p-6 print:block">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-600">
          Desa Tanjung
        </p>
        <h1 className="mt-2 text-4xl font-bold text-slate-950">
          Monthly Collection Report
        </h1>
        <p className="mt-2 text-lg text-slate-700">{currentMonthLabel}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Expected</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">
              RM {totals.expectedCollection.toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Collected</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">
              RM {totals.collectedAmount.toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Outstanding</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">
              RM {totals.outstandingAmount.toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Due date</p>
            <p className="mt-1 text-xl font-bold text-slate-950">{dueDateLabel}</p>
          </div>
        </div>
      </section>

      <section className="hidden rounded-3xl border border-slate-300 bg-white p-6 print:block">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Community</p>
            <p className="mt-1 text-lg font-bold text-slate-950">{settings.community_name}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Bank account</p>
            <p className="mt-1 text-lg font-bold text-slate-950">{settings.bank_name}</p>
            <p className="text-sm text-slate-700">{settings.bank_account_number}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Meeting use</p>
            <p className="mt-1 text-lg font-bold text-slate-950">Committee review copy</p>
          </div>
        </div>
      </section>

      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
        <Card className="overflow-hidden border-slate-900 bg-slate-950 p-0 text-white print:border-slate-300 print:bg-white print:text-slate-950">
          <div className="bg-[radial-gradient(circle_at_top_left,#14b8a6_0%,transparent_32%),linear-gradient(135deg,#07111f_0%,#0b2f2d_58%,#063f3a_100%)] px-5 py-6 sm:px-6 print:bg-white">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-100 print:text-slate-600">Reports</p>
            <h2 className="mt-3 font-display text-4xl font-bold leading-[1.04] text-white sm:text-5xl print:text-slate-950">
              Monthly report for {currentMonthLabel}
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-8 text-slate-100 print:text-slate-700">
              Review collection progress, money collected, and houses that need follow-up before closing the month.
            </p>
            <div className="mt-6 rounded-3xl border border-white/10 bg-white/10 px-4 py-4 print:border-slate-200 print:bg-slate-50">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.12em] text-teal-100 print:text-slate-600">
                    Overall progress
                  </p>
                  <p className="mt-1 font-display text-6xl font-bold leading-none text-white print:text-slate-950">
                    {collectionRate}%
                  </p>
                </div>
                <p className="max-w-xs text-base text-slate-100 print:text-slate-700">
                  {totals.paidCount} paid, {totals.unsettledCount} still need action.
                </p>
              </div>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/20 print:bg-slate-200">
                <div className="h-full rounded-full bg-teal-200 print:bg-primary" style={{ width: `${collectionRate}%` }} />
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4">
          <Card className="print:border-slate-300 print:shadow-none">
            <div className="min-w-0">
              <MonthFilter currentMonth={currentMonth} />
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={`/admin/reports/snapshot?month=${currentMonth}`}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-base font-bold text-slate-950 transition hover:bg-slate-50 sm:w-auto"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download snapshot
                </Link>
                <PrintPageButton className="min-h-12 w-full sm:w-auto" />
              </div>
            </div>
          </Card>

          <section className="grid gap-3 sm:grid-cols-2">
            {[
              {
                label: "Paid houses",
                value: totals.paidCount,
                help: `${totals.totalResidents} houses total`,
                icon: CheckCircle2,
                tone: "border-emerald-200 bg-emerald-50 text-emerald-950",
                valueClassName: "text-3xl",
              },
              {
                label: "Pending review",
                value: totals.pendingCount,
                help: "Receipts waiting",
                icon: Clock3,
                tone: "border-amber-200 bg-amber-50 text-amber-950",
                valueClassName: "text-3xl",
              },
              {
                label: "Need follow-up",
                value: totals.unsettledCount,
                help: "Unpaid, overdue, rejected",
                icon: AlertTriangle,
                tone: "border-rose-200 bg-rose-50 text-rose-950",
                valueClassName: "text-3xl",
              },
              {
                label: "Due date",
                value: dueDateLabel,
                help: `${totals.pendingCount} pending receipts`,
                icon: FileText,
                tone: "border-sky-200 bg-sky-50 text-sky-950",
                valueClassName: "text-2xl",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.label} className={`rounded-4xl border px-5 py-4 shadow-sm ${item.tone}`}>
                  <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold uppercase tracking-[0.12em]">{item.label}</p>
                      <p className={`mt-2 break-words font-bold leading-tight ${item.valueClassName}`}>
                        {item.value}
                      </p>
                      <p className="mt-2 text-sm font-semibold opacity-80">{item.help}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        </div>
      </section>

      <section className="grid items-start gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="print:border-slate-300 print:shadow-none">
          <div className="flex items-start gap-4">
            <div className="hidden rounded-3xl bg-teal-50 p-4 sm:block">
              <WalletCards className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
                Committee summary
              </p>
              <h3 className="mt-2 text-3xl font-bold text-slate-950">
                Collection progress for {currentMonthLabel}
              </h3>
              <p className="mt-2 max-w-2xl text-base text-slate-700">
                {totals.paidCount} houses have settled payment, while {totals.unsettledCount} still need follow-up before closing this month.
              </p>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-primary" style={{ width: `${collectionRate}%` }} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="grid grid-cols-3 gap-3 bg-slate-50">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Paid</p>
            <p className="mt-1 text-3xl font-bold text-emerald-900">{totals.paidCount}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Pending</p>
            <p className="mt-1 text-3xl font-bold text-amber-900">{totals.pendingCount}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Rejected</p>
            <p className="mt-1 text-3xl font-bold text-rose-900">{totals.rejectedCount}</p>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-sky-200 bg-sky-50">
          <p className="text-base font-bold text-sky-800">Expected collection</p>
          <p className="mt-2 font-display text-4xl font-bold text-sky-950">
            RM {totals.expectedCollection.toFixed(2)}
          </p>
          <p className="mt-2 text-sm font-semibold text-sky-900">
            RM {(settings.monthly_fee ?? 0).toFixed(2)} x {totals.totalResidents} residents
          </p>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50">
          <p className="text-base font-bold text-emerald-800">Collected</p>
          <p className="mt-2 font-display text-4xl font-bold text-emerald-950">
            RM {totals.collectedAmount.toFixed(2)}
          </p>
          <p className="mt-2 text-sm font-semibold text-emerald-900">{totals.paidCount} houses paid</p>
        </Card>
        <Card className="border-rose-200 bg-rose-50">
          <p className="text-base font-bold text-rose-800">Outstanding</p>
          <p className="mt-2 font-display text-4xl font-bold text-rose-950">
            RM {totals.outstandingAmount.toFixed(2)}
          </p>
          <p className="mt-2 text-sm font-semibold text-rose-900">
            {totals.unsettledCount} houses to follow up
          </p>
        </Card>
      </section>

      <section className="grid items-start gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="bg-slate-50/80">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
            Meeting highlights
          </p>
          <h3 className="mt-2 text-3xl font-bold text-slate-950">
            What the committee should discuss first
          </h3>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {meetingHighlights.map((item) => (
              <div key={item.label} className={`rounded-3xl border px-4 py-4 ${item.tone}`}>
                <p className="text-sm font-bold uppercase tracking-[0.12em] text-slate-700">{item.label}</p>
                <p className="mt-3 text-3xl font-bold text-slate-950">{item.value}</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{item.help}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="bg-slate-50/80">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
            Follow-up queue
          </p>
          <h3 className="mt-2 text-3xl font-bold text-slate-950">
            Houses still needing action
          </h3>
          <p className="mt-2 text-base text-slate-700">
            Prioritise these houses after the meeting or export the full resident table below.
          </p>
          <div className="mt-5 space-y-3">
            {topFollowUpResidents.length === 0 ? (
              <div className="rounded-3xl bg-emerald-50 px-4 py-4 text-base font-semibold text-emerald-900">
                No house currently needs extra follow-up beyond the pending review queue.
              </div>
            ) : (
              topFollowUpResidents.map((resident) => (
                <div key={resident.id} className="rounded-3xl border border-line bg-white px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold text-slate-950">
                        {resident.house_number} - {resident.name}
                      </p>
                      <p className="mt-1 text-sm text-slate-700">{resident.address}</p>
                    </div>
                    <StatusBadge status={resident.currentPayment?.display_status ?? "unpaid"} />
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-5">
            <Link
              href={`/admin/residents?month=${currentMonth}`}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-base font-bold text-white transition hover:bg-slate-800"
            >
              Open residents follow-up
            </Link>
          </div>
        </Card>
      </section>

      <Card className="p-0 overflow-hidden">
        <div className="border-b border-line bg-slate-50 px-4 py-4">
          <h3 className="text-2xl font-bold text-slate-950">Resident breakdown</h3>
          <p className="mt-1 text-base font-medium text-muted">
            Use this summary during committee meetings or monthly review.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-left">
            <caption className="sr-only">
              Resident monthly payment breakdown for the selected report month.
            </caption>
            <thead className="bg-white">
              <tr className="text-xs font-bold uppercase tracking-[0.12em] text-slate-700">
                <th className="px-4 py-4">House</th>
                <th className="px-4 py-4">Owner</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Method</th>
                <th className="px-4 py-4">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-base text-slate-800">
              {residents.map((resident) => (
              <tr key={resident.id} className="odd:bg-white even:bg-slate-50/60">
                  <td className="px-4 py-4 text-lg font-bold text-slate-950">
                    {resident.house_number}
                  </td>
                  <td className="px-4 py-4">{resident.name}</td>
                  <td className="px-4 py-4">
                    <StatusBadge status={resident.currentPayment?.display_status ?? "unpaid"} />
                  </td>
                  <td className="px-4 py-4 capitalize">
                    {resident.currentPayment?.payment_method ?? "-"}
                  </td>
                  <td className="px-4 py-4">
                    {resident.currentPayment?.updated_at
                      ? formatTimestamp(resident.currentPayment.updated_at)
                      : "No record yet"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <section className="hidden rounded-3xl border border-slate-300 bg-white p-6 print:block">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-700">
              Prepared by
            </p>
            <div className="mt-10 border-t border-slate-300 pt-3 text-base text-slate-700">
              Committee / Treasurer Signature
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-700">
              Generated at
            </p>
            <div className="mt-4 text-base font-semibold text-slate-950">
              {formatTimestamp(new Date().toISOString())}
            </div>
            <div className="mt-6 border-t border-slate-300 pt-3 text-base text-slate-700">
              Meeting review notes
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
