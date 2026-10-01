import type { Locale } from "@/i18n/context";
import type { TourStep } from "@/adapters/demo/tourSteps";

// Demots egna rubriker på rundturens stopp. Det riktiga demots texter i
// adapters/demo/tourSteps.ts är orörda; här skrivs de över per stopp-id.
// Rubrikerna säger rakt vad besökaren ser på stoppet, med siffror och namn
// där de finns. Stopp 1 behåller originalets rubrik.
//
// Stopp 10 har också ny brödtext: originalet nämnde 4 % svarsfrekvens,
// men skärmen visar 9 svar av 20 (45 %). Stopp 3, 5, 6 och 7 har ny brödtext
// som inte påstår att demots påhittade siffror kommer ur ett register, och
// stopp 19 har /priser-sidans pris (249 kr, bygget ingår) i stället för 199 kr.

type Copy = Record<Locale, string>;

export const TOUR_TITLES: Record<string, Copy> = {
  "tva-ingangar": { sv: "Börja med eller utan idé", en: "Start with or without an idea" },
  "medgrundaren-verktyg": {
    sv: "Medgrundaren hämtar marknadssiffrorna",
    en: "The co-founder pulls the market numbers",
  },
  "poangen-mater-bevis": { sv: "Poängen startar på 6 av 100", en: "The score starts at 6 out of 100" },
  "taket-pa-30": { sv: "Utan kundsvar stannar poängen under 30", en: "Without replies, the score stays under 30" },
  dataloftet: { sv: "312 byråer, varje siffra med källa", en: "312 firms, every number sourced" },
  registret: { sv: "Tre namngivna konkurrenter", en: "Three named competitors" },
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
  affarsmodellen: { sv: "249 kr i månaden, bygget ingår", en: "SEK 249 a month, the build included" },
  avslutning: { sv: "Klart. Nu kan du utforska själv", en: "Done. Now explore on your own" },
};

export const TOUR_BODIES: Record<string, Copy> = {
  "medgrundaren-verktyg": {
    sv: "Varje samtal slutar med att ett verktyg körs — här hämtar Spark marknadssiffrorna åt Sara, inte bara ett tips om vad hon borde kolla upp.",
    en: "Every conversation ends with a tool run — here Spark pulls the market numbers for Sara, not just a tip on what she should look up.",
  },
  "taket-pa-30": {
    sv: "Sara har nu marknads- och kundunderlag, men poängen (27) kan ändå inte gå över 30 — Spark tillåter inte betyget \"bevisat\" förrän ett enda riktigt kundsvar finns.",
    en: "Sara now has market and customer data, but the score (27) still can't pass 30 — Spark won't call anything \"proven\" until a single real customer has responded.",
  },
  dataloftet: {
    sv: "312 byråer, 18 % tillväxt — i Spark bär varje tal en källa och ett datum. I demot är siffrorna påhittade, och taggen säger det.",
    en: "312 firms, 18% growth — in Spark every number carries a source and a date. In the demo the numbers are made up, and the tag says so.",
  },
  registret: {
    sv: "Varje aktiebolag i Sverige lämnar en offentlig årsredovisning. När Sara har kopplat sitt företag bygger Spark konkurrentbilden på dem i stället för på en gissning. Här är de tre byråerna påhittade.",
    en: "Every limited company in Sweden files a public annual report. Once Sara has connected her company, Spark builds the competitor picture on them instead of a guess. Here the three firms are made up.",
  },
  affarsmodellen: {
    sv: "Först en gratis provvecka. Sedan låser Grundare-nivån, 249 kr i månaden, upp hela resan med bygget, full Puls och juridisk koll. Tar gnistorna till bygget slut fyller man på för 99 kr.",
    en: "First a free trial week. Then the Founder tier, SEK 249 a month, unlocks the whole journey including the build, the full Pulse and legal checks. If the build sparks run out, a top-up costs SEK 99.",
  },
  "svarsdata-forsvarsvall": {
    sv: "Svaren citeras rakt av, med namn. Med egen svarsdata kan Spark jämföra Saras svarsfrekvens med andra utskick i samma bransch, en jämförelse ingen konkurrent har underlag för.",
    en: "Responses are quoted verbatim, by name. With its own response data, Spark can compare Sara's response rate with other outreach in the same industry, a comparison no competitor has the data for.",
  },
};

/** Rubrik och brödtext för ett stopp i demot. */
export function demoTourCopy(step: TourStep, locale: Locale): { title: string; body: string } {
  return {
    title: (TOUR_TITLES[step.id] ?? step.title)[locale],
    body: (TOUR_BODIES[step.id] ?? step.body)[locale],
  };
}
