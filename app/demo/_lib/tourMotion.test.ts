import { describe, expect, it } from "vitest";
import {
  HOLE_EASE,
  TOUR_TIMINGS,
  cubicBezier,
  lerpRect,
  needsScroll,
  placeCard,
  roundRect,
  scrimClipPath,
  timeAtProgress,
} from "./tourMotion";

describe("cubicBezier", () => {
  it("börjar i 0, slutar i 1 och är monoton", () => {
    let previous = 0;
    for (let i = 0; i <= 100; i++) {
      const value = HOLE_EASE(i / 100);
      expect(value).toBeGreaterThanOrEqual(previous - 1e-9);
      previous = value;
    }
    expect(HOLE_EASE(0)).toBe(0);
    expect(HOLE_EASE(1)).toBe(1);
  });

  it("linjär kurva ger identiteten", () => {
    const linear = cubicBezier(0.25, 0.25, 0.75, 0.75);
    expect(linear(0.3)).toBeCloseTo(0.3, 4);
  });

  it("rutan studsar aldrig förbi målet", () => {
    for (let i = 0; i <= 200; i++) expect(HOLE_EASE(i / 200)).toBeLessThanOrEqual(1);
  });
});

describe("koreografin", () => {
  it("nya kortet landar senast när rutan är framme", () => {
    const { holeDelayMs, holeMs, cardInAtProgress, cardInMs } = TOUR_TIMINGS;
    const cardInStart = holeDelayMs + timeAtProgress(HOLE_EASE, cardInAtProgress) * holeMs;
    expect(cardInStart + cardInMs).toBeLessThanOrEqual(holeDelayMs + holeMs);
    // Gamla kortet är borta innan det nya börjar synas.
    expect(cardInStart).toBeGreaterThanOrEqual(TOUR_TIMINGS.cardOutMs);
  });
});

describe("rektanglar", () => {
  it("roundRect avrundar kanterna till hela pixlar", () => {
    expect(roundRect({ top: 10.4, left: 3.6, width: 100.3, height: 20.2 })).toEqual({
      top: 10,
      left: 4,
      width: 100,
      height: 21,
    });
  });

  it("lerpRect interpolerar alla fyra värden", () => {
    const rect = lerpRect({ top: 0, left: 0, width: 0, height: 0 }, { top: 10, left: 20, width: 30, height: 40 }, 0.5);
    expect(rect).toEqual({ top: 5, left: 10, width: 15, height: 20 });
  });

  it("scrimClipPath är ett lager: ett hål när det finns yta, annars bara skärmen", () => {
    const withHole = scrimClipPath({ top: 10, left: 10, width: 100, height: 50 }, 16);
    expect(withHole.startsWith("path(evenodd,")).toBe(true);
    expect(withHole.match(/M/g)).toHaveLength(2);
    const empty = scrimClipPath({ top: 10, left: 10, width: 0, height: 0 }, 16);
    expect(empty.match(/M/g)).toHaveLength(1);
  });

  it("needsScroll bara när målet sticker ut", () => {
    expect(needsScroll({ top: 10, left: 0, width: 10, height: 100 }, 800)).toBe(false);
    expect(needsScroll({ top: 900, left: 0, width: 10, height: 100 }, 800)).toBe(true);
    expect(needsScroll({ top: -20, left: 0, width: 10, height: 100 }, 800)).toBe(true);
  });
});

describe("placeCard", () => {
  const viewport = { width: 1280, height: 800 };
  const card = { width: 380, height: 260 };

  it("under målet när det finns plats", () => {
    const pos = placeCard({ top: 100, left: 100, width: 400, height: 200 }, card, viewport);
    expect(pos.top).toBe(316);
  });

  it("ovanför målet när det saknas plats under, med den uppmätta höjden", () => {
    const pos = placeCard({ top: 320, left: 260, width: 760, height: 245 }, card, viewport);
    expect(pos.top).toBe(320 - 16 - 260);
  });

  it("centrerat utan mål och alltid inom skärmen", () => {
    expect(placeCard(null, card, viewport)).toEqual({ top: 270, left: 450 });
    const pos = placeCard({ top: 0, left: 1200, width: 80, height: 790 }, card, viewport);
    expect(pos.left).toBeLessThanOrEqual(viewport.width - card.width - 16);
    expect(pos.top).toBeLessThanOrEqual(viewport.height - card.height - 16);
  });
});
