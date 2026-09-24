"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { NextStep, ScoreSnapshot } from "@/core/domain";
import type { ScoreSuggestion } from "@/core/score";
import type { JourneyStepView } from "@/ports/JourneyRepository";
import { useI18n } from "@/i18n/context";
import { getScoreLevel } from "@/score/levels";
import { FriSource } from "./FriSource";

// Kopior av demots byggblock (components/spark/NextStepCard, ScorePanel,
// JourneyRail, SuggestionList) i /experiment/fri-stil. Samma props-data,
// samma UI-tillstånd och samma texter; originalen är orörda.

/** = NextStepCard `splitIntoReasons`: ingen ny text, bara omformaterad. */
function splitIntoReasons(why: string): string[] {
  return why
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export function FriNextStep({
  nextStep,
  remainingParts,
  unlockedPartsCount,
  totalPartsCount,
}: {
  nextStep: NextStep;
  remainingParts: { name: string; unlocksAfterStep: number }[];
  unlockedPartsCount: number;
  totalPartsCount: number;
}) {
  const { t } = useI18n();
  const [deferred, setDeferred] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const reasons = useMemo(() => splitIntoReasons(nextStep.why), [nextStep.why]);

  return (
    <section>
      <div className="fri-kicker">
        <span className="fri-now">{t.homePage.actNowLabel}</span>
        <span className="fri-mono">{nextStep.eyebrow}</span>
        <span className="fri-mono" style={{ marginLeft: "auto" }}>
          {nextStep.estimatedTime}
        </span>
      </div>
      <h1 className="fri-h1-demo" style={{ marginTop: 22 }}>
        {nextStep.title}
      </h1>
      {reasons.length > 1 ? (
        <ul className="fri-reasons">
          {reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : (
        <p className="fri-lead" style={{ marginTop: 22, color: "var(--ink)" }}>
          {nextStep.why}
        </p>
      )}

      <div className="fri-actions">
        <button type="button" className="fri-btn fri-btn-signal">
          {nextStep.actionLabel}
        </button>
        <button type="button" className="fri-btn fri-btn-ghost" disabled={deferred} onClick={() => setDeferred(true)}>
          {deferred ? t.common.deferredLabel : t.common.laterLabel}
        </button>
        {nextStep.doneItems.length > 0 && (
          <button
            type="button"
            className="fri-link"
            aria-expanded={evidenceOpen}
            onClick={() => setEvidenceOpen((open) => !open)}
          >
            {evidenceOpen ? t.common.hideEvidenceLabel : t.common.showEvidenceLabel}
          </button>
        )}
        <span className="fri-points">
          +{nextStep.maxPoints} {t.common.upToPointsAfter}
        </span>
      </div>

      {evidenceOpen && nextStep.doneItems.length > 0 && (
        <div style={{ marginTop: 24 }} className="fri-ruled">
          <p className="fri-mono fri-muted">{t.common.doneItemsLabel}</p>
          <ul className="fri-reasons" style={{ marginTop: 10 }}>
            {nextStep.doneItems.map((item) => (
              <li key={item} style={{ fontSize: "1rem" }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {remainingParts.length > 0 && (
        <div style={{ marginTop: 44 }}>
          <div className="fri-ruled" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 540 }}>{t.journeyPage.whatsNext}</h2>
            <span className="fri-mono fri-muted">
              {unlockedPartsCount}/{totalPartsCount}
            </span>
          </div>
          <ul className="fri-row-list">
            {remainingParts.map((part) => (
              <li key={part.name}>
                <span>{part.name}</span>
                <span className="fri-muted" style={{ fontSize: "0.92rem" }}>
                  {t.homePage.unlocksAfterStepBefore} <span className="fri-mono">{part.unlocksAfterStep}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function FriScoreCard({ snapshot, title }: { snapshot: ScoreSnapshot; title: string }) {
  const { t } = useI18n();
  const [expandedPart, setExpandedPart] = useState<string | null>(null);
  const level = getScoreLevel(snapshot.total);

  return (
    <section className="fri-score-card" aria-label={title}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 540 }}>{title}</h2>
        <span className="fri-mono fri-muted">{t.score.levels[level.key].name}</span>
      </div>
      <p className="fri-score-num" style={{ marginTop: 18 }}>
        {snapshot.total}
        <small>/100</small>
      </p>
      {snapshot.delta !== 0 && (
        <p style={{ marginTop: 14, fontSize: "0.95rem" }}>
          <span className="fri-mono" style={{ color: snapshot.delta < 0 ? "var(--signal-ink)" : "var(--ink)" }}>
            {snapshot.delta > 0 ? "+" : "−"}
            {Math.abs(snapshot.delta)}
          </span>{" "}
          <span className="fri-muted">{snapshot.deltaReason}</span>
        </p>
      )}
      <ul style={{ marginTop: 18, borderTop: "1.5px solid var(--ink)" }}>
        {snapshot.parts.map((part) => {
          const expanded = expandedPart === part.name;
          return (
            <li key={part.name} style={{ borderBottom: "1px solid var(--line)" }}>
              <button
                type="button"
                className="fri-part-btn"
                aria-expanded={expanded}
                onClick={() => setExpandedPart(expanded ? null : part.name)}
              >
                <span className="name">{part.name}</span>
                <span className="pts">
                  {part.points}
                  <span className="fri-muted">/{part.weight}</span>
                </span>
              </button>
              {expanded && (
                <div style={{ paddingBottom: 12 }}>
                  <FriSource source={part.source} dataType={part.dataType} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {snapshot.lockedParts.length > 0 && (
        <ul style={{ marginTop: 12, display: "grid", gap: 6 }}>
          {snapshot.lockedParts.map((part) => (
            <li
              key={part.name}
              className="fri-muted"
              style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: "0.88rem" }}
            >
              <span>{part.name}</span>
              <span>
                {t.homePage.unlocksAfterStepBefore} <span className="fri-mono">{part.unlocksAfterStep}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const PHASE_ORDER = ["discover", "tryPhase", "launch", "grow"] as const;

export function FriJourney({ steps, stepHref }: { steps: JourneyStepView[]; stepHref: (stepNumber: number) => string }) {
  const { t } = useI18n();
  const currentStep = steps.find((step) => step.status === "current");
  const [selectedStep, setSelectedStep] = useState<number>(currentStep?.stepNumber ?? steps[0]?.stepNumber ?? 1);
  const doneCount = steps.filter((step) => step.status === "done").length;
  const selected = steps.find((step) => step.stepNumber === selectedStep) ?? steps[0];
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section className="fri-section-demo">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
        <h2 className="fri-h2-demo">{t.journeyPage.title}</h2>
        <span className="fri-mono fri-muted">
          {doneCount}/{steps.length}
        </span>
      </div>
      <div className="fri-phase-grid">
        {PHASE_ORDER.map((phase) => {
          const inPhase = steps.filter((step) => step.journeyPhase === phase);
          if (inPhase.length === 0) return null;
          const doneInPhase = inPhase.filter((step) => step.status === "done").length;
          return (
            <div key={phase} className="fri-ruled">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontWeight: 540 }}>{t.journeyPage.phaseNames[phase]}</span>
                <span className="fri-mono fri-muted">
                  {doneInPhase}/{inPhase.length}
                </span>
              </div>
              <div className="fri-step-chips">
                {inPhase.map((step) => (
                  <button
                    key={step.stepNumber}
                    type="button"
                    className={`fri-chip ${step.status}`}
                    aria-pressed={selectedStep === step.stepNumber}
                    aria-label={`${t.journeyPage.stepLabel} ${step.stepNumber} · ${step.title} · ${t.journeyPage.status[step.status]}`}
                    onClick={() => setSelectedStep(step.stepNumber)}
                  >
                    {pad(step.stepNumber)}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {selected && (
        <div className="fri-step-detail">
          <div>
            <p className="fri-mono fri-muted">
              {t.journeyPage.stepLabel} {pad(selected.stepNumber)} · {t.journeyPage.status[selected.status]}
            </p>
            <p style={{ marginTop: 8, fontSize: "1.35rem", fontWeight: 540, letterSpacing: "-0.015em" }}>
              {selected.title}
            </p>
            <p className="fri-muted" style={{ marginTop: 4, maxWidth: "60ch" }}>
              {selected.oneLiner}
            </p>
          </div>
          <div style={{ display: "grid", gap: 8, justifyItems: "start" }}>
            <p className="fri-mono" style={{ color: "var(--signal-ink)", whiteSpace: "nowrap" }}>
              {t.common.upToPointsBefore} {selected.maxPoints} {t.common.upToPointsAfter}
            </p>
            <Link href={stepHref(selected.stepNumber)} className="fri-link">
              {t.journeyPage.openStep}
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

export function FriSuggestions({ suggestions }: { suggestions: ScoreSuggestion[] }) {
  const { t } = useI18n();
  return (
    <ul className="fri-sugg">
      {suggestions.map((suggestion) => (
        <li key={suggestion.partId}>
          <span className="gain">+{suggestion.pointsGain}</span>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: "1.15rem", fontWeight: 540, letterSpacing: "-0.01em" }}>{suggestion.label}</p>
            <p className="fri-muted" style={{ marginTop: 4 }}>
              {suggestion.explanation}
            </p>
            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
              <span className="fri-mono fri-muted">
                ~{suggestion.estimatedMinutes} {t.scorePage.estimatedMinutesUnit}
              </span>
              <span className={`fri-gap ${suggestion.gapType === "insufficient" ? "" : "warn"}`}>
                {t.scorePage.gapType[suggestion.gapType]}
              </span>
              <button type="button" className="fri-btn fri-btn-ghost fri-small-btn" style={{ marginLeft: "auto" }}>
                {suggestion.actionLabel}
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
