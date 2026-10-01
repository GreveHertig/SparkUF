import { Suspense, type ReactNode } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { fill } from "@/i18n/fill";
import { DEMO_STATE_KEY, useDemoStore } from "@/adapters/demo/demoStore";
import { saraEngine } from "@/adapters/demo/sara";
import { jonasBeats } from "@/adapters/demo/jonas";
import { demoJourneyRepository } from "@/adapters/demo/JourneyRepository";
import { demoBuildProvider } from "@/adapters/demo/BuildProvider";
import { getBusinessPlan } from "@/adapters/demo/businessPlan";
import DemoLayout from "./layout";
import DemoAppLayout from "./(app)/layout";
import DemoHomePage from "./(app)/page";
import DemoScorePage from "./(app)/poang/page";
import DemoMarketPage from "./(app)/marknad/page";
import DemoLegalPage from "./(app)/juridik/page";
import DemoMemoryPage from "./(app)/minnet/page";
import DemoValidationPage from "./(app)/validering/page";
import DemoPulsePage from "./(app)/pulsen/page";
import DemoJourneyPage from "./(app)/resan/page";
import DemoJourneyStepPage from "./(app)/resan/[steg]/page";
import DemoCofounderPage from "./(app)/medgrundaren/page";
import DemoBuildPage from "./(app)/bygg/page";
import DemoBusinessPlanPage from "./(app)/affarsplan/page";
import DemoStartPage from "./start/page";
import DemoIdeaPage from "./start/ide/page";
import DemoProfilePage from "./start/profil/page";
import { demoProjectRepository } from "@/adapters/demo/ProjectRepository";
import { DEMO_PATHS } from "./_lib/paths";

const router = { push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() };
let pathname = "/demo";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => router,
}));

// Det gamla demots nyckel (före #25). Demot får aldrig läsa eller skriva den.
const OLD_DEMO_KEY = "spark:demo-state";
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
  window.localStorage.setItem(OLD_DEMO_KEY, realSaved);
  useDemoStore.getState().reset();
  router.push.mockReset();
  router.replace.mockReset();
  pathname = DEMO_PATHS.home;
});

afterEach(async () => {
  cleanup();
  await act(async () => {});
});

/** Demots läge med onboardingen avklarad, som efter profilsamtalet. */
function startInApp(beatIndex = 0) {
  useDemoStore.getState().completeOnboarding();
  useDemoStore.getState().goTo(beatIndex);
}

async function renderInApp(page: ReactNode) {
  const result = render(
    <LocaleProvider>
      <DemoLayout>
        <DemoAppLayout>{page}</DemoAppLayout>
      </DemoLayout>
    </LocaleProvider>,
  );
  await act(async () => {});
  return result;
}

