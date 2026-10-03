import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { fill } from "@/i18n/fill";
import { NotImplementedError, RegistryLockedError, RegistryTransportError } from "@/core/errors";
import type { JourneyStepStatus, JourneyStepView } from "@/ports/JourneyRepository";
import type { MarketOverview, RegistryCompany } from "@/ports/RegistryProvider";

const getStepsMock = vi.hoisted(() => vi.fn());
const searchCompaniesMock = vi.hoisted(() => vi.fn());
const getMarketOverviewMock = vi.hoisted(() => vi.fn());
const assertAccessMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/JourneyRepository", () => ({
  liveJourneyRepository: { getSteps: getStepsMock, getStepDetail: vi.fn(), getHomeSummary: vi.fn() },
}));
const listEvidenceMock = vi.hoisted(() => vi.fn());
const industryNameMock = vi.hoisted(() => vi.fn());
const searchIndustriesMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/RegistryProvider", () => ({
  liveRegistryProvider: { searchCompanies: searchCompaniesMock, getMarketOverview: getMarketOverviewMock },
  getLiveIndustryName: industryNameMock,
  searchLiveIndustries: searchIndustriesMock,
}));
vi.mock("@/adapters/live/EvidenceRecorder", () => ({ liveEvidenceRecorder: { listEvidence: listEvidenceMock } }));
vi.mock("./actions", () => ({ chooseIndustry: vi.fn() }));
vi.mock("@/lib/server/registryAccess", () => ({ assertRegistryAccessAllowed: assertAccessMock }));

const m = sv.marketPage;

/** Tolv steg där `current` är det aktuella; tidigare steg klara, senare låsta. */
function stepsAt(current: number): JourneyStepView[] {
  return Array.from({ length: 12 }, (_, index) => {
    const stepNumber = index + 1;
    const status: JourneyStepStatus = stepNumber < current ? "done" : stepNumber === current ? "current" : "locked";
    return { stepNumber, journeyPhase: "discover", title: `Steg ${stepNumber}`, oneLiner: "", maxPoints: 5, status };
  });
}

const overview: MarketOverview = {
  companyCount: 1234,
  medianRevenueKsek: 5100,
  growthSharePercent: 21,
  regionSharePercent: 33,
  source: { namn: "Bolagsverket och SCB", hämtad: "2026-09-30" },
  competitors: [{ name: "Riktig Konkurrent AB", description: "Gör något liknande." }],
  basis: { medianRevenueCompanies: 80, growthCompanies: 70, regionCompanies: 1200 },
};
const companies: RegistryCompany[] = [
  { name: "Riktig AB", sniCode: "62.010", employees: 7, revenueKsek: 3100, county: "Stockholms län" },
  { name: "Annan AB", sniCode: "62.010", employees: 22, revenueKsek: 9000, county: "" },
];

async function renderPage(query: Record<string, string> = {}) {
  const { default: LiveMarketPage } = await import("./page");
  const ui = await LiveMarketPage({ searchParams: Promise.resolve(query) });
  return render(<LocaleProvider>{ui}</LocaleProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
  assertAccessMock.mockResolvedValue(undefined);
  getMarketOverviewMock.mockResolvedValue(overview);
  searchCompaniesMock.mockResolvedValue(companies);
  listEvidenceMock.mockResolvedValue([]);
  industryNameMock.mockResolvedValue(null);
  searchIndustriesMock.mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
});

