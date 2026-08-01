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
    const emailTrimmed = email.trim();
    const emailLower = emailTrimmed.toLowerCase();

    const userExact = await prisma.user.findUnique({ where: { email: emailTrimmed } });
    const userLower =
      emailTrimmed === emailLower
        ? userExact
        : await prisma.user.findFirst({
            where: { email: { equals: emailLower } },
          });
    const user = userExact ?? userLower;

    // #region agent log
    console.log(
      JSON.stringify({
        dbg: "login",
        sessionId: "3891af",
        hypothesisId: "F-G",
        emailLen: emailTrimmed.length,
        passwordLen: password.length,
        emailHasUpper: /[A-Z]/.test(emailTrimmed),
        emailEqualsLower: emailTrimmed === emailLower,
        userExactFound: Boolean(userExact),
        userLowerFound: Boolean(userLower),
        hasPasswordHash: Boolean(user?.passwordHash),
      }),
    );
    // #endregion

    if (!user || !user.passwordHash) {
      // #region agent log
      console.log(
        JSON.stringify({
          dbg: "login",
          sessionId: "3891af",
          hypothesisId: "F-G",
          result: "user_not_found",
        }),
      );
      // #endregion
      return fail("invalid_credentials", "Invalid email or password", 401);
    }
    const valid = await verifyPassword(password, user.passwordHash);
    // #region agent log
    console.log(
      JSON.stringify({
        dbg: "login",
        sessionId: "3891af",
        hypothesisId: "F",
        result: valid ? "ok" : "bad_password",
        userId: user.id,
      }),
    );
    // #endregion
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
    // #region agent log
    console.log(
      JSON.stringify({
        dbg: "login",
        sessionId: "3891af",
        hypothesisId: "H",
        result: "exception",
        errName: err instanceof Error ? err.name : typeof err,
        errMessage: err instanceof Error ? err.message : "unknown",
      }),
    );
    // #endregion
    return handleUnknownError(err);
  }
}