describe("/demo", () => {
  it("skickar en ny besökare till onboardingen, som det riktiga demot", async () => {
    await renderInApp(<DemoHomePage />);
    expect(router.replace).toHaveBeenCalledWith(DEMO_PATHS.start);
    expect(window.localStorage.getItem(OLD_DEMO_KEY)).toBe(realSaved);
  });

  it("onboardingens val av ingång sparas bara i demots läge", async () => {
    pathname = DEMO_PATHS.start;
    render(
      <LocaleProvider>
        <DemoLayout>
          <DemoStartPage />
        </DemoLayout>
      </LocaleProvider>,
    );
    await act(async () => {});
    fireEvent.click(screen.getByRole("link", { name: new RegExp(sv.onboarding.entry.hasIdea.title) }));
    expect(useDemoStore.getState().entry).toBe("hasIdea");
    expect(JSON.parse(window.localStorage.getItem(DEMO_STATE_KEY) ?? "{}").state.entry).toBe("hasIdea");
    expect(window.localStorage.getItem(OLD_DEMO_KEY)).toBe(realSaved);
  });

  it("idégenomlysningen (tunn hämtare, PR 11) visar demots genomlysning och länkar till profilsamtalet", async () => {
    pathname = DEMO_PATHS.startIdea;
    useDemoStore.getState().setEntry("hasIdea");
    const screening = await demoProjectRepository.getIdeaScreening("sv");
    render(
      <LocaleProvider>
        <DemoLayout>
          <DemoIdeaPage />
        </DemoLayout>
      </LocaleProvider>,
    );
    await act(async () => {});
    expect(screen.getByText(screening.originalIdea)).toBeInTheDocument();
    expect(screen.getByText(screening.sharperIdea.name)).toBeInTheDocument();
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: sv.onboarding.idea.continueCta })).toHaveAttribute("href", DEMO_PATHS.startProfile);
  });

  it("profilsamtalet (tunn hämtare, PR 11) spelar upp demots samtal och markerar onboardingen klar", async () => {
    vi.useFakeTimers();
    try {
      pathname = DEMO_PATHS.startProfile;
        render(
        <LocaleProvider>
          <DemoLayout>
            <DemoProfilePage />
          </DemoLayout>
        </LocaleProvider>,
      );
      await act(async () => {});
      expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
      for (let i = 0; i < 20; i += 1) {
        await act(async () => {
          vi.advanceTimersByTime(2300);
        });
      }
      const continueLink = screen.getByRole("link", { name: sv.onboarding.profile.continueCta });
      expect(continueLink).toHaveAttribute("href", DEMO_PATHS.home);
      expect(useDemoStore.getState().onboardingDone).toBe(false);
      fireEvent.click(continueLink);
      expect(useDemoStore.getState().onboardingDone).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("Hem visar första steget, och knappen spelar upp nästa moment i demots eget läge", async () => {
    startInApp(0);
    await renderInApp(<DemoHomePage />);
    const first = saraEngine.getJourneySummaryForBeat(0, "sv").nextStep;
    expect(screen.getByRole("heading", { level: 2, name: first.title })).toBeInTheDocument();
    expect(screen.getAllByText(sv.site.demo.badge).length).toBeGreaterThan(0);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: first.actionLabel }));
    });
    expect(useDemoStore.getState().beatIndex).toBe(1);
    expect(JSON.parse(window.localStorage.getItem(DEMO_STATE_KEY) ?? "{}").state.beatIndex).toBe(1);
    expect(window.localStorage.getItem(OLD_DEMO_KEY)).toBe(realSaved);
  });

  it("menyn har alla elva sidor", async () => {
    startInApp(0);
    await renderInApp(<DemoHomePage />);
    const nav = screen.getByRole("navigation", { name: sv.site.demo.navLabel });
    expect(nav.querySelectorAll("a")).toHaveLength(11);
    expect(screen.getByRole("link", { name: sv.appShell.nav.businessPlan })).toHaveAttribute(
      "href",
      DEMO_PATHS.businessPlan,
    );
  });

  it("Poäng visar samma poäng som demots motor, och Lovable-förslaget bär koncept-etiketten", async () => {
    startInApp(19);
    pathname = DEMO_PATHS.score;
    await renderInApp(<DemoScorePage />);
    const expected = saraEngine.getScoreSnapshotForBeat(19, "sv");
    expect(screen.getAllByText(String(expected.total)).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: sv.scorePage.suggestionsTitle })).toBeInTheDocument();
    expect(screen.getAllByText(sv.common.conceptBadge).length).toBeGreaterThan(0);
    expect(window.localStorage.getItem(OLD_DEMO_KEY)).toBe(realSaved);
  });

  it("Poäng (tunn hämtare, PR 4) visar delarna med källa, de låsta delarna och historiken — ingen Kommer snart", async () => {
    startInApp(8);
    pathname = DEMO_PATHS.score;
    const { container } = await renderInApp(<DemoScorePage />);
    const expected = saraEngine.getScoreSnapshotForBeat(8, "sv");
    expect(container.querySelectorAll(".fd-part:not(.fd-part--locked)")).toHaveLength(expected.parts.length);
    expect(container.querySelectorAll(".fd-part--locked")).toHaveLength(expected.lockedParts.length);
    expect(container.querySelector(".fdd-history polyline")).not.toBeNull();
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
  });

  it("Marknad är låst i Jonas scenario, som i originalet", async () => {
    startInApp(0);
    useDemoStore.getState().setEntry("hasIdea");
    pathname = DEMO_PATHS.market;
    await renderInApp(<DemoMarketPage />);
    expect(screen.getByText(sv.homePage.notInThisScenario)).toBeInTheDocument();
  });

  it("Juridik visar ansvarsbegränsningen", async () => {
    startInApp(19);
    pathname = DEMO_PATHS.legal;
    const { container } = await renderInApp(<DemoLegalPage />);
    expect(screen.getByText(sv.legalPage.disclaimer)).toBeInTheDocument();
    // Demots källor är lika overifierade som appens (PR 5): en märkning per krav.
    const rows = container.querySelectorAll(".fdd-rows__item");
    expect(rows.length).toBeGreaterThan(0);
    expect(screen.getAllByText(sv.legalPage.unverifiedSource)).toHaveLength(rows.length);
  });

  it("Juridik (tunn hämtare, PR 5) är låst före steg 05 och utanför Jonas scenario", async () => {
    startInApp(0);
    pathname = DEMO_PATHS.legal;
    await renderInApp(<DemoLegalPage />);
    expect(screen.getByText(`${sv.homePage.unlocksAfterStepBefore} 04`)).toBeInTheDocument();
    cleanup();
    useDemoStore.getState().setEntry("hasIdea");
    await renderInApp(<DemoLegalPage />);
    expect(screen.getByText(sv.homePage.notInThisScenario)).toBeInTheDocument();
  });

  it("Minnet (tunn hämtare, PR 5) visar Saras profil och demots ledtråd i Hjärnan", async () => {
    startInApp(8);
    pathname = DEMO_PATHS.memory;
    await renderInApp(<DemoMemoryPage />);
    expect(screen.getByRole("heading", { level: 1, name: /Sara Lindqvist/ })).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole("tab", { name: sv.memoryPage.tabs.brain }), { button: 0 });
    expect(screen.getByText(sv.memoryPage.brainHint)).toBeInTheDocument();
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
  });
  it("Resan (tunn hämtare, PR 9) visar demots steg med länkar under /demo/resan", async () => {
    startInApp(9);
    pathname = DEMO_PATHS.journey;
    await renderInApp(<DemoJourneyPage />);
    const steps = await demoJourneyRepository.getSteps("sv");
    const current = steps.find((step) => step.status === "current")!;
    expect(screen.getByRole("heading", { level: 1, name: current.title })).toBeInTheDocument();
    const stepper = screen.getByRole("list", { name: sv.site.journey.stepsListLabel });
    expect(stepper.querySelectorAll("a.fdd-stepper__link")).toHaveLength(12);
    expect(stepper.querySelector("a.fdd-stepper__link")).toHaveAttribute("href", `${DEMO_PATHS.journey}/1`);
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
  });

  it("steget (tunn hämtare, PR 9) visar domen i steg 06 och låst läge för ett senare steg", async () => {
    startInApp(saraEngine.beats.length - 1);
    pathname = `${DEMO_PATHS.journey}/6`;
    const detail = await demoJourneyRepository.getStepDetail(6, "sv");
    await renderInApp(
      <Suspense>
        <DemoJourneyStepPage params={Promise.resolve({ steg: "6" })} />
      </Suspense>,
    );
    expect(await screen.findByRole("heading", { level: 1, name: detail!.title })).toBeInTheDocument();
    expect(screen.getByText(detail!.verdict!.headline)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: new RegExp(sv.journeyPage.backToJourney) })).toHaveAttribute(
      "href",
      DEMO_PATHS.journey,
    );
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
    cleanup();

    useDemoStore.getState().goTo(0);
    await renderInApp(
      <Suspense>
        <DemoJourneyStepPage params={Promise.resolve({ steg: "5" })} />
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

  it("Medgrundaren (tunn hämtare, PR 10) visar momentet ur manuset och det som redan är känt", async () => {
    startInApp(9);
    pathname = DEMO_PATHS.cofounder;
    await renderInApp(<DemoCofounderPage />);
    const beat = saraEngine.getBeatAt(9);
    const label = `${String(beat.stepNumber).padStart(2, "0")} · ${beat.momentLabel.sv}`;
    expect(screen.getByRole("heading", { level: 2, name: label })).toBeInTheDocument();
    const known = saraEngine.beats.slice(0, 9).filter((b) => b.momentKind === "after");
    expect(known.length).toBeGreaterThan(0);
    expect(screen.getByRole("complementary").querySelectorAll("li")).toHaveLength(known.length);
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
    cleanup();

    // Första momentet: inget känt än, så spalten döljs.
    useDemoStore.getState().goTo(0);
    await renderInApp(<DemoCofounderPage />);
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
  });

  it("Bygg (tunn hämtare, PR 10) är låst före steg 08, visar specen efter, och är utanför Jonas scenario", async () => {
    startInApp(0);
    pathname = DEMO_PATHS.build;
    await renderInApp(<DemoBuildPage />);
    expect(await screen.findByText(`${sv.homePage.unlocksAfterStepBefore} 07`)).toBeInTheDocument();
    cleanup();

    useDemoStore.getState().goTo(saraEngine.beats.length - 1);
    await renderInApp(<DemoBuildPage />);
    const spec = await demoBuildProvider.getSpec("sv");
    expect(await screen.findByRole("heading", { level: 1, name: spec!.sammanfattning })).toBeInTheDocument();
    expect(screen.getByText(sv.buildPage.status.published)).toBeInTheDocument();
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
    expect(screen.queryByText(sv.buildPage.specEmpty)).not.toBeInTheDocument();
    cleanup();

    useDemoStore.getState().setEntry("hasIdea");
    await renderInApp(<DemoBuildPage />);
    expect(await screen.findByText(sv.homePage.notInThisScenario)).toBeInTheDocument();
  });

  it("Affärsplanen (tunn hämtare, PR 10) visar samma mognad och avsnitt som hopsamlingen, med källa på varje påstående", async () => {
    startInApp(saraEngine.beats.length - 1);
    pathname = DEMO_PATHS.businessPlan;
    await renderInApp(<DemoBusinessPlanPage />);
    const plan = await getBusinessPlan("sv");
    expect(
      await screen.findByText(`${plan.maturity.solidCount}/${plan.maturity.totalCount}`),
    ).toBeInTheDocument();
    expect(document.querySelectorAll("h2[id^='fdd-plan-']")).toHaveLength(plan.sections.length);
    const claims = plan.sections.reduce((sum, s) => sum + s.claims.length + s.contradictions.length * 2, 0);
    expect(document.querySelectorAll(".fdd-claim")).toHaveLength(claims);
    for (const item of document.querySelectorAll(".fdd-claim")) {
      expect(item.querySelector(".fdd-inline")?.textContent).not.toBe("");
    }
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
  });

  describe("exempelkällor (PR 11)", () => {
    const lastBeat = saraEngine.beats.length - 1;
    const exampleTags = () =>
      screen
        .queryAllByRole("button", { name: sv.common.sourceTag.openDetails })
        .filter((tag) => tag.textContent?.startsWith(sv.common.exampleSourceLabel));

    it("affärsplanens exempel bär exempelkällan, och en lucka från ett klart steg säger att steget är klart", async () => {
      startInApp(lastBeat);
      pathname = DEMO_PATHS.businessPlan;
      await renderInApp(<DemoBusinessPlanPage />);
      expect(await screen.findByText("8/9")).toBeInTheDocument();
      expect(exampleTags().length).toBeGreaterThan(0);
      for (const tag of exampleTags()) expect(tag).toHaveTextContent(/Påhittad data, /);
      // Saras steg 06 är klart men ger inga antaganden: ingen "kommer från steg 6".
      expect(screen.getByText(fill(sv.businessPlanPage.stepDoneNoEvidenceTemplate, { step: 6 }))).toBeInTheDocument();
      expect(screen.queryByText(fill(sv.businessPlanPage.requiresStepTemplate, { step: 6 }))).not.toBeInTheDocument();
    });

    it("Marknads konkurrentbeskrivningar bär var sin exempelkälla från steg 03", async () => {
      startInApp(lastBeat);
      pathname = DEMO_PATHS.market;
      await renderInApp(<DemoMarketPage />);
      const section = (await screen.findByRole("heading", { name: sv.marketPage.competitorsTitle })).closest("section")!;
      const tags = [...section.querySelectorAll("button")].filter((b) => b.textContent?.includes("Påhittad data, steg 03"));
      expect(tags.length).toBe(section.querySelectorAll("li").length);
      expect(tags.length).toBeGreaterThan(0);
    });

    it("Byggs credits bär en exempelkälla", async () => {
      startInApp(lastBeat);
      pathname = DEMO_PATHS.build;
      await renderInApp(<DemoBuildPage />);
      const credits = (await screen.findByText(new RegExp(sv.buildPage.creditsUsedLabel))).closest(".fdd-gate__credits")!;
      expect(credits).toHaveTextContent("62");
      expect(credits.querySelector("button")).toHaveTextContent(`${sv.common.exampleSourceLabel}·Påhittad data, steg `);
    });

    it("Medgrundarens inslag med siffror bär en exempelkälla, andra gör det inte", async () => {
      startInApp(saraEngine.beats.findIndex((beat) => beat.id === "03-marknaden-korning"));
      pathname = DEMO_PATHS.cofounder;
      await renderInApp(<DemoCofounderPage />);
      const line = (await screen.findByText(/^312 redovisningsbyråer/)).closest(".fdd-chat")!;
      expect(line.querySelector("button")).toHaveTextContent(`${sv.common.exampleSourceLabel}·Påhittad data, steg 03`);
      for (const chat of document.querySelectorAll(".fdd-chat")) {
        if (!/\d/.test(chat.querySelector(".fdd-chat__bubble")?.textContent ?? "")) expect(chat.querySelector("button")).toBeNull();
      }
    });

    it("Marknads registersiffror och Poängs delar bär exempelkällan, aldrig registrets namn", async () => {
      startInApp(lastBeat);
      pathname = DEMO_PATHS.market;
      const market = await renderInApp(<DemoMarketPage />);
      for (const id of ["fdd-market-kpi", "fdd-market-dist", "fdd-market-layers"]) {
        const section = (await screen.findByRole("heading", { name: (_, el) => el.id === id })).closest("section")!;
        expect(section.textContent).not.toMatch(/Bolagsverket|SCB/);
        expect([...section.querySelectorAll("button")].some((b) => b.textContent?.includes("Påhittad data, steg 03"))).toBe(true);
      }
      market.unmount();

      pathname = DEMO_PATHS.score;
      const score = await renderInApp(<DemoScorePage />);
      const partTags = [...score.container.querySelectorAll(".fd-part__source")];
      expect(partTags.length).toBeGreaterThan(0);
      for (const tag of partTags) expect(tag.textContent).toMatch(/Påhittad data, poängunderlaget|Simulering/);
      expect(score.container.textContent).not.toMatch(/Bolagsverket|SCB|Kundsamtal/);
    });

    it("Validering, Marknad, Bygg och Affärsplanen bär bara exempel- eller simuleringstaggar, aldrig kundernas eller registrets", async () => {
      const pages = [
        [DEMO_PATHS.validation, <DemoValidationPage key="v" />],
        [DEMO_PATHS.market, <DemoMarketPage key="m" />],
        [DEMO_PATHS.build, <DemoBuildPage key="b" />],
        [DEMO_PATHS.businessPlan, <DemoBusinessPlanPage key="p" />],
      ] as const;
      for (const [path, page] of pages) {
        startInApp(lastBeat);
        pathname = path;
        const { container, unmount } = await renderInApp(page);
        await waitFor(() => expect(container.querySelector("main button[aria-label]")).not.toBeNull());
        const tags = [...container.querySelectorAll("main button")].filter(
          (b) => b.getAttribute("aria-label") === sv.common.sourceTag.openDetails,
        );
        expect(tags.length).toBeGreaterThan(0);
        for (const tag of tags) {
          expect(tag.textContent).toMatch(new RegExp(`^(${sv.common.exampleSourceLabel}|${sv.common.simulationLabel})`));
        }
        expect(container.querySelector("main")?.textContent).not.toMatch(/Sparks utskick|Kundsamtal|Bolagsverket|SCB/);
        unmount();
      }
    });

    it("Hems källtaggar är exempelkällor i varje moment, aldrig en myndighet eller en påhittad tid", async () => {
      const step05After = saraEngine.beats.findIndex((beat) => beat.stepNumber === 5 && beat.momentKind === "after");
      for (const beatIndex of [0, step05After, lastBeat]) {
        startInApp(beatIndex);
        pathname = DEMO_PATHS.home;
        const { container, unmount } = await renderInApp(<DemoHomePage />);
        const tags = [...container.querySelectorAll("main button")].filter(
          (b) => b.getAttribute("aria-label") === sv.common.sourceTag.openDetails,
        );
        expect(tags.length).toBeGreaterThan(0);
        for (const tag of tags) expect(tag.textContent).toMatch(new RegExp(`^${sv.common.exampleSourceLabel}·Påhittad data, `));
        expect(container.querySelector("main")?.textContent).not.toMatch(/Bolagsverket|Skatteverket|Inget utskick ännu/);
        expect(container.querySelector(".fdd-signal__meta .fdd-muted")).toBeNull();
        unmount();
      }
    });

    it("Hems Sedan sist pekar på steget där siffrorna kommer ifrån", async () => {
      startInApp(saraEngine.beats.findIndex((beat) => beat.stepNumber === 5 && beat.momentKind === "after"));
      pathname = DEMO_PATHS.home;
      const { container } = await renderInApp(<DemoHomePage />);
      const facts = container.querySelector(".fdd-facts")!;
      expect(facts).toHaveTextContent("40");
      for (const tag of facts.querySelectorAll("button")) expect(tag).toHaveTextContent("Påhittad data, steg 05");
    });

    it("Hems handlingskort bär en exempelkälla bara när texten har en siffra", async () => {
      startInApp(0);
      pathname = DEMO_PATHS.home;
      const first = await renderInApp(<DemoHomePage />);
      expect(first.container.querySelector(".fdd-next button[aria-label]")).toBeNull();
      first.unmount();

      const withFigure = saraEngine.beats.findIndex((beat) => /\d/.test(beat.nextStep.sv.why.replace(/steg \d+/gi, "")));
      startInApp(withFigure);
      const { container } = await renderInApp(<DemoHomePage />);
      const step = String(saraEngine.beats[withFigure].stepNumber).padStart(2, "0");
      expect(container.querySelector(".fdd-next button[aria-label]")).toHaveTextContent(
        `${sv.common.exampleSourceLabel}·Påhittad data, steg ${step}`,
      );
    });

    it("Hems handlingskort bär en exempelkälla när bara Redan klart har en siffra", async () => {
      const last = saraEngine.beats[lastBeat];
      expect(last.nextStep.sv.doneItems.join(" ")).toMatch(/\d/);
      startInApp(lastBeat);
      pathname = DEMO_PATHS.home;
      const { container } = await renderInApp(<DemoHomePage />);
      expect(container.querySelector(".fdd-next button[aria-label]")).toHaveTextContent(
        `${sv.common.exampleSourceLabel}·Påhittad data, steg ${String(last.stepNumber).padStart(2, "0")}`,
      );
    });

    it("Medgrundarens Sedan tidigare bär exempelkällan på rader med siffror", async () => {
      startInApp(lastBeat);
      pathname = DEMO_PATHS.cofounder;
      await renderInApp(<DemoCofounderPage />);
      const row = (await screen.findByText(/^Marknadsbilden hämtad: 312 byråer/)).closest("li")!;
      expect(row.querySelector("button")).toHaveTextContent(`${sv.common.exampleSourceLabel}·Påhittad data, steg 03`);
    });
  });

  describe("Datalöftet och buggrapporten (docs/buggar-2026-09.md)", () => {
    const lastBeat = saraEngine.beats.length - 1;
    const label = sv.site.demo.exampleLabel;

    it("märker de påhittade företagen i Validering och visar storleksklass, inte exakt antal (punkt 13, 20)", async () => {
      startInApp(lastBeat);
      pathname = DEMO_PATHS.validation;
      await renderInApp(<DemoValidationPage />);

      expect(screen.getAllByText(label)).toHaveLength(2);
      const table = screen.getByRole("table");
      const employeeCells = [...table.querySelectorAll("tbody tr")].map((row) => row.children[2]?.textContent);
      expect(employeeCells.length).toBeGreaterThan(0);
      for (const cell of employeeCells) expect(cell).toMatch(/^(1–4|5–9|10–19|20–49|50\+)$/);
    });

    it("Validering följer demots moment: låst, simulering från steg 04, domen från steg 06, aldrig Kommer snart (PR 7)", async () => {
      const v = sv.validationPage;
      const firstBeatOf = (step: number) => saraEngine.beats.findIndex((beat) => beat.stepNumber === step);
      pathname = DEMO_PATHS.validation;

      startInApp(0);
      await renderInApp(<DemoValidationPage />);
      expect(screen.getByText(`${sv.homePage.unlocksAfterStepBefore} 03`)).toBeInTheDocument();
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      cleanup();

      startInApp(firstBeatOf(4));
      await renderInApp(<DemoValidationPage />);
      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.getByText(v.simulationTitle)).toBeInTheDocument();
      expect(screen.queryByText(v.verdictTitle)).not.toBeInTheDocument();
      expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
      cleanup();

      startInApp(lastBeat);
      await renderInApp(<DemoValidationPage />);
      expect(screen.getByText(v.verdictTitle)).toBeInTheDocument();
      expect(screen.getByText(v.openRateLabel)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(`^${v.confidencePrefix} \\d+ av \\d+`))).toBeInTheDocument();
      expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
    });

    it("Validering för Jonas säger att den inte finns i scenariot (PR 7)", async () => {
      startInApp(0);
      useDemoStore.setState({ entry: "hasIdea" });
      pathname = DEMO_PATHS.validation;
      await renderInApp(<DemoValidationPage />);
      expect(screen.getByText(sv.homePage.notInThisScenario)).toBeInTheDocument();
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("märker registersiffrorna och konkurrenterna på Marknad", async () => {
      startInApp(lastBeat);
      pathname = DEMO_PATHS.market;
      await renderInApp(<DemoMarketPage />);

      expect(screen.getAllByText(label)).toHaveLength(2);
    });

    it("Marknad (tunn hämtare, PR 8) följer demots moment och visar ingen Kommer snart", async () => {
      const firstBeatOf = (step: number) => saraEngine.beats.findIndex((beat) => beat.stepNumber === step);
      pathname = DEMO_PATHS.market;

      startInApp(0);
      await renderInApp(<DemoMarketPage />);
      expect(screen.getByText(`${sv.homePage.unlocksAfterStepBefore} 02`)).toBeInTheDocument();
      cleanup();

      startInApp(firstBeatOf(3));
      const { container } = await renderInApp(<DemoMarketPage />);
      expect(screen.getByRole("heading", { level: 1, name: /anställda$/ })).toBeInTheDocument();
      expect(container.querySelectorAll(".fdd-bars__row")).toHaveLength(5);
      expect(screen.getByText("Konkurrenter")).toBeInTheDocument();
      expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
    });

    it("medianomsättningen och kontaktlistans omsättning visas inte utan räkenskapsår (PR 8)", async () => {
      startInApp(lastBeat);
      pathname = DEMO_PATHS.market;
      await renderInApp(<DemoMarketPage />);
      // Demodatan bär inga räkenskapsår: luckan i stället för "4,2 Mkr".
      const median = screen.getByText(sv.marketPage.medianRevenueLabel).parentElement!;
      expect(median).toHaveTextContent(sv.common.fiscalYearMissing);
      expect(median).not.toHaveTextContent(/Mkr/);
      cleanup();

      pathname = DEMO_PATHS.validation;
      await renderInApp(<DemoValidationPage />);
      const revenueCells = [...screen.getByRole("table").querySelectorAll("tbody tr")].map((row) => row.children[3]);
      expect(revenueCells.length).toBeGreaterThan(0);
      for (const cell of revenueCells) {
        expect(cell).not.toHaveTextContent(/tkr|\d/);
        expect(cell).toHaveTextContent(sv.common.fiscalYearMissing);
      }
    });

    it("Pulsen visar inga fasta relativa tider som inte stämmer med källans datum (punkt 11)", async () => {
      startInApp(lastBeat);
      pathname = DEMO_PATHS.pulse;
      const { container } = await renderInApp(<DemoPulsePage />);

      expect(container.querySelectorAll(".fdd-signal").length).toBeGreaterThan(0);
      expect(container.textContent).not.toMatch(/sedan|Uppdaterad \d/);
    });

    it("Pulsen följer momentet: fler signaler senare i resan, rubriken är den senaste (steg 6)", async () => {
      startInApp(0);
      pathname = DEMO_PATHS.pulse;
      const first = await renderInApp(<DemoPulsePage />);
      const atStart = first.container.querySelectorAll(".fdd-signal").length;
      cleanup();

      startInApp(lastBeat);
      const last = await renderInApp(<DemoPulsePage />);
      const signals = last.container.querySelectorAll(".fdd-signal");
      expect(signals.length).toBeGreaterThan(atStart);
      const headline = signals[0].querySelector(".fdd-signal__headline")?.textContent;
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(headline!);
      expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
    });

    it("Pulsens påhittade signaler bär exempelkälla, aldrig en myndighets namn (steg 6, PR 11)", async () => {
      startInApp(lastBeat);
      pathname = DEMO_PATHS.pulse;
      const { container } = await renderInApp(<DemoPulsePage />);
      const signals = [...container.querySelectorAll(".fdd-signal")];
      expect(signals.length).toBeGreaterThan(0);
      for (const signal of signals) {
        expect(signal).toHaveTextContent(sv.common.exampleSourceLabel);
        expect(signal).toHaveTextContent(/Påhittad data, steg 0[136]/);
        expect(signal.querySelector("button")?.textContent).not.toMatch(/Bolagsverket|Skatteverket|branschtidning/);
      }
    });

    it("Pulsen för Jonas visar tomläget, inga påhittade signaler (steg 6)", async () => {
      startInApp(0);
      useDemoStore.setState({ entry: "hasIdea" });
      pathname = DEMO_PATHS.pulse;
      const { container } = await renderInApp(<DemoPulsePage />);
      expect(screen.getByText(sv.pulsePage.emptyState)).toBeInTheDocument();
      expect(container.querySelectorAll(".fdd-signal")).toHaveLength(0);
    });

    it("sidhuvudet visar demots poäng, samma som motorn räknar (PR 4)", async () => {
      startInApp(8);
      await renderInApp(<DemoHomePage />);
      const expected = saraEngine.getScoreSnapshotForBeat(8, "sv");
      const link = screen.getByRole("link", { name: new RegExp(`^Poäng ${expected.total}`) });
      expect(link).toHaveAttribute("href", DEMO_PATHS.score);
    });

    it("sidhuvudet på varje sida säger att datan är påhittad", async () => {
      startInApp(lastBeat);
      await renderInApp(<DemoHomePage />);
      expect(screen.getByText(sv.site.demo.badge)).toBeInTheDocument();
    });
  });
});
