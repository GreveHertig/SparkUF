"use client";

import type { ReactNode } from "react";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";

/**
 * Sidans byggstenar som flera skärmar delar: huvudet, det låsta läget och
 * statuspillret. Flyttade hit i PR 5 (docs/plan-en-design.md) från
 * `app/demo/_components/DemoBlocks.tsx` (borttagen i steg 6, när den sista
 * demosidan, Pulsen, var flyttad). Ligger under `screens/` — portregeln gäller.
 */

/** Sidans huvud: en liten rad för sammanhang, rubriken och en ingress. */
export function PageHead({
  context,
  title,
  lede,
  aside,
}: {
  context?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <header className="fdd-head">
      <div className="fdd-head__row">
        <div className="fdd-head__text">
          {context && <p className="fdd-head__date">{context}</p>}
          <h1 className={cn("fd-h2", typeof title === "string" && title.length > 40 && "fdd-h1--long")}>{title}</h1>
        </div>
        {aside}
      </div>
      {lede && <p className="fd-lede">{lede}</p>}
    </header>
  );
}

/** Låst del: lugn, streckad, aldrig tom och aldrig röd. */
export function Locked({ hint, children }: { hint: string; children?: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="fdd-locked">
      <p className="fdd-locked__title">
        <span className="fdd-lock" aria-hidden="true" />
        {t.lockedState.title}
      </p>
      <p className="fdd-locked__hint">{hint}</p>
      {children}
    </div>
  );
}

export type PillTone = "green" | "orange" | "yellow" | "neutral" | "accent" | "register" | "customer";

export function Pill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  return <span className={`fdd-pill fdd-pill--${tone}`}>{children}</span>;
}
