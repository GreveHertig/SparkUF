"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePrefersReducedMotion } from "@/design/usePrefersReducedMotion";
import { useI18n } from "@/i18n/context";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { saraBeats } from "@/adapters/demo/sara";
import { TOUR_STEPS } from "@/adapters/demo/tourSteps";
import { toFondaPath } from "../_lib/paths";
import {
  CARD_IN_EASE,
  CARD_OUT_EASE,
  HOLE_EASE,
  REDUCED_TOUR_TIMINGS,
  TOUR_TIMINGS,
  centerPoint,
  lerp,
  lerpRect,
  needsScroll,
  padRect,
  placeCard,
  roundRect,
  scrimClipPath,
  scrollTargetFor,
  type Rect,
} from "../_lib/tourMotion";

const SPOTLIGHT_PADDING = 8;
const SPOTLIGHT_RADIUS = 16;
/** Hittas inte målet (sidan laddar fortfarande) krymper rutan efter så här länge. */
const MISSING_TARGET_MS = 1500;

type CardPhase = "out" | "waiting" | "in" | "shown";

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * Rundturen i kopian: samma 20 stopp som det riktiga demot
 * (adapters/demo/tourSteps.ts, orörd), med rutterna översatta till kopians.
 * Kopians sidor bär samma `data-tour-id` som originalets skärmar, så
 * spotlighten hittar samma innehåll.
 */
