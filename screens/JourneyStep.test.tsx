import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import type { JourneyStepDetail } from "@/ports/JourneyRepository";
import { JourneyStep } from "./JourneyStep";

afterEach(() => cleanup());

const källa = { namn: "Hiasynth", hämtad: "2026-09-16" };

function detail(overrides: Partial<JourneyStepDetail> = {}): JourneyStepDetail {
  return {
    stepNumber: 6,
    journeyPhase: "tryPhase",
    title: "Domen",
    oneLiner: "Kör, förfina eller pivotera.",
    maxPoints: 18,
    status: "done",
    why: "Sju av nio bekräftar problemet.",
    doneItems: ["Utskick klart"],
    highlights: ["Simulering med Hiasynth"],
    actionLabel: "",
    momentKind: "after",
    scoreDelta: { total: 43, delta: -4, deltaReason: "Tre säger nej till priset." },
    newlyUnlockedParts: ["Problem"],
    verdict: { headline: "Förfina", reasoning: "Segmentet är för brett." },
    simulation: null,
    ...overrides,
  };
}

function renderStep(props: Partial<Parameters<typeof JourneyStep>[0]> = {}) {
  return render(
    <LocaleProvider>
      <JourneyStep data={detail()} stepNumber={6} journeyHref="/x/resan" {...props} />
    </LocaleProvider>,
  );
}

describe("JourneyStep (PR 9)", () => {
  it("visar huvudet med nummer, status och moment, och länken tillbaka", () => {
    renderStep();
    expect(screen.getByRole("heading", { level: 1, name: "Domen" })).toBeInTheDocument();
    expect(
      screen.getByText(`${sv.journeyPage.stepLabel} 06 · ${sv.journeyPage.status.done} · ${sv.journeyPage.momentPill.after}`),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: new RegExp(sv.journeyPage.backToJourney) })).toHaveAttribute("href", "/x/resan");
  });

  it("ett klart steg visar vad som hänt, domen, poängändringen, det upplåsta och det klara", () => {
    renderStep();
    expect(screen.getByRole("heading", { level: 2, name: sv.journeyPage.whatHappened })).toBeInTheDocument();
    expect(screen.getByText("Förfina")).toBeInTheDocument();
    expect(screen.getByText("Tre säger nej till priset.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: sv.journeyPage.unlockedTitle })).toBeInTheDocument();
    expect(screen.getByText("Utskick klart")).toBeInTheDocument();
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
  });

  it("koncept i höjdpunkterna får sin etikett", () => {
    renderStep();
    expect(screen.getByText("Simulering med Hiasynth").closest("li")).toHaveTextContent(/koncept/i);
  });

  it("ett låst steg visar bara låst läge", () => {
    renderStep({ data: detail({ status: "locked", why: "", verdict: null, scoreDelta: null, doneItems: [] }) });
    expect(screen.getByText(`${sv.homePage.unlocksAfterStepBefore} 05`)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: sv.journeyPage.whatHappened })).not.toBeInTheDocument();
    // Ingen moment-pill för ett låst steg.
    expect(screen.getByText(`${sv.journeyPage.stepLabel} 06 · ${sv.journeyPage.status.locked}`)).toBeInTheDocument();
  });

  it("tomma sektioner döljs; en saknad dom döljs utan verdictMissing", () => {
    renderStep({ data: detail({ verdict: null, scoreDelta: null, newlyUnlockedParts: [], doneItems: [], highlights: [] }) });
    expect(screen.queryByRole("heading", { level: 2, name: sv.validationPage.verdictTitle })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: sv.journeyPage.unlockedTitle })).not.toBeInTheDocument();
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
  });

  it("verdictMissing ger Kommer snart i domens ruta", () => {
    renderStep({ data: detail({ verdict: null, scoreDelta: null }), verdictMissing: true });
    expect(screen.getByRole("heading", { level: 2, name: sv.validationPage.verdictTitle })).toBeInTheDocument();
    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(1);
  });

  it("ett olåst steg utan text visar Kommer snart i den rutan", () => {
    renderStep({ data: detail({ status: "current", why: "" }) });
    expect(screen.getByRole("heading", { level: 2, name: sv.journeyPage.whatsNext })).toBeInTheDocument();
    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(1);
  });

  it("utan data: stegets nummer som rubrik och Kommer snart", () => {
    renderStep({ data: null, stepNumber: 3 });
    expect(screen.getByRole("heading", { level: 1, name: `${sv.journeyPage.stepLabel} 03` })).toBeInTheDocument();
    expect(screen.getByText(sv.comingSoon.title)).toBeInTheDocument();
  });

  it("simuleringen visas med sin rubrik när den finns", () => {
    renderStep({
      data: detail({
        simulation: {
          question: "Vad tål byråerna?",
          populationSize: 1000,
          result: "600–900 kr/mån",
          uncertaintyRangeLabel: "Spann 600–900",
          source: källa,
        },
      }),
    });
    expect(screen.getByRole("heading", { level: 2, name: sv.journeyPage.simulationTitle })).toBeInTheDocument();
  });
});
