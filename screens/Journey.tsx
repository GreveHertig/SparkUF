"use client";

import Link from "next/link";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import type { JourneyStepView } from "@/ports/JourneyRepository";
import { JourneyStepper } from "./blocks/JourneyStepper";
import { PageHead } from "./blocks/PageBlocks";

/**
 * Datan skärmen behöver, redan hämtad och språkvald av den monterande routen.
 * `steps: null` när stegen inte gick att hämta (platshållarfel): stegraden och
 * faserna visar då "Kommer snart", och rubriken blir sidans namn.
 */
export type JourneyData = {
  steps: JourneyStepView[] | null;
};

const PHASE_ORDER = ["discover", "tryPhase", "launch", "grow"] as const;

/**
 * Resan: stegraden överst, sedan varje fas med sina steg. Markup flyttad rakt
 * av från demots `app/demo/(app)/resan/page.tsx` (PR 9, docs/plan-en-design.md).
 * `basePath` är Resans väg (t.ex. `/demo/resan`); stegets länk blir
 * `<bas>/<nummer>`. En sträng, så att en Server Component kan skicka den.
 */
export function Journey({
  data,
  basePath,
  profileAnswersHref,
}: {
  data: JourneyData;
  basePath: string;
  /** Minnets Profilen-flik (svaren från onboardingen). Visas under steg 1:s
   * kort när routen skickar den, det vill säga när onboardingen är klar. */
  profileAnswersHref?: string | null;
}) {
  const { t } = useI18n();
  const { steps } = data;
  const stepHref = (stepNumber: number) => `${basePath}/${stepNumber}`;

  // Som i originalet beskriver rubriken var resan står: det aktuella steget,
  // annars det senast klara, annars det första.
  const highlighted = steps
    ? (steps.find((step) => step.status === "current") ??
      [...steps].reverse().find((step) => step.status === "done") ??
      steps[0])
    : undefined;

  return (
    <div className="fdd-page">
      <PageHead
        context={
          highlighted
            ? `${t.journeyPage.stepLabel} ${String(highlighted.stepNumber).padStart(2, "0")} · ${t.journeyPage.status[highlighted.status]}`
            : undefined
        }
        title={highlighted?.title ?? t.journeyPage.title}
        lede={highlighted?.oneLiner ?? t.journeyPage.subtitle}
      />

      {steps ? (
        <>
          <div className="fd-journey">
            <JourneyStepper steps={steps} basePath={basePath} />
          </div>

          <div className="fdd-phases">
            {PHASE_ORDER.map((phase) => {
              const inPhase = steps.filter((step) => step.journeyPhase === phase);
              if (inPhase.length === 0) return null;
              const done = inPhase.filter((step) => step.status === "done").length;
              return (
                <section key={phase} className="fdd-phase" aria-labelledby={`fdd-phase-${phase}`}>
                  <div className="fdd-phase__head">
                    <h2 id={`fdd-phase-${phase}`} className="fd-phase__name">
                      {t.journeyPage.phaseNames[phase]}
                    </h2>
                    <span className="fdd-muted">
                      {done}/{inPhase.length}
                    </span>
                  </div>
                  <ul className="fdd-stepcards">
                    {inPhase.map((step) => (
                      <li key={step.stepNumber}>
                        <Link
                          href={stepHref(step.stepNumber)}
                          className={cn("fdd-stepcard", `fdd-stepcard--${step.status}`)}
                        >
                          <span className="fdd-stepcard__top">
                            <span className="fdd-stepcard__num">
                              {t.journeyPage.stepLabel} {String(step.stepNumber).padStart(2, "0")}
                            </span>
                            <span className={`fdd-pill fdd-pill--status-${step.status}`}>
                              {t.journeyPage.status[step.status]}
                            </span>
                          </span>
                          <span className="fdd-stepcard__title">{step.title}</span>
                          <span className="fdd-stepcard__line">{step.oneLiner}</span>
                          <span className="fdd-stepcard__points">
                            {t.common.upToPointsBefore} {step.maxPoints} {t.common.upToPointsAfter}
                          </span>
                        </Link>
                        {step.stepNumber === 1 && profileAnswersHref && (
                          <Link href={profileAnswersHref} className="fdd-link">
                            {t.common.seeYourAnswers}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </>
      ) : (
        <ComingSoon />
      )}
    </div>
  );
}
