import { getSession } from "@/lib/auth/session";
import { getProgressSummary } from "@/lib/services/progress";
import { ok, unauthorized, handleUnknownError } from "@/lib/utils/api";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return unauthorized();
    const summary = await getProgressSummary(session.userId);
    return ok(summary);
  } catch (err) {
    return handleUnknownError(err);
  }
}
