"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import * as Popover from "@radix-ui/react-popover";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { engineFor } from "@/adapters/demo/journeyEngine";
import { saraProfile } from "@/adapters/demo/sara";
import { jonasProfile } from "@/adapters/demo/jonas";
import { fill } from "@/app/experiment/fonda/_lib/fill";
import { FONDA_DEMO_PATHS, isStartPath } from "../_lib/paths";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/**
 * Demoraden i kopian, med samma funktioner som det riktiga demots
 * (components/spark/DemoBar.tsx): bakåt, nästa, hoppa till steg, rundtur,
 * byt ingång, börja om och fäll ihop, plus ← → T R på tangentbordet. Styr
 * samma demo-lager, men under kopians egen lagringsnyckel.
 */
export function FondaDemoBar() {
  const { locale, t } = useI18n();
  const copy = t.experimentFonda.demo.bar;
  const d = t.demoBar;
  const pathname = usePathname();
  const router = useRouter();

  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  const onboardingDone = useDemoStore((state) => state.onboardingDone);
  const tourOn = useDemoStore((state) => state.tourOn);
  const collapsed = useDemoStore((state) => state.collapsed);
  const next = useDemoStore((state) => state.next);
  const back = useDemoStore((state) => state.back);
  const goTo = useDemoStore((state) => state.goTo);
  const toggleTour = useDemoStore((state) => state.toggleTour);
  const toggleCollapsed = useDemoStore((state) => state.toggleCollapsed);
  const setEntry = useDemoStore((state) => state.setEntry);
  const completeOnboarding = useDemoStore((state) => state.completeOnboarding);
  const reset = useDemoStore((state) => state.reset);

  const inApp = !isStartPath(pathname);
  const engine = engineFor(entry);
  const beat = engine.getBeatAt(beatIndex);
  const atStart = beatIndex === 0;
  const atEnd = beatIndex >= engine.beats.length - 1;
  const persona = entry === "hasIdea" ? jonasProfile : saraProfile;
  const personaLabel = `${persona.name} · ${entry === "hasIdea" ? d.personaBLabel : d.personaALabel}`;

  function jumpToStep(index: number) {
    goTo(index);
    if (!onboardingDone) completeOnboarding();
    if (!inApp) router.push(FONDA_DEMO_PATHS.home);
  }

  function confirmReset() {
    if (window.confirm(copy.resetConfirm)) reset();
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;
      if (event.key === "ArrowRight" && inApp) {
        event.preventDefault();
        next();
      } else if (event.key === "ArrowLeft" && inApp) {
        event.preventDefault();
        back();
      } else if (event.key === "t" || event.key === "T") {
        toggleTour();
      } else if (event.key === "r" || event.key === "R") {
        if (window.confirm(copy.resetConfirm)) reset();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [next, back, toggleTour, reset, copy.resetConfirm, inApp]);

  return (
    <div role="region" aria-label={copy.label} className="fdd-bar">
      <div className="fdd-bar__inner">
        <div className="fdd-bar__info">
          <span className="fdd-bar__persona">{personaLabel}</span>
          {!collapsed && (
            <span className="fdd-bar__position" aria-live="polite">
              {inApp ? (
                <>
                  {d.stepLabel} {String(beat.stepNumber).padStart(2, "0")} {d.stepOf}
                  <span aria-hidden="true"> · </span>
                  {beat.momentLabel[locale]}
                  <span className="fd-sr-only">
                    {" "}
                    {fill(copy.position, { current: beatIndex + 1, total: engine.beats.length })}
                  </span>
                </>
              ) : (
                d.onboardingLabel
              )}
            </span>
          )}
        </div>

        {!collapsed && (
          <div className="fdd-bar__actions">
            <button type="button" onClick={back} disabled={!inApp || atStart} className="fdd-bar__btn">
              <span aria-hidden="true">←</span> {copy.back}
            </button>
            <button type="button" onClick={next} disabled={!inApp || atEnd} className="fdd-bar__btn fdd-bar__btn--next">
              {copy.next} <span aria-hidden="true">→</span>
            </button>

            <Popover.Root>
              <Popover.Trigger asChild>
                <button type="button" className="fdd-bar__btn fdd-bar__btn--quiet">
                  {d.jumpToStep}
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content side="top" align="center" sideOffset={10} collisionPadding={12} className="fdd-jump">
                  {engine.beats.map((scenarioBeat, index) => (
                    <Popover.Close asChild key={scenarioBeat.id}>
                      <button
                        type="button"
                        onClick={() => jumpToStep(index)}
                        aria-current={index === beatIndex ? "step" : undefined}
                        className={cn("fdd-jump__item", index === beatIndex && "fdd-jump__item--current")}
                      >
                        <span className="fdd-jump__step">{String(scenarioBeat.stepNumber).padStart(2, "0")}</span>
                        {scenarioBeat.momentLabel[locale]}
                      </button>
                    </Popover.Close>
                  ))}
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>

            {entry === "hasIdea" ? (
              <button type="button" disabled title={d.tourLockedHint} className="fdd-bar__btn fdd-bar__btn--quiet">
                {d.tourLocked}
              </button>
            ) : (
              <button type="button" aria-pressed={tourOn} onClick={toggleTour} className="fdd-bar__btn fdd-bar__btn--quiet">
                {tourOn ? d.tourOn : d.tourOff}
              </button>
            )}

            <button
              type="button"
              onClick={() => setEntry(entry === "noIdea" ? "hasIdea" : "noIdea")}
              className="fdd-bar__btn fdd-bar__btn--quiet"
            >
              {d.switchEntry} ({entry === "noIdea" ? d.entryNoIdea : d.entryHasIdea})
            </button>

            <button type="button" onClick={confirmReset} className="fdd-bar__btn fdd-bar__btn--quiet">
              {copy.reset}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? d.expand : d.collapse}
          aria-expanded={!collapsed}
          className="fdd-bar__collapse"
        >
          <span aria-hidden="true" className={cn("fdd-chevron", collapsed && "fdd-chevron--up")} />
        </button>
      </div>
    </div>
  );
}
