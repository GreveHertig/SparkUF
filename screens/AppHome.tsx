"use client";

import Link from "next/link";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { SourceTag } from "@/components/ui/SourceTag";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import { formatDate } from "@/i18n/format";
import { fill } from "@/i18n/fill";
import { getScoreLevel } from "@/score/levels";
import type { DataKind, NextStep, PulseSignal, ScoreSnapshot, SinceLastTime } from "@/core/domain";
import type { JourneyStepView } from "@/ports/JourneyRepository";

/**
 * Datan skärmen behöver, redan hämtad och språkvald av den monterande routen
 * (via en JourneyRepository-, EvidenceRepository- och PulseProvider-adapter).
 * Skärmen själv vet inte om datan kom från /demo eller /app (avsnitt 14.1).
 *
 * `score` och `homeSummary` är nullbara var för sig (PR 3, skalet flyttades i
 * PR 2) — inte för att datan saknas i demot (där finns båda alltid), utan för
 * att liveadaptrarna kan sakna dem oberoende av varandra: `homeSummary`
 * (Resans `getHomeSummary`) är en permanent stub idag, `score` kan kasta
 * `EmptyStateError` för ett konto utan bevis. Skärmen visar `ComingSoon` bara
 * i den ruta som saknar sin data, i stället för att hela sidan slås ut av en
 * ensam stub. `scoreHistory`/`suggestions` finns inte här — de visades aldrig
 * av den här sidan (bara av Poäng-sidan, som hämtar dem själv).
 */
export type AppHomeData = {
  todayIso: string;
  score: ScoreSnapshot | null;
  homeSummary: { nextStep: NextStep; sinceLastTime: SinceLastTime } | null;
  /** [] när ingen pulssignal finns — ett ärligt tomt läge, aldrig påhittat. */
  pulseSignals: PulseSignal[];
  journeySteps: JourneyStepView[];
};

// Samma nivåtoner som ScoreBadge/DemoBlocks.ScoreFigure — dupliceras
// medvetet här i stället för att importeras (screens/ får bara ta emot
// props och typer från ports/ och core/, DemoBlocks.tsx hör till
// app/demo/_components och används fortfarande av andra, ännu inte
// konverterade demosidor, se docs/plan-en-design.md PR 4/PR 9).
const levelTone = {
  red: "bg-score-red-bg text-score-red",
  orange: "bg-score-orange-bg text-score-orange",
  yellow: "bg-score-yellow-bg text-score-yellow",
  green: "bg-score-green-bg text-score-green",
  strong: "bg-score-strong-bg text-score-strong",
} as const;

function formatDelta(delta: number): string {
  if (delta === 0) return "0";
  return `${delta > 0 ? "+" : "−"}${Math.abs(delta)}`;
}

