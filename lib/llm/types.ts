import type { ExamCode, Skill, StructuredFeedback } from "@/lib/types";

export interface ObjectiveQuestionReview {
  order: number;
  type: string;
  prompt: string;
  learnerAnswer: unknown;
  correctAnswer: unknown;
  isCorrect: boolean;
  explanation: string | null;
}

export interface FeedbackRequest {
  examCode: ExamCode;
  skill: Skill;
  rubricKey: string;
  /** Writing text or speaking transcript. For objective skills may be a summary. */
  responseText: string;
  /** Prompt / task the learner was responding to. */
  taskPrompt: string;
  minWords?: number;
  locale?: string;
  /**
   * When set (reading/listening), overall grade is FIXED from auto-scoring.
   * The model only analyses strengths, weaknesses, and improvement advice.
   */
  objectiveReview?: {
    overallPercent: number;
    scaledScore: string;
    subScores: Record<string, number>;
    questions: ObjectiveQuestionReview[];
  };
}

/**
 * Provider-agnostic feedback engine. Every provider returns the same
 * StructuredFeedback contract.
 */
export interface FeedbackProvider {
  readonly name: string;
  generate(req: FeedbackRequest): Promise<StructuredFeedback>;
}
