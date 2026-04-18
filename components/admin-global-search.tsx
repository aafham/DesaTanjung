"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ContactActions } from "@/components/contact-actions";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ManagedUser, ResidentPaymentRecord, UserActivityWithUser, UserProfile } from "@/lib/types";
import {
  formatMalaysianPhoneNumber,
  formatTimestamp,
} from "@/lib/utils";

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

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

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
  }, [activityLogs, payments, query, residents]);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <label htmlFor="admin-global-search" className="mb-2 block text-base font-bold text-slate-950">
              Search by house number, owner, address, phone, note, or activity
            </label>
            <p className="text-sm text-slate-600">
              Start typing once and compare resident records, payment records, and activity logs side by side.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
            {query.trim() ? "Live filtered results" : "Showing latest records first"}
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
      </Card>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card>
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

          <div className="mt-5 space-y-3">
            {filtered.residents.length === 0 ? (
              <div className="rounded-3xl bg-slate-50 px-4 py-6 text-base text-muted">
                No users matched the current search.
              </div>
            ) : (
              filtered.residents.map((resident) => (
                <div key={resident.id} className="rounded-3xl border border-line bg-slate-50 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold text-slate-950">{resident.house_number}</p>
                      <p className="text-base text-slate-800">{resident.name}</p>
                      <p className="mt-1 text-sm text-muted">{resident.address}</p>
                      <p className="mt-2 text-sm text-muted">
                        {resident.phone_number ? formatMalaysianPhoneNumber(resident.phone_number) : "No phone saved"}
                      </p>
                      <ContactActions phoneNumber={resident.phone_number} compact className="mt-3" />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-700">
                        {resident.role}
                      </span>
                      <Link
                        href={`/admin/residents/${resident.id}`}
                        className="rounded-full bg-slate-950 px-3 py-1 text-sm font-semibold text-white"
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Payments</p>
              <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
                {currentMonthLabel}
              </h3>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
              {filtered.payments.length}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {filtered.payments.length === 0 ? (
              <div className="rounded-3xl bg-slate-50 px-4 py-6 text-base text-muted">
                No payments matched the current search.
              </div>
            ) : (
              filtered.payments.map((payment) => (
                <div key={payment.id} className="rounded-3xl border border-line bg-slate-50 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold text-slate-950">{payment.users?.house_number ?? "-"}</p>
                      <p className="text-base text-slate-800">{payment.users?.name ?? "Resident"}</p>
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
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={payment.display_status} />
                      <Link
                        href={`/admin/residents/${payment.user_id}?month=${payment.month}`}
                        className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-700"
                      >
                        View resident
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Activity</p>
              <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
                Latest actions
              </h3>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
              {filtered.activityLogs.length}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {filtered.activityLogs.length === 0 ? (
              <div className="rounded-3xl bg-slate-50 px-4 py-6 text-base text-muted">
                No activity matched the current search.
              </div>
            ) : (
              filtered.activityLogs.map((activity) => (
                <div key={activity.id} className="rounded-3xl border border-line bg-slate-50 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
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
                  {activity.user_id ? (
                    <Link
                      href={`/admin/residents/${activity.user_id}`}
                      className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-700"
                    >
                      Open resident
                    </Link>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
