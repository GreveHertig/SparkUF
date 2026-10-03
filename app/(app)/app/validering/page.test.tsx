import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { fill } from "@/i18n/fill";
import { EmptyStateError, NotImplementedError } from "@/core/errors";
import { buildVerdictReport } from "@/core/verdictReport";
import { toVerdictInput } from "@/core/validationLog";
import type { JourneyStepStatus, JourneyStepView } from "@/ports/JourneyRepository";
import type { ConversationAnswer, ValidationContact } from "@/ports/ValidationLog";

const getStepsMock = vi.hoisted(() => vi.fn());
const getContactsMock = vi.hoisted(() => vi.fn());
const getVerdictReportMock = vi.hoisted(() => vi.fn());
const getProjectMock = vi.hoisted(() => vi.fn());
const getCampaignMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/JourneyRepository", () => ({
  liveJourneyRepository: { getSteps: getStepsMock, getStepDetail: vi.fn(), getHomeSummary: vi.fn() },
}));
vi.mock("@/adapters/live/ValidationLog", () => ({ liveValidationLog: { getContacts: getContactsMock } }));
vi.mock("@/adapters/live/VerdictProvider", () => ({
  liveVerdictProvider: { getVerdictReport: getVerdictReportMock, getVerdictInput: vi.fn() },
}));
vi.mock("@/adapters/live/ProjectRepository", () => ({ liveProjectRepository: { getProject: getProjectMock } }));
// Sändspärren: sidan får aldrig röra Utskick och svar.
vi.mock("@/adapters/live/OutreachProvider", () => ({
  liveOutreachProvider: { getCampaign: getCampaignMock, getStatuses: vi.fn(), send: vi.fn() },
}));
vi.mock("@/adapters/live/evidenceScore", () => ({ stockholmToday: () => "2026-10-04" }));
vi.mock("./actions", () => ({
  addValidationContact: vi.fn(),
  pasteValidationContacts: vi.fn(),
  markValidationContacted: vi.fn(),
  markValidationDeclined: vi.fn(),
  removeValidationContact: vi.fn(),
  logValidationAnswer: vi.fn(),
}));

const v = sv.validationPage;
const copy = sv.validationLog;

function stepsAt(current: number): JourneyStepView[] {
  return Array.from({ length: 12 }, (_, index) => {
    const stepNumber = index + 1;
    const status: JourneyStepStatus = stepNumber < current ? "done" : stepNumber === current ? "current" : "locked";
    return { stepNumber, journeyPhase: "discover", title: `Steg ${stepNumber}`, oneLiner: "", maxPoints: 5, status };
  });
}

const answer = (overrides: Partial<ConversationAnswer> = {}): ConversationAnswer => ({
  respondedOnIso: "2026-10-01",
  sizeClass: "tenToNineteen",
  problemStance: "confirms",
  priceStance: "accepts",
  priceTestedKr: 990,
  counterOfferKr: null,
  quote: "Vi lägger flera timmar i veckan på det här.",
  ...overrides,
});

