import Link from "next/link";
import { CircleAlert, CircleCheckBig, TriangleAlert } from "lucide-react";
import { AdminPageHeader } from "@/components/admin-page-header";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { DataWarning } from "@/components/data-warning";
import { PageToast } from "@/components/page-toast";
import { Card } from "@/components/ui/card";
import { pruneActivityLogsAction, pruneServerActionErrorsAction } from "@/lib/actions";
import { getAdminHealthData } from "@/lib/data";
import { formatMonthLabel, formatTimestamp } from "@/lib/utils";

const statusPresentation = {
  healthy: {
    icon: CircleCheckBig,
    card: "border-emerald-200 bg-emerald-50",
    iconColor: "text-emerald-700",
    label: "Healthy",
    labelClass: "bg-emerald-100 text-emerald-900",
  },
  warning: {
    icon: TriangleAlert,
    card: "border-amber-200 bg-amber-50",
    iconColor: "text-amber-700",
    label: "Warning",
    labelClass: "bg-amber-100 text-amber-900",
  },
  error: {
    icon: CircleAlert,
    card: "border-rose-200 bg-rose-50",
    iconColor: "text-rose-700",
    label: "Error",
    labelClass: "bg-rose-100 text-rose-900",
  },
} as const;

function getSuggestedFixPath({
  label,
  detail,
  action,
}: {
  label: string;
  detail: string;
  action?: string | null;
}) {
  const haystack = `${label} ${detail} ${action ?? ""}`.toLowerCase();

  if (
    haystack.includes("phone") ||
    haystack.includes("user") ||
    haystack.includes("login") ||
    haystack.includes("password")
  ) {
    return { href: "/admin/users", label: "Open Users" };
  }

  if (
    haystack.includes("qr") ||
    haystack.includes("bank") ||
    haystack.includes("due date") ||
    haystack.includes("settings") ||
    haystack.includes("community")
  ) {
    return { href: "/admin/settings", label: "Open Settings" };
  }

  if (
    haystack.includes("payment") ||
    haystack.includes("resident") ||
    haystack.includes("duplicate") ||
    haystack.includes("receipt")
  ) {
    return { href: "/admin/residents", label: "Open Residents" };
  }

  if (haystack.includes("activity") || haystack.includes("log")) {
    return { href: "/admin/activity", label: "Open Activity" };
  }

  return { href: "/admin", label: "Open Dashboard" };
}

