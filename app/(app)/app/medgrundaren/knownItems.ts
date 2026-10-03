import type { Locale } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { en } from "@/i18n/en";
import type { CofounderContext } from "@/adapters/live/cofounderContext";
import { displaySourceName } from "@/adapters/live/evidenceScore";
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
 *
 * Källans datum är dagen uppgiften gavs, aldrig dagens datum (beslut Erik
 * 2026-10-03, samma regel som i #70): ett v4-svar har `answeredOn`, en post i
 * Spåret sin tid. Fritextsvar från före v4 och Hjärnan har ingen tid, och
 * visas då med källan utan datum (`SourceTag` med tomt `hämtad`).
 */
export function toKnownItems(context: CofounderContext, locale: Locale): CofounderContextItem[] {
  const copy = dictionaries[locale].cofounderPage.known;
  const items: CofounderContextItem[] = [];

  // null (ett obesvarat profilfält, docs/moduler/minnet.md) räknas som saknat.
  function add(id: string, label: string, value: string | null | undefined, sourceName: string, date: string) {
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
  const profile = context.profile ?? {};
  // getKnownProfile fyller roll, tid och pengar ur v4-svaret när fritextsvaret
  // saknas. Är värdet v4-svaret gäller svarets dag, annars finns ingen tid.
  const answeredOn = (questionId: string, value: string | null | undefined): string => {
    const answer = profile.answers?.find((item) => item.questionId === questionId);
    return answer && value && answer.answer.trim() === value.trim() ? (answer.answeredOn ?? "") : "";
  };
  if (context.project) {
    // Projektet bär ingen tid här, så ingen dag visas.
    add("idea", copy.idea, `${context.project.name}. ${context.project.oneLiner}`, profileSource, "");
  }
  add("role", copy.role, profile.role, profileSource, answeredOn("situation", profile.role));
  add("background", copy.background, profile.bio, profileSource, "");
  add("time", copy.time, profile.time, profileSource, answeredOn("time", profile.time));
  add("money", copy.money, profile.money, profileSource, answeredOn("money", profile.money));
  add("risk", copy.risk, profile.risk, profileSource, "");
  add("brain", copy.brain, context.brainNotes, copy.brain, "");
  // De tre senaste posterna i Spåret, senast först.
  for (const event of [...(context.trace ?? [])].reverse().slice(0, 3)) {
    add(`trace-${event.id}`, copy.trace, event.description, copy.trace, event.timestampIso.slice(0, 10));
  }
  return items;
}
