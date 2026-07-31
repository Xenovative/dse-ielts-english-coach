import { getPublicPractice, listPractices } from "@/lib/services/practice";
import { practiceQuerySchema } from "@/lib/validators";
import { ok, notFound, handleUnknownError } from "@/lib/utils/api";

/**
 * GET /api/practice?mode=&skill=&paper=
 * - with `paper`: returns the full public practice (no answer keys).
 * - otherwise: returns a filtered list of available papers.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = practiceQuerySchema.parse({
      mode: url.searchParams.get("mode") || undefined,
      skill: url.searchParams.get("skill") || undefined,
      paper: url.searchParams.get("paper") || undefined,
    });

    if (parsed.paper) {
      const practice = await getPublicPractice(parsed.paper);
      if (!practice) return notFound("Paper not found");
      return ok(practice);
    }

    const papers = await listPractices({
      examCode: parsed.mode,
      skill: parsed.skill,
    });
    return ok({ papers });
  } catch (err) {
    return handleUnknownError(err);
  }
}