let n = 0;
function contact(status: ValidationContact["status"], a?: ConversationAnswer, name?: string): ValidationContact {
  n += 1;
  return {
    id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
    companyName: name ?? `Bolag ${n} AB`,
    sizeClass: a?.sizeClass ?? null,
    channel: status === "planned" ? null : "phone",
    status,
    contactedOnIso: status === "planned" ? null : "2026-09-29",
    answer: status === "responded" ? (a ?? answer()) : null,
    createdAtIso: "2026-09-28T10:00:00Z",
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function renderPage() {
  const { default: LiveValidationPage } = await import("./page");
  const tree = await LiveValidationPage();
  return render(<LocaleProvider>{tree}</LocaleProvider>);
}

describe("/app/validering: samtalsloggen", () => {
  it("är låst tills steg 02 är klart, och hämtar då inget annat", async () => {
    getStepsMock.mockResolvedValue(stepsAt(2));
    await renderPage();
    expect(screen.getByRole("heading", { level: 1, name: v.title })).toBeInTheDocument();
    expect(screen.getByText(`${sv.homePage.unlocksAfterStepBefore} 02`)).toBeInTheDocument();
    expect(getContactsMock).not.toHaveBeenCalled();
    expect(getVerdictReportMock).not.toHaveBeenCalled();
  });

  it("utan tabell eller projekt visas Kommer snart, och Utskick och svar rörs aldrig", async () => {
    getStepsMock.mockResolvedValue(stepsAt(3));
    getContactsMock.mockRejectedValue(new NotImplementedError("Valideringen", "docs/moduler/validering.md"));
    getVerdictReportMock.mockRejectedValue(new NotImplementedError("Valideringen", "docs/moduler/validering.md"));
    getProjectMock.mockRejectedValue(new EmptyStateError("Projekt", "docs"));
    await renderPage();
    expect(screen.getByText(sv.comingSoon.title)).toBeInTheDocument();
    expect(getCampaignMock).not.toHaveBeenCalled();
  });

  it("en tom lista leder till att lägga till bolag, och visar guiden med projektets namn", async () => {
    getStepsMock.mockResolvedValue(stepsAt(3));
    getContactsMock.mockResolvedValue([]);
    getVerdictReportMock.mockResolvedValue(null);
    getProjectMock.mockResolvedValue({ id: "p", name: "Kvittly", oneLiner: "" });
    await renderPage();
    expect(screen.getByText(fill(copy.next.addContacts, { missing: 15 }))).toBeInTheDocument();
    expect(screen.getByText(copy.listEmpty)).toBeInTheDocument();
    expect(screen.queryByText(copy.kpiTitle)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.verdictTitle)).not.toBeInTheDocument();
    expect(screen.getByText(fill(copy.guide.message, { project: "Kvittly" }))).toBeInTheDocument();
  });

  it("visar nyckeltal, framsteg mot steg 06, domen och svaren, med källa på varje", async () => {
    getStepsMock.mockResolvedValue(stepsAt(5));
    const contacts = [
      contact("responded", answer(), "Kvittly AB"),
      contact("responded", answer({ sizeClass: "oneToFour", priceStance: "declines", counterOfferKr: 400, quote: "Det är för dyrt för oss just nu." })),
      contact("responded", answer({ sizeClass: "twentyToFortyNine" })),
      contact("contacted"),
      contact("planned"),
    ];
    getContactsMock.mockResolvedValue(contacts);
    getVerdictReportMock.mockResolvedValue(buildVerdictReport(toVerdictInput(contacts, "2026-10-04"), sv));
    getProjectMock.mockResolvedValue(null);
    await renderPage();

    const kpis = screen.getByRole("region", { name: copy.kpiTitle });
    expect(within(kpis).getByText(copy.contactedLabel)).toBeInTheDocument();
    expect(within(kpis).getAllByText(copy.sourceName).length).toBeGreaterThan(0);

    expect(screen.getByText(fill(copy.progressAnswers, { count: 6, min: 5 }))).toBeInTheDocument();
    expect(screen.getByText(fill(copy.progressCompanies, { count: 3, min: 3 }))).toBeInTheDocument();
    expect(screen.getByRole("link", { name: copy.progressStepLink })).toHaveAttribute("href", "/app/resan/6");

    // Tre svar: för litet underlag för en dom, och Domen säger det själv.
    const verdict = screen.getByRole("region", { name: copy.verdictTitle });
    expect(within(verdict).getByText(sv.verdict.decision.insufficient)).toBeInTheDocument();
    expect(within(verdict).queryByText(sv.site.proof.outOf)).not.toBeInTheDocument();

    const answers = screen.getByRole("region", { name: copy.quotesTitle });
    expect(within(answers).getByText("”Det är för dyrt för oss just nu.”")).toBeInTheDocument();
    expect(within(answers).getAllByRole("button", { name: sv.common.sourceTag.openDetails })).toHaveLength(3);
  });

  it("varnar när alla svar är positiva", async () => {
    getStepsMock.mockResolvedValue(stepsAt(5));
    const contacts = [contact("responded"), contact("responded"), contact("responded")];
    getContactsMock.mockResolvedValue(contacts);
    getVerdictReportMock.mockResolvedValue(null);
    getProjectMock.mockResolvedValue(null);
    await renderPage();
    expect(screen.getByText(copy.warnings.allPositive)).toBeInTheDocument();
  });

  it("ett planerat bolag kan markeras kontaktat, ett kontaktat kan få ett svar", async () => {
    getStepsMock.mockResolvedValue(stepsAt(3));
    getContactsMock.mockResolvedValue([contact("planned", undefined, "Planerad AB"), contact("contacted", undefined, "Kontaktad AB")]);
    getVerdictReportMock.mockResolvedValue(null);
    getProjectMock.mockResolvedValue(null);
    await renderPage();

    const list = screen.getByRole("region", { name: copy.listTitle });
    const planned = within(list).getByText("Planerad AB").closest("li")!;
    expect(within(planned).getByRole("button", { name: copy.markContacted })).toBeInTheDocument();
    const contacted = within(list).getByText("Kontaktad AB").closest("li")!;
    fireEvent.click(within(contacted).getByRole("button", { name: copy.logAnswer }));
    expect(within(contacted).getByRole("form", { name: fill(copy.answer.title, { company: "Kontaktad AB" }) })).toBeInTheDocument();
    // Utan ställning, pris och citat går svaret inte att spara.
    expect(within(contacted).getByRole("button", { name: copy.save })).toBeDisabled();
  });

  it("ett riktigt fel sväljs inte", async () => {
    getStepsMock.mockResolvedValue(stepsAt(5));
    getContactsMock.mockRejectedValue(new Error("Supabase svarar inte"));
    getVerdictReportMock.mockResolvedValue(null);
    getProjectMock.mockResolvedValue(null);
    await expect(renderPage()).rejects.toThrow("Supabase svarar inte");
  });

  it("skickar inga funktioner som props på toppnivå, och importerar varken Registret, Utskick eller demot", async () => {
    getStepsMock.mockResolvedValue(stepsAt(3));
    getContactsMock.mockResolvedValue([]);
    getVerdictReportMock.mockResolvedValue(null);
    getProjectMock.mockResolvedValue(null);
    const { default: LiveValidationPage } = await import("./page");
    const tree = (await LiveValidationPage()) as { props: Record<string, unknown> };
    for (const [key, value] of Object.entries(tree.props)) {
      if (key !== "actions") expect(typeof value).not.toBe("function");
    }
    const source = readFileSync(join(__dirname, "page.tsx"), "utf8");
    expect(source).not.toMatch(/RegistryProvider|OutreachProvider|adapters\/demo/);
  });
});
