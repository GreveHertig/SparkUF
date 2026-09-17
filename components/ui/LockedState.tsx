"use client";

import type { ReactNode } from "react";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";

type LockedStateProps = {
  /** Villkoret för upplåsning, t.ex. "Låses upp efter steg 10". Alltid
   * produktspecifikt, så anroparen skriver hela meningen. */
  unlockHint: string;
  children?: ReactNode;
  className?: string;
};

/**
 * Låst del eller steg. Egen lugn stil — aldrig 0 eller rött, aldrig tomt.
 * `children` kan visa en nedtonad förhandsvy av det som väntar.
 */
export function LockedState({ unlockHint, children, className }: LockedStateProps) {
  const { t } = useI18n();

  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-slate-500",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <LockIcon />
        <span
          className="text-xs font-semibold uppercase text-slate-500"
          style={{ letterSpacing: "var(--tracking-label)" }}
        >
          {t.lockedState.title}
        </span>
      </div>
      {children && <div className="mt-3 opacity-60">{children}</div>}
      <p className="mt-3 text-sm">{unlockHint}</p>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
