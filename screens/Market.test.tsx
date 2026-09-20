import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { Market, type MarketData } from "./Market";
import type { RegistryCompany, MarketOverview } from "@/ports/RegistryProvider";
import type { CampaignRow } from "@/ports/OutreachProvider";
import type { Simulation } from "@/ports/SimulationProvider";

const overview: MarketOverview = {
  companyCount: 50,
  medianRevenueKsek: 3000,
  growthSharePercent: 20,
  regionSharePercent: 40,
  source: { namn: "Testkälla", hämtad: "2026-01-01" },
  competitors: [{ name: "Konkurrent A", description: "Beskrivning A" }],
  basis: { medianRevenueCompanies: 30, growthCompanies: 25, regionCompanies: 45 },
};

const simulation: Simulation = {
  question: "Fråga?",
  result: "Resultat",
  uncertaintyRangeLabel: "Osäkerhet",
  populationSize: 100,
  source: { namn: "Hiasynth (koncept)", hämtad: "2026-01-02" },
};

// 1-4: 2, 5-9: 1, 10-19: 1, 20-49: 1, 50+: 0 — 1-4 är den största klassen (2 av 5).
const companies: RegistryCompany[] = [
  { name: "A", sniCode: "69.201", employees: 3, revenueKsek: 1000, county: "Stockholms län" },
  { name: "B", sniCode: "69.201", employees: 3, revenueKsek: 1200, county: "Stockholms län" },
  { name: "C", sniCode: "69.201", employees: 7, revenueKsek: 2000, county: "Skåne län" },
  { name: "D", sniCode: "69.201", employees: 12, revenueKsek: 4000, county: "Stockholms län" },
  { name: "E", sniCode: "69.201", employees: 25, revenueKsek: 8000, county: "Uppsala län" },
];

const outreachSource = { namn: "Testutskick (Gmail)", hämtad: "2026-01-03" };

function campaignOf(statuses: CampaignRow["status"][]): CampaignRow[] {
  return statuses.map((status, index) => ({
    companyName: `Bolag ${index}`,
    sniCode: "69.201",
    employees: 5,
    revenueKsek: 1000,
    status,
  }));
}

function baseData(campaign: CampaignRow[]): MarketData {
  return { overview, simulation, companies, campaign, outreachSource };
}

afterEach(() => {
  cleanup();
});

// Avsnitt 6, Datalöftet (uppdrag 1.2): nyckeltalen anger sitt urval,
// storleksfördelningen visar klasser (aldrig exakta tal) och utskicket har
// tre ärliga lägen beroende på var i scenariot grundaren står.
describe("Market", () => {
  it("visar låst läge utan data", () => {
    render(
      <LocaleProvider>
        <Market data={null} />
      </LocaleProvider>,
    );
    expect(screen.getByText(/Låses upp efter steg 02/)).toBeInTheDocument();
  });

  it("visar ett ärligt tomt läge för Jonas i stället för den generella låstexten", () => {
    render(
      <LocaleProvider>
        <Market data={null} notInScenario />
      </LocaleProvider>,
    );
    expect(screen.getByText("Det här steget är inte genomfört i det här scenariot.")).toBeInTheDocument();
  });

  it("anger urvalet bakom varje median/andel i stället för att låtsas gälla hela registret", () => {
    render(
      <LocaleProvider>
        <Market data={baseData([])} />
      </LocaleProvider>,
    );

    expect(screen.getByText("3,0 Mkr")).toBeInTheDocument();
    expect(screen.getByText("Baserat på 30 av 50 bolag.")).toBeInTheDocument();
    expect(screen.getByText("Baserat på 25 av 50 bolag.")).toBeInTheDocument();
    expect(screen.getByText("Baserat på 45 av 50 bolag.")).toBeInTheDocument();
  });

  it("visar datalagret med tre lager och en källa vardera", () => {
    const { container } = render(
      <LocaleProvider>
        <Market data={baseData([])} />
      </LocaleProvider>,
    );

    expect(screen.getByText("Register")).toBeInTheDocument();
    expect(screen.getByText("Årsredovisning")).toBeInTheDocument();
    expect(screen.getAllByText("Simulering").length).toBeGreaterThan(0);
    // Källpillarna: registret/årsredovisningen (Testkälla) och simuleringen (Hiasynth).
    expect(container.textContent).toContain("Testkälla");
    expect(container.textContent).toContain("Hiasynth (koncept)");
  });

  it("visar storleksfördelningen i klasser, aldrig ett exakt anställningstal", () => {
    const { container } = render(
      <LocaleProvider>
        <Market data={baseData([])} />
      </LocaleProvider>,
    );

    expect(screen.getByText("SNI 69.201")).toBeInTheDocument();
    // Den vanligaste klassen (1–4 anställda, 2 av 5 bolag, 40 %) namnges i insikten.
    expect(container.textContent).toContain("Vanligast i urvalet: 1–4 anställda");
    expect(container.textContent).toContain("2 bolag av 5 (40 %)");
    expect(container.textContent).toContain("Baserat på 5 av 50 bolag.");
    // Klassnamnen syns ("1–4 anställda" osv), aldrig ett enskilt bolags exakta antal (3, 7, 12, 25).
    expect(container.textContent).not.toMatch(/\b7 anställda\b/);
    expect(container.textContent).not.toMatch(/\b12 anställda\b/);
  });

  it("visar konkurrenter och simuleringen som tidigare", () => {
    render(
      <LocaleProvider>
        <Market data={baseData([])} />
      </LocaleProvider>,
    );
    expect(screen.getByText("Konkurrent A")).toBeInTheDocument();
    expect(screen.getByText("Beskrivning A")).toBeInTheDocument();
    expect(screen.getByText("Resultat")).toBeInTheDocument();
  });

  it("visar att ingen kontaktlista är byggd än", () => {
    render(
      <LocaleProvider>
        <Market data={baseData([])} />
      </LocaleProvider>,
    );
    expect(screen.getByText("Ingen kontaktlista byggd än i det här scenariot.")).toBeInTheDocument();
  });

  it("visar att utskicket inte är skickat än, trots en klar kontaktlista", () => {
    render(
      <LocaleProvider>
        <Market data={baseData(campaignOf(["draft", "draft", "draft"]))} />
      </LocaleProvider>,
    );
    expect(screen.getByText("Kontaktlistan är klar men inget utskick skickat än.")).toBeInTheDocument();
  });

  it("visar kontaktade, svarat och svarsfrekvens när utskicket är igång", () => {
    const { container } = render(
      <LocaleProvider>
        <Market data={baseData(campaignOf(["sent", "opened", "responded", "responded", "draft"]))} />
      </LocaleProvider>,
    );
    // 4 kontaktade (allt utom draft) av 5 byggda, 2 svarade, 50 % svarsfrekvens.
    const outreachSection = container.querySelector('[data-tour-id="market-outreach"]');
    expect(outreachSection?.textContent).toContain("4/ 5");
    expect(outreachSection?.textContent).toContain("Testutskick (Gmail)");
    expect(outreachSection?.textContent).toContain("2");
    expect(outreachSection?.textContent).toContain("50%");
  });
});
