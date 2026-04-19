"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { Activity, Search, ShieldCheck, Users } from "lucide-react";
import { ContactActions } from "@/components/contact-actions";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import type {
  ManagedUser,
  ResidentPaymentRecord,
  UserActivityWithUser,
  UserProfile,
} from "@/lib/types";
import { formatMalaysianPhoneNumber, formatTimestamp } from "@/lib/utils";

type SearchPayment = ResidentPaymentRecord & {
  users: Pick<UserProfile, "house_number" | "name" | "address" | "phone_number"> | null;
};

export function AdminGlobalSearch({
  currentMonthLabel,
  residents,
  payments,
  activityLogs,
}: {
  currentMonthLabel: string;
  residents: ManagedUser[];
  payments: SearchPayment[];
  activityLogs: UserActivityWithUser[];
}) {
  const [query, setQuery] = useState("");
  const [focus, setFocus] = useState<"all" | "residents" | "payments" | "activity">("all");
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();

    if (!normalized) {
      return {
        residents: residents.slice(0, 8),
        payments: payments.slice(0, 8),
        activityLogs: activityLogs.slice(0, 8),
      };
    }

    const match = (value: string | null | undefined) => value?.toLowerCase().includes(normalized);

    return {
      residents: residents.filter(
        (resident) =>
          match(resident.house_number) ||
          match(resident.name) ||
          match(resident.address) ||
          match(resident.phone_number) ||
          match(resident.email),
      ),
      payments: payments.filter(
        (payment) =>
          match(payment.users?.house_number) ||
          match(payment.users?.name) ||
          match(payment.users?.address) ||
          match(payment.users?.phone_number) ||
          match(payment.notes) ||
          match(payment.reject_reason),
      ),
      activityLogs: activityLogs.filter(
        (activity) =>
          match(activity.users?.house_number) ||
          match(activity.users?.name) ||
          match(activity.message) ||
          match(activity.action),
      ),
    };
  }, [activityLogs, deferredQuery, payments, residents]);

  const hasQuery = query.trim().length > 0;
  const focusCards = [
    {
      value: "all" as const,
      label: "All sections",
      description: "Compare residents, payments, and activity together.",
      icon: Search,
      count: filtered.residents.length + filtered.payments.length + filtered.activityLogs.length,
    },
    {
      value: "residents" as const,
      label: "Residents",
      description: "Jump straight to account and contact details.",
      icon: Users,
      count: filtered.residents.length,
    },
    {
      value: "payments" as const,
      label: "Payments",
      description: `Focus on ${currentMonthLabel} status, notes, and rejects.`,
      icon: ShieldCheck,
      count: filtered.payments.length,
    },
    {
      value: "activity" as const,
      label: "Activity",
      description: "Trace login, profile, and payment actions quickly.",
      icon: Activity,
      count: filtered.activityLogs.length,
    },
  ];

  function getPaymentActionLabel(payment: SearchPayment) {
    if (payment.display_status === "pending") {
      return "Review approval";
    }

    if (payment.display_status === "rejected") {
      return "Follow up reject";
    }

    if (payment.display_status === "overdue" || payment.display_status === "unpaid") {
      return "Follow up resident";
    }

    return "Open resident";
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <label
              htmlFor="admin-global-search"
              className="mb-2 block text-base font-bold text-slate-950"
            >
              Search by house number, owner, address, phone, note, or activity
            </label>
            <p className="text-sm text-slate-600">
              Start typing once and compare resident records, payment records, and activity logs
              side by side.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
            {hasQuery ? "Live filtered results" : "Showing latest records first"}
          </div>
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
          <input
            id="admin-global-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search A-12, Noor Azizan, 0123456789, uploaded..."
            className="min-h-14 w-full rounded-2xl border border-line py-3 pl-12 pr-4 text-base text-slate-950 outline-none focus:border-primary"
          />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {focusCards.map((option) => {
            const Icon = option.icon;
            const active = focus === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFocus(option.value)}
                aria-pressed={active}
                className={`rounded-3xl border px-4 py-4 text-left transition ${
                  active
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-line bg-slate-50 text-slate-900 hover:bg-white"
                } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`rounded-2xl p-2 ${active ? "bg-white/10" : "bg-white"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      active ? "bg-white/10 text-white" : "bg-white text-slate-700"
                    }`}
                  >
                    {option.count}
                  </span>
                </div>
                <p className="mt-4 text-base font-bold">{option.label}</p>
                <p className={`mt-2 text-sm leading-6 ${active ? "text-slate-100" : "text-slate-700"}`}>
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-3xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
          {hasQuery ? (
            <p>
              Searching for{" "}
              <span className="font-bold text-slate-950">&quot;{query.trim()}&quot;</span>. Use
              the focus cards above when you already know whether you need a resident, payment, or
              activity result.
            </p>
          ) : (
            <p>
              Tip: search by house number for the fastest match, or paste part of a payment note,
              phone number, or activity message to find related records.
            </p>
          )}
        </div>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-slate-700">
            Resident matches
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{filtered.residents.length}</p>
          <p className="mt-2 text-sm font-medium text-slate-700">
            House number, owner name, address, phone, and email.
          </p>
        </Card>
        <Card className="border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-amber-800">
            Payment matches
          </p>
          <p className="mt-2 text-3xl font-bold text-amber-950">{filtered.payments.length}</p>
          <p className="mt-2 text-sm font-medium text-amber-950">
            Notes, reject reasons, and status records for {currentMonthLabel}.
          </p>
        </Card>
        <Card className="border-teal-200 bg-teal-50 p-5">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-teal-800">
            Activity matches
          </p>
          <p className="mt-2 text-3xl font-bold text-teal-950">{filtered.activityLogs.length}</p>
          <p className="mt-2 text-sm font-medium text-teal-950">
            Login, profile changes, uploads, and account activity.
          </p>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.08fr_0.96fr_0.96fr] xl:items-start">
        {(focus === "all" || focus === "residents") && (
          <Card className="self-start p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Users</p>
                <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
                  Resident accounts
                </h3>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                {filtered.residents.length}
              </span>
            </div>

            <div className="mt-5 max-h-[42rem] space-y-3 overflow-y-auto pr-1">
              {filtered.residents.length === 0 ? (
                <div className="rounded-3xl bg-slate-50 px-4 py-6 text-base text-muted">
                  No users matched the current search.
                </div>
              ) : (
                filtered.residents.map((resident) => (
                  <div
                    key={resident.id}
                    className="rounded-3xl border border-line bg-slate-50 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-bold text-slate-950">{resident.house_number}</p>
                        <p className="text-base text-slate-800">{resident.name}</p>
                        <p className="mt-1 text-sm text-muted">{resident.address}</p>
                        <p className="mt-2 text-sm text-muted">
                          {resident.phone_number
                            ? formatMalaysianPhoneNumber(resident.phone_number)
                            : "No phone saved"}
                        </p>
                        <ContactActions
                          phoneNumber={resident.phone_number}
                          compact
                          className="mt-3"
                        />
                      </div>
                      <div className="flex w-full max-w-[8rem] flex-col items-end gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-700">
                          {resident.role}
                        </span>
                        <div className="flex flex-wrap justify-end gap-2">
                          <Link
                            href={`/admin/residents/${resident.id}`}
                            className="rounded-full bg-slate-950 px-3 py-1 text-sm font-semibold text-white"
                          >
                            Open resident
                          </Link>
                          <Link
                            href={`/admin/users?query=${encodeURIComponent(resident.house_number)}`}
                            className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700"
                          >
                            Open user
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {(focus === "all" || focus === "payments") && (
          <Card className="self-start p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
                  Payments
                </p>
                <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
                  {currentMonthLabel}
                </h3>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                {filtered.payments.length}
              </span>
            </div>

            <div className="mt-5 max-h-[42rem] space-y-3 overflow-y-auto pr-1">
              {filtered.payments.length === 0 ? (
                <div className="rounded-3xl bg-slate-50 px-4 py-6 text-base text-muted">
                  No payments matched the current search.
                </div>
              ) : (
                filtered.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="rounded-3xl border border-line bg-slate-50 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-bold text-slate-950">
                          {payment.users?.house_number ?? "-"}
                        </p>
                        <p className="text-base text-slate-800">
                          {payment.users?.name ?? "Resident"}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          Updated {formatTimestamp(payment.updated_at)}
                        </p>
                        {payment.reject_reason ? (
                          <p className="mt-2 text-sm font-semibold text-rose-700">
                            Reject reason: {payment.reject_reason}
                          </p>
                        ) : null}
                        {payment.notes ? (
                          <p className="mt-2 text-sm text-slate-700">Note: {payment.notes}</p>
                        ) : null}
                        <ContactActions
                          phoneNumber={payment.users?.phone_number}
                          compact
                          className="mt-3"
                        />
                      </div>
                      <div className="flex w-full max-w-[9rem] flex-col items-end gap-2">
                        <StatusBadge status={payment.display_status} />
                        <div className="flex flex-wrap justify-end gap-2">
                          <Link
                            href={`/admin/residents/${payment.user_id}?month=${payment.month}`}
                            className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-700"
                          >
                            {getPaymentActionLabel(payment)}
                          </Link>
                          {(payment.display_status === "pending" ||
                            payment.display_status === "rejected") && (
                            <Link
                              href={`/admin/approvals?month=${payment.month}`}
                              className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-white"
                            >
                              Open approvals
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {(focus === "all" || focus === "activity") && (
          <Card className="self-start p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
                  Activity
                </p>
                <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
                  Latest actions
                </h3>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                {filtered.activityLogs.length}
              </span>
            </div>

            <div className="mt-5 max-h-[42rem] space-y-3 overflow-y-auto pr-1">
              {filtered.activityLogs.length === 0 ? (
                <div className="rounded-3xl bg-slate-50 px-4 py-6 text-base text-muted">
                  No activity matched the current search.
                </div>
              ) : (
                filtered.activityLogs.map((activity) => (
                  <div
                    key={activity.id}
                    className="rounded-3xl border border-line bg-slate-50 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-bold text-slate-950">
                          {activity.users?.house_number ?? "Resident"}
                        </p>
                        <p className="text-base text-slate-800">{activity.message}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-700">
                        {activity.action.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">
                      {formatTimestamp(activity.created_at)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {activity.user_id ? (
                        <Link
                          href={`/admin/residents/${activity.user_id}`}
                          className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-700"
                        >
                          Open resident
                        </Link>
                      ) : null}
                      {activity.user_id ? (
                        <Link
                          href={`/admin/users?query=${encodeURIComponent(activity.users?.house_number ?? "")}`}
                          className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-white"
                        >
                          Open user
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}
