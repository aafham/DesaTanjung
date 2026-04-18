import { redirect } from "next/navigation";
import { Building2, KeyRound, ShieldCheck, UserRound } from "lucide-react";
import { AuthPanel } from "@/components/auth-panel";
import { PasswordInput } from "@/components/password-input";
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
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="rounded-4xl border border-line bg-surface/95 p-6 shadow-soft backdrop-blur sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
            Desa Tanjung
          </p>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-bold leading-tight text-slate-950 sm:text-5xl">
            Portal bayaran bulanan penduduk taman.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Gunakan portal ini untuk semak status bayaran, muat naik resit, dan rujuk
            maklumat bayaran bulanan komuniti dengan lebih teratur.
          </p>

          <div className="mt-8 grid gap-3 rounded-4xl border border-line bg-slate-50 p-5 text-base text-slate-800">
            <div className="flex items-start gap-3">
              <Building2 className="mt-1 h-5 w-5 text-primary" />
              <p>
                Portal ini disediakan untuk kegunaan <span className="font-bold text-slate-950">penduduk dan jawatankuasa</span>{" "}
                Desa Tanjung.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <UserRound className="mt-1 h-5 w-5 text-primary" />
              <p>
                <span className="font-bold text-slate-950">Penduduk:</span> log masuk menggunakan nombor rumah seperti A-12.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 text-primary" />
              <p>
                <span className="font-bold text-slate-950">Jawatankuasa:</span> log masuk menggunakan username admin.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <KeyRound className="mt-1 h-5 w-5 text-primary" />
              <p>Log masuk kali pertama akan meminta anda menukar kata laluan lalai.</p>
            </div>
          </div>

          <div className="mt-6">
            <AuthPanel />
          </div>
        </section>

        <section
          className="rounded-4xl border border-slate-800 p-6 text-white shadow-soft sm:p-8"
          style={{
            background:
              "linear-gradient(180deg, #07111f 0%, #0b1728 100%)",
          }}
        >
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-200">
            Log masuk
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold leading-tight">Akses akaun anda</h2>
          <p className="mt-3 text-base text-slate-200">
            Masukkan nombor rumah atau username bersama kata laluan untuk masuk ke portal.
          </p>

          <form action={loginAction} className="mt-8 space-y-5">
            <div>
              <label htmlFor="identifier" className="mb-2 block text-base font-bold text-white">
                Nombor rumah / Username
              </label>
              <input
                id="identifier"
                name="identifier"
                required
                placeholder="Contoh: A-12 atau admin"
                className="min-h-14 w-full rounded-3xl border border-slate-600 bg-slate-900 px-4 py-3 text-lg font-semibold text-white outline-none ring-0 placeholder:text-slate-400 focus:border-teal-400"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-base font-bold text-white">
                Kata laluan
              </label>
              <PasswordInput
                id="password"
                name="password"
                required
                placeholder="Masukkan kata laluan"
                autoComplete="current-password"
                inputClassName="min-h-14 w-full rounded-3xl border border-slate-600 bg-slate-900 px-4 py-3 text-lg font-semibold text-white outline-none placeholder:text-slate-400 focus:border-teal-400"
                buttonClassName="text-slate-300 hover:bg-white/10 hover:text-white"
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
              Masuk portal
            </button>
          </form>

          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 text-base text-slate-200">
            <p className="font-bold text-white">Maklumat log masuk lalai</p>
            <div className="mt-3 space-y-2">
              <p>
                Penduduk: <span className="font-bold text-white">password</span>
              </p>
              <p>
                Admin: <span className="font-bold text-white">passwordadmin</span>
              </p>
            </div>
            <p className="mt-3 text-slate-300">
              Selepas log masuk kali pertama, sistem akan meminta anda menukar kata laluan.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
