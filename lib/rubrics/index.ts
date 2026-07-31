import type { ExamCode, Skill } from "@/lib/types";
import { clamp } from "@/lib/utils/text";

/**
 * Deterministic scoring rubrics. Scoring is kept deterministic here so scores
 * never depend on an LLM — the LLM only *explains*. Two exam systems with
 * distinct scales:
 *   - DSE: levels 1, 2, 3, 4, 5, 5*, 5** (exam-style, localized)
 *   - IELTS: bands 0.0–9.0 in 0.5 steps (band descriptors)
 */

export interface RubricCriterion {
  key: string;
  // Human-readable label key (translated in messages via `rubric.<key>`)
  label: string;
  weight: number; // relative weight, summed then normalized
}

export interface Rubric {
  key: string;
  examCode: ExamCode;
  skill: Skill;
  criteria: RubricCriterion[];
}

// ---------------------------------------------------------------------------
// Scale mapping
// ---------------------------------------------------------------------------

const DSE_BANDS: { min: number; label: string }[] = [
  { min: 90, label: "Level 5**" },
  { min: 82, label: "Level 5*" },
  { min: 74, label: "Level 5" },
  { min: 64, label: "Level 4" },
  { min: 52, label: "Level 3" },
  { min: 40, label: "Level 2" },
  { min: 0, label: "Level 1" },
];

export function percentToDseLevel(percent: number): string {
  const p = clamp(percent, 0, 100);
  return DSE_BANDS.find((b) => p >= b.min)?.label ?? "Level 1";
}

export function percentToIeltsBand(percent: number): string {
  // Map 0-100 to 0-9 band, rounded to nearest 0.5.
  const p = clamp(percent, 0, 100);
  const band = Math.round((p / 100) * 9 * 2) / 2;
  return `Band ${band.toFixed(1)}`;
}

export function percentToScaled(examCode: ExamCode, percent: number): string {
  return examCode === "DSE"
    ? percentToDseLevel(percent)
    : percentToIeltsBand(percent);
}

// ---------------------------------------------------------------------------
// Rubric definitions
// ---------------------------------------------------------------------------

const DSE_WRITING: Rubric = {
  key: "dse_writing",
  examCode: "DSE",
  skill: "writing",
  criteria: [
    { key: "content", label: "rubric.content", weight: 7 },
    { key: "language", label: "rubric.language", weight: 7 },
    { key: "organization", label: "rubric.organization", weight: 7 },
  ],
};

const IELTS_WRITING_ACADEMIC: Rubric = {
  key: "ielts_writing_academic",
  examCode: "IELTS_ACADEMIC",
  skill: "writing",
  criteria: [
    { key: "taskResponse", label: "rubric.taskResponse", weight: 1 },
    { key: "coherence", label: "rubric.coherence", weight: 1 },
    { key: "lexical", label: "rubric.lexical", weight: 1 },
    { key: "grammar", label: "rubric.grammar", weight: 1 },
  ],
};

const IELTS_WRITING_GENERAL: Rubric = {
  ...IELTS_WRITING_ACADEMIC,
  key: "ielts_writing_general",
  examCode: "IELTS_GENERAL",
};

const DSE_SPEAKING: Rubric = {
  key: "dse_speaking",
  examCode: "DSE",
  skill: "speaking",
  criteria: [
    { key: "pronunciation", label: "rubric.pronunciation", weight: 1 },
    { key: "communication", label: "rubric.communication", weight: 1 },
    { key: "vocabulary", label: "rubric.vocabulary", weight: 1 },
    { key: "ideas", label: "rubric.ideas", weight: 1 },
  ],
};

const IELTS_SPEAKING: Rubric = {
  key: "ielts_speaking",
  examCode: "IELTS_ACADEMIC",
  skill: "speaking",
  criteria: [
    { key: "fluency", label: "rubric.fluency", weight: 1 },
    { key: "lexical", label: "rubric.lexical", weight: 1 },
    { key: "grammar", label: "rubric.grammar", weight: 1 },
    { key: "pronunciation", label: "rubric.pronunciation", weight: 1 },
  ],
};

export const RUBRICS: Record<string, Rubric> = {
  dse_writing: DSE_WRITING,
  ielts_writing_academic: IELTS_WRITING_ACADEMIC,
  ielts_writing_general: IELTS_WRITING_GENERAL,
  dse_speaking: DSE_SPEAKING,
  ielts_speaking: IELTS_SPEAKING,
};

export function getRubric(key: string): Rubric | null {
  return RUBRICS[key] ?? null;
}

/** Combine weighted sub-scores (0-100 each) into an overall percent. */
export function weightedOverall(
  rubric: Rubric,
  subScores: Record<string, number>,
): number {
  const totalWeight = rubric.criteria.reduce((s, c) => s + c.weight, 0);
  if (totalWeight === 0) return 0;
  const sum = rubric.criteria.reduce((acc, c) => {
    const v = clamp(subScores[c.key] ?? 0, 0, 100);
    return acc + v * c.weight;
  }, 0);
  return Math.round(sum / totalWeight);
}
