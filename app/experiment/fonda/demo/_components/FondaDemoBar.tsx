"use client";

import { useEffect } from "react";
import { DEMO_BEAT_COUNT, useDemoStore } from "@/adapters/demo/demoStore";
import { useI18n } from "@/i18n/context";
import { fill } from "../../_lib/fill";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/**
 * Demoraden i kopian: bakåt, nästa och börja om, plus ← och → på
 * tangentbordet. Styr samma demo-lager som det riktiga demot, men under
 * kopians egen lagringsnyckel (se _lib/fondaDemoIsolation.ts).
 */
export function FondaDemoBar() {
  const { t } = useI18n();
  const copy = t.experimentFonda.demo.bar;
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const next = useDemoStore((state) => state.next);
  const back = useDemoStore((state) => state.back);
  const reset = useDemoStore((state) => state.reset);

  const atStart = beatIndex === 0;
  const atEnd = beatIndex >= DEMO_BEAT_COUNT - 1;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") back();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [next, back]);

  function onReset() {
    if (window.confirm(copy.resetConfirm)) reset();
  }

  return (
    <div role="region" aria-label={copy.label} className="fdd-bar">
      <div className="fdd-bar__inner">
        <p className="fdd-bar__position" aria-live="polite">
          {fill(copy.position, { current: beatIndex + 1, total: DEMO_BEAT_COUNT })}
        </p>
        <div className="fdd-bar__actions">
          <button type="button" onClick={back} disabled={atStart} className="fdd-bar__btn">
            <span aria-hidden="true">←</span> {copy.back}
          </button>
          <button type="button" onClick={next} disabled={atEnd} className="fdd-bar__btn fdd-bar__btn--next">
            {copy.next} <span aria-hidden="true">→</span>
          </button>
        </div>
        <button type="button" onClick={onReset} className="fdd-bar__reset">
          {copy.reset}
        </button>
      </div>
    </div>
  );
}
