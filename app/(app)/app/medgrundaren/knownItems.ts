import type { Locale } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { en } from "@/i18n/en";
import type { CofounderContext } from "@/adapters/live/cofounderContext";
import { displaySourceName, stockholmToday } from "@/adapters/live/evidenceScore";
import type { CofounderContextItem } from "@/screens/Cofounder";
import { textHasFigure } from "@/core/figures";
import { cleanText } from "@/core/text";

const dictionaries = { sv, en };

/** En rad i "Sedan tidigare" är en rad, aldrig ett stycke. */
const ITEM_MAX = 240;

/**
 * "Sedan tidigare" på /app/medgrundaren: det Medgrundaren redan vet om
 * grundaren, ur samma läsning som prompten (adapters/live/cofounderContext.ts).
 * Allt är grundarens egen text. En rad med en siffra får en källa (CLAUDE.md,
 * "Källa på varje siffra"): grundarens egen uppgift ("Din uppgift"), med
 * profilsamtalet, Hjärnan eller Spåret som källa.
 */
export function toKnownItems(context: CofounderContext, locale: Locale, now: Date = new Date()): CofounderContextItem[] {
  const copy = dictionaries[locale].cofounderPage.known;
  const today = stockholmToday(now);
  const items: CofounderContextItem[] = [];

  function add(id: string, label: string, value: string | undefined, sourceName: string, date = today) {
    const text = value ? cleanText(value, ITEM_MAX) : "";
    if (!text) return;
    const line = `${label}: ${text}`;
    items.push({
      id,
      text: line,
      source: textHasFigure(text) ? { source: { namn: sourceName, hämtad: date }, dataType: "user" } : undefined,
    });
  }

  const profileSource = displaySourceName("spark:profile", locale);
  if (context.project) {
    add("idea", copy.idea, `${context.project.name}. ${context.project.oneLiner}`, profileSource);
  }
  const profile = context.profile ?? {};
  add("role", copy.role, profile.role, profileSource);
  add("background", copy.background, profile.bio, profileSource);
  add("time", copy.time, profile.time, profileSource);
  add("money", copy.money, profile.money, profileSource);
  add("risk", copy.risk, profile.risk, profileSource);
  add("brain", copy.brain, context.brainNotes ?? undefined, copy.brain);
  // De tre senaste posterna i Spåret, senast först.
  for (const event of [...(context.trace ?? [])].reverse().slice(0, 3)) {
    add(`trace-${event.id}`, copy.trace, event.description, copy.trace, event.timestampIso.slice(0, 10));
  }
  return items;
}
