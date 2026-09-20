import type { Locale } from "@/i18n/context";
import type { Källa } from "@/core/domain";
import type { OutreachProvider, CampaignRow, OutreachStatus } from "@/ports/OutreachProvider";
import { saraCompanies } from "./RegistryProvider";
import { useDemoStore } from "./demoStore";
import { getBeatAt } from "./sara";

/** Källa för svarsfrekvensen på Marknad-sidan (Datalöftet: även Sparks egen
 * utskicksdata bär en källa och ett datum) — samma datum som 05a:s "efter"
 * i sara.ts, då de sex första svaren kommit in. */
export const outreachSource: Record<Locale, Källa> = {
  sv: { namn: "Sparks utskick (Gmail)", hämtad: "2026-01-19" },
  en: { namn: "Spark's outreach (Gmail)", hämtad: "2026-01-19" },
};

/** De nio svaren (9.3 steg 05–06) — index i saraCompanies. Tre säger nej
 * till priset 2 000 kr (samtliga under 10 anställda), sex bekräftar
 * problemet och accepterar priset (samtliga 10+ anställda). */
const responses: Record<number, Record<Locale, string>> = {
  0: {
    sv: "Problemet är verkligt, men 2 000 kr i månaden är för mycket för en byrå som vår.",
    en: "The problem is real, but SEK 2,000 a month is too much for a firm our size.",
  },
  2: {
    sv: "Vi skulle betala runt 900 kr, inte 2 000.",
    en: "We'd pay around SEK 900, not 2,000.",
  },
  9: {
    sv: "Bra idé, men priset känns högt för oss just nu.",
    en: "Good idea, but the price feels high for us right now.",
  },
  5: {
    sv: "2 000 kr i månaden är inga pengar mot vad vi sparar i tid.",
    en: "SEK 2,000 a month is nothing compared to the time we'd save.",
  },
  8: {
    sv: "Skulle vilja testa det på våra tre största kunder direkt.",
    en: "We'd want to try it on our three biggest clients right away.",
  },
  10: {
    sv: "Vi lägger minst två hela dagar varje månadsskifte på att jaga kvitton. Absolut ett problem.",
    en: "We spend at least two full days every month-end chasing receipts. Absolutely a real problem.",
  },
  13: {
    sv: "Ja, definitivt ett problem — men vi vill se det i praktiken innan vi bestämmer pris.",
    en: "Yes, definitely a problem — but we want to see it in practice before we settle on a price.",
  },
  15: {
    sv: "Låter som precis det vi behöver för våra minsta kunder.",
    en: "Sounds like exactly what we need for our smallest clients.",
  },
  19: {
    sv: "Vi har testat liknande lösningar förut men ingen har varit svensk och enkel nog.",
    en: "We've tried similar solutions before but none were Swedish and simple enough.",
  },
};

// De sex som svarar först (05a-utskicket-efter) och bekräftar problemet,
// respektive de tre som svarar senare (05b-svaren-efter) och säger nej till
// priset — se responses ovan för citaten. Tillsammans de nio svaren i 9.3.
const FIRST_WAVE_INDICES = [5, 8, 10, 13, 15, 19];
const SECOND_WAVE_INDICES = [0, 2, 9];
const RESPONDED_INDICES = [...FIRST_WAVE_INDICES, ...SECOND_WAVE_INDICES];
// Öppnat men inte svarat än, synligt redan under utskicksmomentets körning.
const OPENED_BEFORE_RESPONSES = [0, 2, 5, 8, 9, 10, 13, 15];

