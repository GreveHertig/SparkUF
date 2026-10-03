"use client";

import type { ReactNode } from "react";
import { SourceTag } from "@/components/ui/SourceTag";
import { useI18n } from "@/i18n/context";
import { fill } from "@/i18n/fill";
import { textHasFigure } from "@/core/figures";
import { START_FRAME_WEEKS, type StartFrame } from "@/core/startFrame";
import type { Källa } from "@/core/domain";

/**
 * Startkortet efter kärnfrågorna (spec v4 §4: värde inom två minuter). Allt
 * på kortet kommer ur grundarens egna svar (core/startFrame.ts, Datalöftet).
 * Siffrorna (tiden, pengarna) bär källan "Din uppgift": de är grundarens svar,
 * eller räknade ur dem. Bedömningen är märkt som Medgrundarens bedömning,
 * aldrig som ett faktum. Kortet ger inga bevis och ingen poäng.
 */
export function StartFrameCard({
  frame,
  remainingCount,
  sourceFor,
  children,
}: {
  frame: StartFrame;
  remainingCount: number;
  /** Källan för svaret på en fråga: profilsamtalet och dagen svaret gavs. */
  sourceFor: (questionId: string) => Källa;
  /** Knappen vidare, som routen bestämmer. */
  children: ReactNode;
}) {
  const { t } = useI18n();
  const copy = t.onboarding.startFrame;
  const tag = (questionId: string) => <SourceTag source={sourceFor(questionId)} dataType="user" />;

  let hours: string | null = null;
  if (frame.hours?.kind === "under") hours = fill(copy.hoursUnder, { max: frame.hours.max });
  if (frame.hours?.kind === "range") hours = fill(copy.hoursRange, { min: frame.hours.min, max: frame.hours.max });
  if (frame.hours?.kind === "over") hours = fill(copy.hoursOver, { min: frame.hours.min });

  const money = frame.money ? (t.onboarding.v4Questions.choices.money as Record<string, string>)[frame.money] : null;

  return (
    <section className="fd-panel fdd-stack" aria-labelledby="fdd-startframe-title">
      <div>
        <h2 id="fdd-startframe-title" className="fdd-panel__title">
          {frame.entry === "noIdea" ? copy.titleNoIdea : copy.titleHasIdea}
        </h2>
        <p className="fdd-muted">{copy.lede}</p>
      </div>

      {hours && (
        <div>
          <p className="fdd-label">{copy.hoursLabel}</p>
          <p className="fdd-body">{hours}</p>
          <p className="fdd-muted fdd-inline">
            {fill(copy.hoursNote, { weeks: START_FRAME_WEEKS })} {tag("time")}
          </p>
        </div>
      )}

      {money && (
        <div>
          <p className="fdd-label">{copy.moneyLabel}</p>
          <p className="fdd-body fdd-inline">
            {money} {textHasFigure(money) && tag("money")}
          </p>
        </div>
      )}

      {frame.customer && (
        <div>
          <p className="fdd-label">{copy.customerLabel}</p>
          <p className="fdd-body fdd-inline">
            {frame.customer} {textHasFigure(frame.customer) && tag("customer")}
          </p>
        </div>
      )}

      {frame.lines.length > 0 && (
        <div>
          <p className="fdd-label">{copy.assessmentLabel}</p>
          <ul className="fdd-bullets">
            {frame.lines.map((line) => (
              <li key={line}>{copy.lines[line]}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="fdd-label">{copy.taskLabel}</p>
        <p className="fdd-body">{fill(copy.tasks[frame.task], { customer: frame.customer ?? "" })}</p>
      </div>

      {remainingCount > 0 && <p className="fdd-muted">{fill(copy.remainingNote, { count: remainingCount })}</p>}
      {children}
    </section>
  );
}
