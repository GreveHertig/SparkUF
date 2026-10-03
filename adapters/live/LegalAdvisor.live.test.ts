// @vitest-environment node
import { beforeEach, describe, it, expect } from "vitest";
import { liveLegalAdvisor } from "@/adapters/live/LegalAdvisor";
import type { Bolagsform } from "@/core/domain";
import {
  GEMINI_LIVE_HOOK_TIMEOUT_MS,
  GEMINI_LIVE_TEST_TIMEOUT_MS,
  paceGeminiLive,
} from "@/test/geminiLivePace";

/**
 * Riktig, betald anrop till Gemini — inaktivt (skippat) om GEMINI_API_KEY
 * saknas, så CI förblir grönt utan nätverk/nyckel. Kör manuellt, i sekvens och
 * med paus mellan anropen (gratisnivån tål 5 i minuten):
 *   set -a && . ./.env.local && set +a && pnpm test:live:gemini
 * Se docs/moduler/juridisk-koll.md.
 */
const BOLAGSFORMER: Bolagsform[] = [
  "enskild_firma",
  "aktiebolag",
  "handelsbolag",
  "ekonomisk_forening",
];

describe.skipIf(!process.env.GEMINI_API_KEY)("liveLegalAdvisor (riktigt Gemini-anrop)", () => {
  beforeEach(paceGeminiLive, GEMINI_LIVE_HOOK_TIMEOUT_MS);

  it.each(BOLAGSFORMER)("returnerar giltiga krav med källa för %s", async (bolagsform) => {
    const result = await liveLegalAdvisor.getLegalMap(bolagsform);
    expect(Array.isArray(result)).toBe(true);
    for (const krav of result) {
      expect(krav.källa.namn).toBeTruthy();
      expect(krav.källa.hämtad).toBeTruthy();
    }
  }, GEMINI_LIVE_TEST_TIMEOUT_MS);

  it("hittar minst ett tillämpligt krav för aktiebolag", async () => {
    const result = await liveLegalAdvisor.getLegalMap("aktiebolag");
    expect(result.length).toBeGreaterThan(0);
  }, GEMINI_LIVE_TEST_TIMEOUT_MS);
});
