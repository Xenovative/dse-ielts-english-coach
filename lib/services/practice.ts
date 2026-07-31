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
