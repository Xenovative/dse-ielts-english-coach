"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { I18nextProvider } from "react-i18next";
import i18n, { ensureI18nLocale } from "./i18next";
import { DEFAULT_LOCALE, LOCALE_COOKIE, THEME_COOKIE, resolveLocale } from "./settings";
import type { Locale, Theme } from "@/lib/types";

interface AppI18nContext {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const Ctx = createContext<AppI18nContext | null>(null);

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = theme === "dark" || (theme === "system" && prefersDark);
  root.classList.toggle("dark", dark);
}

export function I18nProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
  initialTheme = "dark",
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
  initialTheme?: Theme;
}) {
  const [locale, setLocaleState] = useState<Locale>(resolveLocale(initialLocale));
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [ready, setReady] = useState(i18n.isInitialized);

  useEffect(() => {
    if (i18n.isInitialized) {
      ensureI18nLocale(locale);
      setReady(true);
      return;
    }
    const onReady = () => {
      ensureI18nLocale(locale);
      setReady(true);
    };
    i18n.on("initialized", onReady);
    return () => {
      i18n.off("initialized", onReady);
    };
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    void i18n.changeLanguage(next);
    setCookie(LOCALE_COOKIE, next);
    try {
      localStorage.setItem(LOCALE_COOKIE, next);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = next;
    void fetch("/api/language", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    }).catch(() => undefined);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    setCookie(THEME_COOKIE, next);
    try {
      localStorage.setItem(THEME_COOKIE, next);
    } catch {
      /* ignore */
    }
    applyTheme(next);
    void fetch("/api/language", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: next }),
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    applyTheme(theme);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => theme === "system" && applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const value = useMemo(
    () => ({ locale, setLocale, theme, setTheme }),
    [locale, setLocale, theme, setTheme],
  );

  if (!ready) {
    return null;
  }

  return (
    <Ctx.Provider value={value}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </Ctx.Provider>
  );
}

export function useAppI18n(): AppI18nContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppI18n must be used within I18nProvider");
  return ctx;
}
