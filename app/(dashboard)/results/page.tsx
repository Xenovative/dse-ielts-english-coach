"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ProgressChart } from "@/components/progress-chart/ProgressChart";
import type { ProgressSummary } from "@/lib/types";

export default function ResultsPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/progress")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-white md:text-3xl">{t("results.title")}</h1>
        <p className="mt-1 text-sm text-sapphire-text-dim">{t("dashboard.recentScores")}</p>
      </div>

      {loading ? (
        <p className="text-sm text-sapphire-muted">{t("common.loading")}</p>
      ) : !data || data.recentScores.length === 0 ? (
        <div className="card flex flex-col items-center py-12 text-center">
          <p className="text-sapphire-muted">{t("dashboard.noScores")}</p>
          <Link href="/practice" className="btn-primary mt-4">
            {t("actions.startPractice")}
          </Link>
        </div>
      ) : (
        <>
          {data.trend.length > 1 && (
            <div className="card">
              <h2 className="mb-4 font-semibold text-white">{t("dashboard.trend")}</h2>
              <ProgressChart data={data.trend} />
            </div>
          )}

          <div className="card">
            <h2 className="mb-4 font-semibold text-white">{t("dashboard.recentScores")}</h2>
            <ul className="space-y-3">
              {data.recentScores.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-2xl border border-sapphire-border bg-sapphire-surface p-4"
                >
                  <div>
                    <p className="font-semibold text-white">
                      {t(`exam.${s.examCode}`)} · {t(`skill.${s.skill}`)}
                    </p>
                    <p className="text-xs text-sapphire-muted">
                      {new Date(s.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{s.rawPercent}%</p>
                    <p className="text-xs font-semibold text-brand-400">{s.scaledScore}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
