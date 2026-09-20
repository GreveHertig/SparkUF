import { describe, expect, it } from "vitest";
import { cleanText } from "./text";

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
