"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AvatarSessionModal } from "@/components/talking-avatar/AvatarSessionModal";

/**
 * Listening entry: 3D coach popup + always-available HTML audio backup.
 */
export function AudioPlayer({
  src,
  title,
  questionText,
  autoOpen = true,
}: {
  src: string;
  title?: string;
  questionText?: string;
  autoOpen?: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [forceFallback, setForceFallback] = useState(false);

  useEffect(() => {
    setForceFallback(false);
    if (autoOpen) setOpen(true);
  }, [autoOpen, src]);

  return (
    <>
      <div className="card space-y-4">
        <p className="text-sm text-sapphire-text-dim">
          {forceFallback
            ? t("avatar.audioFallbackIntro")
            : t("avatar.listeningIntro")}
        </p>
        {!forceFallback && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn-primary px-5"
          >
            {t("avatar.session.openListening")}
          </button>
        )}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-300">
            {t("avatar.audioFallbackLabel")}
          </p>
          <audio controls preload="metadata" src={src} className="w-full" />
          <p className="text-xs text-sapphire-muted">
            {t("avatar.audioBackupHint")}
          </p>
        </div>
      </div>

      {!forceFallback && (
        <AvatarSessionModal
          open={open}
          onClose={() => setOpen(false)}
          onPlaybackFailed={() => {
            setForceFallback(true);
            setOpen(false);
          }}
          mode="listening"
          title={title || t("avatar.session.listeningTitle")}
          questionText={
            questionText || t("avatar.session.listeningDefaultQuestion")
          }
          audioSrc={src}
        />
      )}
    </>
  );
}
