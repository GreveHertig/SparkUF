import type { Bolagsform, Källa } from "@/core/domain";

/**
 * Kurerad referensdata för Juridisk koll (adapters/live/LegalAdvisor.ts).
 *
 * VARFÖR DEN HÄR FILEN FINNS: Gemini får aldrig hitta på en källa (CLAUDE.md,
 * avsnitt Säkerhet och Produktregler — "Källa på varje siffra", "inget
 * påstående utan källa"). Modellen väljer bara vilka `LEGAL_TOPICS` som gäller
 * för en given bolagsform och formulerar rubrik/beskrivning — själva
 * `källa`-objektet injiceras alltid från `KURERADE_KÄLLOR` här, aldrig från
 * modellens svar. Se adapters/live/legalSchema.ts och
 * adapters/live/LegalAdvisor.ts för hur det verkställs i kod.
 *
 * VERIFIERINGSSTATUS (se verifieringsloggen i docs/moduler/juridisk-koll.md):
 * - KONTROLLERADE AV EN MÄNNISKA i webbläsaren 2026-09-30: alla källor från
 *   Bolagsverket, verksamt.se och Bokföringsnämnden (BFN). De pekar på de
 *   undersidor där uppgiften står, inte på startsidorna. Två ämnen stämde
 *   bara delvis och har fått nya texter: `aktiekapital` (bankintyg eller
 *   revisorsyttrande beror på om aktierna betalas med pengar eller egendom,
 *   det är inget fritt val) och `bolagsavtal` (rekommenderas, inget formellt
 *   krav).
 * - BARA MASKINELLT HÄMTADE (av Claude Code via WebFetch 2026-09-17, inte
 *   kontrollerade av en människa, fortfarande startsidor): Skatteverket, IMY,
 *   EUR-Lex (GDPR-förordningen), Konsumentverket, Riksdagen.
 * - INGENTING ÄR JURISTGRANSKAT: vilka ämnen som gäller per bolagsform,
 *   avgifter, deadlines och lagrum. Därför har `LegalTopic` medvetet inga
 *   `kostnadKr`/`deadline`/`myndighet` — lägg bara till dem med en verifierad
 *   källa för just den siffran.
 */

export type KällId =
  | "bolagsverket_foretagsnamn"
  | "bolagsverket_starta_ab"
  | "bolagsverket_bolagsordning"
  | "bolagsverket_styrelse"
  | "bolagsverket_revisor"
  | "bolagsverket_arsredovisning_ab"
  | "bolagsverket_arsredovisning_ek_forening"
  | "bolagsverket_starta_ek_forening"
  | "skatteverket"
  | "verksamt_handelsbolag"
  | "imy"
  | "eurlex_gdpr"
  | "konsumentverket"
  | "bfn_bokforing"
  | "riksdagen";

