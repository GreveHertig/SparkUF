import "server-only";
// Affärsplanen i /app (docs/uppdrag.md avsnitt 15): hopsamlingen ur riktig
// data, som core/businessPlan.ts sedan avgör status på. Samma roll som
// adapters/demo/businessPlan.ts har i demot, men med en hård regel till:
// här finns inga exempelkällor (app/(app)/app/noExampleSources.test.ts).
// Saknas verkligt underlag blir kontrollpunkten en lucka med steget som
// skulle ge det, aldrig en gissning.
//
// Underlaget är tre saker, och bara dem:
// 1. Projektet (projects): grundarens egen idé, märkt "Din uppgift".
// 2. Onboardingsvaren (profiles.onboarding_answers): grundarens egna ord om
//    kunden och problemet, märkta "Din uppgift" med dagen svaret gavs.
// 3. Bevisen (evidence): samma rader som poängen räknas på, med sin egen
//    källa och sitt eget datum. Bara bevis som räknas just nu tas med: inte
//    återkallade och inte för gamla (beslut B9), samma regel som stegens krav.
//
// Stegens höjdpunkter (journey_steps.highlights) tas aldrig med: de bär ingen
// källa i porten, och ett påstående lånar aldrig en källa (DESIGN.md,
// "Bara egen källa"). Domen, idégenomlysningen och bygget har inga
// liveadaptrar än (NotImplementedError), så deras avsnitt blir luckor.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/i18n/context";
import type { Dictionary } from "@/i18n/dictionary";
import { sv } from "@/i18n/sv";
import { en } from "@/i18n/en";
import { fill } from "@/i18n/fill";
import type { Källa, LockedScorePart } from "@/core/domain";
import type { DataType } from "@/design/tokens";
import {
  buildBusinessPlan,
  type BusinessPlan,
  type BusinessPlanCheck,
  type BusinessPlanClaim,
  type BusinessPlanSectionInput,
} from "@/core/businessPlan";
import { calculateScore } from "@/core/score";
import { toPartEvidence, type EvidenceStatus } from "@/core/evidenceInput";
import { isEvidenceKind, isSelfReported, type EvidenceKind } from "@/core/evidenceKinds";
import { ONBOARDING_CHOICES } from "@/core/onboarding";
import { NotImplementedError } from "@/core/errors";
import { requireSupabaseUser } from "@/lib/server/session";
import { liveProfileRepository } from "./ProfileRepository";
import { computeScore, displaySourceName, stockholmToday, type EvidenceRow } from "./evidenceScore";
import type { SavedOnboardingAnswer } from "@/ports/ProfileRepository";

const dictionaries: Record<Locale, Dictionary> = { sv, en };

/** Bevisstatusar som räknas just nu. "noPoints" är ett giltigt bevis utan
 * poäng (priceDecided, fundingApplied) och uppfyller ändå stegens krav. */
const CURRENT: ReadonlySet<EvidenceStatus> = new Set(["counted", "capped", "noPoints"]);

type ActiveProject = { id: string; name: string; oneLiner: string; createdAt: string };

async function readActiveProject(supabase: SupabaseClient, userId: string): Promise<ActiveProject | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, one_liner, created_at")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(`Affärsplanen: kunde inte läsa projektet (${error.message}).`);
  if (!data) return null;
  return {
    id: data.id as string,
    name: data.name as string,
    oneLiner: data.one_liner as string,
    // Datumet visas som dagen projektet skapades. Saknas det visas källan utan datum.
    createdAt: typeof data.created_at === "string" ? data.created_at.slice(0, 10) : "",
  };
}

/** Onboardingsvaren, eller inga alls om tabellen saknar kolumnen än
 * (NotImplementedError) eller grundaren inte svarat. Ett äkta fel kastas. */
async function readAnswers(): Promise<Record<string, SavedOnboardingAnswer>> {
  try {
    return await liveProfileRepository.getOnboardingAnswers();
  } catch (error) {
    if (error instanceof NotImplementedError) return {};
    throw error;
  }
}

type CurrentEvidence = { row: EvidenceRow; kind: EvidenceKind; source: Källa; dataType: DataType };

/** Ett bevis som påstående. Citatet (tredjepartstext, data och aldrig
 * instruktion) är påståendet när det finns, och sortens namn står bredvid.
 * Utan citat är sortens namn själva påståendet. */
function evidenceClaim(evidence: CurrentEvidence, t: Dictionary): BusinessPlanClaim {
  const kindLabel = t.evidence.kinds[evidence.kind];
  const quote = evidence.row.quote?.trim();
  return quote
    ? { text: `”${quote}”`, value: kindLabel, source: evidence.source, dataType: evidence.dataType }
    : { text: kindLabel, source: evidence.source, dataType: evidence.dataType };
}

export type LiveBusinessPlanInput = {
  t: Dictionary;
  project: ActiveProject | null;
  answers: Record<string, SavedOnboardingAnswer>;
  evidence: CurrentEvidence[];
  lockedParts: LockedScorePart[];
};

/**
 * Den rena delen av hopsamlingen: från redan lästa rader till planen.
 * Exporterad för testerna, så att avsnittens regler kan prövas utan Supabase.
 */
