import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, Download, FileText, WalletCards } from "lucide-react";
import { MonthFilter } from "@/components/month-filter";
import { DataWarning } from "@/components/data-warning";
import { PageToast } from "@/components/page-toast";
import { PrintPageButton } from "@/components/print-page-button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAdminReportData } from "@/lib/data";
import { getLocale } from "@/lib/i18n";
import { formatTimestamp } from "@/lib/utils";

const reportCopy = {
  ms: {
    label: "Laporan",
    title: "Laporan bulanan untuk",
    intro: "Semak kemajuan kutipan, jumlah wang diterima, dan rumah yang perlu dibuat susulan sebelum tutup bulan.",
    overallProgress: "Kemajuan keseluruhan",
    paidStillNeed: (paid: number, unsettled: number) => `${paid} selesai, ${unsettled} masih perlu tindakan.`,
    downloadSnapshot: "Muat turun ringkasan",
    paidHouses: "Rumah selesai",
    housesTotal: (total: number) => `${total} rumah keseluruhan`,
    pendingReview: "Menunggu semakan",
    receiptsWaiting: "Resit menunggu",
    needFollowUp: "Perlu susulan",
    needFollowUpHelp: "Belum bayar, lewat, ditolak",
    dueDate: "Tarikh akhir",
    pendingReceipts: (count: number) => `${count} resit menunggu`,
    committeeSummary: "Ringkasan jawatankuasa",
    collectionProgress: "Kemajuan kutipan untuk",
    collectionSummary: (paid: number, unsettled: number) =>
      `${paid} rumah sudah selesai bayaran, manakala ${unsettled} masih perlu susulan sebelum tutup bulan ini.`,
    paid: "Selesai",
    pending: "Menunggu",
    rejected: "Ditolak",
    expectedCollection: "Jangkaan kutipan",
    residents: "penduduk",
    collected: "Diterima",
    housesPaid: (count: number) => `${count} rumah sudah bayar`,
    outstanding: "Belum diterima",
    housesToFollow: (count: number) => `${count} rumah perlu susulan`,
    meetingHighlights: "Fokus mesyuarat",
    discussFirst: "Perkara utama untuk dibincang jawatankuasa",
    collectedHelp: (count: number) => `${count} rumah sudah selesai bulan ini.`,
    outstandingHelp: (count: number) => `${count} rumah masih perlu susulan.`,
    pendingReviewHelp: (hasPending: boolean) =>
      hasPending
        ? "Ada resit dimuat naik dan menunggu semakan jawatankuasa."
        : "Tiada resit sedang menunggu semakan sekarang.",
    followUpQueue: "Senarai susulan",
    housesStillNeedAction: "Rumah yang masih perlu tindakan",
    followUpQueueHelp: "Utamakan rumah ini selepas mesyuarat atau eksport jadual penuh di bawah.",
    noFollowUp: "Tiada rumah yang perlukan susulan tambahan selain resit yang sedang menunggu semakan.",
    openResidentsFollowUp: "Buka susulan penduduk",
    residentBreakdown: "Pecahan penduduk",
    residentBreakdownHelp: "Gunakan ringkasan ini semasa mesyuarat jawatankuasa atau semakan bulanan.",
    residentBreakdownCaption: "Pecahan bayaran bulanan penduduk untuk bulan laporan yang dipilih.",
    house: "Rumah",
    owner: "Pemilik",
    status: "Status",
    method: "Kaedah",
    updated: "Dikemas kini",
    noRecord: "Belum ada rekod",
    printReportTitle: "Laporan Kutipan Bulanan",
    expected: "Jangkaan",
    community: "Komuniti",
    bankAccount: "Akaun bank",
    meetingUse: "Kegunaan mesyuarat",
    committeeReviewCopy: "Salinan semakan jawatankuasa",
    preparedBy: "Disediakan oleh",
    signature: "Tandatangan Jawatankuasa / Bendahari",
    generatedAt: "Dijana pada",
    meetingNotes: "Nota semakan mesyuarat",
  },
  en: {
    label: "Reports",
    title: "Monthly report for",
    intro: "Review collection progress, money collected, and houses that need follow-up before closing the month.",
    overallProgress: "Overall progress",
    paidStillNeed: (paid: number, unsettled: number) => `${paid} paid, ${unsettled} still need action.`,
    downloadSnapshot: "Download snapshot",
    paidHouses: "Paid houses",
    housesTotal: (total: number) => `${total} houses total`,
    pendingReview: "Pending review",
    receiptsWaiting: "Receipts waiting",
    needFollowUp: "Need follow-up",
    needFollowUpHelp: "Unpaid, overdue, rejected",
    dueDate: "Due date",
    pendingReceipts: (count: number) => `${count} pending receipts`,
    committeeSummary: "Committee summary",
    collectionProgress: "Collection progress for",
    collectionSummary: (paid: number, unsettled: number) =>
      `${paid} houses have settled payment, while ${unsettled} still need follow-up before closing this month.`,
    paid: "Paid",
    pending: "Pending",
    rejected: "Rejected",
    expectedCollection: "Expected collection",
    residents: "residents",
    collected: "Collected",
    housesPaid: (count: number) => `${count} houses paid`,
    outstanding: "Outstanding",
    housesToFollow: (count: number) => `${count} houses to follow up`,
    meetingHighlights: "Meeting highlights",
    discussFirst: "What the committee should discuss first",
    collectedHelp: (count: number) => `${count} houses already settled this month.`,
    outstandingHelp: (count: number) => `${count} houses still need follow-up.`,
    pendingReviewHelp: (hasPending: boolean) =>
      hasPending
        ? "Receipts are uploaded and waiting for committee review."
        : "No proof is waiting for review right now.",
    followUpQueue: "Follow-up queue",
    housesStillNeedAction: "Houses still needing action",
    followUpQueueHelp: "Prioritise these houses after the meeting or export the full resident table below.",
    noFollowUp: "No house currently needs extra follow-up beyond the pending review queue.",
    openResidentsFollowUp: "Open residents follow-up",
    residentBreakdown: "Resident breakdown",
    residentBreakdownHelp: "Use this summary during committee meetings or monthly review.",
    residentBreakdownCaption: "Resident monthly payment breakdown for the selected report month.",
    house: "House",
    owner: "Owner",
    status: "Status",
    method: "Method",
    updated: "Updated",
    noRecord: "No record yet",
    printReportTitle: "Monthly Collection Report",
    expected: "Expected",
    community: "Community",
    bankAccount: "Bank account",
    meetingUse: "Meeting use",
    committeeReviewCopy: "Committee review copy",
    preparedBy: "Prepared by",
    signature: "Committee / Treasurer Signature",
    generatedAt: "Generated at",
    meetingNotes: "Meeting review notes",
  },
} as const;

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const locale = await getLocale();
  const copy = reportCopy[locale];
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
      label: copy.collected,
      value: `RM ${totals.collectedAmount.toFixed(2)}`,
      help: copy.collectedHelp(totals.paidCount),
      tone: "border-emerald-200 bg-emerald-50",
    },
    {
      label: copy.outstanding,
      value: `RM ${totals.outstandingAmount.toFixed(2)}`,
      help: copy.outstandingHelp(totals.unsettledCount),
      tone: "border-rose-200 bg-rose-50",
    },
    {
      label: copy.pendingReview,
      value: String(totals.pendingCount),
      help: copy.pendingReviewHelp(pendingReviewResidents.length > 0),
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
          {copy.printReportTitle}
        </h1>
        <p className="mt-2 text-lg text-slate-700">{currentMonthLabel}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{copy.expected}</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">
              RM {totals.expectedCollection.toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{copy.collected}</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">
              RM {totals.collectedAmount.toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{copy.outstanding}</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">
              RM {totals.outstandingAmount.toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{copy.dueDate}</p>
            <p className="mt-1 text-xl font-bold text-slate-950">{dueDateLabel}</p>
          </div>
        </div>
      </section>

      <section className="hidden rounded-3xl border border-slate-300 bg-white p-6 print:block">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{copy.community}</p>
            <p className="mt-1 text-lg font-bold text-slate-950">{settings.community_name}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{copy.bankAccount}</p>
            <p className="mt-1 text-lg font-bold text-slate-950">{settings.bank_name}</p>
            <p className="text-sm text-slate-700">{settings.bank_account_number}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{copy.meetingUse}</p>
            <p className="mt-1 text-lg font-bold text-slate-950">{copy.committeeReviewCopy}</p>
          </div>
        </div>
      </section>

      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
        <Card className="overflow-hidden border-slate-900 bg-slate-950 p-0 text-white print:border-slate-300 print:bg-white print:text-slate-950">
          <div className="bg-[radial-gradient(circle_at_top_left,#14b8a6_0%,transparent_32%),linear-gradient(135deg,#07111f_0%,#0b2f2d_58%,#063f3a_100%)] px-5 py-6 sm:px-6 print:bg-white">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-100 print:text-slate-600">{copy.label}</p>
            <h2 className="mt-3 font-display text-4xl font-bold leading-[1.04] text-white sm:text-5xl print:text-slate-950">
              {copy.title} {currentMonthLabel}
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-8 text-slate-100 print:text-slate-700">
              {copy.intro}
            </p>
            <div className="mt-6 rounded-3xl border border-white/10 bg-white/10 px-4 py-4 print:border-slate-200 print:bg-slate-50">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.12em] text-teal-100 print:text-slate-600">
                    {copy.overallProgress}
                  </p>
                  <p className="mt-1 font-display text-6xl font-bold leading-none text-white print:text-slate-950">
                    {collectionRate}%
                  </p>
                </div>
                <p className="max-w-xs text-base text-slate-100 print:text-slate-700">
                  {copy.paidStillNeed(totals.paidCount, totals.unsettledCount)}
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
              <MonthFilter currentMonth={currentMonth} locale={locale} />
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={`/admin/reports/snapshot?month=${currentMonth}`}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-base font-bold text-slate-950 transition hover:bg-slate-50 sm:w-auto"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {copy.downloadSnapshot}
                </Link>
                <PrintPageButton className="min-h-12 w-full sm:w-auto" locale={locale} />
              </div>
            </div>
          </Card>

          <section className="grid gap-3 sm:grid-cols-2">
            {[
              {
                label: copy.paidHouses,
                value: totals.paidCount,
                help: copy.housesTotal(totals.totalResidents),
                icon: CheckCircle2,
                tone: "border-emerald-200 bg-emerald-50 text-emerald-950",
                valueClassName: "text-3xl",
              },
              {
                label: copy.pendingReview,
                value: totals.pendingCount,
                help: copy.receiptsWaiting,
                icon: Clock3,
                tone: "border-amber-200 bg-amber-50 text-amber-950",
                valueClassName: "text-3xl",
              },
              {
                label: copy.needFollowUp,
                value: totals.unsettledCount,
                help: copy.needFollowUpHelp,
                icon: AlertTriangle,
                tone: "border-rose-200 bg-rose-50 text-rose-950",
                valueClassName: "text-3xl",
              },
              {
                label: copy.dueDate,
                value: dueDateLabel,
                help: copy.pendingReceipts(totals.pendingCount),
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
                {copy.committeeSummary}
              </p>
              <h3 className="mt-2 text-3xl font-bold text-slate-950">
                {copy.collectionProgress} {currentMonthLabel}
              </h3>
              <p className="mt-2 max-w-2xl text-base text-slate-700">
                {copy.collectionSummary(totals.paidCount, totals.unsettledCount)}
              </p>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-primary" style={{ width: `${collectionRate}%` }} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="grid grid-cols-3 gap-3 bg-slate-50">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{copy.paid}</p>
            <p className="mt-1 text-3xl font-bold text-emerald-900">{totals.paidCount}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{copy.pending}</p>
            <p className="mt-1 text-3xl font-bold text-amber-900">{totals.pendingCount}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{copy.rejected}</p>
            <p className="mt-1 text-3xl font-bold text-rose-900">{totals.rejectedCount}</p>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-sky-200 bg-sky-50">
          <p className="text-base font-bold text-sky-800">{copy.expectedCollection}</p>
          <p className="mt-2 font-display text-4xl font-bold text-sky-950">
            RM {totals.expectedCollection.toFixed(2)}
          </p>
          <p className="mt-2 text-sm font-semibold text-sky-900">
            RM {(settings.monthly_fee ?? 0).toFixed(2)} x {totals.totalResidents} {copy.residents}
          </p>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50">
          <p className="text-base font-bold text-emerald-800">{copy.collected}</p>
          <p className="mt-2 font-display text-4xl font-bold text-emerald-950">
            RM {totals.collectedAmount.toFixed(2)}
          </p>
          <p className="mt-2 text-sm font-semibold text-emerald-900">{copy.housesPaid(totals.paidCount)}</p>
        </Card>
        <Card className="border-rose-200 bg-rose-50">
          <p className="text-base font-bold text-rose-800">{copy.outstanding}</p>
          <p className="mt-2 font-display text-4xl font-bold text-rose-950">
            RM {totals.outstandingAmount.toFixed(2)}
          </p>
          <p className="mt-2 text-sm font-semibold text-rose-900">
            {copy.housesToFollow(totals.unsettledCount)}
          </p>
        </Card>
      </section>

      <section className="grid items-start gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="bg-slate-50/80">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
            {copy.meetingHighlights}
          </p>
          <h3 className="mt-2 text-3xl font-bold text-slate-950">
            {copy.discussFirst}
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
            {copy.followUpQueue}
          </p>
          <h3 className="mt-2 text-3xl font-bold text-slate-950">
            {copy.housesStillNeedAction}
          </h3>
          <p className="mt-2 text-base text-slate-700">
            {copy.followUpQueueHelp}
          </p>
          <div className="mt-5 space-y-3">
            {topFollowUpResidents.length === 0 ? (
              <div className="rounded-3xl bg-emerald-50 px-4 py-4 text-base font-semibold text-emerald-900">
                {copy.noFollowUp}
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
                    <StatusBadge status={resident.currentPayment?.display_status ?? "unpaid"} locale={locale} />
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
              {copy.openResidentsFollowUp}
            </Link>
          </div>
        </Card>
      </section>

      <Card className="p-0 overflow-hidden">
        <div className="border-b border-line bg-slate-50 px-4 py-4">
          <h3 className="text-2xl font-bold text-slate-950">{copy.residentBreakdown}</h3>
          <p className="mt-1 text-base font-medium text-muted">
            {copy.residentBreakdownHelp}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-left">
            <caption className="sr-only">
              {copy.residentBreakdownCaption}
            </caption>
            <thead className="bg-white">
              <tr className="text-xs font-bold uppercase tracking-[0.12em] text-slate-700">
                <th className="px-4 py-4">{copy.house}</th>
                <th className="px-4 py-4">{copy.owner}</th>
                <th className="px-4 py-4">{copy.status}</th>
                <th className="px-4 py-4">{copy.method}</th>
                <th className="px-4 py-4">{copy.updated}</th>
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
                    <StatusBadge status={resident.currentPayment?.display_status ?? "unpaid"} locale={locale} />
                  </td>
                  <td className="px-4 py-4 capitalize">
                    {resident.currentPayment?.payment_method ?? "-"}
                  </td>
                  <td className="px-4 py-4">
                    {resident.currentPayment?.updated_at
                      ? formatTimestamp(resident.currentPayment.updated_at)
                      : copy.noRecord}
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
              {copy.preparedBy}
            </p>
            <div className="mt-10 border-t border-slate-300 pt-3 text-base text-slate-700">
              {copy.signature}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-700">
              {copy.generatedAt}
            </p>
            <div className="mt-4 text-base font-semibold text-slate-950">
              {formatTimestamp(new Date().toISOString())}
            </div>
            <div className="mt-6 border-t border-slate-300 pt-3 text-base text-slate-700">
              {copy.meetingNotes}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
