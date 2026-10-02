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

  it("utan sourceDataType är källtaggen vanlig, med \"example\" bär den etiketten Exempel", () => {
    const { rerender } = renderPulse({ signals });
    expect(screen.queryByText(sv.common.exampleSourceLabel)).not.toBeInTheDocument();
    rerender(
      <LocaleProvider>
        <Pulse data={{ signals, sourceDataType: "example" }} />
      </LocaleProvider>,
    );
    expect(screen.getAllByText(sv.common.exampleSourceLabel)).toHaveLength(2);
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

  it("utan risker: en lista utan extra rubriker, som förut", () => {
    renderPulse({ signals });
    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
    expect(screen.queryByText(sv.pulsePage.riskLabel)).not.toBeInTheDocument();
  });

  it("risker visas först under egen rubrik, med område, förslag och källa", () => {
    const risk: PulseSignal = {
      category: `Risk · ${sv.pulsePage.riskAreas.costs.name}`,
      headline: "Elpriset stiger",
      whyItMatters: "Kan pressa marginalen.",
      timestamp: "",
      source: { namn: "ekonomi.se", hämtad: "2026-10-02", url: "https://ekonomi.se/el" },
      risk: { area: "costs", actions: ["Se över kalkylen.", "Fråga leverantören."] },
    };
    const { container } = renderPulse({ signals: [signals[0], risk], sourceDataType: "media" });

    const [risksHeading, newsHeading] = screen.getAllByRole("heading", { level: 2 });
    expect(risksHeading).toHaveTextContent(sv.pulsePage.risksTitle);
    expect(newsHeading).toHaveTextContent(sv.pulsePage.newsTitle);

    const riskCard = screen.getByText("Elpriset stiger").closest("li")!;
    expect(riskCard).toHaveTextContent(sv.pulsePage.riskLabel);
    expect(riskCard).toHaveTextContent(sv.pulsePage.riskAreas.costs.name);
    expect(riskCard).toHaveTextContent(sv.pulsePage.actionsTitle);
    expect(riskCard).toHaveTextContent("Se över kalkylen.");
    expect(riskCard).toHaveTextContent("ekonomi.se");
    expect(riskCard).toHaveTextContent(sv.common.mediaSourceLabel);

    // Risken står före nyheten i sidans ordning.
    const cards = [...container.querySelectorAll(".fdd-signal")].map((card) => card.querySelector(".fdd-signal__headline")?.textContent);
    expect(cards).toEqual(["Elpriset stiger", signals[0].headline]);

    // En nyhet har inga förslag.
    const newsCard = [...container.querySelectorAll(".fdd-signal")].find((card) => card.textContent?.includes(signals[0].headline))!;
    expect(newsCard).not.toHaveTextContent(sv.pulsePage.actionsTitle);
  });
});
