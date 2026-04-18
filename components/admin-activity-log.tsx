"use client";

import { useMemo, useState } from "react";
import type { UserActivityWithUser } from "@/lib/types";
import { formatTimestamp } from "@/lib/utils";
import { Card } from "@/components/ui/card";

const ACTION_OPTIONS = [
  { value: "all", label: "All actions" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "profile_updated", label: "Profile updated" },
  { value: "password_changed", label: "Password changed" },
  { value: "payment_uploaded", label: "Payment uploaded" },
] as const;

export function AdminActivityLog({
  activityLogs,
}: {
  activityLogs: UserActivityWithUser[];
}) {
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] =
    useState<(typeof ACTION_OPTIONS)[number]["value"]>("all");

  const filteredActivity = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return activityLogs.filter((activity) => {
      const matchesAction =
        actionFilter === "all" || activity.action === actionFilter;
      const searchable = [
        activity.users?.house_number,
        activity.users?.name,
        activity.message,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesAction && (!normalized || searchable.includes(normalized));
    });
  }, [actionFilter, activityLogs, query]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Audit log</p>
          <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
            Resident activity timeline
          </h3>
        </div>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px] lg:w-[560px]">
          <div>
            <label htmlFor="activity-search" className="mb-2 block text-base font-bold text-slate-950">
              Search house number or resident name
            </label>
            <input
              id="activity-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search A-12, Noor Azizan, uploaded..."
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
        </div>
      </div>

      <div className="rounded-3xl bg-slate-50 px-4 py-3 text-base text-muted">
        Showing {filteredActivity.length} of {activityLogs.length} recorded resident actions.
      </div>

      <div className="grid gap-3">
        {filteredActivity.length === 0 ? (
          <Card className="text-base text-muted">
            No resident activity matched the current search and filter.
          </Card>
        ) : (
          filteredActivity.map((activity) => (
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
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-700">
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
    </section>
  );
}
