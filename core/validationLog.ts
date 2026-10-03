import type { Källa } from "@/core/domain";
import type { EvidenceKind } from "@/core/evidenceKinds";
import { isStale } from "@/core/evidenceInput";
import { GROUP_THRESHOLDS } from "@/core/journeyRequirements";
import { SIZE_CLASSES } from "@/core/sizeClass";
import { cleanText } from "@/core/text";
import { MIN_RESPONSES, type VerdictInput, type VerdictResponse } from "@/core/verdict";
import type { ConversationAnswer, ValidationContact } from "@/ports/ValidationLog";

/**
 * Valideringens samtalslogg (docs/moduler/validering.md): ren logik som delas
 * av demot och appen. Grundaren pratar själv med kunderna och loggar svaren.
 * Härifrån kommer nyckeltalen, indatan till Domen (core/verdict.ts), bevisen
 * ett svar ger och hur långt grundaren har kvar till steg 06. Ingen text, bara
 * koder och siffror, som i18n översätter.
 */

export const CONTACT_STATUSES = ["planned", "contacted", "responded", "declined"] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const CONTACT_CHANNELS = ["phone", "email", "linkedin", "meeting", "other"] as const;
export type ContactChannel = (typeof CONTACT_CHANNELS)[number];

export const PROBLEM_STANCES = ["confirms", "partial", "rejects"] as const;
export type ProblemStanceLog = (typeof PROBLEM_STANCES)[number];

export const PRICE_STANCES = ["accepts", "declines", "undecided"] as const;
export type PriceStanceLog = (typeof PRICE_STANCES)[number];

export type SizeClassKey = (typeof SIZE_CLASSES)[number]["key"];
export const SIZE_CLASS_KEYS: readonly SizeClassKey[] = SIZE_CLASSES.map((size) => size.key);

/** Svaren från samtalsloggens Server Actions, som skärmen visar dem. */
export type ValidationFailure = "invalid" | "duplicate" | "backwards" | "limit" | "answered" | "unavailable";
export type ValidationActionResult = { ok: true } | { ok: false; reason: ValidationFailure };
export type PasteResult = { ok: true; added: number; skipped: number } | { ok: false; reason: ValidationFailure };
export type LogAnswerResult =
  | { ok: true; scored: true; total: number; delta: number }
  | { ok: true; scored: false }
  | { ok: false; reason: ValidationFailure };

/** Samma gränser som i databasen (20261004090000_validation_contacts.sql). */
export const COMPANY_NAME_MAX = 120;
export const QUOTE_MAX = 1000;
/** Ett citat kortare än så säger för lite för att vara ett bevis ("Ja.", "Kanske"). */
export const QUOTE_MIN = 10;
export const PRICE_MAX_KR = 10_000_000;
/** Fler bolag än så per projekt läses och sparas aldrig. */
export const CONTACTS_MAX = 200;

/** Hur många bolag grundaren bör ha på listan. Med en svarsfrekvens kring en
 * tredjedel ger 15 kontaktade ungefär de fem svar Domen kräver. */
export const SUGGESTED_CONTACTS = 15;

export const isContactStatus = (value: unknown): value is ContactStatus =>
  typeof value === "string" && (CONTACT_STATUSES as readonly string[]).includes(value);
export const isContactChannel = (value: unknown): value is ContactChannel =>
  typeof value === "string" && (CONTACT_CHANNELS as readonly string[]).includes(value);
export const isProblemStance = (value: unknown): value is ProblemStanceLog =>
  typeof value === "string" && (PROBLEM_STANCES as readonly string[]).includes(value);
export const isPriceStance = (value: unknown): value is PriceStanceLog =>
  typeof value === "string" && (PRICE_STANCES as readonly string[]).includes(value);
export const isSizeClassKey = (value: unknown): value is SizeClassKey =>
  typeof value === "string" && (SIZE_CLASS_KEYS as readonly string[]).includes(value);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(iso: string): boolean {
  if (!ISO_DATE.test(iso)) return false;
  const date = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === iso;
}

/** Ett giltigt datum som inte ligger i framtiden (7.3b) och inte före 2020. */
export function isValidPastDate(iso: unknown, todayIso: string): iso is string {
  return typeof iso === "string" && isRealDate(iso) && iso <= todayIso && iso >= "2020-01-01";
}

/** Bolagets namn som det sparas: rensat, utan dolda tecken. Tom sträng om ogiltigt. */
export function cleanCompanyName(name: unknown): string {
  if (typeof name !== "string") return "";
  const cleaned = cleanText(name, COMPANY_NAME_MAX + 1);
  return cleaned.length > COMPANY_NAME_MAX ? "" : cleaned;
}

