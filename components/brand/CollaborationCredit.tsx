"use client";

import { useTranslation } from "react-i18next";

/**
 * Subtle bottom-right partner credit for LEARN.
 * Soft / blurred so it stays out of the way of main UI.
 */
export function CollaborationCredit() {
  const { t } = useTranslation();

  return (
    <div
      className="pointer-events-none fixed bottom-3 right-3 z-[60] max-w-[min(92vw,22rem)] select-none sm:bottom-4 sm:right-4 lg:bottom-5 lg:right-5"
      aria-label={t("footer.builtWith")}
    >
      <div className="flex flex-col items-end gap-1 rounded-xl border border-white/10 bg-black/25 px-2.5 py-2 shadow-lg backdrop-blur-md blur-[0.6px] opacity-45 transition duration-300 hover:opacity-80 hover:blur-0 sm:px-3 sm:py-2.5">
        <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-white/80 sm:text-[10px]">
          {t("footer.builtWith")}
        </p>
        <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-3.5">
          <a
            href="https://cyber-beast.tech/?lang=zh"
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto inline-flex items-center rounded-md px-0.5 py-0.5 transition hover:bg-white/5"
            aria-label="Cyber Beast"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/partners/cyber-beast-logo.png"
              alt=""
              className="h-8 w-auto max-w-[10.5rem] object-contain object-right sm:h-9 sm:max-w-[12rem]"
            />
          </a>
          <a
            href="https://xenovative-ltd.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-md px-0.5 py-0.5 transition hover:bg-white/5"
            aria-label="Xenovative"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/partners/xenovative-logo.png"
              alt=""
              className="h-8 w-auto max-w-[2.25rem] object-contain sm:h-9 sm:max-w-[2.5rem]"
            />
            <span className="text-[11px] font-semibold tracking-wide text-white/90 sm:text-xs">
              Xenovative
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
