import type { ReactNode } from "react";
import { LanguageSwitch } from "@/components/ui/LanguageSwitch";
import { Logo } from "@/components/ui/Logo";

// Onboardingens layout för plattformen (avsnitt 6) — ingen AppShell-sidomeny
// än, samma resonemang som /demo/start (grundaren har ingen profil eller
// poäng förrän onboardingen är klar). Ingen demorad här — den är demo-bara.
export default function StartLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper-50">
      <header className="flex items-center justify-between px-6 py-4">
        <Logo height={18} />
        <LanguageSwitch />
      </header>
      <main className="flex-1 px-6 pb-16">{children}</main>
    </div>
  );
}
