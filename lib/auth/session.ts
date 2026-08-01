import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "dse_session";

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "JWT_SECRET is missing or too short. Set it in your .env file.",
    );
  }
  return new TextEncoder().encode(secret);
}

function ttlSeconds(): number {
  const raw = Number(process.env.SESSION_TTL_SECONDS);
  return Number.isFinite(raw) && raw > 0 ? raw : 60 * 60 * 24 * 7;
}

/** Secure cookies require HTTPS. Override with COOKIE_SECURE=true|false for HTTP deploys. */
function cookieSecure(): boolean {
  const override = process.env.COOKIE_SECURE?.trim().toLowerCase();
  if (override === "true") return true;
  if (override === "false") return false;
  return process.env.NODE_ENV === "production";
}

export type SessionPayload = {
  userId: string;
  role: "student" | "admin";
  isGuest: boolean;
};

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds()}s`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.userId || !payload.role) return null;
    return {
      userId: String(payload.userId),
      role: payload.role === "admin" ? "admin" : "student",
      isGuest: Boolean(payload.isGuest),
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await createSessionToken(payload);
  const cookieStore = await cookies();
  const secure = cookieSecure();
  // #region agent log
  fetch("http://127.0.0.1:7873/ingest/ccf26217-348c-4a08-bd0f-2912974b0d2f", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "3891af",
    },
    body: JSON.stringify({
      sessionId: "3891af",
      runId: "post-fix",
      hypothesisId: "A",
      location: "lib/auth/session.ts:setSessionCookie",
      message: "Setting session cookie",
      data: {
        secure,
        cookieSecureEnv: process.env.COOKIE_SECURE ?? null,
        nodeEnv: process.env.NODE_ENV ?? null,
        role: payload.role,
        isGuest: payload.isGuest,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: ttlSeconds(),
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    // #region agent log
    fetch("http://127.0.0.1:7873/ingest/ccf26217-348c-4a08-bd0f-2912974b0d2f", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "3891af",
      },
      body: JSON.stringify({
        sessionId: "3891af",
        runId: "pre-fix",
        hypothesisId: "B",
        location: "lib/auth/session.ts:getSession",
        message: "No session cookie present",
        data: { hasToken: false },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return null;
  }
  const payload = await verifySessionToken(token);
  if (!payload) {
    // #region agent log
    fetch("http://127.0.0.1:7873/ingest/ccf26217-348c-4a08-bd0f-2912974b0d2f", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "3891af",
      },
      body: JSON.stringify({
        sessionId: "3891af",
        runId: "pre-fix",
        hypothesisId: "C",
        location: "lib/auth/session.ts:getSession",
        message: "Session token failed verification",
        data: { hasToken: true, tokenLen: token.length },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return null;
  }

  // Session cookies can outlive a DB reseed/reset. Treat orphaned JWTs as
  // logged-out (do not delete cookies here — layouts cannot mutate cookies).
  const { prisma } = await import("@/lib/db");
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true, isGuest: true },
  });
  if (!user) {
    // #region agent log
    fetch("http://127.0.0.1:7873/ingest/ccf26217-348c-4a08-bd0f-2912974b0d2f", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "3891af",
      },
      body: JSON.stringify({
        sessionId: "3891af",
        runId: "pre-fix",
        hypothesisId: "D",
        location: "lib/auth/session.ts:getSession",
        message: "Session user missing from DB",
        data: { userId: payload.userId },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return null;
  }

  // #region agent log
  fetch("http://127.0.0.1:7873/ingest/ccf26217-348c-4a08-bd0f-2912974b0d2f", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "3891af",
    },
    body: JSON.stringify({
      sessionId: "3891af",
      runId: "pre-fix",
      hypothesisId: "B",
      location: "lib/auth/session.ts:getSession",
      message: "Session resolved",
      data: { userId: user.id, role: user.role, isGuest: user.isGuest },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return {
    userId: user.id,
    role: user.role === "admin" ? "admin" : "student",
    isGuest: user.isGuest,
  };
}

export { COOKIE_NAME };
