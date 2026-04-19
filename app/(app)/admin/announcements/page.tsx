import Link from "next/link";
import { BellRing, Megaphone, Pin, Shield } from "lucide-react";
import { createAnnouncementAction, deleteAnnouncementAction } from "@/lib/actions";
import { AdminPageHeader } from "@/components/admin-page-header";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { DataWarning } from "@/components/data-warning";
import { FormSubmitButton } from "@/components/form-submit-button";
import { PageToast } from "@/components/page-toast";
import { Card } from "@/components/ui/card";
import { getAdminAnnouncementsData } from "@/lib/data";
import { formatTimestamp } from "@/lib/utils";

export default async function AdminAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; page?: string }>;
}) {
  const params = await searchParams;
  const currentPage = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const { announcements, warnings, summary, pagination } =
    await getAdminAnnouncementsData(currentPage);

  return (
    <div className="space-y-6">
      <PageToast message={params.message} error={params.error} />
      <DataWarning warnings={warnings} />

      <AdminPageHeader
        eyebrow="Notice board"
        title="Publish updates for residents and committee"
        description="Use this page for fee reminders, meetings, maintenance notices, or any important update."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-slate-50/80">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Live notices</p>
          <p className="mt-3 text-4xl font-bold text-slate-950">{summary.total}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Active notices currently visible to residents, admins, or both.
          </p>
        </Card>

        <Card className="bg-amber-50/80">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-amber-900">Pinned now</p>
          <p className="mt-3 text-4xl font-bold text-slate-950">{summary.pinned}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Priority notices that stay at the top of the board.
          </p>
        </Card>

        <Card className="bg-teal-50/80">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Residents only</p>
          <p className="mt-3 text-4xl font-bold text-slate-950">{summary.residentsOnly}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Good for payment reminders, maintenance updates, and monthly notices.
          </p>
        </Card>

        <Card className="bg-sky-50/80">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-sky-900">Admins only</p>
          <p className="mt-3 text-4xl font-bold text-slate-950">{summary.adminsOnly}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Useful for committee coordination without showing the note to residents.
          </p>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
        <Card>
          <div className="mb-5">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Create notice</p>
            <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
              Post a new announcement
            </h3>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Keep the title short, say exactly what action is needed, and pin only notices that
              must stay visible at the top.
            </p>
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
              <FormSubmitButton className="min-h-14 px-6 py-3" pendingLabel="Publishing...">
                Publish announcement
              </FormSubmitButton>
            </div>
          </form>
        </Card>

        <Card className="bg-slate-50/70">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-white p-3">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Posting guide</p>
              <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
                Pick the right audience fast
              </h3>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-3xl border border-line bg-white px-4 py-4">
              <div className="flex items-center gap-2">
                <BellRing className="h-4 w-4 text-primary" />
                <p className="text-sm font-bold uppercase tracking-[0.12em] text-primary">All users</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Use for updates everyone should see, such as fee reminders, meetings, or urgent
                neighbourhood notices.
              </p>
            </div>

            <div className="rounded-3xl border border-line bg-white px-4 py-4">
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-primary" />
                <p className="text-sm font-bold uppercase tracking-[0.12em] text-primary">Residents only</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Best for payment reminders, rejected proof follow-up, maintenance windows, or
                any instruction residents need to act on.
              </p>
            </div>

            <div className="rounded-3xl border border-line bg-white px-4 py-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-sky-900" />
                <p className="text-sm font-bold uppercase tracking-[0.12em] text-sky-900">Admins only</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Use for committee coordination, internal reminders, or handover notes that should
                not appear on resident screens.
              </p>
            </div>

            <div className="rounded-3xl border border-dashed border-line bg-white px-4 py-4">
              <div className="flex items-center gap-2">
                <Pin className="h-4 w-4 text-amber-900" />
                <p className="text-sm font-bold uppercase tracking-[0.12em] text-amber-900">Pin sparingly</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Keep pinned notices for the most important current announcement only, so the board
                does not feel crowded.
              </p>
            </div>
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Published</p>
            <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
              Current announcements
            </h3>
          </div>
          <div className="rounded-3xl border border-line bg-white px-4 py-3 text-sm leading-6 text-slate-600">
            Showing page <span className="font-bold text-slate-950">{pagination.currentPage}</span> of{" "}
            <span className="font-bold text-slate-950">{pagination.totalPages}</span> with up to{" "}
            <span className="font-bold text-slate-950">{pagination.pageSize}</span> notices per page.
          </div>
        </div>

        {announcements.length === 0 ? (
          <Card className="text-base text-muted">
            No announcements posted yet. Publish the first notice when there is a payment reminder,
            meeting, maintenance update, or admin-only coordination message to share.
          </Card>
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

        {pagination.totalPages > 1 ? (
          <div className="flex flex-wrap items-center justify-center gap-2 rounded-3xl border border-line bg-white px-4 py-4">
            {pagination.currentPage > 1 ? (
              <Link
                href={`/admin/announcements?page=${pagination.currentPage - 1}`}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-100 px-4 py-3 text-base font-bold text-slate-950 transition hover:bg-slate-200"
              >
                Previous
              </Link>
            ) : null}

            {Array.from({ length: pagination.totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <Link
                key={pageNumber}
                href={`/admin/announcements?page=${pageNumber}`}
                aria-current={pagination.currentPage === pageNumber ? "page" : undefined}
                className={
                  pagination.currentPage === pageNumber
                    ? "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-primary px-4 py-3 text-base font-bold text-primary-foreground"
                    : "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-slate-100 px-4 py-3 text-base font-bold text-slate-950 transition hover:bg-slate-200"
                }
              >
                {pageNumber}
              </Link>
            ))}

            {pagination.currentPage < pagination.totalPages ? (
              <Link
                href={`/admin/announcements?page=${pagination.currentPage + 1}`}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-100 px-4 py-3 text-base font-bold text-slate-950 transition hover:bg-slate-200"
              >
                Next
              </Link>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
