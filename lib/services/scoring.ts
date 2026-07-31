import { prisma } from "@/lib/db";
import { scoreObjective } from "@/lib/rubrics/auto-score";
import { percentToScaled } from "@/lib/rubrics";
import { resolveFeedbackProvider } from "@/lib/llm";
import { MockFeedbackProvider } from "@/lib/llm/mock-provider";
import { toJson } from "@/lib/utils/json";
import type { ExamCode, QuestionType, Skill, StructuredFeedback } from "@/lib/types";
import type { SubmissionInput } from "@/lib/validators";

export class PaperNotFoundError extends Error {
  constructor(message = "Paper not found") {
    super(message);
    this.name = "PaperNotFoundError";
  }
}

/**
 * Create a submission, score it, generate AI coaching feedback for all skills,
 * and return scores + optional feedback payload.
 */
export async function createAndScoreSubmission(
  userId: string,
  input: SubmissionInput,
  options?: { locale?: string },
) {
  const paper = await prisma.paper.findUnique({
    where: { id: input.paperId },
    include: {
      examMode: true,
      questions: true,
      writingPrompts: true,
      speakingCards: true,
    },
  });
  if (!paper) throw new PaperNotFoundError();
  const examCode = paper.examMode.code as ExamCode;
  const skill = input.skill as Skill;

  const session = input.sessionId
    ? await prisma.practiceSession.findFirst({
        where: { id: input.sessionId, userId },
      })
    : null;
  const practiceSession =
    session ??
    (await prisma.practiceSession.create({
      data: { userId, paperId: paper.id, skill, status: "in_progress" },
    }));

  const submission = await prisma.submission.create({
    data: {
      sessionId: practiceSession.id,
      userId,
      skill,
      responseText: input.responseText ?? null,
      audioUrl: input.audioUrl ?? null,
    },
  });

  const isObjective = skill === "reading" || skill === "listening";

  let rawPercent = 0;
  let subScores: Record<string, number> = {};
  let perQuestion: Array<{
    questionId: string;
    isCorrect: boolean;
    correctAnswer: unknown;
    explanation: string | null;
  }> = [];
  let wrongByType: Record<string, number> = {};
  let aiFeedback: StructuredFeedback | null = null;

  const provider = await resolveFeedbackProvider();

  if (isObjective && input.answers) {
    const responses: Record<string, unknown> = {};
    for (const a of input.answers) responses[a.questionId] = a.value;

    const result = scoreObjective(
      paper.questions.map((q) => ({
        id: q.id,
        type: q.type as QuestionType,
        answerKey: q.answerKey,
        points: q.points,
      })),
      responses,
    );
    rawPercent = result.percent;
    wrongByType = result.wrongByType;
    subScores = { accuracy: result.percent };
    const scaled = percentToScaled(examCode, rawPercent);

    await prisma.$transaction(
      result.scored.map((s) =>
        prisma.answer.create({
          data: {
            submissionId: submission.id,
            questionId: s.questionId,
            value: toJson(responses[s.questionId] ?? null),
            isCorrect: s.isCorrect,
            pointsAwarded: s.pointsAwarded,
          },
        }),
      ),
    );

    perQuestion = paper.questions.map((q) => {
      const scored = result.scored.find((s) => s.questionId === q.id);
      return {
        questionId: q.id,
        isCorrect: scored?.isCorrect ?? false,
        correctAnswer: scored?.correctAnswer ?? null,
        explanation: q.explanation,
      };
    });

    try {
      aiFeedback = await provider.generate({
        examCode,
        skill,
        rubricKey: `${skill}_objective`,
        responseText: `Objective ${skill} paper scored ${rawPercent}%`,
        taskPrompt: paper.title,
        locale: options?.locale,
        objectiveReview: {
          overallPercent: rawPercent,
          scaledScore: scaled,
          subScores: { accuracy: rawPercent },
          questions: paper.questions.map((q) => {
            const scored = result.scored.find((s) => s.questionId === q.id);
            return {
              order: q.order,
              type: q.type,
              prompt: q.prompt,
              learnerAnswer: responses[q.id] ?? null,
              correctAnswer: scored?.correctAnswer ?? null,
              isCorrect: scored?.isCorrect ?? false,
              explanation: q.explanation,
            };
          }),
        },
      });
      if (aiFeedback.subScores && Object.keys(aiFeedback.subScores).length > 0) {
        subScores = {
          ...aiFeedback.subScores,
          accuracy: rawPercent,
        };
      }
    } catch (err) {
      console.warn("[scoring] objective AI feedback failed:", (err as Error).message);
    }
  } else {
    const rubricKey =
      paper.writingPrompts[0]?.rubricKey ??
      paper.speakingCards[0]?.rubricKey ??
      (skill === "writing"
        ? examCode === "DSE"
          ? "dse_writing"
          : examCode === "IELTS_GENERAL"
            ? "ielts_writing_general"
            : "ielts_writing_academic"
        : examCode === "DSE"
          ? "dse_speaking"
          : "ielts_speaking");

    const taskPrompt =
      paper.writingPrompts[0]?.prompt ??
      paper.speakingCards[0]?.prompt ??
      paper.title;

    const feedbackReq = {
      examCode,
      skill,
      rubricKey,
      responseText: input.responseText ?? "",
      taskPrompt,
      minWords:
        skill === "speaking" ? 40 : (paper.writingPrompts[0]?.minWords ?? 150),
      locale: options?.locale,
    };

    try {
      aiFeedback = await provider.generate(feedbackReq);
      rawPercent = aiFeedback.overallScore;
      subScores = aiFeedback.subScores;
    } catch (err) {
      console.warn("[scoring] AI scoring failed, using offline fallback:", (err as Error).message);
      const mock = new MockFeedbackProvider();
      aiFeedback = await mock.generate(feedbackReq);
      rawPercent = aiFeedback.overallScore;
      subScores = aiFeedback.subScores;
    }
  }

  // Persist feedback for all providers (including mock) so the UI never looks broken.
  if (aiFeedback) {
    await prisma.feedback.create({
      data: {
        userId,
        sessionId: practiceSession.id,
        submissionId: submission.id,
        provider: aiFeedback.provider,
        payload: toJson(aiFeedback),
      },
    });
  }

  const scaledScore = percentToScaled(examCode, rawPercent);

  const skillScore = await prisma.skillScore.create({
    data: {
      userId,
      sessionId: practiceSession.id,
      submissionId: submission.id,
      skill,
      examCode,
      rawPercent,
      scaledScore,
      subScores: toJson(subScores),
    },
  });

  await prisma.progressMetric.create({
    data: { userId, skill, examCode, value: rawPercent, bucket: "attempt" },
  });

  await prisma.practiceSession.update({
    where: { id: practiceSession.id },
    data: {
      status: "scored",
      submittedAt: new Date(),
      timeSpent: input.timeSpent ?? null,
    },
  });

  return {
    submissionId: submission.id,
    sessionId: practiceSession.id,
    skillScoreId: skillScore.id,
    examCode,
    skill,
    rawPercent,
    scaledScore,
    subScores,
    perQuestion,
    wrongByType,
    feedback: aiFeedback,
    provider: aiFeedback?.provider ?? null,
  };
}
