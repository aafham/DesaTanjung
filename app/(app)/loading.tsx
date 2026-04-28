export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-4xl border border-line bg-white px-6 py-7 text-center shadow-soft">
        <div className="mx-auto h-14 w-14 animate-pulse rounded-full bg-teal-100" />
        <p className="mt-4 text-sm font-bold uppercase tracking-[0.14em] text-primary">
          Opening page
        </p>
        <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
          Loading latest portal data
        </h3>
        <p className="mt-3 text-base leading-8 text-slate-600">
          Please wait a moment while the system prepares the next screen.
        </p>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
          Memuatkan maklumat terkini. Sila tunggu sebentar.
        </p>
      </div>
    </div>
  );
}
