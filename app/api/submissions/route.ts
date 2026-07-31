import { cookies } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { createAndScoreSubmission } from "@/lib/services/scoring";
import { submissionSchema } from "@/lib/validators";
import { sanitizeText } from "@/lib/utils/text";
import { LOCALE_COOKIE, resolveLocale } from "@/lib/i18n/settings";
import { created, unauthorized, tooManyRequests, handleUnknownError } from "@/lib/utils/api";
import { checkRateLimit, clientKey } from "@/lib/utils/rate-limit";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const rl = checkRateLimit(clientKey(req, "submit"));
    if (!rl.allowed) return tooManyRequests();

    const body = await req.json();
    const input = submissionSchema.parse(body);
    if (input.responseText) {
      input.responseText = sanitizeText(input.responseText);
    }

    const cookieStore = await cookies();
    const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value);

    const result = await createAndScoreSubmission(session.userId, input, { locale });
    return created(result);
  } catch (err) {
    return handleUnknownError(err);
  }
}
