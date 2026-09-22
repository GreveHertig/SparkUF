"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import { journeyStatusToneClasses } from "@/screens/Journey";
import type { JourneyStepView } from "@/ports/JourneyRepository";

const PHASE_ORDER = ["discover", "tryPhase", "launch", "grow"] as const;

const dotToneClasses = {
  done: "bg-score-green text-white",
  current: "bg-accent-600 text-white",
  locked: "bg-slate-200 text-slate-500",
} as const;

/**
 * Kompakt "Resan"-rad för Hem (artefaktens `railHTML`): faser med
 * klickbara stegprickar och den valda stegets detalj. Full Resan-sida
 * (`screens/Journey.tsx`) visar samma steg som ett fullständigt kortgrid —
 * det här är en genväg, inte en ersättning.
 */
export function JourneyRail({
  steps,
  stepHref,
}: {
  steps: JourneyStepView[];
  stepHref: (stepNumber: number) => string;
}) {
  const { t } = useI18n();
  const currentStep = steps.find((step) => step.status === "current");
  const [selectedStep, setSelectedStep] = useState<number>(currentStep?.stepNumber ?? steps[0]?.stepNumber ?? 1);
  const doneCount = steps.filter((step) => step.status === "done").length;
  const selected = steps.find((step) => step.stepNumber === selectedStep) ?? steps[0];

  return (
    <Card
      title={t.journeyPage.title}
      right={
        <span className="font-numeric text-xs text-slate-500">
          {doneCount}/{steps.length}
          {currentStep && (
            <>
              {" · "}
              {t.journeyPage.status.current}: {t.journeyPage.stepLabel} {String(currentStep.stepNumber).padStart(2, "0")}
            </>
          )}
        </span>
      }
    >
      <div className="flex flex-col gap-3">
        {PHASE_ORDER.map((phase) => {
          const stepsInPhase = steps.filter((step) => step.journeyPhase === phase);
          if (stepsInPhase.length === 0) return null;
          const doneInPhase = stepsInPhase.filter((step) => step.status === "done").length;

          return (
            <div key={phase} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>{t.journeyPage.phaseNames[phase]}</span>
                <span className="font-numeric">
                  {doneInPhase}/{stepsInPhase.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {stepsInPhase.map((step) => (
                  <button
                    key={step.stepNumber}
                    type="button"
                    onClick={() => setSelectedStep(step.stepNumber)}
                    aria-current={selectedStep === step.stepNumber ? "true" : undefined}
                    title={`${t.journeyPage.stepLabel} ${step.stepNumber} · ${step.title}`}
                    className={cn(
                      "font-numeric flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-accent-300",
                      dotToneClasses[step.status],
                      selectedStep === step.stepNumber && "ring-2 ring-offset-1 ring-accent-400",
                    )}
                    style={{ transitionDuration: "var(--motion-fast)", transitionTimingFunction: "var(--ease-standard)" }}
                  >
                    {String(step.stepNumber).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="mt-3 flex flex-col gap-1.5 border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between gap-2">
            <span
              className="font-numeric text-xs font-semibold uppercase text-slate-500"
              style={{ letterSpacing: "var(--tracking-label)" }}
            >
              {t.journeyPage.stepLabel} {String(selected.stepNumber).padStart(2, "0")}
            </span>
            <span
              className={cn(
                "rounded-pill border px-2 py-0.5 text-xs font-semibold uppercase",
                journeyStatusToneClasses[selected.status],
              )}
              style={{ letterSpacing: "var(--tracking-label)" }}
            >
              {t.journeyPage.status[selected.status]}
            </span>
          </div>
          <p className="text-base text-slate-900">{selected.title}</p>
          <p className="text-sm leading-snug text-slate-600">{selected.oneLiner}</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-slate-600">
              {t.common.upToPointsBefore} <span className="font-numeric">{selected.maxPoints}</span> {t.common.upToPointsAfter}
            </p>
            <Link href={stepHref(selected.stepNumber)} className="text-xs font-semibold text-slate-700 hover:text-slate-900 hover:underline">
              {t.journeyPage.openStep} →
            </Link>
          </div>
        </div>
      )}
    </Card>
  );
}
