"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { LanguageSwitcher } from "@/components/language-switcher/LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  authed: boolean;
}

export function Header({ authed }: HeaderProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();

  const navLinks = authed
    ? [
        { href: "/dashboard", label: t("nav.dashboard") },
        { href: "/practice", label: t("nav.practice") },
        { href: "/results", label: t("nav.results") },
        { href: "/settings", label: t("nav.settings") },
      ]
    : [];

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
        <BrandLogo
          href={authed ? "/dashboard" : "/"}
          variant="mark"
          tone="auto"
          imgClassName="h-9 w-9 object-contain sm:h-10 sm:w-10"
        />

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
          {authed ? (
            <button type="button" onClick={logout} className="btn-ghost px-3 text-sm">
              {t("nav.logout")}
            </button>
          ) : (
            <>
              <Link href="/login" className="btn-ghost hidden px-3 text-sm sm:inline-flex">
                {t("nav.login")}
              </Link>
              <Link href="/signup" className="btn-primary px-4 text-sm">
                {t("nav.signup")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