export const KURERADE_KÄLLOR: Record<KällId, Källa> = {
  bolagsverket_foretagsnamn: {
    namn: "Bolagsverket — företagsnamn",
    hämtad: "2026-09-30",
    url: "https://bolagsverket.se/foretag/foretagsnamn.1153.html",
  },
  bolagsverket_starta_ab: {
    namn: "Bolagsverket — starta aktiebolag",
    hämtad: "2026-09-30",
    url: "https://bolagsverket.se/foretag/aktiebolag/startaaktiebolag.479.html",
  },
  bolagsverket_bolagsordning: {
    namn: "Bolagsverket — bolagsordning för aktiebolag",
    hämtad: "2026-09-30",
    url: "https://bolagsverket.se/foretag/aktiebolag/startaaktiebolag/bolagsordningforaktiebolag.483.html",
  },
  bolagsverket_styrelse: {
    namn: "Bolagsverket — styrelse och verkställande direktör i aktiebolag",
    hämtad: "2026-09-30",
    url: "https://bolagsverket.se/foretag/aktiebolag/startaaktiebolag/styrelseochverkstallandedirektoriaktiebolag.505.html",
  },
  bolagsverket_revisor: {
    namn: "Bolagsverket — revisor i aktiebolag",
    hämtad: "2026-09-30",
    url: "https://bolagsverket.se/foretag/aktiebolag/startaaktiebolag/revisoriaktiebolag.521.html",
  },
  bolagsverket_arsredovisning_ab: {
    namn: "Bolagsverket — årsredovisningsguiden för aktiebolag",
    hämtad: "2026-09-30",
    url: "https://bolagsverket.se/foretag/aktiebolag/arsredovisningforaktiebolag/arsredovisningsguidenforaktiebolag.5550.html",
  },
  bolagsverket_arsredovisning_ek_forening: {
    namn: "Bolagsverket — årsredovisningsguiden för ekonomisk förening",
    hämtad: "2026-09-30",
    url: "https://bolagsverket.se/forening/ekonomiskforening/arsredovisningforekonomiskforening/arsredovisningsguidenforekonomiskforening.5538.html",
  },
  bolagsverket_starta_ek_forening: {
    namn: "Bolagsverket — starta ekonomisk förening",
    hämtad: "2026-09-30",
    url: "https://bolagsverket.se/forening/ekonomiskforening/startaekonomiskforening.1335.html",
  },
  skatteverket: {
    namn: "Skatteverket",
    hämtad: "2026-09-17",
    url: "https://www.skatteverket.se",
  },
  verksamt_handelsbolag: {
    namn: "verksamt.se (Bolagsverket, Skatteverket och Tillväxtverket) — handelsbolag",
    hämtad: "2026-09-30",
    url: "https://verksamt.se/starta-foretag/valj-foretagsform/handelsbolag",
  },
  imy: {
    namn: "Integritetsskyddsmyndigheten (IMY)",
    hämtad: "2026-09-17",
    url: "https://www.imy.se",
  },
  eurlex_gdpr: {
    namn: "EUR-Lex — förordning (EU) 2016/679 (GDPR)",
    hämtad: "2026-09-17",
    url: "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
  },
  konsumentverket: {
    namn: "Konsumentverket",
    hämtad: "2026-09-17",
    url: "https://www.konsumentverket.se",
  },
  bfn_bokforing: {
    namn: "Bokföringsnämnden (BFN) — allmänna bokföringsfrågor",
    hämtad: "2026-09-30",
    url: "https://www.bfn.se/fragor-och-svar/bokforing/allmanna-bokforingsfragor/",
  },
  riksdagen: {
    namn: "Sveriges riksdag (svensk författningssamling)",
    hämtad: "2026-09-17",
    url: "https://www.riksdagen.se",
  },
};

const ALLA_BOLAGSFORMER: Bolagsform[] = [
  "enskild_firma",
  "aktiebolag",
  "handelsbolag",
  "ekonomisk_forening",
];

export type LegalTopicId =
  | "registrering"
  | "f_skatt"
  | "moms"
  | "bokforing"
  | "arbetsgivare"
  | "aktiekapital"
  | "bolagsordning"
  | "styrelse"
  | "revisor"
  | "arsredovisning_ab"
  | "arsredovisning_ek_forening"
  | "bolagsavtal"
  | "stadgar_medlemmar"
  | "gdpr_personuppgifter"
  | "gdpr_forordningen"
  | "marknadsforing_epost"
  | "konsument_angerratt";

export type LegalTopic = {
  id: LegalTopicId;
  källId: KällId;
  /** Auktoritativ — modellens svar filtreras mot den här listan, aldrig tvärtom. */
  gällerFör: Bolagsform[];
  /** En rad på svenska som beskriver ämnet för modellen. Ingen juridisk text i sig. */
  hint: string;
};

