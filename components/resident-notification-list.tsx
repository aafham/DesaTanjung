"use client";

import { BellRing } from "lucide-react";
import { markResidentNotificationsReadAction } from "@/lib/actions";
import type { NotificationRecord } from "@/lib/types";
import { formatTimestamp } from "@/lib/utils";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Card } from "@/components/ui/card";

export function ResidentNotificationList({
  notifications,
}: {
  notifications: NotificationRecord[];
}) {
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

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

      <div className="mt-5 space-y-3">
        {notifications.length === 0 ? (
          <div className="rounded-3xl bg-slate-50 px-4 py-6 text-base text-muted">
            No resident notifications yet. Approval updates and payment reminders will appear here.
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-3xl border px-4 py-4 ${
                notification.is_read
                  ? "border-line bg-slate-50"
                  : "border-amber-200 bg-amber-50/70"
              }`}
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
  );
}
