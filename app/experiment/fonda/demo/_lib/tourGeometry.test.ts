import { describe, expect, it } from "vitest";
import {
  collapseRect,
  isComfortablyVisible,
  placeCard,
  predictCenteredRect,
  ringClipPath,
  roundedRectPath,
  scrimClipPath,
} from "./tourGeometry";

/** Kommandobokstäverna i en path, utan talen. */
function commands(path: string): string {
  return path.replace(/[^A-Za-z]/g, "");
}

describe("rundturens spotlight-geometri", () => {
  const rect = { top: 100, left: 50, width: 300, height: 120 };

  it("hålet har samma kommandon oavsett storlek, så att det kan tweenas", () => {
    const open = scrimClipPath({ width: 1440, height: 900 }, rect, 16);
    const closed = scrimClipPath({ width: 1440, height: 900 }, collapseRect(rect), 16);
    expect(commands(open)).toBe(commands(closed));
    expect(commands(ringClipPath(rect, 16, 2))).toBe(commands(ringClipPath(collapseRect(rect), 16, 2)));
  });

  it("radien kläms till halva sidan", () => {
    expect(roundedRectPath({ top: 0, left: 0, width: 10, height: 4 }, 16)).toContain("A2 2");
    expect(roundedRectPath(collapseRect(rect), 16)).toContain("A0 0");
  });

  it("en hopfälld ruta ligger i mitten av den gamla", () => {
    expect(collapseRect(rect)).toEqual({ top: 160, left: 200, width: 0, height: 0 });
  });

  it("förutser var målet hamnar när sidan skrollar det till mitten", () => {
    const target = { top: 1500, left: 0, width: 200, height: 100 };
    const { rect: landed, scrollTo } = predictCenteredRect(target, { y: 0, max: 5000 }, 900);
    expect(scrollTo).toBe(1100);
    expect(landed.top).toBe(400);
  });

  it("räknar med att sidan inte kan skrolla förbi slutet", () => {
    const target = { top: 1500, left: 0, width: 200, height: 100 };
    const { rect: landed, scrollTo } = predictCenteredRect(target, { y: 0, max: 800 }, 900);
    expect(scrollTo).toBe(800);
    expect(landed.top).toBe(700);
  });

  it("skrollar inte när målet redan syns", () => {
    expect(isComfortablyVisible(rect, 900, { top: 88, bottom: 132 })).toBe(true);
    expect(isComfortablyVisible({ ...rect, top: 850 }, 900, { top: 88, bottom: 132 })).toBe(false);
  });

  it("lägger kortet under målet, över om det inte får plats, och i mitten utan mål", () => {
    const vp = { width: 1440, height: 900 };
    const card = { width: 380, height: 240 };
    expect(placeCard(rect, card, vp).y).toBe(236);
    expect(placeCard({ ...rect, top: 700 }, card, vp).y).toBe(444);
    expect(placeCard(null, card, vp)).toEqual({ x: 530, y: 330 });
    expect(placeCard({ ...rect, left: 0 }, card, vp).x).toBe(16);
  });
});
