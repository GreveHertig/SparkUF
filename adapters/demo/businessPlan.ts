// Affärsplanen (docs/uppdrag.md avsnitt 15) — hopsamlingen ur de befintliga
// portsnapshotsen som core/businessPlan.ts sedan avgör status på. Ingen ny
// port, ingen ny datakälla: bara Bevisen, Registret, Domen, Projektet och
// Bygget, precis som redan används av Hem/Marknad/Validering/Bygg. Resans
// höjdpunkter används inte längre: de bär ingen egen källa (se källregeln nedan).
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
import type { MarketOverview } from "@/ports/RegistryProvider";
import type { VerdictReport } from "@/ports/VerdictProvider";
import type { IdeaScreening } from "@/ports/ProjectRepository";
import { demoEvidenceRepository } from "./EvidenceRepository";
import { demoRegistryProvider } from "./RegistryProvider";
import { demoVerdictProvider } from "./VerdictProvider";
import { demoProjectRepository } from "./ProjectRepository";
import { demoBuildProvider } from "./BuildProvider";
import { useDemoStore } from "./demoStore";

const dictionaries: Record<Locale, Dictionary> = { sv, en };

// Källregeln (PR 10, docs/status.md): ett påstående visas bara med sin egen,
// verkliga källa. Stegens höjdpunkter (`JourneyStepDetail.highlights`),
// förslagens förklaringar (`ScoreSuggestion.explanation`), den skarpare
// idéns motivering och idégenomlysningens antaganden bär ingen källa i sina
// portar. De lånade tidigare en poängdels eller registrets källa, vilket fick
// dem att se belagda ut. Nu tas de inte med: kontrollpunkten står kvar utan
// påståenden, så avsnittets status sjunker och luckan visas ("Underlag saknas
// — kommer från steg N"). Ingen källa hittas på för att rädda ett avsnitt.
// `BusinessPlanClaim.source` är obligatorisk (core/businessPlan.ts), så ett
// påstående utan källa kan inte visas alls.

/** En kontrollpunkt vars underlag saknar egen källa i porten — alltid en lucka. */
function unsourced(requiredStepNumber: number): BusinessPlanCheck {
  return { claims: [], requiredStepNumber };
}

// --- Avsnitt 1: Affärsidén (steg 01–02, eller idégenomlysningens registerfakta) ---
function ideaSection(ideaScreening: IdeaScreening | null): BusinessPlanSectionInput {
  // Registerfakta bär var sin källa. Den skarpare idéns motivering gör det inte.
  const registerClaims: BusinessPlanClaim[] = (ideaScreening?.registerFacts ?? []).map((fact) => ({
    text: fact.label,
    value: fact.value,
    source: fact.source,
    dataType: "register",
  }));
  return {
    id: "idea",
    checks: [unsourced(1), ideaScreening ? { claims: registerClaims, requiredStepNumber: 2 } : unsourced(2)],
  };
}

