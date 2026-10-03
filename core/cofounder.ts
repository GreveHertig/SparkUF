/**
 * Medgrundarens gränser, version 1 (docs/beslut.md 2026-10-03). Delas av
 * liveadaptern, server action och skärmen, så att samma siffra gäller överallt.
 */

/** Högst så många tidigare meddelanden skickas till modellen per anrop. */
export const COFOUNDER_HISTORY_LIMIT = 20;

/** Högst så många meddelanden från grundaren per kalenderdag (Stockholm). */
export const COFOUNDER_DAILY_LIMIT = 40;

/** Längsta meddelande grundaren kan skicka. */
export const COFOUNDER_INPUT_MAX = 2000;

/** Längd i tecken (kodpunkter), som databasens `char_length`. En emoji är ett
 * tecken, inte två. Används för alla Medgrundarens längdgränser. */
export function charLength(text: string): number {
  return Array.from(text).length;
}
