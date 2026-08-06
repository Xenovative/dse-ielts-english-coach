"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { BrandLogo } from "@/components/brand/BrandLogo";
import {
  IconDashboard,
  IconPractice,
  IconResults,
  IconMistakes,
  IconSettings,
  IconSparkle,
  IconLogout,
  IconChevronRight,
} from "./Icons";
import type { ExamCode } from "@/lib/types";

const GENERAL_NAV = [
  { href: "/dashboard", key: "nav.dashboard", Icon: IconDashboard },
  { href: "/practice", key: "nav.practice", Icon: IconPractice },
  { href: "/results", key: "nav.results", Icon: IconResults },
  { href: "/mistakes", key: "nav.mistakes", Icon: IconMistakes },
] as const;

const EXAM_LINKS: { code: ExamCode; emoji: string }[] = [
  { code: "DSE", emoji: "🇭🇰" },
  { code: "IELTS_ACADEMIC", emoji: "🎓" },
  { code: "IELTS_GENERAL", emoji: "✈️" },
];

interface SidebarProps {
  onNavigate?: () => void;
  onLogout?: () => void;
}

export function SapphireSidebar({ onNavigate, onLogout }: SidebarProps) {
  const { t } = useTranslation();
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="flex h-full flex-col bg-gradient-sidebar">
      {/* Logo */}
      <div className="flex flex-col gap-1 px-4 py-5">
        <BrandLogo
          href="/dashboard"
          variant="mark"
          tone="white"
          imgClassName="h-10 w-10 object-contain object-left"
        />
        <p className="truncate pl-0.5 text-[10px] text-sapphire-muted">
          DSE · IELTS
        </p>
      </div>

      <nav className="sapphire-scrollbar flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        {/* General */}
        <div>
          <p className="section-label">{t("nav.home")}</p>
          <ul className="space-y-0.5">
            {GENERAL_NAV.map(({ href, key, Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  className={isActive(href) ? "nav-pill-active" : "nav-pill"}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0 opacity-80" />
                  <span className="flex-1">{t(key)}</span>
                  {isActive(href) && <IconChevronRight className="opacity-40" />}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Exam modes */}
        <div>
          <p className="section-label">{t("exam.chooseMode")}</p>
          <ul className="space-y-0.5">
            {EXAM_LINKS.map(({ code, emoji }) => {
              const href = `/practice?mode=${code}`;
              return (
                <li key={code}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    className="nav-pill group"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/5 text-sm">
                      {emoji}
                    </span>
                    <span className="flex-1 truncate text-xs">{t(`exam.${code}`)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Skills quick links */}
        <div>
          <p className="section-label">{t("exam.chooseSkill")}</p>
          <ul className="space-y-0.5">
            {(["reading", "writing", "listening", "speaking"] as const).map((skill) => (
              <li key={skill}>
                <Link
                  href={`/practice?skill=${skill}`}
                  onClick={onNavigate}
                  className="nav-pill text-xs"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                  {t(`skill.${skill}`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* More */}
        <div>
          <p className="section-label">More</p>
          <ul className="space-y-0.5">
            <li>
              <Link
                href="/practice"
                onClick={onNavigate}
                className="nav-pill"
              >
                <IconSparkle className="h-[18px] w-[18px] shrink-0 text-brand-400" />
                <span className="flex-1">AI Feedback</span>
                <span className="rounded-full bg-brand-500/20 px-1.5 py-0.5 text-[9px] font-bold text-brand-300">
                  AI
                </span>
              </Link>
            </li>
            <li>
              <Link
                href="/settings"
                onClick={onNavigate}
                className={isActive("/settings") ? "nav-pill-active" : "nav-pill"}
              >
                <IconSettings className="h-[18px] w-[18px] shrink-0 opacity-80" />
                {t("nav.settings")}
              </Link>
            </li>
            {onLogout && (
              <li>
                <button type="button" onClick={onLogout} className="nav-pill w-full text-left">
                  <IconLogout className="h-[18px] w-[18px] shrink-0 opacity-60" />
                  {t("nav.logout")}
                </button>
              </li>
            )}
          </ul>
        </div>
      </nav>

      {/* Upgrade CTA */}
      <div className="p-3">
        <Link
          href="/practice"
          onClick={onNavigate}
          className="block rounded-2xl bg-gradient-brand p-4 text-center shadow-glow transition hover:opacity-90"
        >
          <p className="text-xs font-bold text-white">{t("actions.startPractice")}</p>
          <p className="mt-0.5 text-[10px] text-white/70">HKDSE · IELTS</p>
        </Link>
      </div>
    </aside>
  );
}
