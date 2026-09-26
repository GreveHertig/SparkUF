/**
 * Delat mellan formuläret och Server Action (actions.ts). En "use server"-fil
 * får bara exportera async-funktioner, så konstanten ligger här.
 */

/** Namnet på honeypot-fältet. Människor ser det aldrig, så det ska vara tomt. */
export const HONEYPOT_FIELD = "website";
