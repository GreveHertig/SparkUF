/**
 * Kastas av en liveadapter som inte är byggd än (avsnitt 14.1). Anropande kod
 * (en route eller layout) fångar den och visar ett formgivet "Kommer snart"
 * i stället för att låta felet nå gränssnittet.
 */
export class NotImplementedError extends Error {
  constructor(modul: string, dokPath: string) {
    super(`${modul} är inte byggd än. Se ${dokPath}.`);
    this.name = "NotImplementedError";
  }
}

/**
 * Kastas av liveLegalAdvisor (adapters/live/LegalAdvisor.ts) vid ogiltig
 * indata eller när Gemini-svaret inte går att lita på (kraschar inte tyst
 * till [] eller till påhittad data). Ärver INTE NotImplementedError — en
 * riktig driftstörning ska synas som ett fel, inte visas som "Kommer snart"
 * (docs/arkitektur.md, avsnitt 4).
 */
export class LegalAdvisorError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "LegalAdvisorError";
  }
}
