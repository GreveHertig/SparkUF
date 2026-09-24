"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useI18n } from "@/i18n/context";
import type { JourneyStepDetail } from "@/ports/JourneyRepository";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { demoJourneyRepository } from "@/adapters/demo/JourneyRepository";
import { FriLocked, FriPageHead, FriSectionTitle, FriSimulation, FriVerdict } from "../../../_components/FriParts";
import { FRI_DEMO_BASE } from "../../../_lib/friPaths";

/** Ett steg i kopian: samma innehåll som /demo/app/resan/[steg] (screens/JourneyStep). */
export default function FriJourneyStepPage({ params }: { params: Promise<{ steg: string }> }) {
  const { steg } = use(params);
  const stepNumber = Number(steg);
  const isValidStep = Number.isInteger(stepNumber);
  const { t, locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  const [data, setData] = useState<JourneyStepDetail | null | undefined>(undefined);

  useEffect(() => {
    if (!isValidStep) return;
    let cancelled = false;
    demoJourneyRepository.getStepDetail(stepNumber, locale).then((detail) => {
      if (!cancelled) setData(detail);
    });
    return () => {
      cancelled = true;
    };
  }, [isValidStep, stepNumber, locale, beatIndex, entry]);

  if (!isValidStep) notFound();
  if (data === undefined) return null;
  if (data === null) notFound();

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <>
      <Link href={`${FRI_DEMO_BASE}/resan`} className="fri-link" style={{ fontSize: "0.95rem" }}>
        {t.journeyPage.backToJourney}
      </Link>
      <div style={{ marginTop: 28 }}>
        <FriPageHead
          kicker={
            <>
              {t.journeyPage.stepLabel} {pad(data.stepNumber)} · {t.journeyPage.status[data.status]}
              {data.status !== "locked" && <> · {t.journeyPage.momentPill[data.momentKind]}</>}
            </>
          }
          title={data.title}
          lead={data.oneLiner}
        />
        <p className="fri-mono" style={{ marginTop: 14, color: "var(--signal-ink)" }}>
          {t.common.upToPointsBefore} {data.maxPoints} {t.common.upToPointsAfter}
        </p>
      </div>

      {data.status === "locked" ? (
        <div className="fri-section-demo">
          <FriLocked hint={`${t.homePage.unlocksAfterStepBefore} ${data.stepNumber - 1}`}>
            <p>{data.oneLiner}</p>
          </FriLocked>
        </div>
      ) : (
        <>
          {data.why && (
            <section className="fri-section-demo">
              <FriSectionTitle title={data.status === "current" ? t.journeyPage.whatsNext : t.journeyPage.whatHappened} />
              <p style={{ marginTop: 16, fontSize: "1.15rem", maxWidth: "60ch" }}>{data.why}</p>
              {data.momentKind === "running" && (
                <p className="fri-locked" style={{ marginTop: 16 }}>
                  {t.journeyPage.runningHint}
                </p>
              )}
            </section>
          )}

          {data.verdict && data.scoreDelta && (
            <section className="fri-section-demo" data-tour-id="journey-verdict">
              <FriVerdict score={data.scoreDelta.total} headline={data.verdict.headline} reasoning={data.verdict.reasoning} />
            </section>
          )}

          {data.highlights.length > 0 && (
            <section className="fri-section-demo" data-tour-id="journey-highlights">
              <FriSectionTitle title={t.journeyPage.whatHappened} />
              <ul className="fri-reasons">
                {data.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </section>
          )}

          {data.scoreDelta && data.scoreDelta.delta !== 0 && (
            <section className="fri-section-demo">
              <FriSectionTitle title={t.journeyPage.scoreChangeTitle} />
              <p className="fri-fact-num" style={{ marginTop: 16, color: data.scoreDelta.delta < 0 ? "var(--signal-ink)" : undefined }}>
                {data.scoreDelta.delta > 0 ? "+" : "−"}
                {Math.abs(data.scoreDelta.delta)}
                <small>→ {data.scoreDelta.total}</small>
              </p>
              <p className="fri-muted" style={{ marginTop: 10 }}>
                {data.scoreDelta.deltaReason}
              </p>
            </section>
          )}

          {data.newlyUnlockedParts.length > 0 && (
            <section className="fri-section-demo">
              <FriSectionTitle title={t.journeyPage.unlockedTitle} />
              <ul className="fri-reasons">
                {data.newlyUnlockedParts.map((partName) => (
                  <li key={partName}>{partName}</li>
                ))}
              </ul>
            </section>
          )}

          {data.simulation && (
            <section className="fri-section-demo">
              <FriSectionTitle title={t.journeyPage.simulationTitle} />
              <div style={{ marginTop: 20 }}>
                <FriSimulation simulation={data.simulation} />
              </div>
            </section>
          )}

          {data.doneItems.length > 0 && (
            <section className="fri-section-demo">
              <p className="fri-mono fri-muted">{t.common.doneItemsLabel}</p>
              <ul className="fri-reasons">
                {data.doneItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </>
  );
}
