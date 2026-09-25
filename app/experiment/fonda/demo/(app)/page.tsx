"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SourceTag } from "@/components/ui/SourceTag";
import { useI18n } from "@/i18n/context";
import { formatDate } from "@/i18n/format";
import { demoJourneyRepository } from "@/adapters/demo/JourneyRepository";
import { demoEvidenceRepository } from "@/adapters/demo/EvidenceRepository";
import { demoPulseProvider } from "@/adapters/demo/PulseProvider";
import { useDemoStore } from "@/adapters/demo/demoStore";
import type { NextStep, PulseSignal, ScoreSnapshot, SinceLastTime } from "@/core/domain";
import type { JourneyStepView } from "@/ports/JourneyRepository";
import { fill } from "@/app/experiment/fonda/_lib/fill";
import { JourneyStepper, ScoreDelta, ScoreFigure } from "../_components/DemoBlocks";
import { FONDA_DEMO_PATHS, journeyStepPath } from "../_lib/paths";

type HomeData = {
  todayIso: string;
  nextStep: NextStep;
  sinceLastTime: SinceLastTime;
  score: ScoreSnapshot;
  pulseSignals: PulseSignal[];
  steps: JourneyStepView[];
};

/** Hem i kopian: nästa steg, poängen, resan, vad som hänt och dagens signal. */
export default function FondaDemoHomePage() {
  const { t, locale } = useI18n();
  const copy = t.experimentFonda;
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  const next = useDemoStore((state) => state.next);
  const [data, setData] = useState<HomeData | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      demoJourneyRepository.getHomeSummary(locale),
      demoEvidenceRepository.getScoreSnapshot(locale),
      demoPulseProvider.getSignals(locale),
      demoJourneyRepository.getSteps(locale),
    ]).then(([journey, score, pulseSignals, steps]) => {
      if (cancelled) return;
      setData({
        todayIso: journey.todayIso,
        nextStep: journey.nextStep,
        sinceLastTime: journey.sinceLastTime,
        score,
        pulseSignals,
        steps,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex, entry]);

  if (!data) return null;

  const { nextStep, sinceLastTime, score } = data;
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

      <div className="fdd-hero">
        <section aria-labelledby="fdd-next-title" className="fd-panel fdd-next" data-tour-id="hem-act">
          <p className="fd-nextstep__eyebrow">{nextStep.eyebrow}</p>
          <h2 id="fdd-next-title" className="fdd-next__title">
            {nextStep.title}
          </h2>
          <p className="fd-nextstep__why">{nextStep.why}</p>
          {nextStep.doneItems.length > 0 && (
            <div className="fd-nextstep__done">
              <p>{t.common.doneItemsLabel}</p>
              <ul className="fd-checks fd-checks--small">
                {nextStep.doneItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="fd-nextstep__foot">
            <button
              type="button"
              onClick={next}
              aria-describedby="fdd-next-hint"
              className="fd-btn fd-btn--primary"
            >
              {nextStep.actionLabel}
            </button>
            <span id="fdd-next-hint" className="fd-sr-only">
              {copy.demo.nextAction}
            </span>
            <span className="fd-nextstep__points">
              {fill(copy.cofounder.pointsTemplate, { points: nextStep.maxPoints })}
              <span className="fdd-muted"> · {nextStep.estimatedTime}</span>
            </span>
          </div>
        </section>

        <section aria-labelledby="fdd-score-title" className="fd-panel fdd-scorecard" data-tour-id="hem-score">
          <h2 id="fdd-score-title" className="fdd-label">
            {t.experimentFonda.proof.scoreLabel}
          </h2>
          <ScoreFigure snapshot={score} />
          <ScoreDelta snapshot={score} />
          <Link href={FONDA_DEMO_PATHS.score} className="fd-btn fd-btn--secondary fdd-scorecard__link">
            {copy.demo.scoreLink}
          </Link>
        </section>
      </div>

      <section aria-labelledby="fdd-journey-title" className="fdd-block">
        <h2 id="fdd-journey-title" className="fdd-block__title">
          {copy.demo.journeyTitle}
        </h2>
        <div className="fd-journey">
          <JourneyStepper steps={data.steps} stepHref={journeyStepPath} />
        </div>
      </section>

      <div className="fdd-two">
        <section aria-labelledby="fdd-since-title" className="fdd-block">
          <h2 id="fdd-since-title" className="fdd-block__title">
            {t.homePage.sinceLastTimeTitle}
          </h2>
          <dl className="fdd-facts">
            <div>
              <dt>{t.homePage.emailSentLabel}</dt>
              <dd>
                {sinceLastTime.recipientCount} <span>{t.homePage.recipientsUnit}</span>
              </dd>
              <SourceTag source={sinceLastTime.emailSentSource} dataType="register" />
            </div>
            <div>
              <dt>{t.homePage.openRateLabel}</dt>
              <dd>{sinceLastTime.openRate} %</dd>
              <SourceTag source={sinceLastTime.openRateSource} dataType="register" />
            </div>
            <div>
              <dt>{t.homePage.responsesReceivedLabel}</dt>
              <dd>
                {sinceLastTime.responsesReceived} <span>{t.homePage.responsesUnit}</span>
              </dd>
              <SourceTag source={sinceLastTime.responsesSource} dataType="customer" />
            </div>
          </dl>
          <p className="fdd-muted fdd-facts__foot">
            {t.homePage.reminderSentLabel} {formatDate(sinceLastTime.reminderSentDateIso, locale)}
          </p>
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
            <p className="fdd-muted">{copy.demo.noPulse}</p>
          )}
        </section>
      </div>
    </div>
  );
}
