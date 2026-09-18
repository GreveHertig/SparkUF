// Medgrundarens förskrivna dialog (uppdrag 6, 8, 10) — en chattyta som går
// att klicka igenom, med ToolRunCard när ett verktyg körs. Inga AI-anrop:
// det här är inte CofounderAgent-porten (den är till för liveadapterns
// riktiga Gemini-samtal, se ports/CofounderAgent.ts) utan en ren
// presentationsskript kopplat till Saras beats i sara.ts.
//
// Steg 01–06 har tre nycklar var (`-fore`/`-korning`/`-efter`, se
// adapters/demo/sara.ts) som speglar de tre klickbara momenten i 9.1: en kort
// teaser i "-fore", själva verktygskörningen/samtalet i "-korning", och en
// kort sammanfattning i "-efter" (fynden själva visas redan i highlights på
// Resan/[steg] och Hem — här handlar det bara om vad Medgrundaren säger).
import type { Locale } from "@/i18n/context";

export type TranscriptItem =
  | { kind: "message"; role: "founder" | "cofounder"; text: Record<Locale, string> }
  | { kind: "tool"; label: Record<Locale, string>; steps: Record<Locale, string[]> }
  | { kind: "timeSkip"; label: Record<Locale, string> };

function msg(role: "founder" | "cofounder", sv: string, en: string): TranscriptItem {
  return { kind: "message", role, text: { sv, en } };
}

function tool(labelSv: string, labelEn: string, stepsSv: string[], stepsEn: string[]): TranscriptItem {
  return { kind: "tool", label: { sv: labelSv, en: labelEn }, steps: { sv: stepsSv, en: stepsEn } };
}

function skip(sv: string, en: string): TranscriptItem {
  return { kind: "timeSkip", label: { sv, en } };
}

