import type { Dictionary } from "@/i18n/dictionary";
import type { Locale } from "@/i18n/context";
import type { DraftInput, OutreachDraft } from "@/ports/OutreachPrep";
import { cleanText } from "@/core/text";

/**
 * Bygger ett UTKAST ur i18n-mallen (ren logik, inga nätverksanrop, delas av
 * demo och live). Utkastet skickas aldrig av något i den här modulen: det är
 * text som grundaren läser, redigerar och bekräftar manuellt
 * (docs/moduler/utskick-och-svar.md, "Bekräftelse").
 *
 * Mallbaserat i stället för modellskrivet: de obligatoriska delarna
 * (avsändare, var adressen hittades, personuppgifter, avregistrering) får inte
 * kunna parafraseras bort. Alla variabler rensas med cleanText: företagsnamnet
 * kommer från en extern källa och är data, aldrig instruktion.
 */

const PLACEHOLDER = /\{[a-zA-Z]+\}/;

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{([a-zA-Z]+)\}/g, (whole, key: string) => vars[key] ?? whole);
}

export function buildOutreachDraft(input: DraftInput, dict: Dictionary, locale: Locale): OutreachDraft {
  const t = dict.outreachDraft;
  const vars: Record<string, string> = {
    companyName: cleanText(input.companyName, 100),
    problem: cleanText(input.problem, 200),
    senderName: cleanText(input.senderName, 100),
    senderCompany: cleanText(input.senderCompany, 100),
    sourceUrl: input.addressSourceUrl ? cleanText(input.addressSourceUrl, 300) : "",
    price:
      input.priceHypothesisKr !== undefined
        ? new Intl.NumberFormat(locale === "sv" ? "sv-SE" : "en-GB").format(input.priceHypothesisKr)
        : "",
  };
  // Ett platshållarnamn i indata ("{price}") får inte ge en andra fyllning: fyll bara en gång.
  const paragraphs = [
    t.greeting,
    t.intro,
    t.ask,
    input.priceHypothesisKr !== undefined ? t.priceLine : null,
    input.addressSourceUrl ? t.sourceLine : null,
    t.gdprNotice,
    t.optOut,
    t.signature,
  ].filter((p): p is string => p !== null);

  const body = paragraphs.map((p) => fill(p, vars)).join("\n\n");
  const subject = fill(t.subject, vars);
  return { status: "draft", subject, body, locale };
}

/** Sant om ett färdigt utkast fortfarande har en ofylld {platshållare}. */
export function hasUnfilledPlaceholder(draft: OutreachDraft): boolean {
  return PLACEHOLDER.test(draft.subject) || PLACEHOLDER.test(draft.body);
}
