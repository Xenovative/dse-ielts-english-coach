"use client";

import { useTranslation } from "react-i18next";

/**
 * Listening entry: plain exam audio only (no 3D avatar).
 */
export function AudioPlayer({
  src,
  title,
}: {
  src: string;
  title?: string;
  /** Kept for call-site compatibility; unused (no avatar popup). */
  questionText?: string;
  autoOpen?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="card space-y-4">
      {title ? (
        <p className="text-sm font-semibold text-sapphire-text">{title}</p>
      ) : null}
      <p className="text-sm text-sapphire-text-dim">{t("avatar.listeningIntro")}</p>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-300">
          {t("avatar.audioFallbackLabel")}
        </p>
        <audio controls preload="metadata" src={src} className="w-full" />
        <p className="text-xs text-sapphire-muted">{t("listening.idleHint")}</p>
      </div>
    </div>
  );
}
