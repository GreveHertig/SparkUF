"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/i18n/context";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { engineFor } from "@/adapters/demo/journeyEngine";
import { saraProfile } from "@/adapters/demo/sara";
import { jonasProfile } from "@/adapters/demo/jonas";
import { FRI_DEMO_BASE, isInFriStart } from "../_lib/friPaths";

/**
 * Kopia av components/spark/DemoBar i /experiment/fri-stil: samma
 * funktioner (bakåt/nästa, hoppa till moment, rundtur, byt ingång,
 * återställ, fäll ihop) och samma tangentbordsgenvägar (← → T R).
 */
export function FriDemoBar() {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  const onboardingDone = useDemoStore((state) => state.onboardingDone);
  const tourOn = useDemoStore((state) => state.tourOn);
  const collapsed = useDemoStore((state) => state.collapsed);
  const { next, back, goTo, toggleTour, toggleCollapsed, setEntry, completeOnboarding, reset } = useDemoStore.getState();

  const inApp = !isInFriStart(pathname);
  const engine = engineFor(entry);
  const beat = engine.getBeatAt(beatIndex);
  const atStart = beatIndex === 0;
  const atEnd = beatIndex >= engine.beats.length - 1;
  const persona = entry === "hasIdea" ? jonasProfile : saraProfile;
  const personaLabel = `${persona.name} · ${entry === "hasIdea" ? t.demoBar.personaBLabel : t.demoBar.personaALabel}`;
  const pad = (n: number) => String(n).padStart(2, "0");

  function jumpTo(index: number) {
    goTo(index);
    if (!onboardingDone) completeOnboarding();
    if (!inApp) router.push(FRI_DEMO_BASE);
  }

  function confirmReset() {
    if (window.confirm(t.demoBar.resetConfirm)) reset();
  }

  useEffect(() => {
    function isTypingTarget(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) return false;
      return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;
      const store = useDemoStore.getState();
      if (event.key === "ArrowRight" && inApp) {
        event.preventDefault();
        store.next();
      } else if (event.key === "ArrowLeft" && inApp) {
        event.preventDefault();
        store.back();
      } else if (event.key === "t" || event.key === "T") {
        store.toggleTour();
      } else if (event.key === "r" || event.key === "R") {
        if (window.confirm(t.demoBar.resetConfirm)) store.reset();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [inApp, t]);

  return (
    <div className="fri-bar on-dark" role="region" aria-label={t.demoBar.momentLabel}>
      <div className="fri-wrap">
        <div className="fri-bar-top">
          <span className="fri-bar-persona">{personaLabel}</span>
          {!collapsed && (
            <span className="fri-bar-moment">
              {inApp ? (
                <>
                  <span className="fri-mono">
                    {t.demoBar.stepLabel} {pad(beat.stepNumber)} {t.demoBar.stepOf} · {t.demoBar.phases[beat.phase]}
                  </span>
                  <span className="moment">{beat.momentLabel[locale]}</span>
                </>
              ) : (
                <span className="moment">{t.demoBar.onboardingLabel}</span>
              )}
            </span>
          )}
          <button
            type="button"
            className="fri-bar-collapse"
            onClick={toggleCollapsed}
            aria-expanded={!collapsed}
            aria-label={collapsed ? t.demoBar.expand : t.demoBar.collapse}
          >
            <span aria-hidden="true" className={collapsed ? "chev up" : "chev"} />
          </button>
        </div>

        {!collapsed && (
          <div className="fri-bar-controls">
            <button type="button" className="fri-btn fri-btn-outline-dark" onClick={back} disabled={!inApp || atStart}>
              {t.demoBar.back}
            </button>
            <button type="button" className="fri-btn fri-btn-signal" onClick={next} disabled={!inApp || atEnd}>
              {t.demoBar.next}
            </button>
            <label className="sr-only" htmlFor="fri-jump">
              {t.demoBar.jumpToStep}
            </label>
            <select
              id="fri-jump"
              className="fri-select"
              value={inApp ? beatIndex : ""}
              onChange={(event) => jumpTo(Number(event.target.value))}
            >
              {!inApp && (
                <option value="" disabled>
                  {t.demoBar.jumpToStep}
                </option>
              )}
              {engine.beats.map((scenarioBeat, index) => (
                <option key={scenarioBeat.id} value={index}>
                  {t.demoBar.stepLabel} {scenarioBeat.stepNumber} · {scenarioBeat.momentLabel[locale]}
                </option>
              ))}
            </select>
            {entry === "hasIdea" ? (
              <button type="button" className="fri-textbtn" disabled title={t.demoBar.tourLockedHint}>
                {t.demoBar.tourLocked}
              </button>
            ) : (
              <button type="button" className="fri-textbtn" aria-pressed={tourOn} onClick={toggleTour}>
                {tourOn ? t.demoBar.tourOn : t.demoBar.tourOff}
              </button>
            )}
            <button
              type="button"
              className="fri-textbtn"
              onClick={() => setEntry(entry === "noIdea" ? "hasIdea" : "noIdea")}
            >
              {t.demoBar.switchEntry} ({entry === "noIdea" ? t.demoBar.entryNoIdea : t.demoBar.entryHasIdea})
            </button>
            <button type="button" className="fri-textbtn fri-bar-reset" onClick={confirmReset}>
              {t.demoBar.reset}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
