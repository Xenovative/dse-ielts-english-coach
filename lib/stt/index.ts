import "server-only";
import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";

/**
 * Speech-to-text providers for speaking practice.
 *
 * Providers:
 * - auto (default): local Whisper when healthy, else OpenRouter
 * - whisper: local free faster-whisper server
 * - openrouter: OpenRouter /audio/transcriptions (same API key as marking)
 * - mock: empty placeholder
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

const STT_URL = process.env.WHISPER_STT_URL || "http://127.0.0.1:8787";

let serverProc: ChildProcess | null = null;
let starting: Promise<void> | null = null;
let whisperUnavailableUntil = 0;

function audioFormat(mimeType: string): "webm" | "wav" | "m4a" | "mp3" | "ogg" {
  const m = (mimeType || "").toLowerCase();
  if (m.includes("wav")) return "wav";
  if (m.includes("mp4") || m.includes("m4a")) return "m4a";
  if (m.includes("mpeg") || m.includes("mp3")) return "mp3";
  if (m.includes("ogg")) return "ogg";
  return "webm";
}

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
  if (Date.now() < whisperUnavailableUntil) {
    throw new Error(
      "Local Whisper STT is unavailable. Install with: npm run setup:venv:stt",
    );
  }
  if (await pingStt()) return;
  if (starting) return starting;

  starting = (async () => {
    if (await pingStt()) return;

    const root = process.cwd();
    const { resolveVenvPython } = await import("@/lib/python/venv");
    let python: string;
    try {
      python = resolveVenvPython(root);
    } catch (err) {
      whisperUnavailableUntil = Date.now() + 60_000;
      throw err;
    }

    // Fail fast if STT deps are missing (avoids a 30s hang on every request).
    const probe = spawn(
      python,
      ["-c", "import flask, faster_whisper; print('ok')"],
      { cwd: root, stdio: ["ignore", "pipe", "pipe"] },
    );
    const probeOk = await new Promise<boolean>((resolve) => {
      let out = "";
      probe.stdout?.on("data", (d) => {
        out += String(d);
      });
      probe.on("exit", (code) => resolve(code === 0 && out.includes("ok")));
      probe.on("error", () => resolve(false));
      setTimeout(() => {
        try {
          probe.kill();
        } catch {
          /* ignore */
        }
        resolve(false);
      }, 8_000);
    });
    if (!probeOk) {
      whisperUnavailableUntil = Date.now() + 5 * 60_000;
      throw new Error(
        "Local Whisper packages missing. Run: npm run setup:venv:stt",
      );
    }

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
    whisperUnavailableUntil = Date.now() + 60_000;
    throw new Error("Local Whisper STT server failed to start");
  })();

  try {
    await starting;
  } catch (err) {
    starting = null;
    throw err;
  }
}

class WhisperSttProvider implements SpeechToTextProvider {
  readonly name = "whisper";

  async transcribe(
    audio: Buffer,
    mimeType = "audio/webm",
  ): Promise<TranscriptionResult> {
    await ensureWhisperServer();

    const ext = audioFormat(mimeType);
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

class OpenRouterSttProvider implements SpeechToTextProvider {
  readonly name = "openrouter";

  async transcribe(
    audio: Buffer,
    mimeType = "audio/webm",
  ): Promise<TranscriptionResult> {
    const apiKey = process.env.OPENROUTER_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is required for OpenRouter STT");
    }

    const base =
      process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
    const model =
      process.env.OPENROUTER_STT_MODEL ||
      process.env.WHISPER_OPENROUTER_MODEL ||
      "openai/whisper-1";
    const format = audioFormat(mimeType);

    const res = await fetch(`${base}/audio/transcriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
        "X-Title": process.env.OPENROUTER_APP_NAME || "DSE IELTS English Coach",
      },
      body: JSON.stringify({
        model,
        language: "en",
        input_audio: {
          data: audio.toString("base64"),
          format,
        },
      }),
      signal: AbortSignal.timeout(90_000),
    });

    const data = (await res.json()) as {
      text?: string;
      error?: { message?: string };
      message?: string;
    };
    if (!res.ok) {
      throw new Error(
        data.error?.message ||
          data.message ||
          `OpenRouter STT failed (${res.status})`,
      );
    }

    return {
      transcript: String(data.text ?? "").trim(),
      provider: `${this.name}:${model}`,
    };
  }
}

/** Legacy mock — empty transcript placeholder. */
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

/**
 * Prefer local Whisper when already running / installable; otherwise OpenRouter.
 */
class AutoSttProvider implements SpeechToTextProvider {
  readonly name = "auto";
  private readonly local = new WhisperSttProvider();
  private readonly cloud = new OpenRouterSttProvider();

  async transcribe(
    audio: Buffer,
    mimeType = "audio/webm",
  ): Promise<TranscriptionResult> {
    const hasOpenRouter = Boolean(process.env.OPENROUTER_API_KEY?.trim());

    // Prefer free local Whisper (boot on demand). OpenRouter audio often needs
    // paid credits / privacy settings and is only a fallback.
    try {
      return await this.local.transcribe(audio, mimeType);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
        "[stt] local Whisper failed, trying OpenRouter:",
        err instanceof Error ? err.message : err,
      );
    }

    if (!hasOpenRouter) {
      throw new Error(
        "Speech recognition unavailable. Run: npm run setup:venv:stt",
      );
    }

    return this.cloud.transcribe(audio, mimeType);
  }
}

export function getSttProvider(): SpeechToTextProvider {
  const provider = (process.env.STT_PROVIDER || "auto").toLowerCase();
  if (provider === "mock") return new MockSttProvider();
  if (provider === "openrouter") return new OpenRouterSttProvider();
  if (provider === "whisper") return new WhisperSttProvider();
  return new AutoSttProvider();
}

// Re-export under old path name for any remaining imports.
export { getSttProvider as getSpeechToTextProvider };
