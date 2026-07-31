import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { setSessionCookie } from "@/lib/auth/session";
import { signupSchema } from "@/lib/validators";
import { created, fail, handleUnknownError } from "@/lib/utils/api";
import { checkRateLimit, clientKey } from "@/lib/utils/rate-limit";

export async function POST(req: Request) {
  try {
    const rl = checkRateLimit(clientKey(req, "signup"));
    if (!rl.allowed) return fail("rate_limited", "Too many attempts", 429);

    const body = await req.json();
    const { email, password, name } = signupSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return fail("email_taken", "An account with this email already exists", 409);
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: name ?? null,
        passwordHash: await hashPassword(password),
        languagePreference: { create: {} },
      },
    });

    await setSessionCookie({ userId: user.id, role: "student", isGuest: false });
    return created({ id: user.id, email: user.email, name: user.name });
  } catch (err) {
    return handleUnknownError(err);
  }
}
