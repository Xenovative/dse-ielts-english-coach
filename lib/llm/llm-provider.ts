import type { StructuredFeedback } from "@/lib/types";
import { getRubric, percentToScaled, weightedOverall } from "@/lib/rubrics";
import { computeDeterministicScore } from "./deterministic-score";
import type { FeedbackProvider, FeedbackRequest } from "./types";

/**
 * Shared LLM-backed provider (OpenRouter, OpenAI, Groq, Ollama).
 */

interface ChatConfig {
  name: string;
  endpoint: string;
  model: string;
  headers: Record<string, string>;
  jsonMode?: boolean;
}

const FEEDBACK_LANGUAGE: Record<string, string> = {
  en: "English",
  "zh-Hant": "Traditional Chinese (as used in Hong Kong)",
  "zh-Hans": "Simplified Chinese",
};

function clamp(n: number, lo = 0, hi = 100): number {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function buildFreeTextPrompt(
  req: FeedbackRequest,
  criterionKeys: string[],
  det: ReturnType<typeof computeDeterministicScore>,
): { system: string; user: string } {
  const feedbackLanguage = FEEDBACK_LANGUAGE[req.locale ?? "en"] ?? "English";
  const skillHint =
    req.skill === "speaking"
      ? [
          "You are marking a SPEAKING exam from a speech-to-text transcript.",
          "Judge communication, ideas, vocabulary, grammar/fluency signals visible in the words spoken.",
          "For pronunciation: infer cautiously from transcript clarity; do not invent audio issues you cannot see.",
          "A short, vague, off-topic, or repetitive answer must score clearly lower than a developed, relevant answer.",
        ].join(" ")
      : [
          "You are marking a WRITING exam response.",
          "Judge task achievement, organisation, vocabulary, and grammar from the text.",
          "Short, vague, off-topic, or repetitive writing must score clearly lower than developed, relevant writing.",
        ].join(" ");

  const system = [
    "You are an expert HKDSE / IELTS English examiner.",
    skillHint,
    "Mark FAIRLY and DIFFERENTLY for different answers — never give a generic template score.",
    `Rubric criteria to score (each 0-100 integers): ${criterionKeys.join(", ")}.`,
    "Return STRICT JSON with keys:",
    "subScores (object mapping each criterion key to 0-100),",
    "strengths (string[]),",
    "mistakes (array of {excerpt,issue,suggestion,category}),",
    "corrections (string[]),",
    "improvedVersion (string),",
    "nextSteps (string[]).",
    "Ground every comment in the learner's actual words; quote short excerpts.",
    `Write explanatory prose in ${feedbackLanguage}.`,
    "Keep quoted learner excerpts, corrections, and improvedVersion in English.",
  ].join(" ");

  const user = JSON.stringify({
    exam: req.examCode,
    skill: req.skill,
    rubricKey: req.rubricKey,
    task: req.taskPrompt,
    measuredSignals: det.signals,
    heuristicBaseline: {
      note: "Optional reference only — prefer your own fair judgment.",
      overall: det.overallPercent,
      subScores: det.subScores,
    },
    learnerResponse: req.responseText.slice(0, 6000),
  });

  return { system, user };
}

function buildObjectivePrompt(req: FeedbackRequest): { system: string; user: string } {
  const feedbackLanguage = FEEDBACK_LANGUAGE[req.locale ?? "en"] ?? "English";
  const review = req.objectiveReview!;
  const wrong = review.questions.filter((q) => !q.isCorrect);
  const correct = review.questions.filter((q) => q.isCorrect);

  const system = [
    "You are an expert HKDSE / IELTS English exam coach.",
    `The learner just finished a ${req.skill.toUpperCase()} paper.`,
    "The overall grade is ALREADY FIXED from answer keys — do NOT invent a different overall score.",
    "Your job is to analyse performance: strengths, weaknesses, and how to improve.",
    "Return STRICT JSON with keys:",
    "strengths (string[]),",
    "mistakes (array of {excerpt,issue,suggestion,category}),",
    "corrections (string[]),",
    "nextSteps (string[]),",
    "subScores (optional object with keys like accuracy, comprehension, detail, inference — each 0-100).",
    "Focus on patterns in wrong answers (e.g. detail questions, inference, vocabulary).",
    "Be specific and actionable — never generic filler.",
    `Write explanatory prose in ${feedbackLanguage}.`,
    "Keep English excerpts from questions/answers in English.",
  ].join(" ");

  const user = JSON.stringify({
    exam: req.examCode,
    skill: req.skill,
    paper: req.taskPrompt,
    fixedGrade: {
      overallPercent: review.overallPercent,
      scaledScore: review.scaledScore,
      subScores: review.subScores,
    },
    summary: {
      total: review.questions.length,
      correct: correct.length,
      wrong: wrong.length,
    },
    correctSamples: correct.slice(0, 6).map((q) => ({
      q: q.order + 1,
      type: q.type,
      prompt: q.prompt.slice(0, 220),
    })),
    wrongAnswers: wrong.slice(0, 18).map((q) => ({
      q: q.order + 1,
      type: q.type,
      prompt: q.prompt.slice(0, 280),
      learnerAnswer: q.learnerAnswer,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    })),
  });

  return { system, user };
}

async function callChat(
  cfg: ChatConfig,
  system: string,
  user: string,
): Promise<Record<string, unknown>> {
  const body: Record<string, unknown> = {
    model: cfg.model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.35,
    stream: false,
  };
  if (cfg.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const timeoutMs = Number(process.env.AI_TIMEOUT_MS || 35000);
  const res = await fetch(cfg.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...cfg.headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(Number.isFinite(timeoutMs) ? timeoutMs : 35000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`${cfg.name} request failed: ${res.status} ${detail.slice(0, 200)}`);
  }
  const data = await res.json();
  const content: string =
    data?.choices?.[0]?.message?.content ?? data?.message?.content ?? "";
  return parseJsonObject(content);
}

function parseJsonObject(content: string): Record<string, unknown> {
  const start = content.indexOf("{");
  if (start < 0) throw new Error("No JSON found in model response");
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < content.length; i++) {
    const ch = content[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return JSON.parse(content.slice(start, i + 1)) as Record<string, unknown>;
      }
    }
  }
  throw new Error("Unbalanced JSON in model response");
}