export function FondaTour() {
  const router = useRouter();
  const pathname = usePathname();
  const tourOn = useDemoStore((state) => state.tourOn);
  const tourStepIndex = useDemoStore((state) => state.tourStepIndex);
  const setTourStep = useDemoStore((state) => state.setTourStep);
  const toggleTour = useDemoStore((state) => state.toggleTour);
  const goTo = useDemoStore((state) => state.goTo);

  const step = TOUR_STEPS[tourStepIndex];
  const route = toFondaPath(step.route);

  const reducedMotion = usePrefersReducedMotion();

  // Sidan byts först när gamla kortet hunnit tona ut, så att nytt innehåll
  // aldrig syns bakom ett kort som hör till förra stoppet.
  useEffect(() => {
    if (!tourOn || pathname === route) return;
    const delay = (reducedMotion ? REDUCED_TOUR_TIMINGS : TOUR_TIMINGS).cardOutMs;
    const timeout = window.setTimeout(() => router.push(route), delay);
    return () => window.clearTimeout(timeout);
  }, [tourOn, route, pathname, router, reducedMotion]);

  useEffect(() => {
    if (!tourOn || !step.beatId) return;
    const index = saraBeats.findIndex((beat) => beat.id === step.beatId);
    if (index >= 0) goTo(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourOn, step.beatId]);

  if (!tourOn) return null;

  const isLastStep = tourStepIndex === TOUR_STEPS.length - 1;
  return (
    <TourStage
      stepIndex={tourStepIndex}
      onNext={() => (isLastStep ? toggleTour() : setTourStep(tourStepIndex + 1))}
      onBack={() => setTourStep(Math.max(0, tourStepIndex - 1))}
      onSkip={toggleTour}
    />
  );
}

/**
 * Mörkläggningen och kortet. Båda är ett och samma element hela rundturen:
 * en rAF-loop flyttar hålet och kortet med transform, opacity och
 * clip-path, och byter kortets text först när kortet är osynligt. Se
 * _lib/tourMotion.ts för tider och kurvor.
 */
function TourStage({
  stepIndex,
  onNext,
  onBack,
  onSkip,
}: {
  stepIndex: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  const { locale, t } = useI18n();
  const reducedMotion = usePrefersReducedMotion();
  const [shownIndex, setShownIndex] = useState(stepIndex);
  const scrimRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const stepIndexRef = useRef(stepIndex);
  const renderedIndexRef = useRef(shownIndex);
  const reducedMotionRef = useRef(reducedMotion);

  useLayoutEffect(() => {
    stepIndexRef.current = stepIndex;
    reducedMotionRef.current = reducedMotion;
  }, [stepIndex, reducedMotion]);

  // Kortets text är utbytt i DOM:en först här; då kan loopen mäta den nya höjden.
  useLayoutEffect(() => {
    renderedIndexRef.current = shownIndex;
  }, [shownIndex]);

  useEffect(() => {
    const scrimEl = scrimRef.current;
    const cardEl = cardRef.current;
    if (!scrimEl || !cardEl) return;
    const scrim: HTMLDivElement = scrimEl;
    const card: HTMLDivElement = cardEl;

    let active = stepIndexRef.current;
    let direction = 1;
    let changedAt = performance.now();
    // Skrollen körs av rutans svep: samma start, kurva och längd.
    let scrollPlanned = false;
    let scrollPlan: { from: number; to: number } | null = null;

    // Hålet som visas nu (null tills första målet hittats: hel mörkläggning).
    let hole: Rect | null = null;
    let holeFrom: Rect | null = null;
    let holeStart: number | null = null;

    let cardPhase: CardPhase = "waiting";
    let phaseStart = 0;
    let phaseFromOpacity = 0;
    let phaseFromShift = 0;
    let cardOpacity = 0;
    let cardShift = 0;
    let cardPos: { top: number; left: number } | null = null;
    let requestedIndex = active;

    let lastClip = "";
    let lastTransform = "";
    let lastOpacity = "";

    function findTarget(now: number, viewportWidth: number, viewportHeight: number): Rect | null {
      const targetId = TOUR_STEPS[active].target;
      if (!targetId) return centerPoint(viewportWidth, viewportHeight);
      const el = document.querySelector<HTMLElement>(`[data-tour-id="${targetId}"]`);
      if (!el) {
        return now - changedAt > MISSING_TARGET_MS ? centerPoint(viewportWidth, viewportHeight) : null;
      }
      const rect = padRect(el.getBoundingClientRect(), SPOTLIGHT_PADDING);
      const scrollY = window.scrollY;
      if (!scrollPlanned) {
        scrollPlanned = true;
        if (needsScroll(rect, viewportHeight)) {
          const maxScroll = document.documentElement.scrollHeight - viewportHeight;
          const to = scrollTargetFor(rect, scrollY, viewportHeight, maxScroll);
          if (to !== scrollY) scrollPlan = { from: scrollY, to };
        }
      }
      // Under skrollen siktar rutan och kortet på där målet hamnar när den är klar.
      return scrollPlan ? { ...rect, top: rect.top + scrollY - scrollPlan.to } : rect;
    }

    function tick(now: number) {
      const timings = reducedMotionRef.current ? REDUCED_TOUR_TIMINGS : TOUR_TIMINGS;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const latest = stepIndexRef.current;
      if (latest !== active) {
        direction = latest > active ? 1 : -1;
        active = latest;
        // Mitt i ett svep byter rutan kurs direkt i stället för att stanna.
        const sweeping = holeStart !== null && now - holeStart < timings.holeMs;
        changedAt = now;
        holeFrom = hole;
        holeStart = sweeping ? now : null;
        scrollPlanned = false;
        scrollPlan = null;
        if (cardPhase === "in" || cardPhase === "shown") {
          cardPhase = "out";
          phaseStart = now;
          phaseFromOpacity = cardOpacity;
          phaseFromShift = cardShift;
        }
      }

      const target = findTarget(now, viewportWidth, viewportHeight);

      let holeProgress = 0;
      if (target) {
        if (hole === null) {
          // Första stoppet: rutan står redan på plats.
          hole = target;
          holeFrom = target;
          holeStart = now - timings.holeMs;
          holeProgress = 1;
          if (scrollPlan) {
            window.scrollTo({ top: scrollPlan.to, behavior: "instant" });
            scrollPlan = null;
          }
        } else {
          if (holeStart === null && now - changedAt >= timings.holeDelayMs) holeStart = now;
          if (holeStart !== null) {
            const progress = timings.holeMs <= 0 ? 1 : clamp01((now - holeStart) / timings.holeMs);
            // Målet mäts varje bildruta, så rutan följer med när sidan skrollar.
            holeProgress = progress >= 1 ? 1 : HOLE_EASE(progress);
            hole = progress >= 1 || !holeFrom ? target : lerpRect(holeFrom, target, holeProgress);
            if (scrollPlan) {
              const { from, to } = scrollPlan;
              window.scrollTo({ top: Math.round(lerp(from, to, holeProgress)), behavior: "instant" });
              if (progress >= 1) scrollPlan = null;
            }
          }
        }
      }

      if (cardPhase === "out") {
        const duration = timings.cardOutMs * phaseFromOpacity;
        const amount = duration <= 0 ? 1 : CARD_OUT_EASE(clamp01((now - phaseStart) / duration));
        cardOpacity = lerp(phaseFromOpacity, 0, amount);
        cardShift = lerp(phaseFromShift, -direction * timings.cardOutShift, amount);
        if (amount >= 1) cardPhase = "waiting";
      }
      if (cardPhase === "waiting") {
        if (requestedIndex !== active) {
          requestedIndex = active;
          setShownIndex(active);
        }
        if (renderedIndexRef.current === active && target && holeProgress >= timings.cardInAtProgress) {
          cardPhase = "in";
          phaseStart = now;
        }
      }
      if (cardPhase === "in") {
        const amount = CARD_IN_EASE(clamp01((now - phaseStart) / timings.cardInMs));
        cardOpacity = amount;
        cardShift = lerp(direction * timings.cardInShift, 0, amount);
        if (amount >= 1) cardPhase = "shown";
      }
      if ((cardPhase === "in" || cardPhase === "shown") && target) {
        cardPos = placeCard(
          roundRect(target),
          { width: card.offsetWidth, height: card.offsetHeight },
          { width: viewportWidth, height: viewportHeight },
        );
      }

      const clip = scrimClipPath(hole ? roundRect(hole) : centerPoint(viewportWidth, viewportHeight), SPOTLIGHT_RADIUS);
      if (clip !== lastClip) {
        scrim.style.clipPath = clip;
        lastClip = clip;
      }
      if (cardPos) {
        const transform = `translate3d(${Math.round(cardPos.left)}px, ${(Math.round(cardPos.top) + cardShift).toFixed(2)}px, 0)`;
        if (transform !== lastTransform) {
          card.style.transform = transform;
          lastTransform = transform;
        }
      }
      const opacity = cardOpacity.toFixed(3);
      if (opacity !== lastOpacity) {
        card.style.opacity = opacity;
        card.style.visibility = cardOpacity > 0 ? "visible" : "hidden";
        lastOpacity = opacity;
      }

      frame = requestAnimationFrame(tick);
    }

    let frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const shownStep = TOUR_STEPS[shownIndex];
  const shownIsLast = shownIndex === TOUR_STEPS.length - 1;

  return (
    <div className="fdd-tour" role="dialog" aria-modal="true" aria-label={shownStep.title[locale]}>
      <div ref={scrimRef} className="fdd-tour__scrim" />
      <div ref={cardRef} className="fdd-tour__card">
        <p className="fdd-tour__count">
          {t.tour.stopLabel} {shownIndex + 1} {t.tour.ofLabel} {TOUR_STEPS.length}
        </p>
        <h2 className="fdd-tour__title">{shownStep.title[locale]}</h2>
        <p className="fdd-tour__body">{shownStep.body[locale]}</p>
        <div className="fdd-tour__actions">
          <button type="button" onClick={onSkip} className="fdd-tour__skip">
            {t.tour.skipCta}
          </button>
          <div className="fdd-tour__nav">
            {shownIndex > 0 && (
              <button type="button" onClick={onBack} className="fd-btn fd-btn--secondary fd-btn--sm">
                {t.demoBar.back}
              </button>
            )}
            <button type="button" onClick={onNext} className="fd-btn fd-btn--primary fd-btn--sm">
              {shownIsLast ? t.tour.finishCta : t.tour.nextCta}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
