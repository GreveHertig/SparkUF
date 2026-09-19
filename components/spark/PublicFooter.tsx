"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { useI18n } from "@/i18n/context";

/** Delad footer för de publika sidorna (/, /priser). */
export function PublicFooter() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-slate-200 bg-paper-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 sm:flex-row sm:justify-between">
        <div className="flex max-w-sm flex-col gap-3">
          <Logo height={16} />
          <p className="text-sm text-slate-600">{t.publicFooter.tagline}</p>
        </div>
        <div className="flex gap-16">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase text-slate-500" style={{ letterSpacing: "var(--tracking-label)" }}>
              {t.publicFooter.columns.product}
            </p>
            <Link href="/priser" className="text-sm text-slate-600 hover:text-slate-900">
              {t.publicNav.pricingLink}
            </Link>
            <Link href="/demo" className="text-sm text-slate-600 hover:text-slate-900">
              {t.publicNav.startDemoCta}
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase text-slate-500" style={{ letterSpacing: "var(--tracking-label)" }}>
              {t.publicFooter.columns.account}
            </p>
            <Link href="/logga-in" className="text-sm text-slate-600 hover:text-slate-900">
              {t.publicNav.logInLink}
            </Link>
            <Link href="/skapa-konto" className="text-sm text-slate-600 hover:text-slate-900">
              {t.publicNav.createAccountCta}
            </Link>
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl flex-col gap-1 border-t border-slate-200 px-6 py-5 text-xs text-slate-500 sm:flex-row sm:justify-between">
        <p>{t.publicFooter.rightsNote}</p>
        <p className="max-w-xl">{t.publicFooter.fictionalNote}</p>
      </div>
    </footer>
  );
}
