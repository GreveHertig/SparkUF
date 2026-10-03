import type { Locale } from "@/i18n/context";
import type { VerdictProvider } from "@/ports/VerdictProvider";
import type { VerdictInput } from "@/core/verdict";
import { buildVerdictReport } from "@/core/verdictReport";
import { toVerdictInput } from "@/core/validationLog";
import { sv } from "@/i18n/sv";
import { en } from "@/i18n/en";
import { liveValidationLog } from "@/adapters/live/ValidationLog";
import { stockholmToday } from "@/adapters/live/evidenceScore";

const dictionaries = { sv, en };

/**
 * Domen i /app (docs/moduler/domen.md, beslut i docs/beslut.md 2026-10-04).
 * Läser svaren grundaren loggat i Valideringen (adapters/live/ValidationLog.ts)
 * och kör samma rena logik som demot (core/verdict.ts, core/verdictReport.ts).
 * Ingen modell, ingen poäng: domen går att räkna för hand ur svaren.
 *
 * Antalet anställda är storleksklassen grundaren angav (klassens nedre
 * gräns), inte registrets siffra, så länge Registret är grindat. Svar äldre
 * än 180 dagar räknas inte (beslut B9). Utan ett enda svar finns ingen dom:
 * `null`, som porten säger.
 *
 * Kastar samma fel som samtalsloggen: `NotImplementedError` när tabellen
 * saknas och `EmptyStateError` utan aktivt projekt, så att sidan visar sina
 * platshållare.
 */
async function readInput(): Promise<VerdictInput | null> {
  const contacts = await liveValidationLog.getContacts();
  const input = toVerdictInput(contacts, stockholmToday());
  return input.responses.length === 0 ? null : input;
}

export const liveVerdictProvider: VerdictProvider = {
  async getVerdictInput() {
    return readInput();
  },
  async getVerdictReport(locale: Locale) {
    const input = await readInput();
    return input ? buildVerdictReport(input, dictionaries[locale]) : null;
  },
};
