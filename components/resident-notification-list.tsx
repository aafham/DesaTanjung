"use client";

import { useMemo, useState } from "react";
import { BellRing, CheckCircle2, Clock3, Megaphone, ShieldAlert, Wallet } from "lucide-react";
import {
  markResidentNotificationsReadAction,
  markSingleResidentNotificationReadAction,
} from "@/lib/actions";
import type { NotificationRecord } from "@/lib/types";
import { formatTimestamp } from "@/lib/utils";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Card } from "@/components/ui/card";

function getNotificationPresentation(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("approved")) {
    return {
      label: "Approved",
      icon: CheckCircle2,
      tones: "border-emerald-200 bg-emerald-50 text-emerald-950",
      badge: "bg-emerald-100 text-emerald-900",
    };
  }

  if (normalized.includes("rejected")) {
    return {
      label: "Needs action",
      icon: ShieldAlert,
      tones: "border-rose-200 bg-rose-50 text-rose-950",
      badge: "bg-rose-100 text-rose-900",
    };
  }

  if (normalized.includes("waiting for committee review") || normalized.includes("submitted")) {
    return {
      label: "Pending review",
      icon: Clock3,
      tones: "border-amber-200 bg-amber-50 text-amber-950",
      badge: "bg-amber-100 text-amber-900",
    };
  }

  if (normalized.includes("cash")) {
    return {
      label: "Cash update",
      icon: Wallet,
      tones: "border-sky-200 bg-sky-50 text-sky-950",
      badge: "bg-sky-100 text-sky-900",
    };
  }

  return {
    label: "Update",
    icon: Megaphone,
    tones: "border-line bg-slate-50 text-slate-950",
    badge: "bg-slate-100 text-slate-700",
  };
}

function getNotificationCategory(message: string) {
  const label = getNotificationPresentation(message).label;

  if (label === "Approved") return "approved";
  if (label === "Pending review") return "pending";
  if (label === "Needs action") return "action";
  if (label === "Cash update") return "cash";
  return "update";
}

export function ResidentNotificationList({
  notifications,
  compact = false,
  redirectPath = "/notifications",
}: {
  notifications: NotificationRecord[];
  compact?: boolean;
  redirectPath?: string;
}) {
  const [filter, setFilter] = useState<"all" | "approved" | "pending" | "action" | "cash" | "update">(
    "all",
  );
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;
  const filteredNotifications = useMemo(
    () =>
      notifications.filter((notification) => {
        if (filter === "all") {
          return true;
        }

        return getNotificationCategory(notification.message) === filter;
      }),
    [filter, notifications],
  );

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-teal-50 p-3">
            <BellRing className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Notifications</p>
              {unreadCount > 0 ? (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                  {unreadCount} unread
                </span>
              ) : null}
            </div>
            <h3 className="mt-1 font-display text-3xl font-bold leading-tight text-slate-950">
              Resident inbox
            </h3>
          </div>
        </div>

        {unreadCount > 0 ? (
          <form action={markResidentNotificationsReadAction}>
            <ConfirmSubmitButton
              confirmTitle="Mark notifications as read?"
              confirmMessage="This clears the unread badge for your latest resident updates."
              confirmLabel="Mark all read"
              className="bg-slate-950 px-4 py-2 text-sm text-white"
            >
              Mark all read
            </ConfirmSubmitButton>
          </form>
        ) : null}
      </div>

      {!compact ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            { value: "all", label: "All" },
            { value: "approved", label: "Approved" },
            { value: "pending", label: "Pending review" },
            { value: "action", label: "Needs action" },
            { value: "cash", label: "Cash update" },
            { value: "update", label: "Update" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                setFilter(
                  option.value as "all" | "approved" | "pending" | "action" | "cash" | "update",
                )
              }
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                filter === option.value
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="rounded-3xl bg-slate-50 px-4 py-6 text-base text-muted">
            {notifications.length === 0
              ? "No resident notifications yet. Approval updates and payment reminders will appear here."
              : "No notifications matched the current filter."}
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const presentation = getNotificationPresentation(notification.message);
            const Icon = presentation.icon;

            return (
              <div
                key={notification.id}
                className={`rounded-3xl border px-4 py-4 ${
                  notification.is_read
                    ? presentation.tones
                    : `${presentation.tones} ring-1 ring-amber-200/60`
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-white/80 p-2">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${presentation.badge}`}>
                          {presentation.label}
                        </span>
                        {!notification.is_read ? (
                          <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-white">
                            New
                          </span>
                        ) : null}
                      </div>
                      <p className={`mt-3 text-base font-bold ${compact ? "line-clamp-2" : ""}`}>
                        {notification.message}
                      </p>
                    </div>
                  </div>
                  {!notification.is_read && !compact ? (
                    <form action={markSingleResidentNotificationReadAction}>
                      <input type="hidden" name="notification_id" value={notification.id} />
                      <input type="hidden" name="redirect_path" value={redirectPath} />
                      <button
                        type="submit"
                        className="rounded-full bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-700 transition hover:bg-slate-100"
                      >
                        Mark read
                      </button>
                    </form>
                  ) : null}
                </div>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">
                  {formatTimestamp(notification.created_at)}
                </p>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
