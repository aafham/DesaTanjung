"use client";

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import type { UserActivityWithUser } from "@/lib/types";
import { formatTimestamp } from "@/lib/utils";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Card } from "@/components/ui/card";

const ACTION_OPTIONS = [
  { value: "all", label: "All actions" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "profile_updated", label: "Profile updated" },
  { value: "password_changed", label: "Password changed" },
  { value: "payment_uploaded", label: "Payment uploaded" },
  { value: "payment_approved", label: "Payment approved" },
  { value: "payment_rejected", label: "Payment rejected" },
  { value: "cash_paid", label: "Cash paid" },
  { value: "bulk_cash_paid", label: "Bulk cash paid" },
  { value: "payment_note_updated", label: "Payment note updated" },
  { value: "settings_updated", label: "Settings updated" },
  { value: "announcement_published", label: "Announcement published" },
  { value: "announcement_deleted", label: "Announcement deleted" },
  { value: "user_created", label: "User created" },
  { value: "user_updated", label: "User updated" },
  { value: "user_password_reset", label: "User password reset" },
  { value: "user_deleted", label: "User deleted" },
] as const;

const ROLE_OPTIONS = [
  { value: "all", label: "All roles" },
  { value: "user", label: "Residents" },
  { value: "admin", label: "Admins" },
] as const;

const DATE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "14d", label: "Last 14 days" },
] as const;

