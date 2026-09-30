"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePrefersReducedMotion } from "@/design/usePrefersReducedMotion";
import { useI18n } from "@/i18n/context";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { saraBeats } from "@/adapters/demo/sara";
import { TOUR_STEPS } from "@/adapters/demo/tourSteps";
import { toFondaPath } from "../_lib/paths";
import { fondaTourCopy } from "../_lib/tourCopy";
import { cutBetweenUnits, frameStop, layoutStop, type SafeArea, type TourUnit } from "../_lib/tourGeometry";
import {
  CARD_IN_EASE,
  CARD_OUT_EASE,
  HOLE_EASE,
  REDUCED_TOUR_TIMINGS,
  TOUR_TIMINGS,
  centerPoint,
  lerp,
  lerpRect,
  padRect,
  roundRect,
  scrimClipPath,
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

/** Ytan mellan det klistrade sidhuvudet och den fixerade demoraden. */
function safeArea(viewportHeight: number): SafeArea {
  const header = document.querySelector(".fdd-top");
  const bar = document.querySelector(".fdd-bar");
  const top = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
  const bottom = bar ? Math.min(viewportHeight, bar.getBoundingClientRect().top) : viewportHeight;
  return { top, bottom: bottom > top + 200 ? bottom : viewportHeight };
}

/**
 * Målets delar, räknade från målets överkant: textblock (som aldrig kapas) och
 * kort eller paneler med bakgrund eller ram. Listor räknas inte som kort, så
 * att en lång lista kan kapas mellan två rader.
 */
function tourUnits(root: HTMLElement): TourUnit[] {
  const origin = root.getBoundingClientRect().top;
  const units: TourUnit[] = [];
  const isInline = (el: Element) => getComputedStyle(el).display.startsWith("inline");
  const walk = (parent: Element) => {
    for (const el of parent.children) {
      const rect = el.getBoundingClientRect();
      if (rect.height < 1) continue;
      const top = rect.top - origin;
      const bottom = rect.bottom - origin;
      const heading = /^H[1-6]$/.test(el.tagName);
      if ([...el.children].every(isInline)) {
        units.push({ top, bottom, box: false, heading });
        continue;
      }
      const style = getComputedStyle(el);
      const painted =
        !/^(UL|OL|DL)$/.test(el.tagName) &&
        ((style.backgroundColor !== "transparent" && style.backgroundColor !== "rgba(0, 0, 0, 0)") ||
          parseFloat(style.borderTopWidth) > 0 ||
          parseFloat(style.borderBottomWidth) > 0);
      if (painted) units.push({ top, bottom, box: true, heading: false });
      walk(el);
    }
  };
  walk(root);
  return units;
}

/**
 * Rundturen: samma 20 stopp som det riktiga demot
 * (adapters/demo/tourSteps.ts, orörd), med rutterna översatta till demots.
 * Demots sidor bär samma `data-tour-id` som tourSteps.ts pekar på, så
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
 * _lib/tourMotion.ts för tider och kurvor. Var hålet och kortet hamnar
 * räknas av layoutStop/frameStop (_lib/tourGeometry.ts): inom ytan mellan
 * sidhuvudet och demoraden, och kortet täcker aldrig hålet.
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
    // Ett mål som inte ryms bredvid kortet kapas mellan två hela delar
    // (rader, kort, stycken). Höjden räknas ut en gång per stopp.
    let trimHeight: number | null = null;

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

    // Kortets höjd per text och bredd. Mäts bara när något av dem är nytt.
    const heights = new Map<string, number>();
    function measure(width: number): number {
      const key = `${renderedIndexRef.current}:${width}:${card.textContent?.length ?? 0}`;
      const cached = heights.get(key);
      if (cached !== undefined) return cached;
      const previous = card.style.width;
      card.style.width = `${width}px`;
      const height = card.offsetHeight;
      card.style.width = previous;
      heights.set(key, height);
      return height;
    }
    const clearHeights = () => heights.clear();
    window.addEventListener("resize", clearHeights);

    /**
     * Stoppets mål i viewportens koordinater. `undefined`: målet finns inte
     * än (sidan laddar). `null`: stoppet har inget mål (kortet i mitten).
     */
    function findTarget(
      now: number,
      viewport: { width: number; height: number },
      safe: SafeArea,
    ): Rect | null | undefined {
      // Ska stoppet byta sida väntar rutan på den nya sidan. Annars hittas
      // samma mål på den gamla, skrollen börjar och sidbytet rycker den till toppen.
      if (window.location.pathname !== toFondaPath(TOUR_STEPS[active].route)) return undefined;
      const targetId = TOUR_STEPS[active].target;
      if (!targetId) return null;
      const el = document.querySelector<HTMLElement>(`[data-tour-id="${targetId}"]`);
      if (!el) return now - changedAt > MISSING_TARGET_MS ? null : undefined;
      // Skrollen planeras efter kortets höjd, så rutan väntar tills kortet bär
      // det nya stoppets text. Annars mäts förra stoppets kort, och ett mål som
      // precis ryms bredvid kortet hamnar under det.
      if (!scrollPlanned && renderedIndexRef.current !== active) return undefined;
      let rect = padRect(el.getBoundingClientRect(), SPOTLIGHT_PADDING);
      const scrollY = window.scrollY;
      if (!scrollPlanned) {
        scrollPlanned = true;
        trimHeight = null;
        const scroll = { y: scrollY, max: Math.max(0, document.documentElement.scrollHeight - viewport.height) };
        let plan = frameStop(rect, measure, viewport, safe, scroll);
        // Ryms inte hela målet bredvid kortet kortas rutan till de hela delar
        // som ryms, i stället för att kapas mitt i en rad eller täckas av kortet.
        for (let attempt = 0; attempt < 4; attempt++) {
          const height = trimHeight ?? rect.height;
          const shown = plan.layout.hole?.height ?? 0;
          // Saknas bara luften runt målet räknas det som att det ryms.
          if (shown >= height - SPOTLIGHT_PADDING * 2) break;
          const limit = shown - SPOTLIGHT_PADDING * 2;
          const cut = cutBetweenUnits(tourUnits(el), limit);
          // En skarv långt ovanför ytan (t.ex. direkt under rubriken) ger en
          // ruta som visar för lite. Då hellre målet avskuret vid kortet.
          if (cut === null || cut < limit / 2) break;
          trimHeight = cut + SPOTLIGHT_PADDING * 2;
          plan = frameStop({ ...rect, height: trimHeight }, measure, viewport, safe, scroll);
        }
        if (plan.scrollTo !== scrollY) scrollPlan = { from: scrollY, to: plan.scrollTo };
      }
      if (trimHeight !== null) rect = { ...rect, height: Math.min(rect.height, trimHeight) };
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

      const viewport = { width: viewportWidth, height: viewportHeight };
      const safe = safeArea(viewportHeight);
      const found = findTarget(now, viewport, safe);
      let layout = found === undefined ? null : layoutStop(found, measure, viewport, safe);
      // Ett mål som inte går att skrolla fram över demoraden (sist på sidan)
      // skulle klippas bort helt. Då får rutan hela skärmen i stället.
      if (layout?.hole && found && layout.hole.height < 8) {
        layout = layoutStop(found, measure, viewport, { top: 0, bottom: viewportHeight });
      }
      // Stopp utan mål krymper hålet till en punkt mitt på skärmen.
      const target = layout ? (layout.hole ?? centerPoint(viewportWidth, viewportHeight)) : null;

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
      if ((cardPhase === "in" || cardPhase === "shown") && layout) {
        cardPos = { left: layout.card.x, top: layout.card.y };
        const width = `${layout.card.width}px`;
        if (card.style.width !== width) card.style.width = width;
      }

      // Där målet fortsätter förbi hålet (under sidhuvudet, demoraden eller
      // kortet) når hålet ända fram med raka hörn, så att det ser ut att
      // fortsätta. Radien växer mjukt med avståndet till kanten, så att svepet
      // inte hackar. Kapas bara luften runt målet är hörnen rundade.
      const shown = hole ? roundRect(hole) : centerPoint(viewportWidth, viewportHeight);
      const area = layout?.area ?? safe;
      const final = layout?.hole;
      const cutTop = !!(final && found && final.top > found.top + SPOTLIGHT_PADDING);
      const cutBottom = !!(final && found && final.top + final.height < found.top + found.height - SPOTLIGHT_PADDING);
      const radius = {
        top: cutTop ? Math.min(SPOTLIGHT_RADIUS, Math.max(0, shown.top - area.top)) : SPOTLIGHT_RADIUS,
        bottom: cutBottom
          ? Math.min(SPOTLIGHT_RADIUS, Math.max(0, area.bottom - (shown.top + shown.height)))
          : SPOTLIGHT_RADIUS,
      };
      const clip = scrimClipPath(shown, radius);
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
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", clearHeights);
    };
  }, []);

  const shownCopy = fondaTourCopy(TOUR_STEPS[shownIndex], locale);
  const shownIsLast = shownIndex === TOUR_STEPS.length - 1;

  return (
    <div className="fdd-tour" role="dialog" aria-modal="true" aria-label={shownCopy.title}>
      <div ref={scrimRef} className="fdd-tour__scrim" />
      <div ref={cardRef} className="fdd-tour__card">
        <p className="fdd-tour__count">
          {t.tour.stopLabel} {shownIndex + 1} {t.tour.ofLabel} {TOUR_STEPS.length}
        </p>
        <h2 className="fdd-tour__title">{shownCopy.title}</h2>
        <p className="fdd-tour__body">{shownCopy.body}</p>
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
