import { Suspense, type ReactNode } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { saraEngine } from "@/adapters/demo/sara";
import { jonasBeats } from "@/adapters/demo/jonas";
import { demoJourneyRepository } from "@/adapters/demo/JourneyRepository";
import FondaDemoLayout from "./layout";
import FondaDemoAppLayout from "./(app)/layout";
import FondaDemoHomePage from "./(app)/page";
import FondaDemoScorePage from "./(app)/poang/page";
import FondaDemoMarketPage from "./(app)/marknad/page";
import FondaDemoLegalPage from "./(app)/juridik/page";
import FondaDemoMemoryPage from "./(app)/minnet/page";
import FondaDemoValidationPage from "./(app)/validering/page";
import FondaDemoPulsePage from "./(app)/pulsen/page";
import FondaDemoJourneyPage from "./(app)/resan/page";
import FondaDemoJourneyStepPage from "./(app)/resan/[steg]/page";
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

  it("menyn har alla elva sidor", async () => {
    startInApp(0);
    await renderInApp(<FondaDemoHomePage />);
    const nav = screen.getByRole("navigation", { name: sv.site.demo.navLabel });
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

  it("Poäng (tunn hämtare, PR 4) visar delarna med källa, de låsta delarna och historiken — ingen Kommer snart", async () => {
    startInApp(8);
    pathname = FONDA_DEMO_PATHS.score;
    const { container } = await renderInApp(<FondaDemoScorePage />);
    const expected = saraEngine.getScoreSnapshotForBeat(8, "sv");
    expect(container.querySelectorAll(".fd-part:not(.fd-part--locked)")).toHaveLength(expected.parts.length);
    expect(container.querySelectorAll(".fd-part--locked")).toHaveLength(expected.lockedParts.length);
    expect(container.querySelector(".fdd-history polyline")).not.toBeNull();
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
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
    const { container } = await renderInApp(<FondaDemoLegalPage />);
    expect(screen.getByText(sv.legalPage.disclaimer)).toBeInTheDocument();
    // Demots källor är lika overifierade som appens (PR 5): en märkning per krav.
    const rows = container.querySelectorAll(".fdd-rows__item");
    expect(rows.length).toBeGreaterThan(0);
    expect(screen.getAllByText(sv.legalPage.unverifiedSource)).toHaveLength(rows.length);
  });

  it("Juridik (tunn hämtare, PR 5) är låst före steg 05 och utanför Jonas scenario", async () => {
    startInApp(0);
    pathname = FONDA_DEMO_PATHS.legal;
    await renderInApp(<FondaDemoLegalPage />);
    expect(screen.getByText(`${sv.homePage.unlocksAfterStepBefore} 04`)).toBeInTheDocument();
    cleanup();
    useDemoStore.getState().setEntry("hasIdea");
    await renderInApp(<FondaDemoLegalPage />);
    expect(screen.getByText(sv.homePage.notInThisScenario)).toBeInTheDocument();
  });

  it("Minnet (tunn hämtare, PR 5) visar Saras profil och demots ledtråd i Hjärnan", async () => {
    startInApp(8);
    pathname = FONDA_DEMO_PATHS.memory;
    await renderInApp(<FondaDemoMemoryPage />);
    expect(screen.getByRole("heading", { level: 1, name: /Sara Lindqvist/ })).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole("tab", { name: sv.memoryPage.tabs.brain }), { button: 0 });
    expect(screen.getByText(sv.memoryPage.brainHint)).toBeInTheDocument();
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
  });
  it("Resan (tunn hämtare, PR 9) visar demots steg med länkar under /demo/resan", async () => {
    startInApp(9);
    pathname = FONDA_DEMO_PATHS.journey;
    await renderInApp(<FondaDemoJourneyPage />);
    const steps = await demoJourneyRepository.getSteps("sv");
    const current = steps.find((step) => step.status === "current")!;
    expect(screen.getByRole("heading", { level: 1, name: current.title })).toBeInTheDocument();
    const stepper = screen.getByRole("list", { name: sv.site.journey.stepsListLabel });
    expect(stepper.querySelectorAll("a.fdd-stepper__link")).toHaveLength(12);
    expect(stepper.querySelector("a.fdd-stepper__link")).toHaveAttribute("href", `${FONDA_DEMO_PATHS.journey}/1`);
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
  });

  it("steget (tunn hämtare, PR 9) visar domen i steg 06 och låst läge för ett senare steg", async () => {
    startInApp(saraEngine.beats.length - 1);
    pathname = `${FONDA_DEMO_PATHS.journey}/6`;
    const detail = await demoJourneyRepository.getStepDetail(6, "sv");
    await renderInApp(
      <Suspense>
        <FondaDemoJourneyStepPage params={Promise.resolve({ steg: "6" })} />
      </Suspense>,
    );
    expect(await screen.findByRole("heading", { level: 1, name: detail!.title })).toBeInTheDocument();
    expect(screen.getByText(detail!.verdict!.headline)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: new RegExp(sv.journeyPage.backToJourney) })).toHaveAttribute(
      "href",
      FONDA_DEMO_PATHS.journey,
    );
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
    cleanup();

    useDemoStore.getState().goTo(0);
    await renderInApp(
      <Suspense>
        <FondaDemoJourneyStepPage params={Promise.resolve({ steg: "5" })} />
      </Suspense>,
    );
    expect(await screen.findByText(`${sv.homePage.unlocksAfterStepBefore} 04`)).toBeInTheDocument();
  });

  it("inget olåst steg i demot saknar text, i något moment för Sara eller Jonas (PR 9: annars Kommer snart)", async () => {
    startInApp(0);
    const scenarios = [
      { entry: "noIdea" as const, beats: saraEngine.beats.length },
      { entry: "hasIdea" as const, beats: jonasBeats.length },
    ];
    const empty: string[] = [];
    for (const { entry, beats } of scenarios) {
      useDemoStore.getState().setEntry(entry);
      for (let beat = 0; beat < beats; beat++) {
        useDemoStore.getState().goTo(beat);
        for (let stepNumber = 1; stepNumber <= 12; stepNumber++) {
          for (const locale of ["sv", "en"] as const) {
            const detail = await demoJourneyRepository.getStepDetail(stepNumber, locale);
            if (detail && detail.status !== "locked" && !detail.why) empty.push(`${entry} beat ${beat} steg ${stepNumber} ${locale}`);
          }
        }
      }
    }
    expect(empty).toEqual([]);
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

    it("Validering följer demots moment: låst, simulering från steg 04, domen från steg 06, aldrig Kommer snart (PR 7)", async () => {
      const v = sv.validationPage;
      const firstBeatOf = (step: number) => saraEngine.beats.findIndex((beat) => beat.stepNumber === step);
      pathname = FONDA_DEMO_PATHS.validation;

      startInApp(0);
      await renderInApp(<FondaDemoValidationPage />);
      expect(screen.getByText(`${sv.homePage.unlocksAfterStepBefore} 03`)).toBeInTheDocument();
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      cleanup();

      startInApp(firstBeatOf(4));
      await renderInApp(<FondaDemoValidationPage />);
      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.getByText(v.simulationTitle)).toBeInTheDocument();
      expect(screen.queryByText(v.verdictTitle)).not.toBeInTheDocument();
      expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
      cleanup();

      startInApp(lastBeat);
      await renderInApp(<FondaDemoValidationPage />);
      expect(screen.getByText(v.verdictTitle)).toBeInTheDocument();
      expect(screen.getByText(v.openRateLabel)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(`^${v.confidencePrefix} \\d+ av \\d+`))).toBeInTheDocument();
      expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
    });

    it("Validering för Jonas säger att den inte finns i scenariot (PR 7)", async () => {
      startInApp(0);
      useDemoStore.setState({ entry: "hasIdea" });
      pathname = FONDA_DEMO_PATHS.validation;
      await renderInApp(<FondaDemoValidationPage />);
      expect(screen.getByText(sv.homePage.notInThisScenario)).toBeInTheDocument();
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("märker registersiffrorna och konkurrenterna på Marknad", async () => {
      startInApp(lastBeat);
      pathname = FONDA_DEMO_PATHS.market;
      await renderInApp(<FondaDemoMarketPage />);

      expect(screen.getAllByText(label)).toHaveLength(2);
    });

    it("Marknad (tunn hämtare, PR 8) följer demots moment och visar ingen Kommer snart", async () => {
      const firstBeatOf = (step: number) => saraEngine.beats.findIndex((beat) => beat.stepNumber === step);
      pathname = FONDA_DEMO_PATHS.market;

      startInApp(0);
      await renderInApp(<FondaDemoMarketPage />);
      expect(screen.getByText(`${sv.homePage.unlocksAfterStepBefore} 02`)).toBeInTheDocument();
      cleanup();

      startInApp(firstBeatOf(3));
      const { container } = await renderInApp(<FondaDemoMarketPage />);
      expect(screen.getByRole("heading", { level: 1, name: /anställda$/ })).toBeInTheDocument();
      expect(container.querySelectorAll(".fdd-bars__row")).toHaveLength(5);
      expect(screen.getByText("Konkurrenter")).toBeInTheDocument();
      expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
    });

    it("medianomsättningen och kontaktlistans omsättning visas inte utan räkenskapsår (PR 8)", async () => {
      startInApp(lastBeat);
      pathname = FONDA_DEMO_PATHS.market;
      await renderInApp(<FondaDemoMarketPage />);
      // Demodatan bär inga räkenskapsår: luckan i stället för "4,2 Mkr".
      const median = screen.getByText(sv.marketPage.medianRevenueLabel).parentElement!;
      expect(median).toHaveTextContent(sv.common.fiscalYearMissing);
      expect(median).not.toHaveTextContent(/Mkr/);
      cleanup();

      pathname = FONDA_DEMO_PATHS.validation;
      await renderInApp(<FondaDemoValidationPage />);
      const revenueCells = [...screen.getByRole("table").querySelectorAll("tbody tr")].map((row) => row.children[3]);
      expect(revenueCells.length).toBeGreaterThan(0);
      for (const cell of revenueCells) {
        expect(cell).not.toHaveTextContent(/tkr|\d/);
        expect(cell).toHaveTextContent(sv.common.fiscalYearMissing);
      }
    });

    it("Pulsen visar inga fasta relativa tider som inte stämmer med källans datum (punkt 11)", async () => {
      startInApp(lastBeat);
      pathname = FONDA_DEMO_PATHS.pulse;
      const { container } = await renderInApp(<FondaDemoPulsePage />);

      expect(container.querySelectorAll(".fdd-signal").length).toBeGreaterThan(0);
      expect(container.textContent).not.toMatch(/sedan|Uppdaterad \d/);
    });

    it("sidhuvudet visar demots poäng, samma som motorn räknar (PR 4)", async () => {
      startInApp(8);
      await renderInApp(<FondaDemoHomePage />);
      const expected = saraEngine.getScoreSnapshotForBeat(8, "sv");
      const link = screen.getByRole("link", { name: new RegExp(`^Poäng ${expected.total}`) });
      expect(link).toHaveAttribute("href", FONDA_DEMO_PATHS.score);
    });

    it("sidhuvudet på varje sida säger att datan är påhittad", async () => {
      startInApp(lastBeat);
      await renderInApp(<FondaDemoHomePage />);
      expect(screen.getByText(sv.site.demo.badge)).toBeInTheDocument();
    });
  });
});
