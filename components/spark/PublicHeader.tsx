"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitch } from "@/components/ui/LanguageSwitch";
import { useI18n } from "@/i18n/context";

/** Delad header för de publika sidorna (/, /priser) — se `publicNav` i i18n. */
export function PublicHeader() {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-paper-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" aria-label="Spark">
          <Logo height={18} />
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/priser" className="text-sm font-medium text-slate-700 hover:text-slate-900">
            {t.publicNav.pricingLink}
          </Link>
          <Link href="/logga-in" className="text-sm font-medium text-slate-700 hover:text-slate-900">
            {t.publicNav.logInLink}
          </Link>
          <LanguageSwitch />
          <Link
            href="/demo"
            className="rounded-full bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {t.publicNav.startDemoCta}
          </Link>
        </nav>
      </div>
    </header>
  );
}
