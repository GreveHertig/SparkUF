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
 * VERIFIERINGSSTATUS (2026-09-17, av Claude Code i den här sessionen):
 * - Hämtade och bekräftade innehållsmässigt via WebFetch samma dag:
 *   Skatteverket, IMY, EUR-Lex (GDPR-förordningen), Konsumentverket,
 *   Riksdagen.
 * - KUNDE INTE hämtas i den här sessionen (nätverksfel/blockering från
 *   verktyget, inget som tyder på att adresserna är fel — det är Sveriges
 *   officiella, mångåriga myndighetsadresser): Bolagsverket, verksamt.se,
 *   Bokföringsnämnden (BFN). Kontrollera manuellt innan lansering.
 * - INTE juridiskt sakgranskat: vilka ämnen som faktiskt gäller per
 *   bolagsform, exakta avgifter, deadlines och lagrum. Se
 *   docs/moduler/juridisk-koll.md, "TODO (jag verifierar detta)". Därför har
 *   `LegalTopic` medvetet inga `kostnadKr`/`deadline`/`myndighet` ännu — lägg
 *   bara till dem med en verifierad källa för just den siffran.
 */

export type KällId =
  | "bolagsverket"
  | "skatteverket"
  | "verksamt"
  | "imy"
  | "eurlex_gdpr"
  | "konsumentverket"
  | "bfn"
  | "riksdagen";

export const KURERADE_KÄLLOR: Record<KällId, Källa> = {
  bolagsverket: {
    namn: "Bolagsverket",
    hämtad: "2026-09-17",
    url: "https://bolagsverket.se",
  },
  skatteverket: {
    namn: "Skatteverket",
    hämtad: "2026-09-17",
    url: "https://www.skatteverket.se",
  },
  verksamt: {
    namn: "verksamt.se (Bolagsverket, Skatteverket och Tillväxtverket)",
    hämtad: "2026-09-17",
    url: "https://www.verksamt.se",
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
  bfn: {
    namn: "Bokföringsnämnden (BFN)",
    hämtad: "2026-09-17",
    url: "https://www.bfn.se",
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
  | "bolagsordning_styrelse"
  | "arsredovisning"
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
    källId: "bolagsverket",
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
    källId: "bfn",
    gällerFör: ALLA_BOLAGSFORMER,
    hint: "Bokföringsskyldighet enligt bokföringslagen, löpande bokföring och arkivering.",
  },
  {
    id: "arbetsgivare",
    källId: "skatteverket",
    gällerFör: ALLA_BOLAGSFORMER,
    hint: "Registrera sig som arbetsgivare hos Skatteverket vid första anställningen.",
  },
  {
    id: "aktiekapital",
    källId: "bolagsverket",
    gällerFör: ["aktiebolag"],
    hint: "Aktiekapital och bankintyg (eller revisorsintyg) vid bildande av aktiebolag.",
  },
  {
    id: "bolagsordning_styrelse",
    källId: "bolagsverket",
    gällerFör: ["aktiebolag"],
    hint: "Bolagsordning, styrelse och eventuellt revisorskrav för aktiebolag.",
  },
  {
    id: "arsredovisning",
    källId: "bolagsverket",
    gällerFör: ["aktiebolag", "ekonomisk_forening"],
    hint: "Årsredovisning som ska skickas in till Bolagsverket varje räkenskapsår.",
  },
  {
    id: "bolagsavtal",
    källId: "verksamt",
    gällerFör: ["handelsbolag"],
    hint: "Bolagsavtal mellan bolagsmän och solidariskt ansvar i handelsbolag.",
  },
  {
    id: "stadgar_medlemmar",
    källId: "bolagsverket",
    gällerFör: ["ekonomisk_forening"],
    hint: "Stadgar och minsta antal medlemmar för en ekonomisk förening.",
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
