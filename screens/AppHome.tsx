"use client";

import { DataFact } from "@/components/ui/DataFact";
import { EditorialHeading } from "@/components/ui/EditorialHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LockedState } from "@/components/ui/LockedState";
import { NextStepCard } from "@/components/spark/NextStepCard";
import { PulseCard } from "@/components/spark/PulseCard";
import { ScoreBadge } from "@/components/spark/ScoreBadge";
import { useI18n } from "@/i18n/context";
import { formatDate } from "@/i18n/format";
import type { NextStep, PulseSignal, ScoreSnapshot, SinceLastTime } from "@/core/domain";

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
  pulse: PulseSignal;
};

export function AppHome({ data }: { data: AppHomeData }) {
  const { locale, t } = useI18n();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-12">
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

      <NextStepCard
        eyebrow={data.nextStep.eyebrow}
        title={data.nextStep.title}
        why={data.nextStep.why}
        maxPoints={data.nextStep.maxPoints}
        estimatedTime={data.nextStep.estimatedTime}
        doneItems={data.nextStep.doneItems}
        actionLabel={data.nextStep.actionLabel}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <section className="flex flex-col gap-6 rounded-lg border border-slate-200 bg-white p-6 lg:col-span-2">
          <Eyebrow>{t.homePage.sinceLastTimeTitle}</Eyebrow>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
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
          </div>
          <p className="border-t border-slate-100 pt-4 text-sm text-slate-600">
            {t.homePage.reminderSentLabel} · {formatDate(data.sinceLastTime.reminderSentDateIso, locale)}
          </p>
        </section>

        <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6">
          <Eyebrow>{t.homePage.scoreMovementTitle}</Eyebrow>
          <div className="flex items-center gap-4">
            <ScoreBadge score={data.score.total} size="large" />
          </div>
          <p className="text-sm font-semibold text-score-red">
            {data.score.delta > 0 ? "+" : "−"}
            {Math.abs(data.score.delta)} {data.score.deltaReason}
          </p>
          <p className="text-xs text-slate-600">
            {data.score.previousTotal} → {data.score.total}
          </p>
        </section>
      </div>

      <section className="flex flex-col gap-4">
        <Eyebrow>{t.homePage.todaysPulseTitle}</Eyebrow>
        <PulseCard
          category={data.pulse.category}
          headline={data.pulse.headline}
          whyItMatters={data.pulse.whyItMatters}
          timestamp={data.pulse.timestamp}
          source={data.pulse.source}
          className="max-w-xl"
        />
      </section>

      <section className="flex flex-col gap-6">
        <Eyebrow>{t.homePage.breakdownTitle}</Eyebrow>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {data.score.parts.map((part) => (
            <DataFact
              key={part.name}
              label={part.name}
              value={part.points}
              unit={`/ ${part.weight} ${t.common.upToPointsAfter}`}
              source={part.source}
              dataType={part.dataType}
            />
          ))}
          {data.score.lockedParts.map((part) => (
            <LockedState
              key={part.name}
              unlockHint={`${t.homePage.unlocksAfterStepBefore} ${part.unlocksAfterStep}`}
            >
              <p className="text-sm font-medium">{part.name}</p>
            </LockedState>
          ))}
        </div>
      </section>
    </div>
  );
}
