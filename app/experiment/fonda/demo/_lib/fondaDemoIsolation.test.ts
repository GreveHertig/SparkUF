import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { demoEvidenceRepository } from "@/adapters/demo/EvidenceRepository";
import { FONDA_DEMO_KEY, REAL_DEMO_KEY, enterFondaDemo, leaveFondaDemo } from "./fondaDemoIsolation";

// Bevisar att kopian av demot aldrig rör det riktiga demots sparade läge,
// och att den läser samma adaptrar (samma poäng för samma moment).

const realSaved = JSON.stringify({
  state: { beatIndex: 7, entry: "noIdea", onboardingDone: true, tourOn: false, tourStepIndex: 0, collapsed: false },
  version: 0,
});

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem(REAL_DEMO_KEY, realSaved);
  useDemoStore.persist.setOptions({ name: REAL_DEMO_KEY });
  useDemoStore.setState({ beatIndex: 7, entry: "noIdea", onboardingDone: true });
  window.localStorage.setItem(REAL_DEMO_KEY, realSaved);
});

afterEach(() => {
  leaveFondaDemo();
});

describe("fondaDemoIsolation", () => {
  it("börjar från början i kopian och lämnar det riktiga läget orört", () => {
    enterFondaDemo();
    expect(useDemoStore.getState().beatIndex).toBe(0);
    expect(useDemoStore.getState().onboardingDone).toBe(false);

    useDemoStore.getState().completeOnboarding();
    useDemoStore.getState().goTo(12);
    useDemoStore.getState().setEntry("hasIdea");
    useDemoStore.getState().reset();
    useDemoStore.getState().goTo(16);

    expect(window.localStorage.getItem(REAL_DEMO_KEY)).toBe(realSaved);
    expect(JSON.parse(window.localStorage.getItem(FONDA_DEMO_KEY) ?? "{}").state.beatIndex).toBe(16);
  });

  it("återställer det riktiga läget i minnet när man lämnar kopian", async () => {
    enterFondaDemo();
    useDemoStore.getState().goTo(16);
    leaveFondaDemo();
    await Promise.resolve();
    expect(useDemoStore.getState().beatIndex).toBe(7);
    expect(window.localStorage.getItem(REAL_DEMO_KEY)).toBe(realSaved);
  });

  it("kommer ihåg kopians eget moment mellan besök", async () => {
    enterFondaDemo();
    useDemoStore.getState().goTo(16);
    leaveFondaDemo();
    await Promise.resolve();
    enterFondaDemo();
    await Promise.resolve();
    expect(useDemoStore.getState().beatIndex).toBe(16);
  });

  it("ger samma poäng ur samma adapter som det riktiga demot för samma moment", async () => {
    useDemoStore.setState({ beatIndex: 16 });
    const real = await demoEvidenceRepository.getScoreSnapshot("sv");
    useDemoStore.setState({ beatIndex: 7 });
    window.localStorage.setItem(REAL_DEMO_KEY, realSaved);

    enterFondaDemo();
    useDemoStore.getState().goTo(16);
    const copy = await demoEvidenceRepository.getScoreSnapshot("sv");
    expect(copy).toEqual(real);
    expect(window.localStorage.getItem(REAL_DEMO_KEY)).toBe(realSaved);
  });
});
