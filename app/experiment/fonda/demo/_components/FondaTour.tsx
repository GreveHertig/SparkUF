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
  flipTransform,
  frameStop,
  glideDuration,
  layoutStop,
  padRect,
  rectsAreClose,
  toDocument,
  type SafeArea,
  type StopLayout,
  type TourRect,
} from "../_lib/tourGeometry";

/** Hålet stängs (tonar igen) innan sidan byts. Samma som i fonda.css. */
const CLOSE_HOLE_MS = 300;
/** Kortets uttoning. Samma som i fonda.css. */
const CARD_FADE_OUT_MS = 180;
/** Kortet tonar in när spotlighten är drygt halvvägs framme. */
const CARD_REVEAL_AT = 0.55;
/** Små rättelser efter landningen (t.ex. när datan laddats klart). */
const CORRECTION_MS = 280;
/** Skrollar sidan mer än så här stor del av skärmen tonar hålet om i stället för att glida. */
const LONG_SCROLL_SHARE = 0.35;
const PING_MS = 900;
const PING_SPREAD = 10;
const CLOSE_TOUR_MS = 240;
const FIND_TIMEOUT_MS = 2500;
/** Hur länge en ny sida ska stå still innan hålet öppnas (ca 100 ms). */
const LAYOUT_STABLE_FRAMES = 6;
const LAYOUT_MAX_MS = 1000;
/** easeInOutCubic för förflyttning, stark ease-out för in/ut (som --fd-ease). */
const EASE_MOVE = "cubic-bezier(0.65, 0, 0.35, 1)";
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

type StageElements = {
  spot: HTMLDivElement;
  ping: HTMLDivElement;
  card: HTMLDivElement;
};

function viewport() {
  return { width: window.innerWidth, height: window.innerHeight };
}

function scroll() {
  return { x: window.scrollX, y: window.scrollY };
}

/** Målets ruta med luft runt om, i viewportens koordinater. */
function viewportRect(el: Element): TourRect {
  const { top, left, width, height } = el.getBoundingClientRect();
  return padRect({ top, left, width, height });
}

/** Ytan mellan det klistrade sidhuvudet och den fixerade demoraden. */
function safeArea(): SafeArea {
  const vp = viewport();
  const header = document.querySelector(".fdd-top");
  const bar = document.querySelector(".fdd-bar");
  const top = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
  const bottom = bar ? Math.min(vp.height, bar.getBoundingClientRect().top) : vp.height;
  return { top, bottom: bottom > top + 200 ? bottom : vp.height };
}

