"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  TalkingHeadAvatar,
  type TalkingHeadAvatarHandle,
} from "@/components/talking-avatar/TalkingHeadAvatar";
import {
  MicRecorder,
  type MicRecorderHandle,
} from "@/components/mic-recorder/MicRecorder";

const PREP_SECONDS = 60;
const SPEAK_SECONDS = 120;
const FOLLOWUP_SECONDS = 45;

type Phase =
  | "loading"
  | "tap_to_hear"
  | "listen"
  | "prep"
  | "ready"
  | "recording"
  | "transcribing"
  | "reply"
  | "followup_listen"
  | "followup_ready"
  | "followup_recording"
  | "done";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Called when all speaking turns (main + follow-ups) are finished — close popup, no auto-marking. */
  onSessionComplete?: () => void;
  /** Listening: avatar/audio playback failed — parent can show HTML audio fallback. */
  onPlaybackFailed?: (reason: string) => void;
  mode: "speaking" | "listening";
  title: string;
  questionText: string;
  followUps?: string[];
  audioSrc?: string | null;
  transcript?: string;
  onTranscriptChange?: (transcript: string, audioUrl: string | null) => void;
};

function waitFrames(n = 2): Promise<void> {
  return new Promise((resolve) => {
    const step = (left: number) => {
      if (left <= 0) resolve();
      else requestAnimationFrame(() => step(left - 1));
    };
    step(n);
  });
}

