import { getSession } from "@/lib/auth/session";
import { pickNextPracticePaper } from "@/lib/services/practice";
import { practiceNextQuerySchema } from "@/lib/validators";
import { ok, unauthorized, notFound, handleUnknownError } from "@/lib/utils/api";

/**
 * GET /api/practice/next?mode=&skill=
 * Picks a random unused paper for the user (resets pool when all completed).
 */
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const url = new URL(req.url);
    const parsed = practiceNextQuerySchema.parse({
      mode: url.searchParams.get("mode") || undefined,
      skill: url.searchParams.get("skill") || undefined,
    });

    const paperId = await pickNextPracticePaper(
      session.userId,
      parsed.mode,
      parsed.skill,
    );
    if (!paperId) {
      return notFound("No practices available for this exam and skill");
    }

    return ok({ paperId });
  } catch (err) {
    return handleUnknownError(err);
  }
}
