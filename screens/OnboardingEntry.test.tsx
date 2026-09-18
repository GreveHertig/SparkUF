import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { OnboardingEntry } from "./OnboardingEntry";

// Avsnitt 2.1, 6: två valkort som länkar in i rätt onboarding-flöde och,
// i demot, meddelar vilken ingång som valdes.
describe("OnboardingEntry", () => {
  it("länkar korten till rätt route under basePath och meddelar valet", () => {
    const onChoose = vi.fn();

    render(
      <LocaleProvider>
        <OnboardingEntry data={{ basePath: "/demo/start", onChoose }} />
      </LocaleProvider>,
    );

    const noIdeaLink = screen.getByRole("link", { name: /Jag har ingen idé än/ });
    const hasIdeaLink = screen.getByRole("link", { name: /Jag har redan en idé/ });
    expect(noIdeaLink).toHaveAttribute("href", "/demo/start/profil");
    expect(hasIdeaLink).toHaveAttribute("href", "/demo/start/ide");

    fireEvent.click(noIdeaLink);
    expect(onChoose).toHaveBeenCalledWith("noIdea");

    fireEvent.click(hasIdeaLink);
    expect(onChoose).toHaveBeenCalledWith("hasIdea");
  });
});
