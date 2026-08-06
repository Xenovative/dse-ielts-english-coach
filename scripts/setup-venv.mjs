/**
 * Cross-platform setup for `.venv-tts` (edge-tts; optional Whisper STT deps).
 * Usage:
 *   node scripts/setup-venv.mjs
 *   node scripts/setup-venv.mjs --with-stt
 */
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const withStt = process.argv.includes("--with-stt");
const isWin = process.platform === "win32";
const venvDir = path.join(root, ".venv-tts");
const pythonBin = isWin
  ? path.join(venvDir, "Scripts", "python.exe")
  : path.join(venvDir, "bin", "python");
const pipBin = isWin
  ? path.join(venvDir, "Scripts", "pip.exe")
  : path.join(venvDir, "bin", "pip");

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: false,
    ...opts,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function findSystemPython() {
  const candidates = isWin
    ? [
        ["py", ["-3.11"]],
        ["py", ["-3"]],
        ["python", []],
        ["python3", []],
      ]
    : [
        ["python3", []],
        ["python", []],
      ];
  for (const [cmd, prefix] of candidates) {
    const check = spawnSync(cmd, [...prefix, "--version"], {
      encoding: "utf8",
      shell: false,
    });
    if (check.status === 0) return { cmd, prefix };
  }
  console.error("No Python 3 found. Install Python 3.11+ and retry.");
  process.exit(1);
}

if (!existsSync(pythonBin)) {
  console.log("Creating .venv-tts …");
  const { cmd, prefix } = findSystemPython();
  run(cmd, [...prefix, "-m", "venv", venvDir]);
} else {
  console.log("Using existing .venv-tts");
}

run(pythonBin, ["-m", "pip", "install", "--upgrade", "pip"]);
run(pipBin, ["install", "-r", "requirements-tts.txt"]);
if (withStt) {
  run(pipBin, ["install", "-r", "requirements-stt.txt"]);
}

console.log("OK — venv ready at", pythonBin);
console.log("TTS: npm run db:generate-audio  |  Avatar speech uses /api/tts");
if (withStt) console.log("STT: npm run stt:server");
else console.log("Optional STT: npm run setup:venv:stt");
