"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import { demoJourneyRepository } from "@/adapters/demo/JourneyRepository";
import { useDemoStore } from "@/adapters/demo/demoStore";
import type { JourneyStepView } from "@/ports/JourneyRepository";
import { JourneyStepper, PageHead } from "../../_components/DemoBlocks";
import { journeyStepPath } from "../../_lib/paths";

const PHASE_ORDER = ["discover", "tryPhase", "launch", "grow"] as const;

/** Resan: stegraden överst, sedan varje fas med sina steg. */
export default function FondaDemoJourneyPage() {
  const { t, locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  const [steps, setSteps] = useState<JourneyStepView[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    demoJourneyRepository.getSteps(locale).then((result) => {
      if (!cancelled) setSteps(result);
    });
    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex, entry]);

  if (!steps) return null;

  // Som i originalet beskriver rubriken var resan står: det aktuella steget,
  // annars det senast klara, annars det första.
  const highlighted =
    steps.find((step) => step.status === "current") ??
    [...steps].reverse().find((step) => step.status === "done") ??
    steps[0];

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

      <div className="fd-journey">
        <JourneyStepper steps={steps} stepHref={journeyStepPath} />
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
                      href={journeyStepPath(step.stepNumber)}
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
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
