import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { languagePrefSchema } from "@/lib/validators";
import { ok, handleUnknownError } from "@/lib/utils/api";

/**
 * Persist locale/theme preference for logged-in users. For guests / anonymous
 * visitors the client cookie + localStorage is the source of truth, so this
 * endpoint no-ops gracefully without a session.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { locale, theme } = languagePrefSchema.parse(body);

    const session = await getSession();
    if (session) {
      await prisma.languagePreference.upsert({
        where: { userId: session.userId },
        create: {
          userId: session.userId,
          locale: locale ?? "en",
          theme: theme ?? "system",
        },
        update: {
          ...(locale ? { locale } : {}),
          ...(theme ? { theme } : {}),
        },
      });
    }
    return ok({ success: true });
  } catch (err) {
    return handleUnknownError(err);
  }
}
