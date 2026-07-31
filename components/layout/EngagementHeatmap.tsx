"use client";

import { useTranslation } from "react-i18next";

/**
 * Weekly practice engagement heatmap — mirrors the reference dashboard grid.
 * Intensity is derived from score trend data when available, otherwise a
 * deterministic placeholder pattern so the widget always renders.
 */
export function EngagementHeatmap({
  data,
}: {
  data?: { date: string; percent: number }[];
}) {
  const { t } = useTranslation();

  const cells = buildCells(data);
  const weeks = 12;
  const days = 7;

  function intensity(pct: number): string {
    if (pct >= 80) return "bg-brand-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]";
    if (pct >= 60) return "bg-brand-600/80";
    if (pct >= 40) return "bg-brand-700/50";
    if (pct >= 20) return "bg-brand-900/40";
    return "bg-white/[0.04]";
  }

  return (
    <div className="card h-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white">{t("dashboard.trend")}</h3>
          <p className="text-xs text-sapphire-muted">{t("heatmap.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-sapphire-muted">
          <span>{t("heatmap.low")}</span>
          <div className="flex gap-0.5">
            {["bg-white/[0.04]", "bg-brand-900/40", "bg-brand-700/50", "bg-brand-600/80", "bg-brand-500"].map(
              (c) => (
                <span key={c} className={`h-2.5 w-2.5 rounded-sm ${c}`} />
              ),
            )}
          </div>
          <span>{t("heatmap.best")}</span>
        </div>
      </div>

      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: weeks * days }, (_, i) => {
          const pct = cells[i % cells.length] ?? 0;
          return (
            <div
              key={i}
              className={`aspect-square rounded-md transition ${intensity(pct)}`}
              title={`${pct}%`}
            />
          );
        })}
      </div>
    </div>
  );
}

function buildCells(data?: { date: string; percent: number }[]): number[] {
  if (data && data.length > 0) {
    const padded = [...data];
    while (padded.length < 84) {
      padded.unshift({ date: "", percent: 10 });
    }
    return padded.slice(-84).map((d) => d.percent);
  }
  // Placeholder pattern resembling the reference
  return Array.from({ length: 84 }, (_, i) => {
    const wave = Math.sin(i * 0.3) * 30 + 50;
    const spike = i % 17 === 0 ? 90 : 0;
    return Math.min(100, Math.max(0, Math.round(wave + spike)));
  });
}
