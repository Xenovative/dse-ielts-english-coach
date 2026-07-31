"use client";

import { useTranslation } from "react-i18next";
import { useAppI18n } from "@/lib/i18n/provider";
import type { Theme } from "@/lib/types";

const ORDER: Theme[] = ["light", "dark", "system"];
const ICON: Record<Theme, string> = { light: "☀️", dark: "🌙", system: "🖥️" };

export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, setTheme } = useAppI18n();

  function cycle() {
    const idx = ORDER.indexOf(theme);
    setTheme(ORDER[(idx + 1) % ORDER.length]);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={t("theme.toggle")}
      title={t(`theme.${theme}`)}
      className="icon-btn text-base"
    >
      <span aria-hidden>{ICON[theme]}</span>
    </button>
  );
}
