// @vitest-environment node
import { describe, it, expect } from "vitest";
import { liveLegalAdvisor } from "@/adapters/live/LegalAdvisor";
import type { Bolagsform } from "@/core/domain";

/**
 * Riktig, betald anrop till Gemini — inaktivt (skippat) om GEMINI_API_KEY
 * saknas, så CI förblir grönt utan nätverk/nyckel. Kör manuellt med:
 *   GEMINI_API_KEY=... pnpm test adapters/live/LegalAdvisor.live.test.ts
 * Se docs/moduler/juridisk-koll.md.
 */
const BOLAGSFORMER: Bolagsform[] = [
  "enskild_firma",
  "aktiebolag",
  "handelsbolag",
  "ekonomisk_forening",
];

describe.skipIf(!process.env.GEMINI_API_KEY)("liveLegalAdvisor (riktigt Gemini-anrop)", () => {
  it.each(BOLAGSFORMER)("returnerar giltiga krav med källa för %s", async (bolagsform) => {
    const result = await liveLegalAdvisor.getLegalMap(bolagsform);
    expect(Array.isArray(result)).toBe(true);
    for (const krav of result) {
      expect(krav.källa.namn).toBeTruthy();
      expect(krav.källa.hämtad).toBeTruthy();
    }
  }, 30_000);

  it("hittar minst ett tillämpligt krav för aktiebolag", async () => {
    const result = await liveLegalAdvisor.getLegalMap("aktiebolag");
    expect(result.length).toBeGreaterThan(0);
  }, 30_000);
});
