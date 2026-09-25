import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { en } from "@/i18n/en";
import { sv } from "@/i18n/sv";
import FondaLandingPage from "./page";
import { FONDA_DEMO_HREF } from "./_components/DemoLink";

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

async function renderPage() {
  const result = render(
    <LocaleProvider>
      <FondaLandingPage />
    </LocaleProvider>,
  );
  // Registerkortet hämtar sin data i en effekt.
  await act(async () => {});
  return result;
}

function allStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(allStrings);
  if (value && typeof value === "object") return Object.values(value).flatMap(allStrings);
  return [];
}

describe("/experiment/fonda", () => {
  it("visar kärninnehållet: rubrik, registret, priset och demot märkt med fiktiv data", async () => {
    await renderPage();
    const copy = sv.experimentFonda;

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(copy.hero.titleEm);
    expect(screen.getByText(/Bolagsverket och SCB\./)).toBeInTheDocument();
    expect(screen.getByText(copy.price.amount)).toBeInTheDocument();
    expect(screen.getByText(copy.price.name)).toBeInTheDocument();

    const demoLinks = screen.getAllByRole("link", { name: new RegExp(copy.demoLink.label) });
    expect(demoLinks.length).toBeGreaterThan(0);
    for (const link of demoLinks) {
      expect(link).toHaveAttribute("href", FONDA_DEMO_HREF);
      expect(link).toHaveTextContent(copy.demoLink.note);
    }
  });

  it("har exakt ett formulärfält, och påstår aldrig att adressen sparats", async () => {
    const { container } = await renderPage();
    const copy = sv.experimentFonda.close;
    expect(container.querySelectorAll("input")).toHaveLength(1);

    const input = screen.getByLabelText(copy.emailLabel);
    const submit = screen.getByRole("button", { name: copy.submit });

    fireEvent.change(input, { target: { value: "inte-en-adress" } });
    fireEvent.click(submit);
    expect(screen.getByText(copy.invalid)).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "namn@exempel.se" } });
    fireEvent.click(submit);
    expect(screen.getByText(copy.sent)).toBeInTheDocument();
    expect(screen.getByText(copy.help)).toBeInTheDocument();
  });

  it("räknar om poängen och sänker den när tre kunder säger emot", async () => {
    await renderPage();
    const copy = sv.experimentFonda.proof;
    const toggle = screen.getByRole("switch", { name: copy.toggle });
    const before = Number(document.querySelector(".fd-proof__number > span")?.textContent);

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
    const after = Number(document.querySelector(".fd-proof__number > span")?.textContent);
    expect(after).toBeLessThan(before);
    expect(screen.getByText(copy.deltaReason, { exact: false })).toBeInTheDocument();
    expect(screen.getAllByText(copy.contradicts, { selector: ".fd-sr-only" })).toHaveLength(3);
  });

  it("växlar till engelska", async () => {
    await renderPage();
    fireEvent.click(screen.getAllByRole("button", { name: "EN" })[0]);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(en.experimentFonda.hero.titleEm);
    expect(screen.getByText(en.experimentFonda.price.amount)).toBeInTheDocument();
  });

  it("nämner inte Fonda, påstår inget om att vara ensam och har inga tankstreck", () => {
    for (const text of [...allStrings(sv.experimentFonda), ...allStrings(en.experimentFonda)]) {
      expect(text).not.toMatch(/fonda/i);
      expect(text).not.toMatch(/\b(den enda|det enda|only)\b/i);
      expect(text).not.toContain("—");
    }
  });
});
