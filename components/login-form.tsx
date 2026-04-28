"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { PasswordInput } from "@/components/password-input";
import type { Locale } from "@/lib/i18n";

const formCopy = {
  ms: {
    pending: "Sedang log masuk...",
    submit: "Masuk portal",
    loadingTitle: "Sedang log masuk",
    loadingBody: "Sila tunggu seketika sementara sistem membuka portal anda.",
    identifier: "Nombor rumah / Username",
    identifierPlaceholder: "Contoh: A-12 atau admin",
    password: "Kata laluan",
    passwordPlaceholder: "Masukkan kata laluan",
    submitHelp: "Tekan Enter selepas mengisi username dan kata laluan untuk masuk ke portal.",
  },
  en: {
    pending: "Signing in...",
    submit: "Enter portal",
    loadingTitle: "Signing in",
    loadingBody: "Please wait while the system opens your portal.",
    identifier: "House number / Username",
    identifierPlaceholder: "Example: A-12 or admin",
    password: "Password",
    passwordPlaceholder: "Enter password",
    submitHelp: "Press Enter after entering your username and password to sign in.",
  },
} as const;

function SubmitButton({ locale }: { locale: Locale }) {
  const { pending } = useFormStatus();
  const copy = formCopy[locale];

  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-14 w-full rounded-full bg-teal-300 px-5 py-3 text-lg font-bold text-slate-950 transition hover:bg-teal-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-200/60 disabled:cursor-wait disabled:opacity-80"
      aria-describedby="login-submit-help"
    >
      {pending ? copy.pending : copy.submit}
    </button>
  );
}

function LoadingOverlay({ locale }: { locale: Locale }) {
  const { pending } = useFormStatus();
  const copy = formCopy[locale];

  if (!pending) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-4xl bg-slate-950/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/5 px-6 py-6 text-center text-white shadow-soft">
        <LoaderCircle className="h-8 w-8 animate-spin text-teal-200" />
        <div>
          <p className="text-lg font-bold">{copy.loadingTitle}</p>
          <p className="mt-1 text-sm text-slate-200">
            {copy.loadingBody}
          </p>
        </div>
      </div>
    </div>
  );
}

export function LoginForm({
  action,
  error,
  locale = "en",
}: {
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
  locale?: Locale;
}) {
  const errorId = error ? "login-form-error" : undefined;
  const copy = formCopy[locale];

  return (
    <form action={action} className="relative mt-8 space-y-5" aria-describedby="login-submit-help">
      <LoadingOverlay locale={locale} />

      <div>
        <label htmlFor="identifier" className="mb-2 block text-base font-bold text-white">
          {copy.identifier}
        </label>
        <input
          id="identifier"
          name="identifier"
          required
          autoComplete="username"
          autoFocus
          placeholder={copy.identifierPlaceholder}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className="min-h-14 w-full rounded-3xl border border-slate-500 bg-slate-900 px-4 py-3 text-lg font-semibold text-white outline-none ring-0 placeholder:text-slate-300 focus:border-teal-300 focus:ring-4 focus:ring-teal-300/20"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-base font-bold text-white">
          {copy.password}
        </label>
        <PasswordInput
          id="password"
          name="password"
          required
          placeholder={copy.passwordPlaceholder}
          autoComplete="current-password"
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          inputClassName="min-h-14 w-full rounded-3xl border border-slate-500 bg-slate-900 px-4 py-3 text-lg font-semibold text-white outline-none placeholder:text-slate-300 focus:border-teal-300 focus:ring-4 focus:ring-teal-300/20"
          buttonClassName="text-slate-300 hover:bg-white/10 hover:text-white"
        />
      </div>

      {error ? (
        <p
          id={errorId}
          className="rounded-2xl bg-rose-500/20 px-4 py-3 text-base font-bold text-rose-100"
          role="alert"
          aria-live="assertive"
        >
          {decodeURIComponent(error)}
        </p>
      ) : null}

      <SubmitButton locale={locale} />
      <p id="login-submit-help" className="sr-only">
        {copy.submitHelp}
      </p>
    </form>
  );
}
