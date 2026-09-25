/**
 * Geometrin bakom rundturens spotlight (_components/FondaTour.tsx).
 *
 * Mörkläggningen är ett helskärmslager med ett hål som ritas med
 * `clip-path: path(evenodd, …)`. Varje stopp ger samma sekvens av
 * path-kommandon, bara med andra tal. Det gör att webbläsaren kan tweena
 * hålet mellan stoppen som en vanlig CSS-transition, utan att width/height/
 * top/left animeras och utan en box-shadow på 9999 px som målas om varje bildruta.
 *
 * Placeringen räknas inom den säkra ytan: under sidhuvudet (som är sticky)
 * och ovanför demoraden (som är fixerad). Där hamnar både hålet och kortet.
 */

export type TourRect = { top: number; left: number; width: number; height: number };
export type Size = { width: number; height: number };
/** Den del av viewporten som varken täcks av sidhuvudet eller demoraden. */
export type SafeArea = { top: number; bottom: number };
export type CardPlacement = "right" | "left" | "below" | "above" | "docked" | "sheet" | "center";
export type StopLayout = { hole: TourRect | null; card: { x: number; y: number }; placement: CardPlacement };

export const SPOTLIGHT_PADDING = 8;
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

/** En ruta med storleken noll i mitten av `rect`, dit hålet krymper mellan stoppen. */
export function collapseRect(rect: TourRect): TourRect {
  return { top: rect.top + rect.height / 2, left: rect.left + rect.width / 2, width: 0, height: 0 };
}

export function rectsAreClose(a: TourRect, b: TourRect, tolerance = 0.5): boolean {
  return (
    Math.abs(a.top - b.top) < tolerance &&
    Math.abs(a.left - b.left) < tolerance &&
    Math.abs(a.width - b.width) < tolerance &&
    Math.abs(a.height - b.height) < tolerance
  );
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/**
 * En rundad rektangel som alltid består av samma kommandon (fyra linjer,
 * fyra bågar), även när den har storleken noll. Radien kläms så att bågarna
 * aldrig blir större än halva sidan.
 */
export function roundedRectPath(rect: TourRect, radius: number): string {
  const x = round(rect.left);
  const y = round(rect.top);
  const w = round(Math.max(0, rect.width));
  const h = round(Math.max(0, rect.height));
  const r = round(Math.max(0, Math.min(radius, w / 2, h / 2)));
  return [
    `M${round(x + r)} ${y}`,
    `H${round(x + w - r)}`,
    `A${r} ${r} 0 0 1 ${round(x + w)} ${round(y + r)}`,
    `V${round(y + h - r)}`,
    `A${r} ${r} 0 0 1 ${round(x + w - r)} ${round(y + h)}`,
    `H${round(x + r)}`,
    `A${r} ${r} 0 0 1 ${x} ${round(y + h - r)}`,
    `V${round(y + r)}`,
    `A${r} ${r} 0 0 1 ${round(x + r)} ${y}`,
    "Z",
  ].join(" ");
}

/** Mörkläggningen: hela viewporten minus hålet. */
export function scrimClipPath(viewport: Size, hole: TourRect, radius: number): string {
  const outer = `M0 0H${viewport.width}V${viewport.height}H0Z`;
  return `path(evenodd, "${outer} ${roundedRectPath(hole, radius)}")`;
}

/** Ringen runt hålet: ett band som är `thickness` px brett, strax utanför hålet. */
export function ringClipPath(hole: TourRect, radius: number, thickness: number): string {
  const outer = {
    top: hole.top - thickness,
    left: hole.left - thickness,
    width: hole.width + thickness * 2,
    height: hole.height + thickness * 2,
  };
  return `path(evenodd, "${roundedRectPath(outer, radius + thickness)} ${roundedRectPath(hole, radius)}")`;
}

/** Hålet beskuret till den säkra ytan, så att det aldrig går in under sidhuvudet eller demoraden. */
export function clipToSafeArea(rect: TourRect, safe: SafeArea): TourRect {
  const top = Math.max(rect.top, safe.top + 4);
  const bottom = Math.min(rect.top + rect.height, safe.bottom - 4);
  return { top, left: rect.left, width: rect.width, height: Math.max(0, bottom - top) };
}

function overlaps(card: TourRect, hole: TourRect): boolean {
  return (
    card.left < hole.left + hole.width &&
    card.left + card.width > hole.left &&
    card.top < hole.top + hole.height &&
    card.top + card.height > hole.top
  );
}

/** På smal skärm är kortet lika brett som skärmen och läggs som ett ark längst ner. */
function isSheet(card: Size, viewport: Size): boolean {
  return card.width >= viewport.width - EDGE * 2 - 1;
}

/** Ryms kortet bredvid målet? I så fall på vilken sida (höger först). */
function sidePlacement(target: TourRect, card: Size, viewport: Size): "right" | "left" | null {
  const spaceRight = viewport.width - EDGE - (target.left + target.width) - GAP;
  const spaceLeft = target.left - GAP - EDGE;
  if (spaceRight >= card.width) return "right";
  if (spaceLeft >= card.width) return "left";
  return null;
}

/** Var kortet och hålet hamnar för ett mål som står där det står nu. */
export function layoutStop(target: TourRect | null, card: Size, viewport: Size, safe: SafeArea): StopLayout {
  const minY = safe.top + EDGE;
  const maxY = safe.bottom - EDGE - card.height;
  if (!target) {
    return {
      hole: null,
      card: { x: Math.round((viewport.width - card.width) / 2), y: Math.round(clamp((safe.top + safe.bottom - card.height) / 2, minY, maxY)) },
      placement: "center",
    };
  }

  const hole = clipToSafeArea(target, safe);
  const centerX = clamp(hole.left + hole.width / 2 - card.width / 2, EDGE, viewport.width - EDGE - card.width);
  const side = sidePlacement(hole, card, viewport);
  if (side) {
    const x = side === "right" ? hole.left + hole.width + GAP : hole.left - GAP - card.width;
    const y = clamp(hole.top + hole.height / 2 - card.height / 2, minY, maxY);
    return { hole, card: { x: Math.round(x), y: Math.round(y) }, placement: side };
  }

  const holeBottom = hole.top + hole.height;
  if (safe.bottom - EDGE - (holeBottom + GAP) >= card.height) {
    return { hole, card: { x: Math.round(centerX), y: Math.round(holeBottom + GAP) }, placement: "below" };
  }
  if (hole.top - GAP - minY >= card.height) {
    return { hole, card: { x: Math.round(centerX), y: Math.round(hole.top - GAP - card.height) }, placement: "above" };
  }
  // Smal skärm (kortet är lika brett som skärmen): kortet blir ett ark längst
  // ner, och spotlighten visar den del av målet som syns ovanför arket.
  if (isSheet(card, viewport)) {
    const y = clamp(maxY, minY, maxY);
    return {
      hole: clipToSafeArea(target, { top: safe.top, bottom: y - GAP / 2 }),
      card: { x: Math.round(EDGE), y: Math.round(y) },
      placement: "sheet",
    };
  }
  // Ett mål som fyller större delen av ytan: kortet dockas i nedre högra
  // hörnet, alltid på samma ställe.
  if (hole.height > (safe.bottom - safe.top) * 0.66) {
    return {
      hole,
      card: { x: Math.round(viewport.width - EDGE - card.width), y: Math.round(clamp(maxY, minY, maxY)) },
      placement: "docked",
    };
  }
  // Annars nära målet: nästan under eller nästan över, det som täcker minst.
  const below = { x: centerX, y: clamp(maxY, minY, maxY), placement: "below" as const };
  const above = { x: centerX, y: minY, placement: "above" as const };
  const covered = (c: { x: number; y: number }) => overlapArea({ top: c.y, left: c.x, ...card }, hole);
  const best = covered(above) < covered(below) ? above : below;
  return { hole, card: { x: Math.round(best.x), y: Math.round(best.y) }, placement: best.placement };
}

function overlapArea(a: TourRect, b: TourRect): number {
  const width = Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left);
  const height = Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top);
  return Math.max(0, width) * Math.max(0, height);
}

