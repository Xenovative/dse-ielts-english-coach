import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSession, type SessionPayload } from "./session";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Resolve the current authenticated (or guest) user from the session cookie.
 * Returns null if there is no valid session.
 */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { languagePreference: true },
  });
  return user;
}

export async function requireUser(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new AuthError("Authentication required");
  }
  return session;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireUser();
  if (session.role !== "admin") {
    throw new AuthError("Admin access required", 403);
  }
  return session;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export { getSession } from "./session";
export type { SessionPayload } from "./session";
