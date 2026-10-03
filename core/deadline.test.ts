import { describe, expect, it } from "vitest";
import { extractDeadline } from "./deadline";

const TODAY = "2026-10-04";

describe("extractDeadline", () => {
  it("hittar datum efter tydliga fraser, med och utan år", () => {
    expect(extractDeadline("Sista ansökningsdag är 30 november 2026.", TODAY)).toBe("2026-11-30");
    expect(extractDeadline("Ansök senast den 15 okt via e-tjänsten.", TODAY)).toBe("2026-10-15");
    expect(extractDeadline("Ansökan ska vara inne senast 2026-12-01.", TODAY)).toBe("2026-12-01");
    expect(extractDeadline("Deadline: 20/11", TODAY)).toBe("2026-11-20");
  });

  it("ett datum utan år som redan passerat gäller nästa år", () => {
    expect(extractDeadline("Sista dag att söka är 15 mars.", TODAY)).toBe("2027-03-15");
  });

  it("ett datum utan fras, ett passerat datum eller ett ogiltigt datum ger null", () => {
    expect(extractDeadline("Bidraget infördes 1 januari 2025.", TODAY)).toBeNull();
    expect(extractDeadline("Sista ansökningsdag var 1 september 2026.", TODAY)).toBeNull();
    expect(extractDeadline("Sista ansökningsdag 31 november 2026.", TODAY)).toBeNull();
    expect(extractDeadline("Sista ansökningsdag 30 november 2030.", TODAY)).toBeNull();
    expect(extractDeadline("", TODAY)).toBeNull();
  });

  it("datumet måste stå nära frasen", () => {
    const far = `Sista ansökningsdag finns på myndighetens webbplats och ändras ofta, se mer där. 30 november`;
    expect(extractDeadline(far, TODAY)).toBeNull();
  });
});
