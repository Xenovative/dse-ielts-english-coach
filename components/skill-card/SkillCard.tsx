"use client";

import { useTranslation } from "react-i18next";
import type { Skill } from "@/lib/types";

const ICONS: Record<Skill, string> = {
  reading: "📖",
  writing: "✍️",
  listening: "🎧",
  speaking: "🎙️",
};

export function SkillCard({
  skill,
  active,
  onClick,
}: {
  skill: Skill;
  active?: boolean;
  onClick?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[88px] flex-col items-center justify-center gap-1 rounded-2xl border p-4 text-center transition active:scale-[0.98] ${
        active
          ? "border-brand-500/50 bg-brand-500/15 text-brand-300 shadow-glow"
          : "border-sapphire-border bg-sapphire-card text-sapphire-text-dim hover:border-sapphire-border-glow hover:text-sapphire-text"
      }`}
    >
      <span className="text-2xl" aria-hidden>
        {ICONS[skill]}
      </span>
      <span className="text-xs font-medium">{t(`skill.${skill}`)}</span>
    </button>
  );
}
