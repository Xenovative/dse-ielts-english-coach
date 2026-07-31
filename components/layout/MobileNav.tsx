"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

const ITEMS = [
  { href: "/dashboard", key: "nav.dashboard", icon: "🏠" },
  { href: "/practice", key: "nav.practice", icon: "📝" },
  { href: "/results", key: "nav.results", icon: "📊" },
  { href: "/settings", key: "nav.settings", icon: "⚙️" },
];

export function MobileNav() {
  const { t } = useTranslation();
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-950/95">
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition ${
                  active
                    ? "text-brand-600 dark:text-brand-300"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                <span className="text-lg" aria-hidden>
                  {item.icon}
                </span>
                {t(item.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