/** easeInOutCubic, samma kurva som EASE_MOVE, för skrollen. */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function center(rect: TourRect) {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/** Läser layouten så att webbläsaren tar in värdet innan nästa ändring animeras. */
function flush(el: HTMLElement) {
  void el.offsetWidth;
}

/**
 * Rundturen i kopian: samma 20 stopp som det riktiga demot
 * (adapters/demo/tourSteps.ts, orörd), med rutterna översatta till kopians.
 * Kopians sidor bär samma `data-tour-id` som originalets skärmar, så
 * spotlighten hittar samma innehåll.
 */
export function FondaTour() {
  const tourOn = useDemoStore((state) => state.tourOn);
  return tourOn ? <TourStage /> : null;
}

/**
 * Scenen medan rundturen är på.
 *
 * Spotlighten och kortet ligger i sidans koordinater, så de följer med sidans
 * egen skroll. Hålets rörelse är `transform` och `opacity` (compositorn):
 * glidet mellan två mål är en FLIP-animation och hålet tonar igen och upp i
 * stället för att krympa, så det hackar inte även om huvudtråden är upptagen.
 * Skrollar sidan under glidet gör den det med samma kurva och längd.
 *
 * Nästa stopp: kortet tonar ut (och hålet tonar igen om sidan byts). Först
 * när det är klart byts stoppet, så att det tunga arbetet sker medan inget
 * rör sig. Sedan glider hålet till målet medan sidan skrollar dit, och kortet
 * tonar in bredvid målet när hålet är nästan framme.
 */
function TourStage() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const reducedMotion = usePrefersReducedMotion();
  const tourStepIndex = useDemoStore((state) => state.tourStepIndex);
  const setTourStep = useDemoStore((state) => state.setTourStep);
  const toggleTour = useDemoStore((state) => state.toggleTour);
  const goTo = useDemoStore((state) => state.goTo);

  const step = TOUR_STEPS[tourStepIndex];
  const route = toFondaPath(step.route);
  const [closing, setClosing] = useState(false);

  const spotRef = useRef<HTMLDivElement>(null);
  const pingRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  /** Hålets plats i sidans koordinater, och om det är öppet. */
  const holeRef = useRef<TourRect | null>(null);
  const openRef = useRef(false);
  /**
   * Ut-rörelsen inför nästa stopp, satt av scenen nedan. Returnerar hur många
   * ms den tar. Stoppet byts först när den är klar.
   */
  const leaveRef = useRef<((nextIndex: number) => number) | null>(null);
  const advancingRef = useRef(false);

  useEffect(() => {
    if (pathname !== route) router.push(route);
  }, [route, pathname, router]);

  useEffect(() => {
    if (!step.beatId) return;
    const index = saraBeats.findIndex((beat) => beat.id === step.beatId);
    if (index >= 0) goTo(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.beatId]);

  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(toggleTour, CLOSE_TOUR_MS);
    return () => window.clearTimeout(timer);
  }, [closing, toggleTour]);

  useLayoutEffect(() => {
    const spot = spotRef.current;
    const ping = pingRef.current;
    const card = cardRef.current;
    if (!spot || !ping || !card) return;
    const els: StageElements = { spot, ping, card };

    let cancelled = false;
    let frame = 0;
    let scrollFrame = 0;
    const timers: number[] = [];
    const cleanups: Array<() => void> = [];
    const later = (fn: () => void, ms: number) =>
      timers.push(
        window.setTimeout(() => {
          if (!cancelled) fn();
        }, ms),
      );

    function cardSize() {
      return { width: els.card.offsetWidth, height: els.card.offsetHeight };
    }

    function setSpotGeometry(rect: TourRect) {
      const style = els.spot.style;
      style.top = `${rect.top}px`;
      style.left = `${rect.left}px`;
      style.width = `${rect.width}px`;
      style.height = `${rect.height}px`;
    }

    /** Där spotlighten syns just nu, även mitt i ett glid. */
    function visibleSpot(): TourRect | null {
      if (!holeRef.current) return null;
      const { top, left, width, height } = els.spot.getBoundingClientRect();
      return toDocument({ top, left, width, height }, scroll());
    }

    /** Hålet i sidans koordinater (följer sidans skroll). */
    function anchorToDocument(rect: TourRect) {
      els.spot.dataset.fixed = "false";
      setSpotGeometry(rect);
    }

    /**
     * Glider hålet till `to` (sidans koordinater) med FLIP. Skrollar sidan
     * samtidigt till `scrollTo` ligger hålet i skärmens koordinater under
     * glidet, så att det rör sig rakt från den gamla platsen till den nya
     * medan sidan skrollar med samma kurva och längd. Framme förankras det i
     * sidan igen. Ett pågående glid avbryts där det är.
     */
    function glideTo(to: TourRect, duration: number, scrollTo = window.scrollY) {
      const from = visibleSpot();
      els.spot.getAnimations().forEach((animation) => animation.cancel());
      holeRef.current = to;
      const moving = from && !reducedMotion && duration > 0 && !rectsAreClose(from, to, 0.5);
      const scrolling = Math.abs(scrollTo - window.scrollY) > 1;
      if (!moving) {
        anchorToDocument(to);
        scrollWindowTo(scrollTo, duration);
        return;
      }
      const toScreen = { ...to, top: to.top - scrollTo, left: to.left - window.scrollX };
      const fromScreen = { ...from, top: from.top - window.scrollY, left: from.left - window.scrollX };
      if (scrolling) {
        els.spot.dataset.fixed = "true";
        setSpotGeometry(toScreen);
      } else {
        anchorToDocument(to);
      }
      const animation = els.spot.animate(
        [{ transform: flipTransform(scrolling ? fromScreen : from, scrolling ? toScreen : to) }, { transform: "none" }],
        { duration, easing: EASE_MOVE },
      );
      if (!scrolling) return;
      const scrolled = scrollWindowTo(scrollTo, duration);
      Promise.all([animation.finished, scrolled])
        .then(() => {
          if (!cancelled && holeRef.current === to) anchorToDocument(to);
        })
        .catch(() => {});
    }

    /** Skrollar fönstret med samma kurva och längd som hålet glider. */
    function scrollWindowTo(y: number, duration: number): Promise<void> {
      cancelAnimationFrame(scrollFrame);
      const from = window.scrollY;
      if (Math.abs(y - from) < 1) return Promise.resolve();
      if (reducedMotion || duration === 0) {
        window.scrollTo(0, y);
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        const startedAt = performance.now();
        const tick = (now: number) => {
          if (cancelled) return resolve();
          const progress = Math.min(1, (now - startedAt) / duration);
          window.scrollTo(0, from + (y - from) * easeInOutCubic(progress));
          if (progress < 1) scrollFrame = requestAnimationFrame(tick);
          else resolve();
        };
        scrollFrame = requestAnimationFrame(tick);
      });
    }

    /** Hålet tonar upp på `to`. Är det stängt flyttas det dit först, osynligt. */
    function openAt(to: TourRect) {
      els.spot.getAnimations().forEach((animation) => animation.cancel());
      anchorToDocument(to);
      holeRef.current = to;
      flush(els.spot);
      els.spot.dataset.open = "true";
      openRef.current = true;
      if (!reducedMotion) {
        // Ett litet andetag när hålet öppnas: från 2 % större till exakt storlek.
        els.spot.animate([{ transform: "scale(1.02)" }, { transform: "none" }], {
          duration: 420,
          easing: EASE_OUT,
        });
      }
    }

    function closeHole() {
      els.spot.dataset.open = "false";
      openRef.current = false;
    }

    /** Kortet på en plats i viewporten, omräknad till sidans koordinater vid skrollen `scrollY`. */
    function placeCard(layout: StopLayout, glide: boolean, scrollY = window.scrollY) {
      els.card.dataset.motion = glide && !reducedMotion ? "glide" : "instant";
      els.card.dataset.placement = layout.placement;
      els.card.style.transform = `translate3d(${layout.card.x + window.scrollX}px, ${layout.card.y + scrollY}px, 0)`;
    }

    function revealCard() {
      flush(els.card);
      els.card.dataset.visible = "true";
    }

    function hideCard() {
      els.card.dataset.visible = "false";
    }

    function pingAt(hole: TourRect) {
      if (reducedMotion || typeof els.ping.animate !== "function") return;
      const scaleX = 1 + (PING_SPREAD * 2) / Math.max(1, hole.width);
      const scaleY = 1 + (PING_SPREAD * 2) / Math.max(1, hole.height);
      els.ping.animate(
        [
          { transform: "none", opacity: 0.6 },
          { transform: `scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)})`, opacity: 0 },
        ],
        { duration: PING_MS, easing: EASE_OUT },
      );
    }

    /** Följer målet om innehållet flyttar sig eller fönstret ändrar storlek. Skroll sköter sig själv. */
    function track(el: Element) {
      let pending = 0;
      let lastViewport = viewport();
      const update = () => {
        pending = 0;
        if (!el.isConnected) {
          stop();
          find(performance.now());
          return;
        }
        const vp = viewport();
        const resized = vp.width !== lastViewport.width || vp.height !== lastViewport.height;
        lastViewport = vp;
        const layout = layoutStop(viewportRect(el), cardSize(), vp, safeArea());
        if (!layout.hole) return;
        const hole = toDocument(layout.hole, scroll());
        if (!resized && holeRef.current && rectsAreClose(holeRef.current, hole, 1)) return;
        glideTo(hole, resized ? 0 : CORRECTION_MS);
        placeCard(layout, !resized);
      };
      const schedule = () => {
        if (!pending) pending = requestAnimationFrame(update);
      };
      window.addEventListener("resize", schedule, { passive: true });
      const observer = new ResizeObserver(schedule);
      observer.observe(el);
      observer.observe(document.body);
      // Om sidan byter ut elementet (t.ex. när datan laddats om) letar vi upp det igen.
      const watchdog = window.setInterval(() => {
        if (!el.isConnected) schedule();
      }, 400);
      function stop() {
        cancelAnimationFrame(pending);
        window.removeEventListener("resize", schedule);
        observer.disconnect();
        window.clearInterval(watchdog);
      }
      cleanups.push(stop);
    }

    function land(el: HTMLElement) {
      const vp = viewport();
      const { scrollTo, layout } = frameStop(viewportRect(el), cardSize(), vp, safeArea(), {
        y: window.scrollY,
        max: document.documentElement.scrollHeight - vp.height,
      });
      if (!layout.hole) return;
      // Hålets plats i sidans koordinater när skrollen är klar.
      const hole = toDocument(layout.hole, { x: window.scrollX, y: scrollTo });
      const scrollDelta = scrollTo - window.scrollY;
      const previous = openRef.current ? visibleSpot() : null;
      // Hur långt hålet flyttar sig på skärmen (sidans rörelse inräknad).
      const travel = previous
        ? Math.hypot(center(hole).x - center(previous).x, center(hole).y - center(previous).y - scrollDelta)
        : 0;
      const duration = reducedMotion ? 0 : glideDuration(Math.max(travel, Math.abs(scrollDelta)));

      const longScroll = Math.abs(scrollDelta) > vp.height * LONG_SCROLL_SHARE;
      if (previous && longScroll && !reducedMotion) {
        // Lång skroll: hålet tonar igen, sidan skrollar under mörkläggningen
        // och hålet tonar upp på målet när sidan nästan är framme. Annars
        // skulle sidans innehåll strömma förbi genom hålet.
        closeHole();
        scrollWindowTo(scrollTo, duration);
        later(() => openAt(hole), Math.max(CLOSE_HOLE_MS, duration - 140));
        later(() => {
          placeCard(layout, false, scrollTo);
          revealCard();
        }, Math.max(CLOSE_HOLE_MS, duration - 140) + 90);
        later(() => arrive(el), duration + 360);
        return;
      }
      if (previous) {
        glideTo(hole, duration, scrollTo);
      } else {
        // Hålet är stängt: det står redan på målet i sidan, så sidan kan
        // skrolla dit medan hålet tonar upp.
        openAt(hole);
        scrollWindowTo(scrollTo, glideDuration(Math.abs(scrollDelta)));
      }

      // Kortet flyttas först när det har tonat ut, och tonar in på sin nya plats.
      const revealAfter = reducedMotion ? 0 : Math.max(CARD_FADE_OUT_MS, (previous ? duration : 260) * CARD_REVEAL_AT);
      later(() => {
        placeCard(layout, false, scrollTo);
        revealCard();
      }, revealAfter);

      later(() => arrive(el), reducedMotion ? 0 : Math.max(duration, 420) + 60);
    }

    /** Framme: rätta om sidan hunnit flytta sig, pulsa ringen och följ målet. */
    function arrive(el: HTMLElement) {
      const settled = layoutStop(viewportRect(el), cardSize(), viewport(), safeArea());
      if (settled.hole) {
        const settledHole = toDocument(settled.hole, scroll());
        if (holeRef.current && !rectsAreClose(settledHole, holeRef.current, 1)) {
          glideTo(settledHole, CORRECTION_MS);
          placeCard(settled, true);
        }
        pingAt(settledHole);
      }
      track(el);
    }

    function awaitStableLayout(el: HTMLElement, then: () => void) {
      const startedAt = performance.now();
      let previous: { rect: TourRect; height: number; scroll: number } | null = null;
      let stable = 0;
      const tick = () => {
        if (cancelled) return;
        const current = { rect: viewportRect(el), height: document.documentElement.scrollHeight, scroll: window.scrollY };
        const same =
          previous !== null &&
          rectsAreClose(previous.rect, current.rect) &&
          previous.height === current.height &&
          previous.scroll === current.scroll;
        stable = same ? stable + 1 : 0;
        previous = current;
        if (stable >= LAYOUT_STABLE_FRAMES || performance.now() - startedAt > LAYOUT_MAX_MS) {
          then();
          return;
        }
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }

    function showWithoutTarget() {
      const wasOpen = openRef.current;
      closeHole();
      later(() => {
        placeCard(layoutStop(null, cardSize(), viewport(), safeArea()), false);
        revealCard();
      }, reducedMotion ? 0 : wasOpen ? CLOSE_HOLE_MS : CARD_FADE_OUT_MS);
    }

    function find(startedAt: number) {
      if (cancelled) return;
      const el = document.querySelector<HTMLElement>(`[data-tour-id="${step.target}"]`);
      if (el) {
        // Är hålet öppet (samma sida) glider det direkt. Är det stängt (ny
        // sida) väntar vi tills sidan slutat flytta på sig, så att det öppnas
        // en gång på rätt ställe.
        if (openRef.current) land(el);
        else awaitStableLayout(el, () => land(el));
        return;
      }
      if (performance.now() - startedAt > FIND_TIMEOUT_MS) {
        showWithoutTarget();
        return;
      }
      if (openRef.current) closeHole();
      frame = requestAnimationFrame(() => find(startedAt));
    }

    leaveRef.current = (nextIndex) => {
      const next = TOUR_STEPS[nextIndex];
      cleanups.forEach((cleanup) => cleanup());
      cleanups.length = 0;
      cancelAnimationFrame(scrollFrame);
      hideCard();
      if (toFondaPath(next.route) !== pathname || !next.target) {
        // Hålet tonar igen innan sidan byts, så att den nya sidan aldrig syns
        // genom det medan den renderas.
        const wasOpen = openRef.current;
        closeHole();
        return reducedMotion ? 0 : wasOpen ? CLOSE_HOLE_MS : CARD_FADE_OUT_MS;
      }
      return reducedMotion ? 0 : CARD_FADE_OUT_MS;
    };

    // Varje nytt stopp börjar med att kortet tonar ut där det står
    // (redan gjort om stoppet byttes via Nästa).
    hideCard();
    if (pathname !== route) closeHole();
    else if (!step.target) showWithoutTarget();
    else find(performance.now());

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(scrollFrame);
      timers.forEach((timer) => window.clearTimeout(timer));
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [tourStepIndex, step.target, route, pathname, reducedMotion]);

  // Ett nytt stopp har renderats: Nästa går att trycka på igen.
  useEffect(() => {
    advancingRef.current = false;
  }, [tourStepIndex]);

  const isLastStep = tourStepIndex === TOUR_STEPS.length - 1;
  function goNext() {
    if (isLastStep) {
      setClosing(true);
      return;
    }
    if (advancingRef.current) return;
    advancingRef.current = true;
    const nextIndex = tourStepIndex + 1;
    const wait = leaveRef.current?.(nextIndex) ?? 0;
    window.setTimeout(() => {
      // Momentet och stoppet byts i samma omgång, så att sidan bara renderas om en gång.
      const beatId = TOUR_STEPS[nextIndex].beatId;
      const beatIndex = beatId ? saraBeats.findIndex((beat) => beat.id === beatId) : -1;
      if (beatIndex >= 0) goTo(beatIndex);
      setTourStep(nextIndex);
    }, wait);
  }

  const progress = (tourStepIndex + 1) / TOUR_STEPS.length;

  return (
    <>
      {/* Fångar klick utanför kortet medan rundturen pågår. Skroll går igenom. */}
      <div className="fdd-tour-blocker" />
      <div className="fdd-tour" data-closing={closing ? "true" : undefined}>
        <div ref={spotRef} className="fdd-tour__spot" data-open="false">
          <div className="fdd-tour__cover" />
          <div className="fdd-tour__ring" />
          <div ref={pingRef} className="fdd-tour__ping" />
        </div>
        <div
          ref={cardRef}
          className="fdd-tour__card"
          role="dialog"
          aria-modal="true"
          aria-label={step.title[locale]}
        >
          <div className="fdd-tour__progress" aria-hidden="true">
            <span className="fdd-tour__progress-fill" style={{ transform: `scaleX(${progress})` }} />
          </div>
          <div key={tourStepIndex} className="fdd-tour__content">
            <p className="fdd-tour__count">
              {t.tour.stopLabel} {tourStepIndex + 1} {t.tour.ofLabel} {TOUR_STEPS.length}
            </p>
            <h2 className="fdd-tour__title">{step.title[locale]}</h2>
            <p className="fdd-tour__body">{step.body[locale]}</p>
          </div>
          <div className="fdd-tour__actions">
            <button type="button" onClick={() => setClosing(true)} className="fdd-tour__skip">
              {t.tour.skipCta}
            </button>
            <button type="button" onClick={goNext} className="fd-btn fd-btn--primary fd-btn--sm">
              {isLastStep ? t.tour.finishCta : t.tour.nextCta}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
