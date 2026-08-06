import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { setSessionCookie } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validators";
import { ok, fail, handleUnknownError } from "@/lib/utils/api";
import { checkRateLimit, clientKey } from "@/lib/utils/rate-limit";

export async function POST(req: Request) {
  try {
    const rl = checkRateLimit(clientKey(req, "login"));
    if (!rl.allowed) return fail("rate_limited", "Too many attempts", 429);

    const body = await req.json();
    const { email, password } = loginSchema.parse(body);
    // SQLite email match is case-sensitive — always store/query lowercase.
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !user.passwordHash) {
      return fail("invalid_credentials", "Invalid email or password", 401);
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return fail("invalid_credentials", "Invalid email or password", 401);
    }

    await setSessionCookie({
      userId: user.id,
      role: user.role === "admin" ? "admin" : "student",
      isGuest: false,
    });
    return ok({ id: user.id, email: user.email, name: user.name });
  } catch (err) {
    return handleUnknownError(err);
  }
}
