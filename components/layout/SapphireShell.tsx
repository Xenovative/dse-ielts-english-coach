"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SapphireSidebar } from "./SapphireSidebar";
import { SapphireHeader } from "./SapphireHeader";
import { IconClose } from "./Icons";

export function SapphireShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden w-[240px] shrink-0 border-r border-sapphire-border lg:block xl:w-[260px]">
        <div className="fixed inset-y-0 left-0 w-[240px] xl:w-[260px]">
          <SapphireSidebar onLogout={logout} />
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-[280px] animate-fade-in shadow-glow-lg">
            <div className="relative h-full">
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="icon-btn absolute right-3 top-4 z-10"
                aria-label="Close menu"
              >
                <IconClose />
              </button>
              <SapphireSidebar
                onNavigate={() => setSidebarOpen(false)}
                onLogout={logout}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <SapphireHeader onMenuClick={() => setSidebarOpen(true)} showMenu />
        <main className="sapphire-scrollbar flex-1 overflow-y-auto p-4 pb-24 lg:p-6 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav />
    </div>
  );
}

function MobileBottomNav() {
  const router = useRouter();
  const items = [
    { href: "/dashboard", icon: "🏠" },
    { href: "/practice", icon: "📝" },
    { href: "/results", icon: "📊" },
    { href: "/mistakes", icon: "📋" },
    { href: "/settings", icon: "⚙️" },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-sapphire-border bg-sapphire-surface/95 backdrop-blur-xl lg:hidden">
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 py-1">
        {items.map((item) => (
          <li key={item.href} className="flex-1">
            <button
              type="button"
              onClick={() => router.push(item.href)}
              className="flex w-full flex-col items-center gap-0.5 py-2 text-lg opacity-70 transition hover:opacity-100"
            >
              {item.icon}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
