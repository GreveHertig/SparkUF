"use client";

import Link from "next/link";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { SourceTag } from "@/components/ui/SourceTag";
import { useI18n } from "@/i18n/context";
import { formatDate } from "@/i18n/format";
import { fill } from "@/i18n/fill";
import type { DataKind, Källa, NextStep, PulseSignal, ScoreSnapshot, SinceLastTime } from "@/core/domain";
import type { DataType } from "@/design/tokens";
import type { JourneyStepView } from "@/ports/JourneyRepository";
import { JourneyStepper } from "./blocks/JourneyStepper";
import { ScoreDelta, ScoreFigure } from "./blocks/ScoreFigure";

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
  /**
   * Valfritt: källtaggarnas datatyp, satt av routen (samma mönster som
   * `PulseData.sourceDataType`). Demot skickar `"example"` för båda,
   * tillsammans med exempelkällor, eftersom signalen och "sedan sist" är
   * påhittade. /app skickar `"media"` för Pulsen (artiklar, inte ett
   * register). Utan värde gäller registrets respektive kundens tagg som förut.
   */
  sourceDataTypes?: { pulse?: DataType; sinceLastTime?: DataType };
  /**
   * Valfri källa för handlingskortet, när dess text innehåller siffror.
   * `NextStep` bär ingen källa; demot sätter en exempelkälla (PR 11:s regel),
   * /app ingen.
   */
  nextStepSource?: { source: Källa; dataType: DataType };
};

// ScoreFigure/ScoreDelta delas med Poäng-skärmen (PR 4), JourneyStepper med
// Resan (PR 9) — båda i screens/blocks/.

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
  journeyBasePath,
  scoreHref,
}: {
  data: AppHomeData;
  dataKind: DataKind;
  onNextStep?: () => void;
  /**
   * Resans bas-väg (t.ex. `/demo/resan`); stegets länk blir `<bas>/<nummer>`.
   * En sträng, inte en funktion: `/app`-rutten är en Server Component, och
   * Next vägrar skicka funktioner till en klientkomponent. `null` när Resans
   * sidor inte finns: stegen visas utan länk.
   */
  journeyBasePath: string | null;
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
              {data.nextStepSource && (
                <SourceTag source={data.nextStepSource.source} dataType={data.nextStepSource.dataType} />
              )}
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
          <JourneyStepper steps={data.journeySteps} basePath={journeyBasePath} />
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
                  <SourceTag
                    source={data.homeSummary.sinceLastTime.emailSentSource}
                    dataType={data.sourceDataTypes?.sinceLastTime ?? "register"}
                  />
                </div>
                <div>
                  <dt>{t.homePage.openRateLabel}</dt>
                  <dd>{data.homeSummary.sinceLastTime.openRate} %</dd>
                  <SourceTag
                    source={data.homeSummary.sinceLastTime.openRateSource}
                    dataType={data.sourceDataTypes?.sinceLastTime ?? "register"}
                  />
                </div>
                <div>
                  <dt>{t.homePage.responsesReceivedLabel}</dt>
                  <dd>
                    {data.homeSummary.sinceLastTime.responsesReceived} <span>{t.homePage.responsesUnit}</span>
                  </dd>
                  <SourceTag
                    source={data.homeSummary.sinceLastTime.responsesSource}
                    dataType={data.sourceDataTypes?.sinceLastTime ?? "customer"}
                  />
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
                {/* Tom tid visas inte: demot tömmer sin påhittade relativa tid
                    (docs/buggar-2026-09.md punkt 11, som Pulsen). */}
                {signal.timestamp && <span className="fdd-muted">{signal.timestamp}</span>}
              </p>
              <p className="fdd-signal__headline">{signal.headline}</p>
              <p className="fd-nextstep__why">
                {t.common.pulseWhyItMattersPrefix} {signal.whyItMatters}
              </p>
              <SourceTag source={signal.source} dataType={data.sourceDataTypes?.pulse} />
            </article>
          ) : (
            <p className="fdd-muted">{dataKind === "example" ? copy.demo.noPulse : t.homePage.noPulseSignal}</p>
          )}
        </section>
      </div>
    </div>
  );
}
