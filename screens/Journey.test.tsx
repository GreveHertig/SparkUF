import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import type { JourneyStepView } from "@/ports/JourneyRepository";
import { Journey } from "./Journey";

afterEach(() => cleanup());

const steps: JourneyStepView[] = [
  { stepNumber: 1, journeyPhase: "discover", title: "Om dig", oneLiner: "Vem du är.", maxPoints: 8, status: "done" },
  { stepNumber: 2, journeyPhase: "discover", title: "Idén", oneLiner: "Vad du bygger.", maxPoints: 8, status: "current" },
  { stepNumber: 3, journeyPhase: "tryPhase", title: "Marknaden", oneLiner: "Hur stor.", maxPoints: 10, status: "locked" },
];

function renderJourney(data: { steps: JourneyStepView[] | null }) {
  return render(
    <LocaleProvider>
      <Journey data={data} basePath="/x/resan" />
    </LocaleProvider>,
  );
}

describe("Journey (PR 9)", () => {
  it("rubriken är det aktuella steget, med nummer och status", () => {
    renderJourney({ steps });
    expect(screen.getByRole("heading", { level: 1, name: "Idén" })).toBeInTheDocument();
    expect(screen.getByText(`${sv.journeyPage.stepLabel} 02 · ${sv.journeyPage.status.current}`)).toBeInTheDocument();
  });

  it("utan aktuellt steg blir rubriken det senast klara", () => {
    renderJourney({ steps: steps.map((step) => ({ ...step, status: step.stepNumber === 3 ? "locked" : "done" })) });
    expect(screen.getByRole("heading", { level: 1, name: "Idén" })).toBeInTheDocument();
  });

  it("stegraden och stegkorten länkar under basePath", () => {
    renderJourney({ steps });
    const stepper = screen.getByRole("list", { name: sv.site.journey.stepsListLabel });
    expect(within(stepper).getByRole("link", { name: /Marknaden/ })).toHaveAttribute("href", "/x/resan/3");
    expect(within(stepper).getByText("Idén").closest("li")).toHaveAttribute("aria-current", "step");
    const cards = screen.getAllByRole("link", { name: /Marknaden/ });
    expect(cards).toHaveLength(2);
    cards.forEach((card) => expect(card).toHaveAttribute("href", "/x/resan/3"));
  });

  it("varje fas visar sina steg och hur många som är klara", () => {
    renderJourney({ steps });
    expect(screen.getByRole("heading", { level: 2, name: sv.journeyPage.phaseNames.discover })).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();
    expect(screen.getByText("0/1")).toBeInTheDocument();
    // Faser utan steg visas inte.
    expect(screen.queryByRole("heading", { level: 2, name: sv.journeyPage.phaseNames.grow })).not.toBeInTheDocument();
  });

  it("utan steg: Kommer snart och sidans namn, ingen stegrad", () => {
    renderJourney({ steps: null });
    expect(screen.getByRole("heading", { level: 1, name: sv.journeyPage.title })).toBeInTheDocument();
    expect(screen.getByText(sv.journeyPage.subtitle)).toBeInTheDocument();
    expect(screen.getByText(sv.comingSoon.title)).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: sv.site.journey.stepsListLabel })).not.toBeInTheDocument();
  });
});
