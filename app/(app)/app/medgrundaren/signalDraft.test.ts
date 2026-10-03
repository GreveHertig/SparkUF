import { describe, expect, it } from "vitest";
import type { PulseSignal } from "@/core/domain";
import { isSignalId, toSignalDraft, toTaskDraft } from "./signalDraft";

const signal: PulseSignal = {
  id: "00000000-0000-4000-8000-000000000001",
  category: "Möjlighet",
  headline: "Nytt bidrag till laddboxar",
  whyItMatters: "",
  timestamp: "",
  source: { namn: "energimyndigheten.se", hämtad: "2026-10-03" },
};

describe("signalDraft", () => {
  it("bara ett uuid räknas som en signals id", () => {
    expect(isSignalId(signal.id)).toBe(true);
    expect(isSignalId("1 or 1=1")).toBe(false);
    expect(isSignalId(["a", "b"])).toBe(false);
    expect(isSignalId(undefined)).toBe(false);
  });

  it("frågan bär rubrik, källa, datum och projektets namn", () => {
    expect(toSignalDraft(signal, { id: "p", name: "Laddkollen", oneLiner: "" }, "sv")).toBe(
      'Jag läste nyheten "Nytt bidrag till laddboxar" (energimyndigheten.se, 3 oktober). Vad betyder den för Laddkollen, och vad borde jag göra först?',
    );
  });

  it("utan projekt frågar den om idén", () => {
    expect(toSignalDraft(signal, null, "sv")).toContain("för min idé");
  });

  it("en rubrik med styrtecken eller överlängd rensas och kapas, ett konstigt datum kraschar inte", () => {
    const draft = toSignalDraft(
      { ...signal, headline: `Rubrik‮\n${"x".repeat(500)}`, source: { namn: "a.se", hämtad: "okänt" } },
      null,
      "sv",
    );
    expect(draft).not.toMatch(/[‮\n]/);
    expect(Array.from(draft).length).toBeLessThan(400);
    expect(draft).toContain("okänt");
  });
});

describe("toTaskDraft", () => {
  const task = {
    id: "00000000-0000-4000-8000-000000000002",
    text: "Läs villkoren hos den som delar ut stödet",
    context: "Bidrag till laddboxar",
    origin: "pulsen" as const,
    done: false,
    createdAtIso: "",
  };

  it("frågan bär uppgiften, projektet och nyheten den kom från", () => {
    expect(toTaskDraft(task, { id: "p", name: "Laddkollen", oneLiner: "" }, "sv")).toBe(
      'Hjälp mig med uppgiften "Läs villkoren hos den som delar ut stödet" i min plan. Hur gör jag den konkret för Laddkollen, och vad gör jag först? Den kommer från nyheten "Bidrag till laddboxar".',
    );
  });

  it("en egen uppgift utan sammanhang och utan projekt", () => {
    const draft = toTaskDraft({ ...task, context: null, origin: "own" }, null, "sv");
    expect(draft).toContain("för min idé");
    expect(draft).not.toContain("nyheten");
  });
});
