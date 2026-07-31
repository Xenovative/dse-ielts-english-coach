"use client";

import { useTranslation } from "react-i18next";
import { countWords } from "@/lib/utils/text";

export function WritingEditor({
  value,
  onChange,
  minWords,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  minWords: number;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const words = countWords(value);
  const met = words >= minWords;

  return (
    <div className="card">
      <textarea
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("writing.placeholder")}
        rows={14}
        className="w-full resize-y rounded-xl border border-slate-300 bg-white p-4 text-base leading-relaxed focus:border-brand-500 dark:border-slate-600 dark:bg-slate-800"
      />
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className={met ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"}>
          {t("common.wordCount")}: {words}
        </span>
        <span className="text-slate-400">
          {t("writing.minWords")}: {minWords}
        </span>
      </div>
    </div>
  );
}
