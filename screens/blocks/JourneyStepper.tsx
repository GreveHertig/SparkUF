"use client";

import Link from "next/link";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import type { JourneyStepView } from "@/ports/JourneyRepository";

/**
 * Resan som stegrad, delad av Hem och Resan (PR 9, docs/plan-en-design.md).
 * Fanns i två exemplar sedan PR 3: i `app/demo/_components/DemoBlocks.tsx`
 * och som lokal kopia i `screens/AppHome.tsx`. Ligger under `screens/` —
 * portregeln gäller.
 */

function StepContent({ step }: { step: JourneyStepView }) {
  const { t } = useI18n();
  return (
    <>
      <span className="fd-stepper__num">{String(step.stepNumber).padStart(2, "0")}</span>
      <span className="fd-stepper__title">{step.title}</span>
      <span className="fd-sr-only">{t.journeyPage.status[step.status]}</span>
    </>
  );
}

/** Resan som en kompakt stegrad: klara steg fyllda, det aktuella markerat, låsta dämpade. */
export function JourneyStepper({
  steps,
  basePath,
}: {
  steps: JourneyStepView[];
  /**
   * Resans bas-väg (t.ex. `/demo/resan`); stegets länk blir `<bas>/<nummer>`.
   * En sträng, inte en funktion, så att en Server Component kan skicka den.
   * `null`: stegen visas utan länk.
   */
  basePath: string | null;
}) {
  const { t } = useI18n();
  return (
    <ol className="fd-stepper fdd-stepper" aria-label={t.site.journey.stepsListLabel}>
      {steps.map((step) => (
        <li
          key={step.stepNumber}
          className={cn("fd-stepper__item", `fdd-step--${step.status}`)}
          aria-current={step.status === "current" ? "step" : undefined}
        >
          {basePath !== null ? (
            <Link href={`${basePath}/${step.stepNumber}`} className="fdd-stepper__link">
              <StepContent step={step} />
            </Link>
          ) : (
            <span className="fdd-stepper__link">
              <StepContent step={step} />
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
