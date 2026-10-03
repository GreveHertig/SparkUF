import { describe, expect, it } from "vitest";
import { sv } from "@/i18n/sv";
import type { JourneyStepView } from "@/ports/JourneyRepository";
import { toPulsePersonal } from "./personal";

const NOW = new Date("2026-10-03T12:00:00Z");
const formal = (status: JourneyStepView["status"]): JourneyStepView => ({
  stepNumber: 9,
  journeyPhase: "launch",
  title: "Det formella",
  oneLiner: "",
  maxPoints: 8,
  status,
});

describe("toPulsePersonal (personlig spelbok)", () => {
  it("ett tomt konto ger null, så att spelboken ser ut som förut", () => {
    expect(toPulsePersonal({ profile: null, project: null, steps: null }, "sv", NOW)).toBeNull();
    expect(toPulsePersonal({ profile: { time: null, money: "  " }, project: null, steps: [] }, "sv", NOW)).toBeNull();
  });

  it("risker får idé, tid, pengar och risk. Möjligheter får idé, Det formella, tid och pengar", () => {
    const personal = toPulsePersonal(
      {
        profile: { time: "10 timmar i veckan", money: "Ungefär 5 000 kr", risk: "Bara min tid" },
        project: { id: "p", name: "Laddkollen", oneLiner: "Laddning för BRF:er." },
        steps: [formal("locked")],
      },
      "sv",
      NOW,
    )!;
    expect(personal.risk.map((fact) => fact.id)).toEqual(["idea", "time", "money", "risk"]);
    expect(personal.opportunity.map((fact) => fact.id)).toEqual(["idea", "formal", "time", "money"]);
    expect(personal.opportunity[1].text).toBe(
      sv.pulsePage.playbook.formalOpen.replace("{step}", "Det formella"),
    );
  });

  it("en rad med en siffra får källan Din uppgift, en rad utan siffra ingen källa", () => {
    const personal = toPulsePersonal(
      { profile: { time: "10 timmar i veckan", risk: "Bara min tid" }, project: null, steps: null },
      "sv",
      NOW,
    )!;
    const time = personal.risk.find((fact) => fact.id === "time")!;
    expect(time.source).toEqual({
      source: { namn: expect.any(String), hämtad: "2026-10-03" },
      dataType: "user",
    });
    expect(personal.risk.find((fact) => fact.id === "risk")!.source).toBeUndefined();
  });

  it("Det formella klart säger att det är klart", () => {
    const personal = toPulsePersonal({ profile: null, project: null, steps: [formal("done")] }, "sv", NOW)!;
    expect(personal.opportunity[0].text).toBe(sv.pulsePage.playbook.formalDone.replace("{step}", "Det formella"));
    expect(personal.risk).toEqual([]);
  });

  it("grundarens text rensas från styrtecken och kapas", () => {
    const personal = toPulsePersonal(
      { profile: { time: `10\u0000 h‮ ${"x".repeat(400)}` }, project: null, steps: null },
      "sv",
      NOW,
    )!;
    const text = personal.risk[0].text;
    expect(text).not.toMatch(/[\u0000‮]/);
    expect(Array.from(text).length).toBeLessThan(270);
  });
});
