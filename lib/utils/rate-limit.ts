/**
 * Minimal in-memory sliding-window rate limiter for the MVP. Swap for Redis in
 * production by implementing the same `check` signature.
 */

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

function config() {
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000;
  const max = Number(process.env.RATE_LIMIT_MAX) || 60;
  return { windowMs, max };
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export function checkRateLimit(
  key: string,
  overrides?: { max?: number; windowMs?: number },
): RateLimitResult {
  const defaults = config();
  const max = overrides?.max ?? defaults.max;
  const windowMs = overrides?.windowMs ?? defaults.windowMs;
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    const bucket = { count: 1, resetAt: now + windowMs };
    store.set(key, bucket);
    return { allowed: true, remaining: max - 1, resetAt: bucket.resetAt };
  }

  existing.count += 1;
  const allowed = existing.count <= max;
  return {
    allowed,
    remaining: Math.max(0, max - existing.count),
    resetAt: existing.resetAt,
  };
}

/** Best-effort client identifier from request headers. */
export function clientKey(req: Request, suffix = ""): string {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd?.split(",")[0]?.trim() || "local";
  return `${ip}:${suffix}`;
}
