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
          aria-describedby="month-filter-help"
          className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base font-semibold text-slate-950 outline-none focus:border-primary"
        />
        <p id="month-filter-help" className="mt-2 text-sm text-muted">
          Choose a report or admin working month, then apply to refresh the page data.
        </p>
      </div>
      <button
        type="submit"
        aria-label="Apply selected month filter"
        className="min-h-14 rounded-full bg-slate-950 px-6 py-3 text-base font-bold text-white transition hover:bg-slate-800"
      >
        Apply
      </button>
    </form>
  );
}
