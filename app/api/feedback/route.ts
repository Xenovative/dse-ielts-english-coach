import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { resolveFeedbackProvider } from "@/lib/llm";
import { percentToScaled } from "@/lib/rubrics";
import { fromJson, toJson } from "@/lib/utils/json";
import { LOCALE_COOKIE, resolveLocale } from "@/lib/i18n/settings";
import { feedbackSchema } from "@/lib/validators";
import { ok, created, unauthorized, notFound, handleUnknownError } from "@/lib/utils/api";
import type { ExamCode, Skill } from "@/lib/types";

/**
 * POST /api/feedback { submissionId }
 * Generates (and caches) structured AI feedback for any skill.
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const body = await req.json();
    const { submissionId } = feedbackSchema.parse(body);

    const submission = await prisma.submission.findFirst({
      where: { id: submissionId, userId: session.userId },
      include: {
        session: {
          include: {
            paper: {
              include: {
                examMode: true,
                writingPrompts: true,
                speakingCards: true,
                questions: { orderBy: { order: "asc" } },
              },
            },
          },
        },
        feedback: true,
        skillScore: true,
        answers: true,
      },
    });
    if (!submission) return notFound("Submission not found");

    if (submission.feedback) {
      return ok({
        submissionId,
        provider: submission.feedback.provider,
        feedback: fromJson(submission.feedback.payload, null),
        cached: true,
      });
    }

    const paper = submission.session.paper;
    const examCode = paper.examMode.code as ExamCode;
    const skill = submission.skill as Skill;
    const cookieStore = await cookies();
    const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value);
    const provider = await resolveFeedbackProvider();

    const isObjective = skill === "reading" || skill === "listening";

    let feedback;
    if (isObjective) {
      const overallPercent = submission.skillScore?.rawPercent ?? 0;
      const answerByQ = new Map(
        submission.answers.map((a) => [a.questionId, a]),
      );
      feedback = await provider.generate({
        examCode,
        skill,
        rubricKey: `${skill}_objective`,
        responseText: `Objective ${skill} paper scored ${overallPercent}%`,
        taskPrompt: paper.title,
        locale,
        objectiveReview: {
          overallPercent,
          scaledScore:
            submission.skillScore?.scaledScore ??
            percentToScaled(examCode, overallPercent),
          subScores: { accuracy: overallPercent },
          questions: paper.questions.map((q) => {
            const ans = answerByQ.get(q.id);
            return {
              order: q.order,
              type: q.type,
              prompt: q.prompt,
              learnerAnswer: ans ? fromJson(ans.value, null) : null,
              correctAnswer: fromJson(q.answerKey, null),
              isCorrect: ans?.isCorrect ?? false,
              explanation: q.explanation,
            };
          }),
        },
      });
    } else {
      const rubricKey =
        paper.writingPrompts[0]?.rubricKey ??
        paper.speakingCards[0]?.rubricKey ??
        (skill === "writing"
          ? examCode === "DSE"
            ? "dse_writing"
            : "ielts_writing_academic"
          : examCode === "DSE"
            ? "dse_speaking"
            : "ielts_speaking");

      const taskPrompt =
        paper.writingPrompts[0]?.prompt ??
        paper.speakingCards[0]?.prompt ??
        paper.title;

      feedback = await provider.generate({
        examCode,
        skill,
        rubricKey,
        responseText: submission.responseText ?? "",
        taskPrompt,
        minWords:
          skill === "speaking" ? 40 : (paper.writingPrompts[0]?.minWords ?? 150),
        locale,
      });

      if (submission.skillScore) {
        await prisma.skillScore.update({
          where: { id: submission.skillScore.id },
          data: {
            rawPercent: feedback.overallScore,
            scaledScore: feedback.scaledScore,
            subScores: toJson(feedback.subScores),
          },
        });
      }
    }

    await prisma.feedback.create({
      data: {
        userId: session.userId,
        sessionId: submission.sessionId,
        submissionId: submission.id,
        provider: feedback.provider,
        payload: toJson(feedback),
      },
    });

    return created({
      submissionId,
      provider: feedback.provider,
      feedback,
      cached: false,
    });
  } catch (err) {
    return handleUnknownError(err);
  }
}
