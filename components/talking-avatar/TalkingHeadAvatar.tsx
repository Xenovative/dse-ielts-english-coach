"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  estimateVisemesFromAudio,
  estimateWordTimings,
} from "@/lib/audio/word-timings";

export type TalkingHeadAvatarHandle = {
  /** TTS via /api/tts, then lip-sync with word timings from the same text. Returns duration seconds. */
  speakText: (text: string) => Promise<number>;
  /** Play a remote audio URL; optional text for word lipsync, else energy visemes. Returns duration seconds. */
  speakUrl: (url: string, transcript?: string | null) => Promise<number>;
  /** Must be called from a click/tap so the browser allows Web Audio playback. */
  unlockAudio: () => Promise<boolean>;
  stop: () => void;
  setMuted: (muted: boolean) => void;
  setPlaybackSpeed: (rate: number) => void;
  isReady: () => boolean;
};

type Props = {
  size?: "md" | "lg" | "hero";
  /** Circular white frame like speaking-test reference UI. */
  frame?: "rounded" | "circle";
  name?: string;
  subtitle?: string;
  /** Hide name/subtitle chrome under the canvas. */
  showChrome?: boolean;
  hidden?: boolean;
  muted?: boolean;
  className?: string;
  onSpeakingChange?: (speaking: boolean) => void;
  onError?: (message: string) => void;
};

const AVATAR_URL = "/avatars/coach.glb";

type HeadInstance = {
  showAvatar: (
    avatar: Record<string, unknown>,
    onprogress?: ((ev: ProgressEvent) => void) | null,
  ) => Promise<void>;
  speakAudio: (
    audio: Record<string, unknown>,
    opt?: Record<string, unknown> | null,
  ) => void;
  stopSpeaking: () => void;
  setMixerGain: (speech: number, background?: number | null, fadeSecs?: number) => void;
  setSlowdownRate: (k: number) => void;
  setView?: (view: string, opt?: Record<string, unknown>) => void;
  lookAtCamera?: (t: number) => void;
  dispose: () => void;
  lipsync: Record<string, unknown>;
  audioCtx: AudioContext;
  isSpeaking: boolean;
  isAudioPlaying: boolean;
};

/**
 * Client-only TalkingHead (met4citizen) wrapper.
 * Uses free edge-tts (/api/tts) + speakAudio — never Google TTS.
 */
