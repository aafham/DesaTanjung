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

export default async function PaymentsPage() {
  const { currentMonthLabel, currentPayment, dueDateLabel, notifications, profile, settings, warnings } =
    await getUserDashboardData();
  const usingPlaceholderQr = settings.payment_qr_url.includes("placehold.co");
  const statusHelperText = {
    paid: "Bayaran bulan ini sudah selesai. Simpan resit untuk rekod sendiri.",
    pending: "Resit anda sedang disemak. Muat naik semula hanya jika diminta oleh jawatankuasa.",
    unpaid: "Sila buat bayaran dan muat naik resit supaya jawatankuasa boleh semak.",
    rejected: "Sila muat naik resit yang lebih jelas atau slip pindahan yang betul.",
    overdue: "Bayaran bulan ini sudah melepasi tarikh akhir. Sila jelaskan secepat mungkin.",
  }[currentPayment.display_status];

  return (
    <div className="space-y-6">
      <LiveRefresh />
      <DataWarning warnings={warnings} />
      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Maklumat bayaran</p>
              <h2 className="mt-2 font-display text-4xl font-bold leading-tight text-slate-950">
                {currentMonthLabel}
              </h2>
            </div>
            <StatusBadge status={currentPayment.display_status} />
          </div>

          <div className="rounded-3xl border border-amber-100 bg-amber-50 px-4 py-4 text-base text-amber-950">
            <p className="font-bold">Panduan bayaran untuk {profile.house_number}</p>
            <p className="mt-1">
              Gunakan maklumat bank atau imbas QR, kemudian muat naik resit supaya jawatankuasa boleh semak.
            </p>
          </div>

          <div className="grid gap-4 rounded-4xl bg-slate-50 p-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-white p-5">
              <Landmark className="h-6 w-6 text-primary" />
              <p className="mt-4 text-base font-bold text-muted">Nama bank</p>
              <p className="text-xl font-bold text-slate-950">
                {settings.bank_name}
              </p>
              <p className="mt-5 text-base font-bold text-muted">Nama akaun</p>
              <p className="text-xl font-bold text-slate-950">
                {settings.bank_account_name}
              </p>
              <p className="mt-5 text-base font-bold text-muted">Nombor akaun</p>
              <p className="font-display text-4xl font-bold leading-tight text-slate-950">
                {settings.bank_account_number}
              </p>
              {settings.monthly_fee ? (
                <>
                  <p className="mt-5 text-base font-bold text-muted">Yuran bulanan</p>
                  <p className="text-2xl font-bold text-slate-950">
                    RM {settings.monthly_fee.toFixed(2)}
                  </p>
                </>
              ) : null}
              <p className="mt-5 text-base font-bold text-muted">Tarikh akhir</p>
              <p className="text-xl font-bold text-slate-950">{dueDateLabel}</p>
            </div>
            <div className="rounded-3xl bg-white p-5">
              <div className="flex items-center gap-2 text-base font-bold text-slate-950">
                <QrCode className="h-5 w-5 text-primary" />
                Imbas QR
              </div>
              <div className="mt-4 overflow-hidden rounded-3xl border border-line">
                {!usingPlaceholderQr ? (
                  <div className="relative">
                    <ReceiptPreviewModal
                      src={settings.payment_qr_url}
                      alt="Kod QR bayaran komuniti"
                    />
                    <Image
                      src={settings.payment_qr_url}
                      alt="Kod QR bayaran komuniti"
                      width={800}
                      height={800}
                      className="h-auto w-full object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <Image
                    src={settings.payment_qr_url}
                    alt="Kod QR bayaran komuniti"
                    width={800}
                    height={800}
                    className="h-auto w-full object-cover"
                    unoptimized
                  />
                )}
              </div>
              {usingPlaceholderQr ? (
                <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-3 text-sm font-bold text-amber-950">
                  QR rasmi belum disimpan oleh admin. Buat masa ini, sila guna maklumat bank yang tertera.
                </p>
              ) : (
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Tekan <span className="font-bold">Lihat besar</span> pada QR jika perlu paparan yang lebih jelas.
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
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Muat naik resit</p>
              <h3 className="mt-1 font-display text-3xl font-bold leading-tight text-slate-950">
                Hantar resit bayaran
              </h3>
            </div>
          </div>

          <div className="grid gap-3 rounded-3xl bg-slate-50 p-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white px-4 py-4">
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-muted">Status semasa</p>
              <div className="mt-3">
                <StatusBadge status={currentPayment.display_status} />
              </div>
            </div>
            <div className="rounded-2xl bg-white px-4 py-4">
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-muted">Yuran bulanan</p>
              <p className="mt-3 text-2xl font-bold text-slate-950">
                RM {settings.monthly_fee?.toFixed(2) ?? "Belum ditetapkan"}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-4">
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-muted">Tarikh akhir</p>
              <p className="mt-3 text-lg font-bold text-slate-950">{dueDateLabel}</p>
            </div>
          </div>

          <div className="grid gap-3 rounded-3xl bg-slate-50 p-4 text-base text-slate-800">
            <div className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">1</span>
              <p>Buat bayaran menggunakan nombor akaun bank atau kod QR.</p>
            </div>
            <div className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">2</span>
              <p>Muat naik gambar resit yang jelas di bawah.</p>
            </div>
            <div className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">3</span>
              <p>Tunggu semakan jawatankuasa. Status anda akan dikemas kini secara automatik.</p>
            </div>
          </div>

          <p className="text-base text-muted">
            <UploadCloud className="mr-2 inline h-5 w-5 text-primary" />
            Muat naik resit selepas membuat bayaran. Status akan bertukar kepada dalam semakan sehingga disahkan oleh jawatankuasa.
          </p>

          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-800">
            <p className="font-bold text-slate-950">Apa berlaku selepas ini</p>
            <p className="mt-2">{statusHelperText}</p>
          </div>

          {currentPayment.display_status === "overdue" ? (
            <div className="rounded-3xl bg-rose-50 px-4 py-4 text-base font-bold text-rose-950">
              Bayaran bulan ini sudah melepasi tarikh akhir. Sila muat naik resit bayaran secepat mungkin.
            </div>
          ) : null}
          {currentPayment.status === "pending" ? (
            <div className="rounded-3xl bg-amber-50 px-4 py-4 text-base font-bold text-amber-950">
              Resit anda sudah dihantar dan sedang menunggu semakan jawatankuasa.
            </div>
          ) : null}
          {currentPayment.status === "paid" ? (
            <div className="rounded-3xl bg-emerald-50 px-4 py-4 text-base font-bold text-emerald-900">
              Bayaran anda sudah disahkan. Tiada tindakan lanjut diperlukan untuk bulan ini.
            </div>
          ) : null}
          {currentPayment.status === "rejected" ? (
            <div className="rounded-3xl bg-rose-50 px-4 py-4 text-base text-rose-950">
              <p className="font-bold">Resit anda ditolak.</p>
              <p className="mt-1">
                {currentPayment.reject_reason ?? "Sila muat naik resit yang lebih jelas atau betul."}
              </p>
            </div>
          ) : null}

          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
            Tip muat naik: pastikan jumlah bayaran, tarikh, dan rujukan transaksi jelas kelihatan sebelum hantar resit.
          </div>

          <PaymentUploadForm userId={profile.id} houseNumber={profile.house_number} />
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Inbox penduduk</p>
            <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
              Kemas kini bayaran terkini
            </h3>
          </div>
          <Link
            href="/notifications"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-base font-bold text-white transition hover:bg-slate-800"
          >
            <BellRing className="h-4 w-4" />
            Lihat semua notifikasi
          </Link>
        </div>
        <ResidentNotificationList notifications={notifications.slice(0, 4)} compact />
      </section>
    </div>
  );
}
