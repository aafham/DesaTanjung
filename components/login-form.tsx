"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { PasswordInput } from "@/components/password-input";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-14 w-full rounded-full bg-teal-300 px-5 py-3 text-lg font-bold text-slate-950 transition hover:bg-teal-200 disabled:cursor-wait disabled:opacity-80"
    >
      {pending ? "Sedang log masuk..." : "Masuk portal"}
    </button>
  );
}

function LoadingOverlay() {
  const { pending } = useFormStatus();

  if (!pending) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-4xl bg-slate-950/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/5 px-6 py-6 text-center text-white shadow-soft">
        <LoaderCircle className="h-8 w-8 animate-spin text-teal-200" />
        <div>
          <p className="text-lg font-bold">Sedang log masuk</p>
          <p className="mt-1 text-sm text-slate-200">
            Sila tunggu seketika sementara sistem membuka portal anda.
          </p>
        </div>
      </div>
    </div>
  );
}

export function LoginForm({
  action,
  error,
}: {
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
}) {
  return (
    <form action={action} className="relative mt-8 space-y-5">
      <LoadingOverlay />

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

      {error ? (
        <p className="rounded-2xl bg-rose-500/20 px-4 py-3 text-base font-bold text-rose-100">
          {decodeURIComponent(error)}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