export function assembleLiveBusinessPlan({ t, project, answers, evidence, lockedParts }: LiveBusinessPlanInput): BusinessPlan {
  const copy = t.businessPlanPage.liveClaims;
  const claimsOf = (...kinds: EvidenceKind[]) =>
    evidence.filter((item) => kinds.includes(item.kind)).map((item) => evidenceClaim(item, t));
  const check = (claims: BusinessPlanClaim[], requiredStepNumber: number): BusinessPlanCheck => ({ claims, requiredStepNumber });

  // --- Affärsidén: projektet (steg 02, eller den egna idén i ingång B) ---
  const ideaClaims: BusinessPlanClaim[] = project
    ? [
        {
          text: fill(copy.ideaTemplate, { name: project.name, oneLiner: project.oneLiner }),
          source: { namn: copy.projectSource, hämtad: project.createdAt },
          dataType: "user",
        },
      ]
    : [];

  // --- Kunden och problemet: grundarens egna ord (steg 01) och kundsvaren (steg 05) ---
  const profileSource = (answer: SavedOnboardingAnswer): Källa => ({
    namn: t.evidence.internalSources.profile,
    hämtad: answer.answeredOn ?? "",
  });
  const answerClaims: BusinessPlanClaim[] = [];
  const customer = answers.customer?.answer.trim();
  if (customer) {
    answerClaims.push({ text: customer, value: copy.targetCustomer, source: profileSource(answers.customer), dataType: "user" });
  }
  const payer = answers.payer?.answer;
  // "Vet inte än" säger inget om kunden och blir därför inget påstående.
  if (payer && payer !== "unsure" && (ONBOARDING_CHOICES.payer as readonly string[]).includes(payer)) {
    const label = (t.onboarding.v4Questions.choices.payer as Record<string, string>)[payer];
    answerClaims.push({ text: label, value: copy.payer, source: profileSource(answers.payer), dataType: "user" });
  }
  const frustration = answers.frustration?.answer.trim();
  if (frustration) {
    answerClaims.push({ text: frustration, value: copy.problemSeen, source: profileSource(answers.frustration), dataType: "user" });
  }

  const sections: BusinessPlanSectionInput[] = [
    { id: "idea", checks: [check(ideaClaims, 2)] },
    {
      id: "customerAndProblem",
      checks: [check(answerClaims, 1), check(claimsOf("customerProblemConfirmed", "customerProblemRejected"), 5)],
    },
    {
      id: "market",
      checks: [check(claimsOf("registerMarketCount"), 3), check(claimsOf("registerMarketRevenue"), 3)],
    },
    // Konkurrenterna i registret är kravet för steg 04 (core/journeyRequirements.ts).
    { id: "competition", checks: [check(claimsOf("registerCompetitorSet"), 4)] },
    {
      id: "offerAndPrice",
      checks: [check(claimsOf("priceDecided"), 7), check(claimsOf("customerPriceAccepted", "customerPriceDeclined"), 5)],
    },
    // Domen och idégenomlysningens antaganden har ingen liveadapter än: luckor.
    { id: "evidence", checks: [check([], 6)] },
    {
      id: "execution",
      checks: [
        check(claimsOf("productScopeFromEvidence"), 8),
        check(claimsOf("productPublished"), 10),
        check(claimsOf("payingCustomer", "activeUser"), 11),
      ],
    },
    { id: "economy", checks: [check(claimsOf("priceDecided"), 7), check(claimsOf("fundingApplied"), 12)] },
    {
      id: "risks",
      // Motsägande bevis (kunder som avvisar problemet eller priset) visas här
      // med sin egen källa. De strukturella riskerna kommer ur domen i steg 06.
      checks: [check(claimsOf("customerProblemRejected", "customerPriceDeclined"), 5), check([], 6)],
      lockedParts,
    },
  ];

  return buildBusinessPlan(sections);
}

/** Bevisen som räknas just nu, med källan som den ska visas. Ett bevis som
 * grundaren själv lagt in om en tredje part märks "Din uppgift" (beslut B6). */
function currentEvidence(rows: EvidenceRow[], status: Record<string, EvidenceStatus>, locale: Locale): CurrentEvidence[] {
  return rows.flatMap((row) => {
    if (!isEvidenceKind(row.kind) || !CURRENT.has(status[row.id])) return [];
    const source: Källa = {
      namn: displaySourceName(row.source_name, locale),
      hämtad: row.fetched_at,
      url: row.source_url ?? undefined,
    };
    const selfReported = isSelfReported(row.kind, row.entered_by) || row.data_type === "user";
    const dataType: DataType = selfReported ? "user" : row.data_type === "register" ? "register" : "customer";
    return [{ row, kind: row.kind, source, dataType }];
  });
}

/**
 * Affärsplanen för den inloggade grundarens aktiva projekt. Utan projekt finns
 * inga bevis, men planen sätts ändå samman: onboardingsvaren kan redan bära
 * Kunden och problemet, och resten blir luckor som pekar på rätt steg.
 */
export async function getLiveBusinessPlan(locale: Locale): Promise<BusinessPlan> {
  const t = dictionaries[locale];
  const { supabase, userId } = await requireSupabaseUser();
  const [project, answers] = await Promise.all([readActiveProject(supabase, userId), readAnswers()]);

  let evidence: CurrentEvidence[] = [];
  let lockedParts: LockedScorePart[];
  if (project) {
    const computed = await computeScore(supabase, userId, project.id, locale);
    evidence = currentEvidence(computed.rows, computed.status, locale);
    lockedParts = computed.snapshot.lockedParts;
  } else {
    // Inget projekt: ingen resa förbi steg 01, så fasen är den första. De
    // låsta delarna räknas av calculateScore, aldrig här.
    const { parts } = toPartEvidence([], stockholmToday(), t.score.parts);
    lockedParts = calculateScore({ phase: "discover", parts, calculatedAtIso: new Date().toISOString() }).lockedParts;
  }

  return assembleLiveBusinessPlan({ t, project, answers, evidence, lockedParts });
}