export default async function AdminHealthPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const params = await searchParams;
  const {
    checks,
    duplicateGroups,
    missingPhoneResidents,
    recentServerActionErrors,
    serverActionErrorCount,
    warnings,
  } = await getAdminHealthData();
  const healthyCount = checks.filter((check) => check.status === "healthy").length;
  const warningCount = checks.filter((check) => check.status === "warning").length;
  const errorCount = checks.filter((check) => check.status === "error").length;
  const launchBlockers = checks.filter((check) =>
    ["core-data-readiness", "env-public-url", "env-service-role", "payment-qr"].includes(check.id),
  );
  const launchBlockerCount = launchBlockers.filter((check) => check.status !== "healthy").length;
  const readinessScore = Math.max(
    0,
    Math.round((healthyCount / Math.max(1, checks.length)) * 100),
  );
  const missingPhoneCsvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(
    [
      ["House", "Owner", "Address"],
      ...missingPhoneResidents.map((resident) => [
        resident.house_number,
        resident.name,
        resident.address,
      ]),
    ]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n"),
  )}`;
  const duplicateCsvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(
    [
      ["House", "Owner", "Month", "Duplicate rows"],
      ...duplicateGroups.map((group) => [
        group.house_number,
        group.name,
        formatMonthLabel(group.month),
        String(group.count),
      ]),
    ]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n"),
  )}`;
  const duplicateCleanupSql = `with ranked as (
  select
    id,
    row_number() over (
      partition by user_id, month
      order by updated_at desc, created_at desc, id desc
    ) as rn
  from public.payments
)
delete from public.payments
where id in (
  select id
  from ranked
  where rn > 1
);`;
  const launchReady = launchBlockerCount === 0;
  const phoneReady = missingPhoneResidents.length === 0;
  const dataReady = duplicateGroups.length === 0 && errorCount === 0;
  const paymentReady = checks
    .filter((check) => ["monthly-fee", "payment-qr", "payment-proofs-bucket"].includes(check.id))
    .every((check) => check.status === "healthy");
  const priorityActions = [
    ...checks.filter((check) => check.status === "error"),
    ...checks.filter((check) => check.status === "warning"),
  ].slice(0, 5);
  const healthyChecks = checks.filter((check) => check.status === "healthy");

  return (
    <div className="space-y-6">
      <PageToast message={params.message} error={params.error} />
      <DataWarning warnings={warnings} />

      <AdminPageHeader
        eyebrow="System health"
        title="Is the portal ready for residents?"
        description="This page is a simple readiness board for committee admins. Start here before collection opens, after updates, or when something looks wrong."
      />

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card
          className="overflow-hidden text-white"
          style={{
            background:
              "linear-gradient(135deg, #07111f 0%, #10263a 45%, #134e4a 100%)",
          }}
        >
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-teal-100">Portal status</p>
          <h3 className="mt-3 font-display text-4xl font-bold leading-tight text-white">
            {errorCount > 0
              ? "Fix critical issues before residents rely on it"
              : warningCount > 0
                ? "Portal can run, but follow-up is needed"
                : "Portal looks ready for day-to-day use"}
          </h3>
          <p className="mt-4 text-base leading-8 text-slate-100">
            Score {readinessScore}%. {healthyCount} checks healthy, {warningCount} warning,
            and {errorCount} error. Use the action list beside this card first.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl bg-white/10 px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-teal-100">Healthy</p>
              <p className="mt-2 text-4xl font-bold text-white">{healthyCount}</p>
            </div>
            <div className="rounded-3xl bg-white/10 px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-amber-100">Warning</p>
              <p className="mt-2 text-4xl font-bold text-white">{warningCount}</p>
            </div>
            <div className="rounded-3xl bg-white/10 px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-rose-100">Error</p>
              <p className="mt-2 text-4xl font-bold text-white">{errorCount}</p>
            </div>
          </div>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-amber-900">Do this next</p>
          <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
            {priorityActions.length === 0 ? "No urgent action right now" : `${priorityActions.length} item${priorityActions.length === 1 ? "" : "s"} need admin attention`}
          </h3>
          <div className="mt-5 space-y-3">
            {priorityActions.length === 0 ? (
              <div className="rounded-3xl bg-white/80 px-4 py-4 text-base font-semibold text-emerald-900">
                Everything important is ready. Come back here after monthly setup changes or before residents start paying.
              </div>
            ) : (
              priorityActions.map((check, index) => {
                const fixPath = getSuggestedFixPath(check);

                return (
                  <div key={check.id} className="rounded-3xl bg-white/85 px-4 py-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                          Step {index + 1}
                        </p>
                        <p className="mt-1 text-lg font-bold text-slate-950">{check.label}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${statusPresentation[check.status].labelClass}`}>
                        {statusPresentation[check.status].label}
                      </span>
                    </div>
                    <p className="mt-2 text-base leading-7 text-slate-700">{check.action ?? check.detail}</p>
                    <Link
                      href={fixPath.href}
                      className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white"
                    >
                      {fixPath.label}
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className={launchReady ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-700">Live access</p>
          <h3 className="mt-3 text-2xl font-bold text-slate-950">
            {launchReady ? "No blocker" : "Needs fix"}
          </h3>
          <p className="mt-2 text-base leading-7 text-slate-700">
            {launchReady ? "Core setup is not blocking residents from using the portal." : "Fix environment or core setup before going live."}
          </p>
        </Card>
        <Card className={paymentReady ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-700">Payment setup</p>
          <h3 className="mt-3 text-2xl font-bold text-slate-950">
            {paymentReady ? "Ready" : "Check Settings"}
          </h3>
          <p className="mt-2 text-base leading-7 text-slate-700">
            QR image, monthly fee, and receipt storage are checked here.
          </p>
        </Card>
        <Card className={phoneReady ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-700">Follow-up</p>
          <h3 className="mt-3 text-2xl font-bold text-slate-950">
            {missingPhoneResidents.length} missing phone
          </h3>
          <p className="mt-2 text-base leading-7 text-slate-700">
            Phone numbers help Call and WhatsApp actions work smoothly.
          </p>
        </Card>
        <Card className={dataReady ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-700">Data safety</p>
          <h3 className="mt-3 text-2xl font-bold text-slate-950">
            {dataReady ? "Looks clean" : "Review needed"}
          </h3>
          <p className="mt-2 text-base leading-7 text-slate-700">
            Duplicate payment rows and failed actions should stay at zero.
          </p>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Missing phone helper</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-950">
            Residents without phone numbers
          </h3>
          <p className="mt-2 text-base leading-7 text-slate-600">
            This is the most useful admin cleanup list. Complete phone numbers so reminder, call, and WhatsApp tools work for every house.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-rose-100 px-3 py-1 text-sm font-bold text-rose-900">
              {missingPhoneResidents.length} missing phone
            </span>
            <Link
              href="/admin/users"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-slate-950"
            >
              Open Users
            </Link>
            {missingPhoneResidents.length > 0 ? (
              <a
                href={missingPhoneCsvHref}
                download="desa-tanjung-missing-phone.csv"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white"
              >
                Export CSV
              </a>
            ) : null}
          </div>
          <div className="mt-5 space-y-3">
            {missingPhoneResidents.length === 0 ? (
              <div className="rounded-3xl bg-emerald-50 px-4 py-4 text-base font-semibold text-emerald-900">
                All resident accounts already have phone numbers saved.
              </div>
            ) : (
              missingPhoneResidents.slice(0, 6).map((resident) => (
                <div key={resident.id} className="rounded-3xl bg-slate-50 px-4 py-4">
                  <p className="text-base font-bold text-slate-950">
                    {resident.house_number} - {resident.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{resident.address}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="border-slate-200 bg-slate-50/70">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Duplicate payment helper</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-950">
            Resident-month duplicate scan
          </h3>
          <p className="mt-2 text-base text-slate-600">
            Use this when live warnings say a resident has more than one payment row for the same month.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-rose-100 px-3 py-1 text-sm font-bold text-rose-900">
              {duplicateGroups.length} duplicate group{duplicateGroups.length === 1 ? "" : "s"}
            </span>
            <Link
              href="/admin/residents"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-slate-950"
            >
              Open Residents
            </Link>
            {duplicateGroups.length > 0 ? (
              <a
                href={duplicateCsvHref}
                download="desa-tanjung-duplicate-payments.csv"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white"
              >
                Export duplicate report
              </a>
            ) : null}
          </div>
          <div className="mt-5 space-y-3">
            {duplicateGroups.length === 0 ? (
              <div className="rounded-3xl bg-emerald-50 px-4 py-4 text-base font-semibold text-emerald-900">
                No duplicate resident-month payment rows were found.
              </div>
            ) : (
              duplicateGroups.slice(0, 6).map((group) => (
                <div key={`${group.user_id}-${group.month}`} className="rounded-3xl bg-slate-50 px-4 py-4">
                  <p className="text-base font-bold text-slate-950">
                    {group.house_number} - {group.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatMonthLabel(group.month)} - {group.count} rows found
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      <details className="rounded-4xl border border-line bg-white p-5 shadow-soft">
        <summary className="cursor-pointer text-sm font-bold uppercase tracking-[0.14em] text-primary">
          Technical checks ({checks.length})
        </summary>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Open this section only when you are troubleshooting. Healthy items are kept here so the main page stays simple.
        </p>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {[...priorityActions, ...healthyChecks].map((check) => {
            const presentation = statusPresentation[check.status];
            const Icon = presentation.icon;

            return (
              <div key={check.id} className={`rounded-3xl border px-4 py-4 ${presentation.card}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-white/80 p-3">
                      <Icon className={`h-5 w-5 ${presentation.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-950">{check.label}</p>
                      <p className="mt-2 text-sm leading-7 text-slate-700">{check.detail}</p>
                      {check.action ? (
                        <p className="mt-3 text-sm font-semibold text-slate-800">
                          Next step: {check.action}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${presentation.labelClass}`}>
                    {presentation.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </details>

      <Card className={serverActionErrorCount > 0 ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Production error monitor</p>
        <h3 className="mt-2 text-2xl font-bold text-slate-950">
          Critical server action errors
        </h3>
        <p className="mt-2 text-base leading-7 text-slate-700">
          This catches failed approval, reject, upload, cash payment, settings, user management, announcement, and maintenance actions so admins have a place to check production problems.
        </p>
        <div className="mt-5 rounded-3xl bg-white/80 px-4 py-4">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-muted">Last 7 days</p>
          <p className="mt-2 text-4xl font-bold text-slate-950">{serverActionErrorCount}</p>
        </div>
        <div className="mt-5 space-y-3">
          {recentServerActionErrors.length === 0 ? (
            <div className="rounded-3xl bg-white/80 px-4 py-4 text-base font-semibold text-emerald-900">
              No critical server action errors have been logged recently.
            </div>
          ) : (
            recentServerActionErrors.map((errorLog) => (
              <div key={errorLog.id} className="rounded-3xl bg-white px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-bold text-slate-950">{errorLog.action}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-600">{errorLog.route}</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-amber-900">
                    {formatTimestamp(errorLog.created_at)}
                  </span>
                </div>
                <p className="mt-3 text-base text-slate-800">{errorLog.message}</p>
                {errorLog.error_message ? (
                  <p className="mt-2 rounded-2xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-900">
                    {errorLog.error_message}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </Card>

      <Card>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Monthly operation rhythm</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-3xl bg-slate-50 px-4 py-4">
              <p className="text-base font-bold text-slate-950">1. Before due date</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Confirm QR, due day, monthly fee, and missing phone list.
              </p>
            </div>
            <div className="rounded-3xl bg-slate-50 px-4 py-4">
              <p className="text-base font-bold text-slate-950">2. After collection</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Review pending proofs, export reports, and follow up unpaid houses.
              </p>
            </div>
            <div className="rounded-3xl bg-slate-50 px-4 py-4">
              <p className="text-base font-bold text-slate-950">3. After report saved</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Keep exports/backups, then run activity log maintenance if needed.
              </p>
            </div>
          </div>
        </Card>

      <details className="rounded-4xl border border-line bg-white p-5 shadow-soft">
        <summary className="cursor-pointer text-sm font-bold uppercase tracking-[0.14em] text-primary">
          Advanced maintenance and security
        </summary>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <div className="rounded-3xl border border-teal-200 bg-teal-50 px-5 py-5">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Activity maintenance</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-950">Keep global activity logs light</h3>
            <p className="mt-2 text-base leading-7 text-slate-700">
              Removes global activity logs older than 90 days while keeping payment records and payment audit history.
            </p>
            <form action={pruneActivityLogsAction} className="mt-5">
              <ConfirmSubmitButton
                confirmTitle="Prune old activity logs?"
                confirmMessage="This removes only global activity logs older than 90 days. Payment records, receipts, resident history, and payment audit logs are not removed."
                confirmLabel="Prune old logs"
                className="bg-slate-950 text-white"
              >
                Run 90-day prune
              </ConfirmSubmitButton>
            </form>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-5">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-amber-900">Error monitor maintenance</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-950">Keep production error logs focused</h3>
            <p className="mt-2 text-base leading-7 text-slate-700">
              Removes server action error monitor rows older than 30 days. Resident data and payments are not removed.
            </p>
            <form action={pruneServerActionErrorsAction} className="mt-5">
              <ConfirmSubmitButton
                confirmTitle="Prune old server action errors?"
                confirmMessage="This removes only server action error monitor rows older than 30 days. Resident data, payment records, receipts, and activity logs are not removed."
                confirmLabel="Prune error logs"
                className="bg-slate-950 text-white"
              >
                Run 30-day error prune
              </ConfirmSubmitButton>
            </form>
          </div>
        </div>

        <div className="mt-4 rounded-3xl border border-sky-200 bg-sky-50 px-5 py-5">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-sky-900">Environment security</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-950">Vercel and Supabase secret handling</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-3xl bg-white/80 px-4 py-4">
              <p className="text-base font-bold text-slate-950">Public keys</p>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are expected to be visible in the browser.
              </p>
            </div>
            <div className="rounded-3xl bg-white/80 px-4 py-4">
              <p className="text-base font-bold text-slate-950">Server secret</p>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                `SUPABASE_SERVICE_ROLE_KEY` must stay server-only and should be marked Sensitive in Vercel.
              </p>
            </div>
            <div className="rounded-3xl bg-white/80 px-4 py-4">
              <p className="text-base font-bold text-slate-950">Rotate when exposed</p>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                If the service role key was pasted or revealed, rotate it in Supabase and redeploy Vercel.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-3xl border border-line bg-slate-50 px-5 py-5">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">SQL cleanup helper</p>
          <p className="mt-2 text-base text-slate-600">
            Use only if duplicate payment groups are found. Take a backup first.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-3xl bg-slate-950 p-4 text-sm leading-7 text-slate-100">
            <code>{duplicateCleanupSql}</code>
          </pre>
        </div>
      </details>

      <Card>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Quick admin checklist</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-slate-50 px-4 py-4">
            <p className="text-base font-bold text-slate-950">Before collection opens</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Confirm monthly fee, QR image, and due date are already set in Settings.
            </p>
            <Link
              href="/admin/settings"
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white"
            >
              Open Settings
            </Link>
          </div>
          <div className="rounded-3xl bg-slate-50 px-4 py-4">
            <p className="text-base font-bold text-slate-950">When data looks missing</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Recheck Supabase schema, storage buckets, and duplicate payment risks first.
            </p>
            <Link
              href="/admin/health"
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white"
            >
              Stay on Health
            </Link>
          </div>
          <div className="rounded-3xl bg-slate-50 px-4 py-4">
            <p className="text-base font-bold text-slate-950">For resident follow-up</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Complete phone numbers in Admin Users so Call and WhatsApp actions work properly.
            </p>
            <Link
              href="/admin/users"
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white"
            >
              Open Users
            </Link>
          </div>
          <div className="rounded-3xl bg-slate-50 px-4 py-4">
            <p className="text-base font-bold text-slate-950">After major updates</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Revisit this page once to confirm the portal is ready before residents log in.
            </p>
            <Link
              href="/admin"
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white"
            >
              Open Dashboard
            </Link>
          </div>
        </div>
      </Card>

      <Card className="border-amber-200 bg-amber-50">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-amber-900">Emergency restore checklist</p>
        <h3 className="mt-2 text-2xl font-bold text-slate-950">
          If a user or payment was changed by mistake
        </h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-white/80 px-4 py-4">
            <p className="text-base font-bold text-slate-950">1. Stop editing</p>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              Ask other admins to pause changes until the issue is understood.
            </p>
          </div>
          <div className="rounded-3xl bg-white/80 px-4 py-4">
            <p className="text-base font-bold text-slate-950">2. Check Activity</p>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              Open the activity log to identify who changed what and when.
            </p>
          </div>
          <div className="rounded-3xl bg-white/80 px-4 py-4">
            <p className="text-base font-bold text-slate-950">3. Check resident detail</p>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              Payment timeline and audit history still show important payment events.
            </p>
          </div>
          <div className="rounded-3xl bg-white/80 px-4 py-4">
            <p className="text-base font-bold text-slate-950">4. Restore from backup</p>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              Use the latest CSV/report backup or Supabase backup before re-entering data.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/admin/activity"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white"
          >
            Open Activity
          </Link>
          <Link
            href="/admin/residents"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-slate-950"
          >
            Open Residents
          </Link>
          <Link
            href="/admin/users"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-slate-950"
          >
            Open Users
          </Link>
        </div>
      </Card>

      <Card className="bg-slate-50/70">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">What this page should answer</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-white px-4 py-4">
            <p className="text-base font-bold text-slate-950">Can residents pay today?</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Check QR, monthly fee, due day, and environment items first.
            </p>
          </div>
          <div className="rounded-3xl bg-white px-4 py-4">
            <p className="text-base font-bold text-slate-950">Can admins follow up quickly?</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Missing phone numbers should be kept close to zero.
            </p>
          </div>
          <div className="rounded-3xl bg-white px-4 py-4">
            <p className="text-base font-bold text-slate-950">Is payment data trustworthy?</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Duplicate payment groups should be reviewed before reporting.
            </p>
          </div>
          <div className="rounded-3xl bg-white px-4 py-4">
            <p className="text-base font-bold text-slate-950">Is the live environment aligned?</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Schema, buckets, and server secrets must match the current code.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
