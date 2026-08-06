"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { QuestionRenderer, type QuestionResult } from "@/components/question-renderer/QuestionRenderer";
import { WritingEditor } from "@/components/writing-editor/WritingEditor";
import { AudioPlayer } from "@/components/audio-player/AudioPlayer";
import { MicRecorder } from "@/components/mic-recorder/MicRecorder";
import { SpeakingCoach } from "@/components/talking-avatar/SpeakingCoach";
import { ScorePanel } from "@/components/score-panel/ScorePanel";
import { FeedbackPanel } from "@/components/feedback-panel/FeedbackPanel";
import { Timer } from "./Timer";
import type { PublicPractice, StructuredFeedback } from "@/lib/types";

interface SubmitResult {
  submissionId: string;
  rawPercent: number;
  scaledScore: string;
  subScores: Record<string, number>;
  perQuestion: {
    questionId: string;
    isCorrect: boolean;
    correctAnswer: unknown;
    explanation: string | null;
  }[];
}

export function PracticeRunner({ paperId }: { paperId: string }) {
  const { t } = useTranslation();
  const router = useRouter();

  const [practice, setPractice] = useState<PublicPractice | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [responseText, setResponseText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<StructuredFeedback | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [startedAt] = useState(() => Date.now());
  const [sessionDoneHint, setSessionDoneHint] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/practice?paper=${paperId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: PublicPractice) => setPractice(d))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [paperId]);

  const isObjective =
    practice?.skill === "reading" || practice?.skill === "listening";
  const isFreeText =
    practice?.skill === "writing" || practice?.skill === "speaking";

  const resultsByQuestion = useMemo(() => {
    const map: Record<string, QuestionResult> = {};
    result?.perQuestion.forEach((r) => {
      map[r.questionId] = {
        isCorrect: r.isCorrect,
        correctAnswer: r.correctAnswer,
        explanation: r.explanation,
      };
    });
    return map;
  }, [result]);

  const submit = useCallback(async () => {
    if (!practice || submitting || result) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const timeSpent = Math.round((Date.now() - startedAt) / 1000);
      const payload: Record<string, unknown> = {
        paperId: practice.paperId,
        skill: practice.skill,
        timeSpent,
      };
      if (isObjective) {
        payload.answers = Object.entries(answers).map(([questionId, value]) => ({
          questionId,
          value,
        }));
      } else {
        payload.responseText = responseText;
        if (audioUrl) payload.audioUrl = audioUrl;
      }

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error(data?.error?.message || t("common.error"));
      setResult(data);

      // Scroll to the score / AI feedback block so results are visible.
      window.setTimeout(() => {
        document
          .getElementById("practice-results")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);

      // AI coaching for every skill (reading/listening/writing/speaking)
      setFeedbackError(null);
      if (data.feedback) {
        setFeedback(data.feedback);
      } else {
        setFeedbackLoading(true);
        try {
          const fb = await fetch("/api/feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ submissionId: data.submissionId }),
          });
          const fbData = await fb.json();
          if (fb.ok && fbData.feedback) {
            setFeedback(fbData.feedback);
          } else {
            setFeedbackError(
              fbData?.error?.message || t("results.feedbackFailed"),
            );
          }
        } catch {
          setFeedbackError(t("results.feedbackFailed"));
        } finally {
          setFeedbackLoading(false);
        }
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setSubmitting(false);
    }
  }, [
    practice,
    submitting,
    result,
    startedAt,
    isObjective,
    isFreeText,
    answers,
    responseText,
    audioUrl,
    router,
    t,
  ]);

  const canSubmit = isObjective
    ? Object.keys(answers).length > 0
    : responseText.trim().length > 0;

  const handleTimerElapsed = useCallback(() => {
    if (!canSubmit || submitting || result) return;
    void submit();
  }, [canSubmit, submitting, result, submit]);

  if (loading) {
    return <p className="py-12 text-center text-sapphire-muted">{t("common.loading")}</p>;
  }
  if (loadError || !practice) {
    return <p className="py-12 text-center text-sapphire-muted">{t("common.error")}</p>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-400">
            {t(`exam.${practice.examCode}`)} · {t(`skill.${practice.skill}`)}
          </p>
          <h1 className="text-xl font-bold text-white md:text-2xl">{practice.title}</h1>
        </div>
        {!result && (
          <Timer
            seconds={practice.timeLimit}
            running
            onElapsed={handleTimerElapsed}
          />
        )}
      </div>

      {result && (
        <div id="practice-results" className="space-y-4 scroll-mt-24">
          <ScorePanel
            rawPercent={result.rawPercent}
            scaledScore={result.scaledScore}
            subScores={result.subScores}
          />
          <div className="card border-brand-500/20">
            <h2 className="mb-3 text-lg font-semibold text-white">
              {t("common.feedback")}
            </h2>
            {feedbackLoading ? (
              <p className="text-sm text-sapphire-muted">
                {t("results.generatingFeedback")}
              </p>
            ) : feedback ? (
              <FeedbackPanel feedback={feedback} />
            ) : (
              <p className="text-sm text-amber-200">
                {feedbackError || t("results.feedbackFailed")}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Passages (reading) */}
      {practice.passages.map((p) => (
        <div key={p.id} className="card">
          {p.title && <h2 className="mb-2 font-semibold text-white">{p.title}</h2>}
          <p className="whitespace-pre-wrap leading-relaxed text-sapphire-text-dim">
            {p.body}
          </p>
        </div>
      ))}

      {/* Audio (listening) — large avatar popup */}
      {practice.audioAssets.map((a) => (
        <AudioPlayer
          key={a.id}
          src={a.url}
          title={t("avatar.session.listeningTitle")}
          questionText={practice.title}
        />
      ))}

      {/* Writing prompt */}
      {practice.writingPrompt && (
        <div className="card bg-brand-500/10 border-brand-500/20">
          <p className="whitespace-pre-wrap text-sapphire-text">{practice.writingPrompt.prompt}</p>
        </div>
      )}

      {/* Speaking card + large avatar session popup */}
      {practice.speakingCard && (
        <>
          <SpeakingCoach
            prompt={practice.speakingCard.prompt}
            followUps={practice.speakingCard.followUps}
            transcript={responseText}
            onTranscriptChange={(transcript, url) => {
              setResponseText(transcript);
              setAudioUrl(url);
              setInterimText("");
            }}
            onOpenChange={setAvatarModalOpen}
            onSessionComplete={() => setSessionDoneHint(true)}
          />
          {sessionDoneHint && !result && (
            <p className="rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-200">
              {t("avatar.session.submitOnPage")}
            </p>
          )}
        </>
      )}

      {/* Objective questions */}
      {isObjective &&
        practice.questions.map((q, i) => (
          <QuestionRenderer
            key={q.id}
            question={q}
            index={i}
            value={answers[q.id]}
            onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
            result={resultsByQuestion[q.id]}
            disabled={!!result}
          />
        ))}

      {/* Writing editor */}
      {practice.skill === "writing" && (
        <WritingEditor
          value={responseText}
          onChange={setResponseText}
          minWords={practice.writingPrompt?.minWords ?? 150}
          disabled={!!result}
        />
      )}

      {/* Speaking: voice-only transcript (no typing / copy-paste) */}
      {practice.skill === "speaking" && !result && (
        <div
          className="card space-y-3"
          onCopy={(e) => e.preventDefault()}
          onCut={(e) => e.preventDefault()}
          onPaste={(e) => e.preventDefault()}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">{t("speaking.transcript")}</p>
            <p className="text-xs text-sapphire-muted">{t("speaking.transcriptHint")}</p>
          </div>
          {!avatarModalOpen && (
            <MicRecorder
              transcript={responseText}
              onTranscriptChange={(transcript, url) => {
                setResponseText(transcript);
                setAudioUrl(url);
                setInterimText("");
              }}
              onInterimChange={setInterimText}
              onRecordingChange={setIsListening}
            />
          )}
          <div
            role="textbox"
            aria-readonly="true"
            aria-label={t("speaking.transcript")}
            className="min-h-[10rem] select-none whitespace-pre-wrap rounded-xl border border-sapphire-border bg-sapphire-bg/60 px-4 py-3 text-sapphire-text"
          >
            {isListening && interimText
              ? `${responseText}${responseText ? " " : ""}${interimText}`
              : responseText.trim() || t("speaking.transcriptPlaceholder")}
          </div>
          {isListening && interimText && (
            <p className="rounded-lg border border-brand-500/20 bg-brand-500/10 px-3 py-2 text-sm italic text-brand-200">
              <span className="mr-2 not-italic font-semibold text-brand-300">
                {t("speaking.live")}
              </span>
              {interimText}
            </p>
          )}
          {audioUrl && !isListening && (
            <audio controls src={audioUrl} className="w-full" />
          )}
          <p className="text-xs text-sapphire-muted">{t("speaking.aiUsesTranscript")}</p>
        </div>
      )}

      {/* Show submitted transcript after scoring */}
      {practice.skill === "speaking" && result && responseText && (
        <div className="card">
          <p className="mb-1 text-sm font-semibold text-white">{t("speaking.transcript")}</p>
          <p className="whitespace-pre-wrap text-sapphire-text-dim">{responseText}</p>
        </div>
      )}

      {/* Action bar */}
      {!result ? (
        <>
          {submitError && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {submitError}
            </p>
          )}
          {/* Desktop submit */}
          <div className="hidden md:block">
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit || submitting}
              className="btn-primary"
            >
              {submitting ? t("results.generatingFeedback") : t("actions.submit")}
            </button>
          </div>
          {/* Sticky mobile submit */}
          <div className="fixed inset-x-0 bottom-16 z-30 border-t border-sapphire-border bg-sapphire-surface/95 p-3 backdrop-blur-xl md:hidden">
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit || submitting}
              className="btn-primary w-full"
            >
              {submitting ? t("results.generatingFeedback") : t("actions.submit")}
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-secondary"
          >
            {t("actions.retry")}
          </button>
          <button type="button" onClick={() => router.push("/results")} className="btn-primary">
            {t("actions.viewResults")}
          </button>
        </div>
      )}
    </div>
  );
}
