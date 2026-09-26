"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePrefersReducedMotion } from "@/design/usePrefersReducedMotion";
import { useI18n } from "@/i18n/context";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { saraBeats } from "@/adapters/demo/sara";
import { TOUR_STEPS } from "@/adapters/demo/tourSteps";
import { toFondaPath } from "../_lib/paths";

const SPOTLIGHT_PADDING = 8;
const SPOTLIGHT_RADIUS = 16;
const RECT_TOLERANCE = 0.5;
const ESTIMATED_CARD_HEIGHT = 230;

type SpotlightRect = { top: number; left: number; width: number; height: number };

// Hela pixlar: bråkdelar ger kantutjämnade halvpixelkanter runt hålet.
function toSpotlightRect(domRect: DOMRect): SpotlightRect {
  const left = Math.round(domRect.left - SPOTLIGHT_PADDING);
  const top = Math.round(domRect.top - SPOTLIGHT_PADDING);
  return {
    top,
    left,
    width: Math.round(domRect.right + SPOTLIGHT_PADDING) - left,
    height: Math.round(domRect.bottom + SPOTLIGHT_PADDING) - top,
  };
}

/**
 * Mörkläggningen är ett enda lager: hela skärmen minus ett rundat hål,
 * klippt med `evenodd`. Inga rutor som möts, alltså inga skarvar.
 */
function scrimClipPath(rect: SpotlightRect | null): string | undefined {
  if (!rect || rect.width < 1 || rect.height < 1) return undefined;
  const { top, left, width, height } = rect;
  const r = Math.min(SPOTLIGHT_RADIUS, width / 2, height / 2);
  const right = left + width;
  const bottom = top + height;
  const hole =
    `M${left + r} ${top}H${right - r}A${r} ${r} 0 0 1 ${right} ${top + r}` +
    `V${bottom - r}A${r} ${r} 0 0 1 ${right - r} ${bottom}` +
    `H${left + r}A${r} ${r} 0 0 1 ${left} ${bottom - r}` +
    `V${top + r}A${r} ${r} 0 0 1 ${left + r} ${top}Z`;
  return `path(evenodd, "M-10 -10H100000V100000H-10Z${hole}")`;
}

function rectsAreClose(a: SpotlightRect, b: SpotlightRect): boolean {
  return (
    Math.abs(a.top - b.top) < RECT_TOLERANCE &&
    Math.abs(a.left - b.left) < RECT_TOLERANCE &&
    Math.abs(a.width - b.width) < RECT_TOLERANCE &&
    Math.abs(a.height - b.height) < RECT_TOLERANCE
  );
}

/**
 * Rundturen i kopian: samma 20 stopp som det riktiga demot
 * (adapters/demo/tourSteps.ts, orörd), med rutterna översatta till kopians.
 * Kopians sidor bär samma `data-tour-id` som originalets skärmar, så
 * spotlighten hittar samma innehåll. Beteendet följer
 * components/spark/TourOverlay.tsx.
 */
export function FondaTour() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const reducedMotion = usePrefersReducedMotion();
  const tourOn = useDemoStore((state) => state.tourOn);
  const tourStepIndex = useDemoStore((state) => state.tourStepIndex);
  const setTourStep = useDemoStore((state) => state.setTourStep);
  const toggleTour = useDemoStore((state) => state.toggleTour);
  const goTo = useDemoStore((state) => state.goTo);

  const step = TOUR_STEPS[tourStepIndex];
  const route = toFondaPath(step.route);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);

  useEffect(() => {
    if (!tourOn) return;
    if (pathname !== route) router.push(route);
  }, [tourOn, route, pathname, router]);

  useEffect(() => {
    if (!tourOn || !step.beatId) return;
    const index = saraBeats.findIndex((beat) => beat.id === step.beatId);
    if (index >= 0) goTo(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourOn, step.beatId]);

  // Mäter målet varje bildruta medan stoppet är aktivt, så att spotlighten
  // följer med när datan laddats klart och innehållet flyttat sig.
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
        const next = toSpotlightRect(el.getBoundingClientRect());
        setSpotlight((prev) => (prev && rectsAreClose(prev, next) ? prev : next));
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

  let cardStyle: CSSProperties;
  if (effectiveSpotlight) {
    const spaceBelow = viewportHeight - (effectiveSpotlight.top + effectiveSpotlight.height);
    const placeBelow = spaceBelow > ESTIMATED_CARD_HEIGHT || spaceBelow > effectiveSpotlight.top;
    const left = Math.min(
      Math.max(16, effectiveSpotlight.left + effectiveSpotlight.width / 2 - cardWidth / 2),
      viewportWidth - cardWidth - 16,
    );
    const below = Math.min(
      effectiveSpotlight.top + effectiveSpotlight.height + 16,
      viewportHeight - ESTIMATED_CARD_HEIGHT - 16,
    );
    const above = Math.max(16, effectiveSpotlight.top - 16 - ESTIMATED_CARD_HEIGHT);
    cardStyle = { top: placeBelow ? below : above, left, width: cardWidth };
  } else {
    cardStyle = { top: "50%", left: "50%", width: cardWidth, transform: "translate(-50%, -50%)" };
  }

  return (
    <div className="fdd-tour" role="dialog" aria-modal="true" aria-label={step.title[locale]}>
      <div className="fdd-tour__scrim" style={{ clipPath: scrimClipPath(effectiveSpotlight) }} />
      <div className="fdd-tour__card" style={cardStyle}>
        <p className="fdd-tour__count">
          {t.tour.stopLabel} {tourStepIndex + 1} {t.tour.ofLabel} {TOUR_STEPS.length}
        </p>
        <h2 className="fdd-tour__title">{step.title[locale]}</h2>
        <p className="fdd-tour__body">{step.body[locale]}</p>
        <div className="fdd-tour__actions">
          <button type="button" onClick={toggleTour} className="fdd-tour__skip">
            {t.tour.skipCta}
          </button>
          <button type="button" onClick={goNext} className="fd-btn fd-btn--primary fd-btn--sm">
            {isLastStep ? t.tour.finishCta : t.tour.nextCta}
          </button>
        </div>
      </div>
    </div>
  );
}
