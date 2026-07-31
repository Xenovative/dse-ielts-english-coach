"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AvatarSessionModal } from "@/components/talking-avatar/AvatarSessionModal";

/**
 * Speaking practice entry: opens a large AI-avatar session popup
 * (question under the circular 3D coach, 1-minute speak, then coach lip-sync reply).
 */
export function SpeakingCoach({
  prompt,
  followUps = [],
  transcript = "",
  onTranscriptChange,
  onSessionComplete,
  onOpenChange,
  autoOpen = true,
}: {
  prompt: string;
  followUps?: string[];
  transcript?: string;
  onTranscriptChange?: (transcript: string, audioUrl: string | null) => void;
  onSessionComplete?: () => void;
  onOpenChange?: (open: boolean) => void;
  autoOpen?: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (autoOpen) setOpen(true);
  }, [autoOpen, prompt]);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  function setModalOpen(next: boolean) {
    setOpen(next);
    onOpenChange?.(next);
  }

  return (
    <>
      <div className="card space-y-4 border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-sapphire-card to-sapphire-card">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-300">
            {t("avatar.questionLabel")}
          </p>
          <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-base font-medium leading-relaxed text-white">
            {prompt}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="btn-primary"
        >
          {t("avatar.session.openSpeaking")}
        </button>
        <p className="text-xs text-sapphire-muted">{t("avatar.speakingHint")}</p>
      </div>

      <AvatarSessionModal
        open={open}
        onClose={() => setModalOpen(false)}
        onSessionComplete={() => {
          setModalOpen(false);
          onSessionComplete?.();
        }}
        mode="speaking"
        title={t("avatar.session.speakingTitle")}
        questionText={prompt}
        followUps={followUps}
        transcript={transcript}
        onTranscriptChange={onTranscriptChange}
      />
    </>
  );
}
