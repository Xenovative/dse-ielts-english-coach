import { getRubric, percentToScaled, weightedOverall } from "@/lib/rubrics";
import { countWords } from "@/lib/utils/text";
import type { FeedbackRequest } from "./types";

/**
 * Deterministic, explainable heuristics that produce rubric sub-scores from a
 * response WITHOUT any LLM. These scores are the source of truth. LLM providers
 * reuse them so numbers are reproducible; the model only writes prose around
 * them.
 *
 * The heuristics are intentionally transparent (length, lexical variety,
 * sentence structure, connectives, task keyword overlap) so behavior is
 * predictable and testable — not a black box.
 */

const CONNECTIVES = [
  "however",
  "therefore",
  "moreover",
  "furthermore",
  "in addition",
  "for example",
  "on the other hand",
  "as a result",
  "consequently",
  "although",
  "whereas",
  "firstly",
  "secondly",
  "finally",
  "in conclusion",
];

function scale(value: number, min: number, max: number): number {
  if (value <= min) return 0;
  if (value >= max) return 100;
  return Math.round(((value - min) / (max - min)) * 100);
}

export interface DeterministicResult {
  subScores: Record<string, number>;
  overallPercent: number;
  scaledScore: string;
  signals: {
    wordCount: number;
    uniqueRatio: number;
    avgSentenceLen: number;
    connectiveCount: number;
    keywordOverlap: number;
  };
}

export function computeDeterministicScore(
  req: FeedbackRequest,
): DeterministicResult {
  const rubric = getRubric(req.rubricKey);
  const text = req.responseText.trim();
  const words = text.toLowerCase().match(/[a-z']+/g) ?? [];
  const wordCount = countWords(text);
  const unique = new Set(words);
  const uniqueRatio = words.length ? unique.size / words.length : 0;
  const sentences = text.split(/[.!?。！？]+/).filter((s) => s.trim().length > 0);
  const avgSentenceLen = sentences.length ? words.length / sentences.length : 0;
  const lower = text.toLowerCase();
  const connectiveCount = CONNECTIVES.filter((c) => lower.includes(c)).length;

  const taskWords = new Set(
    (req.taskPrompt.toLowerCase().match(/[a-z']{4,}/g) ?? []).slice(0, 40),
  );
  const overlapCount = [...taskWords].filter((w) => lower.includes(w)).length;
  const keywordOverlap = taskWords.size ? overlapCount / taskWords.size : 0;

  const minWords = req.minWords ?? 150;

  // Individual criterion signals, each 0-100.
  const lengthScore = scale(wordCount, minWords * 0.4, minWords * 1.2);
  const lexicalScore = Math.round(
    0.6 * scale(uniqueRatio, 0.35, 0.65) + 0.4 * scale(unique.size, 40, 180),
  );
  const coherenceScore = Math.round(
    0.5 * scale(connectiveCount, 1, 8) +
      0.5 * scale(avgSentenceLen, 8, 22),
  );
  const grammarScore = Math.round(
    0.5 * scale(avgSentenceLen, 6, 20) + 0.5 * scale(uniqueRatio, 0.3, 0.6),
  );
  const taskScore = Math.round(
    0.6 * scale(keywordOverlap, 0.1, 0.6) + 0.4 * lengthScore,
  );

  // Map generic signals to whatever criteria the specific rubric declares.
  const map: Record<string, number> = {
    content: taskScore,
    language: Math.round((lexicalScore + grammarScore) / 2),
    organization: coherenceScore,
    taskResponse: taskScore,
    coherence: coherenceScore,
    lexical: lexicalScore,
    grammar: grammarScore,
    fluency: coherenceScore,
    pronunciation: Math.round((grammarScore + lexicalScore) / 2),
    communication: taskScore,
    vocabulary: lexicalScore,
    ideas: taskScore,
    relevance: taskScore,
  };

  const subScores: Record<string, number> = {};
  if (rubric) {
    for (const c of rubric.criteria) {
      subScores[c.key] = map[c.key] ?? Math.round((taskScore + lexicalScore) / 2);
    }
  } else {
    subScores.overall = Math.round((taskScore + lexicalScore + coherenceScore) / 3);
  }

  const overallPercent = rubric
    ? weightedOverall(rubric, subScores)
    : subScores.overall;
  const scaledScore = percentToScaled(req.examCode, overallPercent);

  return {
    subScores,
    overallPercent,
    scaledScore,
    signals: {
      wordCount,
      uniqueRatio: Math.round(uniqueRatio * 100) / 100,
      avgSentenceLen: Math.round(avgSentenceLen * 10) / 10,
      connectiveCount,
      keywordOverlap: Math.round(keywordOverlap * 100) / 100,
    },
  };
}
