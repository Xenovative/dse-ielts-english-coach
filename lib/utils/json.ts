/**
 * Helpers for the "JSON as text" pattern used to stay portable across SQLite
 * and Postgres. Prisma stores these columns as String; we (de)serialize here.
 */

export function toJson(value: unknown): string {
  return JSON.stringify(value ?? null);
}

export function fromJson<T>(value: string | null | undefined, fallback: T): T {
  if (value == null) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
