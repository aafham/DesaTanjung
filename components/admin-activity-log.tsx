"use client";

import { useCallback, useDeferredValue, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download } from "lucide-react";
import type { PaginationMeta, UserActivityWithUser } from "@/lib/types";
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

export function AdminActivityLog({
  activityLogs,
  filters,
  pagination,
  summary,
}: {
  activityLogs: UserActivityWithUser[];
  filters: {
    query: string;
    actionFilter: string;
    roleFilter: "all" | "user" | "admin";
    dateFilter: "today" | "7d" | "14d";
  };
  pagination: PaginationMeta;
  summary: {
    total: number;
    adminActions: number;
    residentActions: number;
    paymentActions: number;
    filtered: number;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(filters.query);
  const [actionFilter, setActionFilter] =
    useState<(typeof ACTION_OPTIONS)[number]["value"]>(filters.actionFilter as (typeof ACTION_OPTIONS)[number]["value"]);
  const [roleFilter, setRoleFilter] =
    useState<(typeof ROLE_OPTIONS)[number]["value"]>(filters.roleFilter);
  const [dateFilter, setDateFilter] =
    useState<(typeof DATE_OPTIONS)[number]["value"]>(filters.dateFilter);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    setQuery(filters.query);
  }, [filters.query]);

  useEffect(() => {
    setActionFilter(filters.actionFilter as (typeof ACTION_OPTIONS)[number]["value"]);
  }, [filters.actionFilter]);

  useEffect(() => {
    setRoleFilter(filters.roleFilter);
  }, [filters.roleFilter]);

  useEffect(() => {
    setDateFilter(filters.dateFilter);
  }, [filters.dateFilter]);

  const updateUrl = useCallback((next: {
    page?: number;
    query?: string;
    action?: string;
    role?: "all" | "user" | "admin";
    date?: "today" | "7d" | "14d";
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("message");
    params.delete("error");

    const nextQuery = next.query ?? deferredQuery;
    const nextAction = next.action ?? actionFilter;
    const nextRole = next.role ?? roleFilter;
    const nextDate = next.date ?? dateFilter;
    const nextPage = next.page ?? pagination.currentPage;

    if (nextQuery.trim()) {
      params.set("q", nextQuery.trim());
    } else {
      params.delete("q");
    }

    if (nextAction !== "all") {
      params.set("action", nextAction);
    } else {
      params.delete("action");
    }

    if (nextRole !== "all") {
      params.set("role", nextRole);
    } else {
      params.delete("role");
    }

    if (nextDate !== "14d") {
      params.set("date", nextDate);
    } else {
      params.delete("date");
    }

    if (nextPage > 1) {
      params.set("page", String(nextPage));
    } else {
      params.delete("page");
    }

    const href = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(href, { scroll: false });
  }, [actionFilter, dateFilter, deferredQuery, pagination.currentPage, pathname, roleFilter, router, searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (deferredQuery !== filters.query) {
        updateUrl({ query: deferredQuery, page: 1 });
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [deferredQuery, filters.query, updateUrl]);

  const startItem =
    pagination.totalItems === 0 ? 0 : (pagination.currentPage - 1) * pagination.pageSize + 1;
  const endItem = Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems);
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
    updateUrl({
      query: "",
      action: "all",
      role: "all",
      date: "14d",
      page: 1,
    });
  }

  const exportParams = new URLSearchParams();

  if (deferredQuery.trim()) {
    exportParams.set("q", deferredQuery.trim());
  }

  if (actionFilter !== "all") {
    exportParams.set("action", actionFilter);
  }

  if (roleFilter !== "all") {
    exportParams.set("role", roleFilter);
  }

  if (dateFilter !== "14d") {
    exportParams.set("date", dateFilter);
  }

  const exportHref = exportParams.toString()
    ? `/admin/activity/export?${exportParams.toString()}`
    : "/admin/activity/export";

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
              onChange={(event) => {
                const nextAction = event.target.value as (typeof ACTION_OPTIONS)[number]["value"];
                setActionFilter(nextAction);
                updateUrl({ action: nextAction, page: 1 });
              }}
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
              onChange={(event) => {
                const nextRole = event.target.value as (typeof ROLE_OPTIONS)[number]["value"];
                setRoleFilter(nextRole);
                updateUrl({ role: nextRole, page: 1 });
              }}
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
              onChange={(event) => {
                const nextDate = event.target.value as (typeof DATE_OPTIONS)[number]["value"];
                setDateFilter(nextDate);
                updateUrl({ date: nextDate, page: 1 });
              }}
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
          Showing {startItem}-{endItem} of {summary.filtered} filtered actions
          {" "}from {summary.total} recorded portal actions in the selected window.
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
            href={exportHref}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-bold whitespace-nowrap text-white"
          >
            <Download className="h-4 w-4" />
            Export filtered CSV
          </a>
        </div>
      </div>

      <div className="grid gap-3" aria-live="polite">
        {pagination.totalItems === 0 ? (
          <Card className="text-base text-muted">
            No portal activity matched the current search and filter.
          </Card>
        ) : (
          activityLogs.map((activity) => (
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

      {pagination.totalItems > 0 ? (
        <PaginationControls
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={(page) => updateUrl({ page })}
        />
      ) : null}
    </section>
  );
}