function extractSubScores(
  parsed: Record<string, unknown>,
  criterionKeys: string[],
  fallback: Record<string, number>,
): Record<string, number> {
  const raw =
    parsed.subScores && typeof parsed.subScores === "object"
      ? (parsed.subScores as Record<string, unknown>)
      : parsed.scores && typeof parsed.scores === "object"
        ? (parsed.scores as Record<string, unknown>)
        : {};

  const out: Record<string, number> = {};
  for (const key of criterionKeys) {
    const v = raw[key];
    out[key] =
      typeof v === "number"
        ? clamp(v)
        : typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))
          ? clamp(Number(v))
          : fallback[key] ?? 40;
  }
  return out;
}

function applyLengthGuard(
  req: FeedbackRequest,
  subScores: Record<string, number>,
  wordCount: number,
): Record<string, number> {
  const min =
    req.skill === "speaking" ? 25 : (req.minWords ?? 150) * 0.35;
  if (wordCount <= 0) {
    return Object.fromEntries(Object.keys(subScores).map((k) => [k, 5]));
  }
  if (wordCount < min * 0.4) {
    return Object.fromEntries(
      Object.entries(subScores).map(([k, v]) => [k, clamp(Math.min(v, 35))]),
    );
  }
  if (wordCount < min) {
    return Object.fromEntries(
      Object.entries(subScores).map(([k, v]) => [k, clamp(Math.min(v, 55))]),
    );
  }
  return subScores;
}

function objectiveFallback(req: FeedbackRequest, reason: string): StructuredFeedback {
  const review = req.objectiveReview!;
  const wrong = review.questions.filter((q) => !q.isCorrect);
  return {
    overallScore: review.overallPercent,
    scaledScore: review.scaledScore,
    subScores: review.subScores,
    strengths:
      review.overallPercent >= 70
        ? ["You answered most questions correctly."]
        : review.overallPercent >= 40
          ? ["You showed partial understanding of the paper."]
          : ["Keep practising — review the explanations for each wrong answer."],
    mistakes: wrong.slice(0, 5).map((q) => ({
      excerpt: q.prompt.slice(0, 120),
      issue: `Incorrect answer on Q${q.order + 1} (${q.type}).`,
      suggestion: q.explanation || "Re-read the relevant part and compare with the correct answer.",
      category: "task" as const,
    })),
    corrections: [],
    nextSteps: [
      "Review every wrong question and its explanation.",
      "Practice the same question types you missed.",
      reason.includes("failed")
        ? "AI coaching was temporarily unavailable; retry for richer feedback."
        : "Focus on your weakest question types next session.",
    ],
    provider: `${req.objectiveReview ? "objective" : "unknown"}:heuristic`,
  };
}

function heuristicFallbackFeedback(
  req: FeedbackRequest,
  det: ReturnType<typeof computeDeterministicScore>,
  providerName: string,
  reason: string,
): StructuredFeedback {
  if (req.objectiveReview) {
    const fb = objectiveFallback(req, reason);
    return { ...fb, provider: `${providerName}:heuristic` };
  }
  return {
    overallScore: det.overallPercent,
    scaledScore: det.scaledScore,
    subScores: det.subScores,
    strengths: ["Heuristic score used because live AI marking was unavailable."],
    mistakes: [
      {
        excerpt: "(system)",
        issue: reason,
        suggestion:
          "Check OPENROUTER_API_KEY / Ollama / Groq configuration in .env.",
        category: "task",
      },
    ],
    corrections: [],
    nextSteps: ["Retry feedback after AI is available for a fuller examiner-style mark."],
    provider: `${providerName}:heuristic`,
  };
}

export class LlmFeedbackProvider implements FeedbackProvider {
  readonly name: string;
  private cfg: ChatConfig;

