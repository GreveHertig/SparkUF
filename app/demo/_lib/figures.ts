// Regeln för när en påhittad text i demot behöver en exempelkälla (PR 11):
// den innehåller en siffra. Delad av Medgrundaren och Hem.

/** Hänvisningar till steg ("steg 06", "step 10") är inga siffror om världen. */
const STEP_REFERENCE = /\b(steg|steget|step|steps)\s+\d+/gi;

/** Sant när texten innehåller en siffra som behöver källa. */
export function textHasFigure(text: string): boolean {
  return /\d/.test(text.replace(STEP_REFERENCE, ""));
}
