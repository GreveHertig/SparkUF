import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { OnboardingIdea } from "./OnboardingIdea";
import type { IdeaScreening } from "@/ports/ProjectRepository";

const screening: IdeaScreening = {
  originalIdea: "En app där padelhallar säljer lediga tider i sista minuten till rabatt.",
  assumptions: [
    { text: "Padelhallar har outnyttjad kapacitet.", testableNow: true },
    { text: "Spelare vill boka i sista minuten.", testableNow: false },
  ],
  registerFacts: [
    { label: "Padelhallsbolag i Sverige", value: "412", source: { namn: "Bolagsverket", hämtad: "2026-01-03" } },
  ],
  weakness: "En konsumentmarknadsplats är svag här.",
  sharperIdea: {
    name: "Beläggningsprognosen",
    oneLiner: "Ett B2B-verktyg för hallägare.",
    why: "Säljbakgrunden blir en fördel.",
  },
};

// Avsnitt 2.1: antaganden bryts ut, registerbilden visas, Medgrundaren säger
// rakt ut vad som är svagt och föreslår en skarpare version.
describe("OnboardingIdea", () => {
  it("visar idén, antagandena, registerbilden, svagheten och den skarpare versionen", () => {
    render(
      <LocaleProvider>
        <OnboardingIdea data={{ screening, continueHref: "/demo/start/profil" }} />
      </LocaleProvider>,
    );

    expect(screen.getByText(screening.originalIdea)).toBeInTheDocument();

    expect(screen.getByText("Padelhallar har outnyttjad kapacitet.")).toBeInTheDocument();
    expect(screen.getByText("Går att pröva mot registret nu")).toBeInTheDocument();
    expect(screen.getByText("Spelare vill boka i sista minuten.")).toBeInTheDocument();
    expect(screen.getByText("Kräver kundsamtal")).toBeInTheDocument();

    expect(screen.getByText("Padelhallsbolag i Sverige")).toBeInTheDocument();
    expect(screen.getByText("412")).toBeInTheDocument();

    expect(screen.getByText(screening.weakness)).toBeInTheDocument();

    expect(screen.getByText("Beläggningsprognosen")).toBeInTheDocument();
    expect(screen.getByText("Ett B2B-verktyg för hallägare.")).toBeInTheDocument();
    expect(screen.getByText("Säljbakgrunden blir en fördel.")).toBeInTheDocument();

    const continueLink = screen.getByRole("link", { name: "Fortsätt till profilsamtalet" });
    expect(continueLink).toHaveAttribute("href", "/demo/start/profil");
  });
});
