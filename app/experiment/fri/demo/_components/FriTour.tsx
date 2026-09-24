"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePrefersReducedMotion } from "@/design/usePrefersReducedMotion";
import { useI18n } from "@/i18n/context";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { saraBeats } from "@/adapters/demo/sara";
import { TOUR_STEPS } from "@/adapters/demo/tourSteps";
import { toFriRoute } from "../_lib/friPaths";

// Kopia av components/spark/TourOverlay: samma stopp (TOUR_STEPS), samma
// spotlight-mätning och placering. Enda skillnaden i beteende är att
// stoppens rutter översätts till kopians (toFriRoute), så att rundturen
// stannar i /experiment/fri/demo.

const SPOTLIGHT_PADDING = 8;
const RECT_TOLERANCE = 0.5;

type SpotlightRect = { top: number; left: number; width: number; height: number };

function toSpotlightRect(domRect: DOMRect): SpotlightRect {
  return {
    top: domRect.top - SPOTLIGHT_PADDING,
    left: domRect.left - SPOTLIGHT_PADDING,
    width: domRect.width + SPOTLIGHT_PADDING * 2,
    height: domRect.height + SPOTLIGHT_PADDING * 2,
  };
}

function rectsAreClose(a: SpotlightRect, b: SpotlightRect): boolean {
  return (
    Math.abs(a.top - b.top) < RECT_TOLERANCE &&
    Math.abs(a.left - b.left) < RECT_TOLERANCE &&
    Math.abs(a.width - b.width) < RECT_TOLERANCE &&
    Math.abs(a.height - b.height) < RECT_TOLERANCE
  );
}

export function FriTour() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const reducedMotion = usePrefersReducedMotion();

  const tourOn = useDemoStore((state) => state.tourOn);
  const tourStepIndex = useDemoStore((state) => state.tourStepIndex);
  const { setTourStep, toggleTour, goTo } = useDemoStore.getState();

  const step = TOUR_STEPS[tourStepIndex];
  const route = toFriRoute(step.route);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);

  useEffect(() => {
    if (!tourOn) return;
    if (pathname !== route) router.push(route);
  }, [tourOn, route, pathname, router]);

  useEffect(() => {
    if (!tourOn || !step.beatId) return;
    const index = saraBeats.findIndex((beat) => beat.id === step.beatId);
    if (index >= 0) goTo(index);
  }, [tourOn, step.beatId, goTo]);

  useEffect(() => {
    if (!tourOn || !step.target) return;
    let frame: number;
    let scrolledIntoView = false;
    function tick() {
      const el = document.querySelector<HTMLElement>(`[data-tour-id="${step.target}"]`);
      if (el) {
        if (!scrolledIntoView) {
          el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
          scrolledIntoView = true;
        }
        const nextRect = toSpotlightRect(el.getBoundingClientRect());
        setSpotlight((prev) => (prev && rectsAreClose(prev, nextRect) ? prev : nextRect));
      } else {
        setSpotlight((prev) => (prev === null ? prev : null));
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [tourOn, step.target, route, tourStepIndex, reducedMotion]);

  const effectiveSpotlight = tourOn && step.target ? spotlight : null;
  if (!tourOn) return null;

  const isLastStep = tourStepIndex === TOUR_STEPS.length - 1;
  function goNext() {
    if (isLastStep) toggleTour();
    else setTourStep(tourStepIndex + 1);
  }

  const viewportWidth = typeof window === "undefined" ? 0 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 0 : window.innerHeight;
  const cardWidth = Math.min(380, viewportWidth - 32);
  const ESTIMATED_CARD_HEIGHT = 230;

  let cardStyle: CSSProperties;
  if (effectiveSpotlight) {
    const spaceBelow = viewportHeight - (effectiveSpotlight.top + effectiveSpotlight.height);
    const placeBelow = spaceBelow > 230 || spaceBelow > effectiveSpotlight.top;
    const cardLeft = Math.min(
      Math.max(16, effectiveSpotlight.left + effectiveSpotlight.width / 2 - cardWidth / 2),
      viewportWidth - cardWidth - 16,
    );
    const belowTop = Math.min(
      effectiveSpotlight.top + effectiveSpotlight.height + 16,
      viewportHeight - ESTIMATED_CARD_HEIGHT - 16,
    );
    const aboveTop = Math.max(16, effectiveSpotlight.top - 16 - ESTIMATED_CARD_HEIGHT);
    cardStyle = { top: placeBelow ? belowTop : aboveTop, left: cardLeft, width: cardWidth };
  } else {
    cardStyle = { top: "50%", left: "50%", width: cardWidth, transform: "translate(-50%, -50%)" };
  }

  return (
    <div className="fri-tour" role="dialog" aria-modal="true" aria-label={step.title[locale]}>
      {effectiveSpotlight ? (
        <div
          className="fri-tour-spot"
          style={{
            top: effectiveSpotlight.top,
            left: effectiveSpotlight.left,
            width: effectiveSpotlight.width,
            height: effectiveSpotlight.height,
            transitionProperty: reducedMotion ? "none" : "top, left, width, height",
          }}
        />
      ) : (
        <div className="fri-tour-scrim" />
      )}
      <div className="fri-tour-card" style={cardStyle}>
        <span className="fri-mono" style={{ color: "var(--signal-ink)" }}>
          {t.tour.stopLabel} {tourStepIndex + 1} {t.tour.ofLabel} {TOUR_STEPS.length}
        </span>
        <h2 className="fri-tour-title">{step.title[locale]}</h2>
        <p className="fri-muted" style={{ fontSize: "0.98rem", lineHeight: 1.5 }}>
          {step.body[locale]}
        </p>
        <div className="fri-tour-actions">
          <button type="button" className="fri-link" onClick={toggleTour}>
            {t.tour.skipCta}
          </button>
          <button type="button" className="fri-btn fri-btn-ink fri-small-btn" onClick={goNext}>
            {isLastStep ? t.tour.finishCta : t.tour.nextCta}
          </button>
        </div>
      </div>
    </div>
  );
}
