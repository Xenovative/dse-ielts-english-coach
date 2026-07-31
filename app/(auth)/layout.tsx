import Link from "next/link";
import { ForestBackground } from "@/components/auth/ForestBackground";
import { LanguageSwitcher } from "@/components/language-switcher/LanguageSwitcher";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <ForestBackground />

      {/* Minimal top bar */}
      <div className="relative z-10 flex items-center justify-between p-5">
        <Link href="/" className="text-sm font-bold tracking-widest text-white/90">
          ENGLISH COACH
        </Link>
        <LanguageSwitcher light />
      </div>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        {children}
      </main>
    </div>
  );
}
