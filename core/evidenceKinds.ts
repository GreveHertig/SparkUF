// Bevissorterna (docs/bevislagring.md 1.2). En sluten lista: sorten avgör
// vilken del ett bevis hör till, vilken datatyp det har, om det motsäger
// och hur mycket det är värt. Inget av det kommer någonsin ur inmatningen.
//
// Listan finns på två ställen: här och som seed i tabellen
// public.evidence_kinds (supabase/migrations/20261001120000_evidence_write_path.sql).
// Databasen sätter poängen ur sin kopia när ett bevis skrivs (beslut B2).
// supabase/migrations/evidenceKinds.test.ts håller de två i synk.
import type { ScorePartId } from "@/core/score";

export type EvidenceKind =
  | "profileFitAnswer"
  | "registerMarketCount"
  | "registerMarketRevenue"
  | "registerCompetitorSet"
  | "customerProblemConfirmed"
  | "customerProblemRejected"
  | "customerPriceAccepted"
  | "customerPriceDeclined"
  | "productScopeFromEvidence"
  | "productPublished"
  | "formalRegistrationDone"
  | "legalItemDone"
  | "payingCustomer"
  | "activeUser"
  | "priceDecided"
  | "fundingApplied";

/** Vem som får lägga in en sort.
 * - "founder": grundaren är själv källan (profilen, ett eget beslut). Räknas fullt.
 * - "system": bara en modul som hämtat faktumet ur en extern källa.
 * - "either": ett faktum om en tredje part. Systemet kan ta emot det direkt,
 *   men grundaren får också ange det. Då är det självrapporterat (beslut B6). */
export type EvidenceEnteredBy = "founder" | "system" | "either";

export type EvidenceSubjectKind =
  | "company"
  | "response"
  | "registryQuery"
  | "profileField"
  | "url"
  | "legalItem"
  | "price"
  | "funding";

export type EvidenceKindSpec = {
  partId: ScorePartId;
  /** Aldrig "simulation" (7.6): typen tillåter det inte ens. */
  dataType: "register" | "customer";
  /** Rått värde in i calculateScore för ett bevis som räknas fullt.
   * 0 = sorten ger aldrig poäng och skickas inte till calculateScore. Den
   * finns bara för att uppfylla ett krav i resan (beslut 2026-10-01 om steg
   * 07 och 12, docs/beslut.md). */
  basePoints: number;
  contradicts: boolean;
  /** Antal dagar från faktumets datum (fetched_at) som beviset räknas.
   * null = föråldras aldrig. Beslut B9: ett äldre bevis utesluts helt. */
  freshForDays: number | null;
  subjectKind: EvidenceSubjectKind;
  enteredBy: EvidenceEnteredBy;
};

/** Startvärdena ur specens tabell (beslut B1). Ändras ett värde här måste
 * seeden i migrationen ändras i en ny migration, annars failar synktestet. */