// Uppgift 3 (Valideringen) — dom per svar, läst ur citatens faktiska
// innehåll, inte bara vilken våg svaret kom i: index 13 kom in i första
// vågen (räknas som bekräftande i poängmotorn) men häckar själv på priset
// i citatet ("innan vi bestämmer pris") — där följer domen citatet, inte
// vågen. Ingen av de nio avvisar problemet helt (även de tre som säger nej
// till priset bekräftar att problemet är verkligt) — så "avvisar" har inget
// exempel i det här scenariot, se docs/status.md.
const PARTIAL_VERDICT_INDICES = [13, 0, 2, 9];
const FIRST_WAVE_DATE_ISO = "2026-01-19";
const SECOND_WAVE_DATE_ISO = "2026-01-20";
/** Priset som testades med samtliga nio — steg 05:s enda prispunkt
 * (9.3: "priset 2 000 kr"). Motbud (t.ex. index 2:s "~900 kr") syns i
 * citatet, inte som ett eget fält. */
const PRICE_TESTED_KR = 2000;

type OutreachStage = "notSent" | "sending" | "firstWave" | "secondWave";

/** Vilket skede utskicket är i, härlett ur den aktuella beatens moment
 * (avsnitt 9.1) i stället för en enda hårdkodad beat-id-jämförelse — håller
 * sig stabil oavsett hur steg 05:s interna beats namnges. */
function stageFor(beat: ReturnType<typeof getBeatAt>): OutreachStage {
  if (beat.stepNumber < 5) return "notSent";
  if (beat.id.startsWith("05a")) {
    if (beat.momentKind === "before") return "notSent";
    if (beat.momentKind === "running") return "sending";
    return "firstWave";
  }
  if (beat.id.startsWith("05b")) {
    return beat.momentKind === "after" ? "secondWave" : "firstWave";
  }
  return "secondWave";
}

function statusFor(index: number, stage: OutreachStage): OutreachStatus {
  if (stage === "notSent") return "draft";
  if (stage === "sending") return OPENED_BEFORE_RESPONSES.includes(index) ? "opened" : "sent";
  if (stage === "firstWave") return FIRST_WAVE_INDICES.includes(index) ? "responded" : "opened";
  return RESPONDED_INDICES.includes(index) ? "responded" : "opened";
}

export const demoOutreachProvider: OutreachProvider = {
  async send() {},
  async getStatuses() {
    return {};
  },

  async getCampaign(locale: Locale) {
    const { beatIndex, entry } = useDemoStore.getState();
    // Ingen kundlista är byggd för Jonas (persona B) — jonas.ts nämner bara
    // "25 hallar" i löptext, ingen namngiven, strukturerad rad per hall.
    // Hitta inte på bolagsnamn/anställda/omsättning — ärligt tomt läge i
    // stället (screens/Validation.tsx via notInScenario-propen).
    if (entry === "hasIdea") return [];
    const beat = getBeatAt(beatIndex);
    if (beat.stepNumber < 4) return [];

    const stage = stageFor(beat);
    return saraCompanies.map((company, index): CampaignRow => {
      const status = statusFor(index, stage);
      return {
        companyName: company.name,
        sniCode: company.sniCode,
        employees: company.employees,
        revenueKsek: company.revenueKsek,
        status,
        quote: status === "responded" ? responses[index]?.[locale] : undefined,
      };
    });
  },
};

/** Utskicksperioden (steg 05, 9.3): 14 jan (utskicket) till 20 jan (sista
 * vågen med svar) — samma datum som `sara.ts`s 05a/05b-beats. */
export const outreachDateRange = { startIso: "2026-01-14", endIso: SECOND_WAVE_DATE_ISO };

/** Öppningsfrekvensen (samma tal som `sara.ts`s `SinceLastTime.openRate`
 * för steg 05) — Valideringens fjärde nyckeltal (uppgift 3): ett verkligt,
 * källbelagt jämförelsetal, i stället för ett påhittat branschsnitt som
 * inte finns som strukturerad data någonstans i demot. */
export const outreachOpenRate = 38;
export const outreachOpenRateSource: Record<Locale, Källa> = {
  sv: { namn: "Utskicket, steg 05", hämtad: "2026-01-16" },
  en: { namn: "The outreach, step 05", hämtad: "2026-01-16" },
};

export type ResponseVerdict = "confirms" | "partial";

