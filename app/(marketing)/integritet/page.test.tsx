import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import FondaPrivacyPage from "./page";

afterEach(() => cleanup());
beforeEach(() => window.localStorage.removeItem("spark:locale"));

describe("/integritet", () => {
  it("säger vem som ansvarar, vad som sparas, varför, var, hur länge och hur man blir borttagen", () => {
    render(
      <LocaleProvider>
        <FondaPrivacyPage />
      </LocaleProvider>,
    );
    const copy = sv.site.privacy;

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(copy.title);
    for (const section of copy.sections) {
      expect(screen.getByRole("heading", { level: 2, name: section.heading })).toBeInTheDocument();
    }
    expect(screen.getByText(/spark\.ai\.uf@gmail\.com/)).toBeInTheDocument();
    expect(screen.getByText(/Spark UF är personuppgiftsansvarig/)).toBeInTheDocument();
    expect(screen.getByText(/med ditt samtycke/)).toBeInTheDocument();
    expect(screen.getByText(/lagras inom EU\. Bara Spark UF-teamet/)).toBeInTheDocument();
    expect(screen.getByText(/raderas efter lanseringen, eller tidigare om du ber om det/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: copy.back })).toHaveAttribute("href", "/#besked");
  });
});