describe("/app/marknad", () => {
  it("låst till steg 02: varken grinden eller Registret anropas", async () => {
    getStepsMock.mockResolvedValue(stepsAt(2));
    await renderPage({ sni: "62.010" });

    expect(screen.getByRole("heading", { level: 1, name: m.title })).toBeInTheDocument();
    expect(screen.getByText(`${sv.homePage.unlocksAfterStepBefore} 02`)).toBeInTheDocument();
    expect(assertAccessMock).not.toHaveBeenCalled();
    expect(getMarketOverviewMock).not.toHaveBeenCalled();
    expect(searchCompaniesMock).not.toHaveBeenCalled();
  });

  it("stängd licensgrind: Registret anropas aldrig, ingen väljare och inga registersiffror", async () => {
    getStepsMock.mockResolvedValue(stepsAt(5));
    assertAccessMock.mockRejectedValue(new RegistryLockedError());
    const { container } = await renderPage({ sni: "62.010" });

    expect(screen.getAllByText(m.registryClosed)).toHaveLength(3);
    expect(getMarketOverviewMock).not.toHaveBeenCalled();
    expect(searchCompaniesMock).not.toHaveBeenCalled();
    expect(screen.queryByLabelText(m.industry.orCodeLabel)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(m.industry.searchLabel)).not.toBeInTheDocument();
    expect(container.querySelector(".fdd-figures, .fdd-bars")).toBeNull();
    expect(container.textContent).not.toMatch(/1\s234|Riktig|Mkr|Baserat på/);
  });

  it("grinden som stängs mellan frågan och anropen visar ändå ingenting", async () => {
    getStepsMock.mockResolvedValue(stepsAt(5));
    getMarketOverviewMock.mockRejectedValue(new RegistryLockedError());
    const { container } = await renderPage({ sni: "62.010" });

    expect(screen.getAllByText(m.registryClosed)).toHaveLength(3);
    // Bolagslistan kom tillbaka, men visas inte när en del av registret är stängd.
    expect(container.textContent).not.toMatch(/Riktig|anställda|SNI 62/);
  });

  it("utan vald bransch anropas inte Registret; väljaren och uppmaningen visas", async () => {
    getStepsMock.mockResolvedValue(stepsAt(5));
    await renderPage();

    expect(assertAccessMock).toHaveBeenCalled();
    expect(getMarketOverviewMock).not.toHaveBeenCalled();
    // Sök på namn först, koden som alternativ (steg 03, 2026-10-04).
    expect(screen.getByLabelText(m.industry.searchLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(m.industry.orCodeLabel)).toBeInTheDocument();
    expect(screen.getAllByText(m.sniChooseFirst)).toHaveLength(3);
  });

  it("en ogiltig kod anropar inte Registret och säger att koden är fel", async () => {
    getStepsMock.mockResolvedValue(stepsAt(5));
    await renderPage({ sni: "69201; drop" });

    expect(getMarketOverviewMock).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(m.sniInvalid);
    expect(screen.getByLabelText(m.industry.orCodeLabel)).toHaveValue("");
  });

  it("öppen grind: riktig registerbild, men medianen visas som lucka utan räkenskapsår", async () => {
    getStepsMock.mockResolvedValue(stepsAt(5));
    await renderPage({ sni: "62.010" });

    expect(getMarketOverviewMock).toHaveBeenCalledWith("sv", "62.010");
    expect(searchCompaniesMock).toHaveBeenCalledWith({ sniCode: "62.010" });
    expect(screen.getByText(m.companyCountLabelLive).parentElement).toHaveTextContent(/1\s234/);
    const median = screen.getByText(m.medianRevenueLabel).parentElement!;
    expect(median).toHaveTextContent(sv.common.fiscalYearMissing);
    expect(median).not.toHaveTextContent(/Mkr/);
    expect(screen.getByText("Riktig Konkurrent AB")).toBeInTheDocument();
    // Källgenomgången: konkurrenten bär registrets källa, som nyckeltalen.
    const competitor = screen.getByText("Riktig Konkurrent AB").closest("li")!;
    expect(competitor).toHaveTextContent("Bolagsverket och SCB");
    // Utskicket och simuleringen har ingen livekälla: Kommer snart, aldrig demodata.
    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(2);
    expect(screen.queryByText(sv.site.demo.exampleLabel)).not.toBeInTheDocument();
    expect(screen.queryByText(/byrå/i)).not.toBeInTheDocument();
    // PR 11: demots exempelkällor läcker aldrig in i /app.
    expect(screen.queryByText(sv.common.exampleSourceLabel)).not.toBeInTheDocument();
    expect(screen.queryByText(/Påhittad data/)).not.toBeInTheDocument();
  });

  it("ett transportfel visar felrutan i registersektionerna, aldrig feltexten", async () => {
    getStepsMock.mockResolvedValue(stepsAt(5));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    getMarketOverviewMock.mockRejectedValue(
      new RegistryTransportError("SCB-transporten är inte skriven än", { cause: "hemligt svar" }),
    );
    const { container } = await renderPage({ sni: "62.010" });

    expect(screen.getAllByText(m.registryLoadFailed)).toHaveLength(3);
    expect(container.textContent).not.toMatch(/SCB-transporten|hemligt/);
    expect(consoleError.mock.calls.flat().join(" ")).not.toContain("hemligt");
    consoleError.mockRestore();
  });

  it("okända steg ger inget låst läge", async () => {
    getStepsMock.mockRejectedValue(new NotImplementedError("Resan", "docs/moduler/resan.md"));
    await renderPage({ sni: "62.010" });
    expect(screen.queryByText(`${sv.homePage.unlocksAfterStepBefore} 02`)).not.toBeInTheDocument();
  });

  it("ett riktigt fel sväljs inte", async () => {
    getStepsMock.mockResolvedValue(stepsAt(5));
    searchCompaniesMock.mockRejectedValue(new Error("Supabase svarar inte"));
    await expect(renderPage({ sni: "62.010" })).rejects.toThrow("Supabase svarar inte");
  });

  it("skickar inga funktioner som props till skärmen", async () => {
    getStepsMock.mockResolvedValue(stepsAt(5));
    const { default: LiveMarketPage } = await import("./page");
    const tree = (await LiveMarketPage({ searchParams: Promise.resolve({ sni: "62.010" }) })) as {
      props: Record<string, unknown>;
    };
    for (const value of Object.values(tree.props)) expect(typeof value).not.toBe("function");
  });
});

describe("/app/marknad: min bransch (steg 03)", () => {
  const view = (subjectRef: string, status = "counted") => ({
    id: "e1",
    partId: "market",
    kind: "registerMarketCount",
    kindLabel: "Antal bolag i registret",
    subjectRef,
    source: { namn: "SCB:s företagsregister", hämtad: "2026-10-04" },
    enteredBy: "system",
    selfReported: false,
    status,
    canRetract: false,
  });

  it("utan kod i adressen öppnas grundarens valda bransch, med SCB:s namn och etiketten Din bransch", async () => {
    getStepsMock.mockResolvedValue(stepsAt(5));
    listEvidenceMock.mockResolvedValue([view("sni:62.010")]);
    industryNameMock.mockResolvedValue("Dataprogrammering");
    await renderPage();
    expect(getMarketOverviewMock).toHaveBeenCalledWith("sv", "62.010");
    expect(screen.getByRole("heading", { level: 1, name: /^Dataprogrammering \(62\.010\)/ })).toBeInTheDocument();
    expect(screen.getByText(m.industry.chosenLabel)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: m.industry.chooseCta })).not.toBeInTheDocument();
  });

  it("ett föråldrat bevis räknas inte som vald bransch", async () => {
    getStepsMock.mockResolvedValue(stepsAt(5));
    listEvidenceMock.mockResolvedValue([view("sni:62.010", "stale")]);
    await renderPage();
    expect(getMarketOverviewMock).not.toHaveBeenCalled();
  });

  it("en annan bransch i adressen visar knappen Det här är min bransch", async () => {
    getStepsMock.mockResolvedValue(stepsAt(3));
    await renderPage({ sni: "62.010" });
    expect(screen.getByRole("button", { name: m.industry.chooseCta })).toBeInTheDocument();
    expect(screen.getByText(m.industry.chooseHint)).toBeInTheDocument();
  });

  it("utan bolag med koden finns ingen knapp, bara en uppmaning att prova en annan bransch", async () => {
    getStepsMock.mockResolvedValue(stepsAt(3));
    getMarketOverviewMock.mockResolvedValue({ ...overview, companyCount: 0 });
    await renderPage({ sni: "62.010" });
    expect(screen.queryByRole("button", { name: m.industry.chooseCta })).not.toBeInTheDocument();
    expect(screen.getByText(m.industry.noCompanies)).toBeInTheDocument();
  });

  it("efter valet säger sidan att steget är klart och länkar till resan", async () => {
    getStepsMock.mockResolvedValue(stepsAt(4));
    await renderPage({ sni: "62.010", sparad: "steg3" });
    expect(screen.getByText(fill(m.industry.savedStepDoneTemplate, { step: "03" }))).toBeInTheDocument();
    expect(screen.getByRole("link", { name: m.industry.openJourneyCta })).toHaveAttribute("href", "/app/resan");
  });

  it("sökningen på namn listar SCB:s branscher som länkar till koden", async () => {
    getStepsMock.mockResolvedValue(stepsAt(3));
    searchIndustriesMock.mockResolvedValue([{ sniCode: "43.210", name: "Elinstallationer" }]);
    await renderPage({ q: "elinstall" });
    expect(searchIndustriesMock).toHaveBeenCalledWith("elinstall");
    expect(screen.getByRole("link", { name: /Elinstallationer/ })).toHaveAttribute("href", "/app/marknad?sni=43.210");
    // Ingen bransch vald än: registret anropas inte.
    expect(getMarketOverviewMock).not.toHaveBeenCalled();
  });

  it("en sökning utan träffar säger det", async () => {
    getStepsMock.mockResolvedValue(stepsAt(3));
    await renderPage({ q: "zzzz" });
    expect(screen.getByText(fill(m.industry.searchEmptyTemplate, { query: "zzzz" }))).toBeInTheDocument();
  });
});
