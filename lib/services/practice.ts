import { prisma } from "@/lib/db";
import { fromJson } from "@/lib/utils/json";
import type {
  ExamCode,
  PublicPractice,
  PublicQuestion,
  QuestionOption,
  QuestionType,
  Skill,
} from "@/lib/types";

/**
 * Load a paper and shape it into a PUBLIC practice payload. Critically, answer
 * keys, explanations, and audio transcripts-as-answers are stripped so the
 * client cannot see solutions before submitting.
 */
export async function getPublicPractice(
  paperId: string,
): Promise<PublicPractice | null> {
  const paper = await prisma.paper.findUnique({
    where: { id: paperId },
    include: {
      examMode: true,
      passages: { orderBy: { order: "asc" } },
      audioAssets: { orderBy: { order: "asc" } },
      questions: { orderBy: { order: "asc" } },
      writingPrompts: true,
      speakingCards: true,
    },
  });
  if (!paper) return null;

  const questions: PublicQuestion[] = paper.questions.map((q) => ({
    id: q.id,
    type: q.type as QuestionType,
    order: q.order,
    prompt: q.prompt,
    options: fromJson<QuestionOption[] | null>(q.options, null),
    points: q.points,
  }));

  const writing = paper.writingPrompts[0];
  const speaking = paper.speakingCards[0];

  return {
    paperId: paper.id,
    examCode: paper.examMode.code as ExamCode,
    skill: paper.skill as Skill,
    title: paper.title,
    timeLimit: paper.timeLimit,
    passages: paper.passages.map((p) => ({
      id: p.id,
      title: p.title,
      body: p.body,
      order: p.order,
    })),
    // For listening we expose the audio URL but NOT the transcript up front.
    audioAssets: paper.audioAssets.map((a) => ({
      id: a.id,
      url: a.url,
      transcript: null,
      order: a.order,
    })),
    questions,
    writingPrompt: writing
      ? {
          id: writing.id,
          taskType: writing.taskType,
          prompt: writing.prompt,
          minWords: writing.minWords,
          rubricKey: writing.rubricKey,
        }
      : null,
    speakingCard: speaking
      ? {
          id: speaking.id,
          part: speaking.part,
          prompt: speaking.prompt,
          followUps: fromJson<string[]>(speaking.followUps, []),
          prepTime: speaking.prepTime,
          speakTime: speaking.speakTime,
          rubricKey: speaking.rubricKey,
        }
      : null,
  };
}

export async function listPractices(filter: {
  examCode?: ExamCode;
  skill?: Skill;
}) {
  const papers = await prisma.paper.findMany({
    where: {
      skill: filter.skill,
      examMode: filter.examCode ? { code: filter.examCode } : undefined,
    },
    include: {
      examMode: true,
      _count: { select: { questions: true } },
    },
    orderBy: [{ year: "desc" }, { createdAt: "desc" }],
  });

  return papers.map((p) => ({
    paperId: p.id,
    examCode: p.examMode.code as ExamCode,
    examName: p.examMode.name,
    skill: p.skill as Skill,
    title: p.title,
    year: p.year,
    source: p.source,
    timeLimit: p.timeLimit,
    questionCount: p._count.questions,
  }));
}

/**
 * Pure helper: prefer unused paper ids; when all are completed, reset the pool.
 * `rng` defaults to Math.random for production; inject in tests.
 */
export function chooseRandomUnused(
  allIds: string[],
  completedIds: Iterable<string>,
  rng: () => number = Math.random,
): string | null {
  if (allIds.length === 0) return null;
  const done = new Set(completedIds);
  const unused = allIds.filter((id) => !done.has(id));
  const pool = unused.length > 0 ? unused : allIds;
  const index = Math.floor(rng() * pool.length);
  return pool[Math.min(index, pool.length - 1)] ?? null;
}

/**
 * Pick the next practice paper for a user: random among papers they have not
 * finished for this exam+skill. When every paper is finished, reset the pool.
 */
export async function pickNextPracticePaper(
  userId: string,
  examCode: ExamCode,
  skill: Skill,
): Promise<string | null> {
  const papers = await prisma.paper.findMany({
    where: {
      skill,
      examMode: { code: examCode },
    },
    select: { id: true },
  });
  const allIds = papers.map((p) => p.id);
  if (allIds.length === 0) return null;

  const completedSessions = await prisma.practiceSession.findMany({
    where: {
      userId,
      skill,
      status: { in: ["submitted", "scored"] },
      paperId: { in: allIds },
    },
    select: { paperId: true },
    distinct: ["paperId"],
  });
  const completedIds = completedSessions.map((s) => s.paperId);

  return chooseRandomUnused(allIds, completedIds);
}
