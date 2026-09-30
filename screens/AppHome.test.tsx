import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { AppHome, type AppHomeData } from "./AppHome";

vi.mock("next/navigation", () => ({ usePathname: () => "/demo" }));

afterEach(() => cleanup());

const källa = { namn: "Bolagsverket", hämtad: "2026-09-16" };

const baseSnapshot = {
  total: 43,
  previousTotal: 47,
  delta: -4,
  deltaReason: "Tre kunder säger emot.",
  calculatedAtIso: "2026-09-16",
  parts: [{ name: "Marknad", points: 12, weight: 12, source: källa, dataType: "register" as const }],
  lockedParts: [{ name: "Traktion", unlocksAfterStep: 10 }],
};

const nextStep = {
  eyebrow: "STEG 03 · MARKNADEN",
  title: "Se de första siffrorna ur registret",
  why: "Riktiga siffror ur registret.",
  maxPoints: 12,
  estimatedTime: "~5 min",
  doneItems: ["Profilsamtalet klart"],
  actionLabel: "Öppna marknadsbilden",
};

const sinceLastTime = {
  emailSentSource: källa,
  recipientCount: 14,
  openRate: 21,
  openRateSource: källa,
  reminderSentDateIso: "2026-09-16",
  responsesReceived: 2,
  responsesSource: källa,
};

const journeySteps = [
  { stepNumber: 1, journeyPhase: "discover" as const, title: "Om dig", oneLiner: "", maxPoints: 8, status: "done" as const },
  { stepNumber: 3, journeyPhase: "discover" as const, title: "Marknaden", oneLiner: "", maxPoints: 12, status: "current" as const },
];

function baseData(overrides: Partial<AppHomeData> = {}): AppHomeData {
  return {
    todayIso: "2026-09-16",
    score: baseSnapshot,
    homeSummary: { nextStep, sinceLastTime },
    pulseSignals: [],
    journeySteps,
    ...overrides,
  };
}

function renderHome(data: AppHomeData, opts: { dataKind?: "example" | "live"; onNextStep?: () => void } = {}) {
  return render(
    <LocaleProvider>
      <AppHome
        data={data}
        dataKind={opts.dataKind ?? "example"}
        onNextStep={opts.onNextStep}
        journeyBasePath="/demo/resan"
        scoreHref="/demo/poang"
      />
    </LocaleProvider>,
  );
}

describe("AppHome (PR 3, Hem)", () => {
  it("visar handlingskortet och anropar onNextStep vid klick", () => {
    const onNextStep = vi.fn();
    renderHome(baseData(), { onNextStep });
    expect(screen.getByRole("heading", { level: 2, name: nextStep.title })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: nextStep.actionLabel }));
    expect(onNextStep).toHaveBeenCalledTimes(1);
  });

  it("visar den skärmläsar-dolda demoledtråden bara för dataKind='example'", () => {
    renderHome(baseData(), { dataKind: "example" });
    expect(screen.getByText(sv.site.demo.nextAction)).toBeInTheDocument();

    cleanup();
    renderHome(baseData(), { dataKind: "live" });
    expect(screen.queryByText(sv.site.demo.nextAction)).not.toBeInTheDocument();
  });

  it("visar Kommer snart i handlingskortets och 'sedan sist'-rutan när homeSummary saknas", () => {
    renderHome(baseData({ homeSummary: null }));
    const comingSoonHeadings = screen.getAllByText(sv.comingSoon.title);
    expect(comingSoonHeadings).toHaveLength(2);
    expect(screen.queryByText(nextStep.title)).not.toBeInTheDocument();
  });

  it("visar Kommer snart i poängrutan när score saknas", () => {
    renderHome(baseData({ score: null }));
    expect(screen.getByText(sv.comingSoon.title)).toBeInTheDocument();
    expect(screen.queryByText(String(baseSnapshot.total))).not.toBeInTheDocument();
  });

  it("Resan-raden länkar via journeyBasePath oavsett om homeSummary/score saknas", () => {
    renderHome(baseData({ homeSummary: null, score: null }));
    expect(screen.getByRole("link", { name: /Marknaden/ })).toHaveAttribute("href", "/demo/resan/3");
  });

  it("visar demots 'ingen signal'-text för example och en neutral text för live", () => {
    renderHome(baseData({ pulseSignals: [] }), { dataKind: "example" });
    expect(screen.getByText(sv.site.demo.noPulse)).toBeInTheDocument();

    cleanup();
    renderHome(baseData({ pulseSignals: [] }), { dataKind: "live" });
    expect(screen.getByText(sv.homePage.noPulseSignal)).toBeInTheDocument();
  });

  it("visar en riktig pulssignal när den finns", () => {
    renderHome(
      baseData({
        pulseSignals: [
          { category: "Marknad", headline: "18 % tillväxt", whyItMatters: "Marknaden växer.", timestamp: "06:00", source: källa },
        ],
      }),
    );
    expect(screen.getByText("18 % tillväxt")).toBeVisible();
  });
});
