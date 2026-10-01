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
 *   Bolagsverket, verksamt.se och Bokföringsnämnden (BFN). Två ämnen stämde
 *   bara delvis och har fått nya texter: `aktiekapital` (bankintyg eller
 *   revisorsyttrande beror på om aktierna betalas med pengar eller egendom,
 *   det är inget fritt val) och `bolagsavtal` (rekommenderas, inget formellt
 *   krav).
 * - KONTROLLERADE AV EN MÄNNISKA i webbläsaren 2026-10-01: alla källor från
 *   Skatteverket, IMY, EUR-Lex (svensk version av GDPR-förordningen) och
 *   Konsumentverket. Fyra ämnen stämde bara delvis och har fått nya texter:
 *   `f_skatt` (FA-skatt bara för enskild näringsverksamhet), `moms`
 *   (gränsen 120 000 kr), `gdpr_register` (undantaget under 250 anställda
 *   har egna undantag) och `konsument_angerratt` (gäller konsumenter som
 *   köper av företag).
 * - Alla kontrollerade källor pekar på de undersidor där uppgiften står, inte
 *   på startsidorna.
 * - INTE KONTROLLERAD: Riksdagen (startsida, maskinellt hämtad 2026-09-17).
 *   Inget ämne använder den. Om den ska finnas kvar är inte beslutat.
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
  | "skatteverket_f_skatt"
  | "skatteverket_moms"
  | "skatteverket_arbetsgivare"
  | "verksamt_handelsbolag"
  | "imy_rattslig_grund"
  | "imy_register"
  | "eurlex_gdpr"
  | "konsumentverket_marknadsforing"
  | "konsumentverket_angerratt"
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
  skatteverket_f_skatt: {
    namn: "Skatteverket — F-skatt och FA-skatt",
    hämtad: "2026-10-01",
    url: "https://www.skatteverket.se/foretag/drivaforetag/startaochregistrera/fochfaskatt.4.58d555751259e4d661680006355.html",
  },
  skatteverket_moms: {
    namn: "Skatteverket — registrera ditt företag för moms",
    hämtad: "2026-10-01",
    url: "https://www.skatteverket.se/foretag/moms/momsregistrering/registreradittforetagformoms.4.deeebd105a602bfe38000256.html",
  },
  skatteverket_arbetsgivare: {
    namn: "Skatteverket — ditt ansvar som arbetsgivare",
    hämtad: "2026-10-01",
    url: "https://www.skatteverket.se/foretag/arbetsgivare/arbetsgivarregistrering/dittansvarsomarbetsgivare.4.361dc8c15312eff6fd16ec2.html",
  },
  verksamt_handelsbolag: {
    namn: "verksamt.se (Bolagsverket, Skatteverket och Tillväxtverket) — handelsbolag",
    hämtad: "2026-09-30",
    url: "https://verksamt.se/starta-foretag/valj-foretagsform/handelsbolag",
  },
  imy_rattslig_grund: {
    namn: "Integritetsskyddsmyndigheten (IMY) — rättslig grund",
    hämtad: "2026-10-01",
    url: "https://www.imy.se/verksamhet/dataskydd/det-har-galler-enligt-gdpr/rattslig-grund/",
  },
  imy_register: {
    namn: "Integritetsskyddsmyndigheten (IMY) — föra register över behandling",
    hämtad: "2026-10-01",
    url: "https://www.imy.se/verksamhet/dataskydd/det-har-galler-enligt-gdpr/fora-register-over-behandling/",
  },
  eurlex_gdpr: {
    namn: "EUR-Lex — förordning (EU) 2016/679 (GDPR), svensk version",
    hämtad: "2026-10-01",
    url: "https://eur-lex.europa.eu/legal-content/SV/TXT/?uri=CELEX:32016R0679",
  },
  konsumentverket_marknadsforing: {
    namn: "Konsumentverket — marknadsföringslagen",
    hämtad: "2026-10-01",
    url: "https://www.konsumentverket.se/lagar/marknadsforingslagen-konsument/",
  },
  konsumentverket_angerratt: {
    namn: "Konsumentverket — ångerrätt",
    hämtad: "2026-10-01",
    url: "https://www.konsumentverket.se/konsumentratt-process/angerratt/",
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
  | "gdpr_rattslig_grund"
  | "gdpr_register"
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
    källId: "skatteverket_f_skatt",
    gällerFör: ALLA_BOLAGSFORMER,
    hint: "Ansöka om F-skatt hos Skatteverket, via e-tjänsten på verksamt.se eller med blankett SKV 4620. FA-skatt finns bara för enskild näringsverksamhet; aktiebolag och handelsbolag kan aldrig ha FA-skatt.",
  },
  {
    id: "moms",
    källId: "skatteverket_moms",
    gällerFör: ALLA_BOLAGSFORMER,
    hint: "Momsregistrering hos Skatteverket krävs vid momspliktig försäljning över 120 000 kr per år. Vid högst 120 000 kr är företaget i de flesta fall undantaget men kan registrera sig frivilligt. Vissa verksamheter är momsfria.",
  },
  {
    id: "bokforing",
    källId: "bfn_bokforing",
    gällerFör: ALLA_BOLAGSFORMER,
    hint: "Bokföringsskyldighet enligt bokföringslagen, löpande bokföring och arkivering i sju år.",
  },
  {
    id: "arbetsgivare",
    källId: "skatteverket_arbetsgivare",
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
    id: "gdpr_rattslig_grund",
    källId: "imy_rattslig_grund",
    gällerFör: ALLA_BOLAGSFORMER,
    hint: "Rättslig grund för behandling av personuppgifter enligt GDPR.",
  },
  {
    id: "gdpr_register",
    källId: "imy_register",
    gällerFör: ALLA_BOLAGSFORMER,
    hint: "Register över behandlingar av personuppgifter. Huvudregeln är undantag för företag med färre än 250 anställda, men registret krävs ändå om behandlingen inte är tillfällig, innebär en risk eller gäller känsliga uppgifter.",
  },
  {
    id: "gdpr_forordningen",
    källId: "eurlex_gdpr",
    gällerFör: ALLA_BOLAGSFORMER,
    hint: "Själva GDPR-förordningens text, för den som vill läsa lagrummet direkt.",
  },
  {
    id: "marknadsforing_epost",
    källId: "konsumentverket_marknadsforing",
    gällerFör: ALLA_BOLAGSFORMER,
    hint: "Marknadsföringslagens krav vid e-postutskick och annan marknadsföring.",
  },
  {
    id: "konsument_angerratt",
    källId: "konsumentverket_angerratt",
    gällerFör: ALLA_BOLAGSFORMER,
    hint: "14 dagars ångerrätt vid distansköp gäller när en konsument köper av ett företag, inte vid alla köp. Det finns undantag.",
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
