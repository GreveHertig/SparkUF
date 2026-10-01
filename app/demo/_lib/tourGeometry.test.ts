import { describe, expect, it } from "vitest";
import {
  cardCoversHole,
  cutBetweenUnits,
  clipToSafeArea,
  frameStop,
  glideDuration,
  layoutStop,
  roundedRectPath,
  scrimClipPath,
  snapRect,
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

describe("rundturens mörkläggning", () => {
  it("är ett enda lager: hela sidan minus hålet", () => {
    const clip = scrimClipPath({ width: 1440, height: 3000 }, { top: 200, left: 100, width: 300, height: 120 });
    expect(clip.startsWith('path(evenodd, "M0 0H1440V3000H0Z M')).toBe(true);
    expect(clip.match(/M/g)).toHaveLength(2);
  });

  it("utan hål täcker den hela sidan", () => {
    expect(scrimClipPath({ width: 1440, height: 3000 }, null)).toBe('path(evenodd, "M0 0H1440V3000H0Z")');
  });

  it("lägger hålets kanter på hela pixlar, så att inga sömmar kan uppstå", () => {
    expect(snapRect({ top: 330.52, left: 843.91, width: 452.09, height: 240.78 })).toEqual({
      top: 331,
      left: 844,
      width: 452,
      height: 240,
    });
    const path = roundedRectPath({ top: 330.52, left: 843.91, width: 452.09, height: 240.78 }, 16);
    expect(path).not.toMatch(/\d\.\d/);
  });

  it("radien kläms till halva sidan", () => {
    expect(roundedRectPath({ top: 0, left: 0, width: 10, height: 4 }, 16)).toContain("A2 2");
  });
});

describe("rundturens placering", () => {
  it("hålet går aldrig in under sidhuvudet eller demoraden, men når ända fram till dem", () => {
    const clipped = clipToSafeArea({ top: 80, left: 0, width: 100, height: 900 }, safe);
    expect(clipped.top).toBe(safe.top);
    expect(clipped.top + clipped.height).toBe(safe.bottom);
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

  it("staplar ett mål som inte ryms med kortet: kortet längst ner, hålet slutar ovanför det", () => {
    const layout = layoutStop({ top: 130, left: 144, width: 1152, height: 1100 }, measure, desktop, safe);
    expect(layout.placement).toBe("stacked");
    expect(layout.card.y + measure(layout.card.width)).toBe(desktop.height - 16);
    expect(layout.hole!.top).toBe(130);
    expect(layout.hole!.top + layout.hole!.height).toBe(layout.card.y - 16);
    // Hålet är avskuret nertill, så där får det raka hörn.
    expect(layout.area.bottom).toBe(layout.card.y - 16);
    expect(cardCoversHole(layout, measure(layout.card.width))).toBe(false);
  });

  it("lägger kortet över sidhuvudet hellre än över målet: ingångskorten på en liten skärm", () => {
    // Stopp 2 på 1280x720: inom den säkra ytan ryms kortet inte bredvid, under eller över.
    const small = { width: 1280, height: 720 };
    const onboarding = { top: 69, bottom: 664 };
    const target = { top: 323, left: 256, width: 768, height: 241 };
    const layout = layoutStop(target, measure, small, onboarding);
    expect(layout.placement).toBe("above");
    expect(layout.hole).toEqual(target);
    expect(layout.card.y).toBeGreaterThanOrEqual(16);
    expect(cardCoversHole(layout, measure(layout.card.width))).toBe(false);
  });

  it("på mobil blir kortet ett ark längst ner och hålet slutar ovanför det", () => {
    const layout = layoutStop({ top: 150, left: 8, width: 374, height: 500 }, measure, mobile, mobileSafe);
    expect(layout.placement).toBe("stacked");
    expect(layout.card.x).toBe(16);
    expect(cardCoversHole(layout, measure(layout.card.width))).toBe(false);
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

  it("skrollar ett högt mål så att dess början syns, och visar så mycket av det som ryms", () => {
    const target = { top: 1500, left: 144, width: 1152, height: 1100 };
    const { scrollTo, layout } = frameStop(target, measure, desktop, safe, { y: 0, max: 5000 });
    expect(layout.hole!.top).toBe(1500 - scrollTo);
    // Kortet överst (över sidhuvudet) ger mer plats åt målet än kortet längst ner.
    expect(layout.card.y).toBe(17);
    expect(1500 - scrollTo).toBe(16 + 290 + 16 + 1);
  });

  it("räknar med att skrollen avrundas: pulsens första rad på 1366x768 ryms under kortet", () => {
    const viewport = { width: 1366, height: 768 };
    const area = { top: 122, bottom: 712 };
    const target = { top: 443.59375, left: 107, width: 1152, height: 310 };
    const { layout } = frameStop(target, () => 329, viewport, area, { y: 0, max: 430 });
    expect(layout.hole!.height).toBeCloseTo(310);
    expect(cardCoversHole(layout, 329)).toBe(false);
  });

  it("räknar med att sidan inte kan skrolla förbi slutet", () => {
    const target = { top: 1500, left: 144, width: 1152, height: 200 };
    const { scrollTo } = frameStop(target, measure, desktop, safe, { y: 0, max: 800 });
    expect(scrollTo).toBe(800);
  });

  it("kortet täcker aldrig hålet, och hålet visar hela målet när det går, för mål av alla storlekar", () => {
    for (const [vp, area] of [[desktop, safe], [mobile, mobileSafe]] as const) {
      for (const height of [40, 120, 300, 500, 800, 1400]) {
        for (const left of [8, 144, 600]) {
          const width = Math.min(vp.width - left - 8, 1152);
          if (width < 40) continue;
          const name = `${vp.width} ${left} ${width}x${height}`;
          const { layout, scrollTo } = frameStop({ top: 1200, left, width, height }, measure, vp, area, { y: 0, max: 8000 });
          const moved = { top: 1200 - scrollTo, left, width, height };
          expect(cardCoversHole(layout, measure(layout.card.width)), name).toBe(false);
          // Målets början syns alltid.
          expect(layout.hole!.top, name).toBe(moved.top);
          if (layout.placement !== "stacked") expect(layout.hole, name).toEqual(clipToSafeArea(moved, area));
          expect(layout.card.x).toBeGreaterThanOrEqual(16);
          expect(layout.card.x + layout.card.width).toBeLessThanOrEqual(vp.width - 16);
        }
      }
    }
  });

  it("skrollar ett mål som inte ryms med kortet så att så mycket som möjligt av det syns", () => {
    // Simuleringen på 1280x720: målet och kortet ryms inte samtidigt.
    const small = { width: 1280, height: 720 };
    const area = { top: 122, bottom: 664 };
    const target = { top: 900, left: 64, width: 1152, height: 283 };
    const { layout } = frameStop(target, measure, small, area, { y: 0, max: 3000 });
    const other = layoutStop({ ...target, top: 300 }, measure, small, area);
    expect(layout.hole!.height).toBeGreaterThanOrEqual(other.hole!.height);
    expect(cardCoversHole(layout, measure(layout.card.width))).toBe(false);
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

describe("att kapa ett mål som inte ryms", () => {
  const text = (top: number, bottom: number, heading = false) => ({ top, bottom, box: false, heading });
  const box = (top: number, bottom: number) => ({ top, bottom, box: true, heading: false });

  it("kapar mellan två hela rader, aldrig mitt i en", () => {
    const units = [text(0, 35, true), box(50, 150), text(70, 130), box(150, 250), text(170, 230), box(250, 350), text(270, 330)];
    expect(cutBetweenUnits(units, 280)).toBe(250);
    expect(cutBetweenUnits(units, 249)).toBe(150);
  });

  it("blir aldrig bara rubriken", () => {
    const units = [text(0, 35, true), box(50, 150), text(70, 130)];
    expect(cutBetweenUnits(units, 100)).toBeNull();
  });

  it("delar ett kort som ändå är högre än ytan, men bara mellan dess texter", () => {
    // Simuleringen på mobil: rubriken och ett högt kort.
    const units = [text(0, 28, true), box(44, 406), text(69, 128), text(140, 190), text(198, 284), text(292, 315)];
    expect(cutBetweenUnits(units, 300)).toBe(284);
  });

  it("kortar två kort i samma rad lika: ett kort som går längre ner delas inte", () => {
    const units = [text(0, 30, true), box(40, 200), text(60, 180), box(40, 260), text(60, 240), box(270, 400), text(290, 380)];
    expect(cutBetweenUnits(units, 265)).toBe(260);
    expect(cutBetweenUnits(units, 255)).toBeNull();
  });
});
