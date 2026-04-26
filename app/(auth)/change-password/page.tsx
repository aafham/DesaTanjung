import { requireUserProfile } from "@/lib/data";
import { changePasswordAction } from "@/lib/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { PasswordInput } from "@/components/password-input";

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await requireUserProfile();
  const params = await searchParams;
  const errorId = params.error ? "change-password-error" : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-hero-glow px-4 py-10">
      <div className="w-full max-w-xl rounded-4xl border border-line bg-surface p-6 shadow-soft sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
          Tetapan kali pertama
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-slate-950">
          Tukar kata laluan
        </h1>
        <p className="mt-3 text-base font-medium text-muted">
          Selamat datang, {profile.name}. Untuk keselamatan, sila tukar kata laluan lalai
          sebelum menggunakan portal.
        </p>

        <form action={changePasswordAction} className="mt-8 space-y-5">
          <div>
            <label htmlFor="password" className="mb-2 block text-base font-bold text-slate-950">
              Kata laluan baharu
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
            <p className="mt-2 text-sm font-medium text-muted">Gunakan sekurang-kurangnya 8 aksara.</p>
          </div>
          <div>
            <label htmlFor="confirm-password" className="mb-2 block text-base font-bold text-slate-950">
              Sahkan kata laluan baharu
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
            <p className="mt-2 text-sm font-medium text-muted">Masukkan kata laluan yang sama sekali lagi.</p>
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

          <FormSubmitButton className="min-h-14 w-full px-5 py-3 text-lg" pendingLabel="Menyimpan kata laluan...">
            Simpan kata laluan baharu
          </FormSubmitButton>
        </form>
      </div>
    </main>
  );
}
