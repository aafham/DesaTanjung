"use client";

import { useEffect, useMemo, useState } from "react";

function buildCalendarDays(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();
  const totalDays = lastDay.getDate();
  const days: Array<number | null> = [];

  for (let index = 0; index < startWeekday; index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    days.push(day);
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

export function SidebarCalendar() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const currentDay = now.getDate();
  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
      }).format(now),
    [now],
  );

  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(now),
    [now],
  );

  const timeLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      }).format(now),
    [now],
  );

  const days = useMemo(() => buildCalendarDays(now), [now]);
  const dayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="mt-6 rounded-3xl bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-900">Date and time</p>
      <p className="mt-3 font-display text-3xl font-bold text-slate-950">{timeLabel}</p>
      <p className="mt-1 text-sm text-muted">{dateLabel}</p>

      <div className="mt-4 rounded-3xl bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">{monthLabel}</p>
          <div className="rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground">
            Today {currentDay}
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-[11px] uppercase tracking-[0.18em] text-muted">
          {dayLabels.map((label) => (
            <div key={label}>{label}</div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2 text-center text-sm">
          {days.map((day, index) => (
            <div
              key={`${day ?? "empty"}-${index}`}
              className={
                day === currentDay
                  ? "rounded-full bg-primary py-2 font-semibold text-primary-foreground"
                  : "rounded-full py-2 text-slate-700"
              }
            >
              {day ?? ""}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
