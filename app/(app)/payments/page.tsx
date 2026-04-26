import Image from "next/image";
import Link from "next/link";
import { BellRing, CreditCard, Landmark, QrCode, UploadCloud } from "lucide-react";
import { DataWarning } from "@/components/data-warning";
import { LiveRefresh } from "@/components/live-refresh";
import { PaymentUploadForm } from "@/components/payment-upload-form";
import { ReceiptPreviewModal } from "@/components/receipt-preview-modal";
import { ResidentNotificationList } from "@/components/resident-notification-list";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getUserDashboardData } from "@/lib/data";
import { getLocale } from "@/lib/i18n";

const paymentsCopy = {
  ms: {
    info: "Maklumat bayaran",
    guideFor: "Panduan bayaran untuk",
    guideBody: "Gunakan maklumat bank atau imbas QR, kemudian muat naik resit supaya jawatankuasa boleh semak.",
    bankName: "Nama bank",
    accountName: "Nama akaun",
    accountNumber: "Nombor akaun",
    monthlyFee: "Yuran bulanan",
    notSet: "Belum ditetapkan",
    dueDate: "Tarikh akhir",
    scanQr: "Imbas QR",
    qrAlt: "Kod QR bayaran komuniti",
    qrMissing: "QR rasmi belum disimpan oleh admin. Buat masa ini, sila guna maklumat bank yang tertera.",
    qrHelp: "Tekan",
    qrButton: "Lihat besar",
    qrHelpEnd: "pada QR jika perlu paparan yang lebih jelas.",
    uploadLabel: "Muat naik resit",
    uploadTitle: "Hantar resit bayaran",
    currentStatus: "Status semasa",
    step1: "Buat bayaran menggunakan nombor akaun bank atau kod QR.",
    step2: "Muat naik gambar resit yang jelas di bawah.",
    step3: "Tunggu semakan jawatankuasa. Status anda akan dikemas kini secara automatik.",
    uploadIntro: "Muat naik resit selepas membuat bayaran. Status akan bertukar kepada dalam semakan sehingga disahkan oleh jawatankuasa.",
    nextTitle: "Apa berlaku selepas ini",
    overdue: "Bayaran bulan ini sudah melepasi tarikh akhir. Sila muat naik resit bayaran secepat mungkin.",
    pending: "Resit anda sudah dihantar dan sedang menunggu semakan jawatankuasa.",
    paid: "Bayaran anda sudah disahkan. Tiada tindakan lanjut diperlukan untuk bulan ini.",
    rejectedTitle: "Resit anda ditolak.",
    rejectedFallback: "Sila muat naik resit yang lebih jelas atau betul.",
    uploadTip: "Tip muat naik: pastikan jumlah bayaran, tarikh, dan rujukan transaksi jelas kelihatan sebelum hantar resit.",
    inbox: "Inbox penduduk",
    updates: "Kemas kini bayaran terkini",
    allNotifications: "Lihat semua notifikasi",
    statusHelper: {
      paid: "Bayaran bulan ini sudah selesai. Simpan resit untuk rekod sendiri.",
      pending: "Resit anda sedang disemak. Muat naik semula hanya jika diminta oleh jawatankuasa.",
      unpaid: "Sila buat bayaran dan muat naik resit supaya jawatankuasa boleh semak.",
      rejected: "Sila muat naik resit yang lebih jelas atau slip pindahan yang betul.",
      overdue: "Bayaran bulan ini sudah melepasi tarikh akhir. Sila jelaskan secepat mungkin.",
    },
  },
  en: {
    info: "Payment details",
    guideFor: "Payment guide for",
    guideBody: "Use the bank details or scan the QR code, then upload your receipt for committee review.",
    bankName: "Bank name",
    accountName: "Account name",
    accountNumber: "Account number",
    monthlyFee: "Monthly fee",
    notSet: "Not set",
    dueDate: "Due date",
    scanQr: "Scan QR",
    qrAlt: "Community payment QR code",
    qrMissing: "The official QR has not been saved by admin yet. Please use the bank details shown for now.",
    qrHelp: "Press",
    qrButton: "View larger",
    qrHelpEnd: "on the QR if you need a clearer view.",
    uploadLabel: "Upload receipt",
    uploadTitle: "Submit your receipt",
    currentStatus: "Current status",
    step1: "Make payment using the bank account number or QR code.",
    step2: "Upload a clear receipt image below.",
    step3: "Wait for committee review. Your status will update automatically.",
    uploadIntro: "Upload your receipt after payment. The status will change to under review until the committee approves it.",
    nextTitle: "What happens next",
    overdue: "This month payment is past the due date. Please upload your receipt as soon as possible.",
    pending: "Your receipt has been submitted and is waiting for committee review.",
    paid: "Your payment has been approved. No further action is needed for this month.",
    rejectedTitle: "Your receipt was rejected.",
    rejectedFallback: "Please upload a clearer or correct receipt.",
    uploadTip: "Upload tip: make sure the amount, date, and transaction reference are clearly visible before submitting.",
    inbox: "Resident inbox",
    updates: "Latest payment updates",
    allNotifications: "View all notifications",
    statusHelper: {
      paid: "This month payment is complete. Keep the receipt for your own records.",
      pending: "Your receipt is being reviewed. Upload again only if the committee asks.",
      unpaid: "Please make payment and upload the receipt so the committee can review it.",
      rejected: "Please upload a clearer receipt or the correct transfer slip.",
      overdue: "This month payment is overdue. Please settle it as soon as possible.",
    },
  },
} as const;

