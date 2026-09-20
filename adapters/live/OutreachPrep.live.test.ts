import { describe, expect, it } from "vitest";

/**
 * Opt-in mot riktiga Tavily. Körs inte i CI. Skickar ALDRIG något.
 * Adaptern kräver en inloggad, allowlistad Supabase-användare, så det här
 * testet prövar bara sökklienten (lib/server/tavily.ts) mot det riktiga
 * API:et; adaptern täcks av mockade tester. Kör manuellt:
 *   TAVILY_API_KEY=... GEMINI_API_KEY=... pnpm test adapters/live/OutreachPrep.live.test.ts
 */
describe.skipIf(!process.env.TAVILY_API_KEY || !process.env.GEMINI_API_KEY)(
  "OutreachPrep mot riktiga tjänster (opt-in)",
  () => {
    it("Tavily hittar en sida för ett känt bolag", async () => {
      const { search } = await import("@/lib/server/tavily");
      const results = await search({ query: "Bolagsverket kontakta oss", maxResults: 3 });
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].url).toMatch(/^https?:\/\//);
    });
  },
);