/** Poängen (Hems poängkort): stort tal, "av 100", nivån och rörelsen. */
function ScoreFigure({ snapshot }: { snapshot: ScoreSnapshot }) {
  const { t } = useI18n();
  const level = getScoreLevel(snapshot.total);
  return (
    <div className="fdd-figure">
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

function ScoreDelta({ snapshot }: { snapshot: ScoreSnapshot }) {
  if (snapshot.delta === 0) return null;
  return (
    <p className="fdd-delta">
      <span className={snapshot.delta > 0 ? "fdd-delta__up" : "fdd-delta__down"}>{formatDelta(snapshot.delta)}</span>
      {snapshot.deltaReason && <> {snapshot.deltaReason}</>}
    </p>
  );
}

/** Resan som en kompakt stegrad: klara steg fyllda, det aktuella markerat. */
function JourneyStepper({
  steps,
  stepHref,
}: {
  steps: JourneyStepView[];
  stepHref: (stepNumber: number) => string;
}) {
  const { t } = useI18n();
  return (
    <ol className="fd-stepper fdd-stepper" aria-label={t.site.journey.stepsListLabel}>
      {steps.map((step) => (
        <li
          key={step.stepNumber}
          className={cn("fd-stepper__item", `fdd-step--${step.status}`)}
          aria-current={step.status === "current" ? "step" : undefined}
        >
          <Link href={stepHref(step.stepNumber)} className="fdd-stepper__link">
            <span className="fd-stepper__num">{String(step.stepNumber).padStart(2, "0")}</span>
            <span className="fd-stepper__title">{step.title}</span>
            <span className="fd-sr-only">{t.journeyPage.status[step.status]}</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

/**
 * Hem: handlingskortet och poängkortet sida vid sida, Resan som en rad
 * under, och två block längst ner ("Vad som hänt sedan sist", "Dagens
 * signal"). Markup flyttad rakt av från demots `app/demo/(app)/page.tsx`
 * (PR 3, docs/plan-en-design.md) — se AppHomeData ovan för vad som skiljer
 * demo/app i datan, och `dataKind` nedan för de två textställen som
 * skiljer sig i innehåll, inte bara stil.
 */
export function AppHome({
  data,
  dataKind,
  onNextStep,
  journeyStepHref,
  scoreHref,
}: {
  data: AppHomeData;
  dataKind: DataKind;
  onNextStep?: () => void;
  journeyStepHref: (stepNumber: number) => string;
  scoreHref: string;
}) {
  const { t, locale } = useI18n();
  const copy = t.site;

  const signal = data.pulseSignals[0];

  return (
    <div className="fdd-page">
      <header className="fdd-head">
        <p className="fdd-head__date">
          {t.homePage.todayLabel} {formatDate(data.todayIso, locale)}
        </p>
        <h1 className="fd-h2">
          {t.homePage.heroHeadingBefore} <em className="fd-em">{t.homePage.heroHeadingEmphasis}</em>{" "}
          {t.homePage.heroHeadingAfter}
        </h1>
      </header>

      <div className="fdd-hero fdd-hero--even">
        <section aria-labelledby="fdd-next-title" className="fd-panel fdd-next" data-tour-id="hem-act">
          {data.homeSummary ? (
            <>
              <p className="fd-nextstep__eyebrow">{data.homeSummary.nextStep.eyebrow}</p>
              <h2 id="fdd-next-title" className="fdd-next__title">
                {data.homeSummary.nextStep.title}
              </h2>
              <p className="fd-nextstep__why">{data.homeSummary.nextStep.why}</p>
              {data.homeSummary.nextStep.doneItems.length > 0 && (
                <div className="fd-nextstep__done">
                  <p>{t.common.doneItemsLabel}</p>
                  <ul className="fd-checks fd-checks--small">
                    {data.homeSummary.nextStep.doneItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="fd-nextstep__foot">
                <button
                  type="button"
                  onClick={onNextStep}
                  aria-describedby={dataKind === "example" ? "fdd-next-hint" : undefined}
                  className="fd-btn fd-btn--primary"
                >
                  {data.homeSummary.nextStep.actionLabel}
                </button>
                {dataKind === "example" && (
                  <span id="fdd-next-hint" className="fd-sr-only">
                    {copy.demo.nextAction}
                  </span>
                )}
                <span className="fd-nextstep__points">
                  {fill(copy.cofounder.pointsTemplate, { points: data.homeSummary.nextStep.maxPoints })}
                  <span className="fdd-muted"> · {data.homeSummary.nextStep.estimatedTime}</span>
                </span>
              </div>
            </>
          ) : (
            <ComingSoon />
          )}
        </section>

        <section aria-labelledby="fdd-score-title" className="fd-panel fdd-scorecard" data-tour-id="hem-score">
          {data.score ? (
            <>
              <h2 id="fdd-score-title" className="fdd-label">
                {t.site.proof.scoreLabel}
              </h2>
              <ScoreFigure snapshot={data.score} />
              <ScoreDelta snapshot={data.score} />
              <Link href={scoreHref} className="fd-btn fd-btn--secondary fdd-scorecard__link">
                {copy.demo.scoreLink}
              </Link>
            </>
          ) : (
            <ComingSoon />
          )}
        </section>
      </div>

      <section aria-labelledby="fdd-journey-title" className="fdd-block">
        <h2 id="fdd-journey-title" className="fdd-block__title">
          {copy.demo.journeyTitle}
        </h2>
        <div className="fd-journey">
          <JourneyStepper steps={data.journeySteps} stepHref={journeyStepHref} />
        </div>
      </section>

      <div className="fdd-two">
        <section aria-labelledby="fdd-since-title" className="fdd-block">
          <h2 id="fdd-since-title" className="fdd-block__title">
            {t.homePage.sinceLastTimeTitle}
          </h2>
          {data.homeSummary ? (
            <>
              <dl className="fdd-facts">
                <div>
                  <dt>{t.homePage.emailSentLabel}</dt>
                  <dd>
                    {data.homeSummary.sinceLastTime.recipientCount} <span>{t.homePage.recipientsUnit}</span>
                  </dd>
                  <SourceTag source={data.homeSummary.sinceLastTime.emailSentSource} dataType="register" />
                </div>
                <div>
                  <dt>{t.homePage.openRateLabel}</dt>
                  <dd>{data.homeSummary.sinceLastTime.openRate} %</dd>
                  <SourceTag source={data.homeSummary.sinceLastTime.openRateSource} dataType="register" />
                </div>
                <div>
                  <dt>{t.homePage.responsesReceivedLabel}</dt>
                  <dd>
                    {data.homeSummary.sinceLastTime.responsesReceived} <span>{t.homePage.responsesUnit}</span>
                  </dd>
                  <SourceTag source={data.homeSummary.sinceLastTime.responsesSource} dataType="customer" />
                </div>
              </dl>
              <p className="fdd-muted fdd-facts__foot">
                {t.homePage.reminderSentLabel} {formatDate(data.homeSummary.sinceLastTime.reminderSentDateIso, locale)}
              </p>
            </>
          ) : (
            <ComingSoon />
          )}
        </section>

        <section aria-labelledby="fdd-pulse-title" className="fdd-block" data-tour-id="hem-pulse">
          <h2 id="fdd-pulse-title" className="fdd-block__title">
            {t.homePage.todaysPulseTitle}
          </h2>
          {signal ? (
            <article className="fd-panel fdd-signal">
              <p className="fdd-signal__meta">
                <span className="fdd-signal__category">{signal.category}</span>
                <span className="fdd-muted">{signal.timestamp}</span>
              </p>
              <p className="fdd-signal__headline">{signal.headline}</p>
              <p className="fd-nextstep__why">
                {t.common.pulseWhyItMattersPrefix} {signal.whyItMatters}
              </p>
              <SourceTag source={signal.source} />
            </article>
          ) : (
            <p className="fdd-muted">{dataKind === "example" ? copy.demo.noPulse : t.homePage.noPulseSignal}</p>
          )}
        </section>
      </div>
    </div>
  );
}
