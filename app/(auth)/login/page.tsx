import { redirect } from "next/navigation";
import { KeyRound, ShieldCheck, UserRound } from "lucide-react";
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
    <main className="flex min-h-screen items-center justify-center bg-hero-glow px-4 py-8">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-4xl border border-line bg-surface/95 p-6 shadow-soft backdrop-blur sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
            Desa Tanjung
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-slate-950 sm:text-5xl">
            Pay monthly fees without confusion.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted">
            Log in with your house number, upload receipt, and check whether payment is
            paid, pending, or needs action.
          </p>

          <div className="mt-8 grid gap-3 rounded-4xl bg-slate-50 p-5 text-base text-slate-800">
            <div className="flex items-start gap-3">
              <UserRound className="mt-1 h-5 w-5 text-primary" />
              <p><span className="font-bold text-slate-950">Residents:</span> use house number like A-12.</p>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 text-primary" />
              <p><span className="font-bold text-slate-950">Committee:</span> use username admin.</p>
            </div>
            <div className="flex items-start gap-3">
              <KeyRound className="mt-1 h-5 w-5 text-primary" />
              <p>First login will ask you to change the default password.</p>
            </div>
          </div>

          <div className="mt-6">
            <AuthPanel />
          </div>
        </section>

        <section className="rounded-4xl border border-line bg-slate-950 p-6 text-white shadow-soft sm:p-8">
          <h2 className="font-display text-4xl font-bold leading-tight">Sign in</h2>
          <p className="mt-3 text-base text-slate-200">
            Enter your username and password. Use capital or small letters, both are okay.
          </p>

          <form action={loginAction} className="mt-8 space-y-5">
            <div>
              <label htmlFor="identifier" className="mb-2 block text-base font-bold text-white">
                House number / Username
              </label>
              <input
                id="identifier"
                name="identifier"
                required
                placeholder="A-12 or admin"
                className="min-h-14 w-full rounded-3xl border border-slate-600 bg-slate-900 px-4 py-3 text-lg font-semibold text-white outline-none ring-0 placeholder:text-slate-400 focus:border-teal-400"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-base font-bold text-white">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Enter password"
                className="min-h-14 w-full rounded-3xl border border-slate-600 bg-slate-900 px-4 py-3 text-lg font-semibold text-white outline-none placeholder:text-slate-400 focus:border-teal-400"
              />
            </div>

            {params.error ? (
              <p className="rounded-2xl bg-rose-500/20 px-4 py-3 text-base font-bold text-rose-100">
                {decodeURIComponent(params.error)}
              </p>
            ) : null}

            <button
              type="submit"
              className="min-h-14 w-full rounded-full bg-teal-300 px-5 py-3 text-lg font-bold text-slate-950 transition hover:bg-teal-200"
            >
              Continue
            </button>
          </form>

          <div className="mt-6 rounded-3xl bg-slate-900 p-5 text-base text-slate-200">
            <p className="font-bold text-white">Default passwords</p>
            <p className="mt-2">Resident: <span className="font-bold text-white">password</span></p>
            <p>Admin: <span className="font-bold text-white">passwordadmin</span></p>
            <p className="mt-3 text-slate-300">
              First sign-in redirects users to change their password.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
