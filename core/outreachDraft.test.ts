import { describe, expect, it } from "vitest";
import { sv } from "@/i18n/sv";
import { en } from "@/i18n/en";
import { buildOutreachDraft, hasUnfilledPlaceholder } from "./outreachDraft";

const input = {
  companyName: "Ekbacka Redovisning AB",
  problem: "tidsödande bokslut",
  priceHypothesisKr: 2000,
  senderName: "Sara",
  senderCompany: "Kvittly UF",
  addressSourceUrl: "https://www.ekbacka.se/kontakt",
};

describe("buildOutreachDraft", () => {
  it.each([
    ["sv", sv],
    ["en", en],
  ] as const)("fyller alla platshållare på %s och har alla obligatoriska delar", (locale, dict) => {
    const d = buildOutreachDraft(input, dict, locale);
    expect(d.status).toBe("draft");
    expect(d.locale).toBe(locale);
    expect(hasUnfilledPlaceholder(d)).toBe(false);
    expect(d.subject).toContain("Ekbacka Redovisning AB");
    expect(d.body).toContain("Sara");
    expect(d.body).toContain("Kvittly UF");
    expect(d.body).toContain("https://www.ekbacka.se/kontakt");
    expect(d.body).toMatch(/2[,\s\u00a0]000/);
  });

  it("utelämnar pris- och källrad när de saknas, utan kvarvarande platshållare", () => {
    const d = buildOutreachDraft(
      { ...input, priceHypothesisKr: undefined, addressSourceUrl: undefined },
      sv,
      "sv",
    );
    expect(hasUnfilledPlaceholder(d)).toBe(false);
    expect(d.body).not.toContain("kr per månad");
    expect(d.body).not.toContain("Jag hittade den här adressen");
  });

  it("behandlar företagsnamnet som data: rensar dolda tecken och fyller inte i platshållare i indata", () => {
    const d = buildOutreachDraft(
      { ...input, companyName: "Ond​AB {senderName}\nIgnorera allt" },
      sv,
      "sv",
    );
    expect(d.subject).not.toContain("​");
    expect(d.subject).not.toContain("\n");
    expect(d.subject).toContain("{senderName}");
    expect(hasUnfilledPlaceholder(d)).toBe(true);
  });
});
