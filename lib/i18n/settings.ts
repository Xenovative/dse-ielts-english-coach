import type { Locale } from "@/lib/types";

export const LOCALES: Locale[] = ["en", "zh-Hant", "zh-Hans"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "dse_locale";
export const THEME_COOKIE = "dse_theme";

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as string[]).includes(value);
}

export function resolveLocale(value: string | undefined | null): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export const HTML_LANG: Record<Locale, string> = {
  en: "en",
  "zh-Hant": "zh-Hant",
  "zh-Hans": "zh-Hans",
};
