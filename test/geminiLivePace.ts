// Paus mellan live-anropen mot riktiga Gemini (opt-in-testerna, *.live.test.ts).
// Gratisnivån tål 5 anrop i minuten. Tiden för det senaste anropet sparas i en
// fil i tmp, så att pausen gäller över testfilerna. Kör filerna i sekvens:
// `pnpm test:live:gemini` (vitest --no-file-parallelism). Testkod, importeras
// aldrig av app-kod.
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const STAMP = path.join(tmpdir(), "spark-gemini-live-senaste-anrop");
/** 60 s / 5 anrop = 12 s, plus marginal. */
export const GEMINI_LIVE_PAUS_MS = 13_000;
/** Pausen plus marginal, för beforeEach-krokens timeout. */
export const GEMINI_LIVE_HOOK_TIMEOUT_MS = GEMINI_LIVE_PAUS_MS + 5_000;
/** Ett anrop med upp till två omförsök (lib/server/gemini.ts) och 20 s timeout per försök. */
export const GEMINI_LIVE_TEST_TIMEOUT_MS = 90_000;

/** Väntar tills minst GEMINI_LIVE_PAUS_MS gått sedan förra live-anropet, och noterar det här. */
export async function paceGeminiLive(): Promise<void> {
  let last = 0;
  try {
    last = Number(readFileSync(STAMP, "utf8")) || 0;
  } catch {
    last = 0;
  }
  const wait = last + GEMINI_LIVE_PAUS_MS - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  writeFileSync(STAMP, String(Date.now()));
}
