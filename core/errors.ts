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

/**
 * Kastas av lib/server/session.ts:s `requireSupabaseUser()` när en
 * liveadapter anropas utan en giltig session. Ärver INTE NotImplementedError
 * — en adapter ska inte styra navigering (det gör requireUser() i
 * app/(app)/layout.tsx redan innan adaptern nås i normalfallet), bara vägra
 * hämta data. Session P1, docs/arkitektur.md.
 */
export class NotAuthenticatedError extends Error {
  constructor() {
    super("Ingen inloggad användare.");
    this.name = "NotAuthenticatedError";
  }
}

/**
 * Kastas av en KLAR liveadapter (Session P1) när den inloggade användaren
 * inte har någon data än — t.ex. en nyregistrerad användare utan bevis, som
 * calculateScore (core/score.ts, 7.4) med flit vägrar räkna poäng på. Skiljer
 * sig från NotImplementedError (modulen är inte byggd) genom att modulen ÄR
 * byggd, bara den här användarens data saknas — samma "Kommer snart"-yta
 * (uppdrag 14.4: "Tomma tillstånd") visas ändå, se `isPlaceholderError`.
 */
export class EmptyStateError extends Error {
  constructor(modul: string, dokPath: string) {
    super(`${modul}: ingen data än för den här användaren. Se ${dokPath}.`);
    this.name = "EmptyStateError";
  }
}

/**
 * Kastas av Registret-liveadaptern när licensgrinden är stängd
 * (lib/server/registryAccess.ts, docs/moduler/registret.md "Licensgrind").
 * Ärver INTE NotImplementedError — då skulle kontraktstestet tyst skippa
 * liveadaptern som "fortfarande en stub" och grinden gömma sig bakom det.
 * Ingår i `isPlaceholderError` med flit: en framtida route som glömmer
 * grinden ska visa ett formgivet "Kommer snart", aldrig krascha eller läcka.
 * Meddelandet är avsiktligt neutralt (avslöjar inte vem som är tillåten).
 */
export class RegistryLockedError extends Error {
  constructor() {
    super("Registret är inte öppet för den här användaren än. Se docs/moduler/registret.md.");
    this.name = "RegistryLockedError";
  }
}

/**
 * Kastas av transportklienterna (lib/server/scb.ts, bolagsverket.ts) när
 * bas-URL eller inloggningsuppgifter saknas. Ett RIKTIGT fel, aldrig en
 * platshållare: en omkonfigurerad transport ska aldrig se ut som en tom lista.
 */
export class RegistryTransportError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "RegistryTransportError";
  }
}

/**
 * Route-filer fångar "det finns inget att visa än"-felen i samma
 * catch och visar `<ComingSoon />` för båda (uppdrag 14.4) — den ena för att
 * modulen inte är byggd, den andra för att kontot är nytt. Ett fel som INTE
 * matchar det här (t.ex. ett nätverksfel mot Supabase) ska kastas vidare,
 * aldrig tystas till "Kommer snart".
 */
export function isPlaceholderError(error: unknown): boolean {
  return (
    error instanceof NotImplementedError ||
    error instanceof EmptyStateError ||
    error instanceof RegistryLockedError
  );
}
