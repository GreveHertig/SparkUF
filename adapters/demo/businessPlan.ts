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
import { fill } from "@/i18n/fill";
import { formatCount } from "@/i18n/format";
import type { Källa, LockedScorePart, ByggBrief } from "@/core/domain";
import {
  buildBusinessPlan,
  type BusinessPlan,
  type BusinessPlanCheck,
  type BusinessPlanClaim,
  type BusinessPlanSectionInput,
} from "@/core/businessPlan";
import type { ScoreSuggestion } from "@/core/score";
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
import { exampleSource } from "./exampleSource";

const dictionaries: Record<Locale, Dictionary> = { sv, en };

// Källregeln (PR 10 och 11, docs/status.md): ett påstående visas bara med sin
// egen källa, aldrig med en lånad. Registrets källa bärs bara av registrets
// siffror, citatens källa bara av citaten och domen, byggspecens av dess
// underlag.
//
// Stegens höjdpunkter (`JourneyStepDetail.highlights`), förslagens
// förklaringar (`ScoreSuggestion.explanation`), den skarpare idéns motivering,
// idégenomlysningens antaganden, konkurrenternas beskrivningar och stegets
// dom utan utskick bär ingen källa i sina portar. De är påhittad exempeldata
// om påhittade personer, och får därför en egen exempelkälla
// (`exampleSource`, datatypen "example": taggen säger "Exempel · Påhittad
// data, steg 04"). PR 10 tog bort dem helt, eftersom de då lånade en
// poängdels eller registrets källa; det felet får inte komma tillbaka.
//
// Exempelkällorna finns bara i demot. En live-hopsamling för /app får aldrig
// använda dem: saknas verkligt underlag visas luckan.

const STEP_NUMBERS = [1, 2, 4, 6, 7, 8, 11, 12] as const;
type PlanStepNumber = (typeof STEP_NUMBERS)[number];
type StepMap = Partial<Record<PlanStepNumber, JourneyStepDetail>>;

/** Stegets höjdpunkter som exempelpåståenden, med stegets egen exempelkälla. */
function highlightCheck(locale: Locale, steps: StepMap, stepNumber: PlanStepNumber): BusinessPlanCheck {
  const step = steps[stepNumber];
  const claims: BusinessPlanClaim[] =
    step && step.status !== "locked"
      ? step.highlights.map((text) => ({ text, source: exampleSource(locale, { step: stepNumber }), dataType: "example" as const }))
      : [];
  return { claims, requiredStepNumber: stepNumber };
}

// --- Avsnitt 1: Affärsidén (steg 01–02, eller idégenomlysningens skarpare idé) ---
function ideaSection(locale: Locale, steps: StepMap, ideaScreening: IdeaScreening | null): BusinessPlanSectionInput {
  if (!ideaScreening) {
    return { id: "idea", checks: [highlightCheck(locale, steps, 1), highlightCheck(locale, steps, 2)] };
  }
  // Registerfakta och den skarpare idéns motivering är påhittade: exempelkälla.
  const claims: BusinessPlanClaim[] = [
    {
      text: ideaScreening.sharperIdea.why,
      value: ideaScreening.sharperIdea.name,
      source: exampleSource(locale, "ideaScreening"),
      dataType: "example",
    },
    ...ideaScreening.registerFacts.map((fact) => ({
      text: fact.label,
      value: fact.value,
      source: exampleSource(locale, "ideaScreening"),
      dataType: "example" as const,
    })),
  ];
  return { id: "idea", checks: [highlightCheck(locale, steps, 1), { claims, requiredStepNumber: 2 }] };
}

// --- Avsnitt 2: Kunden och problemet (steg 04 kundprofil, steg 05 svaren) ---
function customerAndProblemSection(locale: Locale, steps: StepMap, verdictReport: VerdictReport | null): BusinessPlanSectionInput {
  // Citaten bär utskickets källa. Kundprofilen (steg 04:s höjdpunkter) är exempeldata.
  const quoteClaims: BusinessPlanClaim[] = verdictReport
    ? verdictReport.quotes.map((quote) => ({ text: quote.quote, value: quote.companyName, source: quote.source, dataType: "customer" as const }))
    : [];

  return {
    id: "customerAndProblem",
    checks: [highlightCheck(locale, steps, 4), { claims: quoteClaims, requiredStepNumber: 5 }],
  };
}

