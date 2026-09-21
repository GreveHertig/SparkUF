"use client";

import { Eyebrow } from "@/components/ui/Eyebrow";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";

type NextStepCardProps = {
  eyebrow: string;
  title: string;
  why: string;
  /** Uppdrag avsnitt 6: varje steg visar "kan ge upp till X poäng". */
  maxPoints: number;
  /** Färdigformaterad, lokaliserad tidsuppskattning, t.ex. "~15 min". */
  estimatedTime: string;
  doneItems: string[];
  actionLabel: string;
  onAction?: () => void;
  /** Pillen ovanför eyebrowen (artefaktens `actHTML`: "Gör det här nu") —
   * valfri så att andra bruk av kortet (t.ex. designsystemet) inte behöver
   * ange den. */
  actionPillLabel?: string;
  /** Kravlistan för vad som fortfarande är låst (artefaktens `UNLOCK.krit`)
   * — byggd av anroparen ur `ScoreSnapshot.lockedParts`, aldrig påhittad
   * här. Utelämnad eller [] döljer sektionen helt. */
  remainingParts?: { name: string; unlocksAfterStep: number }[];
  className?: string;
};

/** Handlingssteg: en tydlig uppgift, en rad om varför, och klara delmoment med bockar. */
export function NextStepCard({
  eyebrow,
  title,
  why,
  maxPoints,
  estimatedTime,
  doneItems,
  actionLabel,
  onAction,
  actionPillLabel,
  remainingParts = [],
  className,
}: NextStepCardProps) {
  const { t } = useI18n();

  return (
    <div className={cn("rounded-md border border-slate-200 bg-white p-5 shadow-lg", className)}>
      <div className="flex flex-wrap items-center gap-2">
        {actionPillLabel && (
          <span
            className="rounded-pill bg-accent-100 px-2.5 py-1 text-xs font-semibold uppercase text-accent-700"
            style={{ letterSpacing: "var(--tracking-label)" }}
          >
            {actionPillLabel}
          </span>
        )}
        <Eyebrow>{eyebrow}</Eyebrow>
      </div>
      <p className="mt-2 text-2xl font-extrabold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-snug text-slate-600">{why}</p>
      <p className="mt-2 text-sm font-medium text-accent-700">
        {t.common.upToPointsBefore} <span className="font-numeric">{maxPoints}</span> {t.common.upToPointsAfter} ·{" "}
        <span className="font-numeric">{estimatedTime}</span>
      </p>
      {doneItems.length > 0 && (
        <div className="mt-4">
          <p
            className="text-xs font-semibold uppercase text-slate-600"
            style={{ letterSpacing: "var(--tracking-label)" }}
          >
            {t.common.doneItemsLabel}
          </p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {doneItems.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                <CheckIcon />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        type="button"
        onClick={onAction}
        className="mt-5 inline-flex items-center gap-1 rounded-md bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-700 focus-visible:outline-2 focus-visible:outline-accent"
        style={{ transitionDuration: "var(--motion-fast)", transitionTimingFunction: "var(--ease-standard)" }}
      >
        {actionLabel}
      </button>
      {remainingParts.length > 0 && (
        <div className="mt-5 rounded-md border border-dashed border-slate-300 bg-slate-50 p-3.5">
          <p
            className="text-xs font-semibold uppercase text-slate-600"
            style={{ letterSpacing: "var(--tracking-label)" }}
          >
            {t.journeyPage.whatsNext}
          </p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {remainingParts.map((part) => (
              <li key={part.name} className="flex items-center justify-between gap-2 text-sm text-slate-600">
                <span className="flex items-center gap-2">
                  <LockIcon />
                  {part.name}
                </span>
                <span className="text-xs text-slate-500">
                  {t.homePage.unlocksAfterStepBefore} {part.unlocksAfterStep}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-slate-400">
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-score-green"
    >
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
