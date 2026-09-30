"use client";

import Link from "next/link";
import { ConceptBadge } from "@/components/ui/ConceptBadge";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import type { JourneyStepView } from "@/ports/JourneyRepository";
import { mentionsConcept } from "@/core/concepts";

// Flyttade till screens/blocks/ i PR 5; exporteras vidare åt demots sidor
// som inte är flyttade till screens/ än.
export { Locked, PageHead, Pill, type PillTone } from "@/screens/blocks/PageBlocks";
// Flyttade till screens/blocks/ i PR 7, av samma skäl.
export { ExampleLabel, Figures, SimulationBlock, VerdictBlock, type Figure } from "@/screens/blocks/DataBlocks";

/** Resan som stegrad: klara steg fyllda, det aktuella markerat, låsta dämpade. */
export function JourneyStepper({
  steps,
  stepHref,
}: {
  steps: JourneyStepView[];
  stepHref?: (stepNumber: number) => string;
}) {
  const { t } = useI18n();

  return (
    <ol className="fd-stepper fdd-stepper" aria-label={t.site.journey.stepsListLabel}>
      {steps.map((step) => {
        const content = (
          <>
            <span className="fd-stepper__num">{String(step.stepNumber).padStart(2, "0")}</span>
            <span className="fd-stepper__title">{step.title}</span>
            <span className="fd-sr-only">{t.journeyPage.status[step.status]}</span>
          </>
        );
        return (
          <li
            key={step.stepNumber}
            className={cn("fd-stepper__item", `fdd-step--${step.status}`)}
            aria-current={step.status === "current" ? "step" : undefined}
          >
            {stepHref ? (
              <Link href={stepHref(step.stepNumber)} className="fdd-stepper__link">
                {content}
              </Link>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** En rad i samtalet med Medgrundaren. Koncept får sin etikett. */
export function ChatLine({ role, text }: { role: "founder" | "cofounder"; text: string }) {
  return (
    <div className={cn("fdd-chat", role === "founder" ? "fdd-chat--founder" : "fdd-chat--cofounder")}>
      <p className="fdd-chat__bubble">{text}</p>
      {mentionsConcept(text) && <ConceptBadge />}
    </div>
  );
}

/** Ett verktyg som körts: delmomenten, alla klara. */
export function ToolRun({ label, steps }: { label: string; steps: string[] }) {
  const { t } = useI18n();
  return (
    <div className="fdd-tool">
      <p className="fdd-tool__label">
        {t.cofounderPage.toolRunningLabel}: {label}
      </p>
      <ul className="fd-checks fd-checks--small">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ul>
      {mentionsConcept(`${label} ${steps.join(" ")}`) && <ConceptBadge />}
    </div>
  );
}

/** "4 dagar senare" i samtalet. */
export function TimeSkipLine({ label }: { label: string }) {
  return (
    <p className="fdd-skip">
      <span>{label}</span>
    </p>
  );
}
