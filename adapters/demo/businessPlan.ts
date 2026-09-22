// Affärsplanen (docs/uppdrag.md avsnitt 15) — hopsamlingen ur de befintliga
// portsnapshotsen som core/businessPlan.ts sedan avgör status på. Ingen ny
// port, ingen ny datakälla: bara Resan, Bevisen, Registret, Domen, Projektet
// och Bygget, precis som redan används av Hem/Marknad/Validering/Bygg.
//
// Två portar är i dag hårdkodade mot en enda persona vardera
// (RegistryProvider mot Sara, ProjectRepository.getIdeaScreening mot Jonas —
// se docs/status.md) utan egen `entry`-vakt. De anropas här bara för den
// persona de faktiskt gäller — annars skulle planen visa fel företags
// siffror under rätt rubrik, samma fel som redan fixats en gång i
// SimulationProvider.ts (docs/status.md, "Poleringssession").
import type { Locale } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { en } from "@/i18n/en";
import type { Dictionary } from "@/i18n/dictionary";
import type { Källa, ScoreSnapshot, LockedScorePart, ByggBrief } from "@/core/domain";
import type { DataType } from "@/design/tokens";
import { ALL_PART_IDS, type ScorePartId, type ScoreSuggestion } from "@/core/score";
import {
  buildBusinessPlan,
  type BusinessPlan,
  type BusinessPlanCheck,
  type BusinessPlanClaim,
  type BusinessPlanSectionInput,
} from "@/core/businessPlan";
import type { JourneyStepDetail } from "@/ports/JourneyRepository";
import type { MarketOverview } from "@/ports/RegistryProvider";
import type { VerdictReport } from "@/ports/VerdictProvider";
import type { IdeaScreening } from "@/ports/ProjectRepository";
import { demoJourneyRepository } from "./JourneyRepository";
import { demoEvidenceRepository } from "./EvidenceRepository";
import { demoRegistryProvider } from "./RegistryProvider";
import { demoVerdictProvider } from "./VerdictProvider";
import { demoProjectRepository } from "./ProjectRepository";
import { demoBuildProvider } from "./BuildProvider";
import { useDemoStore } from "./demoStore";

const dictionaries: Record<Locale, Dictionary> = { sv, en };

/** Stegen planens nio avsnitt (15.2) hämtar highlights ur. */
const STEP_NUMBERS = [1, 2, 4, 5, 6, 7, 8, 11, 12] as const;
type PlanStepNumber = (typeof STEP_NUMBERS)[number];
type StepMap = Partial<Record<PlanStepNumber, JourneyStepDetail>>;

type PartSource = { source: Källa; dataType: DataType };
type PartSources = Partial<Record<ScorePartId, PartSource>>;

/** `ScoreSnapshot.parts` bär bara den redan lokaliserade etiketten (`name`),
 * inte ett stabilt `ScorePartId` (score.ts:s `ScorePart`-form, orörd här) —
 * matchar tillbaka mot `t.score.parts` för att hitta rätt dels källa. */
function partSourcesFrom(snapshot: ScoreSnapshot, locale: Locale): PartSources {
  const labels = dictionaries[locale].score.parts;
  const sources: PartSources = {};
  for (const partId of ALL_PART_IDS) {
    const part = snapshot.parts.find((p) => p.name === labels[partId]);
    if (part) sources[partId] = { source: part.source, dataType: part.dataType };
  }
  return sources;
}

function highlightClaims(step: JourneyStepDetail | undefined, partSource: PartSource | undefined): BusinessPlanClaim[] {
  if (!step || step.highlights.length === 0 || !partSource) return [];
  return step.highlights.map((text) => ({ text, source: partSource.source, dataType: partSource.dataType }));
}

function verdictSource(report: VerdictReport, partSources: PartSources): PartSource | undefined {
  const quoteSource = report.quotes[0]?.source;
  if (quoteSource) return { source: quoteSource, dataType: "customer" };
  return partSources.willingnessToPay ?? partSources.problem;
}

// --- Avsnitt 1: Affärsidén (steg 01–02, eller idégenomlysningens skarpare idé) ---
function ideaSection(steps: StepMap, partSources: PartSources, ideaScreening: IdeaScreening | null): BusinessPlanSectionInput {
  const checks: BusinessPlanCheck[] = [{ claims: highlightClaims(steps[1], partSources.fit), requiredStepNumber: 1 }];

  const lastFact = ideaScreening?.registerFacts.at(-1);
  if (ideaScreening && lastFact) {
    checks.push({
      claims: [
        { text: ideaScreening.sharperIdea.why, value: ideaScreening.sharperIdea.name, source: lastFact.source, dataType: "register" },
        ...ideaScreening.registerFacts.map((fact) => ({
          text: fact.label,
          value: fact.value,
          source: fact.source,
          dataType: "register" as const,
        })),
      ],
      requiredStepNumber: 2,
    });
  } else {
    checks.push({ claims: highlightClaims(steps[2], partSources.market), requiredStepNumber: 2 });
  }

  return { id: "idea", checks };
}

