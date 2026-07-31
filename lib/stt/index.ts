import "server-only";
import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";

/**
 * Speech-to-text providers for speaking practice.
 * Default: local free Whisper (faster-whisper) via a small Python server.
 */

export interface TranscriptionResult {
  transcript: string;
  provider: string;
  durationMs?: number;
}

export interface SpeechToTextProvider {
  readonly name: string;
  transcribe(audio: Buffer, mimeType: string): Promise<TranscriptionResult>;
}

const STT_URL =
  process.env.WHISPER_STT_URL || "http://127.0.0.1:8787";

let serverProc: ChildProcess | null = null;
let starting: Promise<void> | null = null;

async function pingStt(): Promise<boolean> {
  try {
    const res = await fetch(`${STT_URL}/health`, {
      signal: AbortSignal.timeout(800),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function ensureWhisperServer(): Promise<void> {
  if (await pingStt()) return;
  if (starting) return starting;

  starting = (async () => {
    if (await pingStt()) return;

    const root = process.cwd();
    const python = path.join(root, ".venv-tts", "bin", "python");
    const script = path.join(root, "scripts", "whisper-stt-server.py");

    // eslint-disable-next-line no-console
    console.log("[stt] starting local Whisper server…");
    serverProc = spawn(python, [script], {
      cwd: root,
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
      detached: false,
    });
    serverProc.stdout?.on("data", (d) =>
      console.log(String(d).trimEnd()),
    );
    serverProc.stderr?.on("data", (d) =>
      console.warn(String(d).trimEnd()),
    );
    serverProc.on("exit", (code) => {
      // eslint-disable-next-line no-console
      console.warn(`[stt] Whisper server exited (${code})`);
      serverProc = null;
      starting = null;
    });

    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 500));
      if (await pingStt()) return;
    }
    throw new Error("Local Whisper STT server failed to start");
  })();

  try {
    await starting;
  } finally {
    // Keep `starting` resolved so later calls just ping.
  }
}

class WhisperSttProvider implements SpeechToTextProvider {
  readonly name = "whisper";

  async transcribe(
    audio: Buffer,
    mimeType = "audio/webm",
  ): Promise<TranscriptionResult> {
    await ensureWhisperServer();

    const ext = mimeType.includes("wav")
      ? "wav"
      : mimeType.includes("mp4") || mimeType.includes("m4a")
        ? "m4a"
        : "webm";

    const form = new FormData();
    const file = new File([new Uint8Array(audio)], `recording.${ext}`, {
      type: mimeType || "audio/webm",
    });
    form.append("audio", file);

    const res = await fetch(`${STT_URL}/transcribe`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(120_000),
    });
    const data = (await res.json()) as {
      transcript?: string;
      provider?: string;
      error?: string;
    };
    if (!res.ok) {
      throw new Error(data.error || `Whisper STT failed (${res.status})`);
    }
    return {
      transcript: String(data.transcript ?? "").trim(),
      provider: data.provider || this.name,
    };
  }
}

/** Legacy mock — never returned to learners when whisper is configured. */
class MockSttProvider implements SpeechToTextProvider {
  readonly name = "mock";
  async transcribe(audio: Buffer): Promise<TranscriptionResult> {
    const seconds = Math.max(1, Math.round(audio.byteLength / 16000));
    return {
      transcript: "",
      provider: this.name,
      durationMs: seconds * 1000,
    };
  }
}

export function getSttProvider(): SpeechToTextProvider {
  const provider = (process.env.STT_PROVIDER || "whisper").toLowerCase();
  if (provider === "mock") return new MockSttProvider();
  return new WhisperSttProvider();
}

// Re-export under old path name for any remaining imports.
export { getSttProvider as getSpeechToTextProvider };
