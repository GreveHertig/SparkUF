"use client";

import { useMemo } from "react";
import { useI18n } from "@/i18n/context";
import { beatsFor } from "../_lib/friDemoData";
import { friDemoActions, useFriBeatIndex } from "../_lib/friDemoState";

/**
 * Demoraden för kopian: var i resan demot står, bakåt/nästa, hoppa till ett
 * moment och återställ. Styr bara kopians eget läge (spark:fri-demo).
 */
export function FriDemoBar() {
  const { t, locale } = useI18n();
  const beatIndex = useFriBeatIndex();
  const beats = useMemo(() => beatsFor(locale), [locale]);
  const beat = beats[beatIndex] ?? beats[0];
  const pad = (n: number) => String(n).padStart(2, "0");
  const confirmReset = () => {
    if (window.confirm(t.demoBar.resetConfirm)) friDemoActions.reset();
  };

  return (
    <div className="fri-bar on-dark" role="region" aria-label={t.demoBar.momentLabel}>
      <div className="fri-wrap fri-bar-row">
        <div className="fri-bar-where">
          <span className="fri-mono">
            {t.demoBar.stepLabel} {pad(beat.stepNumber)} {t.demoBar.stepOf} · {t.demoBar.phases[beat.phase]}
          </span>
          <span className="moment">{beat.momentLabel}</span>
          <button type="button" className="fri-textbtn fri-reset-mobile" onClick={confirmReset}>
            {t.demoBar.reset}
          </button>
        </div>
        <div className="fri-bar-controls">
          <label className="sr-only" htmlFor="fri-jump">
            {t.demoBar.jumpToStep}
          </label>
          <select
            id="fri-jump"
            className="fri-select"
            value={beatIndex}
            onChange={(event) => friDemoActions.setBeat(Number(event.target.value))}
          >
            {beats.map((option) => (
              <option key={option.index} value={option.index}>
                {t.demoBar.stepLabel} {option.stepNumber} · {option.momentLabel}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="fri-btn fri-btn-outline-dark"
            onClick={friDemoActions.back}
            disabled={beatIndex === 0}
          >
            {t.demoBar.back}
          </button>
          <button
            type="button"
            className="fri-btn fri-btn-signal"
            onClick={friDemoActions.next}
            disabled={beatIndex === friDemoActions.lastIndex}
          >
            {t.demoBar.next}
          </button>
          <button type="button" className="fri-textbtn" onClick={confirmReset}>
            {t.demoBar.reset}
          </button>
        </div>
      </div>
    </div>
  );
}
