import { describe, expect, it } from "vitest";
import {
  cardCoversHole,
  clipToSafeArea,
  flipTransform,
  frameStop,
  glideDuration,
  layoutStop,
  toDocument,
} from "./tourGeometry";

const desktop = { width: 1440, height: 900 };
const mobile = { width: 390, height: 844 };
/** Sidhuvudet slutar vid 121 px, demoraden börjar vid 844 px. */
const safe = { top: 121, bottom: 844 };
const card = { width: 380, height: 290 };

describe("rundturens spotlight-geometri", () => {

  it("FLIP-transformen lägger elementet på den gamla platsen", () => {
    const from = { top: 100, left: 50, width: 200, height: 100 };
    const to = { top: 400, left: 250, width: 400, height: 50 };
    expect(flipTransform(from, to)).toBe("translate(-200.00px, -300.00px) scale(0.5000, 2.0000)");
    expect(flipTransform(to, to)).toBe("translate(0.00px, 0.00px) scale(1.0000, 1.0000)");
  });

  it("flyttar en ruta från viewportens till sidans koordinater", () => {
    expect(toDocument({ top: 100, left: 20, width: 10, height: 10 }, { x: 0, y: 500 })).toEqual({
      top: 600,
      left: 20,
      width: 10,
      height: 10,
    });
  });

  it("hålet går aldrig in under sidhuvudet eller demoraden", () => {
    const clipped = clipToSafeArea({ top: 80, left: 0, width: 100, height: 900 }, safe);
    expect(clipped.top).toBeGreaterThan(safe.top);
    expect(clipped.top + clipped.height).toBeLessThan(safe.bottom);
  });

  it("lägger kortet bredvid målet när det finns plats", () => {
    const layout = layoutStop({ top: 349, left: 842, width: 454, height: 315 }, card, desktop, safe);
    expect(layout.placement).toBe("left");
    expect(layout.card.x + card.width).toBeLessThanOrEqual(842);
    expect(cardCoversHole(layout, card)).toBe(false);
  });

  it("lägger kortet under ett brett mål, och aldrig över demoraden", () => {
    const layout = layoutStop({ top: 200, left: 144, width: 1152, height: 200 }, card, desktop, safe);
    expect(layout.placement).toBe("below");
    expect(layout.card.y + card.height).toBeLessThanOrEqual(safe.bottom);
    expect(cardCoversHole(layout, card)).toBe(false);
  });

  it("dockar kortet i hörnet när målet fyller ytan", () => {
    const layout = layoutStop({ top: 130, left: 144, width: 1152, height: 700 }, card, desktop, safe);
    expect(layout.placement).toBe("docked");
    expect(layout.card.x + card.width).toBe(desktop.width - 16);
    expect(layout.card.y + card.height).toBe(safe.bottom - 16);
  });

  it("väljer läget som täcker minst av målet när inget får plats helt", () => {
    // Ingångskorten på onboardingen: sidan kan inte skrolla, och kortet får
    // nästan plats under dem.
    const onboarding = { top: 69, bottom: 844 };
    const layout = layoutStop({ top: 331, left: 336, width: 768, height: 243 }, card, desktop, onboarding);
    expect(layout.placement).toBe("below");
    expect(layout.card.y + card.height).toBe(onboarding.bottom - 16);
  });

  it("centrerar kortet i den säkra ytan när stoppet saknar mål", () => {
    const layout = layoutStop(null, card, desktop, safe);
    expect(layout.placement).toBe("center");
    expect(layout.card.x).toBe(530);
  });

  it("skrollar inte när målet redan syns och kortet får plats", () => {
    const target = { top: 349, left: 842, width: 454, height: 315 };
    const { scrollTo } = frameStop(target, card, desktop, safe, { y: 0, max: 3000 });
    expect(scrollTo).toBe(0);
  });

  it("skrollar så att ett brett mål och kortet hamnar mitt i den säkra ytan", () => {
    const target = { top: 1500, left: 144, width: 1152, height: 200 };
    const { scrollTo, layout } = frameStop(target, card, desktop, safe, { y: 0, max: 5000 });
    const stacked = target.height + 16 + card.height;
    const expectedTop = safe.top + (safe.bottom - safe.top - stacked) / 2;
    expect(Math.abs(1500 - scrollTo - expectedTop)).toBeLessThanOrEqual(1);
    expect(layout.placement).toBe("below");
  });

  it("skrollar ett högt mål så att dess början syns under sidhuvudet", () => {
    const target = { top: 1500, left: 144, width: 1152, height: 1100 };
    const { scrollTo } = frameStop(target, card, desktop, safe, { y: 0, max: 5000 });
    expect(1500 - scrollTo).toBe(safe.top + 16);
  });

  it("räknar med att sidan inte kan skrolla förbi slutet", () => {
    const target = { top: 1500, left: 144, width: 1152, height: 200 };
    const { scrollTo } = frameStop(target, card, desktop, safe, { y: 0, max: 800 });
    expect(scrollTo).toBe(800);
  });

  it("på mobil blir kortet ett ark längst ner och hålet slutar ovanför det", () => {
    const sheet = { width: 358, height: 250 };
    const mobileSafe = { top: 121, bottom: 737 };
    const layout = layoutStop({ top: 150, left: 8, width: 374, height: 500 }, sheet, mobile, mobileSafe);
    expect(layout.placement).toBe("sheet");
    expect(layout.card).toEqual({ x: 16, y: mobileSafe.bottom - 16 - sheet.height });
    expect(layout.hole!.top + layout.hole!.height).toBeLessThanOrEqual(layout.card.y);
    expect(cardCoversHole(layout, sheet)).toBe(false);
  });

  it("på mobil skrollas ett högt mål fram direkt under sidhuvudet", () => {
    const sheet = { width: 358, height: 250 };
    const mobileSafe = { top: 121, bottom: 737 };
    const target = { top: 900, left: 8, width: 374, height: 500 };
    const { scrollTo } = frameStop(target, sheet, mobile, mobileSafe, { y: 0, max: 5000 });
    expect(900 - scrollTo).toBe(mobileSafe.top + 16);
  });

  it("glidet är lugnt och längre för längre sträckor", () => {
    expect(glideDuration(0)).toBe(420);
    expect(glideDuration(2000)).toBe(680);
    expect(glideDuration(400)).toBeGreaterThan(glideDuration(100));
  });

});
