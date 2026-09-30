/**
 * Geometrin bakom rundturens spotlight (_components/FondaTour.tsx).
 *
 * Mörkläggningen är ett enda lager: en enfärgad yta över hela sidan med hålet
 * utskuret med `clip-path: path(evenodd, …)`. Hålets kanter ligger på hela
 * pixlar. (Förut bestod den av paneler som möttes vid hålets kanter, och när
 * en kant hamnade på en halv pixel syntes en ljus söm ut mot skärmkanten.)
 *
 * Hålet ryms inom den säkra ytan: under sidhuvudet (som är sticky) och
 * ovanför demoraden (som är fixerad). Kortet får också ligga över dem, eftersom
 * de är mörklagda under rundan. Kortet täcker aldrig hålet: det står bredvid,
 * under eller över målet. Ryms inte målet och kortet samtidigt står kortet
 * längst ner (eller överst) och hålet visar så mycket av målet som ryms; den
 * avskurna kanten blir rak, så att det syns att målet fortsätter.
 */

export type TourRect = { top: number; left: number; width: number; height: number };
export type Size = { width: number; height: number };
/** Den del av viewporten som varken täcks av sidhuvudet eller demoraden. */
export type SafeArea = { top: number; bottom: number };
export type CardPlacement = "right" | "left" | "below" | "above" | "stacked" | "center";
export type StopLayout = {
  hole: TourRect | null;
  /** Ytan hålet är beskuret till. Där målet fortsätter förbi den får hålet raka hörn. */
  area: SafeArea;
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

/**
 * Hålet beskuret till den säkra ytan, så att det aldrig går in under
 * sidhuvudet eller demoraden. Ett mål som fortsätter utanför ytan når ända
 * fram till kanten (FondaTour gör de hörnen raka).
 */
export function clipToSafeArea(rect: TourRect, safe: SafeArea): TourRect {
  const top = Math.max(rect.top, safe.top);
  const bottom = Math.min(rect.top + rect.height, safe.bottom);
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
  const centerX = (hole: TourRect, w: number) =>
    Math.round(clamp(hole.left + hole.width / 2 - w / 2, EDGE, viewport.width - EDGE - w));

  if (!target) {
    return {
      hole: null,
      area: safe,
      card: {
        x: Math.round((viewport.width - width) / 2),
        y: Math.round(clamp((safe.top + safe.bottom - height) / 2, safe.top + EDGE, safe.bottom - EDGE - height)),
        width,
      },
      placement: "center",
    };
  }

  const hole = clipToSafeArea(target, safe);
  const spaceRight = viewport.width - EDGE - (hole.left + hole.width) - GAP;
  const spaceLeft = hole.left - GAP - EDGE;

  /** Kortet bredvid, under eller över målet, med kortet inom `bounds`. */
  const beside = (bounds: SafeArea): StopLayout | null => {
    const minY = bounds.top + EDGE;
    const maxY = (h: number) => bounds.bottom - EDGE - h;
    const side = (w: number, h: number): StopLayout | null => {
      const y = Math.round(clamp(hole.top + hole.height / 2 - h / 2, minY, maxY(h)));
      if (spaceRight >= w) return { hole, area: safe, card: { x: Math.round(hole.left + hole.width + GAP), y, width: w }, placement: "right" };
      if (spaceLeft >= w) return { hole, area: safe, card: { x: Math.round(hole.left - GAP - w), y, width: w }, placement: "left" };
      return null;
    };

    // 1. Bredvid målet med full bredd.
    const wide = side(width, height);
    if (wide) return wide;

    // 2. Under eller över målet.
    const holeBottom = hole.top + hole.height;
    if (maxY(height) >= holeBottom + GAP) {
      return { hole, area: safe, card: { x: centerX(hole, width), y: Math.round(holeBottom + GAP), width }, placement: "below" };
    }
    if (hole.top - GAP - height >= minY) {
      return { hole, area: safe, card: { x: centerX(hole, width), y: Math.round(hole.top - GAP - height), width }, placement: "above" };
    }

    // 3. Bredvid målet med ett smalare kort, om det finns minst 300 px.
    const sideWidth = Math.floor(Math.min(width, Math.max(spaceRight, spaceLeft)));
    return sideWidth >= CARD_MIN_SIDE_WIDTH ? side(sideWidth, measure(sideWidth)) : null;
  };

  // Helst inom den säkra ytan; annars får kortet gå ut över sidhuvudet och demoraden.
  const placed = beside(safe) ?? beside({ top: 0, bottom: viewport.height });
  if (placed) return placed;

  // 4. Staplat: kortet längst ner eller överst, och hålet visar den del av
  //    målet som ryms bredvid kortet. Målets början ska synas; annars är
  //    längst ner förstahandsvalet, och överst vinner bara om det visar
  //    klart mer av målet. (På mobil blir det ett ark.)
  const stacked = (cardY: number, area: SafeArea): StopLayout => {
    const clipped = clipToSafeArea(target, area);
    return { hole: clipped, area, card: { x: centerX(clipped, width), y: cardY, width }, placement: "stacked" };
  };
  const bottomY = Math.round(viewport.height - EDGE - height);
  const atBottom = stacked(bottomY, { top: safe.top, bottom: Math.min(safe.bottom, bottomY - GAP) });
  const atTop = stacked(EDGE, { top: Math.max(safe.top, EDGE + height + GAP), bottom: safe.bottom });
  const showsStart = (layout: StopLayout) => layout.area.top <= target.top + 1;
  if (showsStart(atTop) !== showsStart(atBottom)) return showsStart(atTop) ? atTop : atBottom;
  return atTop.hole!.height > atBottom.hole!.height * 1.1 ? atTop : atBottom;
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
 * provas målet i mitten, målet och kortet tillsammans i mitten, målets
 * början överst och (om målet och kortet inte ryms ihop) målets början
 * strax under ett kort som står överst.
 * Vinner gör det läge som visar målets början och mest av målet, helst med
 * kortet inom den säkra ytan och med minst skroll.
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
    // Ryms inte målet och kortet i ytan: kortet överst, över sidhuvudet.
    // (En pixel extra, så att avrundningen av skrollen inte skjuter målet in under kortet.)
    ...(target.height + GAP + cardHeight > room - EDGE * 2 ? [EDGE + cardHeight + GAP + 1] : []),
  ];
  const options = tops.map((desiredTop) => {
    const scrollTo = Math.round(clamp(documentTop - desiredTop, 0, scroll.max));
    const moved = { ...target, top: documentTop - scrollTo };
    return { scrollTo, layout: layoutStop(moved, measure, viewport, safe) };
  });
  // I tur och ordning: målets början syns, så mycket av målet som möjligt
  // syns, kortet står inom den säkra ytan, och sidan skrollar så lite som
  // möjligt. Varje steg väger tyngre än alla steg efter.
  const rank = ({ scrollTo, layout }: (typeof options)[number]) => {
    const hole = layout.hole;
    const startHidden = !hole || hole.top > documentTop - scrollTo + 0.5;
    const hidden = Math.max(0, Math.round(target.height - (hole?.height ?? 0)));
    const cardOutside = layout.card.y < safe.top || layout.card.y + measure(layout.card.width) > safe.bottom;
    return (startHidden ? 1e12 : 0) + hidden * 1e6 + (cardOutside ? 1e5 : 0) + Math.min(Math.abs(scrollTo - scroll.y), 99_999);
  };
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

/** Hålet med alla kanter på hela pixlar, så att det aldrig antialiasas längs en rak kant. */
export function snapRect(rect: TourRect): TourRect {
  const left = Math.round(rect.left);
  const top = Math.round(rect.top);
  const right = Math.round(rect.left + rect.width);
  const bottom = Math.round(rect.top + rect.height);
  return { left, top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
}

/**
 * En rundad rektangel i hela pixlar. Radien kläms så att bågarna aldrig blir
 * större än halva sidan.
 */
export function roundedRectPath(rect: TourRect, radius: number): string {
  const { left: x, top: y, width: w, height: h } = snapRect(rect);
  const r = Math.max(0, Math.min(radius, Math.floor(w / 2), Math.floor(h / 2)));
  return [
    `M${x + r} ${y}`,
    `H${x + w - r}`,
    `A${r} ${r} 0 0 1 ${x + w} ${y + r}`,
    `V${y + h - r}`,
    `A${r} ${r} 0 0 1 ${x + w - r} ${y + h}`,
    `H${x + r}`,
    `A${r} ${r} 0 0 1 ${x} ${y + h - r}`,
    `V${y + r}`,
    `A${r} ${r} 0 0 1 ${x + r} ${y}`,
    "Z",
  ].join(" ");
}

/** Mörkläggningen: hela ytan (sidans storlek) minus hålet, som ett enda clip-path. */
export function scrimClipPath(area: Size, hole: TourRect | null, radius = HOLE_RADIUS): string {
  const outer = `M0 0H${Math.ceil(area.width)}V${Math.ceil(area.height)}H0Z`;
  if (!hole || hole.width < 1 || hole.height < 1) return `path(evenodd, "${outer}")`;
  return `path(evenodd, "${outer} ${roundedRectPath(hole, radius)}")`;
}

/**
 * En del av ett mål: en textrad eller ett kort, med kanterna räknade från
 * målets överkant. Rutan kapas aldrig mitt i en del.
 */
export type TourUnit = {
  top: number;
  bottom: number;
  /** Ett kort eller en panel (bakgrund eller ram) med innehåll i. */
  box: boolean;
  heading: boolean;
};

/**
 * Var ett mål som är för högt för att rymmas bredvid kortet kan kapas: den
 * nedersta kanten, högst `limit` från målets överkant, där ingen textdel
 * delas och inget kort delas (utom ett kort som ändå är högre än `limit`).
 * Minst en del som inte är en rubrik ska komma med, annars blir svaret null.
 */
export function cutBetweenUnits(units: TourUnit[], limit: number): number | null {
  const candidates = [...new Set(units.map((unit) => unit.bottom))].filter((b) => b <= limit).sort((a, b) => b - a);
  for (const cut of candidates) {
    const splits = units.some(
      (unit) => unit.top < cut - 0.5 && unit.bottom > cut + 0.5 && (!unit.box || unit.bottom - unit.top <= limit),
    );
    if (splits) continue;
    return units.some((unit) => !unit.box && !unit.heading && unit.bottom <= cut + 0.5) ? cut : null;
  }
  return null;
}
