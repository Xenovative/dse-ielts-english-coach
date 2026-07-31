/**
 * Lightweight text utilities: sanitization + word counting used across the
 * writing/speaking modules and API validation.
 */

// Strip control characters and collapse excessive whitespace. This is a
// defensive sanitizer for user-submitted free text (writing responses,
// transcripts). It intentionally does NOT attempt HTML sanitization because we
// never render user text as HTML — always as plain text.
export function sanitizeText(input: string, maxLen = 20000): string {
  const cleaned = input
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n/g, "\n")
    .trim();
  return cleaned.slice(0, maxLen);
}

export function countWords(input: string): number {
  const trimmed = input.trim();
  if (!trimmed) return 0;
  // Count CJK characters individually, latin words by whitespace groups.
  const cjk = (trimmed.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
  const latin = trimmed
    .replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return cjk + latin;
}

export function normalizeAnswer(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,;:!?"'`]/g, "")
    .trim();
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
