import Image from "next/image";
import { CreditCard, Landmark, QrCode } from "lucide-react";
import { LiveRefresh } from "@/components/live-refresh";
import { PaymentUploadForm } from "@/components/payment-upload-form";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getUserDashboardData } from "@/lib/data";

export default async function PaymentsPage() {
  const { currentMonthLabel, currentPayment, profile } = await getUserDashboardData();

  return (
    <div className="space-y-6">
      <LiveRefresh />
      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-primary">Payment details</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-slate-950">
                {currentMonthLabel}
              </h2>
            </div>
            <StatusBadge status={currentPayment.status} />
          </div>

          <div className="grid gap-4 rounded-4xl bg-slate-50 p-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-white p-4">
              <Landmark className="h-5 w-5 text-primary" />
              <p className="mt-4 text-sm text-muted">Bank name</p>
              <p className="font-semibold text-slate-900">
                {process.env.NEXT_PUBLIC_BANK_NAME}
              </p>
              <p className="mt-4 text-sm text-muted">Account holder</p>
              <p className="font-semibold text-slate-900">
                {process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME}
              </p>
              <p className="mt-4 text-sm text-muted">Account number</p>
              <p className="font-display text-2xl font-bold text-slate-950">
                {process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER}
              </p>
            </div>
            <div className="rounded-3xl bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <QrCode className="h-4 w-4 text-primary" />
                Scan QR
              </div>
              <div className="mt-4 overflow-hidden rounded-3xl border border-line">
                <Image
                  src={process.env.NEXT_PUBLIC_PAYMENT_QR_URL!}
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
              <p className="text-sm uppercase tracking-[0.18em] text-primary">Upload proof</p>
              <h3 className="mt-1 font-display text-2xl font-bold text-slate-950">
                Submit your receipt
              </h3>
            </div>
          </div>

          <p className="text-sm text-muted">
            Upload the receipt right after transferring the monthly fee. Status will change to pending until the committee reviews it.
          </p>

          <PaymentUploadForm userId={profile.id} houseNumber={profile.house_number} />
        </Card>
      </section>
    </div>
  );
}
