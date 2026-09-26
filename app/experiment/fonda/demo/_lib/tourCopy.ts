import type { Locale } from "@/i18n/context";
import type { TourStep } from "@/adapters/demo/tourSteps";

// Kopians egna rubriker på rundturens stopp. Det riktiga demots texter i
// adapters/demo/tourSteps.ts är orörda; här skrivs de över per stopp-id.
// Rubrikerna säger rakt vad besökaren ser på stoppet, med siffror och namn
// där de finns. Stopp 1 behåller originalets rubrik.
//
// Stopp 10 har också ny brödtext: originalet nämnde 4 % svarsfrekvens,
// men skärmen visar 9 svar av 20 (45 %).

type Copy = Record<Locale, string>;

export const FONDA_TOUR_TITLES: Record<string, Copy> = {
  "tva-ingangar": { sv: "Börja med eller utan idé", en: "Start with or without an idea" },
  "medgrundaren-verktyg": {
    sv: "Medgrundaren hämtar siffror från Bolagsverket",
    en: "The co-founder pulls numbers from Bolagsverket",
  },
  "poangen-mater-bevis": { sv: "Poängen startar på 6 av 100", en: "The score starts at 6 out of 100" },
  "taket-pa-30": { sv: "Utan kundsvar stannar poängen under 30", en: "Without replies, the score stays under 30" },
  dataloftet: { sv: "312 byråer, varje siffra med källa", en: "312 firms, every number sourced" },
  registret: { sv: "Tre namngivna konkurrenter ur registret", en: "Three named competitors from the registry" },
  hiasynth: { sv: "Hiasynth-simuleringen ger inga poäng", en: "The Hiasynth simulation earns no points" },
  "spark-skickar-mejlen": { sv: "Spark mejlade 20 byråer från Saras Gmail", en: "Spark emailed 20 firms from Sara's Gmail" },
  "svarsdata-forsvarsvall": { sv: "Nio byråer svarade, citerade med namn", en: "Nine firms replied, quoted by name" },
  "poangen-kan-sjunka": { sv: "Poängen sjönk från 47 till 43", en: "The score dropped from 47 to 43" },
  domen: { sv: "Domen blev Förfina", en: "The verdict is Refine" },
  "svensk-kalkyl": { sv: "Priset landar på 1 190 kr/mån", en: "The price lands at SEK 1,190/mo" },
  "poangen-i-kod": { sv: "Åtta delar ger 60 av 100", en: "Eight parts add up to 60 out of 100" },
  "forslag-och-luckor": { sv: "Snabbaste poängen står överst", en: "The quickest points come first" },
  "juridisk-koll": { sv: "Juridiken för just Saras bolag", en: "The legal checks for Sara's company" },
  lovable: { sv: "Lovable bygger sidan sist", en: "Lovable builds the page last" },
  pulsen: { sv: "Dagliga marknadssignaler om Saras bransch", en: "Daily market signals for Sara's industry" },
  affarsmodellen: { sv: "199 kr i månaden, bygget kostar extra", en: "SEK 199 a month, the build costs extra" },
  avslutning: { sv: "Klart. Nu kan du utforska själv", en: "Done. Now explore on your own" },
};

export const FONDA_TOUR_BODIES: Record<string, Copy> = {
  "svarsdata-forsvarsvall": {
    sv: "Svaren citeras rakt av, med namn. Med egen svarsdata kan Spark jämföra Saras svarsfrekvens med andra utskick i samma bransch, en jämförelse ingen konkurrent har underlag för.",
    en: "Responses are quoted verbatim, by name. With its own response data, Spark can compare Sara's response rate with other outreach in the same industry, a comparison no competitor has the data for.",
  },
};

/** Rubrik och brödtext för ett stopp i kopian. */
export function fondaTourCopy(step: TourStep, locale: Locale): { title: string; body: string } {
  return {
    title: (FONDA_TOUR_TITLES[step.id] ?? step.title)[locale],
    body: (FONDA_TOUR_BODIES[step.id] ?? step.body)[locale],
  };
}
