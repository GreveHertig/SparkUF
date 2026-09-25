/**
 * Geometrin bakom rundturens spotlight (_components/FondaTour.tsx).
 *
 * Mörkläggningen är fyra enfärgade paneler runt hålet och fyra små hörnbitar
 * som rundar det. Allt flyttas med `transform` (compositorn), och enfärgade
 * ytor kostar nästan inget att flytta. (En box-shadow på 200vmax, som förut,
 * måste rastreras om när den flyttas och tappade bildrutor.)
 *
 * Placeringen räknas inom den säkra ytan: under sidhuvudet (som är sticky)
 * och ovanför demoraden (som är fixerad). Kortet täcker aldrig hålet.
 */

export type TourRect = { top: number; left: number; width: number; height: number };
export type Size = { width: number; height: number };
/** Den del av viewporten som varken täcks av sidhuvudet eller demoraden. */
export type SafeArea = { top: number; bottom: number };
export type CardPlacement = "right" | "left" | "below" | "above" | "stacked" | "center";
export type StopLayout = {
  hole: TourRect | null;
  card: { x: number; y: number; width: number };
  placement: CardPlacement;
};
/** Kortets höjd vid en viss bredd (texten bryts om när bredden ändras). */
export type MeasureCard = (width: number) => number;

export const SPOTLIGHT_PADDING = 8;
export const CARD_WIDTH = 380;
export const CARD_MIN_SIDE_WIDTH = 300;
export const HOLE_RADIUS = 16;
const GAP = 16;
const EDGE = 16;