function formatClock(totalSecs: number): string {
  const s = Math.max(0, Math.floor(totalSecs));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

/**
 * Large speaking/listening popup. After the main question: 60s prep countdown
 * (auto-starts recording), then 120s speak countdown. Follow-ups one-by-one.
 */
export function AvatarSessionModal({
  open,
  onClose,
  onSessionComplete,
  onPlaybackFailed,
  mode,
  title,
  questionText,
  followUps = [],
  audioSrc = null,
  transcript = "",
  onTranscriptChange,
}: Props) {
  const { t } = useTranslation();
  const avatarRef = useRef<TalkingHeadAvatarHandle>(null);
  const micRef = useRef<MicRecorderHandle>(null);
  const replyStartedRef = useRef(false);
  const expectMainReplyRef = useRef(false);
  const expectFollowUpAdvanceRef = useRef(false);
  const followUpIndexRef = useRef(0);
  const phaseRef = useRef<Phase>("loading");
  const finishingRef = useRef(false);
  const mainRecordingStartedRef = useRef(false);
  const startMainRecordingRef = useRef<() => void>(() => {});

  const [phase, setPhase] = useState<Phase>("loading");
  const [avatarReady, setAvatarReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(SPEAK_SECONDS);
  const [localTranscript, setLocalTranscript] = useState(transcript);
  const [followUpIndex, setFollowUpIndex] = useState(0);
  const [micBusy, setMicBusy] = useState(false);
  /** Explicit card copy so the UI always matches the spoken follow-up. */
  const [activeFollowUp, setActiveFollowUp] = useState<{
    index: number;
    text: string;
  } | null>(null);
  const transcriptRef = useRef(transcript);
  const timerRef = useRef<number | null>(null);
  const openInitRef = useRef(false);

  const mainPrompt = questionText.trim();
  const inFollowUp =
    phase === "followup_listen" ||
    phase === "followup_ready" ||
    phase === "followup_recording" ||
    (phase === "transcribing" && activeFollowUp !== null);

  const updatePhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const handleAvatarError = useCallback(
    (msg: string) => {
      // #region agent log
      fetch('http://127.0.0.1:7297/ingest/461a83a5-6229-4271-a7d9-4e3e2cf16e5c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'884e6c'},body:JSON.stringify({sessionId:'884e6c',runId:'post-fix',hypothesisId:'A',location:'AvatarSessionModal.tsx:handleAvatarError',message:'stable onError invoked',data:{msg:String(msg).slice(0,80)},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      setError(msg);
      if (mode === "listening") onPlaybackFailed?.(msg);
    },
    [mode, onPlaybackFailed],
  );

  const updateFollowUpIndex = useCallback((index: number) => {
    followUpIndexRef.current = index;
    setFollowUpIndex(index);
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  function resetRuntimeFlags() {
    replyStartedRef.current = false;
    expectMainReplyRef.current = false;
    expectFollowUpAdvanceRef.current = false;
    finishingRef.current = false;
    mainRecordingStartedRef.current = false;
    followUpIndexRef.current = 0;
    openInitRef.current = false;
  }

  // Reset only when the popup opens/closes — NEVER when transcript changes.
  useEffect(() => {
    if (!open) {
      resetRuntimeFlags();
      clearTimer();
      avatarRef.current?.stop();
      void micRef.current?.stop();
      updatePhase("loading");
      setAvatarReady(false);
      setError(null);
      setSecondsLeft(SPEAK_SECONDS);
      updateFollowUpIndex(0);
      setActiveFollowUp(null);
      setMicBusy(false);
      openInitRef.current = false;
      return;
    }
    if (!openInitRef.current) {
      openInitRef.current = true;
      setLocalTranscript(transcript);
      transcriptRef.current = transcript;
      updateFollowUpIndex(0);
      setActiveFollowUp(null);
      setMicBusy(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once per open
  }, [open, clearTimer, updateFollowUpIndex, updatePhase]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => {
      if (avatarRef.current?.isReady()) {
        setAvatarReady(true);
        window.clearInterval(id);
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [open]);

  // Browsers block Web Audio until a real click/tap — never auto-speak from useEffect.
  useEffect(() => {
    if (!open || !avatarReady) return;
    if (phaseRef.current === "loading") {
      updatePhase("tap_to_hear");
    }
  }, [open, avatarReady, updatePhase]);

  const startPrepCountdown = useCallback(() => {
    clearTimer();
    mainRecordingStartedRef.current = false;
    setSecondsLeft(PREP_SECONDS);
    updatePhase("prep");
    timerRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        // #region agent log
        fetch('http://127.0.0.1:7297/ingest/461a83a5-6229-4271-a7d9-4e3e2cf16e5c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'884e6c'},body:JSON.stringify({sessionId:'884e6c',runId:'post-fix',hypothesisId:'B',location:'AvatarSessionModal.tsx:prepTick',message:'prep countdown tick (parent re-render)',data:{secondsLeft:s,phase:phaseRef.current},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        if (s <= 1) {
          clearTimer();
          // Auto-start speaking — no click required.
          window.setTimeout(() => startMainRecordingRef.current(), 0);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, [clearTimer, updatePhase]);

  const speakMainQuestion = useCallback(async () => {
    setError(null);
    updatePhase("listen");
    try {
      // Unlock audio + prime mic inside this click handler.
      await avatarRef.current?.unlockAudio();
      if (mode === "speaking") {
        await micRef.current?.primeMic();
      }
      if (mode === "listening" && audioSrc) {
        await avatarRef.current?.speakUrl(audioSrc, null);
      } else {
        await avatarRef.current?.speakText(mainPrompt);
      }
      if (mode === "speaking") {
        startPrepCountdown();
      } else {
        updatePhase("done");
      }
    } catch (err) {
      const msg = (err as Error).message || t("avatar.ttsFailed");
      setError(msg);
      updatePhase("tap_to_hear");
      if (mode === "listening") {
        onPlaybackFailed?.(msg);
      }
    }
  }, [
    audioSrc,
    mainPrompt,
    mode,
    onPlaybackFailed,
    startPrepCountdown,
    t,
    updatePhase,
  ]);

  async function handleHearClick() {
    await speakMainQuestion();
  }

  const finishSession = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    updatePhase("done");
    avatarRef.current?.stop();
    // Close popup — marking only happens when the user clicks Submit on the page.
    onSessionComplete?.();
    onClose();
  }, [onClose, onSessionComplete, updatePhase]);

  const speakFollowUp = useCallback(
    async (index: number) => {
      const q = followUps[index];
      if (!q) {
        await finishSession();
        return;
      }

      avatarRef.current?.stop();

      updateFollowUpIndex(index);
      setActiveFollowUp({ index, text: q });
      updatePhase("followup_listen");
      setError(null);
      await waitFrames(3);
      await avatarRef.current?.unlockAudio();

      try {
        await avatarRef.current?.speakText(
          `${t("avatar.session.followUpN", { n: index + 1 })} ${q}`,
        );
        updatePhase("followup_ready");
      } catch (err) {
        setError((err as Error).message || t("avatar.ttsFailed"));
        updatePhase("followup_ready");
      }
    },
    [finishSession, followUps, t, updateFollowUpIndex, updatePhase],
  );

  async function afterMainSpeaking(userText: string) {
    if (replyStartedRef.current) return;
    replyStartedRef.current = true;
    updatePhase("reply");
    await avatarRef.current?.unlockAudio();
    const reply = [
      t("avatar.session.thankYou"),
      userText.trim()
        ? t("avatar.session.heardYou")
        : t("avatar.session.noSpeech"),
    ].join(" ");
    try {
      await avatarRef.current?.speakText(reply);
    } catch (err) {
      setError((err as Error).message || t("avatar.ttsFailed"));
    }

    if (followUps.length > 0) {
      await speakFollowUp(0);
    } else {
      await finishSession();
    }
  }

  function startTimedRecording(
    nextPhase: "recording" | "followup_recording",
    seconds: number,
  ) {
    setError(null);
    setSecondsLeft(seconds);
    updatePhase(nextPhase);
    clearTimer();
    timerRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearTimer();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    void micRef.current?.start({ autoStopMs: seconds * 1000 });
  }

  function startMainRecording() {
    if (mainRecordingStartedRef.current) return;
    if (
      phaseRef.current === "recording" ||
      phaseRef.current === "transcribing" ||
      phaseRef.current === "reply"
    ) {
      return;
    }
    mainRecordingStartedRef.current = true;
    clearTimer();
    replyStartedRef.current = false;
    expectMainReplyRef.current = true;
    expectFollowUpAdvanceRef.current = false;
    void avatarRef.current?.unlockAudio();
    startTimedRecording("recording", SPEAK_SECONDS);
  }
  startMainRecordingRef.current = startMainRecording;

  function startFollowUpRecording() {
    expectMainReplyRef.current = false;
    expectFollowUpAdvanceRef.current = true;
    void avatarRef.current?.unlockAudio();
    startTimedRecording("followup_recording", FOLLOWUP_SECONDS);
  }

  function handleRecordingStopped() {
    clearTimer();
    void avatarRef.current?.unlockAudio();
    if (expectMainReplyRef.current) {
      expectMainReplyRef.current = false;
      void afterMainSpeaking(transcriptRef.current);
      return;
    }
    if (expectFollowUpAdvanceRef.current) {
      expectFollowUpAdvanceRef.current = false;
      const next = followUpIndexRef.current + 1;
      if (next < followUps.length) {
        void speakFollowUp(next);
      } else {
        void finishSession();
      }
    }
  }

  function resetSession() {
    clearTimer();
    resetRuntimeFlags();
    avatarRef.current?.stop();
    void micRef.current?.stop();
    setSecondsLeft(SPEAK_SECONDS);
    setError(null);
    setLocalTranscript("");
    transcriptRef.current = "";
    updateFollowUpIndex(0);
    setActiveFollowUp(null);
    setMicBusy(false);
    onTranscriptChange?.("", null);
    updatePhase(avatarReady ? "tap_to_hear" : "loading");
  }

  function statusLabel(): string {
    switch (phase) {
      case "loading":
        return t("avatar.loading3d");
      case "tap_to_hear":
        return mode === "listening"
          ? t("avatar.session.tapToPlayListening")
          : t("avatar.session.tapToHear");
      case "listen":
        return t("avatar.session.listenCarefully");
      case "prep":
        return t("avatar.session.prepThink");
      case "ready":
        return t("avatar.session.yourTurn");
      case "recording":
        return t("avatar.session.recordingLeft", { secs: secondsLeft });
      case "transcribing":
        return t("speaking.transcribing");
      case "reply":
        return t("avatar.session.coachReplying");
      case "followup_listen":
        return t("avatar.session.listenCarefully");
      case "followup_ready":
        return t("avatar.session.followUpYourTurn", {
          n: (activeFollowUp?.index ?? followUpIndex) + 1,
          total: followUps.length,
        });
      case "followup_recording":
        return t("avatar.session.recordingLeft", { secs: secondsLeft });
      case "done":
        return mode === "speaking"
          ? t("avatar.session.doneSpeaking")
          : t("avatar.session.doneListening");
      default:
        return "";
    }
  }

  const headerTimer =
    mode === "speaking" && (phase === "prep" || phase === "recording")
      ? {
          label:
            phase === "prep"
              ? t("avatar.session.prepTimerLabel")
              : t("avatar.session.speakTimerLabel"),
          clock: formatClock(secondsLeft),
          tone: phase === "prep" ? "prep" : "speak",
        }
      : null;

  const canHear = phase === "tap_to_hear";
  const canStartEarly = phase === "prep";
  const canStartFollowUp = phase === "followup_ready";
  const isRecording = phase === "recording" || phase === "followup_recording";

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (
          e.target === e.currentTarget &&
          !micBusy &&
          !isRecording &&
          phase !== "prep"
        ) {
          onClose();
        }
      }}
    >
      <div className="relative flex max-h-[min(96dvh,920px)] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-sapphire-border bg-gradient-to-b from-sapphire-card via-sapphire-surface to-sapphire-bg shadow-2xl shadow-inner-glow sm:max-w-xl md:max-w-2xl">
        <div className="flex shrink-0 flex-col border-b border-sapphire-border">
          <div className="flex items-center justify-between px-4 pb-2 pt-4 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={micBusy || isRecording || phase === "prep"}
              className="rounded-full px-2 py-1 text-2xl leading-none text-sapphire-text-dim transition hover:bg-white/5 hover:text-sapphire-text disabled:opacity-40"
              aria-label={t("actions.back")}
            >
              ←
            </button>
            <h2 className="text-center text-base font-bold tracking-wide text-white sm:text-lg">
              {title}
            </h2>
            <span className="w-8" aria-hidden />
          </div>
          {headerTimer && (
            <div
              className={`mx-4 mb-3 flex items-center justify-center gap-3 rounded-2xl px-4 py-2.5 sm:mx-6 ${
                headerTimer.tone === "prep"
                  ? "border border-brand-500/35 bg-brand-500/15"
                  : "border border-rose-500/35 bg-rose-500/10"
              }`}
              aria-live="polite"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-sapphire-text-dim">
                {headerTimer.label}
              </span>
              <span
                className={`font-mono text-2xl font-bold tabular-nums sm:text-3xl ${
                  headerTimer.tone === "prep" ? "text-brand-200" : "text-rose-200"
                }`}
              >
                {headerTimer.clock}
              </span>
            </div>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-5 pb-6 pt-6 sm:px-8">
            <div className="flex w-full flex-col items-center justify-center">
              <div className="mx-auto flex items-center justify-center">
                <TalkingHeadAvatar
                  ref={avatarRef}
                  size="hero"
                  frame="circle"
                  showChrome={false}
                  className="!items-center"
                  onError={handleAvatarError}
                />
              </div>

              <p className="mt-4 w-full text-center text-sm font-medium text-sapphire-text-dim sm:text-base">
                {statusLabel()}
              </p>
            </div>

            {!inFollowUp && (
              <div className="mt-5 w-full rounded-2xl border border-sapphire-border bg-sapphire-card/80 px-4 py-4 text-left shadow-inner-glow">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-300">
                  {mode === "speaking"
                    ? t("avatar.session.cueCard")
                    : t("avatar.session.listeningPaper")}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-sapphire-text sm:text-base">
                  {questionText}
                </p>
              </div>
            )}

            {inFollowUp && activeFollowUp && (
              <div
                key={`fu-${activeFollowUp.index}`}
                className="mt-5 w-full rounded-2xl border border-brand-500/30 bg-brand-500/10 px-4 py-4 text-left"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-300">
                  {t("avatar.session.followUpLabel", {
                    n: activeFollowUp.index + 1,
                    total: followUps.length,
                  })}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-sapphire-text sm:text-base">
                  {activeFollowUp.text}
                </p>
              </div>
            )}

            {error && (
              <p className="mt-3 text-center text-sm text-rose-300">{error}</p>
            )}

            <div className="mt-6 flex w-full flex-col items-center gap-3">
              {canHear && (
                <button
                  type="button"
                  onClick={() => void handleHearClick()}
                  className="btn-primary w-full max-w-sm rounded-full"
                >
                  {mode === "listening"
                    ? t("avatar.session.playListening")
                    : t("avatar.session.hearQuestion")}
                </button>
              )}

              {mode === "speaking" && (
                <>
                  {canStartEarly && !micBusy && (
                    <button
                      type="button"
                      onClick={startMainRecording}
                      className="btn-primary w-full max-w-sm rounded-full"
                    >
                      {t("avatar.session.startSpeakingNow")}
                    </button>
                  )}
                  {canStartFollowUp && !micBusy && (
                    <button
                      type="button"
                      onClick={startFollowUpRecording}
                      className="btn-primary w-full max-w-sm rounded-full"
                    >
                      {t("avatar.session.answerFollowUp")}
                    </button>
                  )}
                  {isRecording && (
                    <button
                      type="button"
                      onClick={() => void micRef.current?.stop()}
                      disabled={micBusy}
                      className="btn-secondary w-full max-w-sm rounded-full border-rose-500/40 text-rose-300 disabled:opacity-50"
                    >
                      {t("speaking.stop")}
                    </button>
                  )}
                  {micBusy && (
                    <p className="text-sm text-sapphire-muted">
                      {t("speaking.transcribing")}
                    </p>
                  )}
                  <MicRecorder
                    ref={micRef}
                    hideControls
                    transcript={localTranscript}
                    onTranscriptChange={(text, url) => {
                      transcriptRef.current = text;
                      setLocalTranscript(text);
                      onTranscriptChange?.(text, url);
                    }}
                    onBusyChange={(busy) => {
                      setMicBusy(busy);
                      if (busy) updatePhase("transcribing");
                    }}
                    onStopped={handleRecordingStopped}
                  />
                </>
              )}

              {mode === "listening" && phase === "done" && (
                <button
                  type="button"
                  onClick={() => void handleHearClick()}
                  className="btn-primary w-full max-w-sm rounded-full"
                >
                  {t("listening.play")}
                </button>
              )}
              {mode === "listening" && phase === "listen" && (
                <p className="text-sm text-sapphire-muted">
                  {t("avatar.session.listenCarefully")}
                </p>
              )}

              <button
                type="button"
                onClick={resetSession}
                disabled={micBusy || isRecording || phase === "prep"}
                className="btn-secondary w-full max-w-sm rounded-2xl text-rose-300 disabled:opacity-40"
              >
                {t("avatar.session.reset")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
