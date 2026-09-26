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
import FondaDemoValidationPage from "./(app)/validering/page";
import FondaDemoPulsePage from "./(app)/pulsen/page";
import FondaDemoMarketingPage from "./(app)/marknadsforing/page";
import { findBeatIndexById } from "@/adapters/demo/sara";
import FondaDemoStartPage from "./start/page";
import { FONDA_DEMO_KEY, REAL_DEMO_KEY, enterFondaDemo, leaveFondaDemo } from "./_lib/fondaDemoIsolation";
import { FONDA_DEMO_PATHS } from "./_lib/paths";

const router = { push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() };
let pathname = "/demo";

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

/** Demots läge med onboardingen avklarad, som efter profilsamtalet. */
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

describe("/demo", () => {
  it("skickar en ny besökare till onboardingen, som det riktiga demot", async () => {
    await renderInApp(<FondaDemoHomePage />);
    expect(router.replace).toHaveBeenCalledWith(FONDA_DEMO_PATHS.start);
    expect(window.localStorage.getItem(REAL_DEMO_KEY)).toBe(realSaved);
  });

  it("onboardingens val av ingång sparas bara i demots läge", async () => {
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

  it("Hem visar första steget, och knappen spelar upp nästa moment i demots eget läge", async () => {
    startInApp(0);
    await renderInApp(<FondaDemoHomePage />);
    const first = saraEngine.getJourneySummaryForBeat(0, "sv").nextStep;
    expect(screen.getByRole("heading", { level: 2, name: first.title })).toBeInTheDocument();
    expect(screen.getAllByText(sv.site.demo.badge).length).toBeGreaterThan(0);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: first.actionLabel }));
    });
    expect(useDemoStore.getState().beatIndex).toBe(1);
    expect(JSON.parse(window.localStorage.getItem(FONDA_DEMO_KEY) ?? "{}").state.beatIndex).toBe(1);
    expect(window.localStorage.getItem(REAL_DEMO_KEY)).toBe(realSaved);
  });

  it("menyn har alla tolv sidor", async () => {
    startInApp(0);
    await renderInApp(<FondaDemoHomePage />);
    const nav = screen.getByRole("navigation", { name: sv.site.demo.navLabel });
    expect(nav.querySelectorAll("a")).toHaveLength(12);
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
  describe("Datalöftet och buggrapporten (docs/buggar-2026-09.md)", () => {
    const lastBeat = saraEngine.beats.length - 1;
    const label = sv.site.demo.exampleLabel;

    it("märker de påhittade företagen i Validering och visar storleksklass, inte exakt antal (punkt 13, 20)", async () => {
      startInApp(lastBeat);
      pathname = FONDA_DEMO_PATHS.validation;
      await renderInApp(<FondaDemoValidationPage />);

      expect(screen.getAllByText(label)).toHaveLength(2);
      const table = screen.getByRole("table");
      const employeeCells = [...table.querySelectorAll("tbody tr")].map((row) => row.children[2]?.textContent);
      expect(employeeCells.length).toBeGreaterThan(0);
      for (const cell of employeeCells) expect(cell).toMatch(/^(1–4|5–9|10–19|20–49|50\+)$/);
    });

    it("märker registersiffrorna och konkurrenterna på Marknad", async () => {
      startInApp(lastBeat);
      pathname = FONDA_DEMO_PATHS.market;
      await renderInApp(<FondaDemoMarketPage />);

      expect(screen.getAllByText(label)).toHaveLength(2);
    });

    it("Pulsen visar inga fasta relativa tider som inte stämmer med källans datum (punkt 11)", async () => {
      startInApp(lastBeat);
      pathname = FONDA_DEMO_PATHS.pulse;
      const { container } = await renderInApp(<FondaDemoPulsePage />);

      expect(container.querySelectorAll(".fdd-signal").length).toBeGreaterThan(0);
      expect(container.textContent).not.toMatch(/sedan|Uppdaterad \d/);
    });

    it("sidhuvudet på varje sida säger att datan är påhittad", async () => {
      startInApp(lastBeat);
      await renderInApp(<FondaDemoHomePage />);
      expect(screen.getByText(sv.site.demo.badge)).toBeInTheDocument();
    });
  });
});

describe("/demo/marknadsforing", () => {
  it("är låst före steg 11, med ledtråden om när den låses upp", async () => {
    startInApp(0);
    pathname = FONDA_DEMO_PATHS.marketing;
    await renderInApp(<FondaDemoMarketingPage />);
    expect(screen.getByRole("heading", { level: 1, name: sv.marketingPage.title })).toBeInTheDocument();
    expect(screen.getByText(`${sv.homePage.unlocksAfterStepBefore} 10`)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: sv.marketingPage.messageTitle })).not.toBeInTheDocument();
  });

  it("i steg 11 visas budskapet, kanalerna och ett utkast, märkt som påhittat", async () => {
    startInApp(findBeatIndexById("11-forsta-kunderna-fore"));
    pathname = FONDA_DEMO_PATHS.marketing;
    await renderInApp(<FondaDemoMarketingPage />);
    await act(async () => {});
    expect(screen.getByRole("heading", { name: sv.marketingPage.messageTitle })).toBeInTheDocument();
    expect(screen.getByText(sv.site.demo.exampleLabel)).toBeInTheDocument();
    expect(screen.getAllByText(sv.marketingPage.channelVerdict.recommended)).toHaveLength(2);
    expect(screen.getByText(sv.marketingPage.draftNote)).toBeInTheDocument();
    // Inga utfall innan planen har börjat köras.
    expect(screen.getByText(sv.marketingPage.outcomeEmpty)).toBeInTheDocument();
  });

  it("ett klick på en aktivitet byter utkast, och när steg 11 är klart syns alla fyra veckors utfall", async () => {
    startInApp(findBeatIndexById("11-forsta-kunderna-efter"));
    pathname = FONDA_DEMO_PATHS.marketing;
    const { container } = await renderInApp(<FondaDemoMarketingPage />);
    await act(async () => {});
    const buttons = screen.getAllByRole("button", { pressed: false });
    await act(async () => {
      fireEvent.click(buttons[0]);
    });
    await act(async () => {});
    expect(buttons[0]).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText(sv.marketingPage.outcomeEmpty)).not.toBeInTheDocument();
    expect(container.querySelectorAll(".fdd-table tbody tr")).toHaveLength(4);
  });
});
