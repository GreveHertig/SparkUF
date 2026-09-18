import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { useDemoStore } from "@/adapters/demo/demoStore";
import DemoAppShellLayout from "./layout";
import DemoAppHomePage from "./page";

// DemoBar (avsnitt 9.1) läser pathname för att veta om den ska visa
// steg/fas eller onboarding-läget, och layouten skickar tillbaka till
// /demo/start om onboardingen inte är klar — båda kräver next/navigation,
// som inte finns monterad i den här rena render()-miljön.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => {}, replace: () => {} }),
  usePathname: () => "/demo/app",
}));

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
  // Den här filen testar /demo/app:s demorad, inte onboardingen (som har
  // egna tester) — simulera en session som redan klickat sig igenom den.
  useDemoStore.getState().completeOnboarding();
});

// Session 2: demomotorn + calculateScore ska vara kopplade till /demo/app så
// att poängen och Nästa steg-kortet ändras när man klickar i demoraden.
// Sedan djupsessionen (uppdrag 9.1) har varje steg tre moment (före/körning/
// efter, se adapters/demo/sara.ts) — Nästa steg-kortets titel är därför
// oförändrad över de två första klicken (samma steg, nytt moment) och byts
// först på det tredje klicket, när steg 02 börjar.
describe("Demoraden i /demo/app", () => {
  it("byter Nästa steg-titel och poäng när man klickar Nästa ▶ genom ett steg", async () => {
    render(
      <LocaleProvider>
        <DemoAppShellLayout>
          <DemoAppHomePage />
        </DemoAppShellLayout>
      </LocaleProvider>,
    );

    expect(await screen.findByText("Svara på profilfrågorna")).toBeInTheDocument();

    const next = () => fireEvent.click(screen.getByRole("button", { name: /Nästa ▶/ }));

    next(); // 01-om-dig-korning — samma steg, nytt moment
    expect(await screen.findByText("Svara på profilfrågorna")).toBeInTheDocument();

    next(); // 01-om-dig-efter — samma steg, nytt moment
    expect(await screen.findByText("Svara på profilfrågorna")).toBeInTheDocument();

    next(); // 02-mojligheter-fore — nytt steg
    expect(await screen.findByText("Välj en idé ur tre förslag")).toBeInTheDocument();
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

    expect(await screen.findByText("Svara på profilfrågorna")).toBeInTheDocument();
    const next = () => fireEvent.click(screen.getByRole("button", { name: /Nästa ▶/ }));
    next();
    next();
    next();
    expect(await screen.findByText("Välj en idé ur tre förslag")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /◀ Bakåt/ }));
    expect(await screen.findByText("Svara på profilfrågorna")).toBeInTheDocument();
  });
});
