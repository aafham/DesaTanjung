import Link from "next/link";
import { ArrowRight, Clock3, Wallet } from "lucide-react";
import { LiveRefresh } from "@/components/live-refresh";
import { PaymentHistoryTable } from "@/components/payment-history-table";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getUserDashboardData } from "@/lib/data";

export default async function DashboardPage() {
  const { currentMonthLabel, currentPayment, history, profile } = await getUserDashboardData();

  return (
    <div className="space-y-6">
      <LiveRefresh />
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="bg-slate-950 text-white">
          <p className="text-sm uppercase tracking-[0.22em] text-teal-300">Current month</p>
          <h2 className="mt-3 font-display text-3xl font-bold">{currentMonthLabel}</h2>
          <p className="mt-3 max-w-lg text-sm text-slate-300">
            Track this month&apos;s payment status and upload your proof as soon as you complete the transfer.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <StatusBadge status={currentPayment.status} className="bg-white/10 text-white" />
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
              House {profile.house_number}
            </span>
          </div>
          <Link
            href="/payments"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-teal-400 px-5 py-3 text-sm font-semibold text-slate-950"
          >
            PAY NOW
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>

        <div className="grid gap-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-teal-50 p-3">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted">Owner name</p>
                <p className="font-semibold text-slate-900">{profile.name}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-50 p-3">
                <Clock3 className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <p className="text-sm text-muted">Last status</p>
                <p className="font-semibold text-slate-900 capitalize">{currentPayment.status}</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-primary">History</p>
          <h3 className="mt-2 font-display text-2xl font-bold text-slate-950">
            Payment history
          </h3>
        </div>
        <PaymentHistoryTable history={history} />
      </section>
    </div>
  );
}
