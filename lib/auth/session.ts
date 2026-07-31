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
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
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
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload) return null;

  // Session cookies can outlive a DB reseed/reset. Treat orphaned JWTs as
  // logged-out (do not delete cookies here — layouts cannot mutate cookies).
  const { prisma } = await import("@/lib/db");
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true, isGuest: true },
  });
  if (!user) return null;

  return {
    userId: user.id,
    role: user.role === "admin" ? "admin" : "student",
    isGuest: user.isGuest,
  };
}

export { COOKIE_NAME };
