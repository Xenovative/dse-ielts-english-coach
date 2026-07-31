"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { LandingBackground } from "@/components/marketing/LandingBackground";
import { LanguageSwitcher } from "@/components/language-switcher/LanguageSwitcher";

export default function MarketingPage() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: t("marketing.navHome") },
    { href: "#faq", label: t("marketing.navFaq") },
    { href: "/signup", label: t("marketing.navJoinUs") },
  ];

  return (
    <div className="relative">
      <LandingBackground />

      {/* Navigation */}
      <header className="relative z-20 flex items-center justify-between px-6 py-8 md:px-12">
        <Link
          href="/"
          className="text-sm font-bold tracking-[0.25em] text-white"
        >
          {t("marketing.logo")}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-10 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs font-medium tracking-[0.2em] text-white/90 transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <LanguageSwitcher light />
        </nav>

        {/* Mobile menu button */}
        <div className="flex items-center gap-3 md:hidden">
          <LanguageSwitcher light />
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 text-white"
            aria-label="Menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile dropdown nav */}
      {menuOpen && (
        <nav className="relative z-20 flex flex-col gap-4 border-b border-white/10 bg-black/40 px-6 py-4 backdrop-blur-md md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-xs font-medium tracking-[0.2em] text-white/90"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}

      {/* Hero */}
      <main className="relative z-10 flex min-h-[calc(100vh-5rem)] flex-col justify-center px-6 pb-20 md:px-12 lg:px-16">
        <div className="max-w-xl animate-fade-in">
          <h1 className="text-3xl font-bold uppercase leading-tight tracking-[0.15em] text-white sm:text-4xl md:text-5xl lg:text-[3.25rem] lg:leading-[1.15]">
            {t("marketing.landingTitle")}
          </h1>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-white/70 md:text-base">
            {t("marketing.heroSubtitle")}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="inline-flex min-h-[48px] items-center justify-center rounded-sm border border-white px-10 py-3 text-sm font-medium tracking-widest text-white transition hover:bg-white/10"
            >
              {t("marketing.ctaGhost")}
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-[48px] items-center justify-center px-6 py-3 text-sm tracking-widest text-white/60 transition hover:text-white"
            >
              {t("marketing.ctaSecondary")}
            </Link>
          </div>
        </div>
      </main>

      {/* Features section (Gallery) */}
      <section id="features" className="relative z-10 border-t border-white/5 px-6 py-20 md:px-12">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
          {[
            { title: "marketing.feature1Title", body: "marketing.feature1Body" },
            { title: "marketing.feature2Title", body: "marketing.feature2Body" },
            { title: "marketing.feature3Title", body: "marketing.feature3Body" },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                {t(f.title)}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/60">{t(f.body)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 px-6 py-16 md:px-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-white/50">
            {t("marketing.navFaq")}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            {t("marketing.faqBlurb")}
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-sm border border-white px-10 py-3 text-sm font-medium tracking-widest text-white transition hover:bg-white/10"
          >
            {t("marketing.navJoinUs")}
          </Link>
        </div>
      </section>
    </div>
  );
}
