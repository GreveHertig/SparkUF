"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/design/cn";
import { usePrefersReducedMotion } from "@/design/usePrefersReducedMotion";
import { useI18n } from "@/i18n/context";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { saraBeats } from "@/adapters/demo/sara";
import { TOUR_STEPS } from "@/adapters/demo/tourSteps";

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

/**
 * Den guidade rundturen (avsnitt 9.2). Rent overlay-lager ovanpå
 * /demo/start och /demo/app (monterad bredvid DemoBar i respektive
 * layout) — känner bara till TOUR_STEPS och demoStore, ingen skärm vet att
 * den här komponenten finns.
 *
 * Spotlighten hittas via `data-tour-id` (satt på skärmarna) och mäts om
 * varje animationsframe medan ett stopp med `target` är aktivt, i stället
 * för engångs-scroll/resize-lyssnare — självläkande om innehållet under
 * flyttar sig en bit efter att demodatan hunnit laddas klart (adaptrarna
 * hämtar via useEffect, se docs/arkitektur.md avsnitt 7), utan att behöva
 * gissa hur länge det tar.
 */
export function TourOverlay() {
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
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);

  // Navigera till stoppets route så fort rundturen slås på eller går vidare.
  useEffect(() => {
    if (!tourOn) return;
    if (pathname !== step.route) router.push(step.route);
  }, [tourOn, step.route, pathname, router]);

  // Hoppa till stoppets beat (Saras — rundturen tvingar entry till "noIdea",
  // se demoStore.ts:s toggleTour) så att rätt poäng/moment visas på routen.
  useEffect(() => {
    if (!tourOn || !step.beatId) return;
    const index = saraBeats.findIndex((beat) => beat.id === step.beatId);
    if (index >= 0) goTo(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourOn, step.beatId]);

  // Stopp utan `target` (avsnitt 9.2, t.ex. "affarsmodellen") behöver aldrig
  // sätta spotlight-state — `effectiveSpotlight` nedan nollar den vid
  // render i stället. Det håller effekten till att bara reagera på externa
  // ändringar (elementets position), inte anropa setState synkront i sin
  // egen body (react-hooks/set-state-in-effect).
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
  }, [tourOn, step.target, step.route, tourStepIndex, reducedMotion]);

  const effectiveSpotlight = tourOn && step.target ? spotlight : null;

  if (!tourOn) return null;

  const isLastStep = tourStepIndex === TOUR_STEPS.length - 1;

  function goNext() {
    if (isLastStep) toggleTour();
    else setTourStep(tourStepIndex + 1);
  }

  const viewportWidth = typeof window === "undefined" ? 0 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 0 : window.innerHeight;
  const cardWidth = Math.min(360, viewportWidth - 32);
  // Kortets höjd varierar med textlängd (särskilt sv/en) och är inte känd
  // förrän efter render — ett rimligt överslag (kort titel+text+knappar,
  // p-5) i stället för `translateY(-100%)`, som annars kan knuffa kortet
  // ovanför y=0 om målet ligger nära toppen (upptäckt med en riktig
  // Playwright-klickgenomgång: kortet blev då oklickbart, utanför
  // viewporten). Att clampa mot en uppskattning håller kortet garanterat
  // innanför skärmen i båda fallen, i stället för matematiskt "perfekt"
  // placering som kan gå sönder för extremvärden.
  const ESTIMATED_CARD_HEIGHT = 220;

  let cardStyle: CSSProperties;
  let arrowStyle: CSSProperties | null = null;

  if (effectiveSpotlight) {
    const spaceBelow = viewportHeight - (effectiveSpotlight.top + effectiveSpotlight.height);
    const placeBelow = spaceBelow > 220 || spaceBelow > effectiveSpotlight.top;
    const cardLeft = Math.min(
      Math.max(16, effectiveSpotlight.left + effectiveSpotlight.width / 2 - cardWidth / 2),
      viewportWidth - cardWidth - 16,
    );

    const belowTop = Math.min(
      effectiveSpotlight.top + effectiveSpotlight.height + 20,
      viewportHeight - ESTIMATED_CARD_HEIGHT - 16,
    );
    const aboveTop = Math.max(16, effectiveSpotlight.top - 20 - ESTIMATED_CARD_HEIGHT);

    cardStyle = { top: placeBelow ? belowTop : aboveTop, left: cardLeft, width: cardWidth };

    const arrowLeft = Math.min(
      Math.max(24, effectiveSpotlight.left + effectiveSpotlight.width / 2 - cardLeft),
      cardWidth - 24,
    );
    arrowStyle = placeBelow
      ? {
          top: effectiveSpotlight.top + effectiveSpotlight.height + 8,
          left: cardLeft + arrowLeft - 8,
          borderBottomColor: "white",
        }
      : {
          top: effectiveSpotlight.top - 8,
          left: cardLeft + arrowLeft - 8,
          borderTopColor: "white",
        };
  } else {
    cardStyle = {
      top: "50%",
      left: "50%",
      width: cardWidth,
      transform: "translate(-50%, -50%)",
    };
  }

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={step.title[locale]}>
      {effectiveSpotlight ? (
        // Spotlighten är sitt eget lager: en osynlig ruta i målets storlek
        // vars 9999px-spridda box-shadow fyller resten av skärmen — det
        // "hålet" ÄR rutan, ingen separat bakgrundsruta ovanpå (den skulle
        // annars täcka över hålet igen).
        <div
          className="pointer-events-none absolute rounded-lg border-2 border-accent-400"
          style={{
            top: effectiveSpotlight.top,
            left: effectiveSpotlight.left,
            width: effectiveSpotlight.width,
            height: effectiveSpotlight.height,
            boxShadow: "0 0 0 9999px var(--scrim)",
            transitionProperty: reducedMotion ? "none" : "top, left, width, height",
            transitionDuration: "var(--motion-fast)",
            transitionTimingFunction: "var(--ease-standard)",
          }}
        />
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: "var(--scrim)" }} />
      )}

      {arrowStyle && (
        <div
          className="pointer-events-none absolute h-0 w-0 border-8 border-transparent"
          style={arrowStyle}
        />
      )}

      <div
        className={cn(
          "absolute flex flex-col gap-3 rounded-lg bg-white p-5 shadow-xl",
          !reducedMotion && "transition-all",
        )}
        style={{ ...cardStyle, transitionDuration: !reducedMotion ? "var(--motion-fast)" : undefined }}
      >
        <span
          className="text-xs font-semibold uppercase text-accent-700"
          style={{ letterSpacing: "var(--tracking-label)" }}
        >
          {t.tour.stopLabel} {tourStepIndex + 1} {t.tour.ofLabel} {TOUR_STEPS.length}
        </span>
        <h2 className="text-lg font-bold text-slate-900">{step.title[locale]}</h2>
        <p className="text-sm leading-snug text-slate-700">{step.body[locale]}</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={toggleTour}
            className="text-sm font-medium text-slate-500 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-accent-300"
          >
            {t.tour.skipCta}
          </button>
          <button
            type="button"
            onClick={goNext}
            className="rounded-md bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-700 focus-visible:outline-2 focus-visible:outline-accent-300"
            style={{ transitionDuration: "var(--motion-fast)", transitionTimingFunction: "var(--ease-standard)" }}
          >
            {isLastStep ? t.tour.finishCta : t.tour.nextCta}
          </button>
        </div>
      </div>
    </div>
  );
}