  constructor(cfg: ChatConfig) {
    this.name = cfg.name;
    this.cfg = cfg;
  }

  async generate(req: FeedbackRequest): Promise<StructuredFeedback> {
    // Reading / listening: fixed grade + AI coaching analysis
    if (req.objectiveReview) {
      try {
        const { system, user } = buildObjectivePrompt(req);
        const parsed = await callChat(this.cfg, system, user);
        const base = req.objectiveReview.subScores;
        const aiSubs = extractSubScores(
          parsed,
          Object.keys(base).length > 0
            ? Object.keys(base)
            : ["accuracy", "comprehension", "detail", "inference"],
          { accuracy: req.objectiveReview.overallPercent, ...base },
        );
        // Keep accuracy locked to the real mark; allow coaching dimensions.
        const subScores = {
          ...aiSubs,
          accuracy: req.objectiveReview.overallPercent,
        };
        return {
          overallScore: req.objectiveReview.overallPercent,
          scaledScore: req.objectiveReview.scaledScore,
          subScores,
          strengths: asStringArray(parsed.strengths),
          mistakes: asMistakes(parsed.mistakes),
          corrections: asStringArray(parsed.corrections),
          nextSteps: asStringArray(parsed.nextSteps),
          provider: this.name,
        };
      } catch (err) {
        console.warn(`[llm:${this.name}] objective AI failed:`, (err as Error).message);
        return heuristicFallbackFeedback(
          req,
          computeDeterministicScore({
            ...req,
            responseText: req.responseText || "n/a",
          }),
          this.name,
          (err as Error).message || "AI request failed",
        );
      }
    }

    const det = computeDeterministicScore(req);
    const rubric = getRubric(req.rubricKey);
    const criterionKeys = rubric
      ? rubric.criteria.map((c) => c.key)
      : Object.keys(det.subScores);

    try {
      const { system, user } = buildFreeTextPrompt(req, criterionKeys, det);
      const parsed = await callChat(this.cfg, system, user);
      let subScores = extractSubScores(parsed, criterionKeys, det.subScores);
      subScores = applyLengthGuard(req, subScores, det.signals.wordCount);

      const overallPercent = rubric
        ? weightedOverall(rubric, subScores)
        : clamp(
            Object.values(subScores).reduce((a, b) => a + b, 0) /
              Math.max(1, Object.keys(subScores).length),
          );
      const scaledScore = percentToScaled(req.examCode, overallPercent);

      return {
        overallScore: overallPercent,
        scaledScore,
        subScores,
        strengths: asStringArray(parsed.strengths),
        mistakes: asMistakes(parsed.mistakes),
        corrections: asStringArray(parsed.corrections),
        improvedVersion:
          typeof parsed.improvedVersion === "string"
            ? parsed.improvedVersion
            : undefined,
        nextSteps: asStringArray(parsed.nextSteps),
        provider: this.name,
      };
    } catch (err) {
      console.warn(`[llm:${this.name}] AI mark failed:`, (err as Error).message);
      return heuristicFallbackFeedback(
        req,
        det,
        this.name,
        (err as Error).message || "AI request failed",
      );
    }
  }
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
}

function asMistakes(v: unknown): StructuredFeedback["mistakes"] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((m) => m && typeof m === "object")
    .map((m) => {
      const o = m as Record<string, unknown>;
      return {
        excerpt: String(o.excerpt ?? ""),
        issue: String(o.issue ?? ""),
        suggestion: String(o.suggestion ?? ""),
        category: ([
          "grammar",
          "vocabulary",
          "coherence",
          "task",
          "pronunciation",
          "fluency",
          "relevance",
        ].includes(String(o.category))
          ? o.category
          : "task") as StructuredFeedback["mistakes"][number]["category"],
      };
    });
}

export function openAiProvider(): LlmFeedbackProvider {
  return new LlmFeedbackProvider({
    name: "openai",
    endpoint: `${process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"}/chat/completions`,
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY || ""}` },
    jsonMode: true,
  });
}

/** OpenRouter (OpenAI-compatible). https://openrouter.ai */
export function openRouterProvider(): LlmFeedbackProvider {
  const referer = process.env.OPENROUTER_SITE_URL || "http://localhost:3001";
  const title = process.env.OPENROUTER_APP_NAME || "DSE IELTS English Coach";
  return new LlmFeedbackProvider({
    name: "openrouter",
    endpoint: `${process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1"}/chat/completions`,
    model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY || ""}`,
      "HTTP-Referer": referer,
      "X-Title": title,
    },
    jsonMode: true,
  });
}

export function groqProvider(): LlmFeedbackProvider {
  return new LlmFeedbackProvider({
    name: "groq",
    endpoint: `${process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1"}/chat/completions`,
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY || ""}` },
    jsonMode: true,
  });
}

export function ollamaProvider(): LlmFeedbackProvider {
  return new LlmFeedbackProvider({
    name: "ollama",
    endpoint: `${process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434"}/v1/chat/completions`,
    model: process.env.OLLAMA_MODEL || "llama3.2",
    headers: {},
    jsonMode: true,
  });
}
