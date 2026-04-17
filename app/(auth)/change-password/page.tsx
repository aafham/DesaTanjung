import { requireUserProfile } from "@/lib/data";
import { changePasswordAction } from "@/lib/actions";

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await requireUserProfile();
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-hero-glow px-4 py-10">
      <div className="w-full max-w-xl rounded-4xl border border-line bg-surface p-6 shadow-soft sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
          First-time setup
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-slate-950">
          Change your password
        </h1>
        <p className="mt-3 text-base text-muted">
          Welcome, {profile.name}. For security, your default password must be updated
          before you can use the portal.
        </p>

        <form action={changePasswordAction} className="mt-8 space-y-5">
          <div>
            <label htmlFor="password" className="mb-2 block text-base font-bold text-slate-950">
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="min-h-14 w-full rounded-3xl border border-line bg-white px-4 py-3 text-lg font-semibold text-slate-950 outline-none focus:border-primary"
            />
            <p className="mt-2 text-sm text-muted">Use at least 8 characters.</p>
          </div>

          {params.error ? (
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-base font-bold text-rose-800">
              {decodeURIComponent(params.error)}
            </p>
          ) : null}

          <button
            type="submit"
            className="min-h-14 w-full rounded-full bg-primary px-5 py-3 text-lg font-bold text-primary-foreground"
          >
            Save new password
          </button>
        </form>
      </div>
    </main>
  );
}
