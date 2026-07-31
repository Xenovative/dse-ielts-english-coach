import { prisma } from "@/lib/db";
import { toJson } from "@/lib/utils/json";
import type { AdminPaperInput } from "@/lib/validators";

const EXAM_META: Record<string, { name: string; description: string }> = {
  DSE: { name: "HKDSE English", description: "Hong Kong Diploma of Secondary Education — English Language" },
  IELTS_ACADEMIC: { name: "IELTS Academic", description: "International English Language Testing System — Academic" },
  IELTS_GENERAL: { name: "IELTS General Training", description: "International English Language Testing System — General Training" },
};

async function ensureExamMode(code: string) {
  const meta = EXAM_META[code] ?? { name: code, description: "" };
  return prisma.examMode.upsert({
    where: { code },
    create: { code, name: meta.name, description: meta.description },
    update: {},
  });
}

/**
 * Ingest one paper (with passages, audio, questions, prompts) from validated
 * JSON. Used by both the admin API and the seed script so official and
 * generated content share exactly one code path.
 */
export async function ingestPaper(input: AdminPaperInput) {
  const examMode = await ensureExamMode(input.examCode);

  const paper = await prisma.paper.create({
    data: {
      examModeId: examMode.id,
      skill: input.skill,
      title: input.title,
      year: input.year ?? null,
      source: input.source,
      timeLimit: input.timeLimit ?? null,
    },
  });

  // Passages (indexable by passageRef on questions)
  const passageIds: string[] = [];
  for (const p of input.passages ?? []) {
    const created = await prisma.passage.create({
      data: { paperId: paper.id, title: p.title ?? null, body: p.body, order: p.order },
    });
    passageIds.push(created.id);
  }

  // Audio assets (indexable by audioRef on questions)
  const audioIds: string[] = [];
  for (const a of input.audioAssets ?? []) {
    const created = await prisma.audioAsset.create({
      data: {
        paperId: paper.id,
        url: a.url,
        transcript: a.transcript ?? null,
        durationMs: a.durationMs ?? null,
        order: a.order,
      },
    });
    audioIds.push(created.id);
  }

  for (const q of input.questions ?? []) {
    await prisma.question.create({
      data: {
        paperId: paper.id,
        passageId: q.passageRef != null ? passageIds[q.passageRef] ?? null : null,
        audioAssetId: q.audioRef != null ? audioIds[q.audioRef] ?? null : null,
        type: q.type,
        order: q.order,
        prompt: q.prompt,
        options: q.options != null ? toJson(q.options) : null,
        answerKey: toJson(q.answerKey),
        evidence: q.evidence != null ? toJson(q.evidence) : null,
        explanation: q.explanation ?? null,
        points: q.points,
      },
    });
  }

  if (input.writingPrompt) {
    await prisma.writingPrompt.create({
      data: {
        paperId: paper.id,
        taskType: input.writingPrompt.taskType,
        prompt: input.writingPrompt.prompt,
        minWords: input.writingPrompt.minWords,
        timeLimit: input.writingPrompt.timeLimit ?? null,
        rubricKey: input.writingPrompt.rubricKey,
      },
    });
  }

  if (input.speakingCard) {
    await prisma.speakingCard.create({
      data: {
        paperId: paper.id,
        part: input.speakingCard.part,
        prompt: input.speakingCard.prompt,
        followUps: input.speakingCard.followUps ? toJson(input.speakingCard.followUps) : null,
        prepTime: input.speakingCard.prepTime ?? null,
        speakTime: input.speakingCard.speakTime ?? null,
        rubricKey: input.speakingCard.rubricKey,
      },
    });
  }

  return paper;
}
