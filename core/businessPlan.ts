// Affärsplanen (docs/uppdrag.md avsnitt 15) — en REN FUNKTION, samma mönster
// som core/score.ts: ingen adapterimport, ingen i18n-import, inget hitta-på.
// Planen genereras aldrig, den sätts samman av det grundaren redan bevisat.
//
// Den här filen vet ingenting om portar, Supabase, Sara eller Jonas. Den tar
// emot redan hopsamlade "kontrollpunkter" per avsnitt — varje kontrollpunkt
// är antingen uppfylld (bär ett eller flera `BusinessPlanClaim`, redan
// lokaliserad text + en riktig `Källa`, byggd av anroparen ur de befintliga
// portsnapshotsen: resan, bevisen, registret, domen, utskicken) eller inte
// (ingen text hittas på — bara vilket steg i resan som skulle ge underlaget).
// Anroparen (adapters/demo/businessPlan.ts) gör själva hopsamlingen ur
// portarna och i18n, precis som sara.ts:s `parts()`/`pt()` gör åt
// calculateScore innan den anropas — den här filen bara avgör om en
// kontrollpunkt höll, aldrig vad den ska säga (CLAUDE.md: ingen hårdkodad
// text i core/).
import type { Källa, LockedScorePart } from "@/core/domain";
import type { DataType } from "@/design/tokens";

/** De nio avsnitten (15.2), i den ordning planen alltid visas i — oavsett i
 * vilken ordning anroparen råkar skicka in dem. */
export type BusinessPlanSectionId =
  | "idea"
  | "customerAndProblem"
  | "market"
  | "competition"
  | "offerAndPrice"
  | "evidence"
  | "execution"
  | "economy"
  | "risks";

export const BUSINESS_PLAN_SECTION_ORDER: readonly BusinessPlanSectionId[] = [
  "idea",
  "customerAndProblem",
  "market",
  "competition",
  "offerAndPrice",
  "evidence",
  "execution",
  "economy",
  "risks",
];

/** Ett påstående i planen. `text` är redan lokaliserad text som fanns i en
 * port sedan tidigare (en highlight, ett citat, en registerfakta, en
 * etikett ur i18n) — den här filen skriver aldrig en ny mening. `value` är
 * valfri, för siffertunga påståenden (t.ex. registrets nyckeltal) som hellre
 * visas som etikett + tal, i samma stil som `DataFact`, än som en hopklistrad
 * sträng. */
export type BusinessPlanClaim = {
  text: string;
  value?: string | number;
  source: Källa;
  dataType: DataType;
};

/** Två påståenden som säger olika saker (regel 2, 15.3) — båda visas, ingen
 * väljs bort. */
export type BusinessPlanContradiction = {
  a: BusinessPlanClaim;
  b: BusinessPlanClaim;
};

/** En lucka (regel 1, 15.3): inget påstående skrivs, bara vilket steg i
 * resan som skulle ge underlaget. */
export type BusinessPlanGap = {
  requiredStepNumber: number;
};

export type BusinessPlanStatus = "solid" | "thin" | "missing";

/**
 * En kontrollpunkt ett avsnitt byggs av. `claims` tomt betyder att
 * kontrollpunkten inte höll — `requiredStepNumber` säger var underlaget
 * skulle komma ifrån. Anroparen avgör vad en kontrollpunkt är (en highlight
 * från ett steg, registrets täckning, domens citat, …) — den här filen
 * räknar bara ihop dem.
 */
export type BusinessPlanCheck = {
  claims: BusinessPlanClaim[];
  requiredStepNumber: number;
};

export type BusinessPlanSectionInput = {
  id: BusinessPlanSectionId;
  checks: BusinessPlanCheck[];
  contradictions?: BusinessPlanContradiction[];
  /** Bara "risks": poängens redan låsta delar (avsnitt 7.3), oförändrade —
   * en låst del har aldrig en Källa (samma princip som `LockedState`,
   * "Låst är inte noll"), så den går inte genom `claims`/`gaps`. */
  lockedParts?: LockedScorePart[];
};

export type BusinessPlanSection = {
  id: BusinessPlanSectionId;
  status: BusinessPlanStatus;
  claims: BusinessPlanClaim[];
  contradictions: BusinessPlanContradiction[];
  gaps: BusinessPlanGap[];
  lockedParts: LockedScorePart[];
};

export type BusinessPlanMaturity = {
  solidCount: number;
  thinCount: number;
  missingCount: number;
  totalCount: number;
  /** solidCount / totalCount — anroparen formaterar (t.ex. som procent). */
  solidShare: number;
};

export type BusinessPlan = {
  sections: BusinessPlanSection[];
  maturity: BusinessPlanMaturity;
};

/** Regel 3 (15.3): håller (alla kontrollpunkter uppfyllda), tunt underlag
 * (några), saknas (inga). */
function statusFor(satisfiedCount: number, totalCount: number): BusinessPlanStatus {
  if (satisfiedCount === 0) return "missing";
  if (satisfiedCount === totalCount) return "solid";
  return "thin";
}

function buildSection(input: BusinessPlanSectionInput): BusinessPlanSection {
  if (input.checks.length === 0) {
    throw new Error(
      `buildBusinessPlan: avsnitt "${input.id}" saknar kontrollpunkter — minst en krävs för att avgöra status.`,
    );
  }

  const satisfiedChecks = input.checks.filter((check) => check.claims.length > 0);
  const unsatisfiedChecks = input.checks.filter((check) => check.claims.length === 0);

  return {
    id: input.id,
    status: statusFor(satisfiedChecks.length, input.checks.length),
    claims: satisfiedChecks.flatMap((check) => check.claims),
    contradictions: input.contradictions ?? [],
    gaps: unsatisfiedChecks.map((check) => ({ requiredStepNumber: check.requiredStepNumber })),
    lockedParts: input.lockedParts ?? [],
  };
}

/**
 * Sätter samman planen (15.1): tar redan hopsamlade kontrollpunkter per
 * avsnitt, avgör status och luckor för vart och ett, och räknar
 * färdighetsgraden. Samma plan-motor för båda personas (15.3) — en resa
 * byggd i bredd ger fler avsnitt med status "thin"/"missing", det är en
 * sanning om underlaget, inte ett specialfall i den här funktionen.
 */
export function buildBusinessPlan(sections: BusinessPlanSectionInput[]): BusinessPlan {
  const orderIndex = new Map(BUSINESS_PLAN_SECTION_ORDER.map((id, index) => [id, index]));
  const built = sections
    .map(buildSection)
    .sort((a, b) => (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0));

  const solidCount = built.filter((section) => section.status === "solid").length;
  const thinCount = built.filter((section) => section.status === "thin").length;
  const missingCount = built.filter((section) => section.status === "missing").length;
  const totalCount = built.length;

  return {
    sections: built,
    maturity: {
      solidCount,
      thinCount,
      missingCount,
      totalCount,
      solidShare: totalCount === 0 ? 0 : solidCount / totalCount,
    },
  };
}