/**
 * Hur sidan ska skrolla för att visa målet väl: målet och kortet tillsammans
 * mitt i den säkra ytan, eller målets början överst om det är för högt.
 * Skrollar inte alls om målet redan syns helt och kortet får plats utan att
 * täcka det.
 */
export function frameStop(
  target: TourRect,
  card: Size,
  viewport: Size,
  safe: SafeArea,
  scroll: { y: number; max: number },
): { scrollTo: number; layout: StopLayout } {
  const current = layoutStop(target, card, viewport, safe);
  const fullyVisible = target.top >= safe.top + EDGE / 2 && target.top + target.height <= safe.bottom - EDGE / 2;
  if (fullyVisible && !cardCoversHole(current, card)) return { scrollTo: scroll.y, layout: current };

  const room = safe.bottom - safe.top;
  const stacked = target.height + GAP + card.height;
  let desiredTop: number;
  if (isSheet(card, viewport) && stacked > room - 2 * EDGE) {
    // Arket ligger längst ner, så målets början ska stå direkt under sidhuvudet.
    desiredTop = safe.top + EDGE;
  } else if (sidePlacement(target, card, viewport) && target.height <= room - 2 * EDGE) {
    desiredTop = safe.top + (room - target.height) / 2;
  } else if (!sidePlacement(target, card, viewport) && stacked <= room - 2 * EDGE) {
    desiredTop = safe.top + (room - stacked) / 2;
  } else if (target.height <= room - 2 * EDGE) {
    desiredTop = safe.top + (room - target.height) / 2;
  } else {
    desiredTop = safe.top + EDGE;
  }

  const documentTop = target.top + scroll.y;
  const scrollTo = Math.round(clamp(documentTop - desiredTop, 0, scroll.max));
  const moved = { ...target, top: documentTop - scrollTo };
  return { scrollTo, layout: layoutStop(moved, card, viewport, safe) };
}

/** Om kortet ligger ovanpå hålet (bara tillåtet när det är dockat). */
export function cardCoversHole(layout: StopLayout, card: Size): boolean {
  if (!layout.hole) return false;
  return overlaps({ top: layout.card.y, left: layout.card.x, width: card.width, height: card.height }, layout.hole);
}

/** Glidets längd: längre sträcka, lite längre tid, inom ett lugnt spann. */
export function glideDuration(distance: number): number {
  return Math.round(clamp(380 + distance * 0.3, 420, 680));
}

/** easeInOutCubic, samma kurva som CSS-variabeln --fdd-tour-move. */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
