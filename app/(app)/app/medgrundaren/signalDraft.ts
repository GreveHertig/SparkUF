import type { Locale } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { en } from "@/i18n/en";
import { fill } from "@/i18n/fill";
import { formatDate } from "@/i18n/format";
import type { PulseSignal } from "@/core/domain";
import type { Project } from "@/ports/ProjectRepository";
import { cleanText } from "@/core/text";

const dictionaries = { sv, en };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Rubriken och källans namn kapas, så att frågan alltid får plats i fältet. */
const HEADLINE_MAX = 200;
const SOURCE_MAX = 80;

/** Sant när värdet ur adressen kan vara en signals id. Allt annat ignoreras. */
export function isSignalId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/**
 * Frågan som förifylls i Medgrundarens fält när grundaren kommer från en
 * signal i Pulsen ("Gå igenom det här med Medgrundaren"). Bara signalens
 * rubrik, källa och datum, ur grundarens egna signaler på servern, aldrig text
 * ur adressen. Rubriken är extern text: data, aldrig instruktion, och
 * Medgrundaren behandlar hela meddelandet som data.
 */
export function toSignalDraft(signal: PulseSignal, project: Project | null, locale: Locale): string {
  const copy = dictionaries[locale].cofounderPage.live;
  const values = {
    headline: cleanText(signal.headline, HEADLINE_MAX),
    source: cleanText(signal.source.namn, SOURCE_MAX),
    date: /^\d{4}-\d{2}-\d{2}/.test(signal.source.hämtad)
      ? formatDate(signal.source.hämtad.slice(0, 10), locale)
      : cleanText(signal.source.hämtad, SOURCE_MAX),
    project: project ? cleanText(project.name, SOURCE_MAX) : "",
  };
  return fill(project && values.project ? copy.signalDraft : copy.signalDraftNoProject, values);
}
