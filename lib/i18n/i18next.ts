"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { DEFAULT_LOCALE } from "./settings";
import { resources } from "./resources";
import type { Locale } from "@/lib/types";

// Initialize once at module load so I18nextProvider always receives a ready instance.
if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: DEFAULT_LOCALE,
    fallbackLng: DEFAULT_LOCALE,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export function ensureI18nLocale(locale: Locale) {
  if (i18n.language !== locale) {
    void i18n.changeLanguage(locale);
  }
}

export default i18n;
