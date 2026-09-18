import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitch } from "@/components/ui/LanguageSwitch";

/**
 * Delad ram för /logga-in och /skapa-konto — ingen AppShell-sidomeny (det
 * finns inget att navigera till innan man är inloggad). proxy.ts skickar en
 * redan inloggad besökare vidare till /app innan den här layouten någonsin
 * renderas för dem.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper-50">
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" aria-label="Spark">
          <Logo height={20} />
        </Link>
        <LanguageSwitch />
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
