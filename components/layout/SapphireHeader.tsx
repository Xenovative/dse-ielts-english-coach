"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/language-switcher/LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { IconSearch, IconBell, IconMenu } from "./Icons";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "nav.dashboard",
  "/practice": "nav.practice",
  "/results": "nav.results",
  "/settings": "nav.settings",
};

interface SapphireHeaderProps {
  onMenuClick?: () => void;
  showMenu?: boolean;
}

export function SapphireHeader({ onMenuClick, showMenu }: SapphireHeaderProps) {
  const { t } = useTranslation();
  const pathname = usePathname();

  const titleKey =
    Object.entries(PAGE_TITLES).find(([path]) => pathname.startsWith(path))?.[1] ??
    "app.name";

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-sapphire-border px-4 lg:px-6">
      {showMenu && (
        <button
          type="button"
          onClick={onMenuClick}
          className="icon-btn lg:hidden"
          aria-label={t("header.menu")}
        >
          <IconMenu />
        </button>
      )}

      {/* Breadcrumb pill */}
      <div className="hidden items-center gap-2 rounded-full border border-sapphire-border bg-sapphire-card px-4 py-1.5 text-xs text-sapphire-text-dim sm:flex">
        <span className="font-semibold tracking-wide text-white">
          English Coach
        </span>
        <span className="text-sapphire-muted">/</span>
        <span className="font-medium text-sapphire-text">{t(titleKey)}</span>
      </div>

      <div className="flex-1" />

      {/* Search */}
      <div className="hidden items-center gap-2 rounded-2xl border border-sapphire-border bg-sapphire-card px-3 py-2 md:flex">
        <IconSearch className="h-4 w-4 text-sapphire-muted" />
        <input
          type="search"
          placeholder={t("header.search")}
          className="w-32 border-0 bg-transparent text-xs text-sapphire-text placeholder:text-sapphire-muted focus:outline-none focus:ring-0 lg:w-44"
        />
      </div>

      {/* Monthly pill */}
      <button
        type="button"
        className="hidden items-center gap-1.5 rounded-2xl border border-sapphire-border bg-sapphire-card px-3 py-2 text-xs font-medium text-sapphire-text-dim sm:flex"
      >
        📅 {t("header.monthly")}
      </button>

      <ThemeToggle />
      <LanguageSwitcher />

      <button type="button" className="icon-btn relative" aria-label={t("header.notifications")}>
        <IconBell className="h-[18px] w-[18px]" />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand-500" />
      </button>

      <Link
        href="/settings"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-xs font-bold text-white shadow-glow"
        aria-label={t("header.profile")}
      >
        S
      </Link>
    </header>
  );
}
