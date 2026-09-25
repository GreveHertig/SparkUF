import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { saraEngine } from "@/adapters/demo/sara";
import FondaDemoLayout from "./layout";
import FondaDemoHomePage from "./page";
import FondaDemoScorePage from "./poang/page";
import { FONDA_DEMO_KEY, REAL_DEMO_KEY, leaveFondaDemo } from "./_lib/fondaDemoIsolation";

vi.mock("next/navigation", () => ({ usePathname: () => "/experiment/fonda/demo" }));

const realSaved = JSON.stringify({
  state: { beatIndex: 7, entry: "noIdea", onboardingDone: true, tourOn: false, tourStepIndex: 0, collapsed: false },
  version: 0,
});

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem(REAL_DEMO_KEY, realSaved);
  useDemoStore.persist.setOptions({ name: REAL_DEMO_KEY });
  useDemoStore.setState({ beatIndex: 7, entry: "noIdea", onboardingDone: true });
});

afterEach(async () => {
  cleanup();
  leaveFondaDemo();
  await act(async () => {});
});

async function renderInDemo(page: React.ReactNode) {
  const result = render(
    <LocaleProvider>
      <FondaDemoLayout>{page}</FondaDemoLayout>
    </LocaleProvider>,
  );
  await act(async () => {});
  return result;
}

describe("/experiment/fonda/demo", () => {
  it("Hem visar första steget, och knappen spelar upp nästa moment i kopians eget läge", async () => {
    await renderInDemo(<FondaDemoHomePage />);
    const first = saraEngine.getJourneySummaryForBeat(0, "sv").nextStep;
    expect(screen.getByRole("heading", { level: 2, name: first.title })).toBeInTheDocument();
    expect(screen.getByText(sv.experimentFonda.demo.badge)).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: first.actionLabel }));
    });
    expect(useDemoStore.getState().beatIndex).toBe(1);
    expect(JSON.parse(window.localStorage.getItem(FONDA_DEMO_KEY) ?? "{}").state.beatIndex).toBe(1);
    expect(window.localStorage.getItem(REAL_DEMO_KEY)).toBe(realSaved);
  });

  it("Poäng visar samma poäng som demots motor för momentet", async () => {
    await renderInDemo(<FondaDemoScorePage />);
    await act(async () => {
      useDemoStore.getState().goTo(19);
    });
    const expected = saraEngine.getScoreSnapshotForBeat(19, "sv");
    expect(screen.getAllByText(String(expected.total)).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: sv.scorePage.suggestionsTitle })).toBeInTheDocument();
    expect(window.localStorage.getItem(REAL_DEMO_KEY)).toBe(realSaved);
  });
});
