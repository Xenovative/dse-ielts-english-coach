"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import type { ExamCode } from "@/lib/types";

const ICONS: Record<ExamCode, string> = {
  DSE: "🇭🇰",
  IELTS_ACADEMIC: "🎓",
  IELTS_GENERAL: "✈️",
};

export function ExamModeCard({ code }: { code: ExamCode }) {
  const { t } = useTranslation();
  return (
    <Link
      href={`/practice?mode=${code}`}
      className="card group flex items-center gap-4 transition hover:border-brand-400 hover:shadow-md"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-2xl dark:bg-brand-900/40" aria-hidden>
        {ICONS[code]}
      </span>
      <div className="min-w-0">
        <p className="truncate font-semibold group-hover:text-brand-600 dark:group-hover:text-brand-300">
          {t(`exam.${code}`)}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t("actions.startPractice")} →
        </p>
      </div>
    </Link>
  );
}
