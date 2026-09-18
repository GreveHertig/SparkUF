import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { OnboardingProfile } from "./OnboardingProfile";
import type { OnboardingScript } from "@/ports/ProfileRepository";

const script: OnboardingScript = {
  questions: [
    { id: "q1", cofounderText: "Vad gör du idag?", suggestedAnswer: "Jag jobbar med redovisning." },
    { id: "q2", cofounderText: "Hur mycket tid har du?", suggestedAnswer: "15 timmar i veckan." },
  ],
  closingMessage: "Bra att veta.",
};

// Avsnitt 6, 9.1: frågorna kommer en i taget, med ett klickbart svarsförslag
// i stället för fritext. Testar att klicken bygger både chatten och
// "profilen så här långt", och att Fortsätt bara dyker upp när alla är
// besvarade.
describe("OnboardingProfile", () => {
  it("visar en fråga i taget och bygger profilen vid klick", async () => {
    const onContinue = vi.fn();

    render(
      <LocaleProvider>
        <OnboardingProfile data={{ script, continueHref: "/demo/app", onContinue }} />
      </LocaleProvider>,
    );

    expect(screen.getByText("Vad gör du idag?")).toBeInTheDocument();
    expect(screen.queryByText("Hur mycket tid har du?")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Fortsätt" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Jag jobbar med redovisning." }));

    expect(await screen.findByText("Hur mycket tid har du?")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Fortsätt" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "15 timmar i veckan." }));

    expect(await screen.findByText("Bra att veta.")).toBeInTheDocument();
    const continueLink = screen.getByRole("link", { name: "Fortsätt" });
    expect(continueLink).toHaveAttribute("href", "/demo/app");

    // "Profilen så här långt" listar båda svaren.
    const building = screen.getByText("Din profil så här långt").closest("div") as HTMLElement;
    expect(building).toHaveTextContent("Jag jobbar med redovisning.");
    expect(building).toHaveTextContent("15 timmar i veckan.");

    fireEvent.click(continueLink);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
