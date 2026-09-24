import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { en } from "@/i18n/en";
import { sv } from "@/i18n/sv";
import FreeLandingPage from "./page";

afterEach(() => cleanup());
beforeEach(() => window.localStorage.removeItem("spark:locale"));

function renderPage() {
  return render(
    <LocaleProvider>
      <FreeLandingPage />
    </LocaleProvider>,
  );
}

describe("/experiment/fri", () => {
  it("har det obligatoriska innehållet: löftet, Grundare-priset och en märkt demolänk", () => {
    renderPage();
    const copy = sv.experimentFree;
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(copy.hero.titleB);
    expect(screen.getByText(copy.hero.lead)).toBeInTheDocument();
    expect(screen.getByText(sv.pricingPage.founder.price)).toBeInTheDocument();
    expect(screen.getByText(sv.pricingPage.founder.name)).toBeInTheDocument();
    expect(screen.getByText(copy.hero.demoNote)).toBeInTheDocument();
    for (const link of screen.getAllByRole("link", { name: new RegExp(copy.hero.demoCta) })) {
      expect(link).toHaveAttribute("href", "/demo");
    }
  });

  it("visar alla tolv steg ur resan", () => {
    renderPage();
    for (let step = 1; step <= 12; step += 1) {
      const key = `step${step}` as keyof typeof sv.journeySteps;
      expect(screen.getAllByText(sv.journeySteps[key].title).length).toBeGreaterThan(0);
    }
  });

  it("har exakt ett formulärfält, och påstår aldrig att adressen sparats", () => {
    const { container } = renderPage();
    const copy = sv.experimentFree.signup;
    expect(container.querySelectorAll("input")).toHaveLength(1);
    const input = screen.getByLabelText(copy.emailLabel);
    const submit = screen.getByRole("button", { name: copy.submit });

    fireEvent.click(submit);
    expect(screen.getByText(copy.invalid)).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "namn@exempel.se" } });
    fireEvent.click(submit);
    expect(screen.getByText(copy.sent)).toBeInTheDocument();
  });

  it("finns på engelska", () => {
    window.localStorage.setItem("spark:locale", "en");
    renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(en.experimentFree.hero.titleB);
  });
});
