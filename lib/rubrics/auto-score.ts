import type { QuestionType } from "@/lib/types";
import { fromJson } from "@/lib/utils/json";
import { normalizeAnswer } from "@/lib/utils/text";

/**
 * Deterministic auto-scoring for objective question types (reading & listening).
 * The answerKey is stored as a JSON string; its shape depends on the type.
 */

export interface ScoredAnswer {
  questionId: string;
  isCorrect: boolean;
  pointsAwarded: number;
  correctAnswer: unknown;
}

interface QuestionForScoring {
  id: string;
  type: QuestionType;
  answerKey: string; // JSON string
  points: number;
}

function matchesShortAnswer(response: string, key: unknown): boolean {
  const accepted = Array.isArray(key) ? key : [key];
  const norm = normalizeAnswer(response);
  return accepted.some((a) => normalizeAnswer(String(a)) === norm);
}

export function scoreQuestion(
  question: QuestionForScoring,
  rawResponse: unknown,
): ScoredAnswer {
  const key = fromJson<unknown>(question.answerKey, null);
  const response = rawResponse;
  let isCorrect = false;

  switch (question.type) {
    case "mcq":
    case "true_false_not_given": {
      isCorrect = String(response).trim() === String(key).trim();
      break;
    }
    case "short_answer":
    case "summary_completion": {
      isCorrect =
        typeof response === "string" && matchesShortAnswer(response, key);
      break;
    }
    case "matching": {
      // key: Record<string,string>, response: Record<string,string>
      if (
        key &&
        typeof key === "object" &&
        response &&
        typeof response === "object"
      ) {
        const keyObj = key as Record<string, string>;
        const resObj = response as Record<string, string>;
        const entries = Object.entries(keyObj);
        isCorrect =
          entries.length > 0 &&
          entries.every(
            ([k, v]) => normalizeAnswer(resObj[k] ?? "") === normalizeAnswer(v),
          );
      }
      break;
    }
    default:
      isCorrect = false;
  }

  return {
    questionId: question.id,
    isCorrect,
    pointsAwarded: isCorrect ? question.points : 0,
    correctAnswer: key,
  };
}

export interface ObjectiveResult {
  scored: ScoredAnswer[];
  totalPoints: number;
  earnedPoints: number;
  percent: number;
  wrongByType: Record<string, number>;
}

export function scoreObjective(
  questions: QuestionForScoring[],
  responses: Record<string, unknown>,
): ObjectiveResult {
  const scored = questions.map((q) => scoreQuestion(q, responses[q.id]));
  const totalPoints = questions.reduce((s, q) => s + q.points, 0);
  const earnedPoints = scored.reduce((s, a) => s + a.pointsAwarded, 0);
  const percent =
    totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

  const wrongByType: Record<string, number> = {};
  scored.forEach((a, i) => {
    if (!a.isCorrect) {
      const type = questions[i].type;
      wrongByType[type] = (wrongByType[type] ?? 0) + 1;
    }
  });

  return { scored, totalPoints, earnedPoints, percent, wrongByType };
}
