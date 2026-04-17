import { updateAppSettingsAction } from "@/lib/actions";
import { getAdminSettingsData } from "@/lib/data";
import { Card } from "@/components/ui/card";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const [{ settings }, params] = await Promise.all([getAdminSettingsData(), searchParams]);

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Settings</p>
        <h2 className="mt-2 font-display text-4xl font-bold leading-tight text-slate-950">
          Payment and community settings
        </h2>
        <p className="mt-3 max-w-2xl text-base text-muted">
          Update bank details, QR image URL, community name, and monthly fee without editing code.
        </p>
      </section>

      {params.error ? (
        <div className="rounded-3xl bg-rose-50 px-4 py-3 text-base font-bold text-rose-800">
          {decodeURIComponent(params.error)}
        </div>
      ) : null}
      {params.message ? (
        <div className="rounded-3xl bg-emerald-50 px-4 py-3 text-base font-bold text-emerald-800">
          {decodeURIComponent(params.message)}
        </div>
      ) : null}

      <Card>
        <form action={updateAppSettingsAction} className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="community_name" className="mb-2 block text-base font-bold text-slate-950">
              Community name
            </label>
            <input
              id="community_name"
              name="community_name"
              required
              defaultValue={settings.community_name}
              className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="monthly_fee" className="mb-2 block text-base font-bold text-slate-950">
              Monthly fee amount
            </label>
            <input
              id="monthly_fee"
              name="monthly_fee"
              type="number"
              step="0.01"
              min="0"
              defaultValue={settings.monthly_fee ?? ""}
              placeholder="Example: 30"
              className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="bank_name" className="mb-2 block text-base font-bold text-slate-950">
              Bank name
            </label>
            <input
              id="bank_name"
              name="bank_name"
              required
              defaultValue={settings.bank_name}
              className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
            />
          </div>

          <div>
            <label
              htmlFor="bank_account_number"
              className="mb-2 block text-base font-bold text-slate-950"
            >
              Account number
            </label>
            <input
              id="bank_account_number"
              name="bank_account_number"
              required
              defaultValue={settings.bank_account_number}
              className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="bank_account_name"
              className="mb-2 block text-base font-bold text-slate-950"
            >
              Account holder name
            </label>
            <input
              id="bank_account_name"
              name="bank_account_name"
              required
              defaultValue={settings.bank_account_name}
              className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="payment_qr_url" className="mb-2 block text-base font-bold text-slate-950">
              Payment QR image URL
            </label>
            <input
              id="payment_qr_url"
              name="payment_qr_url"
              required
              defaultValue={settings.payment_qr_url}
              className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
            />
            <p className="mt-2 text-sm text-muted">
              Use a public image URL. Supabase Storage public URL also works.
            </p>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="min-h-14 rounded-full bg-primary px-6 py-3 text-base font-bold text-primary-foreground"
            >
              Save settings
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
