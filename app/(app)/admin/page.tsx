import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CircleCheckBig,
  Clock3,
  ShieldCheck,
  TriangleAlert,
  Users,
} from "lucide-react";
import { markAllNotificationsReadAction } from "@/lib/actions";
import { AdminReminderTools } from "@/components/admin-reminder-tools";
import { LiveRefresh } from "@/components/live-refresh";
import { MonthFilter } from "@/components/month-filter";
import { PageToast } from "@/components/page-toast";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAdminDashboardData } from "@/lib/data";
import { formatTimestamp } from "@/lib/utils";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; message?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { currentMonth, currentMonthLabel, notifications, pendingPayments, residents } =
    await getAdminDashboardData(params.month);

  const paidCount = residents.filter((resident) => resident.currentPayment?.status === "paid").length;
  const pendingCount = residents.filter(
    (resident) => resident.currentPayment?.status === "pending",
  ).length;
  const needsAttentionResidents = residents.filter(
    (resident) =>
      !resident.currentPayment ||
      resident.currentPayment.status === "unpaid" ||
      resident.currentPayment.status === "rejected",
  );
  const collectionRate =
    residents.length > 0 ? Math.round((paidCount / residents.length) * 100) : 0;
  const unreadNotificationCount = notifications.filter(
    (notification) => !notification.is_read,
  ).length;

  return (
    <div className="space-y-6">
      <PageToast message={params.message} error={params.error} />
      <LiveRefresh />
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Admin dashboard</p>
          <h2 className="mt-2 font-display text-4xl font-bold leading-tight text-slate-950">
            Overview for {currentMonthLabel}
          </h2>
          <p className="mt-3 max-w-2xl text-base text-muted">
            Review new uploads, spot unpaid houses, and jump into the common admin tasks from one screen.
          </p>
        </div>
        <div className="w-full max-w-sm">
          <MonthFilter currentMonth={currentMonth} />
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <Link
          href={`/admin/approvals?month=${currentMonth}`}
          className="rounded-3xl bg-amber-50 px-5 py-4 text-amber-950 ring-1 ring-amber-100"
        >
          <p className="text-sm font-bold uppercase tracking-[0.12em]">Today action</p>
          <p className="mt-2 text-2xl font-bold">{pendingPayments.length} proofs to review</p>
        </Link>
        <Link
          href={`/admin/residents?month=${currentMonth}`}
          className="rounded-3xl bg-rose-50 px-5 py-4 text-rose-950 ring-1 ring-rose-100"
        >
          <p className="text-sm font-bold uppercase tracking-[0.12em]">Follow-up</p>
          <p className="mt-2 text-2xl font-bold">
            {needsAttentionResidents.length} residents not settled
          </p>
        </Link>
        <Link
          href="/admin/settings"
          className="rounded-3xl bg-teal-50 px-5 py-4 text-teal-950 ring-1 ring-teal-100"
        >
          <p className="text-sm font-bold uppercase tracking-[0.12em]">Setup</p>
          <p className="mt-2 text-2xl font-bold">Update bank and QR</p>
        </Link>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card
          className="border-slate-900 text-white"
          style={{
            background:
              "linear-gradient(135deg, #07111f 0%, #0b2f2d 55%, #064e48 100%)",
          }}
        >
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-teal-100">
            Monthly collection
          </p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-display text-6xl font-bold leading-none text-white">
                {collectionRate}%
              </p>
              <p className="mt-3 text-base font-bold text-slate-100">
                {paidCount} of {residents.length} residents marked paid for {currentMonthLabel}.
              </p>
              <p className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-950">
                {needsAttentionResidents.length} houses need follow-up
              </p>
            </div>
            <Link
              href={`/admin/residents?month=${currentMonth}`}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-teal-200 px-5 py-3 text-base font-bold text-slate-950 shadow-sm transition hover:bg-white"
            >
              View residents
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 h-4 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-teal-200"
              style={{ width: `${collectionRate}%` }}
            />
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <Link
            href={`/admin/approvals?month=${currentMonth}`}
            className="rounded-4xl border border-line bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <ShieldCheck className="h-5 w-5 text-primary" />
            <p className="mt-4 text-lg font-bold text-slate-950">Review approvals</p>
            <p className="mt-2 text-base text-muted">{pendingPayments.length} proof uploads waiting.</p>
          </Link>
          <Link
            href="/admin/users"
            className="rounded-4xl border border-line bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <Users className="h-5 w-5 text-primary" />
            <p className="mt-4 text-lg font-bold text-slate-950">Manage residents</p>
            <p className="mt-2 text-base text-muted">Add, edit, reset password, or delete users.</p>
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="bg-emerald-50">
          <CircleCheckBig className="h-5 w-5 text-emerald-700" />
          <p className="mt-4 text-base font-bold text-emerald-800">Paid</p>
          <p className="font-display text-4xl font-bold text-emerald-950">{paidCount}</p>
        </Card>
        <Card className="bg-amber-50">
          <Clock3 className="h-5 w-5 text-amber-700" />
          <p className="mt-4 text-base font-bold text-amber-800">Pending</p>
          <p className="font-display text-4xl font-bold text-amber-950">{pendingCount}</p>
        </Card>
        <Card className="bg-rose-50">
          <TriangleAlert className="h-5 w-5 text-rose-700" />
          <p className="mt-4 text-base font-bold text-rose-800">Needs attention</p>
          <p className="font-display text-4xl font-bold text-rose-950">
            {needsAttentionResidents.length}
          </p>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="grid gap-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-teal-50 p-3">
                <BellRing className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Notifications</p>
                  {unreadNotificationCount > 0 ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                      {unreadNotificationCount} unread
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-1 font-display text-3xl font-bold leading-tight text-slate-950">
                  Latest submissions
                </h3>
              </div>
            </div>
            {unreadNotificationCount > 0 ? (
              <form action={markAllNotificationsReadAction} className="mt-4">
                <button
                  type="submit"
                  className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white"
                >
                  Mark all as read
                </button>
              </form>
            ) : null}

            <div className="mt-5 max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="rounded-3xl bg-slate-50 px-4 py-6 text-base text-muted">
                  No recent notifications yet.
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="rounded-3xl border border-line bg-slate-50 px-4 py-4"
                  >
                    <p className="text-base font-bold text-slate-950">{notification.message}</p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">
                      {formatTimestamp(notification.created_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <AdminReminderTools
            residents={needsAttentionResidents}
            currentMonthLabel={currentMonthLabel}
          />
        </div>

        <div className="grid gap-4">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Pending</p>
                <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
                  Uploaded payment proofs
                </h3>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                {pendingPayments.length} items
              </span>
            </div>

            <div className="mt-5 max-h-[360px] space-y-3 overflow-y-auto pr-1">
              {pendingPayments.length === 0 ? (
                <div className="rounded-3xl bg-slate-50 px-4 py-6 text-base text-muted">
                  No uploaded payment proofs are waiting for review this month.
                </div>
              ) : (
                pendingPayments.map((payment) => (
                  <Link
                    key={payment.id}
                    href={`/admin/approvals?month=${currentMonth}`}
                    className="rounded-3xl border border-line bg-slate-50 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-lg font-bold text-slate-950">{payment.users.house_number}</p>
                        <p className="text-base text-muted">{payment.users.name}</p>
                        <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">
                          Uploaded for {currentMonthLabel}
                        </p>
                      </div>
                      <StatusBadge status={payment.status} />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Needs attention</p>
                <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
                  Residents not settled yet
                </h3>
              </div>
              <span className="rounded-full bg-rose-100 px-3 py-1 text-sm font-semibold text-rose-700">
                {needsAttentionResidents.length} houses
              </span>
            </div>

            <div className="mt-5 max-h-[360px] space-y-3 overflow-y-auto pr-1">
              {needsAttentionResidents.length === 0 ? (
                <div className="rounded-3xl bg-emerald-50 px-4 py-6 text-base font-bold text-emerald-800">
                  All residents are settled for this month.
                </div>
              ) : (
                needsAttentionResidents.map((resident) => (
                  <Link
                    key={resident.id}
                    href={`/admin/residents?month=${currentMonth}`}
                    className="rounded-3xl border border-line bg-slate-50 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-lg font-bold text-slate-950">{resident.house_number}</p>
                        <p className="text-base text-muted">{resident.name}</p>
                        <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">
                          {resident.currentPayment?.status === "rejected"
                            ? "Proof rejected, waiting for new upload"
                            : "No payment recorded yet"}
                        </p>
                      </div>
                      <StatusBadge status={resident.currentPayment?.status ?? "unpaid"} />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
