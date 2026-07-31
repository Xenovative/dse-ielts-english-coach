import { getSession } from "@/lib/auth/session";
import { ingestPaper } from "@/lib/services/content";
import { adminPaperSchema } from "@/lib/validators";
import { created, forbidden, unauthorized, handleUnknownError } from "@/lib/utils/api";

/**
 * POST /api/admin/content — ingest one paper of official/mock/custom content.
 * Admin only.
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();
    if (session.role !== "admin") return forbidden("Admin access required");

    const body = await req.json();
    const input = adminPaperSchema.parse(body);
    const paper = await ingestPaper(input);
    return created({ paperId: paper.id, title: paper.title });
  } catch (err) {
    return handleUnknownError(err);
  }
}
