import { ForestBackground } from "@/components/auth/ForestBackground";
import { BrandLogo } from "@/components/brand/BrandLogo";
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
        <BrandLogo
          href="/"
          variant="mark"
          tone="white"
          priority
          imgClassName="h-10 w-10 object-contain sm:h-11 sm:w-11"
        />
        <LanguageSwitcher light />
      </div>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        {children}
      </main>
    </div>
  );
}
