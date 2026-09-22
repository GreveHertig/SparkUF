"use client";

import { useMemo, useState } from "react";
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
  /** Räknaren ovanför kravlistan (ScoreSnapshot.parts.length /
   * (parts.length + lockedParts.length)) — äkta upplåsta/totalt, ingen
   * bespoke kravtext per krav (se docs/status.md, "sidornas komposition
   * mot artefaktens vyer"). */
  unlockedPartsCount?: number;
  totalPartsCount?: number;
  className?: string;
};

/** Delar en redan skriven `why`-mening upp vid meningsgränser till
 * skäl-punkter (artefaktens `.act .why`) — ingen ny text, bara omformaterad
 * befintlig text ur adapters/demo/sara.ts. */
function splitIntoReasons(why: string): string[] {
  return why
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

/** Handlingssteg: en tydlig uppgift, skälen som punkter, tre val och kravlistan för nästa upplåsning. */
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
  unlockedPartsCount = 0,
  totalPartsCount = remainingParts.length,
  className,
}: NextStepCardProps) {
  const { t } = useI18n();
  const [deferred, setDeferred] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const reasons = useMemo(() => splitIntoReasons(why), [why]);

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
        <span className="font-numeric ml-auto text-xs text-slate-500">{estimatedTime}</span>
      </div>
      <p className="mt-2 text-3xl leading-tight text-slate-900">{title}</p>
      {reasons.length > 1 ? (
        // `why` är en enda skriven mening per beat (adapters/demo/sara.ts) —
        // när den delar sig i fler än en meningsgräns blir bullets en
        // omformatering av samma text, inte en duplicering av en
        // sammanfattningsrad (se DESIGN.md, "Handlingskortet").
        <ul className="mt-3 flex flex-col gap-1">
          {reasons.map((reason) => (
            <li key={reason} className="flex gap-2 text-sm leading-snug text-slate-600">
              <ArrowIcon />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm leading-snug text-slate-600">{why}</p>
      )}

      {evidenceOpen && doneItems.length > 0 && (
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3.5">
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

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-1 rounded-md bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-700 focus-visible:outline-2 focus-visible:outline-accent"
          style={{ transitionDuration: "var(--motion-fast)", transitionTimingFunction: "var(--ease-standard)" }}
        >
          {actionLabel}
        </button>
        <button
          type="button"
          disabled={deferred}
          onClick={() => setDeferred(true)}
          className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ transitionDuration: "var(--motion-fast)", transitionTimingFunction: "var(--ease-standard)" }}
        >
          {deferred ? t.common.deferredLabel : t.common.laterLabel}
        </button>
        {doneItems.length > 0 && (
          <button
            type="button"
            onClick={() => setEvidenceOpen((open) => !open)}
            className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
            style={{ transitionDuration: "var(--motion-fast)", transitionTimingFunction: "var(--ease-standard)" }}
          >
            {evidenceOpen ? t.common.hideEvidenceLabel : t.common.showEvidenceLabel}
          </button>
        )}
        <span className="font-numeric ml-auto text-sm font-semibold text-score-green">
          +{maxPoints} {t.common.upToPointsAfter}
        </span>
      </div>

      {remainingParts.length > 0 && (
        <div className="mt-5 rounded-md border border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3.5 py-2.5">
            <p
              className="text-xs font-semibold uppercase text-slate-600"
              style={{ letterSpacing: "var(--tracking-label)" }}
            >
              {t.journeyPage.whatsNext}
            </p>
            <span className="font-numeric text-xs text-slate-500">
              {unlockedPartsCount}/{totalPartsCount}
            </span>
          </div>
          <ul>
            {remainingParts.map((part) => (
              <li
                key={part.name}
                className="flex items-center gap-2.5 border-b border-slate-200 px-3.5 py-2.5 last:border-b-0"
              >
                <span
                  aria-hidden="true"
                  className="h-[17px] w-[17px] shrink-0 rounded-[3px] border-2 border-slate-300 bg-white"
                />
                <span className="flex-1 text-sm text-slate-700">{part.name}</span>
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

function ArrowIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="mt-0.5 shrink-0 text-slate-400"
    >
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
