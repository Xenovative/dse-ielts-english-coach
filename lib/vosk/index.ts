import "server-only";

/**
 * Back-compat re-export. STT now lives in `@/lib/stt` (Whisper by default).
 */
export {
  getSttProvider,
  type SpeechToTextProvider,
  type TranscriptionResult,
} from "@/lib/stt";
