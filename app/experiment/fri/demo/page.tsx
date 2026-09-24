"use client";

import { useMemo } from "react";
import { useI18n } from "@/i18n/context";
import { formatCount, formatDate } from "@/i18n/format";
import { FriJourney, FriNextStep, FriScoreCard, FriSuggestions } from "./_components/FriBlocks";
import { FriSource } from "./_components/FriSource";
import { homeDataFor } from "./_lib/friDemoData";
import { useFriBeatIndex } from "./_lib/friDemoState";

/** Hem i kopian: samma innehåll som /demo/app (screens/AppHome), ny form. */
export default function FriDemoHomePage() {
  const { t, locale } = useI18n();
  const beatIndex = useFriBeatIndex();
  const data = useMemo(() => homeDataFor(beatIndex, locale), [beatIndex, locale]);

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
        <FriNextStep
          key={beatIndex}
          nextStep={data.nextStep}
          remainingParts={remainingParts}
          unlockedPartsCount={unlockedPartsCount}
          totalPartsCount={unlockedPartsCount + data.score.lockedParts.length}
        />
        <FriScoreCard snapshot={data.score} title={t.appShell.nav.score} />
      </div>

      {/* Nyckeln nollställer valt steg när momentet byts, så att det aktuella
          steget alltid är förvalt (samma beteende som JourneyRail). */}
      <FriJourney key={beatIndex} steps={data.journeySteps} />

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
          <ul className="fri-pulse">
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
