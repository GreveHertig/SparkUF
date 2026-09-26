import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { Validation, type ValidationData } from "./Validation";
import type { CampaignRow } from "@/ports/OutreachProvider";
import type { ResponseCard, ValidationAssumption } from "@/ports/OutreachProvider";

// jsdom saknar matchMedia — VerdictCard (via ScoreBadge/usePrefersReducedMotion)
// behöver den, se app/(marketing)/page.test.tsx för samma mönster.
beforeAll(() => {
  window.matchMedia = ((query: string) =>
    ({
      matches: true,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList) as typeof window.matchMedia;
});

const outreachSource = { namn: "Testutskick (Gmail)", hämtad: "2026-01-19" };

const rows: CampaignRow[] = [
  { companyName: "A", sniCode: "69.201", employees: 8, revenueKsek: 4200, status: "responded", quote: "Bra." },
  { companyName: "B", sniCode: "69.201", employees: 6, revenueKsek: 3200, status: "opened" },
  { companyName: "C", sniCode: "69.201", employees: 12, revenueKsek: 6000, status: "draft" },
];

const responses: ResponseCard[] = [
  {
    companyName: "A",
    county: "Stockholms län",
    employees: 8,
    dateIso: "2026-01-19",
    quote: "Ett citat.",
    verdict: "confirms",
    priceTestedKr: 2000,
  },
  {
    companyName: "D",
    county: "Skåne län",
    employees: 6,
    dateIso: "2026-01-20",
    quote: "Ett annat citat.",
    verdict: "partial",
    priceTestedKr: 2000,
  },
];

const assumptions: ValidationAssumption[] = [
  {
    id: "problemet",
    text: "Byråerna har ett verkligt kvittoproblem.",
    verdict: "confirmed",
    basis: "7 av 9 bekräftar problemet.",
    source: { namn: "Kundsamtal, steg 05–06", hämtad: "2026-01-23" },
  },
  {
    id: "priset",
    text: "Byråerna betalar 2 000 kr/mån.",
    verdict: "contradicted",
    basis: "6 av 9 tycker att 2 000 kr är för dyrt.",
    source: { namn: "Kundsamtal, steg 05–06", hämtad: "2026-01-23" },
  },
];

function baseData(overrides: Partial<ValidationData> = {}): ValidationData {
  return {
    rows,
    outreachSource,
    contactedDateRange: { startIso: "2026-01-14", endIso: "2026-01-20" },
    openRate: 38,
    openRateSource: outreachSource,
    assumptions: [],
    responses: [],
    verdict: null,
    verdictScoreTotal: null,
    simulation: null,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

// Uppgift 3: Kunder och valideringen hopslagna — nyckeltal, antaganden,
// svar-kort och domen, plus den fullständiga kontaktlistan bevarad.
describe("Validation", () => {
  it("visar låst läge utan kontaktlista", () => {
    render(
      <LocaleProvider>
        <Validation data={baseData({ rows: [] })} />
      </LocaleProvider>,
    );
    expect(screen.getByText(/Låses upp efter steg 03/)).toBeInTheDocument();
  });

  it("visar ett ärligt tomt läge för Jonas i stället för den generella låstexten", () => {
    render(
      <LocaleProvider>
        <Validation data={baseData({ rows: [] })} notInScenario />
      </LocaleProvider>,
    );
    expect(screen.getByText("Det här steget är inte genomfört i det här scenariot.")).toBeInTheDocument();
  });

  it("visar de fyra nyckeltalen med källa", () => {
    const { container } = render(
      <LocaleProvider>
        <Validation data={baseData()} />
      </LocaleProvider>,
    );
    const kpiSection = container.querySelector('[data-tour-id="validation-kpi"]');
    // Kontaktade = 2 (allt utom draft), svar = 1, svarsfrekvens 50 %, öppningsfrekvens 38 %.
    expect(kpiSection?.textContent).toContain("2");
    expect(kpiSection?.textContent).toContain("50%");
    expect(kpiSection?.textContent).toContain("38%");
    expect(kpiSection?.textContent).toContain("Testutskick (Gmail)");
  });

  it("visar antagandena med dom, motivering och källa", () => {
    render(
      <LocaleProvider>
        <Validation data={baseData({ assumptions })} />
      </LocaleProvider>,
    );
    expect(screen.getByText("Byråerna har ett verkligt kvittoproblem.")).toBeInTheDocument();
    expect(screen.getByText("7 av 9 bekräftar problemet.")).toBeInTheDocument();
    expect(screen.getByText("Bekräftat")).toBeInTheDocument();
    expect(screen.getByText("Motsagt")).toBeInTheDocument();
  });

  it("visar ett kort per svarande med dom, citat och pris", () => {
    render(
      <LocaleProvider>
        <Validation data={baseData({ responses })} />
      </LocaleProvider>,
    );
    expect(screen.getByText(/Ett citat\./)).toBeInTheDocument();
    expect(screen.getByText("Bekräftar")).toBeInTheDocument();
    expect(screen.getByText("Delvis")).toBeInTheDocument();
    expect(screen.getAllByText(/2 000 kr/).length).toBeGreaterThan(0);
  });

  it("behåller hela kontaktlistan (inget tappas i hopslagningen)", () => {
    const { container } = render(
      <LocaleProvider>
        <Validation data={baseData()} />
      </LocaleProvider>,
    );
    const table = container.querySelector('[data-tour-id="validation-table"]');
    expect(table?.textContent).toContain("A");
    expect(table?.textContent).toContain("B");
    expect(table?.textContent).toContain("C");
  });

  it("visar domen med poäng och en konfidensrad, härledd ur nyckeltalen", () => {
    render(
      <LocaleProvider>
        <Validation
          data={baseData({
            responses,
            verdict: { headline: "Förfina · snäva segmentet", reasoning: "Testmotivering." },
            verdictScoreTotal: 43,
          })}
        />
      </LocaleProvider>,
    );
    expect(screen.getByText("Förfina · snäva segmentet")).toBeInTheDocument();
    expect(screen.getByText("Testmotivering.")).toBeInTheDocument();
    expect(screen.getByText(/Baserat på 1 av 2 kontaktade/)).toBeInTheDocument();
  });
});
