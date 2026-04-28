import { redirect } from "next/navigation";
import { KeyRound, ShieldCheck, UserRound } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { LanguageToggle } from "@/components/language-toggle";
import { getCurrentUserProfile } from "@/lib/data";
import { getLocale } from "@/lib/i18n";
import { loginAction } from "@/lib/actions";

const loginCopy = {
  ms: {
    heroTitle: "Portal bayaran bulanan komuniti.",
    heroBody: "Semak status bayaran, muat naik resit, dan rujuk maklumat bayaran bulanan dengan lebih teratur.",
    residentLabel: "Penduduk:",
    residentHelp: "log masuk menggunakan nombor rumah seperti A-12.",
    adminLabel: "Jawatankuasa:",
    adminHelp: "log masuk menggunakan username admin.",
    firstLogin: "Log masuk kali pertama akan meminta anda menukar kata laluan lalai.",
    loginEyebrow: "Log masuk",
    loginTitle: "Akses akaun anda",
    loginBody: "Masukkan nombor rumah atau username bersama kata laluan untuk masuk ke portal.",
    defaultTitle: "Maklumat log masuk lalai",
    residentDefault: "Penduduk",
    adminDefault: "Admin",
  },
  en: {
    heroTitle: "Community monthly payment portal.",
    heroBody: "Check payment status, upload receipts, and find monthly payment details in one organised place.",
    residentLabel: "Residents:",
    residentHelp: "sign in using your house number such as A-12.",
    adminLabel: "Committee:",
    adminHelp: "sign in using the admin username.",
    firstLogin: "First-time sign in will ask you to change the default password.",
    loginEyebrow: "Sign in",
    loginTitle: "Access your account",
    loginBody: "Enter your house number or username with your password to open the portal.",
    defaultTitle: "Default login details",
    residentDefault: "Resident",
    adminDefault: "Admin",
  },
} as const;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [profile, locale] = await Promise.all([getCurrentUserProfile(), getLocale()]);

  if (profile) {
    redirect(profile.role === "admin" ? "/admin" : "/dashboard");
  }

  const params = await searchParams;
  const copy = loginCopy[locale];

  return (
    <main className="flex min-h-screen items-center justify-center bg-hero-glow px-4 py-6 sm:py-8">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-4xl border border-line bg-surface/95 p-5 shadow-soft backdrop-blur sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
            Desa Tanjung
          </p>
          <h1 className="mt-4 max-w-xl font-display text-3xl font-bold leading-tight text-slate-950 sm:text-[3.2rem]">
            {copy.heroTitle}
          </h1>
          <p className="mt-4 max-w-lg text-base font-medium leading-7 text-muted sm:text-lg sm:leading-8">
            {copy.heroBody}
          </p>

          <div className="mt-6 space-y-4 rounded-4xl border border-line bg-white/80 p-4 text-base text-slate-800 sm:mt-8 sm:p-5">
            <div className="flex items-start gap-3">
              <UserRound className="mt-1 h-5 w-5 text-primary" />
              <p>
                <span className="font-bold text-slate-950">{copy.residentLabel}</span> {copy.residentHelp}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 text-primary" />
              <p>
                <span className="font-bold text-slate-950">{copy.adminLabel}</span> {copy.adminHelp}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <KeyRound className="mt-1 h-5 w-5 text-primary" />
              <p>{copy.firstLogin}</p>
            </div>
          </div>
        </section>

        <section
          className="rounded-4xl border border-slate-800 p-5 text-white shadow-soft sm:p-8"
          style={{
            background:
              "linear-gradient(180deg, #07111f 0%, #0b1728 100%)",
          }}
        >
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-200">
            {copy.loginEyebrow}
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">{copy.loginTitle}</h2>
          <p className="mt-3 text-base leading-7 text-slate-200">
            {copy.loginBody}
          </p>

          <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4">
            <LanguageToggle locale={locale} />
          </div>

          <LoginForm action={loginAction} error={params.error} locale={locale} />

          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 text-base text-slate-200">
            <p className="font-bold text-white">{copy.defaultTitle}</p>
            <div className="mt-3 grid gap-2">
              <p>
                {copy.residentDefault}: <span className="font-bold text-white">password</span>
              </p>
              <p>
                {copy.adminDefault}: <span className="font-bold text-white">passwordadmin</span>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
