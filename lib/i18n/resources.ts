import en from "@/messages/en.json";
import zhHant from "@/messages/zh-Hant.json";
import zhHans from "@/messages/zh-Hans.json";

export const resources = {
  en: { translation: en },
  "zh-Hant": { translation: zhHant },
  "zh-Hans": { translation: zhHans },
} as const;