/** Nyckel = beat.id i adapters/demo/sara.ts. */
export const cofounderScript: Record<string, TranscriptItem[]> = {
  // --- Steg 01 · Om dig -----------------------------------------------
  "01-om-dig-fore": [
    msg(
      "cofounder",
      "Innan vi börjar behöver jag veta vem du är. Redo?",
      "Before we start, I need to know who you are. Ready?",
    ),
  ],
  "01-om-dig-korning": [
    msg("cofounder", "Vad gör du idag?", "What do you do today?"),
    msg(
      "founder",
      "Jag jobbar som redovisningsassistent på en liten byrå. Har gjort det i fyra år.",
      "I work as an accounting assistant at a small firm. I've done it for four years.",
    ),
    msg(
      "cofounder",
      "Bra. Hur mycket tid och pengar har du att lägga på det här?",
      "Good. How much time and money do you have to put into this?",
    ),
    msg("founder", "Runt 15 timmar i veckan, och 30 000 kr sparat.", "About 15 hours a week, and SEK 30,000 saved."),
    msg("cofounder", "Noterat. En sak till: kan du bygga en produkt själv?", "Noted. One more thing: can you build a product yourself?"),
    msg("founder", "Nej, ingen kodvana alls.", "No, no coding experience at all."),
    msg(
      "cofounder",
      "Det löser vi senare — Lovable bygger åt dig när det är dags. Din styrka är branschinsikten.",
      "We'll solve that later — Lovable builds it for you when the time comes. Your strength is your industry knowledge.",
    ),
    tool(
      "Sammanställer profilen",
      "Compiling the profile",
      ["Lyssnar på bakgrund", "Noterar resurser", "Sammanfattar riskaptit"],
      ["Listening to background", "Noting resources", "Summarizing risk appetite"],
    ),
  ],
  "01-om-dig-efter": [
    msg(
      "cofounder",
      "Profilen är klar. Branschinsikten är din styrka — att du inte kan bygga själv löser vi med Lovable i steg 10.",
      "The profile is done. Your industry knowledge is your strength — not being able to build it yourself gets solved by Lovable in step 10.",
    ),
  ],

  // --- Steg 02 · Möjligheter -------------------------------------------
  "02-mojligheter-fore": [
    msg(
      "cofounder",
      "Dags att hitta en idé. Jag korsar din profil mot registret.",
      "Time to find an idea. I'll cross your profile against the registry.",
    ),
  ],
  "02-mojligheter-korning": [
    tool(
      "Söker i Bolagsverkets register",
      "Searching the Bolagsverket registry",
      ["Läser profilen", "Korsar mot registret", "Rankar tre idéer"],
      ["Reading the profile", "Cross-referencing the registry", "Ranking three ideas"],
    ),
    msg(
      "cofounder",
      "Jag ser tre möjliga idéer. Den som sticker ut: automatisk insamling av kvittounderlag åt redovisningsbyråer.",
      "I see three possible ideas. The one that stands out: automatic collection of receipts for accounting firms.",
    ),
    msg("founder", "Det är precis det jag själv är trött på varje månadsskifte.", "That's exactly what I'm tired of every month-end."),
  ],
  "02-mojligheter-efter": [
    msg("cofounder", "Då kallar vi den Kvittojakten. Nästa: se vad registret säger om marknaden.", "Then we'll call it Kvittojakten. Next: see what the registry says about the market."),
  ],

  // --- Steg 03 · Marknaden -----------------------------------------------
  "03-marknaden-fore": [
    msg(
      "cofounder",
      "Dags att hämta de första riktiga siffrorna ur registret.",
      "Time to pull the first real numbers from the registry.",
    ),
  ],
  "03-marknaden-korning": [
    tool(
      "Hämtar från Bolagsverket och SCB",
      "Fetching from Bolagsverket and Statistics Sweden",
      ["Räknar byråer med SNI 69.201", "Hämtar omsättning och tillväxt", "Kartlägger konkurrenter"],
      ["Counting firms with SNI 69.201", "Fetching revenue and growth", "Mapping competitors"],
    ),
    msg(
      "cofounder",
      "312 redovisningsbyråer med 5–20 anställda. Medianomsättning 4,2 Mkr. 18 % växte mer än 10 % förra året.",
      "312 accounting firms with 5–20 employees. Median revenue SEK 4.2M. 18% grew more than 10% last year.",
    ),
    msg("founder", "Och konkurrenterna?", "And the competitors?"),
    msg(
      "cofounder",
      "Tre stycken, ingen dominerar — men jag har bara skrapat på ytan av dem så här långt. Jag har också kört en simulering — märkt Simulering, den ger aldrig poäng.",
      "Three of them, none dominant — but I've only scratched the surface on them so far. I also ran a simulation — labeled Simulation, it never earns points.",
    ),
  ],
  "03-marknaden-efter": [
    msg(
      "cofounder",
      "Marknaden ser lovande ut. Konkurrensen är upplåst nu — jag gräver djupare i den när vi bygger kundlistan.",
      "The market looks promising. Competition is unlocked now — I'll dig deeper into it when we build the customer list.",
    ),
  ],

  // --- Steg 04 · Kunden ----------------------------------------------------
  "04-kunden-fore": [
    msg("cofounder", "Nu bygger vi kundprofilen och listar namngivna byråer.", "Now let's build the customer profile and list named firms."),
  ],
  "04-kunden-korning": [
    tool(
      "Bygger kundprofilen",
      "Building the customer profile",
      ["Filtrerar på storlek och omsättning", "Namnger de 40 snabbast växande", "Fördjupar konkurrentbilden"],
      ["Filtering by size and revenue", "Naming the 40 fastest-growing", "Deepening the competitor picture"],
    ),
    msg(
      "cofounder",
      "Här är listan: 40 byråer som växer snabbast och matchar profilen.",
      "Here's the list: 40 firms that are growing fastest and match the profile.",
    ),
    msg("founder", "Kan du skriva ett mejl till dem?", "Can you write them an email?"),
    msg(
      "cofounder",
      "Ja. Men bara B2B — jag skickar aldrig till privatpersoner utan samtycke. Jag har också en simulering på vad olika stora byråer skulle kunna tänkas betala.",
      "Yes. But B2B only — I never send to individuals without consent. I've also got a simulation on what firms of different sizes might be willing to pay.",
    ),
  ],
  "04-kunden-efter": [
    msg(
      "cofounder",
      "Kundlistan är klar och konkurrensbilden fördjupad. Nästa: skicka utskicket.",
      "The customer list is done and the competitor picture is deeper. Next: send the outreach.",
    ),
  ],

  // --- Steg 05a · Samtalen (utskicket) --------------------------------------
  "05a-utskicket-fore": [
    msg("cofounder", "Dags att skicka till de 40 byråerna. Redo?", "Time to send to the 40 firms. Ready?"),
  ],
  "05a-utskicket-korning": [
    tool(
      "Skickar från din Gmail",
      "Sending from your Gmail",
      ["Skriver svenskt B2B-mejl", "Skickar till 40 byråer", "Följer öppningar"],
      ["Writing the Swedish B2B email", "Sending to 40 firms", "Tracking opens"],
    ),
    msg("cofounder", "Mejlet är ute. Om två dagar vet vi hur många som öppnat.", "The email is out. In two days we'll know how many opened it."),
    skip("2 dagar senare", "2 days later"),
    msg(
      "cofounder",
      "38 % har öppnat. Jag skickar en påminnelse om fyra dagar om det är tyst.",
      "38% have opened it. I'll send a reminder in four days if it's quiet.",
    ),
    skip("4 dagar senare", "4 days later"),
    msg("cofounder", "Påminnelsen är skickad. Nu väntar vi på svar.", "The reminder is sent. Now we wait for responses."),
  ],
  "05a-utskicket-efter": [
    tool(
      "Läser in svaren",
      "Reading the responses",
      ["Läser 6 svar", "Jämför mot problemhypotesen", "Uppdaterar Problem och Betalningsvilja"],
      ["Reading 6 responses", "Comparing against the problem hypothesis", "Updating Problem and Willingness to pay"],
    ),
    msg(
      "cofounder",
      "Sex svar har kommit in — alla bekräftar att problemet är verkligt. Problem och Betalningsvilja är upplåsta nu.",
      "Six responses have come in — all confirm the problem is real. Problem and Willingness to pay are unlocked now.",
    ),
  ],

  // --- Steg 05b · Samtalen (svaren — poängen sjunker) -----------------------
  "05b-svaren-korning": [
    skip("3 dagar senare", "3 days later"),
    msg("cofounder", "Tre svar till kom in.", "Three more responses came in."),
    tool(
      "Jämför de nya svaren",
      "Comparing the new responses",
      ["Läser de tre nya svaren", "Upptäcker: alla tre säger nej till priset", "Räknar om Betalningsvilja"],
      ["Reading the three new responses", "Finding: all three say no to the price", "Recalculating Willingness to pay"],
    ),
  ],
  "05b-svaren-efter": [
    msg("founder", "Sjunker poängen nu?", "Does the score drop now?"),
    msg(
      "cofounder",
      "Ja, från 47 till 43. Motsägande svar räknas fullt ut, och ett skevt underlag straffar delen. Det är inte ett fel — det är regeln.",
      "Yes, from 47 to 43. Contradicting responses count in full, and a skewed sample penalizes the part. That's not a bug — it's the rule.",
    ),
    msg(
      "cofounder",
      "Se Poäng-fliken för exakt uträkning: 9 − 3 gånger 0,85 är ungefär 5, inte 6.",
      "See the Score tab for the exact math: 9 minus 3, times 0.85, is about 5, not 6.",
    ),
  ],

  // --- Steg 06 · Domen ------------------------------------------------------
  "06-domen-fore": [
    msg("cofounder", "Dags att fälla domen på de nio svaren.", "Time to hand down the verdict on the nine responses."),
  ],
  "06-domen-korning": [
    tool(
      "Sammanställer domen",
      "Compiling the verdict",
      ["Väger 9 svar mot varandra", "Beräknar skevheten i betalningsviljan", "Simulerar priskänslighet i nya segment"],
      ["Weighing 9 responses against each other", "Calculating the skew in willingness to pay", "Simulating price sensitivity in new segments"],
    ),
  ],
  "06-domen-efter": [
    msg(
      "cofounder",
      "Domen: förfina, inte kör och inte pivotera. 7 av 9 bekräftar problemet, men 6 av 9 tycker 2 000 kr är för dyrt. Alla som sa ja har 10 eller fler anställda.",
      "The verdict: refine, not go and not pivot. 7 of 9 confirm the problem, but 6 of 9 think SEK 2,000 is too expensive. Everyone who said yes has 10 or more employees.",
    ),
    msg("founder", "Så vi smalnar segmentet?", "So we narrow the segment?"),
    msg(
      "cofounder",
      "Ja — 10–20 anställda. En prissimulering (Hiasynth, koncept) stöder 1 000–1 300 kr där.",
      "Yes — 10–20 employees. A price simulation (Hiasynth, concept) supports SEK 1,000–1,300 there.",
    ),
  ],

  "07-affarsfall": [
    tool(
      "Räknar den svenska kalkylen",
      "Running the Swedish calculation",
      ["Moms och arbetsgivaravgifter", "Kostnadsgolv", "Break-even"],
      ["VAT and payroll tax", "Cost floor", "Break-even"],
    ),
    msg(
      "cofounder",
      "1 190 kr i månaden, exklusive moms. Kostnadsgolvet ligger på ~8 500 kr i månaden, break-even vid 8 kunder.",
      "SEK 1,190 a month, excluding VAT. The cost floor is ~SEK 8,500/month, break-even at 8 customers.",
    ),
  ],
  "08-omfanget": [
    msg("cofounder", "Vad ska MVP:n faktiskt göra? Jag har gått igenom alla nio svaren.", "What should the MVP actually do? I've gone through all nine responses."),
    msg("founder", "Bara det de bad om.", "Just what they asked for."),
    msg(
      "cofounder",
      "Kvittoförfrågan via sms-länk, uppladdning, status per kund, export. Ingen OCR, ingen app — ingen bad om det.",
      "SMS-link receipt requests, upload, per-customer status, export. No OCR, no app — nobody asked for it.",
    ),
  ],
  "09-det-formella": [
    tool(
      "Registrerar hos Bolagsverket",
      "Registering with Bolagsverket",
      ["Väljer enskild firma", "Ansöker om F-skatt", "Registrerar för moms"],
      ["Choosing sole proprietorship", "Applying for F-tax", "Registering for VAT"],
    ),
    msg(
      "cofounder",
      "Klart. Enskild firma, F-skatt och moms är registrerat. Jag har också dragit upp den juridiska kartan: GDPR, personuppgiftsbiträdesavtal och transparens om AI används.",
      "Done. Sole proprietorship, F-tax and VAT are registered. I've also mapped the legal picture: GDPR, data processing agreements and transparency about AI use.",
    ),
  ],
  "10-live": [
    tool(
      "Bygger via Lovable (koncept)",
      "Building via Lovable (concept)",
      ["Skriver specen", "Förhandsvisning", "Publicerar på fiktiv domän"],
      ["Writing the spec", "Preview", "Publishing to a fictional domain"],
    ),
    msg("cofounder", "Publicerad. Tre pilotbyråer kör redan gratis.", "Published. Three pilot firms are already running for free."),
  ],
  "11-forsta-kunderna": [
    msg(
      "cofounder",
      "30-dagarsplanen är klar: LinkedIn, ett branschnätverk för redovisningskonsulter och Nyföretagarcentrum.",
      "The 30-day plan is ready: LinkedIn, an industry network for accounting consultants, and Nyföretagarcentrum.",
    ),
    skip("30 dagar senare", "30 days later"),
    msg("cofounder", "Fem betalande byråer. 5 950 kr i MRR.", "Five paying firms. SEK 5,950 in MRR."),
  ],
  "12-kapital": [
    tool(
      "Förbereder ansökan",
      "Preparing the application",
      ["Sammanställer underlag ur Spåret", "Fyller i Almis mall", "Fyller i Vinnovas mall"],
      ["Compiling evidence from the Trace", "Filling in Almi's template", "Filling in Vinnova's template"],
    ),
    msg(
      "cofounder",
      "Ansökningarna till Almi och Vinnova är förberedda, med hela underlaget ur Spåret. Du står vid Bevisad affär nu.",
      "The applications to Almi and Vinnova are ready, with the full record from the Trace. You're at Proven business now.",
    ),
    msg("founder", "Kör.", "Go."),
  ],
};