// --- Avsnitt 2: Kunden och problemet (steg 04 kundprofil, steg 05 svaren) ---
function customerAndProblemSection(verdictReport: VerdictReport | null): BusinessPlanSectionInput {
  // Citaten bär utskickets källa. Kundprofilen (steg 04:s höjdpunkter) har ingen egen.
  const quoteClaims: BusinessPlanClaim[] = verdictReport
    ? verdictReport.quotes.map((quote) => ({ text: quote.quote, value: quote.companyName, source: quote.source, dataType: "customer" as const }))
    : [];

  return {
    id: "customerAndProblem",
    checks: [unsourced(4), { claims: quoteClaims, requiredStepNumber: 5 }],
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
    overviewClaims = [
      { text: t.marketPage.companyCountLabel, value: formatCount(market.companyCount, locale), source: market.source, dataType: "register" },
      // Medianomsättningen tas inte med: demodatan bär inget räkenskapsår, och
      // utan år visas luckan, aldrig siffran (PR 8 och 9, docs/plan-en-design.md).
    ];
    // Ett underlag på 0 bolag betyder "okänt" (RegistryProvider): andelen visas inte.
    if (basis?.growthCompanies !== 0) {
      overviewClaims.push({ text: t.marketPage.growthShareLabel, value: percent(market.growthSharePercent), source: market.source, dataType: "register" });
    }
    if (basis?.regionCompanies !== 0) {
      overviewClaims.push({ text: t.marketPage.regionShareLabel, value: percent(market.regionSharePercent), source: market.source, dataType: "register" });
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

// --- Avsnitt 4: Konkurrensen (steg 03) ---
// Konkurrenternas beskrivningar ("dyrt och tungt att införa") är bedömningar,
// inte registeruppgifter, men bar registrets källa. Ingen annan källa finns i
// porten, så de tas inte med.
function competitionSection(): BusinessPlanSectionInput {
  return { id: "competition", checks: [unsourced(3)] };
}

/** Domen bygger på utskickets svar: citatens källa är dess källa. Utan citat finns ingen. */
function verdictSource(report: VerdictReport): Källa | undefined {
  return report.quotes[0]?.source;
}

// --- Avsnitt 5: Erbjudandet och priset (steg 07, prövat mot steg 05) ---
function offerAndPriceSection(verdictReport: VerdictReport | null): BusinessPlanSectionInput {
  const stats = verdictReport?.verdict.stats;
  const priceTested = stats ? stats.priceAccepted + stats.priceDeclined : 0;
  const source = verdictReport ? verdictSource(verdictReport) : undefined;
  const validationClaims: BusinessPlanClaim[] =
    verdictReport && priceTested > 0 && source
      ? [{ text: verdictReport.presentation.reasoning, value: verdictReport.presentation.headline, source, dataType: "customer" }]
      : [];

  // Steg 07:s kalkyl (höjdpunkterna) har ingen egen källa.
  return {
    id: "offerAndPrice",
    checks: [unsourced(7), { claims: validationClaims, requiredStepNumber: 5 }],
  };
}

// --- Avsnitt 6: Beviset (domen i steg 06, antagandena med utfall) ---
function evidenceSection(verdictReport: VerdictReport | null): BusinessPlanSectionInput {
  const source = verdictReport ? verdictSource(verdictReport) : undefined;
  const verdictClaims: BusinessPlanClaim[] =
    verdictReport && source
      ? [
          { text: verdictReport.presentation.reasoning, value: verdictReport.presentation.headline, source, dataType: "customer" },
          ...verdictReport.quotes.map((quote) => ({ text: quote.quote, value: quote.companyName, source: quote.source, dataType: "customer" as const })),
        ]
      : [];

  // Idégenomlysningens antaganden bar registrets källa, men är inga
  // registeruppgifter. Ingen annan källa finns, så de tas inte med.
  return {
    id: "evidence",
    checks: [{ claims: verdictClaims, requiredStepNumber: 6 }, unsourced(6)],
  };
}

// --- Avsnitt 7: Genomförandet (steg 08 omfånget, steg 11 planen) ---
function executionSection(buildSpec: ByggBrief | null): BusinessPlanSectionInput {
  // Byggspecens underlag bär var sin källa (kundsamtalen). Steg 11:s plan gör det inte.
  const scopeClaims: BusinessPlanClaim[] = (buildSpec?.underlag ?? []).map((bevis) => ({
    text: bevis.påstående,
    source: bevis.källa,
    dataType: "customer" as const,
  }));

  return {
    id: "execution",
    checks: [{ claims: scopeClaims, requiredStepNumber: 8 }, unsourced(11)],
  };
}

// --- Avsnitt 8: Ekonomin (steg 07 kalkylen, steg 12) ---
function economySection(): BusinessPlanSectionInput {
  return { id: "economy", checks: [unsourced(7), unsourced(12)] };
}

// --- Avsnitt 9: Riskerna (motsagda antaganden, låsta poängdelar) ---
// Förslagens förklaringar ("3 av 9 säger nej till priset …") bar poängdelens
// källa, inte sin egen. De tas inte med; de låsta delarna visas som förut.
function risksSection(lockedParts: LockedScorePart[]): BusinessPlanSectionInput {
  return { id: "risks", checks: [unsourced(5), unsourced(6)], lockedParts };
}

/**
 * Sätter samman Affärsplanen för den aktiva personan och det aktuella
 * momentet (`useDemoStore`) — samma reaktiva mönster som övriga
 * demoadaptrar (beatIndex/entry avgör vad som redan finns att visa).
 */
export async function getBusinessPlan(locale: Locale): Promise<BusinessPlan> {
  const { entry } = useDemoStore.getState();
  const t = dictionaries[locale];

  const [scoreSnapshot, buildSpec, verdictReport] = await Promise.all([
    demoEvidenceRepository.getScoreSnapshot(locale),
    demoBuildProvider.getSpec(locale),
    demoVerdictProvider.getVerdictReport(locale),
  ]);

  const market = entry === "hasIdea" ? null : await demoRegistryProvider.getMarketOverview(locale);
  const ideaScreening = entry === "hasIdea" ? await demoProjectRepository.getIdeaScreening(locale) : null;

  return buildBusinessPlan([
    ideaSection(ideaScreening),
    customerAndProblemSection(verdictReport),
    marketSection(t, locale, market, ideaScreening),
    competitionSection(),
    offerAndPriceSection(verdictReport),
    evidenceSection(verdictReport),
    executionSection(buildSpec),
    economySection(),
    risksSection(scoreSnapshot.lockedParts),
  ]);
}
