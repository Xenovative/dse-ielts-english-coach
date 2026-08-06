"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }> & { length: number };
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function joinTurns(base: string, piece: string): string {
  const a = base.trim();
  const b = piece.trim();
  if (!a) return b;
  if (!b) return a;
  return `${a}\n\n${b}`;
}

function pickMime(): string {
  if (typeof MediaRecorder === "undefined") return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
    return "audio/webm;codecs=opus";
  }
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  return "audio/webm";
}

export type MicRecorderHandle = {
  start: (opts?: { autoStopMs?: number }) => Promise<void>;
  stop: () => Promise<void>;
  /** Request mic permission early (from a click) so later auto-start works. */
  primeMic: () => Promise<boolean>;
  isRecording: () => boolean;
  isBusy: () => boolean;
};

/**
 * Speaking recorder with clean transcription.
 * Records one continuous clip, then runs a single Whisper pass on the full audio
 * (no overlapping chunk mash-ups). Browser STT is interim-only for live UI.
 */
export const MicRecorder = forwardRef<
  MicRecorderHandle,
  {
    /** Existing transcript from earlier turns (frozen for this recording). */
    transcript?: string;
    onTranscriptChange: (transcript: string, audioUrl: string | null) => void;
    onInterimChange?: (interim: string) => void;
    onRecordingChange?: (recording: boolean) => void;
    onBusyChange?: (busy: boolean) => void;
    onStopped?: () => void;
    lang?: string;
    autoStopMs?: number;
    compact?: boolean;
    hideControls?: boolean;
    /** Hide busy/error status lines (parent owns the UI). */
    hideStatus?: boolean;
  }
