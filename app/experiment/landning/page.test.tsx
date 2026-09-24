import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { en } from "@/i18n/en";
import { sv } from "@/i18n/sv";
import ExperimentLandingPage from "./page";

// Samma matchMedia-stubb som app/(marketing)/page.test.tsx.
beforeAll(() => {
  window.matchMedia = ((query: string) =>
    ({
      matches: true,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList) as typeof window.matchMedia;
});

afterEach(() => cleanup());
beforeEach(() => window.localStorage.removeItem("spark:locale"));

function renderPage() {
  return render(
    <LocaleProvider>
      <ExperimentLandingPage />
    </LocaleProvider>,
  );
}

describe("/experiment/landning", () => {
  it("visar kärninnehållet på svenska, med demot märkt och priset som TBD", () => {
    renderPage();
    const copy = sv.experimentLanding;
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(copy.hero.titleEm);
    expect(screen.getByText(copy.hero.demoNote)).toBeInTheDocument();
    for (const link of screen.getAllByRole("link", { name: copy.hero.demoCta })) {
      expect(link).toHaveAttribute("href", "/demo");
    }
    expect(screen.getByText(copy.close.tbd)).toBeInTheDocument();
    expect(screen.getByText(copy.register.title)).toBeInTheDocument();
  });

  it("har exakt ett formulärfält, och påstår aldrig att adressen sparats", () => {
    const { container } = renderPage();
    const copy = sv.experimentLanding.close;
    expect(container.querySelectorAll("input")).toHaveLength(1);

    const input = screen.getByLabelText(copy.emailLabel);
    const submit = screen.getByRole("button", { name: copy.submit });

    fireEvent.change(input, { target: { value: "inte-en-adress" } });
    fireEvent.click(submit);
    expect(screen.getByText(copy.invalid)).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "namn@exempel.se" } });
    fireEvent.click(submit);
    expect(screen.getByText(copy.sentNotConnected)).toBeInTheDocument();
  });

  it("sänker poängen när reglaget slås på", () => {
    renderPage();
    const toggle = screen.getByRole("switch");
    const before = screen.getByText(/^\d+$/, { selector: "#exempel span" }).textContent;
    fireEvent.click(toggle);
    const after = screen.getByText(/^\d+$/, { selector: "#exempel span" }).textContent;
    expect(Number(after)).toBeLessThan(Number(before));
  });

  it("finns på engelska", () => {
    window.localStorage.setItem("spark:locale", "en");
    renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(en.experimentLanding.hero.titleEm);
  });
});
