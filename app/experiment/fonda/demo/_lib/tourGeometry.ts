/**
 * Geometrin bakom rundturens spotlight (_components/FondaTour.tsx).
 *
 * Mörkläggningen är ett helskärmslager med ett hål som ritas med
 * `clip-path: path(evenodd, …)`. Varje stopp ger samma sekvens av
 * path-kommandon, bara med andra tal. Det gör att webbläsaren kan tweena
 * hålet mellan stoppen som en vanlig CSS-transition, utan att width/height/
 * top/left animeras och utan en box-shadow på 9999 px som målas om varje bildruta.
 */

export type TourRect = { top: number; left: number; width: number; height: number };

export const SPOTLIGHT_PADDING = 8;

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
export function scrimClipPath(viewport: { width: number; height: number }, hole: TourRect, radius: number): string {
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

/**
 * Var målet hamnar i viewporten när fönstret har skrollat det till mitten
 * (`scrollIntoView({ block: "center" })`), med hänsyn till att sidan inte
 * kan skrolla förbi sin början eller sitt slut. Låter spotlighten glida
 * direkt till slutläget samtidigt som sidan skrollar, i stället för att
 * jaga målet bildruta för bildruta.
 */
export function predictCenteredRect(
  rect: TourRect,
  scroll: { y: number; max: number },
  viewportHeight: number,
): { rect: TourRect; scrollTo: number } {
  const documentTop = rect.top + scroll.y;
  const ideal = documentTop - (viewportHeight - rect.height) / 2;
  const scrollTo = Math.min(Math.max(0, ideal), Math.max(0, scroll.max));
  return { rect: { ...rect, top: documentTop - scrollTo }, scrollTo };
}

/** Om målet redan syns helt, med marginal uppe och nere, behövs ingen skroll. */
export function isComfortablyVisible(
  rect: TourRect,
  viewportHeight: number,
  margins: { top: number; bottom: number },
): boolean {
  return rect.top >= margins.top && rect.top + rect.height <= viewportHeight - margins.bottom;
}

/** Kortets plats: under målet om det får plats, annars över, alltid innanför kanterna. */
export function placeCard(
  spot: TourRect | null,
  card: { width: number; height: number },
  viewport: { width: number; height: number },
  gap = 16,
): { x: number; y: number } {
  const edge = 16;
  if (!spot) {
    return {
      x: Math.round((viewport.width - card.width) / 2),
      y: Math.round((viewport.height - card.height) / 2),
    };
  }
  const x = Math.min(
    Math.max(edge, spot.left + spot.width / 2 - card.width / 2),
    viewport.width - card.width - edge,
  );
  const spaceBelow = viewport.height - (spot.top + spot.height) - gap - edge;
  const spaceAbove = spot.top - gap - edge;
  const placeBelow = spaceBelow >= card.height || spaceBelow >= spaceAbove;
  const y = placeBelow
    ? Math.min(spot.top + spot.height + gap, viewport.height - card.height - edge)
    : Math.max(edge, spot.top - gap - card.height);
  return { x: Math.round(Math.max(edge, x)), y: Math.round(y) };
}
