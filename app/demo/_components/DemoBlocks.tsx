"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ConceptBadge } from "@/components/ui/ConceptBadge";
import { SourceTag } from "@/components/ui/SourceTag";
import { cn } from "@/design/cn";
import type { DataType } from "@/design/tokens";
import { useI18n } from "@/i18n/context";
import { formatCount } from "@/i18n/format";
import { getScoreLevel } from "@/score/levels";
import type { DataKind, Källa, ScoreSnapshot } from "@/core/domain";
import type { JourneyStepView } from "@/ports/JourneyRepository";
import type { Simulation } from "@/ports/SimulationProvider";
import { fill } from "@/i18n/fill";
import { mentionsConcept } from "../_lib/concepts";

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
        <span className="fd-proof__outof">{t.site.proof.outOf}</span>
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
            {fill(t.site.demo.unlocksAfter, { step: String(part.unlocksAfterStep).padStart(2, "0") })}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Resan som stegrad: klara steg fyllda, det aktuella markerat, låsta dämpade. */
export function JourneyStepper({
  steps,
  stepHref,
}: {
  steps: JourneyStepView[];
  stepHref?: (stepNumber: number) => string;
}) {
  const { t } = useI18n();

  return (
    <ol className="fd-stepper fdd-stepper" aria-label={t.site.journey.stepsListLabel}>
      {steps.map((step) => {
        const content = (
          <>
            <span className="fd-stepper__num">{String(step.stepNumber).padStart(2, "0")}</span>
            <span className="fd-stepper__title">{step.title}</span>
            <span className="fd-sr-only">{t.journeyPage.status[step.status]}</span>
          </>
        );
        return (
          <li
            key={step.stepNumber}
            className={cn("fd-stepper__item", `fdd-step--${step.status}`)}
            aria-current={step.status === "current" ? "step" : undefined}
          >
            {stepHref ? (
              <Link href={stepHref(step.stepNumber)} className="fdd-stepper__link">
                {content}
              </Link>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Synlig etikett på block med påhittade företag, personer eller siffror
 * (Datalöftet, docs/uppdrag.md 1.2: påhittad data får aldrig se ut som
 * registerdata). Visas bara för `dataKind="example"`, som bara demot sätter;
 * riktig data (`"live"`) får ingen etikett.
 */
export function ExampleLabel({ dataKind }: { dataKind: DataKind }) {
  const { t } = useI18n();
  if (dataKind !== "example") return null;
  return <p className="fdd-example">{t.site.demo.exampleLabel}</p>;
}

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

export type Figure = {
  label: string;
  value: ReactNode;
  unit?: string;
  description?: string;
  source?: Källa;
  dataType?: DataType;
};

/** Nyckeltal i en rad med hårlinjer emellan. Varje tal bär sin källa. */
export function Figures({ items, tourId }: { items: Figure[]; tourId?: string }) {
  return (
    <dl className="fdd-figures" data-tour-id={tourId}>
      {items.map((item) => (
        <div key={item.label} className="fdd-figures__item">
          <dt>{item.label}</dt>
          <dd>
            {item.value}
            {item.unit && <span> {item.unit}</span>}
          </dd>
          {item.description && <p className="fdd-figures__desc">{item.description}</p>}
          {item.source && <SourceTag source={item.source} dataType={item.dataType} />}
        </div>
      ))}
    </dl>
  );
}

export type PillTone = "green" | "orange" | "yellow" | "neutral" | "accent" | "register" | "customer";

export function Pill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  return <span className={`fdd-pill fdd-pill--${tone}`}>{children}</span>;
}

/** Simulering: alltid märkt Simulering och koncept, aldrig poäng. */
export function SimulationBlock({ simulation }: { simulation: Simulation }) {
  const { locale, t } = useI18n();
  return (
    <div className="fdd-sim">
      <div className="fdd-sim__head">
        <span className="fdd-pill fdd-pill--simulation">{t.common.simulationLabel}</span>
        <ConceptBadge />
      </div>
      <p className="fdd-sim__question">{simulation.question}</p>
      <p className="fdd-sim__result">{simulation.result}</p>
      <p className="fdd-muted">{simulation.uncertaintyRangeLabel}</p>
      <div className="fdd-sim__foot">
        <span className="fdd-muted">
          {t.common.simulationPopulationLabel}: {formatCount(simulation.populationSize, locale)}
        </span>
        <SourceTag source={simulation.source} dataType="simulation" />
      </div>
    </div>
  );
}

/** Domen: poängen vid domen, nivån, utslaget och motiveringen. */
export function VerdictBlock({ score, headline, reasoning }: { score: number; headline: string; reasoning: string }) {
  const { t } = useI18n();
  const level = getScoreLevel(score);
  return (
    <div className="fd-panel fdd-verdict">
      <div className="fdd-figure">
        <p className="fd-proof__number">
          <span>{score}</span>
          <span className="fd-proof__outof">{t.site.proof.outOf}</span>
        </p>
        <span className={cn("fd-level", levelTone[level.tone])}>{t.score.levels[level.key].name}</span>
      </div>
      <p className="fdd-verdict__headline">{headline}</p>
      <p className="fd-nextstep__why">{reasoning}</p>
    </div>
  );
}

/** En rad i samtalet med Medgrundaren. Koncept får sin etikett. */
export function ChatLine({ role, text }: { role: "founder" | "cofounder"; text: string }) {
  return (
    <div className={cn("fdd-chat", role === "founder" ? "fdd-chat--founder" : "fdd-chat--cofounder")}>
      <p className="fdd-chat__bubble">{text}</p>
      {mentionsConcept(text) && <ConceptBadge />}
    </div>
  );
}

/** Ett verktyg som körts: delmomenten, alla klara. */
export function ToolRun({ label, steps }: { label: string; steps: string[] }) {
  const { t } = useI18n();
  return (
    <div className="fdd-tool">
      <p className="fdd-tool__label">
        {t.cofounderPage.toolRunningLabel}: {label}
      </p>
      <ul className="fd-checks fd-checks--small">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ul>
      {mentionsConcept(`${label} ${steps.join(" ")}`) && <ConceptBadge />}
    </div>
  );
}

/** "4 dagar senare" i samtalet. */
export function TimeSkipLine({ label }: { label: string }) {
  return (
    <p className="fdd-skip">
      <span>{label}</span>
    </p>
  );
}
