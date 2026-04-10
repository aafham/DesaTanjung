export function MonthFilter({ currentMonth }: { currentMonth: string }) {
  return (
    <form className="flex flex-col gap-2 rounded-3xl border border-line bg-white p-4 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor="month" className="mb-2 block text-sm font-medium text-slate-700">
          Filter month
        </label>
        <input
          id="month"
          name="month"
          type="month"
          defaultValue={currentMonth}
          className="w-full rounded-2xl border border-line px-4 py-3 outline-none focus:border-primary"
        />
      </div>
      <button
        type="submit"
        className="rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
      >
        Apply
      </button>
    </form>
  );
}