export const EVIDENCE_KINDS: Record<EvidenceKind, EvidenceKindSpec> = {
  profileFitAnswer: { partId: "fit", dataType: "customer", basePoints: 3, contradicts: false, freshForDays: null, subjectKind: "profileField", enteredBy: "founder" },
  registerMarketCount: { partId: "market", dataType: "register", basePoints: 4, contradicts: false, freshForDays: 365, subjectKind: "registryQuery", enteredBy: "system" },
  registerMarketRevenue: { partId: "market", dataType: "register", basePoints: 3, contradicts: false, freshForDays: 365, subjectKind: "registryQuery", enteredBy: "system" },
  registerCompetitorSet: { partId: "competition", dataType: "register", basePoints: 3, contradicts: false, freshForDays: 365, subjectKind: "registryQuery", enteredBy: "system" },
  customerProblemConfirmed: { partId: "problem", dataType: "customer", basePoints: 3, contradicts: false, freshForDays: 180, subjectKind: "company", enteredBy: "either" },
  customerProblemRejected: { partId: "problem", dataType: "customer", basePoints: 3, contradicts: true, freshForDays: 180, subjectKind: "company", enteredBy: "either" },
  customerPriceAccepted: { partId: "willingnessToPay", dataType: "customer", basePoints: 3, contradicts: false, freshForDays: 180, subjectKind: "company", enteredBy: "either" },
  customerPriceDeclined: { partId: "willingnessToPay", dataType: "customer", basePoints: 3, contradicts: true, freshForDays: 180, subjectKind: "company", enteredBy: "either" },
  productScopeFromEvidence: { partId: "product", dataType: "customer", basePoints: 4, contradicts: false, freshForDays: null, subjectKind: "profileField", enteredBy: "founder" },
  productPublished: { partId: "product", dataType: "customer", basePoints: 6, contradicts: false, freshForDays: 90, subjectKind: "url", enteredBy: "founder" },
  formalRegistrationDone: { partId: "feasibility", dataType: "register", basePoints: 4, contradicts: false, freshForDays: null, subjectKind: "company", enteredBy: "either" },
  legalItemDone: { partId: "feasibility", dataType: "register", basePoints: 1, contradicts: false, freshForDays: 365, subjectKind: "legalItem", enteredBy: "founder" },
  payingCustomer: { partId: "traction", dataType: "customer", basePoints: 4, contradicts: false, freshForDays: 90, subjectKind: "company", enteredBy: "either" },
  activeUser: { partId: "traction", dataType: "customer", basePoints: 1, contradicts: false, freshForDays: 30, subjectKind: "url", enteredBy: "either" },
  // Krav för steg 07 och 12, utan poäng (beslut 2026-10-01). Ett pris
  // grundaren själv satt bevisar inte att någon betalar det, och en inskickad
  // ansökan är inte beviljade pengar. Båda är "either" så att de märks
  // "Angivet av dig" när grundaren lägger in dem.
  // priceDecided: subject_ref "price", priset och spannet i quote.
  priceDecided: { partId: "willingnessToPay", dataType: "customer", basePoints: 0, contradicts: false, freshForDays: 365, subjectKind: "price", enteredBy: "either" },
  // fundingApplied: subject_ref är finansiären och diarie- eller ärendenumret,
  // källan är programmets URL.
  fundingApplied: { partId: "feasibility", dataType: "register", basePoints: 0, contradicts: false, freshForDays: null, subjectKind: "funding", enteredBy: "either" },
};

export const ALL_EVIDENCE_KINDS = Object.keys(EVIDENCE_KINDS) as EvidenceKind[];

/** Ger sorten poäng? En sort utan poäng uppfyller bara krav i resan. */
export function givesPoints(kind: EvidenceKind): boolean {
  return EVIDENCE_KINDS[kind].basePoints > 0;
}

export function isEvidenceKind(value: unknown): value is EvidenceKind {
  return typeof value === "string" && Object.hasOwn(EVIDENCE_KINDS, value);
}

/** Beslut B6: ett självrapporterat bevis ger hälften av sortens poäng.
 * Sätts av databasen vid skrivning (samma tal i migrationen, synktestat). */
export const SELF_REPORTED_MULTIPLIER = 0.5;

/** Beslut B6: självrapporterade bevis kan tillsammans ge en del högst så här
 * stor andel av delens vikt. Resten kräver bevis Spark själv tagit emot.
 * Räknas i core/evidenceInput.ts. */
export const SELF_REPORTED_PART_SHARE = 0.5;

/** Om ett bevis med den här sorten, inlagt av den här parten, är
 * självrapporterat (märks "Angivet av dig" och väger mindre). */
export function isSelfReported(kind: EvidenceKind, enteredBy: "founder" | "system"): boolean {
  return enteredBy === "founder" && EVIDENCE_KINDS[kind].enteredBy === "either";
}

/** Får grundaren själv lägga in den här sorten? Systemsorter (registerdata)
 * kan grundaren aldrig skriva. Samma regel i record_evidence i databasen. */
export function founderMayRecord(kind: EvidenceKind): boolean {
  return EVIDENCE_KINDS[kind].enteredBy !== "system";
}
