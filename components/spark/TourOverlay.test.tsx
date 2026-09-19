import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { TOUR_STEPS } from "@/adapters/demo/tourSteps";
import { TourOverlay } from "./TourOverlay";

// TourOverlay navigerar med next/navigation när ett stopps route inte
// matchar aktuell pathname (samma mönster som DemoBar.test.tsx) — stubba
// bort routern, den är inte vad testet handlar om.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => {} }),
  usePathname: () => "/demo/app",
}));

afterEach(cleanup);

// Se locale-switch.test.tsx: matchMedia finns inte i jsdom som standard,
// och usePrefersReducedMotion (design/usePrefersReducedMotion.ts) läser den
// direkt vid mount.
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

describe("TourOverlay (avsnitt 9.2)", () => {
  it("renderar ingenting när rundturen är avstängd", () => {
    render(
      <LocaleProvider>
        <TourOverlay />
      </LocaleProvider>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("visar första stoppets titel och text när rundturen slås på", () => {
    useDemoStore.getState().toggleTour();
    render(
      <LocaleProvider>
        <TourOverlay />
      </LocaleProvider>,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(TOUR_STEPS[0].title.sv)).toBeInTheDocument();
    expect(screen.getByText(TOUR_STEPS[0].body.sv)).toBeInTheDocument();
    expect(screen.getByText("Stopp 1 av 20")).toBeInTheDocument();
  });

  it("Nästa går till stopp 2, Hoppa över stänger rundturen", () => {
    useDemoStore.getState().toggleTour();
    render(
      <LocaleProvider>
        <TourOverlay />
      </LocaleProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Nästa" }));
    expect(screen.getByText(TOUR_STEPS[1].title.sv)).toBeInTheDocument();
    expect(useDemoStore.getState().tourStepIndex).toBe(1);

    fireEvent.click(screen.getByRole("button", { name: "Hoppa över" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(useDemoStore.getState().tourOn).toBe(false);
  });

  it("sista stoppets knapp avslutar rundturen i stället för att gå vidare", () => {
    useDemoStore.getState().toggleTour();
    useDemoStore.getState().setTourStep(TOUR_STEPS.length - 1);
    render(
      <LocaleProvider>
        <TourOverlay />
      </LocaleProvider>,
    );

    expect(screen.getByText(`Stopp ${TOUR_STEPS.length} av ${TOUR_STEPS.length}`)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Avsluta rundtur" }));
    expect(useDemoStore.getState().tourOn).toBe(false);
  });

  it("hittar och spotlightar ett data-tour-id-mål utan att krascha", async () => {
    const targetIndex = TOUR_STEPS.findIndex((step) => step.target === "cofounder-moment");
    useDemoStore.getState().toggleTour();
    useDemoStore.getState().setTourStep(targetIndex);

    render(
      <LocaleProvider>
        <div data-tour-id="cofounder-moment">Medgrundarens moment</div>
        <TourOverlay />
      </LocaleProvider>,
    );

    expect(await screen.findByText(TOUR_STEPS[targetIndex].title.sv)).toBeInTheDocument();
  });
});
