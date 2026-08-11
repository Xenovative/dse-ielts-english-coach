"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { SkillCard } from "@/components/skill-card/SkillCard";
import type { ExamCode, Skill } from "@/lib/types";

const EXAMS: ExamCode[] = ["DSE", "IELTS_ACADEMIC", "IELTS_GENERAL"];
const SKILLS: Skill[] = ["reading", "writing", "listening", "speaking"];

export function PracticeLibrary() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useSearchParams();

  const mode = (params.get("mode") as ExamCode) || undefined;
  const skill = (params.get("skill") as Skill) || undefined;

  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needExam, setNeedExam] = useState(false);
  const autoStartedKey = useRef<string | null>(null);

  const startPractice = useCallback(
    async (examCode: ExamCode, skillCode: Skill) => {
      setStarting(true);
      setError(null);
      setNeedExam(false);
      try {
        const qs = new URLSearchParams({ mode: examCode, skill: skillCode });
        const res = await fetch(`/api/practice/next?${qs.toString()}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.paperId) {
          setError(
            data?.error?.message || t("practice.noPapers"),
          );
          setStarting(false);
          return;
        }
        router.replace(`/practice?paper=${data.paperId}`);
      } catch {
        setError(t("practice.startFailed"));
        setStarting(false);
      }
    },
    [router, t],
  );

  // Deep links with mode+skill auto-start once.
  useEffect(() => {
    if (!mode || !skill || starting) return;
    const key = `${mode}:${skill}`;
    if (autoStartedKey.current === key) return;
    autoStartedKey.current = key;
    void startPractice(mode, skill);
  }, [mode, skill, starting, startPractice]);

  function setExam(exam?: ExamCode) {
    const qs = new URLSearchParams();
    if (exam) qs.set("mode", exam);
    setError(null);
    setNeedExam(false);
    autoStartedKey.current = null;
    router.push(qs.toString() ? `/practice?${qs.toString()}` : "/practice");
  }

  function onSkillClick(s: Skill) {
    if (!mode) {
      setNeedExam(true);
      setError(null);
      return;
    }
    autoStartedKey.current = `${mode}:${s}`;
    void startPractice(mode, s);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-white md:text-3xl">
          {t("practice.title")}
        </h1>
        <p className="mt-1 text-sm text-sapphire-text-dim">
          {t("practice.subtitle")}
        </p>
      </div>

      <div>
        <p className="section-label !px-0">{t("practice.filterByExam")}</p>
        <div className="flex flex-wrap gap-2">
          {EXAMS.map((e) => (
            <FilterChip key={e} active={mode === e} onClick={() => setExam(e)}>
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
              active={skill === s && !!mode}
              onClick={() => onSkillClick(s)}
            />
          ))}
        </div>
      </div>

      {needExam && (
        <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {t("practice.pickExamFirst")}
        </p>
      )}

      {starting && (
        <p className="text-sm text-sapphire-muted">{t("practice.starting")}</p>
      )}

      {error && !starting && (
        <p className="rounded-2xl border border-dashed border-sapphire-border px-4 py-3 text-sm text-sapphire-muted">
          {error}
        </p>
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
