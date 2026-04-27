import { requireUserProfile } from "@/lib/data";
import { changePasswordAction } from "@/lib/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { LanguageToggle } from "@/components/language-toggle";
import { PasswordInput } from "@/components/password-input";
import { getLocale } from "@/lib/i18n";

const changePasswordCopy = {
  ms: {
    setup: "Tetapan kali pertama",
    title: "Tukar kata laluan",
    intro: "Selamat datang, {name}. Untuk keselamatan, sila tukar kata laluan lalai sebelum menggunakan portal.",
    chooseLanguage: "Pilih bahasa dahulu",
    chooseLanguageHelp: "Pilih BM atau English sebelum tukar kata laluan. Pilihan ini akan digunakan dalam portal selepas log masuk.",
    password: "Kata laluan baharu",
    passwordHelp: "Gunakan sekurang-kurangnya 8 aksara.",
    confirm: "Sahkan kata laluan baharu",
    confirmHelp: "Masukkan kata laluan yang sama sekali lagi.",
    pending: "Menyimpan kata laluan...",
    submit: "Simpan kata laluan baharu",
  },
  en: {
    setup: "First-time setup",
    title: "Change your password",
    intro: "Welcome, {name}. For security, please change the default password before using the portal.",
    chooseLanguage: "Choose your language first",
    chooseLanguageHelp: "Pick BM or English before changing your password. This choice will be used in the portal after sign in.",
    password: "New password",
    passwordHelp: "Use at least 8 characters.",
    confirm: "Confirm new password",
    confirmHelp: "Enter the same password again.",
    pending: "Saving password...",
    submit: "Save new password",
  },
} as const;

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [profile, locale] = await Promise.all([requireUserProfile(), getLocale()]);
  const params = await searchParams;
  const copy = changePasswordCopy[locale];
  const errorId = params.error ? "change-password-error" : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-hero-glow px-4 py-10">
      <div className="w-full max-w-xl rounded-4xl border border-line bg-surface p-6 shadow-soft sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
          {copy.setup}
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-slate-950">
          {copy.title}
        </h1>
        <p className="mt-3 text-base font-medium text-muted">
          {copy.intro.replace("{name}", profile.name)}
        </p>

        <section className="mt-6 rounded-4xl border border-teal-100 bg-teal-50/70 p-4">
          <p className="text-base font-bold text-slate-950">{copy.chooseLanguage}</p>
          <p className="mt-1 text-sm font-medium text-slate-700">{copy.chooseLanguageHelp}</p>
          <LanguageToggle locale={locale} />
        </section>

        <form action={changePasswordAction} className="mt-8 space-y-5">
          <div>
            <label htmlFor="password" className="mb-2 block text-base font-bold text-slate-950">
              {copy.password}
            </label>
            <PasswordInput
              id="password"
              name="password"
              required
              minLength={8}
              autoComplete="new-password"
              aria-invalid={Boolean(params.error)}
              aria-describedby={errorId}
              inputClassName="min-h-14 w-full rounded-3xl border border-line bg-white px-4 py-3 text-lg font-semibold text-slate-950 outline-none focus:border-primary"
              buttonClassName="text-slate-500 hover:bg-slate-100 hover:text-slate-950"
            />
            <p className="mt-2 text-sm font-medium text-muted">{copy.passwordHelp}</p>
          </div>
          <div>
            <label htmlFor="confirm-password" className="mb-2 block text-base font-bold text-slate-950">
              {copy.confirm}
            </label>
            <PasswordInput
              id="confirm-password"
              name="confirm_password"
              required
              minLength={8}
              autoComplete="new-password"
              aria-invalid={Boolean(params.error)}
              aria-describedby={errorId}
              inputClassName="min-h-14 w-full rounded-3xl border border-line bg-white px-4 py-3 text-lg font-semibold text-slate-950 outline-none focus:border-primary"
              buttonClassName="text-slate-500 hover:bg-slate-100 hover:text-slate-950"
            />
            <p className="mt-2 text-sm font-medium text-muted">{copy.confirmHelp}</p>
          </div>

          {params.error ? (
            <p
              id={errorId}
              className="rounded-2xl bg-rose-50 px-4 py-3 text-base font-bold text-rose-800"
              role="alert"
              aria-live="assertive"
            >
              {decodeURIComponent(params.error)}
            </p>
          ) : null}

          <FormSubmitButton className="min-h-14 w-full px-5 py-3 text-lg" pendingLabel={copy.pending}>
            {copy.submit}
          </FormSubmitButton>
        </form>
      </div>
    </main>
  );
}
