import { describe, expect, it } from "vitest";
import { cleanMultilineText, cleanText } from "./text";

describe("cleanText", () => {
  it("tar bort styr-, nollbredds- och radseparatortecken och kollapsar blanksteg", () => {
    expect(cleanText("a​b\n\n c d", 50)).toBe("a b c d");
  });
  it("kortar utan att dela surrogatpar", () => {
    const out = cleanText("😀".repeat(10), 5);
    expect(Array.from(out)).toHaveLength(5);
    expect(out.endsWith("…")).toBe(true);
  });
});

describe("cleanMultilineText", () => {
  it("behåller radbrytningar men tar bort styr- och formattecken", () => {
    expect(cleanMultilineText("Hej​ där\r\n\tRad två\u0007 slut", 100)).toBe("Hej där\nRad två slut");
  });

  it("kollapsar fler än en tom rad och trimmar", () => {
    expect(cleanMultilineText("  Ett\n\n\n\nTvå  \n", 100)).toBe("Ett\n\nTvå");
  });

  it("kortar på teckenvärden", () => {
    expect(cleanMultilineText("abcdef", 4)).toBe("abc…");
  });
});
