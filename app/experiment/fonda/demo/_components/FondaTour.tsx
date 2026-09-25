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
  collapseRect,
  easeInOutCubic,
  frameStop,
  glideDuration,
  layoutStop,
  padRect,
  rectsAreClose,
  ringClipPath,
  scrimClipPath,
  type SafeArea,
  type StopLayout,
  type TourRect,
} from "../_lib/tourGeometry";

/** Samma som --r-lg (1rem) i design/tokens.css. */
const RADIUS = 16;
const RING_THICKNESS = 2;
const PING_SPREAD = 10;
const PING_MS = 900;
/** Hålet som krymper vid sidbyte eller när ett stopp saknar mål. */
const COLLAPSE_MS = 380;
/** Små rättelser efter landningen (t.ex. när datan laddats klart). */
const CORRECTION_MS = 260;
/** Kortet tonar in när spotlighten är drygt halvvägs framme. */
const CARD_REVEAL_AT = 0.55;
/** Samma som kortets uttoning i fonda.css. */
const CARD_FADE_OUT_MS = 160;
const CLOSE_MS = 200;
const FIND_TIMEOUT_MS = 2500;
/** Hur länge en ny sida ska stå still innan hålet öppnas (ca 100 ms). */
const LAYOUT_STABLE_FRAMES = 6;
const LAYOUT_MAX_MS = 1000;
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

type Motion = "glide" | "instant";

type StageElements = {
  root: HTMLDivElement;
  scrim: HTMLDivElement;
  ring: HTMLDivElement;
  ping: HTMLDivElement;
  card: HTMLDivElement;
};

function viewport() {
  return { width: window.innerWidth, height: window.innerHeight };
}

