"use client";

import { useId, useMemo, useState } from "react";
import { SourceTag } from "@/components/ui/SourceTag";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import { getScoreLevel } from "@/score/levels";
import { fill } from "../_lib/fill";
import { PROOF_ANSWER_COUNT, PROOF_CONTRADICTING_COUNT, proofScores } from "../_lib/proofEvidence";

// Samma nivåtoner som ScoreBadge.
const levelTone = {
  red: "bg-score-red-bg text-score-red",
  orange: "bg-score-orange-bg text-score-orange",
  yellow: "bg-score-yellow-bg text-score-yellow",
  green: "bg-score-green-bg text-score-green",
  strong: "bg-score-strong-bg text-score-strong",
} as const;

/**
 * Hero-panelen: ett fiktivt exempel där besökaren själv slår på att tre
 * kunder säger emot, och ser calculateScore räkna om och poängen sjunka.
 */
export function ScoreProof() {
  const { t } = useI18n();
  const copy = t.experimentFonda.proof;
  const [contradicted, setContradicted] = useState(false);
  // Räknas upp vid varje omräkning och används som key, så att talet får
  // omräkningsrörelsen efter en faktisk ändring men inte vid första visningen.
  const [recounts, setRecounts] = useState(0);
  const hintId = useId();

  const scores = useMemo(
    () => proofScores({ parts: t.score.parts, sources: copy.sources, deltaReason: copy.deltaReason }),
    [t.score.parts, copy.sources, copy.deltaReason],
  );

  const snapshot = contradicted ? scores.contradicted : scores.base;
  const level = getScoreLevel(snapshot.total);

  function toggle() {
    setContradicted((value) => !value);
    setRecounts((value) => value + 1);
  }

  return (
    <section aria-label={copy.regionLabel} className="fd-proof">
      <div className="fd-proof__idea">
        <div className="fd-proof__ideahead">
          <p className="fd-proof__name">{copy.idea}</p>
          <span className="fd-pill fd-pill--fiction">{copy.fictional}</span>
        </div>
        <p className="fd-proof__line">{copy.ideaLine}</p>

        <div className="fd-answers">
          <p className="fd-answers__label">{copy.answersLabel}</p>
          <ul className="fd-answers__list">
            {Array.from({ length: PROOF_ANSWER_COUNT }, (_, index) => {
              const against = contradicted && index >= PROOF_ANSWER_COUNT - PROOF_CONTRADICTING_COUNT;
              return (
                <li
                  key={index}
                  className={cn("fd-answer", against && "fd-answer--against")}
                  style={{ ["--i" as string]: index }}
                >
                  <span className="fd-sr-only">{against ? copy.contradicts : copy.confirms}</span>
                </li>
              );
            })}
          </ul>
          <p className="fd-answers__legend" aria-hidden="true">
            <span className="fd-answers__key">{copy.confirms}</span>
            <span className="fd-answers__key fd-answers__key--against">{copy.contradicts}</span>
          </p>
        </div>

        <div className="fd-proof__control">
          <button
            type="button"
            role="switch"
            aria-checked={contradicted}
            aria-describedby={hintId}
            onClick={toggle}
            className="fd-switch"
          >
            <span className="fd-switch__track" aria-hidden="true">
              <span className="fd-switch__thumb" />
            </span>
            <span>{copy.toggle}</span>
          </button>
          <p id={hintId} className="fd-proof__hint">
            {copy.toggleHint}
          </p>
        </div>

        <p className="fd-proof__delta" aria-live="polite">
          {contradicted && (
            <>
              <span className="fd-proof__deltanum">−{Math.abs(snapshot.delta)}</span> {snapshot.deltaReason}
            </>
          )}
        </p>
      </div>

      <div className="fd-proof__score">
        <div className="fd-proof__total">
          <p className="fd-proof__label">{copy.scoreLabel}</p>
          <p className="fd-proof__number">
            <span key={recounts} className={cn(recounts > 0 && "fd-recount")}>
              {snapshot.total}
            </span>
            <span className="fd-proof__outof">{copy.outOf}</span>
          </p>
          <span className={cn("fd-level", levelTone[level.tone])}>{t.score.levels[level.key].name}</span>
        </div>

        <p className="fd-proof__partslabel">{copy.partsLabel}</p>
        <ul className="fd-parts">
          {snapshot.parts.map((part) => (
            <li key={part.name} className="fd-part">
              <div className="fd-part__row">
                <span className="fd-part__name">{part.name}</span>
                <span className="fd-part__points">
                  {part.points}
                  <span className="fd-part__weight">/{part.weight}</span>
                </span>
              </div>
              <span className="fd-part__bar" aria-hidden="true">
                <span style={{ transform: `scaleX(${Math.max(0, part.points) / part.weight})` }} />
              </span>
              <SourceTag source={part.source} dataType={part.dataType} className="fd-part__source" />
            </li>
          ))}
        </ul>
        <p className="fd-proof__locked">{fill(copy.lockedCount, { count: snapshot.lockedParts.length })}</p>
      </div>
    </section>
  );
}