/** Målets ruta med luft runt om, i viewport-koordinater. */
export function padRect(rect: TourRect, padding = SPOTLIGHT_PADDING): TourRect {
  return {
    top: rect.top - padding,
    left: rect.left - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
}

export function rectsAreClose(a: TourRect, b: TourRect, tolerance = 0.5): boolean {
  return (
    Math.abs(a.top - b.top) < tolerance &&
    Math.abs(a.left - b.left) < tolerance &&
    Math.abs(a.width - b.width) < tolerance &&
    Math.abs(a.height - b.height) < tolerance
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/** Hålet beskuret till en yta, så att det aldrig går in under sidhuvudet, demoraden eller kortet. */
export function clipToSafeArea(rect: TourRect, safe: SafeArea): TourRect {
  const top = Math.max(rect.top, safe.top + 4);
  const bottom = Math.min(rect.top + rect.height, safe.bottom - 4);
  return { top, left: rect.left, width: rect.width, height: Math.max(0, bottom - top) };
}

export function overlapArea(a: TourRect, b: TourRect): number {
  const width = Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left);
  const height = Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top);
  return Math.max(0, width) * Math.max(0, height);
}

/** Kortets bredd på en skärm: 380 px, eller skärmens bredd minus kanterna. */
export function fullCardWidth(viewport: Size): number {
  return Math.min(CARD_WIDTH, viewport.width - EDGE * 2);
}

/** Var kortet och hålet hamnar för ett mål som står där det står nu. */
export function layoutStop(target: TourRect | null, measure: MeasureCard, viewport: Size, safe: SafeArea): StopLayout {
  const width = fullCardWidth(viewport);
  const height = measure(width);
  const minY = safe.top + EDGE;
  const maxY = (h: number) => safe.bottom - EDGE - h;
  const centerX = (hole: TourRect, w: number) =>
    clamp(hole.left + hole.width / 2 - w / 2, EDGE, viewport.width - EDGE - w);

  if (!target) {
    return {
      hole: null,
      card: {
        x: Math.round((viewport.width - width) / 2),
        y: Math.round(clamp((safe.top + safe.bottom - height) / 2, minY, maxY(height))),
        width,
      },
      placement: "center",
    };
  }

  const hole = clipToSafeArea(target, safe);
  const spaceRight = viewport.width - EDGE - (hole.left + hole.width) - GAP;
  const spaceLeft = hole.left - GAP - EDGE;
  const side = (w: number, h: number): StopLayout | null => {
    const y = Math.round(clamp(hole.top + hole.height / 2 - h / 2, minY, maxY(h)));
    if (spaceRight >= w) return { hole, card: { x: Math.round(hole.left + hole.width + GAP), y, width: w }, placement: "right" };
    if (spaceLeft >= w) return { hole, card: { x: Math.round(hole.left - GAP - w), y, width: w }, placement: "left" };
    return null;
  };

  // 1. Bredvid målet med full bredd.
  const wide = side(width, height);
  if (wide) return wide;

  // 2. Under eller över målet.
  const holeBottom = hole.top + hole.height;
  if (safe.bottom - EDGE - (holeBottom + GAP) >= height) {
    return { hole, card: { x: Math.round(centerX(hole, width)), y: Math.round(holeBottom + GAP), width }, placement: "below" };
  }
  if (hole.top - GAP - minY >= height) {
    return { hole, card: { x: Math.round(centerX(hole, width)), y: Math.round(hole.top - GAP - height), width }, placement: "above" };
  }

  // 3. Bredvid målet med ett smalare kort, om det finns minst 300 px.
  const sideWidth = Math.floor(Math.min(width, Math.max(spaceRight, spaceLeft)));
  if (sideWidth >= CARD_MIN_SIDE_WIDTH) {
    const narrow = side(sideWidth, measure(sideWidth));
    if (narrow) return narrow;
  }

  // 4. Staplat: kortet längst ner i ytan och hålet visar den del av målet
  //    som ryms ovanför det. (På mobil blir det ett ark längst ner.)
  const y = Math.round(clamp(maxY(height), minY, maxY(height)));
  const clipped = clipToSafeArea(target, { top: safe.top, bottom: y - GAP + 4 });
  return {
    hole: clipped,
    card: { x: Math.round(centerX(clipped, width)), y, width },
    placement: "stacked",
  };
}

/** Hålet för en placering som redan är vald, när målet har flyttat sig (t.ex. vid skroll). */
export function holeForPlacement(target: TourRect, layout: StopLayout, safe: SafeArea): TourRect {
  if (layout.placement === "stacked") return clipToSafeArea(target, { top: safe.top, bottom: layout.card.y - GAP + 4 });
  return clipToSafeArea(target, safe);
}

/** Om kortet ligger ovanpå hålet. */
export function cardCoversHole(layout: StopLayout, cardHeight: number): boolean {
  if (!layout.hole) return false;
  const card = { top: layout.card.y, left: layout.card.x, width: layout.card.width, height: cardHeight };
  return overlapArea(card, layout.hole) > 0;
}

/**
 * Hur sidan ska skrolla för att visa målet väl. Skrollar inte alls om målet
 * redan syns helt och kortet får plats bredvid, under eller över. Annars
 * provas målet i mitten, målet och kortet tillsammans i mitten, och målets
 * början överst. Det läge som visar hela målet och kräver minst skroll vinner.
 */
export function frameStop(
  target: TourRect,
  measure: MeasureCard,
  viewport: Size,
  safe: SafeArea,
  scroll: { y: number; max: number },
): { scrollTo: number; layout: StopLayout } {
  const fullyVisible = (rect: TourRect) =>
    rect.top >= safe.top + EDGE / 2 && rect.top + rect.height <= safe.bottom - EDGE / 2;
  const here = layoutStop(target, measure, viewport, safe);
  if (fullyVisible(target) && here.placement !== "stacked") return { scrollTo: scroll.y, layout: here };

  const room = safe.bottom - safe.top;
  const cardHeight = measure(fullCardWidth(viewport));
  const documentTop = target.top + scroll.y;
  const tops = [
    safe.top + (room - target.height) / 2,
    safe.top + (room - (target.height + GAP + cardHeight)) / 2,
    safe.top + EDGE,
  ];
  const options = tops.map((desiredTop) => {
    const scrollTo = Math.round(clamp(documentTop - desiredTop, 0, scroll.max));
    const moved = { ...target, top: documentTop - scrollTo };
    return { scrollTo, layout: layoutStop(moved, measure, viewport, safe), whole: fullyVisible(moved) };
  });
  const rank = (option: (typeof options)[number]) =>
    (option.layout.placement === "stacked" || !option.whole ? 1_000_000 : 0) + Math.abs(option.scrollTo - scroll.y);
  const best = options.reduce((winner, option) => (rank(option) < rank(winner) ? option : winner));
  return { scrollTo: best.scrollTo, layout: best.layout };
}

/** Glidets längd: längre sträcka, lite längre tid, inom ett lugnt spann. */
export function glideDuration(distance: number): number {
  return Math.round(clamp(380 + distance * 0.3, 420, 680));
}

/** En ruta i viewportens koordinater flyttad till sidans (dokumentets) koordinater. */
export function toDocument(rect: TourRect, scroll: { x: number; y: number }): TourRect {
  return { ...rect, top: rect.top + scroll.y, left: rect.left + scroll.x };
}

/** Panelernas storlek. Enfärgade ytor är billiga oavsett storlek. */
export const SHADE_SIZE = 40000;

export const SHADE_PARTS = ["top", "bottom", "left", "right", "tl", "tr", "bl", "br", "lid"] as const;
export type ShadePart = (typeof SHADE_PARTS)[number];

/**
 * Transformerna som lägger mörkläggningen runt `hole` (sidans koordinater).
 * Topp- och bottenpanelen är SHADE_SIZE i kvadrat, sidopanelerna är SHADE_SIZE
 * breda och 1 px höga och skalas till hålets höjd, hörnbitarna är HOLE_RADIUS
 * i kvadrat, och locket (som fyller hålet när det är stängt) är 1 px och
 * skalas till hålet.
 */
export function shadeTransforms(hole: TourRect): Record<ShadePart, string> {
  const s = SHADE_SIZE;
  const r = Math.min(HOLE_RADIUS, hole.width / 2, hole.height / 2);
  const x = hole.left;
  const y = hole.top;
  const right = hole.left + hole.width;
  const bottom = hole.top + hole.height;
  const t = (tx: number, ty: number, sx = 1, sy = 1) =>
    `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
  const corner = Math.max(0, r) / HOLE_RADIUS;
  return {
    top: t(x - s / 2, y - s),
    bottom: t(x - s / 2, bottom),
    left: t(x - s, y, 1, Math.max(0, hole.height)),
    right: t(right, y, 1, Math.max(0, hole.height)),
    tl: t(x, y, corner, corner),
    tr: t(right - r, y, corner, corner),
    bl: t(x, bottom - r, corner, corner),
    br: t(right - r, bottom - r, corner, corner),
    lid: t(x, y, Math.max(0, hole.width), Math.max(0, hole.height)),
  };
}
