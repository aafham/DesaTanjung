import { createAnnouncementAction, deleteAnnouncementAction } from "@/lib/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { DataWarning } from "@/components/data-warning";
import { PageToast } from "@/components/page-toast";
import { Card } from "@/components/ui/card";
import { getAdminAnnouncementsData } from "@/lib/data";
import { formatTimestamp } from "@/lib/utils";

export default async function AdminAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const [{ announcements, warnings }, params] = await Promise.all([
    getAdminAnnouncementsData(),
    searchParams,
  ]);

  return (
    <div className="space-y-6">
      <PageToast message={params.message} error={params.error} />
      <DataWarning warnings={warnings} />

      <section>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Notice board</p>
        <h2 className="mt-2 font-display text-4xl font-bold leading-tight text-slate-950">
          Publish updates for residents and committee
        </h2>
        <p className="mt-3 max-w-2xl text-base text-muted">
          Use this page for fee reminders, meetings, maintenance notices, or any important update.
        </p>
      </section>

      <Card>
        <div className="mb-5">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Create notice</p>
          <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
            Post a new announcement
          </h3>
        </div>

        <form action={createAnnouncementAction} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="announcement-title" className="mb-2 block text-base font-bold text-slate-950">
              Title
            </label>
            <input
              id="announcement-title"
              name="title"
              required
              placeholder="Example: Monthly payment reminder"
              className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="announcement-audience" className="mb-2 block text-base font-bold text-slate-950">
              Audience
            </label>
            <select
              id="announcement-audience"
              name="audience"
              defaultValue="all"
              className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
            >
              <option value="all">All users</option>
              <option value="residents">Residents only</option>
              <option value="admins">Admins only</option>
            </select>
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-line bg-slate-50 px-4 py-4 text-base font-bold text-slate-950">
            <input type="checkbox" name="is_pinned" className="h-5 w-5 rounded border-line" />
            Pin this notice at the top
          </label>

          <div className="md:col-span-2">
            <label htmlFor="announcement-body" className="mb-2 block text-base font-bold text-slate-950">
              Message
            </label>
            <textarea
              id="announcement-body"
              name="body"
              required
              rows={6}
              placeholder="Write a clear message for residents or committee members."
              className="w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="min-h-14 rounded-full bg-primary px-6 py-3 text-base font-bold text-primary-foreground"
            >
              Publish announcement
            </button>
          </div>
        </form>
      </Card>

      <section className="space-y-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Published</p>
          <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
            Current announcements
          </h3>
        </div>

        {announcements.length === 0 ? (
          <Card className="text-base text-muted">No announcements posted yet.</Card>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-2xl font-bold text-slate-950">{announcement.title}</h4>
                    {announcement.is_pinned ? (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-amber-900">
                        Pinned
                      </span>
                    ) : null}
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-700">
                      {announcement.audience}
                    </span>
                  </div>
                  <p className="mt-3 whitespace-pre-line text-base text-slate-800">
                    {announcement.body}
                  </p>
                  <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-muted">
                    Published {formatTimestamp(announcement.published_at)}
                  </p>
                </div>

                <form action={deleteAnnouncementAction}>
                  <input type="hidden" name="announcement_id" value={announcement.id} />
                  <ConfirmSubmitButton
                    variant="danger"
                    confirmTitle="Delete this announcement?"
                    confirmMessage="This notice will disappear from admin and resident dashboards."
                    className="bg-rose-700 text-white"
                  >
                    Delete notice
                  </ConfirmSubmitButton>
                </form>
              </div>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
