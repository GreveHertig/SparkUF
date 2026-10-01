import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import type { PulseSignal } from "@/core/domain";
import { Pulse, type PulseData } from "./Pulse";

afterEach(() => cleanup());

const signals: PulseSignal[] = [
  {
    category: "Nyheter",
    headline: "Ny regel för digitala kvitton",
    whyItMatters: "Påverkar dina kunder.",
    timestamp: "",
    source: { namn: "exempel.se", hämtad: "2026-09-30", url: "https://exempel.se/a" },
  },
  {
    category: "Nyheter",
    headline: "Byrå tar in kapital",
    whyItMatters: "En konkurrent växer.",
    timestamp: "",
    source: { namn: "annan.se", hämtad: "2026-09-29" },
  },
];

function renderPulse(data: PulseData) {
  return render(
    <LocaleProvider>
      <Pulse data={data} />
    </LocaleProvider>,
  );
}

describe("Pulse (steg 6)", () => {
  it("rubriken är den senaste signalen, och varje signal har sin källa med datum", () => {
    const { container } = renderPulse({ signals });
    expect(screen.getByRole("heading", { level: 1, name: signals[0].headline })).toBeInTheDocument();
    expect(container.querySelectorAll(".fdd-signal")).toHaveLength(2);
    expect(screen.getByText("exempel.se")).toBeInTheDocument();
    expect(screen.getByText("annan.se")).toBeInTheDocument();
    expect(screen.getByText(/30 september/)).toBeInTheDocument();
  });

  it("visar inga fasta relativa tider, datumet står i källan (punkt 11)", () => {
    const { container } = renderPulse({ signals: signals.map((s) => ({ ...s, timestamp: "3 dagar sedan" })) });
    expect(container.textContent).not.toMatch(/sedan/);
  });

  it("en tom lista är ett ärligt tomläge, inte Kommer snart", () => {
    renderPulse({ signals: [] });
    expect(screen.getByRole("heading", { level: 1, name: sv.pulsePage.title })).toBeInTheDocument();
    expect(screen.getByText(sv.pulsePage.emptyState)).toBeInTheDocument();
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
  });

  it("saknad data (null) ger Kommer snart bara i listan, sidhuvudet står kvar", () => {
    const { container } = renderPulse({ signals: null });
    expect(screen.getByRole("heading", { level: 1, name: sv.pulsePage.title })).toBeInTheDocument();
    expect(screen.getByText(sv.comingSoon.title)).toBeInTheDocument();
    expect(container.querySelector(".fdd-signals")).toBeNull();
  });
});
