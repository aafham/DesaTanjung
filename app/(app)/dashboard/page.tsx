import Link from "next/link";
import { ArrowRight, Clock3, Home, Info, Wallet } from "lucide-react";
import { LiveRefresh } from "@/components/live-refresh";
import { PaymentHistoryTable } from "@/components/payment-history-table";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getUserDashboardData } from "@/lib/data";

export default async function DashboardPage() {
  const { auditLogs, currentMonthLabel, currentPayment, history, profile } =
    await getUserDashboardData();
  const statusMessage = {
    paid: "Payment approved. Thank you for keeping your account up to date.",
    pending: "Receipt uploaded. Please wait for committee approval.",
    unpaid: "No payment recorded yet. Tap Pay Now to upload your receipt.",
    rejected: "Receipt was rejected. Please upload a clearer or correct proof.",
  }[currentPayment.status];

  return (
    <div className="space-y-6">
      <LiveRefresh />
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="bg-slate-950 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-teal-200">Current month</p>
          <h2 className="mt-3 font-display text-5xl font-bold leading-tight">{currentMonthLabel}</h2>
          <p className="mt-4 max-w-lg text-lg text-slate-200">
            Track this month&apos;s payment status and upload your proof as soon as you complete the transfer.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <StatusBadge status={currentPayment.status} className="bg-white/10 text-white" />
            <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-100">
              House {profile.house_number}
            </span>
          </div>
          <div className="mt-5 flex items-start gap-3 rounded-3xl bg-white/10 p-4 text-base text-slate-100">
            <Info className="mt-1 h-5 w-5 shrink-0 text-teal-200" />
            <p>{statusMessage}</p>
          </div>
          {currentPayment.reject_reason ? (
            <div className="mt-4 rounded-3xl bg-rose-100 p-4 text-base font-bold text-rose-950">
              Reject reason: {currentPayment.reject_reason}
            </div>
          ) : null}
          {currentPayment.notes ? (
            <div className="mt-4 rounded-3xl bg-white/10 p-4 text-base text-slate-100">
              Committee note: {currentPayment.notes}
            </div>
          ) : null}
          <Link
            href="/payments"
            className="mt-8 inline-flex min-h-14 items-center gap-2 rounded-full bg-teal-300 px-6 py-3 text-lg font-bold text-slate-950 transition hover:bg-teal-200"
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
                <p className="text-base font-bold text-muted">Owner name</p>
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
                <p className="text-base font-bold text-muted">Address</p>
                <p className="text-xl font-bold text-slate-950">{profile.address}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-50 p-3">
                <Clock3 className="h-5 w-5 text-amber-800" />
              </div>
              <div>
                <p className="text-base font-bold text-muted">Last status</p>
                <p className="text-xl font-bold capitalize text-slate-950">{currentPayment.status}</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Timeline</p>
          <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
            Latest payment activity
          </h3>
        </div>
        <Card>
          <div className="space-y-3">
            {auditLogs.length === 0 ? (
              <p className="text-base text-muted">No activity yet.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="rounded-3xl bg-slate-50 px-4 py-3">
                  <p className="text-base font-bold text-slate-950">{log.message}</p>
                  <p className="mt-1 text-sm text-muted">{new Date(log.created_at).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">History</p>
          <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
            Payment history
          </h3>
        </div>
        <PaymentHistoryTable history={history} />
      </section>
    </div>
  );
}
