import { AnnouncementFeed } from "@/components/announcement-feed";
import { DataWarning } from "@/components/data-warning";
import { ResidentNotificationList } from "@/components/resident-notification-list";
import { getResidentNotificationsPageData } from "@/lib/data";
import { getLocale } from "@/lib/i18n";

const notificationPageCopy = {
  ms: {
    eyebrow: "Notifikasi",
    title: "Inbox penduduk dan makluman",
    intro: "Semak status resit, bayaran yang ditolak, bayaran tunai, dan makluman penting di sini.",
    emptyAnnouncements: "Belum ada pengumuman untuk penduduk.",
  },
  en: {
    eyebrow: "Notifications",
    title: "Resident inbox and updates",
    intro: "Check receipt status, rejected payments, cash payments, and important announcements here.",
    emptyAnnouncements: "No resident announcements have been posted yet.",
  },
} as const;

export default async function ResidentNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number.parseInt(params.page ?? "1", 10) || 1;
  const [locale, data] = await Promise.all([getLocale(), getResidentNotificationsPageData(page)]);
  const copy = notificationPageCopy[locale];
  const { announcements, notificationPagination, notifications, warnings } = data;

  return (
    <div className="space-y-6">
      <DataWarning warnings={warnings} />

      <section>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">{copy.eyebrow}</p>
        <h2 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
          {copy.title}
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
          {copy.intro}
        </p>
      </section>

      <ResidentNotificationList
        notifications={notifications}
        pagination={notificationPagination}
        paginationBasePath="/notifications"
        locale={locale}
      />

      <AnnouncementFeed
        announcements={announcements}
        emptyMessage={copy.emptyAnnouncements}
      />
    </div>
  );
}