// --- Avsnitt 3: Marknaden (steg 03, registret, alltid med täckning) ---
function marketSection(t: Dictionary, locale: Locale, market: MarketOverview | null, ideaScreening: IdeaScreening | null): BusinessPlanSectionInput {
  let overviewClaims: BusinessPlanClaim[] = [];
  let coverageClaims: BusinessPlanClaim[] = [];
  const copy = t.businessPlanPage;
  const percent = (value: number) => fill(copy.percentValueTemplate, { value: formatCount(value, locale) });

  if (market) {
    const basis = market.basis;
    // Registersiffrorna i demot är påhittade: exempelkälla, aldrig registrets
    // (samma som Marknad-sidan i demot).
    const marketSource = exampleSource(locale, { step: 3 });
    overviewClaims = [
      { text: t.marketPage.companyCountLabel, value: formatCount(market.companyCount, locale), source: marketSource, dataType: "example" },
      // Medianomsättningen tas inte med: demodatan bär inget räkenskapsår, och
      // utan år visas luckan, aldrig siffran (PR 8 och 9, docs/plan-en-design.md).
    ];
    // Ett underlag på 0 bolag betyder "okänt" (RegistryProvider): andelen visas inte.
    if (basis?.growthCompanies !== 0) {
      overviewClaims.push({ text: t.marketPage.growthShareLabel, value: percent(market.growthSharePercent), source: marketSource, dataType: "example" });
    }
    if (basis?.regionCompanies !== 0) {
      overviewClaims.push({ text: t.marketPage.regionShareLabel, value: percent(market.regionSharePercent), source: marketSource, dataType: "example" });
    }
    if (basis && basis.growthCompanies > 0 && basis.regionCompanies > 0) {
      // Varje andel har sitt eget urval av helheten, t.ex. "tillväxt: 171 av
      // 312, region: 308 av 312" — aldrig "171/308", som ser ut som ett urval
      // men blandar två.
      coverageClaims = [
        {
          text: t.marketPage.basedOnLabel,
          value: fill(copy.coverageValueTemplate, {
            growth: formatCount(basis.growthCompanies, locale),
            region: formatCount(basis.regionCompanies, locale),
            total: formatCount(market.companyCount, locale),
          }),
          source: marketSource,
          dataType: "example",
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
      source: exampleSource(locale, "ideaScreening"),
      dataType: "example",
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

// --- Avsnitt 4: Konkurrensen (steg 03) ---
// Konkurrenternas beskrivningar ("dyrt och tungt att införa") är bedömningar,
// inte registeruppgifter: de bär en exempelkälla, aldrig registrets.
function competitionSection(locale: Locale, market: MarketOverview | null): BusinessPlanSectionInput {
  const claims: BusinessPlanClaim[] = (market?.competitors ?? []).map((competitor) => ({
    text: competitor.description,
    value: competitor.name,
    source: exampleSource(locale, { step: 3 }),
    dataType: "example",
  }));
  return { id: "competition", checks: [{ claims, requiredStepNumber: 3 }] };
}

/** Domen bygger på utskickets svar: citatens källa är dess källa. Utan citat finns ingen. */
function verdictSource(report: VerdictReport): Källa | undefined {
  return report.quotes[0]?.source;
}

// --- Avsnitt 5: Erbjudandet och priset (steg 07, prövat mot steg 05) ---
function offerAndPriceSection(locale: Locale, steps: StepMap, verdictReport: VerdictReport | null): BusinessPlanSectionInput {
  const stats = verdictReport?.verdict.stats;
  const priceTested = stats ? stats.priceAccepted + stats.priceDeclined : 0;
  const source = verdictReport ? verdictSource(verdictReport) : undefined;
  const validationClaims: BusinessPlanClaim[] =
    verdictReport && priceTested > 0 && source
      ? [{ text: verdictReport.presentation.reasoning, value: verdictReport.presentation.headline, source, dataType: "customer" }]
      : [];

  // Steg 07:s kalkyl (höjdpunkterna) är exempeldata.
  return {
    id: "offerAndPrice",
    checks: [highlightCheck(locale, steps, 7), { claims: validationClaims, requiredStepNumber: 5 }],
  };
}

// --- Avsnitt 6: Beviset (domen i steg 06, antagandena med utfall) ---
function evidenceSection(
  locale: Locale,
  steps: StepMap,
  verdictReport: VerdictReport | null,
  ideaScreening: IdeaScreening | null,
): BusinessPlanSectionInput {
  const source = verdictReport ? verdictSource(verdictReport) : undefined;
  let verdictClaims: BusinessPlanClaim[] = [];
  const stepVerdict = steps[6]?.status !== "locked" ? steps[6]?.verdict : null;
  if (verdictReport && source) {
    verdictClaims = [
      { text: verdictReport.presentation.reasoning, value: verdictReport.presentation.headline, source, dataType: "customer" },
      ...verdictReport.quotes.map((quote) => ({ text: quote.quote, value: quote.companyName, source: quote.source, dataType: "customer" as const })),
    ];
  } else if (stepVerdict) {
    // Stegets dom utan utskick bakom sig (t.ex. Jonas) är exempeldata.
    verdictClaims = [{ text: stepVerdict.reasoning, value: stepVerdict.headline, source: exampleSource(locale, { step: 6 }), dataType: "example" }];
  }

  // Idégenomlysningens antaganden är exempeldata, inga registeruppgifter.
  const assumptionClaims: BusinessPlanClaim[] = (ideaScreening?.assumptions ?? []).map((assumption) => ({
    text: assumption.text,
    source: exampleSource(locale, "ideaScreening"),
    dataType: "example",
  }));

  return {
    id: "evidence",
    checks: [
      { claims: verdictClaims, requiredStepNumber: 6 },
      { claims: assumptionClaims, requiredStepNumber: 6 },
    ],
  };
}

// --- Avsnitt 7: Genomförandet (steg 08 omfånget, steg 11 planen) ---
function executionSection(locale: Locale, steps: StepMap, buildSpec: ByggBrief | null): BusinessPlanSectionInput {
  // Byggspecens underlag bär var sin källa (kundsamtalen). Utan spec, och för
  // steg 11:s plan, är stegens höjdpunkter exempeldata.
  const scopeClaims: BusinessPlanClaim[] = (buildSpec?.underlag ?? []).map((bevis) => ({
    text: bevis.påstående,
    source: bevis.källa,
    dataType: "customer" as const,
  }));

  return {
    id: "execution",
    checks: [
      scopeClaims.length > 0 ? { claims: scopeClaims, requiredStepNumber: 8 } : highlightCheck(locale, steps, 8),
      highlightCheck(locale, steps, 11),
    ],
  };
}

// --- Avsnitt 8: Ekonomin (steg 07 kalkylen, steg 12) ---
function economySection(locale: Locale, steps: StepMap): BusinessPlanSectionInput {
  return { id: "economy", checks: [highlightCheck(locale, steps, 7), highlightCheck(locale, steps, 12)] };
}

// --- Avsnitt 9: Riskerna (motsagda antaganden, låsta poängdelar) ---
// Förslagens förklaringar ("3 av 9 säger nej till priset …") är exempeldata med
// egen exempelkälla, aldrig poängdelens. De låsta delarna visas som förut.
function risksSection(locale: Locale, suggestions: ScoreSuggestion[], lockedParts: LockedScorePart[]): BusinessPlanSectionInput {
  const byGap = (gapType: ScoreSuggestion["gapType"]): BusinessPlanClaim[] =>
    suggestions
      .filter((suggestion) => suggestion.gapType === gapType)
      .map((suggestion) => ({
        text: suggestion.explanation,
        value: suggestion.label,
        source: exampleSource(locale, "suggestions"),
        dataType: "example",
      }));
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

  return buildBusinessPlan([
    ideaSection(locale, steps, ideaScreening),
    customerAndProblemSection(locale, steps, verdictReport),
    marketSection(t, locale, market, ideaScreening),
    competitionSection(locale, market),
    offerAndPriceSection(locale, steps, verdictReport),
    evidenceSection(locale, steps, verdictReport, ideaScreening),
    executionSection(locale, steps, buildSpec),
    economySection(locale, steps),
    risksSection(locale, suggestions, scoreSnapshot.lockedParts),
  ]);
}
