"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/context";
import type { NextStep, PulseSignal, ScoreSnapshot, SinceLastTime } from "@/core/domain";
import type { ScoreSuggestion } from "@/core/score";
import type { JourneyStepView } from "@/ports/JourneyRepository";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { demoJourneyRepository } from "@/adapters/demo/JourneyRepository";
import { demoEvidenceRepository } from "@/adapters/demo/EvidenceRepository";
import { demoPulseProvider } from "@/adapters/demo/PulseProvider";
import { formatCount, formatDate } from "@/i18n/format";
import { FriJourney, FriNextStep, FriScoreCard, FriSuggestions } from "../_components/FriBlocks";
import { FriSource } from "../_components/FriSource";
import { FRI_DEMO_BASE } from "../_lib/friPaths";

type HomeData = {
  score: ScoreSnapshot;
  nextStep: NextStep;
  sinceLastTime: SinceLastTime;
  pulseSignals: PulseSignal[];
  suggestions: ScoreSuggestion[];
  journeySteps: JourneyStepView[];
};

/** Hem i kopian: samma innehåll som /demo/app (screens/AppHome), ny form. */
export default function FriDemoHomePage() {
  const { t, locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const [data, setData] = useState<HomeData | null>(null);

  // Samma hämtning som app/demo/app/page.tsx, ur samma adaptrar.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      demoJourneyRepository.getHomeSummary(locale),
      demoEvidenceRepository.getScoreSnapshot(locale),
      demoPulseProvider.getSignals(locale),
      demoEvidenceRepository.getSuggestions(locale),
      demoJourneyRepository.getSteps(locale),
    ]).then(([journey, score, pulseSignals, suggestions, journeySteps]) => {
      if (cancelled) return;
      setData({ score, nextStep: journey.nextStep, sinceLastTime: journey.sinceLastTime, pulseSignals, suggestions, journeySteps });
    });
    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex]);

  if (!data) return null;

  const remainingParts = [...data.score.lockedParts].sort((a, b) => a.unlocksAfterStep - b.unlocksAfterStep);
  const unlockedPartsCount = data.score.parts.length;
  const facts = [
    {
      label: t.homePage.emailSentLabel,
      value: data.sinceLastTime.recipientCount,
      unit: t.homePage.recipientsUnit,
      source: data.sinceLastTime.emailSentSource,
      dataType: "register" as const,
    },
    {
      label: t.homePage.openRateLabel,
      value: data.sinceLastTime.openRate,
      unit: "%",
      source: data.sinceLastTime.openRateSource,
      dataType: "register" as const,
    },
    {
      label: t.homePage.responsesReceivedLabel,
      value: data.sinceLastTime.responsesReceived,
      unit: t.homePage.responsesUnit,
      source: data.sinceLastTime.responsesSource,
      dataType: "customer" as const,
    },
  ];

  return (
    <>
      <div className="fri-home-top">
        <div data-tour-id="hem-act">
        <FriNextStep
          key={`${data.nextStep.title}-${data.nextStep.eyebrow}`}
          nextStep={data.nextStep}
          remainingParts={remainingParts}
          unlockedPartsCount={unlockedPartsCount}
          totalPartsCount={unlockedPartsCount + data.score.lockedParts.length}
        />
        </div>
        <div data-tour-id="hem-score">
          <FriScoreCard snapshot={data.score} title={t.appShell.nav.score} />
        </div>
      </div>

      {/* Nyckeln nollställer valt steg när momentet byts, så att det aktuella
          steget alltid är förvalt (samma beteende som JourneyRail). */}
      <FriJourney key={data.journeySteps.find((step) => step.status === "current")?.stepNumber ?? 0} steps={data.journeySteps} stepHref={(n) => `${FRI_DEMO_BASE}/resan/${n}`} />

      <section className="fri-section-demo">
        <h2 className="fri-h2-demo">{t.homePage.sinceLastTimeTitle}</h2>
        <dl className="fri-facts">
          {facts.map((fact) => (
            <div key={fact.label} className="fri-ruled">
              <dt className="fri-muted">{fact.label}</dt>
              <dd className="fri-fact-num">
                {formatCount(fact.value, locale)}
                <small>{fact.unit}</small>
              </dd>
              <dd style={{ marginTop: 14 }}>
                <FriSource source={fact.source} dataType={fact.dataType} />
              </dd>
            </div>
          ))}
        </dl>
        <p className="fri-muted" style={{ marginTop: 18, fontSize: "0.95rem" }}>
          {t.homePage.reminderSentLabel} · {formatDate(data.sinceLastTime.reminderSentDateIso, locale)}
        </p>
      </section>

      <section className="fri-section-demo">
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
          <h2 className="fri-h2-demo">{t.scorePage.suggestionsTitle}</h2>
          <span className="fri-muted" style={{ fontSize: "0.92rem" }}>
            {t.scorePage.suggestionsSortNote}
          </span>
        </div>
        <FriSuggestions suggestions={data.suggestions} />
      </section>

      <section className="fri-section-demo">
        <h2 className="fri-h2-demo">{t.appShell.nav.pulse}</h2>
        {data.pulseSignals.length === 0 ? (
          <p className="fri-muted" style={{ marginTop: 18 }}>
            {t.homePage.notInThisScenario}
          </p>
        ) : (
          <ul className="fri-pulse" data-tour-id="hem-pulse">
            {data.pulseSignals.map((signal, index) => (
              <li key={`${signal.headline}-${index}`} className="fri-ruled">
                <p className="fri-mono fri-muted" style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ color: "var(--ink)" }}>{signal.category}</span>
                  <span>{signal.timestamp}</span>
                </p>
                <p style={{ marginTop: 12, fontSize: "1.2rem", fontWeight: 540, letterSpacing: "-0.012em", lineHeight: 1.3 }}>
                  {signal.headline}
                </p>
                <p className="fri-muted" style={{ marginTop: 8 }}>
                  <span style={{ color: "var(--ink)" }}>{t.common.pulseWhyItMattersPrefix} </span>
                  {signal.whyItMatters}
                </p>
                <div style={{ marginTop: 14 }}>
                  <FriSource source={signal.source} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
