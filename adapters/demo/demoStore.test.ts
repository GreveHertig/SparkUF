import { beforeEach, describe, expect, it, vi } from "vitest";

// Demots läge i localStorage (PR 11): nyckeln "spark:demo", flytten från
// "spark:fonda-demo-state", och att ett gammalt eller trasigt läge aldrig
// kraschar demot. Varje test laddar modulen på nytt, eftersom inläsningen
// bara görs en gång per sidladdning.

async function freshStore() {
  vi.resetModules();
  return import("./demoStore");
}

function saved(state: Record<string, unknown>) {
  return JSON.stringify({ state, version: 0 });
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("demoStore i localStorage", () => {
  it("sparar under spark:demo", async () => {
    const { useDemoStore, hydrateDemoStore, DEMO_STATE_KEY } = await freshStore();
    hydrateDemoStore();
    useDemoStore.getState().goTo(5);
    expect(DEMO_STATE_KEY).toBe("spark:demo");
    expect(JSON.parse(window.localStorage.getItem("spark:demo") ?? "{}").state.beatIndex).toBe(5);
  });

  it("läser inget förrän layouten ber om det", async () => {
    window.localStorage.setItem("spark:demo", saved({ beatIndex: 9, onboardingDone: true }));
    const { useDemoStore, hydrateDemoStore } = await freshStore();
    expect(useDemoStore.getState().beatIndex).toBe(0);
    hydrateDemoStore();
    expect(useDemoStore.getState().beatIndex).toBe(9);
    expect(useDemoStore.persist.hasHydrated()).toBe(true);
  });

  it("flyttar läget från spark:fonda-demo-state en gång och tar bort den gamla nyckeln", async () => {
    window.localStorage.setItem("spark:fonda-demo-state", saved({ beatIndex: 12, entry: "noIdea", onboardingDone: true }));
    const { useDemoStore, hydrateDemoStore } = await freshStore();
    hydrateDemoStore();
    expect(useDemoStore.getState().beatIndex).toBe(12);
    expect(useDemoStore.getState().onboardingDone).toBe(true);
    expect(window.localStorage.getItem("spark:fonda-demo-state")).toBeNull();
    expect(window.localStorage.getItem("spark:demo")).not.toBeNull();
  });

  it("skriver inte över ett nyare läge med det gamla", async () => {
    window.localStorage.setItem("spark:demo", saved({ beatIndex: 3 }));
    window.localStorage.setItem("spark:fonda-demo-state", saved({ beatIndex: 20 }));
    const { useDemoStore, hydrateDemoStore } = await freshStore();
    hydrateDemoStore();
    expect(useDemoStore.getState().beatIndex).toBe(3);
    expect(window.localStorage.getItem("spark:fonda-demo-state")).toBeNull();
  });

  it("läser aldrig det gamla demots spark:demo-state", async () => {
    const old = saved({ beatIndex: 30, onboardingDone: true });
    window.localStorage.setItem("spark:demo-state", old);
    const { useDemoStore, hydrateDemoStore } = await freshStore();
    hydrateDemoStore();
    useDemoStore.getState().goTo(2);
    expect(useDemoStore.getState().onboardingDone).toBe(false);
    expect(window.localStorage.getItem("spark:demo-state")).toBe(old);
  });

  it.each([
    ["trasig JSON", "{inte json"],
    ["fel form", JSON.stringify([1, 2, 3])],
    ["state är null", JSON.stringify({ state: null, version: 0 })],
    ["fel typer", saved({ beatIndex: "sju", entry: "okänd", onboardingDone: "ja", tourOn: 1, tourStepIndex: -4 })],
  ])("%s ger utgångsläget i stället för ett fel", async (_label, raw) => {
    window.localStorage.setItem("spark:demo", raw);
    const { useDemoStore, hydrateDemoStore } = await freshStore();
    expect(() => hydrateDemoStore()).not.toThrow();
    const state = useDemoStore.getState();
    expect(useDemoStore.persist.hasHydrated()).toBe(true);
    expect(state).toMatchObject({ beatIndex: 0, entry: "noIdea", onboardingDone: false, tourOn: false, tourStepIndex: 0 });
    expect(typeof state.next).toBe("function");
  });

  it("begränsar värden utanför demot och slår av en rundtur utan giltigt stopp", async () => {
    window.localStorage.setItem("spark:demo", saved({ beatIndex: 999, entry: "noIdea", tourOn: true, tourStepIndex: 999 }));
    const { useDemoStore, hydrateDemoStore, DEMO_BEAT_COUNT } = await freshStore();
    hydrateDemoStore();
    expect(useDemoStore.getState().beatIndex).toBe(DEMO_BEAT_COUNT - 1);
    expect(useDemoStore.getState().tourOn).toBe(false);
  });

  it("slår av rundturen i Jonas scenario, som toggleTour", async () => {
    window.localStorage.setItem("spark:demo", saved({ entry: "hasIdea", tourOn: true, tourStepIndex: 2 }));
    const { useDemoStore, hydrateDemoStore } = await freshStore();
    hydrateDemoStore();
    expect(useDemoStore.getState().entry).toBe("hasIdea");
    expect(useDemoStore.getState().tourOn).toBe(false);
  });
});
