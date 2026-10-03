// Regeln för när en text behöver en källa: den innehåller en siffra. Delad av
// demots Medgrundare och Hem (exempelkälla, PR 11) och av "Sedan tidigare" på
// /app/medgrundaren (grundarens egen uppgift). Flyttad hit ur app/demo/_lib.

/** Hänvisningar till steg ("steg 06", "step 10") är inga siffror om världen. */
const STEP_REFERENCE = /\b(steg|steget|step|steps)\s+\d+/gi;

/** Sant när texten innehåller en siffra som behöver källa. */
export function textHasFigure(text: string): boolean {
  return /\d/.test(text.replace(STEP_REFERENCE, ""));
}
