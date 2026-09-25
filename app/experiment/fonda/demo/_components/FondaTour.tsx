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
  SHADE_PARTS,
  frameStop,
  glideDuration,
  holeForPlacement,
  layoutStop,
  padRect,
  rectsAreClose,
  shadeTransforms,
  toDocument,
  type SafeArea,
  type ShadePart,
  type StopLayout,
  type TourRect,
} from "../_lib/tourGeometry";

/** Hålet tonar igen innan sidan byts. Samma som i fonda.css. */
const CLOSE_HOLE_MS = 300;
/** Kortets uttoning. Samma som i fonda.css. */
const CARD_FADE_OUT_MS = 180;
/** Kortet tonar in när spotlighten är drygt halvvägs framme. */
const CARD_REVEAL_AT = 0.55;
/** Små rättelser efter landningen (t.ex. när datan laddats klart). */
const CORRECTION_MS = 280;
/** Skrollar sidan mer än så här stor del av skärmen tonar hålet om i stället för att glida. */
const LONG_SCROLL_SHARE = 0.35;
/** Så länge skrollen ska ha stått still innan kortets placering väljs om. */
const SCROLL_SETTLE_MS = 160;
const PING_MS = 900;
const PING_SPREAD = 10;
const CLOSE_TOUR_MS = 240;
const FIND_TIMEOUT_MS = 2500;
/** Hur länge målet ska stå still innan hålet placeras: ny sida ca 100 ms, samma sida ca 50 ms. */
const STABLE_FRAMES_NEW_PAGE = 6;
const STABLE_FRAMES_SAME_PAGE = 3;
const STABLE_MAX_MS = 1200;
/** easeInOutCubic för förflyttning, stark ease-out för in/ut (som --fd-ease). */
const EASE_MOVE = "cubic-bezier(0.65, 0, 0.35, 1)";
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

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

