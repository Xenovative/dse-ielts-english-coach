import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const candidates = [
  path.join(root, ".venv-tts", "Scripts", "python.exe"),
  path.join(root, ".venv-tts", "bin", "python"),
  path.join(root, ".venv-tts", "bin", "python3"),
];
const python = candidates.find((p) => existsSync(p));
if (!python) {
  console.error("Missing .venv-tts. Run: npm run setup:venv");
  process.exit(1);
}

const args = process.argv.slice(2);
const child = spawn(python, args, { stdio: "inherit", cwd: root, shell: false });
child.on("exit", (code) => process.exit(code ?? 1));
