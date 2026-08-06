import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Resolve the project `.venv-tts` Python binary on Windows or Unix.
 */
export function resolveVenvPython(root = process.cwd()): string {
  const candidates = [
    path.join(root, ".venv-tts", "Scripts", "python.exe"),
    path.join(root, ".venv-tts", "bin", "python"),
    path.join(root, ".venv-tts", "bin", "python3"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(
    "Python venv not found. Run: npm run setup:venv",
  );
}
