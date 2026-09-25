import type { ReactNode } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { saraEngine } from "@/adapters/demo/sara";
import FondaDemoLayout from "./layout";
import FondaDemoAppLayout from "./(app)/layout";
import FondaDemoHomePage from "./(app)/page";
import FondaDemoScorePage from "./(app)/poang/page";
import FondaDemoMarketPage from "./(app)/marknad/page";
import FondaDemoLegalPage from "./(app)/juridik/page";
import FondaDemoStartPage from "./start/page";
import { FONDA_DEMO_KEY, REAL_DEMO_KEY, enterFondaDemo, leaveFondaDemo } from "./_lib/fondaDemoIsolation";
import { FONDA_DEMO_PATHS } from "./_lib/paths";

const router = { push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() };
let pathname = "/experiment/fonda/demo";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => router,
}));

const realSaved = JSON.stringify({
  state: { beatIndex: 7, entry: "noIdea", onboardingDone: true, tourOn: false, tourStepIndex: 0, collapsed: false },
  version: 0,
});

// Samma matchMedia-stubb som app/(marketing)/page.test.tsx.
beforeAll(() => {
  window.matchMedia = ((query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList) as typeof window.matchMedia;
});

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem(REAL_DEMO_KEY, realSaved);
  useDemoStore.persist.setOptions({ name: REAL_DEMO_KEY });
  useDemoStore.setState({ beatIndex: 7, entry: "noIdea", onboardingDone: true, tourOn: false });
  router.push.mockReset();
  router.replace.mockReset();
  pathname = FONDA_DEMO_PATHS.home;
});

afterEach(async () => {
  cleanup();
  leaveFondaDemo();
  await act(async () => {});
});

/** Kopians läge med onboardingen avklarad, som efter profilsamtalet. */
function startInApp(beatIndex = 0) {
  enterFondaDemo();
  useDemoStore.getState().completeOnboarding();
  useDemoStore.getState().goTo(beatIndex);
}

async function renderInApp(page: ReactNode) {
  const result = render(
    <LocaleProvider>
      <FondaDemoLayout>
        <FondaDemoAppLayout>{page}</FondaDemoAppLayout>
      </FondaDemoLayout>
    </LocaleProvider>,
  );
  await act(async () => {});
  return result;
}

describe("/experiment/fonda/demo", () => {
  it("skickar en ny besökare till onboardingen, som det riktiga demot", async () => {
    await renderInApp(<FondaDemoHomePage />);
    expect(router.replace).toHaveBeenCalledWith(FONDA_DEMO_PATHS.start);
    expect(window.localStorage.getItem(REAL_DEMO_KEY)).toBe(realSaved);
  });

  it("onboardingens val av ingång sparas bara i kopians läge", async () => {
    pathname = FONDA_DEMO_PATHS.start;
    render(
      <LocaleProvider>
        <FondaDemoLayout>
          <FondaDemoStartPage />
        </FondaDemoLayout>
      </LocaleProvider>,
    );
    await act(async () => {});
    fireEvent.click(screen.getByRole("link", { name: new RegExp(sv.onboarding.entry.hasIdea.title) }));
    expect(useDemoStore.getState().entry).toBe("hasIdea");
    expect(JSON.parse(window.localStorage.getItem(FONDA_DEMO_KEY) ?? "{}").state.entry).toBe("hasIdea");
    expect(window.localStorage.getItem(REAL_DEMO_KEY)).toBe(realSaved);
  });

  it("Hem visar första steget, och knappen spelar upp nästa moment i kopians eget läge", async () => {
    startInApp(0);
    await renderInApp(<FondaDemoHomePage />);
    const first = saraEngine.getJourneySummaryForBeat(0, "sv").nextStep;
    expect(screen.getByRole("heading", { level: 2, name: first.title })).toBeInTheDocument();
    expect(screen.getAllByText(sv.experimentFonda.demo.badge).length).toBeGreaterThan(0);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: first.actionLabel }));
    });
    expect(useDemoStore.getState().beatIndex).toBe(1);
    expect(JSON.parse(window.localStorage.getItem(FONDA_DEMO_KEY) ?? "{}").state.beatIndex).toBe(1);
    expect(window.localStorage.getItem(REAL_DEMO_KEY)).toBe(realSaved);
  });

  it("menyn har alla elva sidor", async () => {
    startInApp(0);
    await renderInApp(<FondaDemoHomePage />);
    const nav = screen.getByRole("navigation", { name: sv.experimentFonda.demo.navLabel });
    expect(nav.querySelectorAll("a")).toHaveLength(11);
    expect(screen.getByRole("link", { name: sv.appShell.nav.businessPlan })).toHaveAttribute(
      "href",
      FONDA_DEMO_PATHS.businessPlan,
    );
  });

  it("Poäng visar samma poäng som demots motor, och Lovable-förslaget bär koncept-etiketten", async () => {
    startInApp(19);
    pathname = FONDA_DEMO_PATHS.score;
    await renderInApp(<FondaDemoScorePage />);
    const expected = saraEngine.getScoreSnapshotForBeat(19, "sv");
    expect(screen.getAllByText(String(expected.total)).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: sv.scorePage.suggestionsTitle })).toBeInTheDocument();
    expect(screen.getAllByText(sv.common.conceptBadge).length).toBeGreaterThan(0);
    expect(window.localStorage.getItem(REAL_DEMO_KEY)).toBe(realSaved);
  });

  it("Marknad är låst i Jonas scenario, som i originalet", async () => {
    startInApp(0);
    useDemoStore.getState().setEntry("hasIdea");
    pathname = FONDA_DEMO_PATHS.market;
    await renderInApp(<FondaDemoMarketPage />);
    expect(screen.getByText(sv.homePage.notInThisScenario)).toBeInTheDocument();
  });

  it("Juridik visar ansvarsbegränsningen", async () => {
    startInApp(19);
    pathname = FONDA_DEMO_PATHS.legal;
    await renderInApp(<FondaDemoLegalPage />);
    expect(screen.getByText(sv.legalPage.disclaimer)).toBeInTheDocument();
  });
});
