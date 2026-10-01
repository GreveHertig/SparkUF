import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import type { JourneyStepView } from "@/ports/JourneyRepository";

/**
 * Licensgrinden utan mockar i grinden eller adaptern: den riktiga
 * `assertRegistryAccessAllowed` och det riktiga `liveRegistryProvider`.
 * Bara sessionen och transporterna är utbytta. Transporterna svarar med
 * data om de anropas, så ett läckage skulle synas på sidan.
 */
const getCurrentUserMock = vi.hoisted(() => vi.fn());
const fetchCompaniesMock = vi.hoisted(() => vi.fn());
const fetchAnnualFiguresMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/server/session", () => ({ getCurrentUser: () => getCurrentUserMock() }));
vi.mock("@/lib/server/scb", () => ({ fetchCompanies: fetchCompaniesMock }));
vi.mock("@/lib/server/bolagsverket", () => ({ fetchAnnualFigures: fetchAnnualFiguresMock }));
vi.mock("@/adapters/live/JourneyRepository", () => ({
  liveJourneyRepository: {
    getSteps: async (): Promise<JourneyStepView[]> =>
      Array.from({ length: 12 }, (_, index) => ({
        stepNumber: index + 1,
        journeyPhase: "discover",
        title: `Steg ${index + 1}`,
        oneLiner: "",
        maxPoints: 5,
        status: index < 4 ? "done" : "current",
      })),
  },
}));

const THEO = "00000000-0000-4000-8000-00000000000a";
const ERIK = "00000000-0000-4000-8000-00000000000b";
const OUTSIDER = "00000000-0000-4000-8000-00000000000c";
const saved = { ...process.env };

const row = {
  orgNr: "5560000001",
  name: "Läckt Bolag AB",
  legalForm: "AB",
  sniCode: "62.010",
  employees: 12,
  county: "Stockholms län",
  deregistered: false,
  advertisingBlock: false,
  description: "Syns bara om grinden läcker.",
};

async function renderPage() {
  const { default: LiveMarketPage } = await import("./page");
  const ui = await LiveMarketPage({ searchParams: Promise.resolve({ sni: "62.010" }) });
  return render(<LocaleProvider>{ui}</LocaleProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.REGISTRY_LIVE_ENABLED = "true";
  process.env.REGISTRY_ALLOWED_USER_IDS = `${THEO},${ERIK}`;
  fetchCompaniesMock.mockResolvedValue({ companies: [row] });
  fetchAnnualFiguresMock.mockResolvedValue({ reports: [] });
});

afterEach(() => {
  cleanup();
  process.env = { ...saved };
});

describe("/app/marknad bakom den riktiga licensgrinden", () => {
  const outsiders: [string, () => void][] = [
    ["en användare utanför allowlisten", () => getCurrentUserMock.mockResolvedValue({ id: OUTSIDER, email: null })],
    ["ingen session", () => getCurrentUserMock.mockResolvedValue(null)],
    [
      "Theo, men flaggan är av",
      () => {
        process.env.REGISTRY_LIVE_ENABLED = "false";
        getCurrentUserMock.mockResolvedValue({ id: THEO, email: null });
      },
    ],
    [
      "Theo, men allowlisten är tom",
      () => {
        process.env.REGISTRY_ALLOWED_USER_IDS = "";
        getCurrentUserMock.mockResolvedValue({ id: THEO, email: null });
      },
    ],
  ];

  for (const [who, arrange] of outsiders) {
    it(`${who}: ingen transport anropas och inget ur registret visas`, async () => {
      arrange();
      const { container } = await renderPage();

      expect(fetchCompaniesMock).not.toHaveBeenCalled();
      expect(fetchAnnualFiguresMock).not.toHaveBeenCalled();
      expect(screen.getAllByText(sv.marketPage.registryClosed)).toHaveLength(3);
      expect(container.textContent).not.toMatch(/Läckt|Syns bara|anställda|SNI 62/);
      expect(container.querySelector(".fdd-figures, .fdd-bars")).toBeNull();
    });
  }

  it.each([
    ["Theo", THEO],
    ["Erik", ERIK],
  ])("%s på allowlisten når registret", async (_name, id) => {
    getCurrentUserMock.mockResolvedValue({ id, email: null });
    await renderPage();

    expect(fetchCompaniesMock).toHaveBeenCalled();
    expect(screen.queryByText(sv.marketPage.registryClosed)).not.toBeInTheDocument();
    expect(screen.getByText(sv.marketPage.companyCountLabelLive).parentElement).toHaveTextContent("1");
  });
});