function toRect(el: Element): TourRect {
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
 * Scenen medan rundturen är på. Mörkläggning, ring och kort ligger kvar hela
 * rundturen och flyttas med `clip-path` och `transform` direkt i DOM:en, inte
 * via React-state, så att inget renderas om medan sidan skrollar.
 *
 * Ett stopp: kortet tonar ut där det står. Sidan skrollar och hålet glider
 * till målet med samma kurva och samma längd, så att de rör sig som en kamera.
 * Kortet flyttas medan det är osynligt och tonar in bredvid målet när hålet är
 * nästan framme. Byter stoppet sida krymper hålet där det står och växer ut
 * ur målets mitt när den nya sidan stått still.
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

  const rootRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pingRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  /** Hålet som senast var öppet, och om det är öppet nu. */
  const holeRef = useRef<TourRect | null>(null);
  const openRef = useRef(false);

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
    const timer = window.setTimeout(toggleTour, CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [closing, toggleTour]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const scrim = scrimRef.current;
    const ring = ringRef.current;
    const ping = pingRef.current;
    const card = cardRef.current;
    if (!root || !scrim || !ring || !ping || !card) return;
    const els: StageElements = { root, scrim, ring, ping, card };

    let cancelled = false;
    let frame = 0;
    let scrollFrame = 0;
    const timers: number[] = [];
    const cleanups: Array<() => void> = [];
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));

    function cardSize() {
      return { width: els.card.offsetWidth, height: els.card.offsetHeight };
    }

    function setDuration(ms: number) {
      els.root.style.setProperty("--fdd-tour-glide", `${reducedMotion ? 0 : ms}ms`);
    }

    function setMotion(motion: Motion) {
      const value = reducedMotion ? "instant" : motion;
      els.scrim.dataset.motion = value;
      els.ring.dataset.motion = value;
    }

    /** Öppnar hålet runt `hole`, eller stänger det (null) där det senast stod. */
    function applyHole(hole: TourRect | null, motion: Motion) {
      const vp = viewport();
      const last = holeRef.current;
      const shape = hole ?? collapseRect(last ?? { top: vp.height / 2, left: vp.width / 2, width: 0, height: 0 });
      setMotion(motion);
      els.scrim.style.clipPath = scrimClipPath(vp, shape, RADIUS);
      els.ring.style.clipPath = ringClipPath(shape, RADIUS, RING_THICKNESS);
      els.ring.dataset.open = hole ? "true" : "false";
      openRef.current = hole !== null;
      if (hole) holeRef.current = hole;
    }

    /** Hålet glider till `hole`. Var det stängt växer det först ut ur målets mitt. */
    function openHole(hole: TourRect) {
      if (!openRef.current) {
        applyHole(collapseRect(hole), "instant");
        els.ring.dataset.open = "false";
        flush(els.scrim);
      }
      applyHole(hole, "glide");
    }

    function placeCardAt(layout: StopLayout, motion: Motion) {
      els.card.dataset.motion = reducedMotion ? "instant" : motion;
      els.card.dataset.placement = layout.placement;
      els.card.style.transform = `translate3d(${layout.card.x}px, ${layout.card.y}px, 0)`;
    }

    function revealCard() {
      flush(els.card);
      els.card.dataset.visible = "true";
    }

    function hideCard() {
      els.card.dataset.visible = "false";
    }

    /** Skrollar fönstret med samma kurva och längd som hålet glider. */
    function scrollWindowTo(y: number, duration: number) {
      cancelAnimationFrame(scrollFrame);
      const from = window.scrollY;
      if (Math.abs(y - from) < 1) return;
      if (reducedMotion || duration === 0) {
        window.scrollTo(0, y);
        return;
      }
      const startedAt = performance.now();
      const tick = (now: number) => {
        if (cancelled) return;
        const progress = Math.min(1, (now - startedAt) / duration);
        window.scrollTo(0, from + (y - from) * easeInOutCubic(progress));
        if (progress < 1) scrollFrame = requestAnimationFrame(tick);
      };
      scrollFrame = requestAnimationFrame(tick);
    }

    function pingAt(hole: TourRect) {
      if (reducedMotion || typeof els.ping.animate !== "function") return;
      const grown = {
        top: hole.top - PING_SPREAD,
        left: hole.left - PING_SPREAD,
        width: hole.width + PING_SPREAD * 2,
        height: hole.height + PING_SPREAD * 2,
      };
      els.ping.animate(
        [
          { clipPath: ringClipPath(hole, RADIUS, RING_THICKNESS), opacity: 0.55 },
          { clipPath: ringClipPath(grown, RADIUS + PING_SPREAD, RING_THICKNESS), opacity: 0 },
        ],
        { duration: PING_MS, easing: EASE_OUT },
      );
    }

    /** Följer målet efter landningen: direkt vid skroll, med glid när innehållet flyttar sig. */
    function track(el: Element) {
      let pending = 0;
      let pendingMotion: Motion = "instant";
      let lastViewport = viewport();
      const update = () => {
        pending = 0;
        const motion = pendingMotion;
        pendingMotion = "instant";
        if (!el.isConnected) {
          stop();
          find(performance.now());
          return;
        }
        const next = toRect(el);
        const vp = viewport();
        const viewportChanged = vp.width !== lastViewport.width || vp.height !== lastViewport.height;
        lastViewport = vp;
        const layout = layoutStop(next, cardSize(), vp, safeArea());
        if (!viewportChanged && layout.hole && holeRef.current && rectsAreClose(holeRef.current, layout.hole)) return;
        if (motion === "glide") setDuration(CORRECTION_MS);
        applyHole(layout.hole, motion);
        placeCardAt(layout, motion);
      };
      const schedule = (motion: Motion) => () => {
        if (motion === "glide") pendingMotion = "glide";
        if (!pending) pending = requestAnimationFrame(update);
      };
      const onScroll = schedule("instant");
      const onResize = schedule("glide");
      window.addEventListener("scroll", onScroll, { passive: true, capture: true });
      window.addEventListener("resize", onScroll, { passive: true });
      const observer = new ResizeObserver(onResize);
      observer.observe(el);
      observer.observe(document.body);
      // Om sidan byter ut elementet (t.ex. när datan laddats om) letar vi upp det igen.
      const watchdog = window.setInterval(() => {
        if (!el.isConnected) onResize();
      }, 400);
      function stop() {
        cancelAnimationFrame(pending);
        window.removeEventListener("scroll", onScroll, { capture: true });
        window.removeEventListener("resize", onScroll);
        observer.disconnect();
        window.clearInterval(watchdog);
      }
      cleanups.push(stop);
    }

    function land(el: HTMLElement) {
      const vp = viewport();
      const size = cardSize();
      const { scrollTo, layout } = frameStop(toRect(el), size, vp, safeArea(), {
        y: window.scrollY,
        max: document.documentElement.scrollHeight - vp.height,
      });
      const hole = layout.hole;
      const previous = openRef.current ? holeRef.current : null;
      const travel =
        hole && previous ? Math.hypot(center(hole).x - center(previous).x, center(hole).y - center(previous).y) : 0;
      const duration = glideDuration(Math.max(travel, Math.abs(scrollTo - window.scrollY)));

      setDuration(duration);
      if (hole) openHole(hole);
      else applyHole(null, "glide");
      scrollWindowTo(scrollTo, duration);
      // Kortet flyttas först när det har hunnit tona ut, och tonar in på sin nya plats.
      later(() => {
        placeCardAt(layout, "instant");
        revealCard();
      }, reducedMotion ? 0 : Math.max(CARD_FADE_OUT_MS, duration * CARD_REVEAL_AT));

      // Framme: rätta om sidan hunnit flytta sig, pulsa ringen och följ målet.
      later(() => {
        if (cancelled) return;
        const settled = layoutStop(toRect(el), cardSize(), viewport(), safeArea());
        if (settled.hole && holeRef.current && !rectsAreClose(settled.hole, holeRef.current, 1)) {
          setDuration(CORRECTION_MS);
          applyHole(settled.hole, "glide");
          placeCardAt(settled, "glide");
        }
        if (settled.hole) pingAt(settled.hole);
        track(el);
      }, reducedMotion ? 0 : duration + 40);
    }

    function awaitStableLayout(el: HTMLElement, then: () => void) {
      const startedAt = performance.now();
      let previous: { rect: TourRect; height: number; scroll: number } | null = null;
      let stable = 0;
      const tick = () => {
        if (cancelled) return;
        const current = { rect: toRect(el), height: document.documentElement.scrollHeight, scroll: window.scrollY };
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
      setDuration(COLLAPSE_MS);
      applyHole(null, "glide");
      later(() => {
        placeCardAt(layoutStop(null, cardSize(), viewport(), safeArea()), "instant");
        revealCard();
      }, reducedMotion ? 0 : Math.max(CARD_FADE_OUT_MS, COLLAPSE_MS * CARD_REVEAL_AT));
    }

    function find(startedAt: number) {
      if (cancelled) return;
      const el = document.querySelector<HTMLElement>(`[data-tour-id="${step.target}"]`);
      if (el) {
        // Glider hålet redan mellan två mål går det direkt. Är det stängt (ny
        // sida) väntar vi tills sidan slutat flytta på sig, så att hålet öppnas
        // en gång på rätt ställe i stället för att landa och sedan hoppa.
        if (openRef.current) land(el);
        else awaitStableLayout(el, () => land(el));
        return;
      }
      if (performance.now() - startedAt > FIND_TIMEOUT_MS) {
        showWithoutTarget();
        return;
      }
      if (openRef.current) {
        setDuration(COLLAPSE_MS);
        applyHole(null, "glide");
      }
      frame = requestAnimationFrame(() => find(startedAt));
    }

    // Varje nytt stopp börjar med att kortet tonar ut där det står.
    hideCard();
    if (pathname !== route) {
      // Sidan byts: hålet krymper där det står.
      setDuration(COLLAPSE_MS);
      applyHole(null, "glide");
    } else if (!step.target) {
      showWithoutTarget();
    } else {
      find(performance.now());
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(scrollFrame);
      timers.forEach((timer) => window.clearTimeout(timer));
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [tourStepIndex, step.target, route, pathname, reducedMotion]);

  const isLastStep = tourStepIndex === TOUR_STEPS.length - 1;
  function goNext() {
    if (isLastStep) setClosing(true);
    else setTourStep(tourStepIndex + 1);
  }

  const progress = (tourStepIndex + 1) / TOUR_STEPS.length;

  return (
    <div
      ref={rootRef}
      className="fdd-tour"
      data-closing={closing ? "true" : undefined}
      role="dialog"
      aria-modal="true"
      aria-label={step.title[locale]}
    >
      <div ref={scrimRef} className="fdd-tour__scrim" />
      <div ref={ringRef} className="fdd-tour__ring" />
      <div ref={pingRef} className="fdd-tour__ping" />
      <div ref={cardRef} className="fdd-tour__card">
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
  );
}
