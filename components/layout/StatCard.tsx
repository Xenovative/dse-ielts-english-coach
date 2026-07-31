"use client";

export function StatCard({
  label,
  value,
  change,
  positive,
  onViewAll,
  viewAllLabel = "View all",
}: {
  label: string;
  value: string | number;
  change?: number;
  positive?: boolean;
  onViewAll?: () => void;
  viewAllLabel?: string;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-sapphire-text-dim">{label}</p>
        {change !== undefined && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              positive
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-rose-500/15 text-rose-400"
            }`}
          >
            {positive ? "+" : ""}
            {change}%
          </span>
        )}
      </div>
      <p className="text-3xl font-bold tracking-tight text-white">{value}</p>
      {onViewAll && (
        <button
          type="button"
          onClick={onViewAll}
          className="mt-auto flex items-center gap-1 text-[11px] font-medium text-brand-400 transition hover:text-brand-300"
        >
          {viewAllLabel}
          <span aria-hidden>→</span>
        </button>
      )}
    </div>
  );
}