/** Nyckeln som avgör om två namn är samma bolag: samma som databasens unika index. */
export function companyKey(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Vad ett kundbevis gäller (`subject_ref`, subjectKind "company"): bolaget.
 * Samma bolag ger därför ett bevis per sort, och ett nytt svar ersätter det
 * gamla (docs/bevislagring.md 7.2b). */
export function companySubjectRef(name: string): string {
  return `bolag:${companyKey(name)}`.slice(0, 200);
}

/**
 * Kontrollerar och rensar ett svar. `null` om något saknas eller är fel.
 * Citatet behåller grundarens stavning men rensas från dolda tecken.
 */
export function cleanAnswer(raw: unknown, todayIso: string): ConversationAnswer | null {
  if (typeof raw !== "object" || raw === null) return null;
  const input = raw as Record<string, unknown>;
  if (!isValidPastDate(input.respondedOnIso, todayIso)) return null;
  if (!isSizeClassKey(input.sizeClass)) return null;
  if (!isProblemStance(input.problemStance) || !isPriceStance(input.priceStance)) return null;
  const price = input.priceTestedKr;
  if (typeof price !== "number" || !Number.isInteger(price) || price < 1 || price > PRICE_MAX_KR) return null;
  const counter = input.counterOfferKr ?? null;
  if (counter !== null && (typeof counter !== "number" || !Number.isInteger(counter) || counter < 0 || counter > PRICE_MAX_KR)) {
    return null;
  }
  if (typeof input.quote !== "string") return null;
  const quote = cleanText(input.quote, QUOTE_MAX + 1);
  if (Array.from(quote).length < QUOTE_MIN || Array.from(quote).length > QUOTE_MAX) return null;
  return {
    respondedOnIso: input.respondedOnIso,
    sizeClass: input.sizeClass,
    problemStance: input.problemStance,
    priceStance: input.priceStance,
    priceTestedKr: price,
    // Ett motbud hör bara till ett svar som inte godtog priset.
    counterOfferKr: input.priceStance === "accepts" ? null : counter,
    quote,
  };
}

/**
 * Bevisen ett svar ger (core/evidenceKinds.ts). Ett "delvis" räknas som att
 * problemet bekräftas: bolaget känner igen problemet, och Domen räknar det
 * som en bekräftelse (core/verdict.ts). Beslut i docs/beslut.md 2026-10-04.
 * "Vet inte" om priset ger inget prisbevis.
 */
export function evidenceKindsForAnswer(answer: Pick<ConversationAnswer, "problemStance" | "priceStance">): {
  problem: EvidenceKind;
  price: EvidenceKind | null;
} {
  return {
    problem: answer.problemStance === "rejects" ? "customerProblemRejected" : "customerProblemConfirmed",
    price:
      answer.priceStance === "accepts"
        ? "customerPriceAccepted"
        : answer.priceStance === "declines"
          ? "customerPriceDeclined"
          : null,
  };
}

/** Källan på ett loggat svar: bolaget, aldrig Spark (7.12), och samtalets dag. */
export function answerSource(companyName: string, respondedOnIso: string): Källa {
  return { namn: companyName, hämtad: respondedOnIso };
}

export type ValidationLogStats = {
  /** Alla utom de planerade. */
  contacted: number;
  responded: number;
  declined: number;
  planned: number;
  /** Heltal i procent, `null` när ingen är kontaktad (aldrig en nolla). */
  responseRate: number | null;
};

export function logStats(contacts: readonly ValidationContact[]): ValidationLogStats {
  const count = (status: ContactStatus) => contacts.filter((contact) => contact.status === status).length;
  const planned = count("planned");
  const responded = count("responded");
  const contacted = contacts.length - planned;
  return {
    contacted,
    responded,
    declined: count("declined"),
    planned,
    responseRate: contacted > 0 ? Math.round((responded / contacted) * 100) : null,
  };
}

function employeesFor(sizeClass: SizeClassKey): number {
  // Klassens nedre gräns: Domen jämför bara storlekar mellan bolag, och
  // den lägsta gränsen påstår aldrig mer än grundaren angett.
  return SIZE_CLASSES.find((size) => size.key === sizeClass)?.min ?? 1;
}

/** Svar som fortfarande räknas: högst 180 dagar gamla (beslut B9). */
export function freshAnswers(contacts: readonly ValidationContact[], todayIso: string): ValidationContact[] {
  return contacts.filter(
    (contact) =>
      contact.status === "responded" &&
      contact.answer !== null &&
      !isStale("customerProblemConfirmed", contact.answer.respondedOnIso, todayIso),
  );
}

/** Domens indata ur loggen (core/verdict.ts räknar domen). */
export function toVerdictInput(contacts: readonly ValidationContact[], todayIso: string): VerdictInput {
  const responses: VerdictResponse[] = freshAnswers(contacts, todayIso).map((contact) => {
    const answer = contact.answer!;
    return {
      id: contact.id,
      companyName: contact.companyName,
      employees: employeesFor(answer.sizeClass),
      dateIso: answer.respondedOnIso,
      quote: answer.quote,
      problemStance: answer.problemStance,
      priceStance: answer.priceStance,
      priceTestedKr: answer.priceTestedKr,
      counterOfferKr: answer.counterOfferKr ?? undefined,
      source: answerSource(contact.companyName, answer.respondedOnIso),
    };
  });
  return { contacted: logStats(contacts).contacted, responses };
}

export type Step06Progress = {
  answers: number;
  companies: number;
  minAnswers: number;
  minCompanies: number;
  reached: boolean;
};

/**
 * Hur långt loggen har kommit mot kravet för steg 06 (minst fem kundsvar från
 * minst tre bolag, core/journeyRequirements.ts). Räknas som databasen räknar:
 * ett svar om problemet och ett om priset per bolag, bara svar som räknas.
 * Det bindande beslutet tar public.complete_journey_step.
 */
export function step06Progress(contacts: readonly ValidationContact[], todayIso: string): Step06Progress {
  const threshold = GROUP_THRESHOLDS[6]?.verdictAnswers ?? { minCount: 5, minSubjects: 3 };
  const fresh = freshAnswers(contacts, todayIso);
  const answers = fresh.reduce((sum, contact) => sum + 1 + (evidenceKindsForAnswer(contact.answer!).price ? 1 : 0), 0);
  const companies = fresh.length;
  return {
    answers,
    companies,
    minAnswers: threshold.minCount,
    minCompanies: threshold.minSubjects,
    reached: answers >= threshold.minCount && companies >= threshold.minSubjects,
  };
}

/** Nästa sak att göra i Valideringen, som en kod som i18n översätter. */
export type ValidationNextAction =
  | { code: "addContacts"; missing: number }
  | { code: "reachOut"; planned: number }
  | { code: "moreAnswers"; missing: number }
  | { code: "readVerdict" };

export function nextAction(contacts: readonly ValidationContact[], todayIso: string): ValidationNextAction {
  const stats = logStats(contacts);
  const fresh = freshAnswers(contacts, todayIso).length;
  if (fresh >= MIN_RESPONSES) return { code: "readVerdict" };
  if (contacts.length < SUGGESTED_CONTACTS && stats.planned === 0) {
    return { code: "addContacts", missing: SUGGESTED_CONTACTS - contacts.length };
  }
  if (stats.planned > 0) return { code: "reachOut", planned: stats.planned };
  return { code: "moreAnswers", missing: MIN_RESPONSES - fresh };
}

/**
 * Varningar om underlaget, som en ärlig medgrundare skulle säga dem. Bara
 * koder; texten ligger i i18n.
 * - "allPositive": minst tre svar och alla bekräftar problemet och godtar
 *   priset. Det händer sällan på riktigt och tyder ofta på ledande frågor.
 * - "priceNotTested": hälften eller fler av svaren tog inte ställning till
 *   priset. Då går betalningsviljan inte att döma.
 * - "oneSize": minst fyra svar och alla från samma storleksklass. Domen kan
 *   då inte se om segmentet är för brett.
 */
export type ValidationWarning = "allPositive" | "priceNotTested" | "oneSize";

export function answerWarnings(contacts: readonly ValidationContact[], todayIso: string): ValidationWarning[] {
  const answers = freshAnswers(contacts, todayIso).map((contact) => contact.answer!);
  const warnings: ValidationWarning[] = [];
  if (answers.length >= 3 && answers.every((a) => a.problemStance === "confirms" && a.priceStance === "accepts")) {
    warnings.push("allPositive");
  }
  if (answers.length >= 2 && answers.filter((a) => a.priceStance === "undecided").length * 2 >= answers.length) {
    warnings.push("priceNotTested");
  }
  if (answers.length >= 4 && new Set(answers.map((a) => a.sizeClass)).size === 1) {
    warnings.push("oneSize");
  }
  return warnings;
}
