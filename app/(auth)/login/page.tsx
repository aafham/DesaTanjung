import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/auth-panel";
import { getCurrentUserProfile } from "@/lib/data";
import { loginAction } from "@/lib/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await getCurrentUserProfile();

  if (profile) {
    redirect(profile.role === "admin" ? "/admin" : "/dashboard");
  }

  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-hero-glow px-4 py-10">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-4xl border border-line bg-surface/90 p-6 shadow-soft backdrop-blur sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            Desa Tanjung
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold text-slate-950">
            Monthly payment management for your neighbourhood.
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted">
            Residents can upload payment proofs, while committee members review and
            approve each submission from one mobile-first dashboard.
          </p>

          <div className="mt-8">
            <AuthPanel />
          </div>
        </section>

        <section className="rounded-4xl border border-line bg-slate-950 p-6 text-white shadow-soft sm:p-8">
          <h2 className="font-display text-3xl font-bold">Sign in</h2>
          <p className="mt-3 text-sm text-slate-300">
            Residents use their house number. Committee uses <span className="font-semibold">admin</span>.
          </p>

          <form action={loginAction} className="mt-8 space-y-4">
            <div>
              <label htmlFor="identifier" className="mb-2 block text-sm font-medium text-slate-200">
                House number / Username
              </label>
              <input
                id="identifier"
                name="identifier"
                required
                placeholder="A-12 or admin"
                className="w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-teal-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Enter password"
                className="w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-teal-500"
              />
            </div>

            {params.error ? (
              <p className="rounded-2xl bg-rose-500/15 px-4 py-3 text-sm text-rose-200">
                {decodeURIComponent(params.error)}
              </p>
            ) : null}

            <button
              type="submit"
              className="w-full rounded-full bg-teal-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400"
            >
              Continue
            </button>
          </form>

          <div className="mt-6 rounded-3xl bg-slate-900 p-4 text-sm text-slate-300">
            <p className="font-semibold text-white">Default logins</p>
            <p className="mt-2">Resident password: password</p>
            <p>Admin password: passwordadmin</p>
            <p className="mt-3 text-slate-400">
              First sign-in redirects users to change their password.
            </p>
          </div>

          <Link href="https://supabase.com/docs" className="mt-6 inline-block text-sm text-teal-300">
            Supabase setup guide
          </Link>
        </section>
      </div>
    </main>
  );
}
