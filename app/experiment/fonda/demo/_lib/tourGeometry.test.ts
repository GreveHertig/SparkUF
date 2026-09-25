import { describe, expect, it } from "vitest";
import {
  SHADE_SIZE,
  cardCoversHole,
  clipToSafeArea,
  frameStop,
  glideDuration,
  holeForPlacement,
  layoutStop,
  shadeTransforms,
  toDocument,
  type MeasureCard,
} from "./tourGeometry";

const desktop = { width: 1440, height: 900 };
const mobile = { width: 390, height: 844 };
/** Sidhuvudet slutar vid 121 px, demoraden börjar vid 844 px. */
const safe = { top: 121, bottom: 844 };
const mobileSafe = { top: 121, bottom: 737 };
/** Ett kort med ungefär lika mycket text som rundturens: smalare kort blir högre. */
const measure: MeasureCard = (width) => Math.round(290 * (380 / width));

/** Talen i en transform, i ordning. */
function numbers(transform: string): number[] {
  return (transform.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
}

describe("rundturens mörkläggning", () => {
  it("panelerna ligger kant i kant med hålet", () => {
    const hole = { top: 200, left: 100, width: 300, height: 120 };
    const t = shadeTransforms(hole);
    const [topX, topY] = numbers(t.top);
    expect(topY + SHADE_SIZE).toBe(200);
    expect(topX).toBe(100 - SHADE_SIZE / 2);
    expect(numbers(t.bottom)[1]).toBe(320);
    const [leftX, leftY, , leftScaleY] = numbers(t.left);
    expect(leftX + SHADE_SIZE).toBe(100);
    expect([leftY, leftScaleY]).toEqual([200, 120]);
    expect(numbers(t.right).slice(0, 2)).toEqual([400, 200]);
    expect(numbers(t.lid)).toEqual([100, 200, 300, 120]);
  });

  it("hörnbitarna sitter i hålets hörn och krymper med ett litet hål", () => {
    const t = shadeTransforms({ top: 0, left: 0, width: 300, height: 120 });
    expect(numbers(t.br)).toEqual([284, 104, 1, 1]);
    const small = shadeTransforms({ top: 0, left: 0, width: 10, height: 8 });
    expect(numbers(small.tl).slice(2)).toEqual([0.25, 0.25]);
  });
});

describe("rundturens placering", () => {
  it("hålet går aldrig in under sidhuvudet eller demoraden", () => {
    const clipped = clipToSafeArea({ top: 80, left: 0, width: 100, height: 900 }, safe);
    expect(clipped.top).toBeGreaterThan(safe.top);
    expect(clipped.top + clipped.height).toBeLessThan(safe.bottom);
  });

  it("lägger kortet bredvid målet när det finns plats", () => {
    const layout = layoutStop({ top: 349, left: 842, width: 454, height: 315 }, measure, desktop, safe);
    expect(layout.placement).toBe("left");
    expect(layout.card.x + layout.card.width).toBeLessThanOrEqual(842);
    expect(cardCoversHole(layout, measure(layout.card.width))).toBe(false);
  });

  it("lägger kortet under ett brett mål, och aldrig över demoraden", () => {
    const layout = layoutStop({ top: 200, left: 144, width: 1152, height: 200 }, measure, desktop, safe);
    expect(layout.placement).toBe("below");
    expect(layout.card.y + measure(layout.card.width)).toBeLessThanOrEqual(safe.bottom);
    expect(cardCoversHole(layout, measure(layout.card.width))).toBe(false);
  });

  it("använder ett smalare kort bredvid målet när 300-380 px finns", () => {
    // Ingångskorten på onboardingen: 304 px ledigt till höger.
    const onboarding = { top: 69, bottom: 844 };
    const layout = layoutStop({ top: 331, left: 336, width: 768, height: 243 }, measure, desktop, onboarding);
    expect(layout.placement).toBe("right");
    expect(layout.card.width).toBe(304);
    expect(cardCoversHole(layout, measure(layout.card.width))).toBe(false);
  });

  it("staplar ett mål som fyller ytan: hålet visar början och kortet står under", () => {
    const layout = layoutStop({ top: 130, left: 144, width: 1152, height: 1100 }, measure, desktop, safe);
    expect(layout.placement).toBe("stacked");
    expect(layout.card.y + measure(layout.card.width)).toBe(safe.bottom - 16);
    expect(cardCoversHole(layout, measure(layout.card.width))).toBe(false);
  });

  it("på mobil blir kortet ett ark längst ner och hålet slutar ovanför det", () => {
    const layout = layoutStop({ top: 150, left: 8, width: 374, height: 500 }, measure, mobile, mobileSafe);
    expect(layout.placement).toBe("stacked");
    expect(layout.card.x).toBe(16);
    expect(cardCoversHole(layout, measure(layout.card.width))).toBe(false);
  });

  it("räknar om hålet vid skroll utan att byta placering", () => {
    const layout = layoutStop({ top: 150, left: 8, width: 374, height: 500 }, measure, mobile, mobileSafe);
    const scrolled = holeForPlacement({ top: 60, left: 8, width: 374, height: 500 }, layout, mobileSafe);
    expect(scrolled.top).toBeGreaterThan(mobileSafe.top);
    expect(scrolled.top + scrolled.height).toBeLessThanOrEqual(layout.card.y);
  });

  it("centrerar kortet i den säkra ytan när stoppet saknar mål", () => {
    const layout = layoutStop(null, measure, desktop, safe);
    expect(layout.placement).toBe("center");
    expect(layout.card.x).toBe(530);
  });

  it("skrollar inte när målet redan syns och kortet får plats", () => {
    const { scrollTo } = frameStop({ top: 349, left: 842, width: 454, height: 315 }, measure, desktop, safe, { y: 0, max: 3000 });
    expect(scrollTo).toBe(0);
  });

  it("skrollar så att ett brett mål och kortet hamnar mitt i den säkra ytan", () => {
    const target = { top: 1500, left: 144, width: 1152, height: 200 };
    const { scrollTo, layout } = frameStop(target, measure, desktop, safe, { y: 0, max: 5000 });
    const expectedTop = safe.top + (safe.bottom - safe.top - (200 + 16 + 290)) / 2;
    expect(Math.abs(1500 - scrollTo - expectedTop)).toBeLessThanOrEqual(1);
    expect(layout.placement).toBe("below");
  });

  it("skrollar ett högt mål så att dess början syns under sidhuvudet", () => {
    const target = { top: 1500, left: 144, width: 1152, height: 1100 };
    const { scrollTo } = frameStop(target, measure, desktop, safe, { y: 0, max: 5000 });
    expect(1500 - scrollTo).toBe(safe.top + 16);
  });

  it("räknar med att sidan inte kan skrolla förbi slutet", () => {
    const target = { top: 1500, left: 144, width: 1152, height: 200 };
    const { scrollTo } = frameStop(target, measure, desktop, safe, { y: 0, max: 800 });
    expect(scrollTo).toBe(800);
  });

  it("kortet täcker aldrig hålet, på dator eller mobil, för mål av alla storlekar", () => {
    for (const [vp, area] of [[desktop, safe], [mobile, mobileSafe]] as const) {
      for (const height of [40, 120, 300, 500, 800, 1400]) {
        for (const left of [8, 144, 600]) {
          const width = Math.min(vp.width - left - 8, 1152);
          if (width < 40) continue;
          const { layout } = frameStop({ top: 1200, left, width, height }, measure, vp, area, { y: 0, max: 8000 });
          expect(cardCoversHole(layout, measure(layout.card.width)), `${vp.width} ${left} ${width}x${height}`).toBe(false);
          expect(layout.card.x).toBeGreaterThanOrEqual(16);
          expect(layout.card.x + layout.card.width).toBeLessThanOrEqual(vp.width - 16);
        }
      }
    }
  });

  it("flyttar en ruta från viewportens till sidans koordinater", () => {
    expect(toDocument({ top: 100, left: 20, width: 10, height: 10 }, { x: 0, y: 500 })).toEqual({
      top: 600,
      left: 20,
      width: 10,
      height: 10,
    });
  });

  it("glidet är lugnt och längre för längre sträckor", () => {
    expect(glideDuration(0)).toBe(420);
    expect(glideDuration(2000)).toBe(680);
    expect(glideDuration(400)).toBeGreaterThan(glideDuration(100));
  });
});
