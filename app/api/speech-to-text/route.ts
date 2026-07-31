import { getSession } from "@/lib/auth/session";
import { getSttProvider } from "@/lib/stt";
import { ok, unauthorized, fail, handleUnknownError } from "@/lib/utils/api";
import { checkRateLimit, clientKey } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

/**
 * POST /api/speech-to-text (multipart/form-data with `audio` file)
 * Transcribes uploaded audio via local free Whisper (default).
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const rl = checkRateLimit(clientKey(req, "stt"));
    if (!rl.allowed) return fail("rate_limited", "Too many requests", 429);

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return fail(
        "bad_request",
        "Expected multipart/form-data with an 'audio' file",
        400,
      );
    }

    const form = await req.formData();
    const file = form.get("audio");
    if (!(file instanceof File)) {
      return fail("missing_audio", "No audio file was provided", 400);
    }
    if (file.size === 0) {
      return fail("empty_audio", "The audio file is empty", 400);
    }
    if (file.size > MAX_BYTES) {
      return fail("audio_too_large", "Audio file exceeds the 15 MB limit", 413);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const provider = getSttProvider();
    const result = await provider.transcribe(buffer, file.type || "audio/webm");

    if (!result.transcript.trim()) {
      return fail(
        "no_speech",
        "No speech was detected in the recording. Please try again and speak clearly.",
        422,
      );
    }

    return ok({
      transcript: result.transcript,
      provider: result.provider,
      durationMs: result.durationMs ?? null,
    });
  } catch (err) {
    return handleUnknownError(err);
  }
}
