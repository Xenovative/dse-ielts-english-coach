"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import type { MistakeBank, Skill } from "@/lib/types";

const SKILLS: (Skill | "all")[] = [
  "all",
  "reading",
  "writing",
  "listening",
  "speaking",
];

function formatAnswer(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.join(" / ");
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export default function MistakesPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<MistakeBank | null>(null);
  const [loading, setLoading] = useState(true);
  const [skill, setSkill] = useState<Skill | "all">("all");

  useEffect(() => {
    setLoading(true);
    const qs = skill === "all" ? "" : `?skill=${skill}`;
    fetch(`/api/mistakes${qs}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [skill]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-white md:text-3xl">
          {t("mistakes.title")}
        </h1>
        <p className="mt-1 text-sm text-sapphire-text-dim">
          {t("mistakes.subtitle")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SKILLS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSkill(s)}
            className={
              skill === s
                ? "rounded-full bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white"
                : "rounded-full border border-sapphire-border bg-sapphire-surface px-3 py-1.5 text-xs text-sapphire-text-dim hover:text-white"
            }
          >
            {s === "all" ? t("practice.all") : t(`skill.${s}`)}
            {data && s !== "all" && data.bySkill[s]
              ? ` (${data.bySkill[s]})`
              : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-sapphire-muted">{t("common.loading")}</p>
      ) : !data || data.items.length === 0 ? (
        <div className="card flex flex-col items-center py-12 text-center">
          <p className="text-sapphire-muted">{t("mistakes.empty")}</p>
          <Link href="/practice?mode=DSE" className="btn-primary mt-4">
            {t("actions.startPractice")}
          </Link>
        </div>
      ) : (
        <>
          <p className="text-xs text-sapphire-muted">
            {t("mistakes.showing", {
              shown: data.items.length,
              total: data.total,
            })}
          </p>
          <ul className="space-y-3">
            {data.items.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-sapphire-border bg-sapphire-surface p-4"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wide text-sapphire-muted">
                  <span>{t(`exam.${item.examCode}`)}</span>
                  <span>·</span>
                  <span>{t(`skill.${item.skill}`)}</span>
                  <span>·</span>
                  <span>{item.questionType.replace(/_/g, " ")}</span>
                  <span className="ml-auto normal-case tracking-normal">
                    {new Date(item.answeredAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm font-semibold text-white">{item.prompt}</p>
                <p className="mt-1 text-xs text-sapphire-muted">
                  {item.paperTitle}
                </p>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                    <p className="text-[10px] font-semibold uppercase text-red-300">
                      {t("common.yourAnswer")}
                    </p>
                    <p className="mt-1 text-sapphire-text">
                      {formatAnswer(item.yourAnswer)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <p className="text-[10px] font-semibold uppercase text-emerald-300">
                      {t("common.correctAnswer")}
                    </p>
                    <p className="mt-1 text-sapphire-text">
                      {formatAnswer(item.correctAnswer)}
                    </p>
                  </div>
                </div>
                {item.explanation && (
                  <p className="mt-3 text-xs text-sapphire-text-dim">
                    <span className="font-semibold text-sapphire-muted">
                      {t("common.explanation")}:{" "}
                    </span>
                    {item.explanation}
                  </p>
                )}
                <Link
                  href={`/practice?mode=${item.examCode}&skill=${item.skill}`}
                  className="mt-3 inline-block text-xs font-semibold text-brand-400 hover:text-brand-300"
                >
                  {t("mistakes.retrySkill")} →
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
