/**
 * Rörelsen i kopians rundtur (FondaTour): ren matematik utan DOM, så att
 * tider och kurvor går att testa och justera på ett ställe.
 *
 * Koreografi vid Nästa/Bakåt (tider från klicket):
 *  - 0–150 ms   gamla kortet tonar ut och glider 6 px bort (ease-in).
 *  - 100–550 ms rutan glider till nya målet i ett svep (HOLE_EASE).
 *  - när rutan gått 70 % av sträckan tonar nya kortet in och glider 7 px
 *    på plats (ease-out, 250 ms). Med HOLE_EASE nås 70 % tidigt, så kortet
 *    landar ungefär när rutan gör det.
 */

export type Rect = { top: number; left: number; width: number; height: number };

export type TourTimings = {
  /** Gamla kortet ut. */
  cardOutMs: number;
  /** Paus innan rutan börjar röra sig. */
  holeDelayMs: number;
  /** Rutans svep. */
  holeMs: number;
  /** Andel av rutans sträcka innan nya kortet börjar tona in. */
  cardInAtProgress: number;
  /** Nya kortet in. */
  cardInMs: number;
  /** Hur långt kortet glider ut respektive in (px). */
  cardOutShift: number;
  cardInShift: number;
};

export const TOUR_TIMINGS: TourTimings = {
  cardOutMs: 150,
  holeDelayMs: 100,
  holeMs: 450,
  cardInAtProgress: 0.7,
  cardInMs: 250,
  cardOutShift: 6,
  cardInShift: 7,
};

/**
 * prefers-reduced-motion: lugnare, inte avstängt. Rutan glider fortfarande
 * (kortare, utan att kortet följer med i sidled), och kortet tonar utan att
 * glida. Ett hopp rakt till nästa mål såg ut som ett klipp.
 */
export const REDUCED_TOUR_TIMINGS: TourTimings = {
  cardOutMs: 150,
  holeDelayMs: 60,
  holeMs: 320,
  cardInAtProgress: 0.8,
  cardInMs: 220,
  cardOutShift: 0,
  cardInShift: 0,
};

/** Samma kurva som CSS `cubic-bezier(x1, y1, x2, y2)`. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (s: number) => ((ax * s + bx) * s + cx) * s;
  const sampleY = (s: number) => ((ay * s + by) * s + cy) * s;
  const slopeX = (s: number) => (3 * ax * s + 2 * bx) * s + cx;

  return (t: number) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    // Newton först, bisektion som reserv där lutningen är för flack.
    let s = t;
    for (let i = 0; i < 8; i++) {
      const error = sampleX(s) - t;
      if (Math.abs(error) < 1e-6) return sampleY(s);
      const slope = slopeX(s);
      if (Math.abs(slope) < 1e-6) break;
      s -= error / slope;
    }
    let lo = 0;
    let hi = 1;
    s = t;
    for (let i = 0; i < 30; i++) {
      const x = sampleX(s);
      if (Math.abs(x - t) < 1e-6) break;
      if (x < t) lo = s;
      else hi = s;
      s = (lo + hi) / 2;
    }
    return sampleY(s);
  };
}

/** Rutans svep: snabb start, lång mjuk inbromsning, ingen studs. */
export const HOLE_EASE = cubicBezier(0.32, 0.72, 0, 1);
/** Kortet in (samma som --fd-ease). */
export const CARD_IN_EASE = cubicBezier(0.23, 1, 0.32, 1);
/** Kortet ut. */
export const CARD_OUT_EASE = cubicBezier(0.55, 0, 1, 0.45);

export function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

export function lerpRect(from: Rect, to: Rect, amount: number): Rect {
  return {
    top: lerp(from.top, to.top, amount),
    left: lerp(from.left, to.left, amount),
    width: lerp(from.width, to.width, amount),
    height: lerp(from.height, to.height, amount),
  };
}

/** Hela pixlar: kanterna avrundas, inte bara positionen, så bredden följer med. */
export function roundRect(rect: Rect): Rect {
  const left = Math.round(rect.left);
  const top = Math.round(rect.top);
  return {
    left,
    top,
    width: Math.max(0, Math.round(rect.left + rect.width) - left),
    height: Math.max(0, Math.round(rect.top + rect.height) - top),
  };
}