export default async function PaymentsPage() {
  const locale = await getLocale();
  const copy = paymentsCopy[locale];
  const { currentMonthLabel, currentPayment, dueDateLabel, notifications, profile, settings, warnings } =
    await getUserDashboardData();
  const usingPlaceholderQr = settings.payment_qr_url.includes("placehold.co");
  const statusHelperText = copy.statusHelper[currentPayment.display_status];

  return (
    <div className="space-y-6">
      <LiveRefresh />
      <DataWarning warnings={warnings} />
      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">{copy.info}</p>
              <h2 className="mt-2 font-display text-4xl font-bold leading-tight text-slate-950">
                {currentMonthLabel}
              </h2>
            </div>
            <StatusBadge status={currentPayment.display_status} locale={locale} />
          </div>

          <div className="rounded-3xl border border-amber-100 bg-amber-50 px-4 py-4 text-base text-amber-950">
            <p className="font-bold">{copy.guideFor} {profile.house_number}</p>
            <p className="mt-1">
              {copy.guideBody}
            </p>
          </div>

          <div className="grid gap-4 rounded-4xl bg-slate-50 p-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-white p-5">
              <Landmark className="h-6 w-6 text-primary" />
              <p className="mt-4 text-base font-bold text-muted">{copy.bankName}</p>
              <p className="text-xl font-bold text-slate-950">
                {settings.bank_name}
              </p>
              <p className="mt-5 text-base font-bold text-muted">{copy.accountName}</p>
              <p className="text-xl font-bold text-slate-950">
                {settings.bank_account_name}
              </p>
              <p className="mt-5 text-base font-bold text-muted">{copy.accountNumber}</p>
              <p className="font-display text-4xl font-bold leading-tight text-slate-950">
                {settings.bank_account_number}
              </p>
              {settings.monthly_fee ? (
                <>
                  <p className="mt-5 text-base font-bold text-muted">{copy.monthlyFee}</p>
                  <p className="text-2xl font-bold text-slate-950">
                    RM {settings.monthly_fee.toFixed(2)}
                  </p>
                </>
              ) : null}
              <p className="mt-5 text-base font-bold text-muted">{copy.dueDate}</p>
              <p className="text-xl font-bold text-slate-950">{dueDateLabel}</p>
            </div>
            <div className="rounded-3xl bg-white p-5">
              <div className="flex items-center gap-2 text-base font-bold text-slate-950">
                <QrCode className="h-5 w-5 text-primary" />
                {copy.scanQr}
              </div>
              <div className="mt-4 overflow-hidden rounded-3xl border border-line">
                {!usingPlaceholderQr ? (
                  <div className="relative">
                    <ReceiptPreviewModal
                      src={settings.payment_qr_url}
                      alt={copy.qrAlt}
                      triggerLabel={copy.qrButton}
                    />
                    <Image
                      src={settings.payment_qr_url}
                      alt={copy.qrAlt}
                      width={800}
                      height={800}
                      className="h-auto w-full object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <Image
                    src={settings.payment_qr_url}
                    alt={copy.qrAlt}
                    width={800}
                    height={800}
                    className="h-auto w-full object-cover"
                    unoptimized
                  />
                )}
              </div>
              {usingPlaceholderQr ? (
                <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-3 text-sm font-bold text-amber-950">
                  {copy.qrMissing}
                </p>
              ) : (
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  {copy.qrHelp} <span className="font-bold">{copy.qrButton}</span> {copy.qrHelpEnd}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-teal-50 p-3">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">{copy.uploadLabel}</p>
              <h3 className="mt-1 font-display text-3xl font-bold leading-tight text-slate-950">
                {copy.uploadTitle}
              </h3>
            </div>
          </div>

          <div className="grid gap-3 rounded-3xl bg-slate-50 p-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white px-4 py-4">
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-muted">{copy.currentStatus}</p>
              <div className="mt-3">
                <StatusBadge status={currentPayment.display_status} locale={locale} />
              </div>
            </div>
            <div className="rounded-2xl bg-white px-4 py-4">
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-muted">{copy.monthlyFee}</p>
              <p className="mt-3 text-2xl font-bold text-slate-950">
                RM {settings.monthly_fee?.toFixed(2) ?? copy.notSet}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-4">
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-muted">{copy.dueDate}</p>
              <p className="mt-3 text-lg font-bold text-slate-950">{dueDateLabel}</p>
            </div>
          </div>

          <div className="grid gap-3 rounded-3xl bg-slate-50 p-4 text-base text-slate-800">
            <div className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">1</span>
              <p>{copy.step1}</p>
            </div>
            <div className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">2</span>
              <p>{copy.step2}</p>
            </div>
            <div className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">3</span>
              <p>{copy.step3}</p>
            </div>
          </div>

          <p className="text-base text-muted">
            <UploadCloud className="mr-2 inline h-5 w-5 text-primary" />
            {copy.uploadIntro}
          </p>

          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-800">
            <p className="font-bold text-slate-950">{copy.nextTitle}</p>
            <p className="mt-2">{statusHelperText}</p>
          </div>

          {currentPayment.display_status === "overdue" ? (
            <div className="rounded-3xl bg-rose-50 px-4 py-4 text-base font-bold text-rose-950">
              {copy.overdue}
            </div>
          ) : null}
          {currentPayment.status === "pending" ? (
            <div className="rounded-3xl bg-amber-50 px-4 py-4 text-base font-bold text-amber-950">
              {copy.pending}
            </div>
          ) : null}
          {currentPayment.status === "paid" ? (
            <div className="rounded-3xl bg-emerald-50 px-4 py-4 text-base font-bold text-emerald-900">
              {copy.paid}
            </div>
          ) : null}
          {currentPayment.status === "rejected" ? (
            <div className="rounded-3xl bg-rose-50 px-4 py-4 text-base text-rose-950">
              <p className="font-bold">{copy.rejectedTitle}</p>
              <p className="mt-1">
                {currentPayment.reject_reason ?? copy.rejectedFallback}
              </p>
            </div>
          ) : null}

          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
            {copy.uploadTip}
          </div>

          <PaymentUploadForm userId={profile.id} houseNumber={profile.house_number} locale={locale} />
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">{copy.inbox}</p>
            <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
              {copy.updates}
            </h3>
          </div>
          <Link
            href="/notifications"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-base font-bold text-white transition hover:bg-slate-800"
          >
            <BellRing className="h-4 w-4" />
            {copy.allNotifications}
          </Link>
        </div>
        <ResidentNotificationList notifications={notifications.slice(0, 4)} compact locale={locale} />
      </section>
    </div>
  );
}
