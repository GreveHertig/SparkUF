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
  frameStop,
  glideDuration,
  holeForPlacement,
  layoutStop,
  padRect,
  rectsAreClose,
  scrimClipPath,
  snapRect,
  toDocument,
  type SafeArea,
  type StopLayout,
  type TourRect,
} from "../_lib/tourGeometry";

/** Hålet tonar igen innan sidan byts. Samma som i fonda.css. */
const CLOSE_HOLE_MS = 300;
/** Kortets uttoning. Samma som i fonda.css. */
const CARD_FADE_OUT_MS = 180;
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
/** Stark ease-out för pulsen (som --fd-ease). */
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

/**
 * Sidans storlek för mörkläggningen: demots innehåll, inte dokumentets
 * skrollbara yta (som mörkläggningen själv annars skulle hålla uppe).
 */
function pageArea() {
  const root = document.querySelector(".fdd");
  const bottom = root ? root.getBoundingClientRect().bottom + window.scrollY : 0;
  return {
    width: document.documentElement.clientWidth,
    height: Math.max(bottom, window.scrollY + window.innerHeight),
  };
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
 * Mörkläggningen är ett enda lager i sidans koordinater, med hålet utskuret
 * i hela pixlar (se _lib/tourGeometry.ts). Bara `opacity` och `transform`
 * animeras: hålet byter plats medan ett lock täcker det, och locket tonar.
 * Hålet följer målets verkliga plats: vid skroll (där det beskärs mot
 * sidhuvudet, demoraden eller kortet), när fönstret ändrar storlek och när
 * innehållet ändrar storlek.
 *
 * Nästa stopp: kortet tonar ut (och hålet tonar igen om sidan byts). Först
 * när det är klart byts stoppet, så att React-arbetet sker medan inget rör
 * sig. Sedan väntar scenen tills målet syns och står still. Hålet tonar
 * igen, sidan skrollar under mörkläggningen och hålet tonar upp på målet.
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
  const lidRef = useRef<HTMLDivElement>(null);
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
    const scrim = scrimRef.current;
    const lid = lidRef.current;
    const ring = ringRef.current;
    const ping = pingRef.current;
    const card = cardRef.current;
    if (!scrim || !lid || !ring || !ping || !card) return;

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

    let closeTimer = 0;

    /** Mörkläggningens clip-path: hela sidan, med hålet utskuret om `hole` är satt. */
    function applyClip(hole: TourRect | null) {
      const area = pageArea();
      scrim!.style.width = `${area.width}px`;
      scrim!.style.height = `${area.height}px`;
      scrim!.style.clipPath = scrimClipPath(area, hole);
    }

    /**
     * Flyttar hålet till `hole` (sidans koordinater, avrundat till hela
     * pixlar). Inget glider: hålet byter plats direkt, och byten mellan
     * stoppen görs medan locket täcker det.
     */
    function setShade(hole: TourRect) {
      const snapped = snapRect(hole);
      holeRef.current = snapped;
      const style = lid!.style;
      style.transform = `translate(${snapped.left}px, ${snapped.top}px)`;
      style.width = `${snapped.width}px`;
      style.height = `${snapped.height}px`;
      applyClip(openRef.current || lid!.dataset.covering === "true" ? snapped : null);
    }

    /** Ringen runt hålet: placeras direkt och tonar in när hålet har landat. */
    function placeRing(hole: TourRect) {
      const snapped = snapRect(hole);
      const style = ring!.style;
      style.transform = `translate(${snapped.left}px, ${snapped.top}px)`;
      style.width = `${snapped.width}px`;
      style.height = `${snapped.height}px`;
    }

    function showRing(on: boolean) {
      ring!.dataset.on = on ? "true" : "false";
    }

    /** Hålet tonar upp: det skärs ut under locket, som sedan tonar bort. */
    function openHole() {
      window.clearTimeout(closeTimer);
      lid!.dataset.covering = "true";
      if (holeRef.current) applyClip(holeRef.current);
      flush(lid!);
      lid!.dataset.open = "true";
      openRef.current = true;
    }

    /** Hålet tonar igen: locket tonar in, och när det täcker helt blir mörkläggningen hel. */
    function closeHole() {
      lid!.dataset.open = "false";
      openRef.current = false;
      showRing(false);
      window.clearTimeout(closeTimer);
      closeTimer = window.setTimeout(() => {
        if (openRef.current) return;
        lid!.dataset.covering = "false";
        applyClip(null);
      }, reducedMotion ? 0 : CLOSE_HOLE_MS);
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
          // Sidan kan ha ändrat höjd: mörkläggningen ska täcka hela sidan.
          applyClip(openRef.current ? holeRef.current : null);
          const next = layoutStop(rect, measure, vp, safe);
          if (!next.hole) return;
          const hole = toDocument(next.hole, scroll());
          const moved =
            next.placement !== layout.placement ||
            Math.abs(next.card.x - layout.card.x) > 1 ||
            Math.abs(next.card.y + window.scrollY - (layout.card.y + layoutScroll)) > 1;
          const changed = !holeRef.current || !rectsAreClose(holeRef.current, snapRect(hole), 0.5) || moved;
          layout = next;
          layoutScroll = window.scrollY;
          if (!changed) return;
          setShade(hole);
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
        if (holeRef.current && rectsAreClose(holeRef.current, snapRect(hole), 0.5)) return;
        setShade(hole);
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
      showRing(false);

      let revealAt: number;
      let arriveAt: number;
      const samePlace = openRef.current && holeRef.current && Math.abs(scrollDelta) < 1 && rectsAreClose(holeRef.current, snapRect(hole), 0.5);
      if (samePlace) {
        // Samma mål på samma plats (t.ex. två stopp om poängen): hålet står kvar.
        revealAt = 0;
        arriveAt = 0;
      } else {
        // Hålet tonar igen, flyttas medan det är stängt, sidan skrollar under
        // mörkläggningen och hålet tonar upp på målet när sidan nästan är framme.
        const wasOpen = openRef.current;
        if (wasOpen) closeHole();
        const scrollTime = reducedMotion ? 0 : glideDuration(Math.abs(scrollDelta));
        const closeTime = wasOpen ? CLOSE_HOLE_MS : 0;
        const openAfter = reducedMotion ? 0 : Math.max(closeTime, scrollTime - 140);
        later(() => setShade(hole), reducedMotion ? 0 : closeTime);
        scrollWindowTo(scrollTo, scrollTime);
        later(openHole, openAfter);
        revealAt = openAfter + 90;
        arriveAt = openAfter + CLOSE_HOLE_MS;
      }

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
          if (holeRef.current && !rectsAreClose(snapRect(settledHole), holeRef.current, 0.5)) {
            setShade(settledHole);
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
      setShade(toDocument({ top: vp.height / 2, left: vp.width / 2, width: 0, height: 0 }, scroll()));
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
      window.clearTimeout(closeTimer);
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
        <div ref={scrimRef} className="fdd-tour__scrim" aria-hidden="true" />
        <div ref={lidRef} className="fdd-tour__lid" data-open="false" aria-hidden="true" />
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
