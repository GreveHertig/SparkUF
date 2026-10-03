import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { Pulse } from "@/screens/Pulse";
import type { PulseSignal } from "@/core/domain";

afterEach(() => cleanup());

const signal = (extra: Partial<PulseSignal> = {}): PulseSignal => ({
  id: "00000000-0000-4000-8000-000000000001",
  category: "Möjlighet",
  headline: "Nytt bidrag till laddboxar",
  whyItMatters: "Föreningar kan söka stödet.",
  timestamp: "",
  source: { namn: "energimyndigheten.se", hämtad: "2026-10-04" },
  opportunity: { area: "funding", actions: [] },
  ...extra,
});

function show(signals: PulseSignal[], learning?: { areas: string[]; terms: string[] } | null) {
  return render(
    <LocaleProvider>
      <Pulse data={{ signals, sourceDataType: "media" }} learning={learning} />
    </LocaleProvider>,
  );
}

describe("Pulsen v3 på skärmen", () => {
  it("sista ansökningsdag med år och källa, märkning för AI-text och för det grundaren gillat", () => {
    show([signal({ deadline: "2026-11-30", whyByAi: true, boosted: true })]);
    expect(screen.getByText("30 november 2026")).toBeInTheDocument();
    expect(screen.getByText(sv.pulsePage.aiWhy)).toBeInTheDocument();
    expect(screen.getByText(sv.pulsePage.boosted)).toBeInTheDocument();
  });

  it("utan märkningar visas inget av det", () => {
    show([signal()]);
    expect(screen.queryByText(sv.pulsePage.aiWhy)).not.toBeInTheDocument();
    expect(screen.queryByText(sv.pulsePage.boosted)).not.toBeInTheDocument();
    expect(screen.queryByText(sv.pulsePage.deadline, { exact: false })).not.toBeInTheDocument();
  });

  it("Pulsen lär sig: namnen när något är lärt, annars en uppmaning", () => {
    show([signal()], { areas: ["Stöd och bidrag"], terms: ["laddbox"] });
    expect(screen.getByText(sv.pulsePage.learning.title)).toBeInTheDocument();
    expect(screen.getByText(sv.pulsePage.learning.areas.replace("{list}", "Stöd och bidrag"))).toBeInTheDocument();
    expect(screen.getByText(sv.pulsePage.learning.terms.replace("{list}", "laddbox"))).toBeInTheDocument();
    cleanup();
    show([signal()], { areas: [], terms: [] });
    expect(screen.getByText(sv.pulsePage.learning.empty)).toBeInTheDocument();
  });

  it("ett ensamt kort får hela bredden, två delar på den", () => {
    const { container } = show([signal()]);
    expect(container.querySelector(".fdd-signals")).toHaveClass("fdd-signals--1");
    cleanup();
    const two = show([signal(), signal({ id: "00000000-0000-4000-8000-000000000002", headline: "Annat bidrag" })]);
    expect(two.container.querySelector(".fdd-signals")).toHaveClass("fdd-signals--2");
  });
});
