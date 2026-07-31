import { getSession } from "@/lib/auth/session";
import { getMistakeBank } from "@/lib/services/progress";
import type { Skill } from "@/lib/types";
import { ok, unauthorized, handleUnknownError } from "@/lib/utils/api";

const SKILLS = new Set<Skill>(["reading", "writing", "listening", "speaking"]);

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const url = new URL(req.url);
    const skillParam = url.searchParams.get("skill");
    const skill =
      skillParam && SKILLS.has(skillParam as Skill)
        ? (skillParam as Skill)
        : undefined;
    const limitRaw = Number(url.searchParams.get("limit") ?? "100");
    const limit = Number.isFinite(limitRaw) ? limitRaw : 100;

    const bank = await getMistakeBank(session.userId, { skill, limit });
    return ok(bank);
  } catch (err) {
    return handleUnknownError(err);
  }
}
