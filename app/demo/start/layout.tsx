"use client";

import type { ReactNode } from "react";
import { DemoBar } from "@/components/spark/DemoBar";
import { DemoDataBadge } from "@/components/ui/DemoDataBadge";
import { LanguageSwitch } from "@/components/ui/LanguageSwitch";
import { Logo } from "@/components/ui/Logo";

/**
 * Onboardingens layout (avsnitt 6, 9.1): ingen AppShell-sidomeny — grundaren
 * har ingen profil eller poäng än. Demoraden ska fungera även här (avsnitt
 * 9.1), så den monteras precis som i /demo/app, bara utan AppShells
 * `bottomBar`-slot eftersom det inte finns någon AppShell att montera den i.
 */
export default function DemoStartLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper-50 pb-24">
      <header className="flex items-center justify-between px-6 py-4">
        <Logo height={18} />
        <div className="flex items-center gap-3">
          <DemoDataBadge />
          <LanguageSwitch />
        </div>
      </header>
      <main className="flex-1 px-6">{children}</main>
      <DemoBar />
    </div>
  );
}
