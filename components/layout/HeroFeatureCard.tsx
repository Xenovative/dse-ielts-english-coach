"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

export function HeroFeatureCard() {
  const { t } = useTranslation();

  return (
    <Link href="/practice" className="card-glow group relative flex min-h-[200px] flex-col justify-between overflow-hidden p-6 transition hover:shadow-glow-lg md:min-h-[240px]">
      <div className="relative z-10">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-300">
          ✨ AI Powered
        </span>
        <h2 className="mt-4 max-w-xs text-xl font-bold leading-snug text-white md:text-2xl">
          {t("actions.startPractice")}
        </h2>
        <p className="mt-2 max-w-xs text-sm text-sapphire-text-dim">
          {t("app.tagline")}
        </p>
      </div>

      <div className="relative z-10 mt-4">
        <span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition group-hover:bg-white/15">
          {t("actions.continue")}
          <span aria-hidden>→</span>
        </span>
      </div>

      {/* Abstract 3D blob — CSS gradient orb like the reference */}
      <div
        className="pointer-events-none absolute -right-8 bottom-0 h-48 w-48 animate-pulse-glow rounded-full opacity-80 md:-right-4 md:h-56 md:w-56"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, #fbbf24 0%, #f97316 30%, #ec4899 60%, #8b5cf6 100%)",
          filter: "blur(2px)",
          transform: "rotate(-15deg)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-4 bottom-4 h-32 w-32 rounded-full opacity-40"
        style={{
          background: "radial-gradient(circle, rgba(249,115,22,0.6) 0%, transparent 70%)",
          filter: "blur(20px)",
        }}
        aria-hidden
      />
    </Link>
  );
}
