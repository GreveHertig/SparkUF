import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import type { DataKind } from "@/core/domain";
import { Market, type MarketData, type MarketLock, type MarketRegistry, type SniPicker } from "./Market";
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

const registry = { overview, companies, medianRevenueFiscalYears: { from: 2023, to: 2024 } };

function baseData(campaign: CampaignRow[], overrides: Partial<MarketData> = {}): MarketData {
  return {
    industryLabel: "Testbranschen",
    registry,
    outreach: { rows: campaign, source: outreachSource },
    simulation,
    ...overrides,
  };
}

function renderMarket(
  data: MarketData,
  { locked = null, dataKind = "example", sniPicker }: { locked?: MarketLock; dataKind?: DataKind; sniPicker?: SniPicker } = {},
) {
  return render(
    <LocaleProvider>
      <Market data={data} dataKind={dataKind} locked={locked} sniPicker={sniPicker} />
    </LocaleProvider>,
  );
}

const m = sv.marketPage;

afterEach(() => {
  cleanup();
});

// Avsnitt 6, Datalöftet (uppdrag 1.2): nyckeltalen anger sitt urval,
// storleksfördelningen visar klasser (aldrig exakta tal), omsättningen bär sina
// räkenskapsår och utskicket har tre ärliga lägen.
describe("Market", () => {
  it("visar låst läge utan data", () => {
    renderMarket(baseData([]), { locked: { unlocksAfterStep: 2 } });
    expect(screen.getByText(/Låses upp efter steg 02/)).toBeInTheDocument();
    expect(screen.queryByText("Konkurrent A")).not.toBeInTheDocument();
  });

  it("visar ett ärligt tomt läge för Jonas i stället för den generella låstexten", () => {
    renderMarket(baseData([]), { locked: "notInScenario" });
    expect(screen.getByText("Det här steget är inte genomfört i det här scenariot.")).toBeInTheDocument();
  });

  it("rubriken är branschen och spannet av anställda", () => {
    renderMarket(baseData([]));
    expect(screen.getByRole("heading", { level: 1, name: "Testbranschen, 3–25 anställda" })).toBeInTheDocument();
  });

  it("anger urvalet bakom varje median/andel i stället för att låtsas gälla hela registret", () => {
    renderMarket(baseData([]));
    expect(screen.getByText("3,0 Mkr")).toBeInTheDocument();
    expect(screen.getByText("Baserat på 30 av 50 bolag.")).toBeInTheDocument();
    expect(screen.getByText("Baserat på 25 av 50 bolag.")).toBeInTheDocument();
    expect(screen.getByText("Baserat på 45 av 50 bolag.")).toBeInTheDocument();
  });

  it("medianomsättningen bär spannet av räkenskapsår den bygger på", () => {
    renderMarket(baseData([]));
    const median = screen.getByText(m.medianRevenueLabel).parentElement!;
    expect(median).toHaveTextContent("3,0 Mkr (räkenskapsår 2023–2024)");
  });

  it("utan räkenskapsår visas luckan i stället för medianomsättningen", () => {
    renderMarket(baseData([], { registry: { ...registry, medianRevenueFiscalYears: null } }));
    const median = screen.getByText(m.medianRevenueLabel).parentElement!;
    expect(median).toHaveTextContent("—");
    expect(median).toHaveTextContent(sv.common.fiscalYearMissing);
    expect(median).not.toHaveTextContent(/Mkr|Baserat på/);
  });

  it("ett underlag på 0 bolag ger luckan, aldrig en nolla", () => {
    const unknown = { ...overview, growthSharePercent: 0, basis: { ...overview.basis!, growthCompanies: 0 } };
    renderMarket(baseData([], { registry: { ...registry, overview: unknown } }));
    const growth = screen.getByText(m.growthShareLabel).parentElement!;
    expect(growth).toHaveTextContent("—");
    expect(growth).toHaveTextContent(m.basisMissing);
    expect(growth.querySelector("dd")).toHaveTextContent(/^—$/);
  });

  it("visar datalagret med tre lager och en källa vardera", () => {
    const { container } = renderMarket(baseData([]));
    expect(screen.getByText("Register")).toBeInTheDocument();
    expect(screen.getByText("Årsredovisning")).toBeInTheDocument();
    expect(screen.getAllByText("Simulering").length).toBeGreaterThan(0);
    expect(container.textContent).toContain("Testkälla");
    expect(container.textContent).toContain("Hiasynth (koncept)");
  });

  it("visar storleksfördelningen i klasser, aldrig ett exakt anställningstal", () => {
    const { container } = renderMarket(baseData([]));
    expect(screen.getByText("SNI 69.201")).toBeInTheDocument();
    expect(container.textContent).toContain("Vanligast i urvalet: 1–4 anställda");
    expect(container.textContent).toContain("2 bolag av 5 (40 %)");
    expect(container.textContent).toContain("Baserat på 5 av 50 bolag.");
    expect(container.textContent).not.toMatch(/\b7 anställda\b/);
    expect(container.textContent).not.toMatch(/\b12 anställda\b/);
  });

  it("visar konkurrenter och simuleringen", () => {
    renderMarket(baseData([]));
    expect(screen.getByText("Konkurrent A")).toBeInTheDocument();
    expect(screen.getByText("Beskrivning A")).toBeInTheDocument();
    expect(screen.getByText("Resultat")).toBeInTheDocument();
  });

  it("visar att ingen kontaktlista är byggd än", () => {
    renderMarket(baseData([]));
    expect(screen.getByText("Ingen kontaktlista byggd än i det här scenariot.")).toBeInTheDocument();
  });

  it("visar att utskicket inte är skickat än, trots en klar kontaktlista", () => {
    renderMarket(baseData(campaignOf(["draft", "draft", "draft"])));
    expect(screen.getByText("Kontaktlistan är klar men inget utskick skickat än.")).toBeInTheDocument();
  });

  it("visar kontaktade, svarat och svarsfrekvens när utskicket är igång", () => {
    const { container } = renderMarket(baseData(campaignOf(["sent", "opened", "responded", "responded", "draft"])));
    const outreachSection = container.querySelector('[data-tour-id="market-outreach"]');
    expect(outreachSection?.textContent).toContain("4 / 5");
    expect(outreachSection?.textContent).toContain("Testutskick (Gmail)");
    expect(outreachSection?.textContent).toContain("50 %");
  });

  it("exempeletiketten och Saras branschtext visas bara för demots data", () => {
    renderMarket(baseData([]), { dataKind: "live" });
    expect(screen.queryByText(sv.site.demo.exampleLabel)).not.toBeInTheDocument();
    expect(screen.getByText(m.companyCountLabelLive)).toBeInTheDocument();
    expect(screen.queryByText(/69\.201 i registret/)).not.toBeInTheDocument();
  });

  it("saknad data ger Kommer snart per sektion, utan att släcka resten", () => {
    renderMarket(
      baseData([], {
        industryLabel: null,
        registry: { overview, companies: null, medianRevenueFiscalYears: null },
        outreach: null,
        simulation: null,
      }),
      { dataKind: "live" },
    );
    // Fördelningen, utskicket och simuleringen.
    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(3);
    expect(screen.getByRole("heading", { level: 1, name: m.title })).toBeInTheDocument();
    expect(screen.getByText("Konkurrent A")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
  });

  const noData: [MarketRegistry, string][] = [
    ["closed", m.registryClosed],
    ["failed", m.registryLoadFailed],
    ["notChosen", m.sniChooseFirst],
  ];
  for (const [state, text] of noData) {
    it(`registret "${state}" visar sitt läge i varje registersektion och ingen registersiffra`, () => {
      const { container } = renderMarket(
        { industryLabel: null, registry: state, outreach: null, simulation: null },
        { dataKind: "live" },
      );
      // Nyckeltalen, fördelningen och konkurrenterna.
      expect(screen.getAllByText(text)).toHaveLength(3);
      expect(container.textContent).not.toMatch(/Mkr|Baserat på|Testkälla|Konkurrent A|SNI 69/);
      expect(container.querySelector(".fdd-figures")).toBeNull();
      expect(container.querySelector(".fdd-bars")).toBeNull();
    });
  }

  it("branschväljaren: uppmaning utan val, felet vid ogiltig kod, dold vid stängd grind", () => {
    const picker: SniPicker = { basePath: "/app/marknad", current: null, invalid: false };
    const empty: MarketData = { industryLabel: null, registry: "notChosen", outreach: null, simulation: null };
    const { rerender } = renderMarket(empty, { dataKind: "live", sniPicker: picker });
    const input = screen.getByLabelText(m.sniPickerLabel);
    expect(input).toHaveAttribute("name", "sni");
    expect(input.closest("form")).toHaveAttribute("action", "/app/marknad");
    expect(screen.getByText(m.sniPrompt)).toBeInTheDocument();

    rerender(
      <LocaleProvider>
        <Market data={empty} dataKind="live" locked={null} sniPicker={{ ...picker, invalid: true }} />
      </LocaleProvider>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(m.sniInvalid);

    rerender(
      <LocaleProvider>
        <Market data={{ ...empty, registry: "closed" }} dataKind="live" locked={null} sniPicker={picker} />
      </LocaleProvider>,
    );
    expect(screen.queryByLabelText(m.sniPickerLabel)).not.toBeInTheDocument();
  });
});

describe("Market: spara registerbilden som underlag", () => {
  const picker: SniPicker = { basePath: "/app/marknad", current: "69.201", invalid: false };

  it("visas bara med en vald bransch och en marknadsbild, och sparar bara SNI-koden", async () => {
    const onSave = vi.fn(async () => ({ ok: true as const, total: 30, delta: 6 }));
    render(
      <LocaleProvider>
        <Market data={baseData([])} dataKind="live" locked={null} sniPicker={picker} evidence={{ onSave, scoreHref: "/app/poang" }} />
      </LocaleProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: m.evidence.save }));
    const link = await screen.findByRole("link", { name: "Sparat. Poängen är nu 30 (+6)" });
    expect(link).toHaveAttribute("href", "/app/poang");
    expect(onSave).toHaveBeenCalledWith("69.201");
  });

  it("utan vald bransch eller utan marknadsbild finns ingen knapp", () => {
    const onSave = vi.fn();
    const { rerender } = render(
      <LocaleProvider>
        <Market
          data={baseData([])}
          dataKind="live"
          locked={null}
          sniPicker={{ ...picker, current: null }}
          evidence={{ onSave, scoreHref: "/app/poang" }}
        />
      </LocaleProvider>,
    );
    expect(screen.queryByRole("button", { name: m.evidence.save })).not.toBeInTheDocument();
    rerender(
      <LocaleProvider>
        <Market data={{ ...baseData([]), registry: "closed" }} dataKind="live" locked={null} sniPicker={picker} evidence={{ onSave, scoreHref: "/app/poang" }} />
      </LocaleProvider>,
    );
    expect(screen.queryByRole("button", { name: m.evidence.save })).not.toBeInTheDocument();
  });

  it("ett misslyckat sparande säger det, utan att visa en poäng", async () => {
    const onSave = vi.fn(async () => ({ ok: false as const, reason: "failed" }));
    render(
      <LocaleProvider>
        <Market data={baseData([])} dataKind="live" locked={null} sniPicker={picker} evidence={{ onSave, scoreHref: "/app/poang" }} />
      </LocaleProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: m.evidence.save }));
    expect(await screen.findByRole("alert")).toHaveTextContent(m.evidence.failed);
    expect(screen.queryByRole("link", { name: /Poängen är nu/ })).not.toBeInTheDocument();
  });
});
