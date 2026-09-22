"use client";

import Link from "next/link";
import { EditorialHeading } from "@/components/ui/EditorialHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import type { JourneyStepView, JourneyStepStatus } from "@/ports/JourneyRepository";

export type JourneyData = {
  steps: JourneyStepView[];
};

const PHASE_ORDER = ["discover", "tryPhase", "launch", "grow"] as const;

export const journeyStatusToneClasses: Record<JourneyStepStatus, string> = {
  done: "border-score-green bg-score-green-bg text-score-green",
  current: "border-accent-600 bg-accent-100 text-accent-700",
  locked: "border-dashed border-slate-300 bg-slate-50 text-slate-500",
};

/** Resan (avsnitt 6): 12 steg i 4 faser med tillstånden klar/aktuell/låst,
 * varje steg visar "kan ge upp till X poäng". Skärmen tar bara emot redan
 * hämtad, redan språkvald data — den vet inte att den kom från demot. */
export function Journey({ data, stepHref }: { data: JourneyData; stepHref: (stepNumber: number) => string }) {
  const { t } = useI18n();
  // Rubriken beskriver var resan faktiskt står i stället för att bara
  // upprepa "Resan" (uppgift 2) — det aktuella steget om det finns ett,
  // annars det senast klara (resan färdig) eller första steget (inget
  // gjort än).
  const highlightedStep =
    data.steps.find((step) => step.status === "current") ??
    [...data.steps].reverse().find((step) => step.status === "done") ??
    data.steps[0];

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-[18px]">
      <div>
        {highlightedStep && (
          <Eyebrow>
            <span className="font-numeric">
              {t.journeyPage.stepLabel} {String(highlightedStep.stepNumber).padStart(2, "0")}
            </span>{" "}
            · {t.journeyPage.status[highlightedStep.status]}
          </Eyebrow>
        )}
        <EditorialHeading as="h1" className="mt-2">
          {highlightedStep?.title ?? t.journeyPage.title}
        </EditorialHeading>
        <p className="mt-2 text-sm text-slate-600">{highlightedStep?.oneLiner ?? t.journeyPage.subtitle}</p>
      </div>

      <div className="flex flex-col gap-[18px]">
        {PHASE_ORDER.map((phase) => {
          const stepsInPhase = data.steps.filter((step) => step.journeyPhase === phase);
          if (stepsInPhase.length === 0) return null;

          const doneInPhase = stepsInPhase.filter((step) => step.status === "done").length;

          return (
            <section key={phase} className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <Eyebrow>{t.journeyPage.phaseNames[phase]}</Eyebrow>
                <span className="font-numeric text-xs text-slate-500">
                  {doneInPhase}/{stepsInPhase.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {stepsInPhase.map((step) => (
                  <Link
                    key={step.stepNumber}
                    href={stepHref(step.stepNumber)}
                    className={cn(
                      "flex flex-col gap-1.5 rounded-md border bg-white p-4 shadow-lg transition-colors hover:border-accent-400 focus-visible:outline-2 focus-visible:outline-accent-300",
                    )}
                    style={{ transitionDuration: "var(--motion-fast)", transitionTimingFunction: "var(--ease-standard)" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-numeric text-xs font-semibold uppercase text-slate-500" style={{ letterSpacing: "var(--tracking-label)" }}>
                        {t.journeyPage.stepLabel} {String(step.stepNumber).padStart(2, "0")}
                      </span>
                      <span
                        className={cn(
                          "rounded-pill border px-2 py-0.5 text-xs font-semibold uppercase",
                          journeyStatusToneClasses[step.status],
                        )}
                        style={{ letterSpacing: "var(--tracking-label)" }}
                      >
                        {t.journeyPage.status[step.status]}
                      </span>
                    </div>
                    <p className="text-lg text-slate-900">{step.title}</p>
                    <p className="text-sm leading-snug text-slate-600">{step.oneLiner}</p>
                    <p className="mt-1 text-xs font-medium text-accent-700">
                      {t.common.upToPointsBefore} <span className="font-numeric">{step.maxPoints}</span> {t.common.upToPointsAfter}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