/** Ett hål utan yta mitt på skärmen: stopp utan mål krymper rutan hit. */
export function centerPoint(viewportWidth: number, viewportHeight: number): Rect {
  return { top: viewportHeight / 2, left: viewportWidth / 2, width: 0, height: 0 };
}

export function padRect(rect: Rect, padding: number): Rect {
  return {
    top: rect.top - padding,
    left: rect.left - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
}

/**
 * Mörkläggningen som ett enda lager: hela skärmen minus ett rundat hål,
 * klippt med `evenodd`. Inga rutor som möts, alltså inga skarvar.
 */
export function scrimClipPath(rect: Rect, radius: number): string {
  const outer = "M-10 -10H100000V100000H-10Z";
  if (rect.width < 1 || rect.height < 1) return `path(evenodd, "${outer}")`;
  const { top, left, width, height } = rect;
  const r = Math.min(radius, width / 2, height / 2);
  const right = left + width;
  const bottom = top + height;
  const hole =
    `M${left + r} ${top}H${right - r}A${r} ${r} 0 0 1 ${right} ${top + r}` +
    `V${bottom - r}A${r} ${r} 0 0 1 ${right - r} ${bottom}` +
    `H${left + r}A${r} ${r} 0 0 1 ${left} ${bottom - r}` +
    `V${top + r}A${r} ${r} 0 0 1 ${left + r} ${top}Z`;
  return `path(evenodd, "${outer}${hole}")`;
}

const CARD_GAP = 16;
const EDGE = 16;

/**
 * Kortets övre vänstra hörn. Under målet om det får plats (eller om det är
 * mer plats där), annars ovanför; alltid inom skärmen. Utan mål: centrerat.
 */
export function placeCard(
  target: Rect | null,
  card: { width: number; height: number },
  viewport: { width: number; height: number },
): { top: number; left: number } {
  const maxTop = Math.max(EDGE, viewport.height - card.height - EDGE);
  const maxLeft = Math.max(EDGE, viewport.width - card.width - EDGE);
  if (!target || target.width < 1 || target.height < 1) {
    return {
      top: Math.min(Math.max(EDGE, (viewport.height - card.height) / 2), maxTop),
      left: Math.min(Math.max(EDGE, (viewport.width - card.width) / 2), maxLeft),
    };
  }
  const targetBottom = target.top + target.height;
  const spaceBelow = viewport.height - targetBottom;
  const needed = card.height + CARD_GAP + EDGE;
  const placeBelow = spaceBelow >= needed || spaceBelow > target.top;
  const top = placeBelow
    ? Math.min(targetBottom + CARD_GAP, maxTop)
    : Math.max(EDGE, target.top - CARD_GAP - card.height);
  const left = Math.min(Math.max(EDGE, target.left + target.width / 2 - card.width / 2), maxLeft);
  return { top, left };
}

/** Om elementet (med marginal) inte ryms helt i bild behöver sidan skrollas. */
export function needsScroll(rect: Rect, viewportHeight: number): boolean {
  return rect.top < 0 || rect.top + rect.height > viewportHeight;
}

/**
 * Skrollpositionen som ställer målet mitt i bild, eller med överkanten
 * nära toppen om det är högre än skärmen. Räknas ut innan animationen
 * startar, så att rutan och sidan kan glida i samma svep.
 */
export function scrollTargetFor(
  rect: Rect,
  scrollY: number,
  viewportHeight: number,
  maxScroll: number,
): number {
  const documentTop = rect.top + scrollY;
  const offset = rect.height > viewportHeight - EDGE * 2 ? EDGE : (viewportHeight - rect.height) / 2;
  return Math.round(Math.min(Math.max(0, documentTop - offset), Math.max(0, maxScroll)));
}

/** Tiden (0–1) då en kurva når en viss andel av sträckan. */
export function timeAtProgress(ease: (t: number) => number, progress: number): number {
  if (progress <= 0) return 0;
  if (progress >= 1) return 1;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (ease(mid) < progress) lo = mid;
    else hi = mid;
  }
  return hi;
}