export const LEGAL_TOPICS: readonly LegalTopic[] = [
  {
    id: "registrering",
    källId: "bolagsverket_foretagsnamn",
    gällerFör: ALLA_BOLAGSFORMER,
    hint: "Registrera företaget och skydda företagsnamnet hos Bolagsverket.",
  },
  {
    id: "f_skatt",
    källId: "skatteverket",
    gällerFör: ALLA_BOLAGSFORMER,
    hint: "Ansöka om F-skatt (eller FA-skatt) hos Skatteverket.",
  },
  {
    id: "moms",
    källId: "skatteverket",
    gällerFör: ALLA_BOLAGSFORMER,
    hint: "Momsregistrering och löpande momsredovisning hos Skatteverket.",
  },
  {
    id: "bokforing",
    källId: "bfn_bokforing",
    gällerFör: ALLA_BOLAGSFORMER,
    hint: "Bokföringsskyldighet enligt bokföringslagen, löpande bokföring och arkivering i sju år.",
  },
  {
    id: "arbetsgivare",
    källId: "skatteverket",
    gällerFör: ALLA_BOLAGSFORMER,
    hint: "Registrera sig som arbetsgivare hos Skatteverket vid första anställningen.",
  },
  {
    id: "aktiekapital",
    källId: "bolagsverket_starta_ab",
    gällerFör: ["aktiebolag"],
    hint: "Aktiekapital, minst 25 000 kr för privat aktiebolag. Betalas aktierna med pengar krävs bankintyg; betalas de med egendom (apport) krävs ett yttrande från revisor.",
  },
  {
    id: "bolagsordning",
    källId: "bolagsverket_bolagsordning",
    gällerFör: ["aktiebolag"],
    hint: "Bolagsordning för aktiebolag.",
  },
  {
    id: "styrelse",
    källId: "bolagsverket_styrelse",
    gällerFör: ["aktiebolag"],
    hint: "Styrelse och eventuell verkställande direktör i aktiebolag.",
  },
  {
    id: "revisor",
    källId: "bolagsverket_revisor",
    gällerFör: ["aktiebolag"],
    hint: "Eventuellt revisorskrav för aktiebolag.",
  },
  {
    id: "arsredovisning_ab",
    källId: "bolagsverket_arsredovisning_ab",
    gällerFör: ["aktiebolag"],
    hint: "Årsredovisning som aktiebolaget ska skicka in till Bolagsverket varje räkenskapsår.",
  },
  {
    id: "arsredovisning_ek_forening",
    källId: "bolagsverket_arsredovisning_ek_forening",
    gällerFör: ["ekonomisk_forening"],
    hint: "Årsredovisning som den ekonomiska föreningen ska skicka in till Bolagsverket varje räkenskapsår.",
  },
  {
    id: "bolagsavtal",
    källId: "verksamt_handelsbolag",
    gällerFör: ["handelsbolag"],
    hint: "Bolagsmännen i ett handelsbolag har solidariskt ansvar för bolagets skulder. Ett skriftligt bolagsavtal rekommenderas men är inget formellt krav.",
  },
  {
    id: "stadgar_medlemmar",
    källId: "bolagsverket_starta_ek_forening",
    gällerFör: ["ekonomisk_forening"],
    hint: "Stadgar och minst tre medlemmar för en ekonomisk förening.",
  },
  {
    id: "gdpr_personuppgifter",
    källId: "imy",
    gällerFör: ALLA_BOLAGSFORMER,
    hint: "Laglig grund för personuppgiftsbehandling och register över behandlingar (GDPR i praktiken).",
  },
  {
    id: "gdpr_forordningen",
    källId: "eurlex_gdpr",
    gällerFör: ALLA_BOLAGSFORMER,
    hint: "Själva GDPR-förordningens text, för den som vill läsa lagrummet direkt.",
  },
  {
    id: "marknadsforing_epost",
    källId: "konsumentverket",
    gällerFör: ALLA_BOLAGSFORMER,
    hint: "Marknadsföringslagens krav vid e-postutskick och annan marknadsföring.",
  },
  {
    id: "konsument_angerratt",
    källId: "konsumentverket",
    gällerFör: ALLA_BOLAGSFORMER,
    hint: "Ångerrätt och andra konsumentskyddsregler vid distansavtal.",
  },
];

export const LEGAL_TOPIC_IDS: readonly LegalTopicId[] = LEGAL_TOPICS.map((topic) => topic.id);

const TOPIC_BY_ID = new Map<LegalTopicId, LegalTopic>(LEGAL_TOPICS.map((topic) => [topic.id, topic]));

export function getLegalTopic(id: LegalTopicId): LegalTopic {
  const topic = TOPIC_BY_ID.get(id);
  if (!topic) {
    throw new Error(`Okänt LegalTopicId från Gemini: "${id}". Ämnet finns inte i LEGAL_TOPICS.`);
  }
  return topic;
}

export function getLegalTopicsFor(bolagsform: Bolagsform): LegalTopic[] {
  return LEGAL_TOPICS.filter((topic) => topic.gällerFör.includes(bolagsform));
}
