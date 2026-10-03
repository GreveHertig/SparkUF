import type { Locale } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { en } from "@/i18n/en";
import { fill } from "@/i18n/fill";
import type { ProfileSummary } from "@/ports/MemoryRepository";
import type { Project } from "@/ports/ProjectRepository";
import type { JourneyStepView } from "@/ports/JourneyRepository";
import type { PulsePersonal, PulsePersonalFact } from "@/screens/Pulse";
import { displaySourceName, stockholmToday } from "@/adapters/live/evidenceScore";
import { textHasFigure } from "@/core/figures";
import { cleanText } from "@/core/text";

const dictionaries = { sv, en };

/** En rad i spelboken är en rad, aldrig ett stycke. */
const FACT_MAX = 240;

/** Steget "Det formella" (docs/uppdrag.md): enskild firma eller aktiebolag,
 * Bolagsverket, F-skatt. Säger om företaget är registrerat i Resan. */
const FORMAL_STEP = 9;

export type PulsePersonalInput = {
  profile: Partial<ProfileSummary> | null;
  project: Project | null;
  steps: JourneyStepView[] | null;
};

/**
 * Det grundaren redan har berättat, överst i spelboken på /app/pulsen
 * (docs/moduler/webbresearch-och-pulsen.md, "Personlig spelbok"). Ingen modell:
 * bara grundarens egen text ur Profilen och projektet, och läget i Resan.
 * Spelbokens frågor står kvar, så att grundaren själv jämför. En rad med en
 * siffra får källan "Din uppgift" (CLAUDE.md, "Källa på varje siffra"), som
 * "Sedan tidigare" hos Medgrundaren.
 *
 * Risker får idé, tid, pengar och vad grundaren kan tänka sig att riskera.
 * Möjligheter får idé, tid, pengar och om steget "Det formella" är klart,
 * eftersom många stöd och upphandlingar kräver ett registrerat företag.
 * Finns ingenting att visa blir svaret `null` och spelboken ser ut som förut.
 */
export function toPulsePersonal(input: PulsePersonalInput, locale: Locale, now: Date = new Date()): PulsePersonal | null {
  const copy = dictionaries[locale].pulsePage.playbook;
  const sourceName = displaySourceName("spark:profile", locale);
  const today = stockholmToday(now);

  function fact(id: string, label: string, value: string | null | undefined): PulsePersonalFact | null {
    const text = value ? cleanText(value, FACT_MAX) : "";
    if (!text) return null;
    return {
      id,
      text: `${label}: ${text}`,
      source: textHasFigure(text) ? { source: { namn: sourceName, hämtad: today }, dataType: "user" } : undefined,
    };
  }

  const profile = input.profile ?? {};
  const idea = input.project ? fact("idea", copy.personal.idea, `${input.project.name}. ${input.project.oneLiner}`) : null;
  const time = fact("time", copy.personal.time, profile.time);
  const money = fact("money", copy.personal.money, profile.money);
  const risk = fact("risk", copy.personal.risk, profile.risk);

  const formalStep = input.steps?.find((step) => step.stepNumber === FORMAL_STEP);
  const formal: PulsePersonalFact | null = formalStep
    ? {
        id: "formal",
        text: fill(formalStep.status === "done" ? copy.formalDone : copy.formalOpen, { step: formalStep.title }),
      }
    : null;

  const keep = (facts: (PulsePersonalFact | null)[]) => facts.filter((item): item is PulsePersonalFact => item !== null);
  const personal = { risk: keep([idea, time, money, risk]), opportunity: keep([idea, formal, time, money]) };
  return personal.risk.length === 0 && personal.opportunity.length === 0 ? null : personal;
}
