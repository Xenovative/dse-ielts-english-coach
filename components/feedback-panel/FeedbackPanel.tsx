"use client";

import { useTranslation } from "react-i18next";
import type { StructuredFeedback } from "@/lib/types";

export function FeedbackPanel({ feedback }: { feedback: StructuredFeedback }) {
  const { t } = useTranslation();

  const improveFromMistakes = feedback.mistakes
    .map((m) => m.suggestion)
    .filter(Boolean);
  const areasToImprove = [
    ...new Set([...improveFromMistakes, ...feedback.nextSteps]),
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-brand-500/30 bg-brand-500/10 p-4">
        <p className="text-sm text-sapphire-text-dim">{t("results.aiMarking")}</p>
        <p className="mt-1 text-2xl font-bold text-white">
          {feedback.scaledScore}{" "}
          <span className="text-base font-medium text-sapphire-text-dim">
            ({feedback.overallScore}%)
          </span>
        </p>
        {Object.keys(feedback.subScores).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(feedback.subScores).map(([k, v]) => (
              <span
                key={k}
                className="rounded-full border border-sapphire-border bg-sapphire-card px-3 py-1 text-xs text-sapphire-text"
              >
                {t(`rubric.${k}`, k)}: {v}
              </span>
            ))}
          </div>
        )}
      </div>

      {feedback.strengths.length > 0 && (
        <Section title={t("results.strengths")} tone="good">
          <ul className="list-disc space-y-1 pl-5">
            {feedback.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </Section>
      )}

      {areasToImprove.length > 0 && (
        <Section title={t("results.areasToImprove")} tone="bad">
          <ul className="list-disc space-y-1 pl-5">
            {areasToImprove.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </Section>
      )}

      {feedback.mistakes.length > 0 && (
        <Section title={t("results.mistakes")} tone="bad">
          <ul className="space-y-3">
            {feedback.mistakes.map((m, i) => (
              <li
                key={i}
                className="rounded-lg border border-sapphire-border bg-sapphire-bg/50 p-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-300">
                  {t(`rubric.${m.category}`, m.category)}
                </p>
                {m.excerpt && (
                  <p className="mt-1 italic text-sapphire-text-dim">
                    “{m.excerpt}”
                  </p>
                )}
                <p className="mt-1 text-sapphire-text">{m.issue}</p>
                <p className="mt-1 text-emerald-300">→ {m.suggestion}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {feedback.corrections.length > 0 && (
        <Section title={t("results.corrections")} tone="neutral">
          <ul className="list-disc space-y-1 pl-5">
            {feedback.corrections.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </Section>
      )}

      {feedback.improvedVersion && (
        <Section title={t("results.improvedVersion")} tone="neutral">
          <p className="whitespace-pre-wrap leading-relaxed">
            {feedback.improvedVersion}
          </p>
        </Section>
      )}

      {feedback.nextSteps.length > 0 && (
        <Section title={t("results.nextSteps")} tone="neutral">
          <ol className="list-decimal space-y-1 pl-5">
            {feedback.nextSteps.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ol>
        </Section>
      )}

      <p className="text-right text-xs text-sapphire-muted">
        {feedback.provider.includes("mock") ||
        feedback.provider.includes("heuristic")
          ? `engine: ${feedback.provider}`
          : `${t("results.aiMarking")} · ${feedback.provider}`}
      </p>
    </div>
  );
}

function Section({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "good" | "bad" | "neutral";
  children: React.ReactNode;
}) {
  const toneCls =
    tone === "good"
      ? "border-emerald-500/30 bg-emerald-500/10"
      : tone === "bad"
        ? "border-rose-500/30 bg-rose-500/10"
        : "border-sapphire-border bg-sapphire-card";
  return (
    <div className={`rounded-2xl border p-4 ${toneCls}`}>
      <h3 className="mb-2 font-semibold text-white">{title}</h3>
      <div className="text-sm text-sapphire-text">{children}</div>
    </div>
  );
}
