"use client";

import { SourceTag } from "@/components/ui/SourceTag";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import { getScoreLevel } from "@/score/levels";
import type { ScoreSnapshot } from "@/core/domain";
import type { JourneyStepView } from "@/ports/JourneyRepository";
import { fill } from "../../_lib/fill";

// Samma nivåtoner som ScoreBadge.
export const levelTone = {
  red: "bg-score-red-bg text-score-red",
  orange: "bg-score-orange-bg text-score-orange",
  yellow: "bg-score-yellow-bg text-score-yellow",
  green: "bg-score-green-bg text-score-green",
  strong: "bg-score-strong-bg text-score-strong",
} as const;

/** "+11" / "−3" / "0". Minustecknet är ett riktigt minus. */
export function formatDelta(delta: number): string {
  if (delta === 0) return "0";
  return `${delta > 0 ? "+" : "−"}${Math.abs(delta)}`;
}

/** Poängen som stort tal, "av 100" och nivån. */
export function ScoreFigure({ snapshot, size = "large" }: { snapshot: ScoreSnapshot; size?: "large" | "medium" }) {
  const { t } = useI18n();
  const level = getScoreLevel(snapshot.total);

  return (
    <div className={cn("fdd-figure", size === "medium" && "fdd-figure--medium")}>
      <p className="fd-proof__number">
        <span key={snapshot.total} className="fd-recount">
          {snapshot.total}
        </span>
        <span className="fd-proof__outof">{t.experimentFonda.proof.outOf}</span>
      </p>
      <span className={cn("fd-level", levelTone[level.tone])}>{t.score.levels[level.key].name}</span>
    </div>
  );
}

/** Poängrörelsen sedan förra momentet, med skälet. Inget visas vid 0. */
export function ScoreDelta({ snapshot }: { snapshot: ScoreSnapshot }) {
  if (snapshot.delta === 0) return null;
  return (
    <p className="fdd-delta">
      <span className={snapshot.delta > 0 ? "fdd-delta__up" : "fdd-delta__down"}>{formatDelta(snapshot.delta)}</span>
      {snapshot.deltaReason && <> {snapshot.deltaReason}</>}
    </p>
  );
}

/** De upplåsta delarna med källa, och de låsta med när de låses upp. */
export function PartsList({ snapshot }: { snapshot: ScoreSnapshot }) {
  const { t } = useI18n();
  const locked = [...snapshot.lockedParts].sort((a, b) => a.unlocksAfterStep - b.unlocksAfterStep);

  return (
    <ul className="fd-parts">
      {snapshot.parts.map((part) => (
        <li key={part.name} className="fd-part">
          <div className="fd-part__row">
            <span className="fd-part__name">{part.name}</span>
            <span className="fd-part__points">
              {part.points}
              <span className="fd-part__weight">/{part.weight}</span>
            </span>
          </div>
          <span className="fd-part__bar" aria-hidden="true">
            <span style={{ transform: `scaleX(${Math.max(0, part.points) / part.weight})` }} />
          </span>
          <SourceTag source={part.source} dataType={part.dataType} className="fd-part__source" />
        </li>
      ))}
      {locked.map((part) => (
        <li key={part.name} className="fd-part fd-part--locked">
          <div className="fd-part__row">
            <span className="fd-part__name">{part.name}</span>
          </div>
          <span className="fd-part__lockedlabel">
            {fill(t.experimentFonda.demo.unlocksAfter, { step: String(part.unlocksAfterStep).padStart(2, "0") })}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Resan som stegrad: klara steg fyllda, det aktuella markerat, låsta dämpade. */
export function JourneyStepper({ steps }: { steps: JourneyStepView[] }) {
  const { t } = useI18n();

  return (
    <ol className="fd-stepper fdd-stepper" aria-label={t.experimentFonda.journey.stepsListLabel}>
      {steps.map((step) => (
        <li
          key={step.stepNumber}
          className={cn("fd-stepper__item", `fdd-step--${step.status}`)}
          aria-current={step.status === "current" ? "step" : undefined}
        >
          <span className="fd-stepper__num">{String(step.stepNumber).padStart(2, "0")}</span>
          <span className="fd-stepper__title">{step.title}</span>
          <span className="fd-sr-only">{t.journeyPage.status[step.status]}</span>
        </li>
      ))}
    </ol>
  );
}
