import { prisma } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth/session";
import { created, tooManyRequests, handleUnknownError } from "@/lib/utils/api";
import { checkRateLimit, clientKey } from "@/lib/utils/rate-limit";

export async function POST(req: Request) {
  try {
    // Guest creation writes a DB row per call — keep it tightly limited.
    const rl = checkRateLimit(clientKey(req, "guest"), {
      max: 5,
      windowMs: 60_000,
    });
    if (!rl.allowed) return tooManyRequests();

    const user = await prisma.user.create({
      data: {
        isGuest: true,
        name: "Guest",
        languagePreference: { create: {} },
      },
    });
    await setSessionCookie({ userId: user.id, role: "student", isGuest: true });
    return created({ id: user.id, isGuest: true });
  } catch (err) {
    return handleUnknownError(err);
  }
}
