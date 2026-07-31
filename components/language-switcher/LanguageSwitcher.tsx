"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAppI18n } from "@/lib/i18n/provider";
import { LOCALES } from "@/lib/i18n/settings";
import type { Locale } from "@/lib/types";

export function LanguageSwitcher({ light = false }: { light?: boolean }) {
  const { t } = useTranslation();
  const { locale, setLocale } = useAppI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const short =
    locale === "en" ? "EN" : locale === "zh-Hant" ? "繁" : "简";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("language.label")}
        className={
          light
            ? "flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-white/15"
            : "icon-btn gap-1.5 !w-auto px-3 text-xs font-medium"
        }
      >
        <span aria-hidden>🌐</span>
        <span className="hidden sm:inline">{t(`language.${locale}`)}</span>
        <span className="sm:hidden">{short}</span>
      </button>
      {open && (
        <ul
          role="listbox"
          className={`absolute right-0 z-50 mt-2 w-44 animate-fade-in overflow-hidden rounded-2xl border py-1 shadow-glow-lg ${
            light
              ? "border-white/20 bg-[#1a0a3e]/95 backdrop-blur-xl"
              : "border-sapphire-border bg-sapphire-card"
          }`}
        >
          {LOCALES.map((l: Locale) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === locale}
                onClick={() => {
                  setLocale(l);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition hover:bg-white/5 ${
                  l === locale
                    ? "font-semibold text-brand-300"
                    : "text-sapphire-text-dim"
                }`}
              >
                {t(`language.${l}`)}
                {l === locale && <span className="text-brand-400" aria-hidden>✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
