import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import type { DataKind } from "@/core/domain";
import type { ResponseCard, ValidationAssumption } from "@/ports/OutreachProvider";
import type { Simulation } from "@/ports/SimulationProvider";
import { Validation, type ValidationData, type ValidationLock, type ValidationRow } from "./Validation";

const outreachSource = { namn: "Testutskick (Gmail)", hämtad: "2026-01-19" };

const rows: ValidationRow[] = [
  {
    companyName: "A",
    sniCode: "69.201",
    employees: 8,
    revenueKsek: 4200,
    revenueFiscalYear: 2024,
    status: "responded",
    quote: "Bra.",
  },
  { companyName: "B", sniCode: "69.201", employees: 6, revenueKsek: 3200, revenueFiscalYear: null, status: "opened" },
  { companyName: "C", sniCode: "69.201", employees: 12, revenueKsek: 6000, revenueFiscalYear: 2023, status: "draft" },
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

const simulation: Simulation = {
  question: "Vad tål byråerna att betala?",
  populationSize: 215,
  source: { namn: "Hiasynth (koncept)", hämtad: "2026-01-12" },
  result: "5–9 anställda: ~600–900 kr/mån.",
  uncertaintyRangeLabel: "Osäkerhet ±15 %",
};

function baseData(overrides: Partial<ValidationData> = {}): ValidationData {
  return {
    rows,
    outreachSource,
    dateRange: { startIso: "2026-01-14", endIso: "2026-01-20" },
    openRate: 38,
    openRateSource: outreachSource,
    assumptions,
    responses,
    verdict: { score: 41, headline: "Förfina", reasoning: "Problemet är verkligt, priset för högt." },
    simulation,
    ...overrides,
  };
}

/** Så ser /app ut i dag: inga liveadaptrar ger något av Valideringens innehåll. */
const liveData: ValidationData = {
  rows: null,
  outreachSource: null,
  dateRange: null,
  openRate: null,
  openRateSource: null,
  assumptions: null,
  responses: null,
  verdict: null,
  simulation: null,
};

function renderValidation(data: ValidationData, locked: ValidationLock = null, dataKind: DataKind = "example") {
  return render(
    <LocaleProvider>
      <Validation data={data} dataKind={dataKind} locked={locked} />
    </LocaleProvider>,
  );
}

const v = sv.validationPage;

afterEach(() => cleanup());

describe("Validation (skärmen, PR 7)", () => {
  it("låst läge visar bara huvudet och när sidan låses upp", () => {
    renderValidation(baseData(), { unlocksAfterStep: 3 });
    expect(screen.getByRole("heading", { level: 1, name: v.title })).toBeInTheDocument();
    expect(screen.getByText(`${sv.homePage.unlocksAfterStepBefore} 03`)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByText(v.kpiTitle)).not.toBeInTheDocument();
  });

  it("utanför scenariot säger det, utan påhittade rader", () => {
    renderValidation(baseData(), "notInScenario");
    expect(screen.getByText(sv.homePage.notInThisScenario)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("nyckeltalen räknas ur kontaktlistan och bär källa", () => {
    renderValidation(baseData());
    const figures = screen.getByText(v.contactedLabel).closest("dl")!;
    // A svarat, B öppnat, C utkast: 2 kontaktade, 1 svar, 50 %.
    expect(within(figures).getByText(v.contactedLabel).nextElementSibling).toHaveTextContent("2");
    expect(within(figures).getByText(v.respondedLabel).nextElementSibling).toHaveTextContent("1");
    expect(within(figures).getByText(v.responseRateLabel).nextElementSibling).toHaveTextContent("50 %");
    expect(within(figures).getByText(v.openRateLabel).nextElementSibling).toHaveTextContent("38 %");
    expect(within(figures).getAllByText(/Testutskick \(Gmail\)/).length).toBeGreaterThanOrEqual(3);
  });

  it("antal anställda visas som storleksklass, aldrig som exakt tal", () => {
    renderValidation(baseData());
    const table = screen.getByRole("table");
    expect(within(table).getAllByText("5–9")).toHaveLength(2);
    expect(within(table).getByText("10–19")).toBeInTheDocument();
    for (const exact of ["8", "6", "12"]) {
      expect(within(table).queryByText(exact)).not.toBeInTheDocument();
    }
    expect(screen.getByText(/Stockholms län, 5–9/)).toBeInTheDocument();
  });

  it("omsättningen visas med sitt räkenskapsår, och utan år visas luckan", () => {
    renderValidation(baseData());
    const table = screen.getByRole("table");
    expect(within(table).getByText(/^4\s200 tkr \(räkenskapsår 2024\)$/)).toBeInTheDocument();
    expect(within(table).getByText(/^6\s000 tkr \(räkenskapsår 2023\)$/)).toBeInTheDocument();
    // B saknar år: ingen siffra alls, bara luckan (och en förklaring för skärmläsare).
    expect(within(table).queryByText(/3\s200/)).not.toBeInTheDocument();
    expect(within(table).getByText(sv.common.fiscalYearMissing)).toBeInTheDocument();
  });

  it("antagandena visar dom och källa, svaren citat, dom och pris", () => {
    renderValidation(baseData());
    expect(screen.getByText("Byråerna har ett verkligt kvittoproblem.")).toBeInTheDocument();
    expect(screen.getByText(v.assumptionVerdict.contradicted)).toBeInTheDocument();
    expect(screen.getAllByText(/Kundsamtal, steg 05–06/).length).toBeGreaterThan(0);
    expect(screen.getByText("”Ett citat.”")).toBeInTheDocument();
    expect(screen.getByText(v.responseVerdict.partial)).toBeInTheDocument();
    expect(screen.getAllByText(`${v.priceTestedLabel}: 2 000 kr`)).toHaveLength(2);
  });

  it("domen visas med konfidensraden räknad ur nyckeltalen", () => {
    renderValidation(baseData());
    expect(screen.getByText("Förfina")).toBeInTheDocument();
    expect(screen.getByText(`${v.confidencePrefix} 1 av 2 ${v.confidenceContactedUnit} (50 % ${v.confidenceRateSuffix}).`)).toBeInTheDocument();
  });

  it("exempeletiketten visas bara för demots data", () => {
    renderValidation(baseData());
    expect(screen.getAllByText(sv.site.demo.exampleLabel)).toHaveLength(2);
    cleanup();
    renderValidation(baseData(), null, "live");
    expect(screen.queryByText(sv.site.demo.exampleLabel)).not.toBeInTheDocument();
  });

  it("steg som inte är nådda döljer sina sektioner, utan Kommer snart", () => {
    renderValidation(baseData({ assumptions: [], responses: [], verdict: "notReached", simulation: "notReached" }));
    expect(screen.queryByText(v.assumptionsTitle)).not.toBeInTheDocument();
    expect(screen.queryByText(v.responsesTitle)).not.toBeInTheDocument();
    expect(screen.queryByText(v.verdictTitle)).not.toBeInTheDocument();
    expect(screen.queryByText(v.simulationTitle)).not.toBeInTheDocument();
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("saknad data ger Kommer snart per sektion, aldrig en nolla", () => {
    renderValidation(liveData, null, "live");
    // Nyckeltalen, domen, antagandena, svaren, listan och simuleringen.
    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(6);
    expect(screen.queryByText(v.contactedLabel)).not.toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText(v.simulationTitleLive)).toBeInTheDocument();
    expect(screen.queryByText(v.simulationTitle)).not.toBeInTheDocument();
  });

  it("en saknad kontaktlista släcker inte domen eller antagandena", () => {
    renderValidation(baseData({ rows: null, outreachSource: null }));
    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(2);
    expect(screen.getByText("Förfina")).toBeInTheDocument();
    expect(screen.queryByText(new RegExp(v.confidencePrefix))).not.toBeInTheDocument();
    expect(screen.getByText("Byråerna har ett verkligt kvittoproblem.")).toBeInTheDocument();
  });
});
