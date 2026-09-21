"use client";

import { Card } from "@/components/ui/Card";
import { DataFact } from "@/components/ui/DataFact";
import { EditorialHeading } from "@/components/ui/EditorialHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LockedState } from "@/components/ui/LockedState";
import { JourneyRail } from "@/components/spark/JourneyRail";
import { NextStepCard } from "@/components/spark/NextStepCard";
import { PulseCard } from "@/components/spark/PulseCard";
import { ScorePanel } from "@/components/spark/ScorePanel";
import { SuggestionList } from "@/components/spark/SuggestionList";
import { useI18n } from "@/i18n/context";
import { formatDate } from "@/i18n/format";
import type { ScoreSuggestion } from "@/core/score";
import type { NextStep, PulseSignal, ScoreSnapshot, SinceLastTime } from "@/core/domain";
import type { JourneyStepView } from "@/ports/JourneyRepository";

/**
 * Datan skärmen behöver, redan hämtad och språkvald av den monterande routen
 * (via en JourneyRepository-, EvidenceRepository- och PulseProvider-adapter).
 * Skärmen själv vet inte om datan kom från /demo eller /app (avsnitt 14.1).
 */
export type AppHomeData = {
  todayIso: string;
  score: ScoreSnapshot;
  nextStep: NextStep;
  sinceLastTime: SinceLastTime;
  /** [] när den aktiva demopersonan inte har någon pulssignal byggd
   * (avsnitt: PulseProvider är bara byggd för Sara) — visas som ett ärligt
   * tomt läge i stället för att hitta på en signal. */
  pulseSignals: PulseSignal[];
  /** Totalpoängen genom resan hittills, för poängpanelens historik. */
  scoreHistory: number[];
  /** "Höj din poäng" (7.6) — samma data Poäng-sidan visar. */
  suggestions: ScoreSuggestion[];
  /** Resan i sin helhet, för den kompakta rail-widgeten (artefaktens
   * `railHTML`) — full Resan-sida visar samma steg som ett fullständigt kortgrid. */
  journeySteps: JourneyStepView[];
};

/**
 * Hem (artefaktens `vyHem`): ett stort handlingskort med Resan under sig i
 * huvudspalten, hela poängen som en egen spalt till höger, och två fulla
 * rader längst ner — "Höj din poäng" och Pulsen.
 */
export function AppHome({
  data,
  journeyStepHref,
}: {
  data: AppHomeData;
  journeyStepHref: (stepNumber: number) => string;
}) {
  const { locale, t } = useI18n();

  const remainingParts = [...data.score.lockedParts].sort((a, b) => a.unlocksAfterStep - b.unlocksAfterStep);
  const unlockedPartsCount = data.score.parts.length;
  const totalPartsCount = unlockedPartsCount + data.score.lockedParts.length;

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-[18px]">
      <div>
        <Eyebrow>
          {t.homePage.todayLabel} · {formatDate(data.todayIso, locale)}
        </Eyebrow>
        <EditorialHeading as="h1" className="mt-2">
          {t.homePage.heroHeadingBefore}{" "}
          <EditorialHeading.Em>{t.homePage.heroHeadingEmphasis}</EditorialHeading.Em>{" "}
          {t.homePage.heroHeadingAfter}
        </EditorialHeading>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <div data-tour-id="hem-act">
            <NextStepCard
              actionPillLabel={t.homePage.actNowLabel}
              eyebrow={data.nextStep.eyebrow}
              title={data.nextStep.title}
              why={data.nextStep.why}
              maxPoints={data.nextStep.maxPoints}
              estimatedTime={data.nextStep.estimatedTime}
              doneItems={data.nextStep.doneItems}
              actionLabel={data.nextStep.actionLabel}
              remainingParts={remainingParts}
              unlockedPartsCount={unlockedPartsCount}
              totalPartsCount={totalPartsCount}
            />
          </div>
          <JourneyRail steps={data.journeySteps} stepHref={journeyStepHref} />
        </div>

        <div className="flex flex-col gap-6">
          <div data-tour-id="hem-score">
            <ScorePanel snapshot={data.score} title={t.appShell.nav.score} history={data.scoreHistory} />
          </div>

          <Card title={t.homePage.sinceLastTimeTitle}>
            <div className="flex flex-col gap-3">
              <DataFact
                label={t.homePage.emailSentLabel}
                value={data.sinceLastTime.recipientCount}
                unit={t.homePage.recipientsUnit}
                source={data.sinceLastTime.emailSentSource}
                dataType="register"
              />
              <DataFact
                label={t.homePage.openRateLabel}
                value={data.sinceLastTime.openRate}
                unit="%"
                source={data.sinceLastTime.openRateSource}
                dataType="register"
              />
              <DataFact
                label={t.homePage.responsesReceivedLabel}
                value={data.sinceLastTime.responsesReceived}
                unit={t.homePage.responsesUnit}
                source={data.sinceLastTime.responsesSource}
                dataType="customer"
              />
              <p className="border-t border-slate-100 pt-3 text-sm text-slate-600">
                {t.homePage.reminderSentLabel} · {formatDate(data.sinceLastTime.reminderSentDateIso, locale)}
              </p>
            </div>
          </Card>
        </div>
      </div>

      <Card title={t.scorePage.suggestionsTitle}>
        <SuggestionList suggestions={data.suggestions} />
      </Card>

      <Card title={t.appShell.nav.pulse}>
        {data.pulseSignals.length === 0 ? (
          <LockedState unlockHint={t.homePage.notInThisScenario} />
        ) : (
          <div data-tour-id="hem-pulse" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {data.pulseSignals.map((signal, index) => (
              <PulseCard
                key={`${signal.headline}-${index}`}
                category={signal.category}
                headline={signal.headline}
                whyItMatters={signal.whyItMatters}
                timestamp={signal.timestamp}
                source={signal.source}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
