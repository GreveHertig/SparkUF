import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { NotImplementedError, OutreachSendDisabledError, RegistryLockedError } from "@/core/errors";
import type { JourneyStepStatus, JourneyStepView } from "@/ports/JourneyRepository";
import type { CampaignRow } from "@/ports/OutreachProvider";

const getStepsMock = vi.hoisted(() => vi.fn());
const getStepDetailMock = vi.hoisted(() => vi.fn());
const getCampaignMock = vi.hoisted(() => vi.fn());
const searchCompaniesMock = vi.hoisted(() => vi.fn());
const getMarketOverviewMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/JourneyRepository", () => ({
  liveJourneyRepository: { getSteps: getStepsMock, getStepDetail: getStepDetailMock, getHomeSummary: vi.fn() },
}));
vi.mock("@/adapters/live/OutreachProvider", () => ({
  liveOutreachProvider: { getCampaign: getCampaignMock, getStatuses: vi.fn(), send: vi.fn() },
}));
// Licensgrinden: stängd grind. Rutten får aldrig nå Registret.
vi.mock("@/adapters/live/RegistryProvider", () => ({
  liveRegistryProvider: { searchCompanies: searchCompaniesMock, getMarketOverview: getMarketOverviewMock },
}));

const v = sv.validationPage;

/** Tolv steg där `current` är det aktuella; tidigare steg klara, senare låsta. */
function stepsAt(current: number): JourneyStepView[] {
  return Array.from({ length: 12 }, (_, index) => {
    const stepNumber = index + 1;
    const status: JourneyStepStatus = stepNumber < current ? "done" : stepNumber === current ? "current" : "locked";
    return { stepNumber, journeyPhase: "discover", title: `Steg ${stepNumber}`, oneLiner: "", maxPoints: 5, status };
  });
}

const rows: CampaignRow[] = [
  { companyName: "Riktig AB", sniCode: "69.201", employees: 7, revenueKsek: 3100, status: "responded" },
  { companyName: "Annan AB", sniCode: "69.201", employees: 22, revenueKsek: 9000, status: "sent" },
];

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function renderPage() {
  searchCompaniesMock.mockRejectedValue(new RegistryLockedError());
  getMarketOverviewMock.mockRejectedValue(new RegistryLockedError());
  const { default: LiveValidationPage } = await import("./page");
  const tree = await LiveValidationPage();
  return render(<LocaleProvider>{tree}</LocaleProvider>);
}

describe("/app/validering (PR 7)", () => {
  it("är låst tills steg 03 är klart, och hämtar då inget annat", async () => {
    getStepsMock.mockResolvedValue(stepsAt(1));

    await renderPage();

    expect(screen.getByRole("heading", { level: 1, name: v.title })).toBeInTheDocument();
    expect(screen.getByText(`${sv.homePage.unlocksAfterStepBefore} 03`)).toBeInTheDocument();
    expect(getCampaignMock).not.toHaveBeenCalled();
    expect(getStepDetailMock).not.toHaveBeenCalled();
  });

  it("sändspärren ger Kommer snart per sektion, utan demodata och utan exempeletikett", async () => {
    getStepsMock.mockResolvedValue(stepsAt(4));
    getCampaignMock.mockRejectedValue(new OutreachSendDisabledError());

    await renderPage();

    // Nyckeltalen, antagandena, svaren, listan och simuleringen. Domen är inte nådd.
    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(5);
    expect(screen.queryByText(v.verdictTitle)).not.toBeInTheDocument();
    expect(screen.queryByText(sv.site.demo.exampleLabel)).not.toBeInTheDocument();
    expect(screen.queryByText(/byrå/i)).not.toBeInTheDocument();
    expect(screen.getByText(v.simulationTitleLive)).toBeInTheDocument();
    expect(getStepDetailMock).not.toHaveBeenCalled();
  });

  it("från steg 06 visar domen Kommer snart, eftersom liveadaptern inte ger någon dom", async () => {
    getStepsMock.mockResolvedValue(stepsAt(6));
    getCampaignMock.mockRejectedValue(new OutreachSendDisabledError());
    getStepDetailMock.mockResolvedValue({ ...stepsAt(6)[5], verdict: null, scoreDelta: null });

    await renderPage();

    expect(screen.getByText(v.verdictTitle)).toBeInTheDocument();
    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(6);
    expect(getStepDetailMock).toHaveBeenCalledWith(6, "sv");
  });

  it("en riktig kontaktlista visas med storleksklass, inte exakt antal", async () => {
    getStepsMock.mockResolvedValue(stepsAt(5));
    getCampaignMock.mockResolvedValue(rows);

    await renderPage();

    const table = screen.getByRole("table");
    expect(table).toHaveTextContent("Riktig AB");
    expect(table).toHaveTextContent("5–9");
    expect(table).toHaveTextContent("20–49");
    expect(table).not.toHaveTextContent(/\b(7|22)\b/);
    // Porten bär inget räkenskapsår: omsättningen visas inte, luckan visas.
    expect(table).not.toHaveTextContent(/3\s100|9\s000|tkr/);
    expect(table).toHaveTextContent(sv.common.fiscalYearMissing);
    expect(screen.getByText(v.responseRateLabel).nextElementSibling).toHaveTextContent("50 %");
    expect(screen.queryByText(sv.site.demo.exampleLabel)).not.toBeInTheDocument();
  });

  it("stängd licensgrind: Registret anropas aldrig och inga registersiffror visas", async () => {
    getStepsMock.mockResolvedValue(stepsAt(12));
    getCampaignMock.mockRejectedValue(new OutreachSendDisabledError());
    getStepDetailMock.mockResolvedValue({ ...stepsAt(12)[5], verdict: null, scoreDelta: null });

    await renderPage();

    expect(searchCompaniesMock).not.toHaveBeenCalled();
    expect(getMarketOverviewMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByText(new RegExp(sv.marketPage.companiesUnit))).not.toBeInTheDocument();
    const source = readFileSync(join(__dirname, "page.tsx"), "utf8");
    expect(source).not.toMatch(/from ["']@\/adapters\/live\/RegistryProvider["']/);
  });

  it("okända steg ger inget låst läge; sektionerna visar sina luckor", async () => {
    getStepsMock.mockRejectedValue(new NotImplementedError("Resan", "docs/moduler/resan.md"));
    getCampaignMock.mockRejectedValue(new OutreachSendDisabledError());

    await renderPage();

    expect(screen.queryByText(`${sv.homePage.unlocksAfterStepBefore} 03`)).not.toBeInTheDocument();
    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(5);
  });

  it("ett riktigt fel sväljs inte", async () => {
    getStepsMock.mockResolvedValue(stepsAt(5));
    getCampaignMock.mockRejectedValue(new Error("Supabase svarar inte"));

    await expect(renderPage()).rejects.toThrow("Supabase svarar inte");
  });

  it("skickar inga funktioner som props till skärmen", async () => {
    getStepsMock.mockResolvedValue(stepsAt(5));
    getCampaignMock.mockResolvedValue(rows);
    const { default: LiveValidationPage } = await import("./page");
    const tree = (await LiveValidationPage()) as { props: Record<string, unknown> };
    for (const value of Object.values(tree.props)) expect(typeof value).not.toBe("function");
  });
});
