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
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Notifications</p>
        <h2 className="mt-2 font-display text-4xl font-bold leading-tight text-slate-950">
          Resident inbox and updates
        </h2>
        <p className="mt-3 max-w-2xl text-base text-muted">
          Check approval updates, rejected payments, cash payment confirmations, and other important reminders here.
        </p>
      </section>

      <ResidentNotificationList
        notifications={notifications}
        pagination={notificationPagination}
        getPageHref={(nextPage) => (nextPage <= 1 ? "/notifications" : `/notifications?page=${nextPage}`)}
      />

      <AnnouncementFeed
        announcements={announcements}
        emptyMessage="No resident announcements have been posted yet."
      />
    </div>
  );
}
