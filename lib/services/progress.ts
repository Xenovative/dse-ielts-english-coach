import { prisma } from "@/lib/db";
import { fromJson } from "@/lib/utils/json";
import type {
  ExamCode,
  MistakeBank,
  MistakeItem,
  ProgressSummary,
  QuestionType,
  Skill,
} from "@/lib/types";

export type { ProgressSummary, MistakeBank, MistakeItem };

export async function getProgressSummary(
  userId: string,
): Promise<ProgressSummary> {
  const scores = await prisma.skillScore.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const bySkill: ProgressSummary["bySkill"] = {};
  for (const s of scores) {
    const entry = bySkill[s.skill] ?? { avgPercent: 0, attempts: 0, latest: 0 };
    entry.attempts += 1;
    entry.avgPercent += s.rawPercent;
    bySkill[s.skill] = entry;
  }
  for (const skill of Object.keys(bySkill)) {
    const e = bySkill[skill];
    e.avgPercent = Math.round(e.avgPercent / e.attempts);
    const latest = scores.find((s) => s.skill === skill);
    e.latest = latest ? Math.round(latest.rawPercent) : 0;
  }

  // Weak areas: skills with avg below 65, plus most-missed question types from
  // the last few wrong-answer records.
  const wrongAgg = await prisma.answer.findMany({
    where: { submission: { userId }, isCorrect: false },
    include: { question: { select: { type: true } } },
    take: 200,
  });
  const wrongTypeCount: Record<string, number> = {};
  for (const a of wrongAgg) {
    const t = a.question.type;
    wrongTypeCount[t] = (wrongTypeCount[t] ?? 0) + 1;
  }
  const topWrongTypes = Object.entries(wrongTypeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => t);

  const weakAreas = Object.entries(bySkill)
    .filter(([, v]) => v.avgPercent < 65)
    .sort((a, b) => a[1].avgPercent - b[1].avgPercent)
    .map(([skill, v]) => ({
      skill: skill as Skill,
      avgPercent: v.avgPercent,
      wrongTypes: topWrongTypes,
    }));

  const trend = [...scores]
    .reverse()
    .slice(-12)
    .map((s) => ({
      date: s.createdAt.toISOString().slice(0, 10),
      percent: Math.round(s.rawPercent),
    }));

  return {
    recentScores: scores.slice(0, 8).map((s) => ({
      id: s.id,
      skill: s.skill as Skill,
      examCode: s.examCode,
      rawPercent: Math.round(s.rawPercent),
      scaledScore: s.scaledScore,
      createdAt: s.createdAt.toISOString(),
    })),
    bySkill,
    weakAreas,
    trend,
    totalAttempts: scores.length,
  };
}

export async function getSubmissionFeedback(userId: string, submissionId: string) {
  const feedback = await prisma.feedback.findFirst({
    where: { submissionId, userId },
  });
  if (!feedback) return null;
  return {
    id: feedback.id,
    provider: feedback.provider,
    payload: fromJson(feedback.payload, null),
    createdAt: feedback.createdAt.toISOString(),
  };
}

/**
 * Per-student Q&A mistake bank — every wrong Answer row, with prompt + key,
 * so learners (and tutors) can review progress by question.
 */
export async function getMistakeBank(
  userId: string,
  opts: { skill?: Skill; limit?: number } = {},
): Promise<MistakeBank> {
  const limit = Math.min(opts.limit ?? 100, 200);
  const where = {
    isCorrect: false as const,
    submission: {
      userId,
      ...(opts.skill ? { skill: opts.skill } : {}),
    },
  };

  const [rows, total] = await Promise.all([
    prisma.answer.findMany({
      where,
      orderBy: { submission: { createdAt: "desc" } },
      take: limit,
      include: {
        question: {
          select: {
            type: true,
            prompt: true,
            answerKey: true,
            explanation: true,
          },
        },
        submission: {
          select: {
            skill: true,
            createdAt: true,
            session: {
              select: {
                paper: {
                  select: {
                    id: true,
                    title: true,
                    examMode: { select: { code: true } },
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.answer.count({ where }),
  ]);

  const bySkill: Record<string, number> = {};
  const items: MistakeItem[] = rows.map((a) => {
    const skill = a.submission.skill as Skill;
    bySkill[skill] = (bySkill[skill] ?? 0) + 1;
    return {
      id: a.id,
      skill,
      examCode: a.submission.session.paper.examMode.code as ExamCode,
      paperTitle: a.submission.session.paper.title,
      paperId: a.submission.session.paper.id,
      questionType: a.question.type as QuestionType,
      prompt: a.question.prompt,
      yourAnswer: fromJson(a.value, a.value),
      correctAnswer: fromJson(a.question.answerKey, a.question.answerKey),
      explanation: a.question.explanation,
      answeredAt: a.submission.createdAt.toISOString(),
    };
  });

  return { items, total, bySkill };
}
