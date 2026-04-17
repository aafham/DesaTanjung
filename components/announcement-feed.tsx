import { Megaphone, Pin } from "lucide-react";
import type { AnnouncementRecord } from "@/lib/types";
import { formatTimestamp } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function AnnouncementFeed({
  announcements,
  emptyMessage,
}: {
  announcements: AnnouncementRecord[];
  emptyMessage: string;
}) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-teal-50 p-3">
          <Megaphone className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Notice board</p>
          <h3 className="mt-1 font-display text-3xl font-bold leading-tight text-slate-950">
            Latest announcements
          </h3>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {announcements.length === 0 ? (
          <div className="rounded-3xl bg-slate-50 px-4 py-6 text-base text-muted">
            {emptyMessage}
          </div>
        ) : (
          announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="rounded-3xl border border-line bg-slate-50 px-4 py-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-bold text-slate-950">{announcement.title}</p>
                {announcement.is_pinned ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-amber-900">
                    <Pin className="h-3 w-3" />
                    Pinned
                  </span>
                ) : null}
              </div>
              <p className="mt-2 whitespace-pre-line text-base text-slate-800">
                {announcement.body}
              </p>
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-muted">
                {formatTimestamp(announcement.published_at)}
              </p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
