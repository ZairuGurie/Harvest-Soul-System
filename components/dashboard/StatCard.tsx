export default function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="hs-card-interactive rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm hover:border-harvest-gold/40 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-500/30">
      <p className="text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-harvest-blue-dark dark:text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
    </div>
  );
}
