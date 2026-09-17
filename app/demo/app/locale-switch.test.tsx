import { render, screen, fireEvent } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import DemoAppShellLayout from "./layout";
import DemoAppHomePage from "./page";

// jsdom saknar matchMedia — ScoreBadge (via usePrefersReducedMotion) behöver
// den. Orelaterat till buggen den här filen testar, men krävs för att kunna
// rendera skärmen alls i jsdom.
beforeAll(() => {
  window.matchMedia =
    window.matchMedia ||
    ((query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList);
});

// Regression test for en bugg där /demo/app kraschade med "An unknown
// Component is an async Client Component" när man bytte språk. Orsaken var
// `use()` med en promise vars identitet ändrades varje gång `locale` ändrades
// — se app/demo/app/layout.tsx och page.tsx för den nuvarande
// useEffect/useState-lösningen.
describe("/demo/app språkväxel", () => {
  it("byter till engelska utan att krascha", async () => {
    render(
      <LocaleProvider>
        <DemoAppShellLayout>
          <DemoAppHomePage />
        </DemoAppShellLayout>
      </LocaleProvider>,
    );

    expect(await screen.findByText("Sara Lindqvist")).toBeInTheDocument();
    expect(await screen.findByText("Gå igenom svaren och förbered steg 06")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "EN" }));

    expect(await screen.findByText("Review the responses and prepare step 06")).toBeInTheDocument();
  });
});
