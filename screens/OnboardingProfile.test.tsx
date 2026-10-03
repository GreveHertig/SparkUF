import { act, cleanup, render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
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

// Avsnitt 6, 9.1: frågorna kommer en i taget och samtalet går framåt av sig
// själv — ingen ska behöva klicka på pratbubblorna. Testar att tiden ensam
// bygger både chatten och "profilen så här långt", och att Fortsätt bara
// dyker upp när alla är besvarade.
describe("OnboardingProfile", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("går framåt automatiskt och bygger profilen utan klick", async () => {
    const onContinue = vi.fn();

    render(
      <LocaleProvider>
        <OnboardingProfile data={{ script }} continueHref="/demo/app" onContinue={onContinue} />
      </LocaleProvider>,
    );

    expect(screen.getByText("Vad gör du idag?")).toBeInTheDocument();
    expect(screen.queryByText("Jag jobbar med redovisning.")).not.toBeInTheDocument();
    expect(screen.queryByText("Hur mycket tid har du?")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Fortsätt" })).not.toBeInTheDocument();

    // Svaret dyker upp av sig själv, utan klick.
    await act(async () => {
      vi.advanceTimersByTime(900);
    });
    expect(screen.getByText("Jag jobbar med redovisning.")).toBeInTheDocument();

    // Samtalet går sedan vidare till nästa fråga av sig själv.
    await act(async () => {
      vi.advanceTimersByTime(1400);
    });
    expect(screen.getByText("Hur mycket tid har du?")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Fortsätt" })).not.toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(900);
    });
    expect(screen.getByText("15 timmar i veckan.")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1400);
    });
    expect(screen.getByText("Bra att veta.")).toBeInTheDocument();
    const continueLink = screen.getByRole("link", { name: "Fortsätt" });
    expect(continueLink).toHaveAttribute("href", "/demo/app");

    // "Profilen så här långt" listar båda svaren.
    const building = screen.getByRole("complementary", { name: "Din profil så här långt" });
    expect(building).toHaveTextContent("Jag jobbar med redovisning.");
    expect(building).toHaveTextContent("15 timmar i veckan.");

    fireEvent.click(continueLink);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("formuläret visar avslutningsrepliken direkt, efter sista frågan och före knappen", () => {
    const answerAction = vi.fn().mockResolvedValue({ invalid: false });
    render(
      <LocaleProvider>
        <OnboardingProfile data={{ script }} continueHref="/app" answerAction={answerAction} />
      </LocaleProvider>,
    );
    const closing = screen.getByText("Bra att veta.");
    const lastQuestion = screen.getByText("Hur mycket tid har du?");
    const submit = screen.getByRole("button", { name: "Spara och gå vidare" });
    expect(lastQuestion.compareDocumentPosition(closing) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(closing.compareDocumentPosition(submit) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // Inga färdiga svar ur skriptet i formuläret.
    expect(screen.queryByText("Jag jobbar med redovisning.")).not.toBeInTheDocument();
  });

  it("visar Kommer snart i samtalet och profilen utan samtal, och ingen Fortsätt", () => {
    render(
      <LocaleProvider>
        <OnboardingProfile data={{ script: null }} continueHref="/app" />
      </LocaleProvider>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Berätta om dig" })).toBeInTheDocument();
    expect(screen.getAllByText("Kommer snart")).toHaveLength(2);
    expect(screen.queryByRole("link", { name: "Fortsätt" })).not.toBeInTheDocument();
  });
});
