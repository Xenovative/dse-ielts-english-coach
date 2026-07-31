"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export function Timer({
  seconds,
  onElapsed,
  running,
}: {
  seconds: number | null;
  onElapsed?: () => void;
  running: boolean;
}) {
  const { t } = useTranslation();
  const [left, setLeft] = useState<number | null>(seconds);
  const firedRef = useRef(false);

  useEffect(() => {
    setLeft(seconds);
    firedRef.current = false;
  }, [seconds]);

  useEffect(() => {
    if (!running || left == null) return;
    if (left <= 0) {
      if (!firedRef.current) {
        firedRef.current = true;
        onElapsed?.();
      }
      return;
    }
    const id = setInterval(() => setLeft((v) => (v == null ? v : v - 1)), 1000);
    return () => clearInterval(id);
  }, [running, left, onElapsed]);

  if (left == null) return null;
  const m = Math.floor(Math.max(0, left) / 60);
  const s = Math.max(0, left) % 60;
  const danger = left <= 30;

  return (
    <span
      className={`rounded-2xl border px-3 py-1.5 text-sm font-semibold tabular-nums ${
        danger
          ? "border-rose-500/40 bg-rose-500/15 text-rose-300"
          : "border-sapphire-border bg-sapphire-card text-sapphire-text"
      }`}
    >
      {t("common.timeLeft")}: {m}:{String(s).padStart(2, "0")}
    </span>
  );
}
