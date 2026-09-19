// Jonas Bergs förskrivna dialog — samma mönster som adapters/demo/
// cofounderScript.ts (Saras), men ett meddelande per kontrollpunkt (avsnitt
// 9.4 byggs i bredd, se adapters/demo/jonas.ts). Nyckel = beat.id i jonas.ts.
import type { TranscriptItem } from "./cofounderScript";

type MsgArgs = ["founder" | "cofounder", string, string];

function msg(role: "founder" | "cofounder", sv: string, en: string): TranscriptItem {
  return { kind: "message", role, text: { sv, en } };
}

function tool(labelSv: string, labelEn: string, stepsSv: string[], stepsEn: string[]): TranscriptItem {
  return { kind: "tool", label: { sv: labelSv, en: labelEn }, steps: { sv: stepsSv, en: stepsEn } };
}

function m(...args: MsgArgs): TranscriptItem {
  return msg(...args);
}

export const jonasCofounderScript: Record<string, TranscriptItem[]> = {
  "01-om-dig": [
    m("cofounder", "Passform-samtalet är klart. Din säljbakgrund väger tungt mot hallägare.", "The fit chat is done. Your sales background weighs heavily with hall owners."),
  ],
  "02-genomlysningen": [
    tool(
      "Bryter ner idén",
      "Breaking down the idea",
      ["Delar upp i fem antaganden", "Hämtar en första registerbild", "Väger passformen"],
      ["Splitting into five assumptions", "Pulling a first registry picture", "Weighing the fit"],
    ),
    m(
      "cofounder",
      "En konsumentmarknadsplats är svag här — befintliga bokningssystem äger redan spelarna. Skarpare idé: Beläggningsprognosen, ett B2B-verktyg åt hallägare.",
      "A consumer marketplace is weak here — existing booking systems already own the players. Sharper idea: The Occupancy Forecast, a B2B tool for hall owners.",
    ),
    m("founder", "Det spelar mot min styrka — jag pratar redan med företag hela dagarna.", "That plays to my strength — I already talk to companies all day."),
  ],
  "03-marknaden": [
    tool(
      "Hämtar från Bolagsverket",
      "Fetching from Bolagsverket",
      ["Räknar padelhallsbolag (SNI 93.110)", "Kartlägger nyregistreringar och nedläggningar", "Identifierar konkurrerande bokningssystem"],
      ["Counting padel-court companies (SNI 93.110)", "Mapping new registrations and closures", "Identifying competing booking systems"],
    ),
    m(
      "cofounder",
      "412 padelhallsbolag. Nyregistreringarna faller, nedläggningarna ökar — branschen är pressad. Två bokningssystem dominerar, men ingen erbjuder prognos.",
      "412 padel-court companies. New registrations are falling, closures are rising — the industry is under pressure. Two booking systems dominate, but neither offers forecasting.",
    ),
  ],
  "04-kunden": [
    tool(
      "Bygger hallprofilen",
      "Building the hall profile",
      ["Filtrerar på antal banor och beläggning", "Namnger 25 hallar", "Fördjupar konkurrentbilden"],
      ["Filtering by court count and occupancy", "Naming 25 halls", "Deepening the competitor picture"],
    ),
    m("cofounder", "25 hallar matchar profilen: tre eller fler banor, beläggning över 60 %.", "25 halls match the profile: three or more courts, occupancy above 60%."),
  ],
  "05-samtalen": [
    tool(
      "Skickar från din Gmail",
      "Sending from your Gmail",
      ["Skriver svenskt B2B-mejl", "Skickar till 25 hallar", "Följer öppningar och svar"],
      ["Writing the Swedish B2B email", "Sending to 25 halls", "Tracking opens and responses"],
    ),
    m(
      "cofounder",
      "8 svar, 44 % öppningsfrekvens. Alla bekräftar att outnyttjad kapacitet är ett problem, och flera nämner dynamisk prissättning som intressant.",
      "8 responses, 44% open rate. All confirm unused capacity is a problem, and several mention dynamic pricing as interesting.",
    ),
  ],
  "06a-pivot": [
    tool(
      "Läser svaren igen, närmare",
      "Reading the responses again, more closely",
      ["Väger de 8 svaren mot varandra", "Upptäcker: hallägarna avvisar dynamisk prissättning specifikt", "Räknar om Betalningsvilja"],
      ["Weighing the 8 responses against each other", "Finding: hall owners specifically reject dynamic pricing", "Recalculating Willingness to pay"],
    ),
    m("founder", "Så de vill inte ha priskomponenten alls?", "So they don't want the pricing part at all?"),
    m(
      "cofounder",
      "Nej — de vill inte att spelare ska se olika priser. Men prognosen och fyllnadskampanjerna är fortfarande intressanta. Vi pivoterar: bort med prissättningen. Poängen sjunker till 38 — en motsägande post straffas, precis som regeln säger.",
      "No — they don't want players to see different prices. But the forecast and fill campaigns are still of interest. We pivot: drop the pricing. The score drops to 38 — a contradicting item is penalized, exactly per the rule.",
    ),
  ],
  "06b-nya-samtal": [
    tool(
      "Går tillbaka med den pivotade idén",
      "Going back with the pivoted idea",
      ["Presenterar prognos och fyllnadskampanjer", "Samlar in 5 nya svar", "Uppdaterar Problem och Betalningsvilja"],
      ["Presenting the forecast and fill campaigns", "Collecting 5 new responses", "Updating Problem and Willingness to pay"],
    ),
    m("cofounder", "5 nya svar, 13 totalt — alla positiva till den pivotade idén. Poängen stiger till 52.", "5 new responses, 13 total — all positive on the pivoted idea. The score rises to 52."),
  ],
  "07-affarsfall": [
    tool(
      "Räknar den svenska kalkylen",
      "Running the Swedish calculation",
      ["Moms och arbetsgivaravgifter", "Kostnadsgolv", "Break-even mot hallarnas storlek"],
      ["VAT and payroll tax", "Cost floor", "Break-even against hall size"],
    ),
    m(
      "cofounder",
      "1 900 kr i månaden per hall, exklusive moms. Kostnadsgolvet ligger på ~9 000 kr, break-even vid 5 kunder.",
      "SEK 1,900 a month per hall, excluding VAT. The cost floor is ~SEK 9,000, break-even at 5 customers.",
    ),
  ],
  "08-omfanget": [
    m("cofounder", "Vad ska MVP:n faktiskt göra? Jag har gått igenom alla 13 svaren.", "What should the MVP actually do? I've gone through all 13 responses."),
    m("founder", "Bara prognosen och fyllnadskampanjerna.", "Just the forecast and the fill campaigns."),
    m(
      "cofounder",
      "Beläggningsprognos per vecka, ett fyllnadskampanj-verktyg, enkel adminvy. Ingen dynamisk prissättning, ingen egen bokningsmotor.",
      "Weekly occupancy forecast, a fill-campaign tool, simple admin view. No dynamic pricing, no dedicated booking engine.",
    ),
  ],
  "09-det-formella": [
    tool(
      "Registrerar hos Bolagsverket",
      "Registering with Bolagsverket",
      ["Väljer enskild firma", "Ansöker om F-skatt", "Registrerar för moms"],
      ["Choosing sole proprietorship", "Applying for F-tax", "Registering for VAT"],
    ),
    m(
      "cofounder",
      "Klart. Enskild firma, F-skatt och moms är registrerat. Juridisk karta klar: GDPR för spelarnas kontaktuppgifter, B2B-villkor mot hallarna.",
      "Done. Sole proprietorship, F-tax and VAT are registered. Legal map done: GDPR for players' contact details, B2B terms with the halls.",
    ),
  ],
  "10-live": [
    tool(
      "Bygger via Lovable (koncept)",
      "Building via Lovable (concept)",
      ["Skriver specen", "Bygger skelettet", "Lägger till komponenter", "Publicerar på fiktiv domän"],
      ["Writing the spec", "Building the skeleton", "Adding components", "Publishing to a fictional domain"],
    ),
    m("cofounder", "Publicerad på hallprognos.lovable.app. Två pilothallar kör redan gratis.", "Published at hallprognos.lovable.app. Two pilot halls are already running for free."),
  ],
  "11-forsta-kunderna": [
    m(
      "cofounder",
      "30-dagarsplanen är klar: Svenska Padelförbundets nätverk, LinkedIn och kalla samtal till hallägare.",
      "The 30-day plan is ready: the Swedish Padel Federation's network, LinkedIn and cold calls to hall owners.",
    ),
    { kind: "timeSkip", label: { sv: "30 dagar senare", en: "30 days later" } },
    m("cofounder", "Fyra betalande hallar. 7 600 kr i MRR.", "Four paying halls. SEK 7,600 in MRR."),
  ],
  "12-kapital": [
    tool(
      "Förbereder ansökan",
      "Preparing the application",
      ["Sammanställer underlag ur Spåret, pivoten inkluderad", "Fyller i Almis mall", "Fyller i Vinnovas mall"],
      ["Compiling evidence from the Trace, pivot included", "Filling in Almi's template", "Filling in Vinnova's template"],
    ),
    m(
      "cofounder",
      "Ansökningarna till Almi och Vinnova är förberedda — pivoten i steg 06 ingår som en del av berättelsen, inte gömd. Du står vid Bevisad affär nu.",
      "The applications to Almi and Vinnova are ready — the step 06 pivot is part of the story, not hidden. You're at Proven business now.",
    ),
    m("founder", "Kör.", "Go."),
  ],
};
