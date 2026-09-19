// Den guidade rundturen (avsnitt 9.2): 20 stopp skrivna för investerare,
// bundna till Saras scenario (adapters/demo/sara.ts) — rundturen tvingar
// `entry` till "noIdea" när den startas (se demoStore.ts:s `toggleTour`)
// eftersom stoppens `beatId` pekar in i Saras beats, inte Jonas kortare
// array. Innehållet hör hemma här, inte i i18n/sv.ts/en.ts, av samma skäl
// som cofounderScript.ts och sara.ts: det är scenarioinnehåll (skrivet för
// en specifik investerarpitch), inte generell gränssnittstext.
import type { Locale } from "@/i18n/context";

export type TourRoute =
  | "/demo/start"
  | "/demo/app"
  | "/demo/app/medgrundaren"
  | "/demo/app/marknad"
  | "/demo/app/kunder"
  | "/demo/app/poang"
  | "/demo/app/resan/6"
  | "/demo/app/resan/7"
  | "/demo/app/juridik"
  | "/demo/app/bygg"
  | "/demo/app/pulsen";

export type TourStep = {
  id: string;
  route: TourRoute;
  /** Saras beat-id (adapters/demo/sara.ts) att hoppa till innan stoppet
   * visas — utelämnad om stoppet inte kräver en specifik poäng/momentbild. */
  beatId?: string;
  /** `data-tour-id` på elementet som ska spotlightas — utelämnad för stopp
   * utan en naturlig skärmreferens (t.ex. affärsmodellen), som i stället
   * visas som ett centrerat kort utan spotlight. */
  target?: string;
  title: Record<Locale, string>;
  body: Record<Locale, string>;
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: "valkommen",
    route: "/demo/app",
    title: { sv: "Välkommen till Spark", en: "Welcome to Spark" },
    body: {
      sv: "Den här rundturen tar er igenom Saras resa, ett stopp i taget. Klicka Nästa för att fortsätta, eller Hoppa över när som helst.",
      en: "This tour walks you through Sara's journey, one stop at a time. Click Next to continue, or Skip tour at any point.",
    },
  },
  {
    id: "tva-ingangar",
    route: "/demo/start",
    target: "entry-cards",
    title: { sv: "Två ingångar, samma resa", en: "Two entries, the same journey" },
    body: {
      sv: "Vissa grundare har ingen idé än — Spark utgår då från personen. Andra har redan en idé, som Spark genomlyser och gör skarpare. Båda landar i samma tolvstegsresa.",
      en: "Some founders have no idea yet — Spark starts from the person. Others already have one, which Spark screens and sharpens. Both land in the same twelve-step journey.",
    },
  },
  {
    id: "medgrundaren-verktyg",
    route: "/demo/app/medgrundaren",
    beatId: "03-marknaden-korning",
    target: "cofounder-moment",
    title: { sv: "Medgrundaren kör verktyg åt dig", en: "The co-founder runs tools for you" },
    body: {
      sv: "Varje samtal slutar med att ett verktyg körs — här hämtar Spark siffror direkt ur Bolagsverket och SCB, inte bara ett tips om vad Sara borde göra.",
      en: "Every conversation ends with a tool run — here Spark fetches numbers straight from Bolagsverket and SCB, not just a tip on what Sara should do.",
    },
  },
  {
    id: "poangen-mater-bevis",
    route: "/demo/app",
    beatId: "01-om-dig-efter",
    target: "hem-kpi",
    title: { sv: "Poängen mäter bevis, inte optimism", en: "The score measures proof, not optimism" },
    body: {
      sv: "1–100, alltid synlig. Sara har precis svarat på profilfrågorna — poängen är låg (6) för att nästan inget är bevisat än, inte för att idén är dålig.",
      en: "1–100, always visible. Sara has just answered the profile questions — the score is low (6) because almost nothing is proven yet, not because the idea is bad.",
    },
  },
  {
    id: "taket-pa-30",
    route: "/demo/app",
    beatId: "04-kunden-efter",
    target: "hem-kpi",
    title: { sv: "Taket på 30 utan kundsamtal", en: "The cap at 30 without customer calls" },
    body: {
      sv: "Sara har nu register- och kundunderlag, men poängen (27) kan ändå inte gå över 30 — Spark tillåter inte betyget \"bevisat\" förrän ett enda riktigt kundsvar finns.",
      en: "Sara now has registry and customer data, but the score (27) still can't pass 30 — Spark won't call anything \"proven\" until a single real customer has responded.",
    },
  },
  {
    id: "dataloftet",
    route: "/demo/app/marknad",
    beatId: "03-marknaden-efter",
    target: "market-register",
    title: { sv: "Datalöftet: källa och datum på varje siffra", en: "The data promise: a source and a date on every number" },
    body: {
      sv: "312 byråer, 4,2 Mkr i medianomsättning, 18 % tillväxt — varje tal bär en källpill man kan klicka på. Ingen siffra i Spark är gissad.",
      en: "312 firms, SEK 4.2M median revenue, 18% growth — every number carries a clickable source pill. Nothing in Spark is guessed.",
    },
  },
  {
    id: "registret",
    route: "/demo/app/marknad",
    target: "market-competitors",
    title: { sv: "Registret finns i Sverige, knappt någon annanstans", en: "The registry exists in Sweden, almost nowhere else" },
    body: {
      sv: "Varje aktiebolag i Sverige lämnar en offentlig årsredovisning. Det gör konkurrentbilden faktisk, inte en gissning — tre namngivna byråer, ingen dominerar.",
      en: "Every Swedish limited company files a public annual report. That makes the competitive picture factual, not a guess — three named firms, none dominant.",
    },
  },
  {
    id: "hiasynth",
    route: "/demo/app/marknad",
    target: "market-simulation",
    title: { sv: "Hiasynth-lagret — ett koncept", en: "The Hiasynth layer — a concept" },
    body: {
      sv: "Ovanpå registret ligger simuleringar av en syntetisk population. Alltid märkta \"Simulering\", aldrig blandade med registerfakta, och de ger aldrig poäng. Hiasynth är ett koncept — inget partnerskap finns än.",
      en: "On top of the registry sit simulations over a synthetic population. Always labeled \"Simulation\", never mixed with registry facts, and they never earn points. Hiasynth is a concept — no partnership exists yet.",
    },
  },
  {
    id: "spark-skickar-mejlen",
    route: "/demo/app/kunder",
    beatId: "05a-utskicket-efter",
    target: "customers-table",
    title: { sv: "Spark skickar mejlen själv", en: "Spark sends the emails itself" },
    body: {
      sv: "Inte bara tips — Spark skriver och skickar den svenska outreachen från Saras egen Gmail, och bevakar öppningar och svar automatiskt.",
      en: "Not just tips — Spark writes and sends the Swedish outreach from Sara's own Gmail, and tracks opens and replies automatically.",
    },
  },
  {
    id: "svarsdata-forsvarsvall",
    route: "/demo/app/kunder",
    beatId: "05b-svaren-efter",
    target: "customers-table",
    title: { sv: "Egen svarsdata som försvarsvall", en: "Own response data as a defense" },
    body: {
      sv: "Svaren citeras rakt av, med namn. Spark kan säga \"4 % svarsfrekvens är lågt för den här branschen, normalt ser vi 11 %\" — en jämförelse ingen konkurrent har underlag för.",
      en: "Responses are quoted verbatim, by name. Spark can say \"4% response rate is low for this industry, we normally see 11%\" — a comparison no competitor has the data to make.",
    },
  },
  {
    id: "poangen-kan-sjunka",
    route: "/demo/app",
    beatId: "05b-svaren-efter",
    target: "hem-score-movement",
    title: { sv: "Poängen kan sjunka", en: "The score can fall" },
    body: {
      sv: "Tre av nio svar sa nej till priset — poängen faller från 47 till 43. Spark mjukar aldrig till en motsägelse för att hålla siffran uppe.",
      en: "Three of nine responses said no to the price — the score drops from 47 to 43. Spark never softens a contradiction just to keep the number up.",
    },
  },
  {
    id: "domen",
    route: "/demo/app/resan/6",
    beatId: "06-domen-efter",
    target: "journey-verdict",
    title: { sv: "Domen: kör, förfina eller pivotera", en: "The verdict: go, refine or pivot" },
    body: {
      sv: "Baserat på de faktiska svaren, med citat och siffror — här landar Spark i \"Förfina\", inte en gissning om vad som känns rätt.",
      en: "Based on the actual responses, with quotes and numbers — here Spark lands on \"Refine\", not a guess about what feels right.",
    },
  },
  {
    id: "svensk-kalkyl",
    route: "/demo/app/resan/7",
    beatId: "07-affarsfall-efter",
    target: "journey-highlights",
    title: { sv: "Svensk kalkyl", en: "A Swedish calculation" },
    body: {
      sv: "Prisförslaget bygger på fyra saker: vad kunderna tål, vad jämförbara aktörer tar, vad kunderna själva sagt, och vad som krävs för att gå ihop med moms och arbetsgivaravgifter.",
      en: "The price proposal rests on four things: what customers can bear, what comparable providers charge, what customers themselves said, and what's needed to break even after VAT and payroll tax.",
    },
  },
  {
    id: "poangen-i-kod",
    route: "/demo/app/poang",
    beatId: "07-affarsfall-efter",
    target: "score-breakdown",
    title: { sv: "Poängen räknas i kod", en: "The score is calculated in code" },
    body: {
      sv: "Åtta delar, var och en med källa. Det är ingen modells bedömning — nedbrytningen går att räkna för hand från samma bevis som visas här.",
      en: "Eight parts, each with a source. It's not a model's judgment — the breakdown can be calculated by hand from the same evidence shown here.",
    },
  },
  {
    id: "forslag-och-luckor",
    route: "/demo/app/poang",
    target: "score-suggestions",
    title: { sv: "Förslagen sorteras efter poäng per minut", en: "Suggestions are ranked by points per minute" },
    body: {
      sv: "Alltid högst avkastning per insats överst. Varje förslag har en av tre luckor: för lite underlag, motsägande underlag, eller en strukturell lucka som kräver ett helt steg.",
      en: "Always the highest return per effort on top. Every suggestion has one of three gap types: not enough evidence, contradicting evidence, or a structural gap that needs a whole step.",
    },
  },
  {
    id: "juridisk-koll",
    route: "/demo/app/juridik",
    beatId: "09-det-formella-efter",
    target: "legal-map",
    title: { sv: "Juridisk koll genom hela resan", en: "Legal checks throughout the journey" },
    body: {
      sv: "En egen karta för just det här företaget, med källa till riksdagen.se, Skatteverket eller IMY — inte en generisk checklista. Dyker upp automatiskt vid steg 05, 09 och 10.",
      en: "Its own map for this specific company, sourced to riksdagen.se, the Tax Agency or the Privacy Authority — not a generic checklist. Appears automatically at steps 05, 09 and 10.",
    },
  },
  {
    id: "lovable",
    route: "/demo/app/bygg",
    beatId: "10-live-efter",
    target: "build-spec",
    title: { sv: "Bygget via Lovable — och varför det ligger sist", en: "The build, via Lovable — and why it's last" },
    body: {
      sv: "Medgrundaren skriver byggspecen ur bevisen, Lovable bygger sidan. Bygget kostar credits och kommer sist av en anledning: Spark bygger bara det bevisen redan sagt att Sara behöver. Ett koncept, inget avtal än.",
      en: "The co-founder writes the build spec from the evidence, Lovable builds the page. The build costs credits and comes last for a reason: Spark only builds what the evidence has already said Sara needs. A concept, no partnership yet.",
    },
  },
  {
    id: "pulsen",
    route: "/demo/app/pulsen",
    beatId: "12-kapital-efter",
    target: "pulse-list",
    title: { sv: "Pulsen", en: "The Pulse" },
    body: {
      sv: "En daglig svensk marknadssignal kopplad till Saras idé och kundsegment — nyregistreringar, kapitalrundor, nedläggningar — varje signal med en mening om varför den spelar roll för just henne.",
      en: "A daily Swedish market signal tied to Sara's idea and customer segment — new registrations, funding rounds, closures — each signal with a sentence on why it matters to her specifically.",
    },
  },
  {
    id: "affarsmodellen",
    route: "/demo/app/pulsen",
    title: { sv: "Affärsmodellen", en: "The business model" },
    body: {
      sv: "Prenumeration för allt utom bygget — bygget säljs separat per projekt eller credit. Grundare-nivån (199 kr/mån) låser upp hela resan, full Puls och juridisk koll.",
      en: "Subscription for everything except the build — the build is sold separately per project or credit. The Founder tier (SEK 199/mo) unlocks the full journey, full Pulse and legal checks.",
    },
  },
  {
    id: "avslutning",
    route: "/demo/app/pulsen",
    title: { sv: "Det var rundturen", en: "That's the tour" },
    body: {
      sv: "Klicka runt fritt i appen, byt ingång för att se Jonas resa, eller återställ demot för att börja om — allt speglar aktuellt läge.",
      en: "Click around the app freely, switch entry to see Jonas's journey, or reset the demo to start over — everything reflects the current state.",
    },
  },
];