>(function MicRecorder(
  {
    transcript = "",
    onTranscriptChange,
    onInterimChange,
    onRecordingChange,
    onBusyChange,
    onStopped,
    lang = "en-US",
    autoStopMs,
    compact = false,
    hideControls = false,
    hideStatus = false,
  },
  ref,
) {
  const { t } = useTranslation();
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wantRecordingRef = useRef(false);
  const recordingRef = useRef(false);
  const stoppingRef = useRef(false);
  const busyRef = useRef(false);
  const baseTranscriptRef = useRef("");
  const audioUrlRef = useRef<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeRef = useRef("audio/webm");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const autoStopTimerRef = useRef<number | null>(null);
  /** Browser live preview — used only if server STT fails. */
  const browserPreviewRef = useRef("");

  const onTranscriptChangeRef = useRef(onTranscriptChange);
  const onInterimChangeRef = useRef(onInterimChange);
  const onRecordingChangeRef = useRef(onRecordingChange);
  const onBusyChangeRef = useRef(onBusyChange);
  const onStoppedRef = useRef(onStopped);

  useEffect(() => {
    onTranscriptChangeRef.current = onTranscriptChange;
  }, [onTranscriptChange]);
  useEffect(() => {
    onInterimChangeRef.current = onInterimChange;
  }, [onInterimChange]);
  useEffect(() => {
    onRecordingChangeRef.current = onRecordingChange;
  }, [onRecordingChange]);
  useEffect(() => {
    onBusyChangeRef.current = onBusyChange;
  }, [onBusyChange]);
  useEffect(() => {
    onStoppedRef.current = onStopped;
  }, [onStopped]);

  function setBusyState(next: boolean) {
    busyRef.current = next;
    setBusy(next);
    onBusyChangeRef.current?.(next);
  }

  useEffect(() => {
    return () => {
      wantRecordingRef.current = false;
      stoppingRef.current = false;
      if (autoStopTimerRef.current) {
        window.clearTimeout(autoStopTimerRef.current);
      }
      try {
        recognitionRef.current?.abort();
      } catch {
        /* ignore */
      }
      try {
        if (mediaRecorderRef.current?.state !== "inactive") {
          mediaRecorderRef.current?.stop();
        }
      } catch {
        /* ignore */
      }
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, []);

  async function transcribeFull(blob: Blob): Promise<string> {
    const form = new FormData();
    const ext = blob.type.includes("mp4") ? "m4a" : "webm";
    form.append("audio", blob, `turn.${ext}`);
    const res = await fetch("/api/speech-to-text", {
      method: "POST",
      body: form,
    });
    const data = await res.json();
    if (!res.ok) {
      if (data?.error?.code === "no_speech") return "";
      throw new Error(data?.error?.message || t("speaking.sttUnavailable"));
    }
    return String(data.transcript ?? "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function startBrowserInterimOnly() {
    const Ctor = getSpeechRecognition();
    if (!Ctor) return;

    try {
      recognitionRef.current?.abort();
    } catch {
      /* ignore */
    }

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let finals = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const piece = result[0]?.transcript ?? "";
        if (result.isFinal) finals += piece;
        else interim += piece;
      }
      const preview = `${finals}${interim}`.replace(/\s+/g, " ").trim();
      browserPreviewRef.current = preview;
      // Live preview only — server STT owns the committed transcript when healthy.
      if (preview) onInterimChangeRef.current?.(preview);
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        setError(t("speaking.micDenied"));
        void stop();
      }
    };

    recognition.onend = () => {
      if (!wantRecordingRef.current) return;
      window.setTimeout(() => {
        if (!wantRecordingRef.current) return;
        try {
          recognition.start();
        } catch {
          /* ignore */
        }
      }, 150);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      /* optional */
    }
  }

  async function start(opts?: { autoStopMs?: number }) {
    if (recordingRef.current || stoppingRef.current || busyRef.current) return;

    setError(null);
    onInterimChangeRef.current?.("");
    browserPreviewRef.current = "";
    chunksRef.current = [];
    // Freeze prior turns — this recording will append ONE clean STT result.
    baseTranscriptRef.current = transcript.trim();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      streamRef.current = stream;
    } catch {
      setError(t("speaking.micDenied"));
      return;
    }

    const mime = pickMime();
    mimeRef.current = mime;
    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: mime,
      audioBitsPerSecond: 128000,
    });
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.start(1000);

    wantRecordingRef.current = true;
    recordingRef.current = true;
    setRecording(true);
    onRecordingChangeRef.current?.(true);

    if (autoStopTimerRef.current) {
      window.clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
    const stopAfter = opts?.autoStopMs ?? autoStopMs;
    if (stopAfter && stopAfter > 0) {
      autoStopTimerRef.current = window.setTimeout(() => {
        void stop();
      }, stopAfter);
    }

    startBrowserInterimOnly();
  }

  async function stop() {
    // Idle / already finished — do NOT fire onStopped (prevents double advance).
    if (
      (!recordingRef.current && !wantRecordingRef.current) ||
      stoppingRef.current
    ) {
      return;
    }

    stoppingRef.current = true;

    if (autoStopTimerRef.current) {
      window.clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }

    wantRecordingRef.current = false;

    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    recognitionRef.current = null;
    onInterimChangeRef.current?.("");

    // Flip UI out of "recording" immediately so Stop cannot be mashed.
    recordingRef.current = false;
    setRecording(false);
    onRecordingChangeRef.current?.(false);

    const recorder = mediaRecorderRef.current;
    const blob: Blob | null = await new Promise((resolve) => {
      if (!recorder || recorder.state === "inactive") {
        resolve(
          chunksRef.current.length
            ? new Blob(chunksRef.current, { type: mimeRef.current })
            : null,
        );
        return;
      }
      recorder.onstop = () => {
        resolve(
          chunksRef.current.length
            ? new Blob(chunksRef.current, {
                type: recorder.mimeType || mimeRef.current,
              })
            : null,
        );
      };
      try {
        recorder.stop();
      } catch {
        resolve(null);
      }
    });

    mediaRecorderRef.current = null;
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;

    let turnText = "";
    if (blob && blob.size > 800) {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = URL.createObjectURL(blob);
      setBusyState(true);
      try {
        turnText = await transcribeFull(blob);
        if (!turnText) {
          // Prefer browser preview over an empty/no-speech result when available.
          turnText = browserPreviewRef.current.trim();
          setError(turnText ? null : t("speaking.sttEmpty"));
        } else {
          setError(null);
        }
      } catch {
        // Soft-fail: keep speaking flow moving; use browser preview if we have it.
        turnText = browserPreviewRef.current.trim();
        setError(turnText ? null : t("speaking.sttUnavailable"));
      } finally {
        setBusyState(false);
      }
    } else {
      turnText = browserPreviewRef.current.trim();
    }

    const merged = joinTurns(baseTranscriptRef.current, turnText);
    onTranscriptChangeRef.current(merged, audioUrlRef.current);

    stoppingRef.current = false;
    // Always notify parent once so speaking flow can advance to follow-ups.
    onStoppedRef.current?.();
  }

  async function primeMic(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      stream.getTracks().forEach((tr) => tr.stop());
      return true;
    } catch {
      setError(t("speaking.micDenied"));
      return false;
    }
  }

  useImperativeHandle(ref, () => ({
    start: (opts?: { autoStopMs?: number }) => start(opts),
    stop: () => stop(),
    primeMic: () => primeMic(),
    isRecording: () => recordingRef.current,
    isBusy: () => busyRef.current || stoppingRef.current,
  }));

  if (hideControls) {
    // Parent may own the "Transcribing…" label; still surface STT errors once.
    return (
      <>
        {!hideStatus && busy && (
          <p className="text-center text-sm text-sapphire-muted">
            {t("speaking.transcribing")}
          </p>
        )}
        {error && <p className="text-center text-sm text-rose-200">{error}</p>}
      </>
    );
  }

  return (
    <div className={compact ? "space-y-2" : "card space-y-3"}>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {!recording && !busy ? (
          <button
            type="button"
            onClick={() => void start()}
            disabled={busy}
            className={
              compact ? "btn-primary w-full max-w-sm rounded-full" : "btn-primary"
            }
          >
            {t("speaking.record")}
          </button>
        ) : recording ? (
          <button
            type="button"
            onClick={() => void stop()}
            disabled={busy}
            className={
              compact
                ? "btn-secondary w-full max-w-sm rounded-full border-rose-500/40 text-rose-300"
                : "btn-secondary"
            }
          >
            {t("speaking.stop")}
          </button>
        ) : null}
        {recording && (
          <span className="flex items-center gap-2 text-sm text-rose-400">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-500" />
            {t("speaking.listeningWhisper")}
          </span>
        )}
        {busy && (
          <span className="text-sm text-sapphire-muted">
            {t("speaking.transcribing")}
          </span>
        )}
      </div>
      {!compact && (
        <p className="text-sm text-sapphire-muted">{t("speaking.sttHint")}</p>
      )}
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  );
});
