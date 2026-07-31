"use client";

import { useTranslation } from "react-i18next";
import { useAppI18n } from "@/lib/i18n/provider";
import { LOCALES } from "@/lib/i18n/settings";
import type { Locale, Theme } from "@/lib/types";

const THEMES: Theme[] = ["light", "dark", "system"];

export default function SettingsPage() {
  const { t } = useTranslation();
  const { locale, setLocale, theme, setTheme } = useAppI18n();

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-white">{t("settings.title")}</h1>
        <p className="mt-1 text-sm text-sapphire-text-dim">{t("settings.account")}</p>
      </div>

      <div className="card">
        <h2 className="mb-4 font-semibold text-white">{t("settings.language")}</h2>
        <div className="flex flex-wrap gap-2">
          {LOCALES.map((l: Locale) => (
            <button
              key={l}
              type="button"
              onClick={() => setLocale(l)}
              className={locale === l ? "chip-active" : "chip"}
            >
              {t(`language.${l}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4 font-semibold text-white">{t("settings.theme")}</h2>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((th) => (
            <button
              key={th}
              type="button"
              onClick={() => setTheme(th)}
              className={theme === th ? "chip-active" : "chip"}
            >
              {t(`theme.${th}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
