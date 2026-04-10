import { BellRing, CircleCheckBig, Clock3, TriangleAlert } from "lucide-react";
import { LiveRefresh } from "@/components/live-refresh";
import { MonthFilter } from "@/components/month-filter";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAdminDashboardData } from "@/lib/data";
import { formatTimestamp } from "@/lib/utils";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const { currentMonth, currentMonthLabel, notifications, pendingPayments, residents } =
    await getAdminDashboardData(params.month);

  const paidCount = residents.filter((resident) => resident.currentPayment?.status === "paid").length;
  const pendingCount = residents.filter(
    (resident) => resident.currentPayment?.status === "pending",
  ).length;
  const unpaidCount = residents.length - paidCount - pendingCount;
  const needsAttentionResidents = residents.filter(
    (resident) =>
      !resident.currentPayment ||
      resident.currentPayment.status === "unpaid" ||
      resident.currentPayment.status === "rejected",
  );

  return (
    <div className="space-y-6">
      <LiveRefresh />
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-primary">Admin dashboard</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-slate-950">
            Overview for {currentMonthLabel}
          </h2>
        </div>
        <div className="w-full max-w-sm">
          <MonthFilter currentMonth={currentMonth} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="bg-emerald-50">
          <CircleCheckBig className="h-5 w-5 text-emerald-700" />
          <p className="mt-4 text-sm text-emerald-700">Paid</p>
          <p className="font-display text-3xl font-bold text-emerald-950">{paidCount}</p>
        </Card>
        <Card className="bg-amber-50">
          <Clock3 className="h-5 w-5 text-amber-700" />
          <p className="mt-4 text-sm text-amber-700">Pending</p>
          <p className="font-display text-3xl font-bold text-amber-950">{pendingCount}</p>
        </Card>
        <Card className="bg-rose-50">
          <TriangleAlert className="h-5 w-5 text-rose-700" />
          <p className="mt-4 text-sm text-rose-700">Needs attention</p>
          <p className="font-display text-3xl font-bold text-rose-950">{unpaidCount}</p>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-teal-50 p-3">
              <BellRing className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-primary">Notifications</p>
              <h3 className="mt-1 font-display text-2xl font-bold text-slate-950">
                Latest submissions
              </h3>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {notifications.length === 0 ? (
              <div className="rounded-3xl bg-slate-50 px-4 py-6 text-sm text-muted">
                No recent notifications yet.
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="rounded-3xl border border-line bg-slate-50 px-4 py-4"
                >
                  <p className="text-sm font-semibold text-slate-900">{notification.message}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted">
                    {formatTimestamp(notification.created_at)}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="grid gap-4">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-primary">Pending</p>
                <h3 className="mt-2 font-display text-2xl font-bold text-slate-950">
                  Uploaded payment proofs
                </h3>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                {pendingPayments.length} items
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {pendingPayments.length === 0 ? (
                <div className="rounded-3xl bg-slate-50 px-4 py-6 text-sm text-muted">
                  No uploaded payment proofs are waiting for review this month.
                </div>
              ) : (
                pendingPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="rounded-3xl border border-line bg-slate-50 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{payment.users.house_number}</p>
                        <p className="text-sm text-muted">{payment.users.name}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted">
                          Uploaded for {currentMonthLabel}
                        </p>
                      </div>
                      <StatusBadge status={payment.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-primary">Needs attention</p>
                <h3 className="mt-2 font-display text-2xl font-bold text-slate-950">
                  Residents not settled yet
                </h3>
              </div>
              <span className="rounded-full bg-rose-100 px-3 py-1 text-sm font-semibold text-rose-700">
                {needsAttentionResidents.length} houses
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {needsAttentionResidents.length === 0 ? (
                <div className="rounded-3xl bg-emerald-50 px-4 py-6 text-sm text-emerald-700">
                  All residents are settled for this month.
                </div>
              ) : (
                needsAttentionResidents.map((resident) => (
                  <div
                    key={resident.id}
                    className="rounded-3xl border border-line bg-slate-50 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{resident.house_number}</p>
                        <p className="text-sm text-muted">{resident.name}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted">
                          {resident.currentPayment?.status === "rejected"
                            ? "Proof rejected, waiting for new upload"
                            : "No payment recorded yet"}
                        </p>
                      </div>
                      <StatusBadge status={resident.currentPayment?.status ?? "unpaid"} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
