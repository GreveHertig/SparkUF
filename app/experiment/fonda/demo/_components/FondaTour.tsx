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
  isComfortablyVisible,
  padRect,
  placeCard,
  predictCenteredRect,
  rectsAreClose,
  ringClipPath,
  scrimClipPath,
  type TourRect,
} from "../_lib/tourGeometry";

/** Samma som --r-lg (1rem) i design/tokens.css. */
const RADIUS = 16;
const RING_THICKNESS = 2;
const PING_SPREAD = 12;
const PING_MS = 700;
const GLIDE_MS = 320;
const CLOSE_MS = 180;
const FIND_TIMEOUT_MS = 2500;
const SETTLE_MAX_MS = 1200;
const SETTLE_MIN_MS = 120;
const SETTLE_STABLE_FRAMES = 4;
/** Hur länge en ny sida ska stå still innan hålet öppnas (ca 100 ms). */
const LAYOUT_STABLE_FRAMES = 6;
const LAYOUT_MAX_MS = 1000;
/** Luft uppe (sidhuvudet) och nere (demoraden) innan målet räknas som synligt. */
const VISIBLE_MARGINS = { top: 88, bottom: 132 };
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

type Motion = "glide" | "instant";

type StageElements = {
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
 * via React-state, så att inget renderas om medan sidan skrollar. Mellan två
 * stopp glider hålet och kortet till nästa mål. Byter stoppet sida krymper
 * hålet där det står och öppnas igen när målet finns på den nya sidan.
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
    const scrim = scrimRef.current;
    const ring = ringRef.current;
    const ping = pingRef.current;
    const card = cardRef.current;
    if (!scrim || !ring || !ping || !card) return;
    const els: StageElements = { scrim, ring, ping, card };
    const radius = RADIUS;

    let cancelled = false;
    let frame = 0;
    const timers: number[] = [];
    const cleanups: Array<() => void> = [];

    function setMotion(motion: Motion) {
      const value = reducedMotion ? "instant" : motion;
      els.scrim.dataset.motion = value;
      els.ring.dataset.motion = value;
    }

    /** Öppnar hålet runt `hole`, eller stänger det (null) där det senast stod. */
    function applyHole(hole: TourRect | null, motion: Motion) {
      const vp = viewport();
      const last = holeRef.current;
      const shape = hole ?? (last ? collapseRect(last) : collapseRect({ top: vp.height / 2, left: vp.width / 2, width: 0, height: 0 }));
      setMotion(motion);
      els.scrim.style.clipPath = scrimClipPath(vp, shape, radius);
      els.ring.style.clipPath = ringClipPath(shape, radius, RING_THICKNESS);
      els.ring.dataset.open = hole ? "true" : "false";
      openRef.current = hole !== null;
      if (hole) holeRef.current = hole;
    }

    /** Första öppningen (eller efter ett sidbyte): hålet växer ut ur målets mitt. */
    function openHole(hole: TourRect) {
      if (!openRef.current) {
        applyHole(collapseRect(hole), "instant");
        els.ring.dataset.open = "false";
        flush(els.scrim);
      }
      applyHole(hole, "glide");
    }

    function showCard(spot: TourRect | null, motion: Motion) {
      const hidden = els.card.dataset.visible !== "true";
      const { x, y } = placeCard(spot, { width: els.card.offsetWidth, height: els.card.offsetHeight }, viewport());
      // Ett dolt kort flyttas direkt och tonar sedan in där det ska stå.
      els.card.dataset.motion = hidden || reducedMotion ? "instant" : motion;
      els.card.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (hidden) flush(els.card);
      els.card.dataset.visible = "true";
    }

    function hideCard() {
      els.card.dataset.visible = "false";
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
          { clipPath: ringClipPath(hole, radius, RING_THICKNESS), opacity: 0.8 },
          { clipPath: ringClipPath(grown, radius + PING_SPREAD, RING_THICKNESS), opacity: 0 },
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
        if (!viewportChanged && holeRef.current && rectsAreClose(holeRef.current, next)) return;
        applyHole(next, motion);
        showCard(next, motion);
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

    /** Väntar tills skrollen har stannat, rättar slutläget och pulsar ringen en gång. */
    function settle(el: Element, startedAt: number) {
      let previous: TourRect | null = null;
      let stable = 0;
      const tick = () => {
        if (cancelled) return;
        const current = toRect(el);
        stable = previous && rectsAreClose(previous, current) ? stable + 1 : 0;
        previous = current;
        const elapsed = performance.now() - startedAt;
        const settled = (stable >= SETTLE_STABLE_FRAMES && elapsed >= SETTLE_MIN_MS) || elapsed >= SETTLE_MAX_MS;
        if (!settled) {
          frame = requestAnimationFrame(tick);
          return;
        }
        if (!holeRef.current || !rectsAreClose(holeRef.current, current, 1)) {
          applyHole(current, "glide");
          showCard(current, "glide");
        }
        timers.push(window.setTimeout(() => pingAt(current), Math.max(0, GLIDE_MS - elapsed)));
        track(el);
      };
      frame = requestAnimationFrame(tick);
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

    function land(el: HTMLElement) {
      const startedAt = performance.now();
      const vp = viewport();
      let target = toRect(el);
      if (!isComfortablyVisible(target, vp.height, VISIBLE_MARGINS)) {
        const maxScroll = document.documentElement.scrollHeight - vp.height;
        target = predictCenteredRect(target, { y: window.scrollY, max: maxScroll }, vp.height).rect;
        el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center", inline: "nearest" });
      }
      openHole(target);
      showCard(target, "glide");
      settle(el, startedAt);
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
        applyHole(null, "glide");
        showCard(null, "glide");
        return;
      }
      if (openRef.current) applyHole(null, "glide");
      hideCard();
      frame = requestAnimationFrame(() => find(startedAt));
    }

    if (pathname !== route) {
      // Sidan byts: hålet krymper där det står och kortet tonar ut.
      applyHole(null, "glide");
      hideCard();
    } else if (!step.target) {
      applyHole(null, "glide");
      showCard(null, "glide");
    } else {
      find(performance.now());
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
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
