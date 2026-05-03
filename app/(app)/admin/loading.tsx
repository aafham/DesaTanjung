import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="flex min-h-[55vh] items-center justify-center px-4 py-10">
      <section
        aria-live="polite"
        aria-busy="true"
        className="w-full max-w-xl rounded-3xl border border-line bg-white px-6 py-7 text-center shadow-soft"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
        </div>
        <p className="mt-4 text-sm font-bold uppercase tracking-[0.14em] text-primary">
          Admin panel
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
          Loading committee data
        </h2>
        <p className="mx-auto mt-3 max-w-md text-base leading-7 text-slate-600">
          The portal is preparing the latest payments, residents, and activity information.
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">
          Memuatkan data jawatankuasa terkini. Sila tunggu sebentar.
        </p>
      </section>
    </div>
  );
}