/** Målet syns på riktigt: har storlek, är inte dolt, och typsnitt och bilder i det har laddats. */
function isShowing(el: HTMLElement): boolean {
  if (!el.isConnected) return false;
  const rect = el.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return false;
  if (typeof el.checkVisibility === "function" && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) {
    return false;
  }
  if (document.fonts && document.fonts.status !== "loaded") return false;
  return Array.from(el.querySelectorAll("img")).every((img) => img.complete);
}

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
 * Mörkläggningen (paneler runt hålet, se _lib/tourGeometry.ts) och kortet
 * ligger i sidans koordinater och rör sig bara med `transform` och `opacity`.
 * Hålet följer målets verkliga plats: vid skroll (där det beskärs mot
 * sidhuvudet, demoraden eller kortet), när fönstret ändrar storlek och när
 * innehållet ändrar storlek.
 *
 * Nästa stopp: kortet tonar ut (och hålet tonar igen om sidan byts). Först
 * när det är klart byts stoppet, så att React-arbetet sker medan inget rör
 * sig. Sedan väntar scenen tills målet syns och står still, och hålet glider
 * dit medan sidan skrollar med samma kurva och längd. Vid lång skroll tonar
 * hålet i stället igen och upp, så att innehållet inte strömmar förbi.
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

  const shadeRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
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
    const shade = shadeRef.current;
    const ring = ringRef.current;
    const ping = pingRef.current;
    const card = cardRef.current;
    if (!shade || !ring || !ping || !card) return;
    const parts = Object.fromEntries(
      SHADE_PARTS.map((part) => [part, shade.querySelector<HTMLElement>(`[data-part="${part}"]`)!]),
    ) as Record<ShadePart, HTMLElement>;

    let cancelled = false;
    let frame = 0;
    let scrollFrame = 0;
    /** Rundturen skrollar själv just nu: skrollhändelserna ska inte flytta hålet. */
    let selfScrolling = false;
    const timers: number[] = [];
    const cleanups: Array<() => void> = [];
    const later = (fn: () => void, ms: number) =>
      timers.push(
        window.setTimeout(() => {
          if (!cancelled) fn();
        }, ms),
      );

    /** Kortets höjd vid en viss bredd. Kortet är osynligt när det mäts inför ett stopp. */
    function measure(width: number) {
      if (card!.style.width !== `${width}px`) card!.style.width = `${width}px`;
      return card!.offsetHeight;
    }

    /** Flyttar mörkläggningen till `hole` (sidans koordinater), med glid om `duration` > 0. */
    function setShade(hole: TourRect, duration: number) {
      const next = shadeTransforms(hole);
      const animate = duration > 0 && !reducedMotion;
      for (const part of SHADE_PARTS) {
        const el = parts[part];
        const from = animate ? getComputedStyle(el).transform : "none";
        el.getAnimations().forEach((animation) => animation.cancel());
        el.style.transform = next[part];
        if (animate && from !== "none") {
          el.animate([{ transform: from }, { transform: next[part] }], { duration, easing: EASE_MOVE });
        }
      }
      holeRef.current = hole;
    }

    /** Ringen runt hålet: placeras direkt och tonar in när hålet har landat. */
    function placeRing(hole: TourRect) {
      const style = ring!.style;
      style.transform = `translate(${hole.left}px, ${hole.top}px)`;
      style.width = `${hole.width}px`;
      style.height = `${hole.height}px`;
    }

    function showRing(on: boolean) {
      ring!.dataset.on = on ? "true" : "false";
    }

    function openHole() {
      shade!.dataset.open = "true";
      openRef.current = true;
    }

    function closeHole() {
      shade!.dataset.open = "false";
      openRef.current = false;
      showRing(false);
    }

    /** Kortet på en plats i viewporten, omräknad till sidans koordinater vid skrollen `scrollY`. */
    function placeCard(layout: StopLayout, glide: boolean, scrollY = window.scrollY) {
      card!.dataset.motion = glide && !reducedMotion ? "glide" : "instant";
      card!.dataset.placement = layout.placement;
      card!.style.width = `${layout.card.width}px`;
      card!.style.transform = `translate3d(${layout.card.x + window.scrollX}px, ${layout.card.y + scrollY}px, 0)`;
    }

    function revealCard() {
      flush(card!);
      card!.dataset.visible = "true";
    }

    function hideCard() {
      card!.dataset.visible = "false";
    }

    function pingAt(hole: TourRect) {
      if (reducedMotion || typeof ping!.animate !== "function") return;
      const scaleX = 1 + (PING_SPREAD * 2) / Math.max(1, hole.width);
      const scaleY = 1 + (PING_SPREAD * 2) / Math.max(1, hole.height);
      ping!.animate(
        [
          { transform: "none", opacity: 0.6 },
          { transform: `scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)})`, opacity: 0 },
        ],
        { duration: PING_MS, easing: EASE_OUT },
      );
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
      selfScrolling = true;
      return new Promise((resolve) => {
        const startedAt = performance.now();
        const tick = (now: number) => {
          if (cancelled) return resolve();
          const progress = Math.min(1, (now - startedAt) / duration);
          window.scrollTo(0, from + (y - from) * easeInOutCubic(progress));
          if (progress < 1) {
            scrollFrame = requestAnimationFrame(tick);
          } else {
            selfScrolling = false;
            resolve();
          }
        };
        scrollFrame = requestAnimationFrame(tick);
      });
    }

    /**
     * Följer målet efter landningen. Vid skroll: hålet beskärs om mot
     * sidhuvudet, demoraden eller kortet, och ett kort som hör till
     * skärmen (staplat eller i mitten) följer med skärmen. Vid ändrad
     * storlek på fönstret eller innehållet räknas placeringen om.
     */
    function track(el: HTMLElement, initial: StopLayout) {
      let layout = initial;
      /** Skrollen när `layout` räknades ut: ett kort som hör till målet står i sidans koordinater för den. */
      let layoutScroll = window.scrollY;
      let pending = 0;
      let relayout = false;
      let settleTimer = 0;
      let lastViewport = viewport();
      const update = () => {
        pending = 0;
        const full = relayout;
        relayout = false;
        if (!el.isConnected) {
          stop();
          find(performance.now());
          return;
        }
        const vp = viewport();
        const resized = vp.width !== lastViewport.width || vp.height !== lastViewport.height;
        lastViewport = vp;
        const safe = safeArea();
        const rect = viewportRect(el);
        if (full || resized) {
          const next = layoutStop(rect, measure, vp, safe);
          if (!next.hole) return;
          const hole = toDocument(next.hole, scroll());
          const moved =
            next.placement !== layout.placement ||
            Math.abs(next.card.x - layout.card.x) > 1 ||
            Math.abs(next.card.y + window.scrollY - (layout.card.y + layoutScroll)) > 1;
          const changed = !holeRef.current || !rectsAreClose(holeRef.current, hole, 1) || moved;
          layout = next;
          layoutScroll = window.scrollY;
          if (!changed) return;
          setShade(hole, resized ? 0 : CORRECTION_MS);
          placeRing(hole);
          showRing(hole.height >= 8);
          placeCard(next, !resized);
          return;
        }
        // Skroll: behåll placeringen och räkna om hålet mot den säkra ytan.
        const hole = toDocument(holeForPlacement(rect, layout, safe), scroll());
        if (layout.placement === "stacked" || layout.placement === "center") {
          // Kortet hör till skärmen: det står kvar där det står.
          placeCard(layout, false);
        } else {
          // Kortet hör till målet och följer med sidan, men lämnar aldrig
          // den säkra ytan. När skrollen stannat väljs placeringen om.
          const cardHeight = card!.offsetHeight;
          const y = layout.card.y + layoutScroll - window.scrollY;
          const clamped = Math.min(Math.max(y, safe.top + 16), safe.bottom - 16 - cardHeight);
          placeCard({ ...layout, card: { ...layout.card, y: clamped } }, false);
        }
        window.clearTimeout(settleTimer);
        settleTimer = window.setTimeout(onResize, SCROLL_SETTLE_MS);
        if (holeRef.current && rectsAreClose(holeRef.current, hole, 0.5)) return;
        setShade(hole, 0);
        placeRing(hole);
        showRing(hole.height >= 8);
      };
      const schedule = (full: boolean) => () => {
        if (full) relayout = true;
        else if (selfScrolling) return;
        if (!pending) pending = requestAnimationFrame(update);
      };
      const onScroll = schedule(false);
      const onResize = schedule(true);
      window.addEventListener("scroll", onScroll, { passive: true, capture: true });
      window.addEventListener("resize", onResize, { passive: true });
      const observer = new ResizeObserver(onResize);
      observer.observe(el);
      observer.observe(document.body);
      // Om sidan byter ut elementet (t.ex. när datan laddats om) letar vi upp det igen.
      const watchdog = window.setInterval(() => {
        if (!el.isConnected) onResize();
      }, 400);
      function stop() {
        cancelAnimationFrame(pending);
        window.clearTimeout(settleTimer);
        window.removeEventListener("scroll", onScroll, { capture: true });
        window.removeEventListener("resize", onResize);
        observer.disconnect();
        window.clearInterval(watchdog);
      }
      cleanups.push(stop);
    }

    function land(el: HTMLElement) {
      const vp = viewport();
      const { scrollTo, layout } = frameStop(viewportRect(el), measure, vp, safeArea(), {
        y: window.scrollY,
        max: document.documentElement.scrollHeight - vp.height,
      });
      if (!layout.hole) return;
      // Hålets plats i sidans koordinater när skrollen är klar.
      const hole = toDocument(layout.hole, { x: window.scrollX, y: scrollTo });
      const scrollDelta = scrollTo - window.scrollY;
      const previous = openRef.current ? holeRef.current : null;
      // Hur långt hålet flyttar sig på skärmen (sidans rörelse inräknad).
      const travel = previous
        ? Math.hypot(center(hole).x - center(previous).x, center(hole).y - center(previous).y - scrollDelta)
        : 0;
      const duration = reducedMotion ? 0 : glideDuration(Math.max(travel, Math.abs(scrollDelta)));
      const longScroll = Math.abs(scrollDelta) > vp.height * LONG_SCROLL_SHARE;
      showRing(false);

      let revealAt: number;
      let arriveAt: number;
      if (previous && !longScroll) {
        // Kort väg: hålet glider medan sidan skrollar med samma kurva och längd.
        setShade(hole, duration);
        scrollWindowTo(scrollTo, duration);
        revealAt = Math.max(CARD_FADE_OUT_MS, duration * CARD_REVEAL_AT);
        arriveAt = duration;
      } else {
        // Hålet är stängt (ny sida) eller vägen är lång: hålet tonar igen,
        // flyttas medan det är stängt, sidan skrollar under mörkläggningen
        // och hålet tonar upp på målet när sidan nästan är framme.
        const wasOpen = openRef.current;
        if (wasOpen) closeHole();
        const scrollTime = reducedMotion ? 0 : glideDuration(Math.abs(scrollDelta));
        const openAfter = reducedMotion ? 0 : wasOpen ? Math.max(CLOSE_HOLE_MS, scrollTime - 140) : Math.max(0, scrollTime - 200);
        later(() => setShade(hole, 0), wasOpen ? CLOSE_HOLE_MS : 0);
        scrollWindowTo(scrollTo, scrollTime);
        later(openHole, openAfter);
        revealAt = openAfter + 90;
        arriveAt = openAfter + CLOSE_HOLE_MS;
      }
      if (previous && !longScroll) openHole();

      // Kortet flyttas medan det är osynligt och tonar in på sin nya plats.
      later(() => {
        placeCard(layout, false, scrollTo);
        revealCard();
      }, reducedMotion ? 0 : revealAt);

      // Framme: rätta om sidan hunnit flytta sig, visa ringen, pulsa och följ målet.
      later(() => {
        const settled = layoutStop(viewportRect(el), measure, viewport(), safeArea());
        let final = layout;
        if (settled.hole) {
          const settledHole = toDocument(settled.hole, scroll());
          if (holeRef.current && !rectsAreClose(settledHole, holeRef.current, 1)) {
            setShade(settledHole, CORRECTION_MS);
            placeCard(settled, true);
            final = settled;
          }
          placeRing(holeRef.current ?? settledHole);
          showRing(true);
          pingAt(holeRef.current ?? settledHole);
        }
        track(el, final);
      }, reducedMotion ? 0 : arriveAt + 40);
    }

    /** Väntar tills målet syns och har stått still i `frames` bildrutor. */
    function awaitStable(el: HTMLElement, frames: number, then: () => void) {
      const startedAt = performance.now();
      let previous: { rect: TourRect; height: number; scroll: number } | null = null;
      let stable = 0;
      const tick = () => {
        if (cancelled) return;
        const showing = isShowing(el);
        const current = { rect: viewportRect(el), height: document.documentElement.scrollHeight, scroll: window.scrollY };
        const same =
          showing &&
          previous !== null &&
          rectsAreClose(previous.rect, current.rect) &&
          previous.height === current.height &&
          previous.scroll === current.scroll;
        stable = same ? stable + 1 : 0;
        previous = current;
        if (stable >= frames || performance.now() - startedAt > STABLE_MAX_MS) {
          then();
          return;
        }
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }

    function showWithoutTarget(cardAlreadyHidden: boolean) {
      const wasOpen = openRef.current;
      closeHole();
      const wait = reducedMotion ? 0 : wasOpen ? CLOSE_HOLE_MS : cardAlreadyHidden ? 0 : CARD_FADE_OUT_MS;
      later(() => {
        placeCard(layoutStop(null, measure, viewport(), safeArea()), false);
        revealCard();
      }, wait);
    }

    function find(startedAt: number) {
      if (cancelled) return;
      const el = document.querySelector<HTMLElement>(`[data-tour-id="${step.target}"]`);
      if (el) {
        awaitStable(el, openRef.current ? STABLE_FRAMES_SAME_PAGE : STABLE_FRAMES_NEW_PAGE, () => land(el));
        return;
      }
      if (performance.now() - startedAt > FIND_TIMEOUT_MS) {
        showWithoutTarget(true);
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
      showRing(false);
      if (toFondaPath(next.route) !== pathname || !next.target) {
        // Hålet tonar igen innan sidan byts, så att den nya sidan aldrig syns
        // genom det medan den renderas.
        const wasOpen = openRef.current;
        closeHole();
        return reducedMotion ? 0 : wasOpen ? CLOSE_HOLE_MS : CARD_FADE_OUT_MS;
      }
      return reducedMotion ? 0 : CARD_FADE_OUT_MS;
    };

    // Första gången: mörkläggningen står stängd mitt på skärmen.
    if (!holeRef.current) {
      const vp = viewport();
      setShade(toDocument({ top: vp.height / 2, left: vp.width / 2, width: 0, height: 0 }, scroll()), 0);
    }
    // Varje nytt stopp börjar med att kortet tonar ut där det står
    // (redan gjort om stoppet byttes via Nästa).
    const cardHidden = card.dataset.visible !== "true";
    hideCard();
    if (pathname !== route) closeHole();
    else if (!step.target) showWithoutTarget(cardHidden);
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
        <div ref={shadeRef} className="fdd-tour__shade" data-open="false" aria-hidden="true">
          {SHADE_PARTS.map((part) => (
            <div key={part} className="fdd-tour__part" data-part={part} />
          ))}
        </div>
        <div ref={ringRef} className="fdd-tour__ring" data-on="false" aria-hidden="true">
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
