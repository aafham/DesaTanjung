import Link from "next/link";
import { ArrowRight, BellRing, Clock3, Home, Info, Phone, Wallet } from "lucide-react";
import { AnnouncementFeed } from "@/components/announcement-feed";
import { DataWarning } from "@/components/data-warning";
import { LiveRefresh } from "@/components/live-refresh";
import { PaymentHistoryTable } from "@/components/payment-history-table";
import { PaymentTimeline } from "@/components/payment-timeline";
import { ResidentNotificationList } from "@/components/resident-notification-list";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getUserDashboardData } from "@/lib/data";
import { getLocale } from "@/lib/i18n";
import { formatMalaysianPhoneNumber } from "@/lib/utils";

const dashboardCopy = {
  ms: {
    currentMonth: "Bulan semasa",
    intro: "Semak status bayaran bulan ini dan muat naik resit selepas membuat pindahan.",
    house: "Rumah",
    due: "Tarikh akhir",
    rejectedReason: "Sebab ditolak",
    committeeNote: "Nota jawatankuasa",
    payNow: "Bayar sekarang",
    notifications: "Lihat notifikasi",
    houseNumber: "Nombor rumah",
    ownerName: "Nama pemilik",
    address: "Alamat",
    phone: "Nombor telefon",
    updateProfile: "Sila kemas kini profil",
    latestStatus: "Status terkini",
    monthlyFee: "Yuran bulanan",
    noAnnouncements: "Belum ada makluman penduduk.",
    timeline: "Timeline",
    latestActivity: "Aktiviti bayaran terkini",
    historyLabel: "Sejarah",
    paymentHistory: "Sejarah bayaran",
    statusMessage: {
      paid: "Bayaran sudah disahkan. Terima kasih kerana menjelaskan bayaran bulan ini.",
      pending: "Resit sudah dimuat naik. Sila tunggu semakan jawatankuasa.",
      unpaid: "Belum ada rekod bayaran. Tekan Bayar Sekarang untuk muat naik resit.",
      rejected: "Resit ditolak. Sila muat naik resit yang lebih jelas atau betul.",
      overdue: "Bayaran bulan ini sudah lewat. Sila jelaskan secepat mungkin.",
    },
    statusTitle: {
      paid: "Selesai",
      pending: "Dalam semakan",
      unpaid: "Menunggu bayaran",
      rejected: "Ditolak",
      overdue: "Lewat bayar",
    },
  },
  en: {
    currentMonth: "Current month",
    intro: "Check this month payment status and upload your receipt after making a transfer.",
    house: "House",
    due: "Due",
    rejectedReason: "Reject reason",
    committeeNote: "Committee note",
    payNow: "Pay now",
    notifications: "View notifications",
    houseNumber: "House number",
    ownerName: "Owner name",
    address: "Address",
    phone: "Phone number",
    updateProfile: "Please update profile",
    latestStatus: "Latest status",
    monthlyFee: "Monthly fee",
    noAnnouncements: "No resident announcements have been posted yet.",
    timeline: "Timeline",
    latestActivity: "Latest payment activity",
    historyLabel: "History",
    paymentHistory: "Payment history",
    statusMessage: {
      paid: "Payment has been approved. Thank you for settling this month.",
      pending: "Your receipt has been uploaded. Please wait for committee review.",
      unpaid: "No payment record yet. Press Pay now to upload your receipt.",
      rejected: "Your receipt was rejected. Please upload a clearer or correct receipt.",
      overdue: "This month payment is overdue. Please settle it as soon as possible.",
    },
    statusTitle: {
      paid: "Paid",
      pending: "Under review",
      unpaid: "Waiting for payment",
      rejected: "Rejected",
      overdue: "Overdue",
    },
  },
} as const;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ historyPage?: string }>;
}) {
  const params = await searchParams;
  const locale = await getLocale();
  const copy = dashboardCopy[locale];
  const historyPage = Number.parseInt(params.historyPage ?? "1", 10) || 1;
  const {
    announcements,
    auditLogs,
    currentMonthLabel,
    currentPayment,
    dueDateLabel,
    history,
    historyPagination,
    notifications,
    profile,
    settings,
    warnings,
  } =
    await getUserDashboardData(historyPage, 6);
  const statusMessage = copy.statusMessage[currentPayment.display_status];
  const statusTitle = copy.statusTitle[currentPayment.display_status];

  return (
    <div className="space-y-6">
      <LiveRefresh />
      <DataWarning warnings={warnings} locale={locale} />
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card
          className="border-slate-900 p-5 text-white sm:p-6"
          style={{
            background:
              "linear-gradient(135deg, #07111f 0%, #0b2f2d 55%, #064e48 100%)",
          }}
        >
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-teal-100">{copy.currentMonth}</p>
          <h2 className="mt-3 font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
            {currentMonthLabel}
          </h2>
          <p className="mt-4 max-w-lg text-base leading-7 text-slate-100 sm:text-lg sm:leading-8">
            {copy.intro}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <StatusBadge
              status={currentPayment.display_status}
              locale={locale}
              className="border border-white/15 bg-white/10 text-white ring-0"
            />
            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white">
              {copy.house} {profile.house_number}
            </span>
            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white">
              {copy.due} {dueDateLabel}
            </span>
          </div>
          <div className="mt-5 flex items-start gap-3 rounded-3xl border border-white/10 bg-white/10 p-4 text-base text-white">
            <Info className="mt-1 h-5 w-5 shrink-0 text-teal-200" />
            <p>{statusMessage}</p>
          </div>
          {currentPayment.reject_reason ? (
            <div className="mt-4 rounded-3xl bg-rose-100 p-4 text-base font-bold text-rose-950">
              {copy.rejectedReason}: {currentPayment.reject_reason}
            </div>
          ) : null}
          {currentPayment.notes ? (
            <div className="mt-4 rounded-3xl border border-white/10 bg-white/10 p-4 text-base text-white">
              {copy.committeeNote}: {currentPayment.notes}
            </div>
          ) : null}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/payments"
              className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-teal-200 px-6 py-3 text-lg font-bold text-slate-950 transition hover:bg-white sm:w-auto"
            >
              {copy.payNow}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/notifications"
              className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-6 py-3 text-base font-bold text-white transition hover:bg-white/15 sm:w-auto"
            >
              <BellRing className="h-4 w-4" />
              {copy.notifications}
            </Link>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
          <Card className="border-slate-200 bg-slate-50/80">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-base font-bold text-muted">{copy.houseNumber}</p>
                <p className="text-3xl font-bold text-slate-950">{profile.house_number}</p>
              </div>
              <StatusBadge status={currentPayment.display_status} locale={locale} />
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-teal-50 p-3">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-base font-bold text-muted">{copy.ownerName}</p>
                <p className="text-xl font-bold text-slate-950">{profile.name}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-teal-50 p-3">
                <Home className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-base font-bold text-muted">{copy.address}</p>
                <p className="text-xl font-bold text-slate-950">{profile.address}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-sky-50 p-3">
                <Phone className="h-5 w-5 text-sky-700" />
              </div>
              <div>
                <p className="text-base font-bold text-muted">{copy.phone}</p>
                <p className="text-xl font-bold text-slate-950">
                  {profile.phone_number
                    ? formatMalaysianPhoneNumber(profile.phone_number)
                    : copy.updateProfile}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-50 p-3">
                <Clock3 className="h-5 w-5 text-amber-800" />
              </div>
              <div>
                <p className="text-base font-bold text-muted">{copy.latestStatus}</p>
                <p className="text-xl font-bold text-slate-950">{statusTitle}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-rose-50 p-3">
                <Clock3 className="h-5 w-5 text-rose-700" />
              </div>
              <div>
                <p className="text-base font-bold text-muted">{copy.due}</p>
                <p className="text-xl font-bold text-slate-950">{dueDateLabel}</p>
                {settings.monthly_fee ? (
                  <p className="mt-1 text-sm text-muted">
                    {copy.monthlyFee} RM {settings.monthly_fee.toFixed(2)}
                  </p>
                ) : null}
              </div>
            </div>
          </Card>
        </div>
      </section>

      <AnnouncementFeed
        announcements={announcements}
        emptyMessage={copy.noAnnouncements}
      />

      <ResidentNotificationList notifications={notifications} locale={locale} />

      <section className="space-y-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">{copy.timeline}</p>
          <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
            {copy.latestActivity}
          </h3>
        </div>
        <Card>
          <PaymentTimeline payment={currentPayment} auditLogs={auditLogs} locale={locale} />
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">{copy.historyLabel}</p>
          <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
            {copy.paymentHistory}
          </h3>
        </div>
        <PaymentHistoryTable history={history} pagination={historyPagination} locale={locale} />
      </section>
    </div>
  );
}
