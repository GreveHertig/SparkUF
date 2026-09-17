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
import { saraHomeContent } from "../sara-mock";

export default function AppHome() {
  const { locale, t } = useI18n();
  const content = saraHomeContent[locale];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-12">
      <div>
        <Eyebrow>
          {t.homePage.todayLabel} · {formatDate(content.todayIso, locale)}
        </Eyebrow>
        <EditorialHeading as="h1" className="mt-2">
          {t.homePage.heroHeadingBefore}{" "}
          <EditorialHeading.Em>{t.homePage.heroHeadingEmphasis}</EditorialHeading.Em>{" "}
          {t.homePage.heroHeadingAfter}
        </EditorialHeading>
      </div>

      <NextStepCard
        eyebrow={content.nextStep.eyebrow}
        title={content.nextStep.title}
        why={content.nextStep.why}
        maxPoints={content.nextStep.maxPoints}
        estimatedTime={content.nextStep.estimatedTime}
        doneItems={content.nextStep.doneItems}
        actionLabel={content.nextStep.action}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <section className="flex flex-col gap-6 rounded-lg border border-slate-200 bg-white p-6 lg:col-span-2">
          <Eyebrow>{t.homePage.sinceLastTimeTitle}</Eyebrow>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            <DataFact
              label={t.homePage.emailSentLabel}
              value={content.sinceLastTime.recipientCount}
              unit={t.homePage.recipientsUnit}
              source={content.sinceLastTime.emailSentSource}
              dataType="register"
            />
            <DataFact
              label={t.homePage.openRateLabel}
              value={content.sinceLastTime.openRate}
              unit="%"
              source={content.sinceLastTime.openRateSource}
              dataType="register"
            />
            <DataFact
              label={t.homePage.responsesReceivedLabel}
              value={content.sinceLastTime.responsesReceived}
              unit={t.homePage.responsesUnit}
              source={content.sinceLastTime.responsesSource}
              dataType="customer"
            />
          </div>
          <p className="border-t border-slate-100 pt-4 text-sm text-slate-600">
            {t.homePage.reminderSentLabel} · {formatDate(content.sinceLastTime.reminderSentDate, locale)}
          </p>
        </section>

        <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6">
          <Eyebrow>{t.homePage.scoreMovementTitle}</Eyebrow>
          <div className="flex items-center gap-4">
            <ScoreBadge score={content.score} size="large" />
          </div>
          <p className="text-sm font-semibold text-score-red">
            {content.scoreDelta > 0 ? "+" : "−"}
            {Math.abs(content.scoreDelta)} {content.scoreDeltaReason}
          </p>
          <p className="text-xs text-slate-600">
            {content.previousScore} → {content.score}
          </p>
        </section>
      </div>

      <section className="flex flex-col gap-4">
        <Eyebrow>{t.homePage.todaysPulseTitle}</Eyebrow>
        <PulseCard
          category={content.pulse.category}
          headline={content.pulse.headline}
          whyItMatters={content.pulse.whyItMatters}
          timestamp={content.pulse.timestamp}
          source={content.pulse.source}
          className="max-w-xl"
        />
      </section>

      <section className="flex flex-col gap-6">
        <Eyebrow>{t.homePage.breakdownTitle}</Eyebrow>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {content.breakdown.map((part) => (
            <DataFact
              key={part.partName}
              label={part.partName}
              value={part.points}
              unit={`/ ${part.weight} ${t.common.upToPointsAfter}`}
              source={part.source}
              dataType={part.dataType}
            />
          ))}
          {content.lockedParts.map((part) => (
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
