"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConceptBadge } from "@/components/ui/ConceptBadge";
import { useI18n } from "@/i18n/context";
import { demoJourneyRepository } from "@/adapters/demo/JourneyRepository";
import { useDemoStore } from "@/adapters/demo/demoStore";
import type { JourneyStepDetail } from "@/ports/JourneyRepository";
import { Locked, PageHead, SimulationBlock, VerdictBlock, formatDelta } from "../../../_components/DemoBlocks";
import { mentionsConcept } from "../../../_lib/concepts";
import { FONDA_DEMO_PATHS } from "../../../_lib/paths";

/** Ett steg i resan: vad som återstår eller hänt, domen, poängändringen och det som låstes upp. */
export default function FondaDemoJourneyStepPage({ params }: { params: Promise<{ steg: string }> }) {
  const { steg } = use(params);
  const stepNumber = Number(steg);
  const isValidStep = Number.isInteger(stepNumber);
  const { t, locale } = useI18n();
  const j = t.journeyPage;
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

  const context = [
    `${j.stepLabel} ${String(data.stepNumber).padStart(2, "0")}`,
    j.status[data.status],
    data.status !== "locked" ? j.momentPill[data.momentKind] : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="fdd-page">
      <Link href={FONDA_DEMO_PATHS.journey} className="fdd-back">
        <span aria-hidden="true">←</span> {j.backToJourney}
      </Link>

      <PageHead
        context={context}
        title={data.title}
        lede={
          <>
            {data.oneLiner}{" "}
            <span className="fdd-nowrap">
              {t.common.upToPointsBefore} {data.maxPoints} {t.common.upToPointsAfter}.
            </span>
          </>
        }
      />

      {data.status === "locked" ? (
        <Locked hint={`${t.homePage.unlocksAfterStepBefore} ${String(data.stepNumber - 1).padStart(2, "0")}`} />
      ) : (
        <div className="fdd-hero">
          <div className="fdd-stack">
            {data.why && (
              <section className="fd-panel" aria-labelledby="fdd-step-why">
                <h2 id="fdd-step-why" className="fdd-label">
                  {data.status === "current" ? j.whatsNext : j.whatHappened}
                </h2>
                <p className="fdd-body">{data.why}</p>
                {data.momentKind === "running" && <p className="fdd-note">{j.runningHint}</p>}
              </section>
            )}

            {data.highlights.length > 0 && (
              <section className="fd-panel" aria-labelledby="fdd-step-highlights" data-tour-id="journey-highlights">
                <h2 id="fdd-step-highlights" className="fdd-label">
                  {t.site.demo.stepHighlightsTitle}
                </h2>
                <ul className="fdd-bullets">
                  {data.highlights.map((highlight) => (
                    <li key={highlight}>
                      {highlight}
                      {mentionsConcept(highlight) && <ConceptBadge className="fdd-context__concept" />}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {data.simulation && (
              <section className="fdd-block" aria-labelledby="fdd-step-sim">
                <h2 id="fdd-step-sim" className="fdd-block__title">
                  {j.simulationTitle}
                </h2>
                <SimulationBlock simulation={data.simulation} />
              </section>
            )}
          </div>

          <div className="fdd-stack">
            {data.verdict && data.scoreDelta && (
              <div data-tour-id="journey-verdict">
                <VerdictBlock
                  score={data.scoreDelta.total}
                  headline={data.verdict.headline}
                  reasoning={data.verdict.reasoning}
                />
              </div>
            )}

            {data.scoreDelta && data.scoreDelta.delta !== 0 && (
              <section className="fd-panel" aria-labelledby="fdd-step-delta">
                <h2 id="fdd-step-delta" className="fdd-label">
                  {j.scoreChangeTitle}
                </h2>
                <p className="fdd-delta fdd-delta--large">
                  <span className={data.scoreDelta.delta > 0 ? "fdd-delta__up" : "fdd-delta__down"}>
                    {formatDelta(data.scoreDelta.delta)}
                  </span>{" "}
                  {data.scoreDelta.deltaReason}
                </p>
                <p className="fdd-muted">→ {data.scoreDelta.total}</p>
              </section>
            )}

            {data.newlyUnlockedParts.length > 0 && (
              <section className="fd-panel" aria-labelledby="fdd-step-unlocked">
                <h2 id="fdd-step-unlocked" className="fdd-label">
                  {j.unlockedTitle}
                </h2>
                <ul className="fdd-tags">
                  {data.newlyUnlockedParts.map((part) => (
                    <li key={part} className="fdd-pill fdd-pill--accent">
                      {part}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {data.doneItems.length > 0 && (
              <section className="fd-panel" aria-labelledby="fdd-step-done">
                <h2 id="fdd-step-done" className="fdd-label">
                  {t.common.doneItemsLabel}
                </h2>
                <ul className="fd-checks fd-checks--small">
                  {data.doneItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
