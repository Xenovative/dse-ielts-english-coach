"use client";

import { useTranslation } from "react-i18next";
import type { PublicQuestion } from "@/lib/types";

export interface QuestionResult {
  isCorrect: boolean;
  correctAnswer: unknown;
  explanation: string | null;
}

interface Props {
  question: PublicQuestion;
  index: number;
  value: unknown;
  onChange: (value: unknown) => void;
  result?: QuestionResult;
  disabled?: boolean;
}

const TFNG_OPTIONS = ["True", "False", "Not Given"];

export function QuestionRenderer({
  question,
  index,
  value,
  onChange,
  result,
  disabled,
}: Props) {
  const { t } = useTranslation();
  const reviewing = !!result;

  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-500/20 text-sm font-semibold text-brand-300">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-white">{question.prompt}</p>

          <div className="mt-3 space-y-2">
            {(question.type === "mcq" && question.options) && (
              question.options.map((opt) => (
                <OptionRow
                  key={opt.id}
                  label={opt.label}
                  selected={value === opt.id}
                  correct={reviewing ? result?.correctAnswer === opt.id : undefined}
                  disabled={disabled}
                  onSelect={() => onChange(opt.id)}
                />
              ))
            )}

            {question.type === "true_false_not_given" &&
              TFNG_OPTIONS.map((opt) => (
                <OptionRow
                  key={opt}
                  label={opt}
                  selected={value === opt}
                  correct={reviewing ? result?.correctAnswer === opt : undefined}
                  disabled={disabled}
                  onSelect={() => onChange(opt)}
                />
              ))}

            {(question.type === "short_answer" ||
              question.type === "summary_completion") && (
              <input
                type="text"
                className="input"
                value={typeof value === "string" ? value : ""}
                disabled={disabled}
                placeholder={t("common.yourAnswer")}
                onChange={(e) => onChange(e.target.value)}
              />
            )}

            {question.type === "matching" && question.options && (
              <div className="space-y-2">
                {question.options.map((opt) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <span className="w-8 text-sm font-medium">{opt.id}</span>
                    <input
                      type="text"
                      className="input"
                      disabled={disabled}
                      value={
                        value && typeof value === "object"
                          ? (value as Record<string, string>)[opt.id] ?? ""
                          : ""
                      }
                      placeholder={opt.label}
                      onChange={(e) =>
                        onChange({
                          ...(value && typeof value === "object" ? value : {}),
                          [opt.id]: e.target.value,
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {reviewing && (
            <div
              className={`mt-3 rounded-lg p-3 text-sm ${
                result!.isCorrect
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
              }`}
            >
              <p className="font-semibold">
                {result!.isCorrect ? `✓ ${t("common.correct")}` : `✕ ${t("common.incorrect")}`}
              </p>
              {!result!.isCorrect && (
                <p className="mt-1">
                  {t("common.correctAnswer")}:{" "}
                  <span className="font-medium">{formatAnswer(result!.correctAnswer)}</span>
                </p>
              )}
              {result!.explanation && (
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  {t("common.explanation")}: {result!.explanation}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OptionRow({
  label,
  selected,
  correct,
  disabled,
  onSelect,
}: {
  label: string;
  selected: boolean;
  correct?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  let cls =
    "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition ";
  if (correct === true) {
    cls += "border-emerald-500/50 bg-emerald-500/10 text-emerald-300";
  } else if (correct === false && selected) {
    cls += "border-rose-500/50 bg-rose-500/10 text-rose-300";
  } else if (selected) {
    cls += "border-brand-500/50 bg-brand-500/15 text-white";
  } else {
    cls += "border-sapphire-border bg-sapphire-surface text-sapphire-text-dim hover:border-sapphire-border-glow hover:text-sapphire-text";
  }

  return (
    <button type="button" onClick={onSelect} disabled={disabled} className={cls}>
      <span
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
          selected ? "border-brand-500 bg-brand-500 text-white" : "border-sapphire-border"
        }`}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-white" />}
      </span>
      {label}
    </button>
  );
}

function formatAnswer(answer: unknown): string {
  if (answer == null) return "—";
  if (Array.isArray(answer)) return answer.join(" / ");
  if (typeof answer === "object")
    return Object.entries(answer as Record<string, string>)
      .map(([k, v]) => `${k}→${v}`)
      .join(", ");
  return String(answer);
}