function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function AdminActivityLog({
  activityLogs,
}: {
  activityLogs: UserActivityWithUser[];
}) {
  const PAGE_SIZE = 5;
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] =
    useState<(typeof ACTION_OPTIONS)[number]["value"]>("all");
  const [roleFilter, setRoleFilter] =
    useState<(typeof ROLE_OPTIONS)[number]["value"]>("all");
  const [dateFilter, setDateFilter] =
    useState<(typeof DATE_OPTIONS)[number]["value"]>("14d");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredActivity = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const now = Date.now();

    return activityLogs.filter((activity) => {
      const matchesAction =
        actionFilter === "all" || activity.action === actionFilter;
      const matchesRole =
        roleFilter === "all" || activity.users?.role === roleFilter;
      const searchable = [
        activity.users?.house_number,
        activity.users?.name,
        activity.message,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const age = now - new Date(activity.created_at).getTime();
      const matchesDate =
        (dateFilter === "today" && age < 1000 * 60 * 60 * 24) ||
        (dateFilter === "7d" && age < 1000 * 60 * 60 * 24 * 7) ||
        (dateFilter === "14d" && age < 1000 * 60 * 60 * 24 * 14);

      return (
        matchesAction &&
        matchesRole &&
        matchesDate &&
        (!normalized || searchable.includes(normalized))
      );
    });
  }, [actionFilter, activityLogs, dateFilter, query, roleFilter]);

  const summary = useMemo(() => {
    const paymentActions = new Set([
      "payment_uploaded",
      "payment_approved",
      "payment_rejected",
      "cash_paid",
      "bulk_cash_paid",
      "payment_note_updated",
    ]);

    return {
      total: activityLogs.length,
      adminActions: activityLogs.filter((activity) => activity.users?.role === "admin").length,
      residentActions: activityLogs.filter((activity) => activity.users?.role === "user").length,
      paymentActions: activityLogs.filter((activity) => paymentActions.has(activity.action)).length,
      filtered: filteredActivity.length,
    };
  }, [activityLogs, filteredActivity]);

  const csvHref = useMemo(() => {
    const rows = [
      ["Date", "House", "Resident", "Role", "Action", "Message"],
      ...filteredActivity.map((activity) => [
        formatTimestamp(activity.created_at),
        activity.users?.house_number ?? "",
        activity.users?.name ?? "",
        activity.users?.role ?? "",
        activity.action,
        activity.message,
      ]),
    ];
    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");

    return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
  }, [filteredActivity]);

  const totalPages = Math.max(1, Math.ceil(filteredActivity.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [query, actionFilter, roleFilter, dateFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedActivity = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredActivity.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage, filteredActivity]);

  const startItem = filteredActivity.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, filteredActivity.length);
  const hasActiveFilters =
    query.trim().length > 0 ||
    actionFilter !== "all" ||
    roleFilter !== "all" ||
    dateFilter !== "14d";

  function resetFilters() {
    setQuery("");
    setActionFilter("all");
    setRoleFilter("all");
    setDateFilter("14d");
  }

  return (
    <section className="space-y-4" aria-labelledby="activity-log-heading">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="bg-slate-50/80">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Latest window</p>
          <p className="mt-3 text-4xl font-bold text-slate-950">{summary.total}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Total actions recorded in the latest 14 days.
          </p>
        </Card>
        <Card className="bg-sky-50/80">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-sky-900">Admin actions</p>
          <p className="mt-3 text-4xl font-bold text-slate-950">{summary.adminActions}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Settings, approvals, notices, and account management activity.
          </p>
        </Card>
        <Card className="bg-teal-50/80">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Resident actions</p>
          <p className="mt-3 text-4xl font-bold text-slate-950">{summary.residentActions}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Login, profile update, password change, and receipt uploads.
          </p>
        </Card>
        <Card className="bg-amber-50/80">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-amber-900">Payment actions</p>
          <p className="mt-3 text-4xl font-bold text-slate-950">{summary.paymentActions}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Upload, review, note update, and cash-payment handling.
          </p>
        </Card>
        <Card className="bg-white">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Current filter</p>
          <p className="mt-3 text-4xl font-bold text-slate-950">{summary.filtered}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Actions that match the current search and filter set.
          </p>
        </Card>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Audit log</p>
          <h3
            id="activity-log-heading"
            className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950"
          >
            Portal activity timeline
          </h3>
          <p id="activity-log-help" className="mt-2 max-w-2xl text-base text-slate-600">
            Search by house number, resident, or message, then narrow the latest 14 days of
            resident and admin activity with action, role, and date filters.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 lg:w-full xl:max-w-5xl">
          <div>
            <label htmlFor="activity-search" className="mb-2 block text-base font-bold text-slate-950">
              Search house number or resident name
            </label>
            <input
              id="activity-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search A-12, Noor Azizan, uploaded..."
              aria-describedby="activity-log-help activity-results-summary"
              className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="activity-filter" className="mb-2 block text-base font-bold text-slate-950">
              Filter action
            </label>
            <select
              id="activity-filter"
              value={actionFilter}
              onChange={(event) =>
                setActionFilter(event.target.value as (typeof ACTION_OPTIONS)[number]["value"])
              }
              className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
            >
              {ACTION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="role-filter" className="mb-2 block text-base font-bold text-slate-950">
              Filter role
            </label>
            <select
              id="role-filter"
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value as (typeof ROLE_OPTIONS)[number]["value"])
              }
              className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="date-filter" className="mb-2 block text-base font-bold text-slate-950">
              Filter date
            </label>
            <select
              id="date-filter"
              value={dateFilter}
              onChange={(event) =>
                setDateFilter(event.target.value as (typeof DATE_OPTIONS)[number]["value"])
              }
              aria-describedby="activity-results-summary"
              className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
            >
              {DATE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div
        id="activity-results-summary"
        className="flex flex-col gap-3 rounded-3xl bg-slate-50 px-4 py-3 text-base text-muted sm:flex-row sm:items-center sm:justify-between"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <p>
          Showing {startItem}-{endItem} of {filteredActivity.length} filtered actions
          {" "}from {activityLogs.length} recorded portal actions in the latest 14 days.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-slate-950"
            >
              Clear filters
            </button>
          ) : null}
          <a
            href={csvHref}
            download="resident-activity-log.csv"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-bold whitespace-nowrap text-white"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </a>
        </div>
      </div>

      <div className="grid gap-3" aria-live="polite">
        {filteredActivity.length === 0 ? (
          <Card className="text-base text-muted">
            No portal activity matched the current search and filter.
          </Card>
        ) : (
          paginatedActivity.map((activity) => (
            <Card key={activity.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-bold text-slate-950">
                      {activity.users?.house_number ?? "Resident"}
                    </p>
                    {activity.users?.name ? (
                      <span className="text-base text-muted">{activity.users.name}</span>
                    ) : null}
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] whitespace-nowrap text-slate-700">
                      {activity.action.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="mt-3 text-base text-slate-900">{activity.message}</p>
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
                  {formatTimestamp(activity.created_at)}
                </p>
              </div>
            </Card>
          ))
        )}
      </div>

      {filteredActivity.length > 0 ? (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      ) : null}
    </section>
  );
}
