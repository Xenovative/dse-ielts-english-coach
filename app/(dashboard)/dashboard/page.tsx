"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { StatCard } from "@/components/layout/StatCard";
import { HeroFeatureCard } from "@/components/layout/HeroFeatureCard";
import { EngagementHeatmap } from "@/components/layout/EngagementHeatmap";
import type { ProgressSummary } from "@/lib/types";
import type { ExamCode } from "@/lib/types";

const EXAM_CODES: ExamCode[] = ["DSE", "IELTS_ACADEMIC", "IELTS_GENERAL"];
const EXAM_EMOJI: Record<ExamCode, string> = {
  DSE: "🇭🇰",
  IELTS_ACADEMIC: "🎓",
  IELTS_GENERAL: "✈️",
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [data, setData] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/progress")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const totalAttempts = data?.totalAttempts ?? 0;
  const avgScore =
    data && data.recentScores.length > 0
      ? Math.round(
          data.recentScores.reduce((s, r) => s + r.rawPercent, 0) /
            data.recentScores.length,
        )
      : 0;
  const weakCount = data?.weakAreas.length ?? 0;
  const skillsPracticed = data ? Object.keys(data.bySkill).length : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero greeting */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
          {t("dashboard.welcome")}!{" "}
          <span className="text-sapphire-text-dim">{t("exam.chooseSkill")}?</span>
        </h1>
      </div>

      {/* Main grid — matches reference layout */}
      <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
        {/* Left stat column */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:col-span-4 lg:grid-cols-2 lg:grid-rows-2">
          <StatCard
            label={t("dashboard.attempts")}
            value={loading ? "—" : totalAttempts}
            onViewAll={() => router.push("/results")}
            viewAllLabel={t("actions.viewResults")}
          />
          <StatCard
            label={t("common.score")}
            value={loading ? "—" : `${avgScore}%`}
            positive={avgScore >= 50}
          />
          <StatCard
            label={t("dashboard.weakAreas")}
            value={loading ? "—" : weakCount}
            positive={weakCount === 0}
          />
          <StatCard
            label={t("dashboard.progress")}
            value={loading ? "—" : skillsPracticed}
            positive
          />
        </div>

        {/* Center hero feature card */}
        <div className="lg:col-span-5">
          <HeroFeatureCard />
        </div>

        {/* Right activity panel */}
        <div className="lg:col-span-3">
          <ActivityPanel data={data} loading={loading} />
        </div>
      </div>

      {/* Exam mode row */}
      <section>
        <p className="section-label !px-0">{t("exam.chooseMode")}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {EXAM_CODES.map((code) => (
            <Link
              key={code}
              href={`/practice?mode=${code}`}
              className="card group flex items-center gap-4 transition hover:border-sapphire-border-glow hover:bg-sapphire-card-hover"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/5 text-2xl">
                {EXAM_EMOJI[code]}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-white group-hover:text-brand-300">
                  {t(`exam.${code}`)}
                </p>
                <p className="text-xs text-sapphire-muted">{t("actions.startPractice")} →</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Bottom row: skill breakdown + heatmap */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SkillBreakdown data={data} loading={loading} />
        <EngagementHeatmap data={data?.trend} />
      </div>
    </div>
  );
}

function ActivityPanel({
  data,
  loading,
}: {
  data: ProgressSummary | null;
  loading: boolean;
}) {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const today = new Date().getDay();
  const todayIdx = today === 0 ? 6 : today - 1;
  // Locale-aware short weekday names, Monday-first.
  const dayFormatter = new Intl.DateTimeFormat(i18n.language, { weekday: "short" });
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (todayIdx - i));
    return { label: dayFormatter.format(d), dayOfMonth: d.getDate() };
  });

  return (
    <div className="card flex h-full flex-col">
      {/* Mini calendar strip */}
      <div className="mb-4 flex justify-between gap-1">
        {days.map((d, i) => (
          <div
            key={d.label}
            className={`flex flex-col items-center rounded-xl px-1.5 py-1.5 text-[10px] ${
              i === todayIdx
                ? "bg-gradient-brand font-bold text-white"
                : "text-sapphire-muted"
            }`}
          >
            <span>{d.label}</span>
            <span className="mt-0.5 text-[9px] opacity-70">{d.dayOfMonth}</span>
          </div>
        ))}
      </div>

      <h3 className="mb-3 font-semibold text-white">{t("dashboard.recentScores")}</h3>

      {loading ? (
        <p className="text-sm text-sapphire-muted">{t("common.loading")}</p>
      ) : !data || data.recentScores.length === 0 ? (
        <p className="text-sm text-sapphire-muted">{t("dashboard.noScores")}</p>
      ) : (
        <ul className="flex-1 space-y-3">
          {data.recentScores.slice(0, 4).map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-3 rounded-2xl border border-sapphire-border bg-sapphire-surface p-3"
            >
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-300">
                {s.rawPercent}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">
                  {t(`skill.${s.skill}`)}
                </p>
                <p className="truncate text-[10px] text-sapphire-muted">{s.scaledScore}</p>
              </div>
              <div className="flex -space-x-1">
                {[1, 2].map((n) => (
                  <span
                    key={n}
                    className="grid h-6 w-6 place-items-center rounded-full border border-sapphire-border bg-sapphire-card text-[8px] text-sapphire-muted"
                  >
                    {n === 1 ? "AI" : "✓"}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => router.push("/practice")}
        className="btn-primary mt-4 w-full text-xs"
      >
        {t("actions.startPractice")}
      </button>
    </div>
  );
}

function SkillBreakdown({
  data,
  loading,
}: {
  data: ProgressSummary | null;
  loading: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="card">
      <h3 className="mb-4 font-semibold text-white">{t("dashboard.progress")}</h3>
      {loading ? (
        <p className="text-sm text-sapphire-muted">{t("common.loading")}</p>
      ) : !data || Object.keys(data.bySkill).length === 0 ? (
        <p className="text-sm text-sapphire-muted">{t("dashboard.noScores")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(data.bySkill).map(([skill, v]) => (
            <div
              key={skill}
              className="rounded-2xl border border-sapphire-border bg-sapphire-surface p-4 text-center"
            >
              <p className="text-[10px] font-medium uppercase tracking-wide text-sapphire-muted">
                {t(`skill.${skill}`)}
              </p>
              <p className="mt-1 text-2xl font-bold text-white">{v.avgPercent}%</p>
              <p className="mt-0.5 text-[10px] text-sapphire-muted">
                {v.attempts} {t("dashboard.attempts")}
              </p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-brand"
                  style={{ width: `${v.avgPercent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.weakAreas.length > 0 && (
        <div className="mt-4 border-t border-sapphire-border pt-4">
          <p className="mb-2 text-xs font-semibold text-sapphire-text-dim">
            {t("dashboard.weakAreas")}
          </p>
          <ul className="space-y-2">
            {data.weakAreas.map((w) => (
              <li
                key={w.skill}
                className="flex items-center justify-between rounded-xl bg-rose-500/10 px-3 py-2 text-sm"
              >
                <span className="font-medium text-rose-300">{t(`skill.${w.skill}`)}</span>
                <span className="font-bold text-rose-400">{w.avgPercent}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