// --- Avsnitt 2: Kunden och problemet (steg 04 kundprofil, steg 05 svaren) ---
function customerAndProblemSection(
  steps: StepMap,
  market: MarketOverview | null,
  verdictReport: VerdictReport | null,
): BusinessPlanSectionInput {
  const profileClaims: BusinessPlanClaim[] =
    market && steps[4] && steps[4].highlights.length > 0
      ? steps[4].highlights.map((text) => ({ text, source: market.source, dataType: "register" as const }))
      : [];
  const quoteClaims: BusinessPlanClaim[] = verdictReport
    ? verdictReport.quotes.map((quote) => ({ text: quote.quote, value: quote.companyName, source: quote.source, dataType: "customer" as const }))
    : [];

  return {
    id: "customerAndProblem",
    checks: [
      { claims: profileClaims, requiredStepNumber: 4 },
      { claims: quoteClaims, requiredStepNumber: 5 },
    ],
  };
}

// --- Avsnitt 3: Marknaden (steg 03, registret, alltid med täckning) ---
function marketSection(t: Dictionary, market: MarketOverview | null, ideaScreening: IdeaScreening | null): BusinessPlanSectionInput {
  let overviewClaims: BusinessPlanClaim[] = [];
  let coverageClaims: BusinessPlanClaim[] = [];

  if (market) {
    overviewClaims = [
      { text: t.marketPage.companyCountLabel, value: market.companyCount, source: market.source, dataType: "register" },
      { text: t.marketPage.medianRevenueLabel, value: market.medianRevenueKsek, source: market.source, dataType: "register" },
      { text: t.marketPage.growthShareLabel, value: market.growthSharePercent, source: market.source, dataType: "register" },
      { text: t.marketPage.regionShareLabel, value: market.regionSharePercent, source: market.source, dataType: "register" },
    ];
    if (market.basis) {
      coverageClaims = [
        {
          text: t.marketPage.basedOnLabel,
          value: `${market.basis.medianRevenueCompanies}/${market.basis.growthCompanies}/${market.basis.regionCompanies}`,
          source: market.source,
          dataType: "register",
        },
      ];
    }
  } else if (ideaScreening && ideaScreening.registerFacts.length > 0) {
    // Ingen fullständig MarketOverview finns (RegistryProvider är
    // Sara-hårdkodad) — idégenomlysningens egna, källbelagda registerfakta
    // är ett tunnare men ärligt substitut. Ingen täckning finns för den
    // formen, så coverageClaims lämnas tom (15.3, regel 1).
    overviewClaims = ideaScreening.registerFacts.map((fact) => ({
      text: fact.label,
      value: fact.value,
      source: fact.source,
      dataType: "register",
    }));
  }

  return {
    id: "market",
    checks: [
      { claims: overviewClaims, requiredStepNumber: 3 },
      { claims: coverageClaims, requiredStepNumber: 3 },
    ],
  };
}

// --- Avsnitt 4: Konkurrensen (steg 03, registret) ---
function competitionSection(market: MarketOverview | null): BusinessPlanSectionInput {
  const claims: BusinessPlanClaim[] =
    market && market.competitors.length > 0
      ? market.competitors.map((competitor) => ({ text: competitor.description, value: competitor.name, source: market.source, dataType: "register" as const }))
      : [];
  return { id: "competition", checks: [{ claims, requiredStepNumber: 3 }] };
}

// --- Avsnitt 5: Erbjudandet och priset (steg 07, prövat mot steg 05) ---
function offerAndPriceSection(steps: StepMap, partSources: PartSources, verdictReport: VerdictReport | null): BusinessPlanSectionInput {
  const priceClaims = highlightClaims(steps[7], partSources.willingnessToPay);

  const stats = verdictReport?.verdict.stats;
  const priceTested = stats ? stats.priceAccepted + stats.priceDeclined : 0;
  const validationSource = verdictReport ? verdictSource(verdictReport, partSources) : undefined;
  const validationClaims: BusinessPlanClaim[] =
    verdictReport && priceTested > 0 && validationSource
      ? [{ text: verdictReport.presentation.reasoning, value: verdictReport.presentation.headline, source: validationSource.source, dataType: validationSource.dataType }]
      : [];

  return {
    id: "offerAndPrice",
    checks: [
      { claims: priceClaims, requiredStepNumber: 7 },
      { claims: validationClaims, requiredStepNumber: 5 },
    ],
  };
}

