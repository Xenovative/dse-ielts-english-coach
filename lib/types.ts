/**
 * Shared domain types used across UI, API, and scoring engine. These are the
 * "contract" types — DB rows are mapped into these before crossing boundaries.
 */

export type Locale = "en" | "zh-Hant" | "zh-Hans";
export type Theme = "light" | "dark" | "system";

export type ExamCode = "DSE" | "IELTS_ACADEMIC" | "IELTS_GENERAL";
export type Skill = "reading" | "writing" | "listening" | "speaking";

export type QuestionType =
  | "mcq"
  | "true_false_not_given"
  | "matching"
  | "short_answer"
  | "summary_completion";

export interface QuestionOption {
  id: string;
  label: string;
}

export interface PublicQuestion {
  id: string;
  type: QuestionType;
  order: number;
  prompt: string;
  options: QuestionOption[] | null;
  points: number;
  // answerKey / explanation are intentionally omitted from the public payload
  // until after submission.
}

export interface PublicPractice {
  paperId: string;
  examCode: ExamCode;
  skill: Skill;
  title: string;
  timeLimit: number | null;
  passages: { id: string; title: string | null; body: string; order: number }[];
  audioAssets: { id: string; url: string; transcript: string | null; order: number }[];
  questions: PublicQuestion[];
  writingPrompt?: {
    id: string;
    taskType: string;
    prompt: string;
    minWords: number;
    rubricKey: string;
  } | null;
  speakingCard?: {
    id: string;
    part: string;
    prompt: string;
    followUps: string[];
    prepTime: number | null;
    speakTime: number | null;
    rubricKey: string;
  } | null;
}

// ---- AI feedback contract (provider-agnostic) ----

export interface FeedbackMistake {
  excerpt: string;
  issue: string;
  suggestion: string;
  category: "grammar" | "vocabulary" | "coherence" | "task" | "pronunciation" | "fluency" | "relevance";
}

export interface StructuredFeedback {
  overallScore: number; // 0-100 raw
  scaledScore: string; // "Level 4" (DSE) or "Band 6.5" (IELTS)
  subScores: Record<string, number>;
  strengths: string[];
  mistakes: FeedbackMistake[];
  corrections: string[];
  improvedVersion?: string;
  nextSteps: string[];
  provider: string;
}

export interface ProgressSummary {
  recentScores: {
    id: string;
    skill: Skill;
    examCode: string;
    rawPercent: number;
    scaledScore: string;
    createdAt: string;
  }[];
  bySkill: Record<
    string,
    { avgPercent: number; attempts: number; latest: number }
  >;
  weakAreas: { skill: Skill; avgPercent: number; wrongTypes: string[] }[];
  trend: { date: string; percent: number }[];
  totalAttempts: number;
}

/** Wrong-answer Q&A row stored per student for review / spaced practice. */
export interface MistakeItem {
  id: string;
  skill: Skill;
  examCode: ExamCode;
  paperTitle: string;
  questionType: QuestionType;
  prompt: string;
  yourAnswer: unknown;
  correctAnswer: unknown;
  explanation: string | null;
  answeredAt: string;
  paperId: string;
}

export interface MistakeBank {
  items: MistakeItem[];
  total: number;
  bySkill: Record<string, number>;
}
