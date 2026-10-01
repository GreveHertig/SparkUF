"use client";

import Link from "next/link";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { ConceptBadge } from "@/components/ui/ConceptBadge";
import { useI18n } from "@/i18n/context";
import type { JourneyStepDetail } from "@/ports/JourneyRepository";
import { mentionsConcept } from "@/core/concepts";
import { SimulationBlock, VerdictBlock } from "./blocks/DataBlocks";
import { Locked, PageHead } from "./blocks/PageBlocks";
import { formatDelta } from "./blocks/ScoreFigure";
import { StepCompletionPanel, type CompleteStep } from "./blocks/StepCompletionPanel";
import type { StepCompletionView } from "@/ports/JourneyProgress";

/**
 * Ett steg i resan: vad som återstår eller hänt, domen, poängändringen och det
 * som låstes upp. Markup flyttad rakt av från demots
 * `app/demo/(app)/resan/[steg]/page.tsx` (PR 9, docs/plan-en-design.md).
 *
 * Platshållare per sektion:
 * - `data: null` (stegets data gick inte att hämta): huvudet visar bara
 *   stegets nummer och resten "Kommer snart".
 * - Ett olåst steg utan text i `why` visar "Kommer snart" i den rutan.
 * - `verdictMissing`: sätts av rutten när steget borde ha en dom men datan
 *   saknar den. Domens ruta visar då "Kommer snart". Utan flaggan döljs en
 *   saknad dom, som i demot.
 * Övriga sektioner (poängändringen, det som låstes upp, redan klart) döljs när
 * de är tomma, som i demot.
 */
export function JourneyStep({
  data,
  stepNumber,
  journeyHref,
  verdictMissing = false,
  completion,
}: {
  data: JourneyStepDetail | null;
  stepNumber: number;
  journeyHref: string;
  verdictMissing?: boolean;
  /** Markera steget som klart (beslut 2026-10-01). Bara /app skickar den:
   * demots steg byts med demoraden. Visas inte för ett låst steg. */
  completion?: { view: StepCompletionView; onComplete: CompleteStep; scoreHref: string } | null;
}) {
  const { t } = useI18n();
  const j = t.journeyPage;

  const backLink = (
    <Link href={journeyHref} className="fdd-back">
      <span aria-hidden="true">←</span> {j.backToJourney}
    </Link>
  );

  if (!data) {
    return (
      <div className="fdd-page">
        {backLink}
        <PageHead title={`${j.stepLabel} ${String(stepNumber).padStart(2, "0")}`} />
        <ComingSoon />
      </div>
    );
  }

  const context = [
    `${j.stepLabel} ${String(data.stepNumber).padStart(2, "0")}`,
    j.status[data.status],
    data.status !== "locked" ? j.momentPill[data.momentKind] : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="fdd-page">
      {backLink}

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
            <section className="fd-panel" aria-labelledby="fdd-step-why">
              <h2 id="fdd-step-why" className="fdd-label">
                {data.status === "current" ? j.whatsNext : j.whatHappened}
              </h2>
              {data.why ? (
                <>
                  <p className="fdd-body">{data.why}</p>
                  {data.momentKind === "running" && <p className="fdd-note">{j.runningHint}</p>}
                </>
              ) : (
                <ComingSoon />
              )}
            </section>

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
            {completion && (
              <StepCompletionPanel
                completion={completion.view}
                onComplete={completion.onComplete}
                scoreHref={completion.scoreHref}
              />
            )}

            {data.verdict && data.scoreDelta ? (
              <div data-tour-id="journey-verdict">
                <VerdictBlock
                  score={data.scoreDelta.total}
                  headline={data.verdict.headline}
                  reasoning={data.verdict.reasoning}
                />
              </div>
            ) : (
              verdictMissing && (
                <section className="fd-panel" aria-labelledby="fdd-step-verdict">
                  <h2 id="fdd-step-verdict" className="fdd-label">
                    {t.validationPage.verdictTitle}
                  </h2>
                  <ComingSoon />
                </section>
              )
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
