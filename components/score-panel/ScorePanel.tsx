"use client";

import { useTranslation } from "react-i18next";

function scoreColor(percent: number): string {
  if (percent >= 75) return "text-emerald-400";
  if (percent >= 55) return "text-amber-400";
  return "text-rose-400";
}

export function ScorePanel({
  rawPercent,
  scaledScore,
  subScores,
}: {
  rawPercent: number;
  scaledScore: string;
  subScores?: Record<string, number>;
}) {
  const { t } = useTranslation();

  return (
    <div className="card-glow relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-sapphire-text-dim">{t("results.yourScore")}</p>
            <p className={`text-5xl font-extrabold ${scoreColor(rawPercent)}`}>
              {rawPercent}
              <span className="text-2xl">%</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-sapphire-text-dim">{t("results.scaledScore")}</p>
            <p className="text-2xl font-bold text-brand-400">{scaledScore}</p>
          </div>
        </div>

        {subScores && Object.keys(subScores).length > 0 && (
          <div className="mt-6 space-y-3">
            <p className="text-sm font-semibold text-white">{t("results.subScores")}</p>
            {Object.entries(subScores).map(([key, value]) => (
              <div key={key}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-sapphire-text-dim">{t(`rubric.${key}`, key)}</span>
                  <span className="font-medium text-white">{value}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-brand"
                    style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
