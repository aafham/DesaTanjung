export function MonthFilter({ currentMonth }: { currentMonth: string }) {
  return (
    <form className="flex flex-col gap-3 rounded-3xl border border-line bg-white p-4 shadow-sm sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor="month" className="mb-2 block text-base font-bold text-slate-900">
          Filter month
        </label>
        <input
          id="month"
          name="month"
          type="month"
          defaultValue={currentMonth}
          className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base font-semibold text-slate-950 outline-none focus:border-primary"
        />
      </div>
      <button
        type="submit"
        className="min-h-14 rounded-full bg-slate-950 px-6 py-3 text-base font-bold text-white transition hover:bg-slate-800"
      >
        Apply
      </button>
    </form>
  );
}
