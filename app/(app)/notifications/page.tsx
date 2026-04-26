import { AnnouncementFeed } from "@/components/announcement-feed";
import { DataWarning } from "@/components/data-warning";
import { ResidentNotificationList } from "@/components/resident-notification-list";
import { getResidentNotificationsPageData } from "@/lib/data";

export default async function ResidentNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number.parseInt(params.page ?? "1", 10) || 1;
  const { announcements, notificationPagination, notifications, warnings } =
    await getResidentNotificationsPageData(page);

  return (
    <div className="space-y-6">
      <DataWarning warnings={warnings} />

      <section>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Notifikasi</p>
        <h2 className="mt-2 font-display text-4xl font-bold leading-tight text-slate-950">
          Inbox penduduk dan makluman
        </h2>
        <p className="mt-3 max-w-2xl text-base text-muted">
          Semak status resit, bayaran yang ditolak, bayaran tunai, dan makluman penting di sini.
        </p>
      </section>

      <ResidentNotificationList
        notifications={notifications}
        pagination={notificationPagination}
        paginationBasePath="/notifications"
      />

      <AnnouncementFeed
        announcements={announcements}
        emptyMessage="Belum ada pengumuman untuk penduduk."
      />
    </div>
  );
}
