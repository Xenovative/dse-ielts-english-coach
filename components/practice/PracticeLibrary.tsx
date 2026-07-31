"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { SkillCard } from "@/components/skill-card/SkillCard";
import type { ExamCode, Skill } from "@/lib/types";

interface PaperListItem {
  paperId: string;
  examCode: ExamCode;
  examName: string;
  skill: Skill;
  title: string;
  year: number | null;
  source: string;
  timeLimit: number | null;
  questionCount: number;
}

const EXAMS: ExamCode[] = ["DSE", "IELTS_ACADEMIC", "IELTS_GENERAL"];
const SKILLS: Skill[] = ["reading", "writing", "listening", "speaking"];

export function PracticeLibrary() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useSearchParams();

  const mode = (params.get("mode") as ExamCode) || undefined;
  const skill = (params.get("skill") as Skill) || undefined;

  const [papers, setPapers] = useState<PaperListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qs = new URLSearchParams();
    if (mode) qs.set("mode", mode);
    if (skill) qs.set("skill", skill);
    setLoading(true);
    fetch(`/api/practice?${qs.toString()}`)
      .then((r) => r.json())
      .then((d) => setPapers(d.papers ?? []))
      .catch(() => setPapers([]))
      .finally(() => setLoading(false));
  }, [mode, skill]);

  function setFilter(key: "mode" | "skill", value?: string) {
    const qs = new URLSearchParams(params.toString());
    if (value) qs.set(key, value);
    else qs.delete(key);
    router.push(`/practice?${qs.toString()}`);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-white md:text-3xl">{t("practice.title")}</h1>
        <p className="mt-1 text-sm text-sapphire-text-dim">{t("exam.chooseMode")}</p>
      </div>

      <div>
        <p className="section-label !px-0">{t("practice.filterByExam")}</p>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={!mode} onClick={() => setFilter("mode")}>
            {t("practice.all")}
          </FilterChip>
          {EXAMS.map((e) => (
            <FilterChip key={e} active={mode === e} onClick={() => setFilter("mode", e)}>
              {t(`exam.${e}`)}
            </FilterChip>
          ))}
        </div>
      </div>

      <div>
        <p className="section-label !px-0">{t("practice.filterBySkill")}</p>
        <div className="grid grid-cols-4 gap-2 sm:max-w-md">
          {SKILLS.map((s) => (
            <SkillCard
              key={s}
              skill={s}
              active={skill === s}
              onClick={() => setFilter("skill", skill === s ? undefined : s)}
            />
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-sapphire-muted">{t("common.loading")}</p>
      ) : papers.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-sapphire-border p-8 text-center text-sapphire-muted">
          {t("practice.noPapers")}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {papers.map((p) => (
            <Link
              key={p.paperId}
              href={`/practice?paper=${p.paperId}`}
              className="card group transition hover:border-sapphire-border-glow hover:bg-sapphire-card-hover"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-0.5 text-xs font-medium text-brand-300">
                  {t(`exam.${p.examCode}`)}
                </span>
                {p.year && <span className="text-xs text-sapphire-muted">{p.year}</span>}
              </div>
              <h3 className="mt-2 font-semibold text-white group-hover:text-brand-300">
                {p.title}
              </h3>
              <p className="mt-1 text-sm text-sapphire-muted">
                {t(`skill.${p.skill}`)}
                {p.questionCount > 0 && ` · ${p.questionCount} ${t("practice.questions")}`}
                {p.timeLimit && ` · ${Math.round(p.timeLimit / 60)} ${t("common.minutes")}`}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? "chip-active min-h-[40px]" : "chip min-h-[40px]"}
    >
      {children}
    </button>
  );
}
