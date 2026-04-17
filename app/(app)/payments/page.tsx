import Image from "next/image";
import { CreditCard, Landmark, QrCode, UploadCloud } from "lucide-react";
import { LiveRefresh } from "@/components/live-refresh";
import { PaymentUploadForm } from "@/components/payment-upload-form";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAppSettings, getUserDashboardData } from "@/lib/data";

export default async function PaymentsPage() {
  const [{ currentMonthLabel, currentPayment, dueDateLabel, profile }, settings] = await Promise.all([
    getUserDashboardData(),
    getAppSettings(),
  ]);

  return (
    <div className="space-y-6">
      <LiveRefresh />
      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Payment details</p>
              <h2 className="mt-2 font-display text-4xl font-bold leading-tight text-slate-950">
                {currentMonthLabel}
              </h2>
            </div>
            <StatusBadge status={currentPayment.status} />
          </div>

          <div className="grid gap-4 rounded-4xl bg-slate-50 p-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-white p-5">
              <Landmark className="h-6 w-6 text-primary" />
              <p className="mt-4 text-base font-bold text-muted">Bank name</p>
              <p className="text-xl font-bold text-slate-950">
                {settings.bank_name}
              </p>
              <p className="mt-5 text-base font-bold text-muted">Account holder</p>
              <p className="text-xl font-bold text-slate-950">
                {settings.bank_account_name}
              </p>
              <p className="mt-5 text-base font-bold text-muted">Account number</p>
              <p className="font-display text-4xl font-bold leading-tight text-slate-950">
                {settings.bank_account_number}
              </p>
              {settings.monthly_fee ? (
                <>
                  <p className="mt-5 text-base font-bold text-muted">Monthly fee</p>
                  <p className="text-2xl font-bold text-slate-950">
                    RM {settings.monthly_fee.toFixed(2)}
                  </p>
                </>
              ) : null}
              <p className="mt-5 text-base font-bold text-muted">Due date</p>
              <p className="text-xl font-bold text-slate-950">{dueDateLabel}</p>
            </div>
            <div className="rounded-3xl bg-white p-5">
              <div className="flex items-center gap-2 text-base font-bold text-slate-950">
                <QrCode className="h-5 w-5 text-primary" />
                Scan QR
              </div>
              <div className="mt-4 overflow-hidden rounded-3xl border border-line">
                <Image
                  src={settings.payment_qr_url}
                  alt="Community payment QR code"
                  width={800}
                  height={800}
                  className="h-auto w-full object-cover"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-teal-50 p-3">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Upload proof</p>
              <h3 className="mt-1 font-display text-3xl font-bold leading-tight text-slate-950">
                Submit your receipt
              </h3>
            </div>
          </div>

          <div className="grid gap-3 rounded-3xl bg-slate-50 p-4 text-base text-slate-800">
            <div className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">1</span>
              <p>Transfer using the bank account or QR code.</p>
            </div>
            <div className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">2</span>
              <p>Upload a clear receipt image below.</p>
            </div>
            <div className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">3</span>
              <p>Wait for committee approval. Your status will update automatically.</p>
            </div>
          </div>

          <p className="text-base text-muted">
            <UploadCloud className="mr-2 inline h-5 w-5 text-primary" />
            Upload the receipt right after transferring the monthly fee. Status will change to pending until the committee reviews it.
          </p>

          {currentPayment.display_status === "overdue" ? (
            <div className="rounded-3xl bg-rose-50 px-4 py-4 text-base font-bold text-rose-950">
              This month is already past the due date. Please upload your payment proof as soon as possible.
            </div>
          ) : null}

          <PaymentUploadForm userId={profile.id} houseNumber={profile.house_number} />
        </Card>
      </section>
    </div>
  );
}