// --- Avsnitt 6: Beviset (domen i steg 06, antagandena med utfall) ---
function evidenceSection(
  steps: StepMap,
  partSources: PartSources,
  verdictReport: VerdictReport | null,
  ideaScreening: IdeaScreening | null,
): BusinessPlanSectionInput {
  let verdictClaims: BusinessPlanClaim[] = [];
  const beatVerdict = steps[6]?.verdict;
  const fallbackSource = partSources.problem ?? partSources.willingnessToPay;

  if (verdictReport) {
    const source = verdictSource(verdictReport, partSources);
    if (source) {
      verdictClaims = [
        { text: verdictReport.presentation.reasoning, value: verdictReport.presentation.headline, source: source.source, dataType: source.dataType },
        ...verdictReport.quotes.map((quote) => ({ text: quote.quote, value: quote.companyName, source: quote.source, dataType: "customer" as const })),
      ];
    }
  } else if (beatVerdict && fallbackSource) {
    verdictClaims = [
      { text: beatVerdict.reasoning, value: beatVerdict.headline, source: fallbackSource.source, dataType: fallbackSource.dataType },
    ];
  }

  const lastFact = ideaScreening?.registerFacts.at(-1);
  const assumptionClaims: BusinessPlanClaim[] =
    ideaScreening && lastFact
      ? ideaScreening.assumptions.map((assumption) => ({ text: assumption.text, source: lastFact.source, dataType: "register" as const }))
      : [];

  return {
    id: "evidence",
    checks: [
      { claims: verdictClaims, requiredStepNumber: 6 },
      { claims: assumptionClaims, requiredStepNumber: 6 },
    ],
  };
}

// --- Avsnitt 7: Genomförandet (steg 08 omfånget, steg 11 planen) ---
function executionSection(steps: StepMap, partSources: PartSources, buildSpec: ByggBrief | null): BusinessPlanSectionInput {
  const scopeClaims: BusinessPlanClaim[] =
    buildSpec && buildSpec.underlag.length > 0
      ? buildSpec.underlag.map((bevis) => ({ text: bevis.påstående, source: bevis.källa, dataType: "customer" as const }))
      : highlightClaims(steps[8], partSources.product);
  const planClaims = highlightClaims(steps[11], partSources.traction);

  return {
    id: "execution",
    checks: [
      { claims: scopeClaims, requiredStepNumber: 8 },
      { claims: planClaims, requiredStepNumber: 11 },
    ],
  };
}

// --- Avsnitt 8: Ekonomin (steg 07 kalkylen, steg 12) ---
function economySection(steps: StepMap, partSources: PartSources): BusinessPlanSectionInput {
  return {
    id: "economy",
    checks: [
      { claims: highlightClaims(steps[7], partSources.willingnessToPay), requiredStepNumber: 7 },
      { claims: highlightClaims(steps[12], partSources.feasibility), requiredStepNumber: 12 },
    ],
  };
}

// --- Avsnitt 9: Riskerna (motsagda antaganden, låsta poängdelar) ---
function risksSection(suggestions: ScoreSuggestion[], partSources: PartSources, lockedParts: LockedScorePart[]): BusinessPlanSectionInput {
  const claimFor = (suggestion: ScoreSuggestion): BusinessPlanClaim | null => {
    const partSource = partSources[suggestion.partId];
    if (!partSource) return null;
    return { text: suggestion.explanation, value: suggestion.label, source: partSource.source, dataType: partSource.dataType };
  };
  const byGap = (gapType: ScoreSuggestion["gapType"]) =>
    suggestions.filter((s) => s.gapType === gapType).flatMap((s) => {
      const claim = claimFor(s);
      return claim ? [claim] : [];
    });

  return {
    id: "risks",
    checks: [
      { claims: byGap("contradicting"), requiredStepNumber: 5 },
      { claims: byGap("structural"), requiredStepNumber: 6 },
    ],
    lockedParts,
  };
}

/**
 * Sätter samman Affärsplanen för den aktiva personan och det aktuella
 * momentet (`useDemoStore`) — samma reaktiva mönster som övriga
 * demoadaptrar (beatIndex/entry avgör vad som redan finns att visa).
 */
export async function getBusinessPlan(locale: Locale): Promise<BusinessPlan> {
  const { entry } = useDemoStore.getState();
  const t = dictionaries[locale];

  const stepDetails = await Promise.all(STEP_NUMBERS.map((stepNumber) => demoJourneyRepository.getStepDetail(stepNumber, locale)));
  const steps: StepMap = {};
  STEP_NUMBERS.forEach((stepNumber, index) => {
    const detail = stepDetails[index];
    if (detail) steps[stepNumber] = detail;
  });

  const [scoreSnapshot, suggestions, buildSpec, verdictReport] = await Promise.all([
    demoEvidenceRepository.getScoreSnapshot(locale),
    demoEvidenceRepository.getSuggestions(locale),
    demoBuildProvider.getSpec(locale),
    demoVerdictProvider.getVerdictReport(locale),
  ]);

  const market = entry === "hasIdea" ? null : await demoRegistryProvider.getMarketOverview(locale);
  const ideaScreening = entry === "hasIdea" ? await demoProjectRepository.getIdeaScreening(locale) : null;

  const partSources = partSourcesFrom(scoreSnapshot, locale);

  return buildBusinessPlan([
    ideaSection(steps, partSources, ideaScreening),
    customerAndProblemSection(steps, market, verdictReport),
    marketSection(t, market, ideaScreening),
    competitionSection(market),
    offerAndPriceSection(steps, partSources, verdictReport),
    evidenceSection(steps, partSources, verdictReport, ideaScreening),
    executionSection(steps, partSources, buildSpec),
    economySection(steps, partSources),
    risksSection(suggestions, partSources, scoreSnapshot.lockedParts),
  ]);
}