export type ResponseCard = {
  companyName: string;
  county: string;
  employees: number;
  dateIso: string;
  quote: string;
  verdict: ResponseVerdict;
  priceTestedKr: number;
};

/** Ett kort per namngiven svarare (uppgift 3, del 3) — bolag, län, anställda,
 * datum, citat och en dom. Inget namn eller roll: ingen namngiven
 * kontaktperson finns i demodatan, bara bolagsnamn och citat (se
 * docs/status.md, rapporterat som en lucka). */
export async function getResponseCards(locale: Locale): Promise<ResponseCard[]> {
  const { beatIndex, entry } = useDemoStore.getState();
  if (entry === "hasIdea") return [];
  const beat = getBeatAt(beatIndex);
  const stage = stageFor(beat);
  if (stage !== "firstWave" && stage !== "secondWave") return [];

  const visibleIndices = stage === "firstWave" ? FIRST_WAVE_INDICES : RESPONDED_INDICES;
  return visibleIndices
    .slice()
    .sort((a, b) => a - b)
    .map((index): ResponseCard => {
      const company = saraCompanies[index];
      return {
        companyName: company.name,
        county: company.county,
        employees: company.employees,
        dateIso: FIRST_WAVE_INDICES.includes(index) ? FIRST_WAVE_DATE_ISO : SECOND_WAVE_DATE_ISO,
        quote: responses[index][locale],
        verdict: PARTIAL_VERDICT_INDICES.includes(index) ? "partial" : "confirms",
        priceTestedKr: PRICE_TESTED_KR,
      };
    });
}

export type AssumptionVerdict = "confirmed" | "contradicted";

export type ValidationAssumption = {
  id: string;
  text: string;
  verdict: AssumptionVerdict;
  basis: string;
  source: Källa;
};

/** "Antagandena som prövades" (uppgift 3, del 2) — tre antaganden, var och
 * en med en motivering som är en ordagrann mening ur `sara.ts`s steg
 * 06-text (step06NextStep.why), inte nyskriven prosa. Källan är samma
 * `källa("Kundsamtal, steg 05–06", "2026-01-23")` som redan används i
 * `BuildProvider.ts`s underlag. */
const validationAssumptionsSource: Record<Locale, Källa> = {
  sv: { namn: "Kundsamtal, steg 05–06", hämtad: "2026-01-23" },
  en: { namn: "Customer calls, steps 05–06", hämtad: "2026-01-23" },
};

export async function getValidationAssumptions(locale: Locale): Promise<ValidationAssumption[]> {
  const { beatIndex, entry } = useDemoStore.getState();
  if (entry === "hasIdea") return [];
  const beat = getBeatAt(beatIndex);
  if (beat.stepNumber < 6) return [];

  const source = validationAssumptionsSource[locale];
  const texts: Record<Locale, string>[] = [
    { sv: "Byråerna har ett verkligt kvittoproblem.", en: "The firms have a real receipt problem." },
    { sv: "Byråerna betalar 2 000 kr/mån.", en: "The firms pay SEK 2,000/month." },
    { sv: "Segmentet 5–20 anställda passar.", en: "The 5–20 employee segment fits." },
  ];
  const bases: Record<Locale, string>[] = [
    { sv: "7 av 9 bekräftar problemet.", en: "7 of 9 confirm the problem." },
    {
      sv: "3 av 9 tycker att 2 000 kr är för dyrt, median 900 kr.",
      en: "3 of 9 think SEK 2,000 is too expensive, median SEK 900.",
    },
    {
      sv: "Alla som sa ja har 10 eller fler anställda — segmentet snävades till 10–20 anställda.",
      en: "Everyone who said yes has 10 or more employees — the segment was narrowed to 10–20 employees.",
    },
  ];
  const verdicts: AssumptionVerdict[] = ["confirmed", "contradicted", "contradicted"];
  const ids = ["problemet", "priset", "segmentet"];

  return ids.map((id, index) => ({
    id,
    text: texts[index][locale],
    verdict: verdicts[index],
    basis: bases[index][locale],
    source,
  }));
}
