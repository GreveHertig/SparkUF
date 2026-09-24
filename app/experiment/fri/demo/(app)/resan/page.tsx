"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/context";
import type { JourneyStepView } from "@/ports/JourneyRepository";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { demoJourneyRepository } from "@/adapters/demo/JourneyRepository";
import { FriPageHead, FriStatus } from "../../_components/FriParts";
import { FRI_DEMO_BASE } from "../../_lib/friPaths";

const PHASE_ORDER = ["discover", "tryPhase", "launch", "grow"] as const;
const statusTone = { done: "ok", current: "signal", locked: "muted" } as const;

/** Resan i kopian: samma steg och status som /demo/app/resan (screens/Journey). */
export default function FriJourneyPage() {
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

  // Samma val av framhävt steg som screens/Journey.
  const highlighted =
    steps.find((step) => step.status === "current") ??
    [...steps].reverse().find((step) => step.status === "done") ??
    steps[0];
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <>
      <FriPageHead
        kicker={
          highlighted ? (
            <>
              {t.journeyPage.stepLabel} {pad(highlighted.stepNumber)} · {t.journeyPage.status[highlighted.status]}
            </>
          ) : undefined
        }
        title={highlighted?.title ?? t.journeyPage.title}
        lead={highlighted?.oneLiner ?? t.journeyPage.subtitle}
      />

      {PHASE_ORDER.map((phase) => {
        const inPhase = steps.filter((step) => step.journeyPhase === phase);
        if (inPhase.length === 0) return null;
        const doneInPhase = inPhase.filter((step) => step.status === "done").length;
        return (
          <section key={phase} className="fri-section-demo">
            <div className="fri-section-title">
              <h2 className="fri-h2-demo">{t.journeyPage.phaseNames[phase]}</h2>
              <span className="fri-mono fri-muted">
                {doneInPhase}/{inPhase.length}
              </span>
            </div>
            <ol className="fri-step-rows">
              {inPhase.map((step) => (
                <li key={step.stepNumber}>
                  <Link href={`${FRI_DEMO_BASE}/resan/${step.stepNumber}`} className={`fri-step-row ${step.status}`}>
                    <span className="num">{pad(step.stepNumber)}</span>
                    <span className="body">
                      <span className="title">{step.title}</span>
                      <span className="fri-muted">{step.oneLiner}</span>
                    </span>
                    <span className="meta">
                      <FriStatus tone={statusTone[step.status]}>{t.journeyPage.status[step.status]}</FriStatus>
                      <span className="fri-mono fri-muted">
                        {t.common.upToPointsBefore} {step.maxPoints} {t.common.upToPointsAfter}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </>
  );
}
