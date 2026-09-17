import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { useDemoStore } from "@/adapters/demo/demoStore";
import DemoAppShellLayout from "./layout";
import DemoAppHomePage from "./page";

// Två tester i den här filen renderar samma träd — utan explicit cleanup
// mellan dem blir DOM:en kvar från förra testet och t.ex. "◀ Bakåt" matchar
// två knappar i stället för en.
afterEach(cleanup);

// Se locale-switch.test.tsx för varför matchMedia behöver stubbas i jsdom.
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

beforeEach(() => {
  useDemoStore.getState().reset();
});

// Session 2: demomotorn + calculateScore ska vara kopplade till /demo/app så
// att poängen och Nästa steg-kortet ändras när man klickar i demoraden.
describe("Demoraden i /demo/app", () => {
  it("byter Nästa steg-titel och poäng när man klickar Nästa ▶", async () => {
    render(
      <LocaleProvider>
        <DemoAppShellLayout>
          <DemoAppHomePage />
        </DemoAppShellLayout>
      </LocaleProvider>,
    );

    expect(await screen.findByText("Svara på profilfrågorna")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Nästa ▶/ }));

    expect(await screen.findByText("Se de första siffrorna ur registret")).toBeInTheDocument();
    expect(screen.queryByText("Svara på profilfrågorna")).not.toBeInTheDocument();
  });

  it("går tillbaka med ◀ Bakåt", async () => {
    render(
      <LocaleProvider>
        <DemoAppShellLayout>
          <DemoAppHomePage />
        </DemoAppShellLayout>
      </LocaleProvider>,
    );

    fireEvent.click(await screen.findByRole("button", { name: /Nästa ▶/ }));
    expect(await screen.findByText("Se de första siffrorna ur registret")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /◀ Bakåt/ }));
    expect(await screen.findByText("Svara på profilfrågorna")).toBeInTheDocument();
  });
});
