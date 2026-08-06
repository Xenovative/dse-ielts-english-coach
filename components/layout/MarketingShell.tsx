"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { LanguageSwitcher } from "@/components/language-switcher/LanguageSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div className="min-h-screen">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-sapphire-border bg-sapphire-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <BrandLogo
            href="/"
            variant="mark"
            tone="white"
            priority
            imgClassName="h-10 w-10 object-contain sm:h-11 sm:w-11"
          />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            <Link href="/login" className="btn-ghost hidden px-3 text-sm sm:inline-flex">
              {t("nav.login")}
            </Link>
            <Link href="/signup" className="btn-primary px-4 text-sm">
              {t("nav.signup")}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 pb-16">{children}</main>

      {/* Floating CTA on mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-sapphire-border bg-sapphire-surface/95 p-3 backdrop-blur-xl sm:hidden">
        <button
          type="button"
          onClick={() => router.push("/signup")}
          className="btn-primary w-full"
        >
          {t("marketing.ctaPrimary")}
        </button>
      </div>
    </div>
  );
}
