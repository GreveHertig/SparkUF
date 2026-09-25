import { expect, vi } from "vitest";
import type { PulseProvider } from "./PulseProvider";
import { demoPulseProvider } from "@/adapters/demo/PulseProvider";
import { livePulseProvider } from "@/adapters/live/PulseProvider";
import { describeContract, contractIt } from "./testContract";

// Liveadaptern körs mot en fejkad Supabase och ett mockat Tavily: CI behöver
// varken nätverk eller nycklar. En och samma fejkade databas delas av båda
// contractIt-anropen, precis som dagscachen delas mellan sidvisningar.
vi.mock("@/lib/server/session", async () => {
  const { makePulseSupabaseFake } = await import("@/test/stubs/pulseSupabaseFake");
  const userId = "contract-test-user";
  const supabase = makePulseSupabaseFake(
    { projects: [{ id: "p1", user_id: userId, name: "Kvittojakten", one_liner: "Kvittohantering för redovisningsbyråer", is_active: true }] },
    { today: "2026-09-25" },
  );
  return { requireSupabaseUser: async () => ({ supabase, userId }) };
});
vi.mock("@/lib/server/tavily", () => ({
  search: async () =>
    [1, 2, 3, 4].map((n) => ({
      title: `Redovisningsbyråer i nyheterna ${n}`,
      url: `https://www.nyheter.se/artikel-${n}`,
      content: "Svensk redovisning och kvittohantering.",
      publishedDate: `2026-09-2${n}T08:00:00Z`,
    })),
}));

describeContract<PulseProvider>(
  "PulseProvider",
  { demo: demoPulseProvider, live: livePulseProvider },
  (pulse) => {
    contractIt("getTodaysSignal har alltid en källa (Datalöftet)", async () => {
      const signal = await pulse.getTodaysSignal("sv");
      expect(signal.headline).toBeTruthy();
      expect(signal.whyItMatters).toBeTruthy();
      expect(signal.source.namn).toBeTruthy();
      expect(signal.source.hämtad).toBeTruthy();
    });

    contractIt("getSignals ger 3–5 signaler, alla med källa (avsnitt 9.5)", async () => {
      const signals = await pulse.getSignals("sv");
      expect(signals.length).toBeGreaterThanOrEqual(3);
      expect(signals.length).toBeLessThanOrEqual(5);
      for (const signal of signals) {
        expect(signal.source.namn).toBeTruthy();
        expect(signal.source.hämtad).toBeTruthy();
      }
    });
  },
);
