import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/provider";
import {
  HTML_LANG,
  LOCALE_COOKIE,
  THEME_COOKIE,
  resolveLocale,
} from "@/lib/i18n/settings";
import type { Theme } from "@/lib/types";

export const metadata: Metadata = {
  title: "DSE + IELTS English Coach",
  description:
    "Mobile-first, multilingual exam-prep for HKDSE English and IELTS (Academic & General) with AI feedback.",
};

export const viewport: Viewport = {
  themeColor: "#07070d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// Default to dark (Sapphire UI). Users can still switch via theme toggle.
const themeScript = `
(function(){try{
  var t=document.cookie.match(/dse_theme=([^;]+)/);
  t=t?t[1]:(localStorage.getItem('dse_theme')||'dark');
  var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark',d);
}catch(e){document.documentElement.classList.add('dark');}})();
`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  const theme = (cookieStore.get(THEME_COOKIE)?.value as Theme) || "dark";

  return (
    <html lang={HTML_LANG[locale]} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <I18nProvider initialLocale={locale} initialTheme={theme}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