export const TalkingHeadAvatar = forwardRef<TalkingHeadAvatarHandle, Props>(
  function TalkingHeadAvatar(
    {
      size = "md",
      frame = "rounded",
      name,
      subtitle,
      showChrome = true,
      hidden = false,
      muted = false,
      className = "",
      onSpeakingChange,
      onError,
    },
    ref,
  ) {
    const { t } = useTranslation();
    const containerRef = useRef<HTMLDivElement | null>(null);
    const headRef = useRef<HeadInstance | null>(null);
    const readyRef = useRef(false);
    const mutedRef = useRef(muted);
    const speedRef = useRef(1);
    const pollRef = useRef<number | null>(null);
    const speakingRef = useRef(false);
    const bufferCache = useRef<Map<string, AudioBuffer>>(new Map());
    // Keep unstable props out of the GLB init effect deps (countdown re-renders).
    const onErrorRef = useRef(onError);
    const tRef = useRef(t);

    const [ready, setReady] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [speaking, setSpeaking] = useState(false);

    mutedRef.current = muted;
    onErrorRef.current = onError;
    tRef.current = t;

    const setSpeakingState = useCallback(
      (next: boolean) => {
        if (speakingRef.current === next) return;
        speakingRef.current = next;
        setSpeaking(next);
        onSpeakingChange?.(next);
      },
      [onSpeakingChange],
    );

    const stopPoll = useCallback(() => {
      if (pollRef.current != null) {
        cancelAnimationFrame(pollRef.current);
        pollRef.current = null;
      }
    }, []);

    const applyMute = useCallback((head: HeadInstance, isMuted: boolean) => {
      try {
        head.setMixerGain(isMuted ? 0.0001 : 1, null, 0.05);
      } catch {
        /* ignore */
      }
    }, []);

    const unlockAudio = useCallback(async (): Promise<boolean> => {
      const head = headRef.current;
      if (!head) return false;
      try {
        if (head.audioCtx.state === "suspended" || head.audioCtx.state === "interrupted") {
          await head.audioCtx.resume();
        }
        // Tiny silent buffer fully unlocks autoplay on Chromium/Safari.
        const silent = head.audioCtx.createBuffer(1, 1, 22050);
        const src = head.audioCtx.createBufferSource();
        src.buffer = silent;
        src.connect(head.audioCtx.destination);
        src.start(0);
        return head.audioCtx.state === "running";
      } catch {
        return false;
      }
    }, []);

    /** Wait until TalkingHead actually finishes (or detect silent autoplay block). */
    const waitUntilSpoken = useCallback(
      async (head: HeadInstance, expectedSecs: number) => {
        const deadline = Date.now() + Math.max(2000, expectedSecs * 1000 + 4000);
        let sawPlay = false;
        const start = Date.now();
        while (Date.now() < deadline) {
          if (head.isSpeaking || head.isAudioPlaying) {
            sawPlay = true;
          } else if (sawPlay) {
            // Started then finished.
            break;
          } else if (Date.now() - start > 1200) {
            // Never started — almost always browser autoplay / suspended AudioContext.
            throw new Error(t("avatar.tapToHearHint"));
          }
          await new Promise((r) => window.setTimeout(r, 40));
        }
        setSpeakingState(false);
      },
      [setSpeakingState, t],
    );

    useEffect(() => {
      let cancelled = false;
      const node = containerRef.current;
      if (!node) return;
      // #region agent log
      fetch('http://127.0.0.1:7297/ingest/461a83a5-6229-4271-a7d9-4e3e2cf16e5c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'884e6c'},body:JSON.stringify({sessionId:'884e6c',runId:'post-fix',hypothesisId:'A',location:'TalkingHeadAvatar.tsx:initEffect',message:'avatar init effect RUN (will load GLB)',data:{frame},timestamp:Date.now()})}).catch(()=>{});
      // #endregion

      (async () => {
        try {
          setLoading(true);
          setLoadError(null);

          const [{ TalkingHead }, { LipsyncEn }] = await Promise.all([
            import("@met4citizen/talkinghead"),
            import("@met4citizen/talkinghead/modules/lipsync-en.mjs"),
          ]);

          if (cancelled || !containerRef.current) return;

          const isCircle = frame === "circle";
          const head = new TalkingHead(containerRef.current, {
            ttsEndpoint: "",
            lipsyncModules: [],
            lipsyncLang: "en",
            // Head crop fills the circle; upper left empty space away.
            cameraView: isCircle ? "head" : "upper",
            cameraRotateEnable: !isCircle,
            cameraPanEnable: false,
            cameraZoomEnable: false,
            // Shift framing: avatar was low-right → nudge left + slightly up + closer.
            cameraX: isCircle ? -0.18 : 0,
            cameraY: isCircle ? 0.12 : 0,
            cameraDistance: isCircle ? -0.45 : 0,
            cameraRotateX: 0,
            cameraRotateY: 0,
            avatarMood: "neutral",
            // Strong eye contact so the coach looks at the student.
            avatarIgnoreCamera: false,
            avatarIdleEyeContact: isCircle ? 0.95 : 0.35,
            avatarSpeakingEyeContact: 1,
            avatarIdleHeadMove: isCircle ? 0.12 : 0.35,
            avatarSpeakingHeadMove: isCircle ? 0.18 : 0.4,
            modelFPS: 30,
            lightAmbientIntensity: 2.4,
            lightDirectIntensity: 32,
          }) as unknown as HeadInstance;

          head.lipsync.en = new LipsyncEn();
          headRef.current = head;

          await head.showAvatar({
            url: AVATAR_URL,
            body: "F",
            avatarMood: "neutral",
            lipsyncLang: "en",
            avatarIgnoreCamera: false,
            avatarIdleEyeContact: isCircle ? 0.95 : 0.35,
            avatarSpeakingEyeContact: 1,
            avatarIdleHeadMove: isCircle ? 0.12 : 0.35,
            avatarSpeakingHeadMove: isCircle ? 0.18 : 0.4,
          });

          if (cancelled) {
            head.dispose();
            return;
          }

          // Re-apply framing after load (height is known) and lock eyes on camera.
          if (isCircle && head.setView) {
            head.setView("head", {
              cameraX: -0.18,
              cameraY: 0.12,
              cameraDistance: -0.45,
              cameraRotateX: 0,
              cameraRotateY: 0,
            });
          }
          head.lookAtCamera?.(0);

          // Soft refresh of eye contact while idle so the coach keeps meeting the student's gaze.
          const eyeContactTimer = window.setInterval(() => {
            if (!headRef.current?.isSpeaking) {
              headRef.current?.lookAtCamera?.(600);
            }
          }, 4500);

          applyMute(head, mutedRef.current);
          head.setSlowdownRate(1 / Math.max(0.5, speedRef.current));
          readyRef.current = true;
          setReady(true);

          // Attach timer id onto the instance for cleanup via outer scope.
          (head as HeadInstance & { __eyeTimer?: number }).__eyeTimer =
            eyeContactTimer;
        } catch (err) {
          if (!cancelled) {
            const msg =
              err instanceof Error
                ? err.message
                : tRef.current("avatar.loadFailed");
            setLoadError(msg);
            onErrorRef.current?.(msg);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();

      return () => {
        // #region agent log
        fetch('http://127.0.0.1:7297/ingest/461a83a5-6229-4271-a7d9-4e3e2cf16e5c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'884e6c'},body:JSON.stringify({sessionId:'884e6c',runId:'post-fix',hypothesisId:'A',location:'TalkingHeadAvatar.tsx:initEffect:cleanup',message:'avatar init effect CLEANUP (dispose GLB)',data:{frame},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        cancelled = true;
        stopPoll();
        readyRef.current = false;
        const head = headRef.current as
          | (HeadInstance & { __eyeTimer?: number })
          | null;
        headRef.current = null;
        if (head?.__eyeTimer) window.clearInterval(head.__eyeTimer);
        try {
          head?.stopSpeaking();
          head?.dispose();
        } catch {
          /* ignore */
        }
      };
      // Intentionally omit onError/t — unstable parent callbacks were remounting the GLB every countdown tick.
    }, [applyMute, frame, stopPoll]);

    useEffect(() => {
      const head = headRef.current;
      if (head && ready) applyMute(head, muted);
    }, [muted, ready, applyMute]);

    async function decodeUrl(url: string): Promise<AudioBuffer> {
      const head = headRef.current;
      if (!head) throw new Error(t("avatar.notReady"));

      const cached = bufferCache.current.get(url);
      if (cached) return cached;

      const candidates =
        url.endsWith(".mp3")
          ? [url, url.replace(/\.mp3$/i, ".wav")]
          : url.endsWith(".wav")
            ? [url, url.replace(/\.wav$/i, ".mp3")]
            : [url];

      let lastErr: unknown;
      for (const candidate of candidates) {
        try {
          const res = await fetch(candidate);
          if (!res.ok) continue;
          const raw = await res.arrayBuffer();
          if (head.audioCtx.state === "suspended") await head.audioCtx.resume();
          const buffer = await head.audioCtx.decodeAudioData(raw.slice(0));
          bufferCache.current.set(url, buffer);
          return buffer;
        } catch (e) {
          lastErr = e;
        }
      }
      throw lastErr instanceof Error ? lastErr : new Error(t("avatar.ttsFailed"));
    }

    async function speakBuffer(
      buffer: AudioBuffer,
      transcript?: string | null,
    ): Promise<number> {
      const head = headRef.current;
      if (!head || !readyRef.current) throw new Error(t("avatar.notReady"));

      await unlockAudio();
      if (head.audioCtx.state === "suspended" || head.audioCtx.state === "interrupted") {
        throw new Error(t("avatar.tapToHearHint"));
      }

      head.stopSpeaking();
      head.setSlowdownRate(1 / Math.max(0.5, speedRef.current));
      applyMute(head, mutedRef.current);
      head.lookAtCamera?.(400);

      const durationMs = buffer.duration * 1000;
      const payload: Record<string, unknown> = { audio: buffer };

      const text = transcript?.trim();
      if (text) {
        const timing = estimateWordTimings(text, durationMs);
        payload.words = timing.words;
        payload.wtimes = timing.wtimes;
        payload.wdurations = timing.wdurations;
      } else {
        const vis = estimateVisemesFromAudio(buffer);
        payload.words = [];
        payload.visemes = vis.visemes;
        payload.vtimes = vis.vtimes;
        payload.vdurations = vis.vdurations;
      }

      const durationSecs = buffer.duration / Math.max(0.5, speedRef.current);
      setSpeakingState(true);
      head.speakAudio(payload, { lipsyncLang: "en" });
      await waitUntilSpoken(head, durationSecs);
      return durationSecs;
    }

    useImperativeHandle(
      ref,
      () => ({
        async speakText(text: string) {
          const trimmed = text.trim();
          if (!trimmed) return 0;
          try {
            const res = await fetch("/api/tts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: trimmed }),
            });
            const data = await res.json();
            if (!res.ok) {
              throw new Error(data?.error?.message || t("avatar.ttsFailed"));
            }
            const buffer = await decodeUrl(data.url as string);
            return await speakBuffer(buffer, trimmed);
          } catch (err) {
            setSpeakingState(false);
            const msg =
              err instanceof Error ? err.message : t("avatar.ttsFailed");
            onError?.(msg);
            throw err;
          }
        },

        async speakUrl(url: string, transcript?: string | null) {
          try {
            const buffer = await decodeUrl(url);
            return await speakBuffer(buffer, transcript);
          } catch (err) {
            setSpeakingState(false);
            const msg =
              err instanceof Error ? err.message : t("listening.playError");
            onError?.(msg);
            throw err;
          }
        },

        unlockAudio: () => unlockAudio(),

        stop() {
          stopPoll();
          try {
            headRef.current?.stopSpeaking();
          } catch {
            /* ignore */
          }
          setSpeakingState(false);
        },

        setMuted(next: boolean) {
          mutedRef.current = next;
          if (headRef.current) applyMute(headRef.current, next);
        },

        setPlaybackSpeed(rate: number) {
          const safe = Math.max(0.5, Math.min(2, rate));
          speedRef.current = safe;
          try {
            headRef.current?.setSlowdownRate(1 / safe);
          } catch {
            /* ignore */
          }
        },

        isReady: () => readyRef.current,
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [applyMute, onError, setSpeakingState, stopPoll, t, unlockAudio, waitUntilSpoken],
    );

    const box =
      size === "hero"
        ? frame === "circle"
          ? "h-[min(58vw,320px)] w-[min(58vw,320px)] sm:h-[380px] sm:w-[380px] md:h-[420px] md:w-[420px]"
          : "h-[360px] w-full max-w-[420px] sm:h-[420px]"
        : size === "lg"
          ? "h-[280px] w-[220px] sm:h-[320px] sm:w-[250px]"
          : "h-[220px] w-[180px] sm:h-[260px] sm:w-[210px]";

    const frameClass =
      frame === "circle"
        ? "rounded-full border-[5px] border-white shadow-[0_12px_40px_rgba(0,0,0,0.35)] bg-[#e8e8e8]"
        : "rounded-2xl bg-gradient-to-b from-sky-950/80 via-sapphire-card to-sapphire-bg";

    return (
      <div
        className={`flex flex-col items-center gap-2 ${className} ${
          hidden ? "pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0" : ""
        }`}
        aria-hidden={hidden || undefined}
      >
        <div className={`relative mx-auto overflow-hidden ${frameClass} ${box}`}>
          <div
            ref={containerRef}
            className="absolute inset-0 flex items-center justify-center [&_canvas]:!h-full [&_canvas]:!w-full [&_canvas]:!object-cover"
          />
          {(loading || !ready) && !loadError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-xs text-white/80">
              {t("avatar.loading3d")}
            </div>
          )}
          {loadError && (
            <div className="absolute inset-0 flex items-center justify-center p-3 text-center text-xs text-rose-200">
              {loadError}
            </div>
          )}
        </div>
        {showChrome && (
          <div className="text-center">
            <p className="text-sm font-semibold text-white">
              {name ?? t("avatar.name")}
            </p>
            <p className="text-xs text-sapphire-muted">
              {subtitle ??
                (speaking ? t("avatar.speakingNow") : t("avatar.speakingCoach"))}
            </p>
          </div>
        )}
      </div>
    );
  },
);
