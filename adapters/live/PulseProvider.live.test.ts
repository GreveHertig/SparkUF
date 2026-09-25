import { describe, expect, it, vi } from "vitest";

/**
 * Opt-in mot riktiga Tavily. Körs inte i CI (skippas utan TAVILY_API_KEY).
 * Supabase är fejkad, så inget sparas någonstans. Bara sökningen och
 * filtreringen prövas på riktigt. Kör manuellt:
 *   TAVILY_API_KEY=... pnpm test adapters/live/PulseProvider.live.test.ts
 */
vi.mock("@/lib/server/session", async () => {
  const { makePulseSupabaseFake } = await import("@/test/stubs/pulseSupabaseFake");
  const userId = "live-test-user";
  const supabase = makePulseSupabaseFake(
    { projects: [{ id: "p1", user_id: userId, name: "Kvittojakten", one_liner: "Kvittohantering för redovisningsbyråer", is_active: true }] },
    { today: "2026-09-25" },
  );
  return { requireSupabaseUser: async () => ({ supabase, userId }) };
});

describe.skipIf(!process.env.TAVILY_API_KEY)("PulseProvider mot riktiga Tavily (opt-in)", () => {
  it("varje signal har https-källa och hämtdatum", async () => {
    const { livePulseProvider } = await import("./PulseProvider");
    const signals = await livePulseProvider.getSignals("sv");
    expect(signals.length).toBeLessThanOrEqual(5);
    for (const signal of signals) {
      expect(signal.headline).toBeTruthy();
      expect(signal.source.namn).toBeTruthy();
      expect(signal.source.hämtad).toBe("2026-09-25");
      expect(signal.source.url).toMatch(/^https:\/\//);
    }
  }, 20_000);
});
