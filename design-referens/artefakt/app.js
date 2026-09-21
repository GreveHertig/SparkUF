/* Spark — demonstrationsunderlag och gränssnitt. */

/* ——————————————————————————————————————————————
   Demonstrationsunderlag. En och samma påhittade grundare,
   konsekvent genom alla åtta vyer.
   —————————————————————————————————————————————— */
const SCORE_PARTS = [
  { key:"marknad", namn:"Marknad", max:12, start:10, fraga:"Finns tillräckligt många köpare?", rader:[
    { r:"Segmentets storlek", p:6, m:6, t:["312 företag i Sverige med 5–20 anställda inom SNI 69201","Över tröskeln för ett nischverktyg med prenumeration"], k:{o:"Bolagsverket",d:"14 september"} },
    { r:"Köpkraft i segmentet", p:3, m:4, t:["Medianomsättning 4,2 Mkr","197 av 312 har färre än 11 anställda — den delen har tunnare systembudget"], k:{o:"allabolag, 312 bolag",d:"14 september"} },
    { r:"Tillväxt", p:1, m:2, t:["18 % växte mer än 10 % förra räkenskapsåret","Segmentet är stabilt, inte växande. Du tar andelar, du rider ingen våg"], k:{o:"allabolag, bokslut 2025",d:"14 september"} } ] },
  { key:"konkurrens", namn:"Konkurrens", max:8, start:6, fraga:"Hur trångt är det, finns en lucka?", rader:[
    { r:"Luckan", p:2, m:2, t:["Ingen av de fyra systemleverantörerna säljer bokslutsberedning som eget steg","2 av 6 svarande nämnde spontant att den delen saknas i deras nuvarande stöd"], k:{o:"SNI 62010 och 6 svar",d:"12 september"} },
    { r:"Antal aktörer", p:3, m:4, t:["4 leverantörer täcker bokföringsflödet i segmentet","Ingen av dem har över 30 % av marknaden — men alla fyra har redan integration mot klientregistren"], k:{o:"allabolag, omsättningsandelar",d:"12 september"} },
    { r:"Inträdeströskel", p:1, m:2, t:["Tröskeln är inte funktionen, den är integrationen mot befintliga system","Petra Lindqvist avvisade idén just på den punkten"], k:{o:"1 svar",d:"5 september"} } ] },
  { key:"passform", namn:"Passform", max:10, start:9, fraga:"Kan just du bygga och sälja det här?", rader:[
    { r:"Branschkunskap", p:5, m:5, t:["Fyra år som redovisningskonsult, cirka 160 bokslut","Du har gjort exakt det arbete du vill automatisera"], k:{o:"Profilen",d:"2 september"} },
    { r:"Nätverk i segmentet", p:3, m:3, t:["17 kontakter i branschen, varav 6 inom målgruppen","Svarsfrekvens 12,8 % mot 11 % som är normalt — språket fungerar"], k:{o:"Profilen och steg 05",d:"13 september"} },
    { r:"Teknisk förmåga", p:1, m:2, t:["Du kan inte koda. Två AI-byggen på fritiden räcker till prototyp, inte till produkt","Ingen teknisk partner i nätverket. Detta är en strukturell lucka, inte en kunskapslucka"], k:{o:"Profilen",d:"2 september"} } ] },
  { key:"problem", namn:"Problem", max:18, start:14, fraga:"Säger riktiga kunder att problemet är verkligt?", slutsats:"Problemet står. Det som saknas är volym och spridning, inte bekräftelse.", rader:[
    { r:"Bekräftelse från kunder", p:9, m:11, t:["4 av 6 svarande angav bokslutsberedning som största tidstjuven","2 avvisade. Båda under 9 anställda, båda med annan klientmix"], k:{o:"6 svar",d:"5–13 september"} },
    { r:"Problemets omfattning", p:4, m:5, t:["De som bekräftade beskriver 60-timmarsveckor under februari och mars","Två angav att 80 % av arbetet är samma manuella moment"], k:{o:"4 svar",d:"6–13 september"} },
    { r:"Bredd i underlaget", p:1, m:2, t:["6 svar är i underkant. Vid 10 blir mönstret hållbart","Alla sex ligger i Västsverige. Underlaget är geografiskt skevt"], k:{o:"47 utskick, 6 svar",d:"4–13 september"} } ] },
  { key:"betalningsvilja", namn:"Betalningsvilja", max:18, start:13, fraga:"Vill de betala, och tål de ditt pris?", slutsats:"Problemet är inte viljan. Det är nivån. Gå uppåt i segment eller halvera omfånget.", rader:[
    { r:"Prissvar från kunder", p:9, m:11, t:["3 av 4 svarande angav ett pris","Median 900 kr/mån · ditt pris 2 000 kr"], k:{o:"4 svar",d:"6–13 september"} },
    { r:"Köpkraft i segmentet", p:4, m:7, t:["Medianomsättning 4,2 Mkr","En byrå i det spannet lägger 30–60 tkr om året på system totalt"], k:{o:"allabolag, 312 bolag",d:"14 september"} } ] },
  { key:"produkt", namn:"Produkt", max:12, start:0, fraga:"Bygger du det bevisen stöder, och är det byggt?", last:"Låses upp när du gjort steg 08 — Omfånget", rader:[] },
  { key:"traktion", namn:"Traktion", max:14, start:0, fraga:"Använder och betalar någon på riktigt?", last:"Låses upp när du gjort steg 10 — Live", rader:[] },
  { key:"genomforbarhet", namn:"Genomförbarhet", max:8, start:0, fraga:"Räcker tid, pengar, kompetens? Är det formella klart?", last:"Låses upp när du gjort steg 09 — Det formella", rader:[] }
];
const CAP_NOW = 66;
const PHASE_CAPS = [
  { fas:"Upptäck", steg:"01–02", tak:18, t:"Du har en idé och en profil. Inget är prövat." },
  { fas:"Pröva, före samtal", steg:"03–04", tak:30, t:"Du vet hur marknaden ser ut. Ingen har sagt något." },
  { fas:"Pröva, efter samtal", steg:"05–06", tak:66, t:"Riktiga kunder har svarat. Nu vet du något." },
  { fas:"Lansera", steg:"07–10", tak:86, t:"Du har byggt det bevisen stöder och det är live." },
  { fas:"Växa", steg:"11–12", tak:100, t:"Någon använder och betalar." }
];
const LEVELS = [
  { min:1, max:29, namn:"Oprövat", ton:"bad", sager:"Du vet för lite än. Här är nästa steg." },
  { min:30, max:49, namn:"Underbyggt men obevisat", ton:"warn", sager:"Marknaden finns. Nu måste du prata med folk." },
  { min:50, max:69, namn:"Efterfrågan bekräftad", ton:"warn", sager:"Du har belägg. Bygg det minsta som testar resten." },
  { min:70, max:84, namn:"Byggt och lanserat", ton:"ok", sager:"Det finns. Nu ska någon börja använda det." },
  { min:85, max:100, namn:"Bevisad affär", ton:"ok", sager:"Kör. Du har det de flesta saknar efter ett år." }
];
const SUGGESTIONS = [
  { plus:14, rubrik:"Skicka till 40 fler byråer", tid:"~20 min", lucka:"underlag", knapp:"Kör steg 05 igen",
    mot:["Du har 6 svar. Vid 12 blir underlaget användbart i stället för antydande.","Lägg till bemanningsvinkeln i mejlet — fyra av fem byråer uppger att de inte hittar konsulter."],
    reg:"Registret: 312 matchar, 265 okontaktade" },
  { plus:8, rubrik:"Testa 900 kr i stället för 2 000", tid:"~15 min", lucka:"motsagelse", knapp:"Skicka uppföljning",
    mot:["3 av 4 svarande angav omkring 900 kr. Fler svar av samma sort ändrar inte det.","Fråga samma fyra om de skulle köpa där. Ett ja från dem är värt mer än tjugo nya svar."] },
  { plus:6, rubrik:"Snäva segmentet till 10–20 anställda", tid:"~15 min", lucka:"motsagelse", knapp:"Uppdatera kundprofilen",
    mot:["De tre som angav ett pris har 11, 14 och 19 anställda.","Båda som avvisade har färre än 9 anställda och en annan klientmix."],
    reg:"Registret: 115 av 312 matchar den snävare profilen" }
];
const GAP_LABELS = { underlag:"Otillräckligt underlag", motsagelse:"Motsägande underlag", strukturell:"Strukturell lucka" };
const STRUCT_GAP = {
  text:"Du kan inte bygga det här själv och har ingen teknisk partner. Det löses inte av fler kundsamtal.",
  atgarder:["Hitta en teknisk medgrundare — 0 kandidater i ditt nätverk i dag","Snäva omfånget till något som går att bygga utan kod","Köp bygget. Med 40 000 kr räcker det till en K2-beredning, inte till båda regelverken"],
  k:{o:"Profilen",d:"2 september"} };

const PHASES = [
  { namn:"Upptäck", steg:"01–02", tak:18 }, { namn:"Pröva", steg:"03–06", tak:66 },
  { namn:"Lansera", steg:"07–10", tak:86 }, { namn:"Växa", steg:"11–12", tak:100 } ];
const STEPS = [
  { nr:"01", namn:"Om dig", fas:"Upptäck", status:"klar", max:10, fick:9, datum:"2 september",
    kort:"Samtal som bygger profilen. Bakgrund, kompetens, nätverk, resurser, riskaptit.",
    gjordes:["Fyrtio minuters samtal om din bakgrund, inte om idén","17 kontakter i branschen kartlagda och sorterade efter storlek på byrån","Tid och kapital fastställt: 15 timmar i veckan, 40 000 kronor"],
    resultat:[["Profil","6 block, 19 fastställda uppgifter"],["Passform","9 av 10 poäng"],["Största risken","Du kan inte koda och har ingen teknisk partner"]],
    lank:"profilen", lankText:"Öppna profilen" },
  { nr:"02", namn:"Möjligheter", fas:"Upptäck", status:"klar", max:2, fick:2, datum:"3 september",
    kort:"Idéer grundade i profilen, korsade med var registret visar luckor.",
    gjordes:["Fyra riktningar tagna ur profilen och Hjärnan, inte ur en tom prompt","Varje riktning testad mot SNI-fördelning och digitaliseringsgrad i SCB:s företagsdatabas","Två riktningar förkastade: klientportal (för trångt) och lönetjänst (du kan det inte)"],
    resultat:[["Vald riktning","Bokslutsberedning för byråer med 5–20 anställda"],["Kom ifrån","Sju anteckningar i Hjärnan om samma sak"],["Förkastat","3 av 4 riktningar"]],
    lank:"hjarnan", lankText:"Se anteckningarna som ledde hit" },
  { nr:"03", namn:"Marknaden", fas:"Pröva", status:"klar", max:14, fick:10, datum:"4 september",
    kort:"Riktiga siffror ur registret. Antal företag, storleksfördelning, omsättning, tillväxt, vem som redan finns där.",
    gjordes:["312 bolag hämtade ur Bolagsverket på SNI 69201 och storleksintervall","Omsättning och tillväxt matchad mot senast inlämnade årsredovisning för samtliga","Fyra systemleverantörer kartlagda med prisnivå och täckning"],
    resultat:[["Segment","312 företag, medianomsättning 4,2 Mkr"],["Tillväxt","18 % växte mer än 10 %"],["Luckan","Ingen leverantör säljer bokslutsberedning separat"]],
    lank:"marknaden", lankText:"Öppna registerunderlaget" },
  { nr:"04", namn:"Kunden", fas:"Pröva", status:"klar", max:4, fick:4, datum:"4 september",
    kort:"Kundprofil definierad ur registret. Resultatet är en lista på namngivna företag, inte en påhittad persona.",
    gjordes:["Profil satt: SNI 69201, 5–20 anställda, omsättning 2,5–9 Mkr, hela Sverige","312 träffar rangordnade efter omsättning per anställd och tillväxt","47 valda för första utskicket, viktat mot Västsverige där ditt nätverk finns"],
    resultat:[["Träffar","312 namngivna företag med kontaktuppgifter"],["Första urvalet","47 företag"],["Kvar","265 okontaktade"]],
    lank:"marknaden", lankText:"Se kundlistan" },
  { nr:"05", namn:"Samtalen", fas:"Pröva", status:"pågår", max:36, fick:27, datum:"pågår sedan 4 september",
    kort:"Spark bygger kontaktlistan, skriver mejlen och skickar från din egen adress. Följer öppningar, svar och påminnelser.",
    gjordes:["47 mejl skickade från din adress via Gmail, 4 september","Påminnelse skickad efter fyra dagar till 31 som inte öppnat","6 svar inkomna, samtliga lästa och nedbrutna i antaganden och prisangivelser"],
    resultat:[["Svarsfrekvens","12,8 % mot 11 % som är normalt i branschen"],["Bekräftar problemet","4 av 6"],["Angav ett pris","3 av 4 · median 900 kr"]],
    lank:"valideringen", lankText:"Öppna bevisen" },
  { nr:"06", namn:"Domen", fas:"Pröva", status:"pågår", max:0,
    kort:"Kör, förfina eller pivotera. Baserat på faktiska svar, med citat och siffror.",
    gjordes:["Tre antaganden prövade mot de sex svaren","Preliminär dom satt: FÖRFINA","Domen låses som slutgiltig först vid 10 svar"],
    resultat:[["Preliminär dom","Förfina — problemet håller, priset gör det inte"],["Ger poäng","Inga. Domen avgör om de 27 du har står kvar"]],
    lank:"valideringen", lankText:"Läs domen" },
  { nr:"07", namn:"Affärsfallet och priset", fas:"Lansera", status:"låst", max:2,
    kort:"Kalkyl med moms, arbetsgivaravgifter, F-skatt och kostnadsgolv. Prisförslag med spann och motivering.",
    kravs:"Låses upp när domen i steg 06 är satt på 10 svar. Just nu skulle kalkylen bygga på 2 000 kronor, och tre av fyra kunder har redan sagt att det är fel nivå." },
  { nr:"08", namn:"Omfånget", fas:"Lansera", status:"låst", max:4,
    kort:"MVP-innehåll genererat ur bevisen, inte ur idén. Bygg bara det de som svarade faktiskt bad om.",
    kravs:"Låses upp när steg 07 är klart. Två av dina svarande har bett om olika saker — K2 automatiskt och K3 automatiskt. Vilken det blir avgörs av priset, inte tvärtom." },
  { nr:"09", namn:"Det formella", fas:"Lansera", status:"låst", max:2,
    kort:"Enskild firma eller aktiebolag, registrering hos Bolagsverket, F-skatt, momsregistrering, bokföringskrav.",
    kravs:"Låses upp när steg 08 är klart. Du behöver inget bolag förrän du har något att fakturera — och du kan det här bättre än de flesta." },
  { nr:"10", namn:"Live", fas:"Lansera", status:"låst", max:8,
    kort:"Landningssida på egen domän med e-postinsamling och GDPR-text. Eller MVP:n själv, byggd och deployad.",
    kravs:"Låses upp när steg 08 är klart. Det här är steget där dina 40 000 kronor tar slut om omfånget inte är satt först." },
  { nr:"11", namn:"Första kunderna", fas:"Växa", status:"låst", max:14,
    kort:"30-dagarsplan mot svenska kanaler. Branschforum, Nyföretagarcentrum, lokala nätverk, branschmässor.",
    kravs:"Låses upp när något är live. Det här är steget som ger flest poäng av alla efter samtalen — för att det är det enda som bevisar att någon faktiskt använder det." },
  { nr:"12", namn:"Kapital", fas:"Växa", status:"låst", max:4,
    kort:"Almi, Vinnova, Tillväxtverket, regionala medel, banklån, bootstrapping.",
    kravs:"Låses upp när du har första kunderna. Almi Väst har ett mikrolån som passar din profil, men de vill se betalande kunder först — inte en plan." }
];


const MARKET_HEAD = [
  { v:"312", u:"företag i Sverige", d:"med 5–20 anställda inom SNI 69201", k:{o:"Bolagsverket",d:"14 september 2026"} },
  { v:"4,2 Mkr", u:"medianomsättning", d:"senast inlämnade årsredovisning", k:{o:"allabolag, 312 bolag",d:"14 september 2026"} },
  { v:"18 %", u:"växte mer än 10 %", d:"56 av 312 bolag, jämfört med föregående räkenskapsår", k:{o:"allabolag, bokslut 2025",d:"14 september 2026"} },
  { v:"186", u:"företag i nästa segment", d:"byråer med 21–50 anställda — alternativet om priset ska stå kvar", k:{o:"Bolagsverket",d:"14 september 2026"} }
];
const DIST = [
  { s:"5–7 anställda", n:118, m:"2,9 Mkr" }, { s:"8–10 anställda", n:79, m:"3,8 Mkr" },
  { s:"11–14 anställda", n:61, m:"5,1 Mkr" }, { s:"15–17 anställda", n:34, m:"6,4 Mkr" },
  { s:"18–20 anställda", n:20, m:"8,1 Mkr" }
];
const COMPANIES = [
  ["Hisingens Redovisning AB","Göteborg","8,4 Mkr",19,"svarat","Kjell Byström, 13 sep"],
  ["Nordiska Bokslutsbyrån AB","Kungsbacka","7,2 Mkr",16,"kontaktad","Utskick 4 sep, påminnelse 8 sep"],
  ["Byråkonsult Väst AB","Göteborg","6,8 Mkr",14,"svarat","Marie Dahlgren, 8 sep"],
  ["Redovisningshuset i Borås AB","Borås","6,3 Mkr",13,"kontaktad","Utskick 4 sep, påminnelse 8 sep"],
  ["Trollhättans Redovisningsbyrå AB","Trollhättan","5,6 Mkr",12,"ej-kontaktad","—"],
  ["Ekonomibyrån Lindhagen AB","Mölndal","5,1 Mkr",11,"svarat","Anders Rydell, 6 sep"],
  ["Bokslut & Balans i Väst AB","Alingsås","4,9 Mkr",10,"svarat","Sofia Ekwall, 12 sep"],
  ["Siffra & Sammanhang AB","Göteborg","3,9 Mkr",8,"svarat","Petra Lindqvist, 5 sep"],
  ["Vänerbygdens Ekonomi AB","Vänersborg","3,2 Mkr",7,"kontaktad","Utskick 4 sep"],
  ["Almedal Ekonomikonsult AB","Göteborg","2,8 Mkr",6,"svarat","Håkan Nordin, 11 sep"]
];
const STATUS_TXT = { "svarat":"Svarat", "kontaktad":"Kontaktad", "ej-kontaktad":"Ej kontaktad" };
const STATUS_TON = { "svarat":"ok", "kontaktad":"slab", "ej-kontaktad":"" };
const CONTACT = { totalt:312, kontaktade:47, svar:6, okontaktade:265, frekvens:"12,8 %", benchmark:"11 %",
  k:{o:"Sparks egen data, 214 körningar",d:"14 september 2026"} };
const COMPETITORS = [
  ["Kontea","Byråplattform, störst i segmentet","1 190 kr/användare och månad","Bokföring, fakturering, klientregister"],
  ["Balansera","Bokslutsprogram, äldre installerad bas","790 kr/användare och månad","Bokslutsdokument, inte beredningen"],
  ["Novisio","Nykomling, riktar sig mot enmansbyråer","349 kr/månad","Bokföring och deklaration"],
  ["Bokfört Byrå","Bokföringsmotor med byråmodul","Offert, uppskattat 900–1 400 kr","Löpande bokföring"]
];
const COMP_SRC = { o:"SNI 62010, allabolag och leverantörernas prislistor", d:"12 september 2026" };
const COMP_VERDICT = "Ingen av de fyra säljer bokslutsberedning som ett eget steg. Luckan finns. Men alla fyra har redan integration mot byråernas klientregister — och det är tröskeln du ska ta dig över, inte funktionen.";

const OUTREACH = { kontaktade:47, svar:6, frekvens:"12,8 %", benchmark:"11 %", period:"4–13 september 2026",
  kanal:"Mejl från elin.oberg@vastakers.se via Gmail", paminnelse:"Påminnelse skickad efter fyra dagar till 31 av 47",
  k:{o:"Steg 05, utskick och svar",d:"13 september 2026"} };
const ASSUMPTIONS = [
  { t:"Bokslutsberedning är det som tar mest tid i en byrå med 5–20 anställda", s:"bekräftat",
    u:"4 av 6 svarande angav bokslutsberedning som den enskilt största tidstjuven. Två beskrev 60 timmars arbetsveckor under februari och mars. De två som sa nej har 6 respektive 8 anställda och gör nästan bara enskilda firmor.",
    k:{o:"6 svar",d:"5–13 september"} },
  { t:"En byrå i segmentet kan betala 2 000 kr per användare och månad", s:"motsagt",
    u:"3 av 4 som bekräftade problemet angav en egen prisnivå. 800, 900 och 1 000 kronor. Median 900. Ingen av de sex nämnde en siffra i närheten av 2 000. Marie Dahlgren jämförde med hela byråns nuvarande systemkostnad.",
    k:{o:"4 svar",d:"6–13 september"} },
  { t:"Byråerna är beredda att lägga till ett system utöver det de har", s:"obesvarat",
    u:"Ingen av de sex tog direkt ställning. Två nämnde befintliga system spontant, båda som ett hinder snarare än ett komplement. Frågan ställdes inte tillräckligt rakt i utskicket — det är ett fel i mejlet, inte i idén.",
    k:{o:"6 svar",d:"5–13 september"} }
];
const REPLIES = [
  { person:"Kjell Byström", roll:"Delägare", foretag:"Hisingens Redovisning AB", ort:"Göteborg", anst:19, datum:"13 september", stance:"delvis", pris:1000,
    citat:"Bokslutssäsongen äter tre månader av året hos oss och det mesta av det är flyttande av siffror mellan samma fyra ställen. Tar du bort halva det lyssnar jag. Vi skulle kunna lägga tusen i månaden per konsult om det sparar en vecka per klient. Mer än så får jag inte igenom hos min kompanjon." },
  { person:"Sofia Ekwall", roll:"Byråchef", foretag:"Bokslut & Balans i Väst AB", ort:"Alingsås", anst:10, datum:"12 september", stance:"bekräftar", pris:null,
    citat:"Ja, det är där det gör ont. Men jag skulle vilja veta om det klarar både K2 och K3 automatiskt, för det är i K3-klienterna tiden försvinner. Vad det får kosta beror helt på hur mycket det faktiskt tar bort. Hör av dig när du har något att visa." },
  { person:"Håkan Nordin", roll:"Ägare", foretag:"Almedal Ekonomikonsult AB", ort:"Göteborg", anst:6, datum:"11 september", stance:"avvisar", pris:null,
    citat:"Vi är sex personer och gör nästan bara bokslut för enskilda firmor och små AB. Det går på en timme styck. Det du beskriver löser inget problem vi har. Lycka till, men jag är fel person." },
  { person:"Marie Dahlgren", roll:"Delägare", foretag:"Byråkonsult Väst AB", ort:"Göteborg", anst:14, datum:"8 september", stance:"delvis", pris:800,
    citat:"Problemet är verkligt, det ska du veta. Men 2 000 kronor per användare och månad är mer än vi betalar för hela vårt nuvarande systemstöd. 800 kronor hade varit ett samtal. 2 000 är det inte." },
  { person:"Anders Rydell", roll:"Redovisningschef", foretag:"Ekonomibyrån Lindhagen AB", ort:"Mölndal", anst:11, datum:"6 september", stance:"delvis", pris:900,
    citat:"Vi jobbar 60-timmarsveckor i februari och mars och det är inte hållbart, så du är inne på rätt sak. Kring 900 kronor i månaden vore rimligt för oss. Men jag har hört liknande löften förut och hittills har inget klarat våra kontoplaner." },
  { person:"Petra Lindqvist", roll:"Ägare", foretag:"Siffra & Sammanhang AB", ort:"Göteborg", anst:8, datum:"5 september", stance:"avvisar", pris:null,
    citat:"Vi har redan Kontea och Balansera. Ett tredje system som ska lära sig våra klienter mitt i säsongen är en risk, inte en besparing. Om det hade legat inuti det vi redan har vore det en annan diskussion." }
];
const STANCE_TON = { "bekräftar":"ok", "avvisar":"bad", "delvis":"warn" };
const STANCE_TXT = { "bekräftar":"Bekräftar", "avvisar":"Avvisar", "delvis":"Delvis" };
const PRICE = { angivna:[800,900,1000], median:900, ditt:2000, faktor:"2,2 gånger", k:{o:"4 svar",d:"6–13 september"} };
const VERDICT = {
  beslut:"FÖRFINA",
  sammanfattning:"Problemet är verkligt. 4 av 6 sa att bokslutsberedningen tar mest tid, och de två som sa nej är båda under 9 anställda och gör en annan sorts bokslut.",
  invandning:"Priset är det inte. 3 av 4 som angav en siffra landade kring 900 kronor, inte 2 000. Ingen av de sex nämnde något i närheten av din nivå.",
  atgard:"Gå uppåt i segment eller halvera omfånget.",
  detalj:"Uppåt betyder byråer med 21–50 anställda — 186 företag enligt Bolagsverket, och en grupp du inte har ett enda kontaktnät i. Halvera omfånget betyder att bygga bara K2-beredningen och ta 900 kronor. Registret säger att den andra vägen är kortare för just dig.",
  k:{o:"6 svar och allabolag",d:"13 september 2026"},
  sparr:"Domen låses som slutgiltig först vid 10 svar. Med 6 är den riktningsgivande, inte avgjord." };

const PULSE = [
  { rubrik:"Två nya redovisningsbyråer registrerade i Västra Götaland", ton:"ok",
    brod:"Bokslut Nordväst AB, Stenungsund, 5 anställda. Rydéns Ekonomibyrå AB, Lerum, 6 anställda.",
    varfor:"Nystartade byråer väljer systemstöd under sitt första halvår. Båda ligger inom fyra mil från dig och båda faller inom din kundprofil.",
    k:{o:"Bolagsverket, nyregistreringar",d:"13 september"} },
  { rubrik:"Kontea tar in 40 Mkr för att bygga ut sin byråplattform", ton:"bad",
    brod:"Pengarna ska enligt bolaget gå till automatisering av återkommande moment i byråernas arbetsflöde.",
    varfor:"Den leverantör dina kunder redan har får muskler att bygga precis din funktion. Det bekräftar att segmentet är värt pengar — och att du har tolv månader, inte trettiosex.",
    k:{o:"Breakit",d:"12 september"} },
  { rubrik:"Fyra av fem byråer uppger att de inte hittar redovisningskonsulter", ton:"ok",
    brod:"Branschundersökning bland 430 byråer. Bristen är störst i storstadsregionerna.",
    varfor:"En byrå som inte får tag i folk löser volymen med system. Det är ditt starkaste säljargument och det finns inte med i ditt nuvarande utskick.",
    k:{o:"Konsulten, branschundersökning",d:"11 september"} }
];
const NOTES0 = [
  { datum:"14 mars", anvand:"Steg 02 · grunden i riktningen",
    text:"Bokslutssäsongen är helvete. Vi jobbar 60 timmar i veckan i tre månader och 80 % är samma manuella arbete. Ingen säger något om det, alla bara accepterar att februari och mars är förlorade." },
  { datum:"2 april", anvand:"Steg 03 · prisankare i konkurrensbilden",
    text:"Kollade upp vad Kontea faktiskt tar. 1 190 per användare och månad. Ingen på kontoret vet vad vi betalar totalt för system. Det borde vara pinsamt för en redovisningsbyrå." },
  { datum:"19 april", text:"Boka om tandläkaren. Och däckbyte." },
  { datum:"3 maj", anvand:"Steg 01 · teknisk förmåga i profilen",
    text:"Byggde en GPT som läser SIE-filer och hittar konton som saknar motpart. Tog en kväll. Funkar förvånansvärt bra på våra egna filer, sämre på dem från Novisio." },
  { datum:"21 maj", anvand:"Steg 05 · blev fråga 3 i utskicket",
    text:"Lisa på Ekonomibyrån sa att de hellre anställer än köper system. Fråga varför. Är det pengarna eller är det att inget system gör det de behöver?" },
  { datum:"7 juni", text:"Podd-tips från Mattias. Acquired, avsnittet om hur bokföringsprogram blev plattformar. Lyssna på tåget." },
  { datum:"28 juni", anvand:"Steg 02 · formuleringen av idén",
    text:"Varje byrå gör bokslut på sitt eget sätt men underlaget är identiskt. Samma SIE-fil, samma kontoplan, samma fyra avstämningar. Det är det som är grejen. Det är inte kompetensen som skiljer, det är rutinerna." }
];
const PROFILE = [
  { rubrik:"Bakgrund", rader:[
    ["Yrke","Fyra år som redovisningskonsult på Väståkers Redovisning AB i Göteborg, en byrå med 34 anställda. Ansvarat för cirka 40 bokslut per år, mest K2 och en växande andel K3.",{o:"Samtal, steg 01",d:"2 september"}],
    ["Utbildning","Ekonomprogrammet, Handelshögskolan i Göteborg. Inriktning redovisning.",{o:"Samtal, steg 01",d:"2 september"}],
    ["Vid sidan av","Byggt två små verktyg med AI på fritiden. Det ena läser SIE-filer och hittar konton utan motpart.",{o:"Hjärnan, anteckning 3 maj",d:"3 maj"}] ] },
  { rubrik:"Det du kan", rader:[
    ["Bokslut","K2 och K3 i praktiken, inte i teorin. Har gjort ungefär 160 stycken."],
    ["Excel","Expertnivå. Bygger modeller andra på byrån använder."],
    ["SIE och kontoplaner","Kan formatet, kan avvikelserna, kan varför byråer gör olika."],
    ["Branschspråket","Du skriver mejl som en byråägare svarar på. Det syns i svarsfrekvensen: 12,8 % mot 11 % som är normalt i branschen."] ] },
  { rubrik:"Det du inte kan", rader:[
    ["Kod","Ingen programmeringsbakgrund. Prototyp med AI-verktyg går, produkt gör det inte. Detta är den enskilt största risken i projektet."],
    ["Försäljning uppåt","Har aldrig sålt till någon över 20 anställda. Hela ditt nätverk ligger i småbyråsegmentet."],
    ["Rekrytering","Har aldrig anställt eller tagit in delägare."] ] },
  { rubrik:"Nätverk", rader:[
    ["I branschen","17 namngivna kontakter, varav 6 på byråer som ligger inom målgruppen 5–20 anställda.",{o:"Profilen",d:"2 september"}],
    ["Tidigare kollegor","Utspridda på fyra byråer i Västsverige efter fyra års rörlighet i branschen."],
    ["Tekniskt","Ingen. Du känner ingen som kan bygga det här med dig."] ] },
  { rubrik:"Tid och pengar", rader:[
    ["Tid","15 timmar i veckan vid sidan av heltid. Kvällar och söndagar."],
    ["Kapital","40 000 kronor sparade. Inga lån, inga externa pengar, ingen delägare."],
    ["Uthållighet","Med 15 timmar i veckan tar steg 05 till 10 ungefär fem månader. Det är den tidplan Spark räknar med."] ] },
  { rubrik:"Riskaptit", rader:[
    ["Gränsen","Du säger upp dig inte förrän det finns betalande kunder. Du kan lägga de 40 000 men inte mer."],
    ["Vad det betyder","Bygget måste rymmas inom 40 000 kronor eller göras av någon annan. Det avgör omfånget i steg 08 och är inte en detalj — det är en ram."] ] }
];
const CHAIN = {
  fran:"Fyra år som redovisningskonsult, 160 bokslut, expert på SIE-filer",
  via:"Sju anteckningar i Hjärnan om samma sak: säsongen, det manuella arbetet, att underlaget är identiskt mellan byråer",
  till:"Bokslutsberedning som eget verktyg för byråer med 5–20 anställda",
  motivering:"Idén kom inte ur en tom ruta. Den kom ur att du har gjort arbetet 160 gånger och vet exakt vilken del av det som är identiskt varje gång. Det är också därför Passform ligger på 9 av 10 — det finns knappt någon i Sverige som kan beskriva problemet bättre än du." };


const NEXT_STEPS = [
  { id:"n1", steg:"Steg 05 · Samtalen", rubrik:"Ring de två som inte svarade.",
    sub:"Fråga specifikt vad de betalar för sin nuvarande lösning.",
    varfor:["3 av 4 svarande angav ett pris och alla tre landade kring 900 kr. Ditt pris är 2 000 kr.",
      "Nordiska Bokslutsbyrån och Redovisningshuset i Borås är de två största i underlaget som inte svarat. De är också de enda som skulle kunna bära din nivå."],
    underlag:{ rader:["Nordiska Bokslutsbyrån AB · Kungsbacka · 16 anställda · 7,2 Mkr · utskick 4 sep, påminnelse 8 sep",
      "Redovisningshuset i Borås AB · Borås · 13 anställda · 6,3 Mkr · utskick 4 sep, påminnelse 8 sep",
      "Prissvar: 800, 900 och 1 000 kr · median 900 kr · ditt pris 2 000 kr"], k:{o:"allabolag och 4 svar",d:"14 september"} },
    okning:5, delar:[["betalningsvilja",3],["problem",2]],
    bevis:{ betalningsvilja:[
        { i:0, dp:2, t:"Två telefonsvar till: 1 100 kr och 950 kr i nuvarande systemkostnad per konsult", k:{o:"2 samtal",d:"14 september"} },
        { i:1, dp:1, t:"Båda ringda ligger över mediansstorleken i segmentet", k:{o:"allabolag",d:"14 september"} } ],
      problem:[
        { i:0, dp:2, t:"Båda beskrev bokslutsberedningen som säsongens flaskhals", k:{o:"2 samtal",d:"14 september"} } ] },
    spar:"Du ringde Nordiska Bokslutsbyrån och Redovisningshuset i Borås. Båda uppgav sin nuvarande systemkostnad." },
  { id:"n2", steg:"Steg 05 · Samtalen", rubrik:"Skicka uppföljning till de fyra som bekräftade problemet.",
    sub:"Fråga rakt ut om 900 kr i månaden hade ändrat svaret.",
    varfor:["Du har nu två prisuppgifter till från samtalen. Båda ligger under 1 200 kr.",
      "Fler svar av samma sort höjer ingenting. Det som saknas är ett ja eller nej på en nivå du faktiskt kan sätta."],
    underlag:{ rader:["Kjell Byström · Hisingens Redovisning · 1 000 kr","Anders Rydell · Ekonomibyrån Lindhagen · 900 kr",
      "Marie Dahlgren · Byråkonsult Väst · 800 kr","Sofia Ekwall · Bokslut & Balans i Väst · ingen siffra angiven"], k:{o:"4 svar",d:"6–13 september"} },
    okning:4, delar:[["betalningsvilja",2],["problem",2]],
    bevis:{ betalningsvilja:[
        { i:1, dp:2, t:"2 av 4 svarade ja på 900 kr samma dag. Nivån är därmed prövad, inte gissad", k:{o:"4 uppföljningar",d:"14 september"} } ],
      problem:[
        { i:1, dp:1, t:"Åtta prisuppgifter totalt. Omfattningen är bekräftad av samtliga fyra", k:{o:"8 svar",d:"14 september"} },
        { i:2, dp:1, t:"Underlaget räcker nu för att bära en dom", k:{o:"8 svar",d:"14 september"} } ] },
    spar:"Uppföljning skickad till fyra svarande med frågan om 900 kr. Två svarade ja samma dag." },
  { id:"n3", steg:"Steg 04 · Kunden", rubrik:"Snäva kundprofilen till 10–20 anställda.",
    sub:"Ta bort de 197 byråerna under 11 anställda ur listan.",
    varfor:["Alla som angav ett pris har 11, 14 eller 19 anställda. Båda som avvisade har färre än 9.",
      "Att fortsätta mejla den mindre halvan är att köpa fler nej för samma pengar."],
    underlag:{ rader:["115 av 312 företag har 11–20 anställda · medianomsättning 5,9 Mkr",
      "197 av 312 har 5–10 anställda · medianomsättning 3,2 Mkr","Avvisade svar: 6 och 8 anställda"], k:{o:"allabolag, 312 bolag",d:"14 september"} },
    okning:3, delar:[["marknad",2],["konkurrens",1]],
    bevis:{ marknad:[
        { i:1, dp:1, t:"Snävare profil: 115 företag med 11–20 anställda, medianomsättning 5,9 Mkr", k:{o:"allabolag, 312 bolag",d:"14 september"} },
        { i:2, dp:1, t:"Tillväxten är dubbelt så hög i det snävare spannet", k:{o:"allabolag, bokslut 2025",d:"14 september"} } ],
      konkurrens:[
        { i:1, dp:1, t:"De fyra leverantörerna är svagast just i 11–20-spannet", k:{o:"allabolag",d:"14 september"} } ] },
    spar:"Kundprofilen snävad till 11–20 anställda. 115 företag kvar i urvalet, 68 okontaktade." },
  { id:"n4", steg:"Steg 06 · Domen", rubrik:"Kör domen igen med det nya underlaget.",
    sub:"Du är två poäng från taket i den här fasen. Resten kräver att du bygger.",
    varfor:["Du har gjort allt som går att göra före steg 06. Åtta prisuppgifter, en snävare profil och ett bekräftat problem.",
      "Taket i fasen Pröva är 66. Poängen därefter sitter i Produkt, Traktion och Genomförbarhet — och de låses bara upp av att något byggs och säljs."],
    underlag:{ rader:["Fastak per fas: Upptäck 18 · Pröva 66 · Lansera 86 · Växa 100",
      "Låsta delar: Produkt 12 p, Traktion 14 p, Genomförbarhet 8 p"], k:{o:"Poängen",d:"14 september"} },
    okning:0, delar:[], spar:"Domen kördes om på åtta prisuppgifter.", sist:true }
];
const TRAIL0 = [
  { text:"Kjell Byström på Hisingens Redovisning svarade. Sjätte svaret, och det första från en byrå över 15 anställda.", tid:"I går 16:42", typ:"svar" },
  { text:"Två nya redovisningsbyråer registrerades i Västra Götaland. Båda inom din kundprofil.", tid:"I går 06:00", typ:"register" },
  { text:"Din poäng steg med 6 efter Kjells svar. Problem +4, Betalningsvilja +2.", tid:"I går 16:44", typ:"poang" }
];

const OPENING = { chips:[{o:"6 svar",d:"5–13 september"}], block:[
  { typ:"text", text:"Kjell Byström på Hisingens Redovisning svarade i går kväll. Det är ditt sjätte svar och det första från en byrå med över 15 anställda." },
  { typ:"text", text:"Det ändrar bilden — men inte åt det håll du hoppas. Han bekräftar problemet lika tydligt som de andra tre. Och han landar på tusen kronor i månaden, inte 2 000." } ] };
const PROMPTS = ["Vad ändrar Kjells svar?","Kan jag ta 2 000 kr i månaden?","Ska jag börja bygga nu?","Vilka ska jag kontakta härnäst?"];
const EXCHANGES = [
  { fraga:"Vad ändrar Kjells svar?", ord:["kjell","ändrar","senaste","nytt svar"],
    svar:{ chips:[{o:"6 svar",d:"5–13 september"},{o:"allabolag",d:"14 september"}], foljd:["Kan jag ta 2 000 kr i månaden?","Vilka ska jag kontakta härnäst?"], block:[
      { typ:"text", text:"Kjell driver den största byrån som svarat. 19 anställda, 8,4 miljoner i omsättning. Han är den enda i underlaget som är stor nog att din prisnivå ens skulle kunna vara rimlig." },
      { typ:"citat", text:"Vi skulle kunna lägga tusen i månaden per konsult om det sparar en vecka per klient. Mer än så får jag inte igenom hos min kompanjon.", av:"Kjell Byström, Hisingens Redovisning AB, 13 september" },
      { typ:"text", text:"Det betyder att prisinvändningen inte kommer från att byråerna är för små. Den kommer från att de inte betraktar bokslutsberedning som ett eget system värt en egen budget. Det är ett annat problem, och det löses inte genom att gå uppåt i segment." } ] } },
  { fraga:"Kan jag ta 2 000 kr i månaden?", ord:["pris","2000","2 000","betala","kosta","kronor","dyrt","prissättning","900"],
    svar:{ chips:[{o:"4 svar",d:"6–13 september"},{o:"Bolagsverket",d:"14 september"}], foljd:["Ska jag börja bygga nu?","Vilka ska jag kontakta härnäst?"], block:[
      { typ:"text", text:"Nej. Inte med det underlag du har." },
      { typ:"text", text:"Tre av fyra som angav en siffra landade på 800, 900 och 1 000 kronor. Median 900. Ditt pris är 2 000. Det är ingen förhandlingsmarginal, det är en faktor 2,2." },
      { typ:"text", text:"Du kommer att säga att de inte förstår värdet än. Det kan stämma. Men du har inte ett enda svar som stöder 2 000 kronor, och du har tre som säger emot. Bygger du en kalkyl på 2 000 nu väljer du bort det du faktiskt vet till förmån för det du hoppas." },
      { typ:"punkter", punkter:["Halvera omfånget: bygg bara K2-beredningen och ta 900 kronor. Går inom dina 40 000.","Byt målgrupp: byråer med 21–50 anställda. 186 företag — och du har noll kontakter där."] },
      { typ:"text", text:"Registret säger att den första vägen är kortare för just dig. Ditt nätverk ligger i småbyråsegmentet, och svarsfrekvensen på 12,8 % är hela din fördel i det här läget." } ] } },
  { fraga:"Ska jag börja bygga nu?", ord:["bygga","bygg","mvp","koda","utveckla","produkt","prototyp"],
    svar:{ chips:[{o:"Poängen",d:"14 september"},{o:"Profilen",d:"2 september"}], foljd:["Vilka ska jag kontakta härnäst?","Hur ser marknaden ut?"], block:[
      { typ:"text", text:"Nej. Och jag vet varför du frågar: 24 av dina 48 möjliga poäng härifrån sitter i Produkt och Traktion, och de ser ut att bara vänta på att du sätter igång." },
      { typ:"text", text:"Men du har sex svar och en motsagd prishypotes. Börjar du bygga nu bygger du mot 2 000 kronor i månaden, och tre av fyra kunder har redan sagt att det är fel nivå. Det är det dyraste misstaget i hela resan, och det är precis det steg 06 finns för att hindra." },
      { typ:"text", text:"Det finns också en sak till som du inte kan lösa med arbete: du kan inte koda och har ingen teknisk partner. Med 40 000 kronor räcker det till en K2-beredning köpt av någon annan, inte till båda regelverken. Omfånget måste alltså sättas av priset, inte tvärtom." },
      { typ:"text", text:"Gör om prisfrågan först. Det tar tre dagar. Bygget tar tre månader." } ] } },
  { fraga:"Vilka ska jag kontakta härnäst?", ord:["kontakta","ringa","härnäst","vem","vilka","nästa","lista"],
    svar:{ chips:[{o:"allabolag",d:"14 september"},{o:"Steg 05",d:"13 september"}], foljd:["Hur ser marknaden ut?","Vad gör konkurrenterna?"], block:[
      { typ:"text", text:"De två största som inte svarat. Nordiska Bokslutsbyrån i Kungsbacka, 16 anställda och 7,2 miljoner. Redovisningshuset i Borås, 13 anställda och 6,3 miljoner." },
      { typ:"text", text:"Båda ligger över mediansstorleken i segmentet och båda är de enda i underlaget som skulle kunna bära 2 000 kronor. Att de inte svarat är inget nej — det är 47 utskick och 12,8 % svarsfrekvens. Mejl räcker inte längre, ring." },
      { typ:"text", text:"Jag har lagt upp samtalen med tre frågor vardera. Den viktigaste är den tredje: vad betalar ni i dag för allt systemstöd tillsammans? Det är den siffran som avgör om 900 eller 2 000 är rätt." },
      { typ:"verktyg", rubrik:"Verktyg startat · Samtalslista", nav:"hem", navText:"Öppna nästa steg",
        rader:["2 företag · 3 frågor vardera · nummer hämtade ur registret","Underlag: omsättning, anställda, nuvarande leverantör","Lagt till i Spåret och som nästa steg på hemvyn"] } ] } },
  { fraga:"Hur ser marknaden ut?", ord:["marknad","hur många","register","segment","storlek","bolagsverket"],
    svar:{ chips:[{o:"Bolagsverket och allabolag",d:"14 september"},{o:"allabolag, bokslut 2025",d:"14 september"}], foljd:["Vad gör konkurrenterna?","Kan jag ta 2 000 kr i månaden?"], block:[
      { typ:"text", text:"312 redovisningsbyråer i Sverige har 5–20 anställda. Medianomsättning 4,2 miljoner. 18 % växte mer än 10 % förra räkenskapsåret." },
      { typ:"text", text:"47 av dem har du kontaktat. 265 är orörda. Marknaden är inte din flaskhals och har aldrig varit det — den delen av poängen ligger redan på 10 av 12." },
      { typ:"text", text:"Det som drar ner är att segmentet är stabilt, inte växande. Du tar andelar från någon annan, du rider ingen våg. Det gör priset viktigare, inte mindre viktigt." } ] } },
  { fraga:"Vad gör konkurrenterna?", ord:["konkurrent","kontea","balansera","leverantör","andra","system"],
    svar:{ chips:[{o:"SNI 62010 och 6 svar",d:"12 september"},{o:"Breakit",d:"12 september"}], foljd:["Ska jag börja bygga nu?","Vilka ska jag kontakta härnäst?"], block:[
      { typ:"text", text:"Fyra leverantörer täcker bokföringsflödet i segmentet. Ingen av dem säljer bokslutsberedning som ett eget steg. Det är luckan, och den är verklig." },
      { typ:"text", text:"Men två av sex svarande nämnde sina befintliga system spontant, båda som ett hinder. Luckan finns i produkterna — inte nödvändigtvis i huvudet på kunden." },
      { typ:"citat", text:"Om det hade legat inuti det vi redan har vore det en annan diskussion.", av:"Petra Lindqvist, Siffra & Sammanhang AB, 5 september" },
      { typ:"text", text:"Och Kontea tog in 40 miljoner i förra veckan för att automatisera återkommande moment. Din lucka har ett bäst före-datum." } ] } }
];
const FALLBACK = { chips:[{o:"Steg 05",d:"13 september"}], foljd:["Vilka ska jag kontakta härnäst?","Kan jag ta 2 000 kr i månaden?"], block:[
  { typ:"text", text:"Jag kan svara på det, men det för oss bort från det som avgör just nu." },
  { typ:"text", text:"Du har en motsagd prishypotes och två obesvarade samtal. Allt annat kan vänta tills prisfrågan är avgjord — och den avgörs inte av fler mejl, utan av två telefonsamtal." },
  { typ:"text", text:"Vill du att jag lägger upp samtalen?" } ] };

/* ——————————————————————————————————————————
   Nytt i den här versionen: upplåsningskraven, datalagret
   och bygget.
   —————————————————————————————————————————— */

/* Hur många svar utskicket har gett — växer när handlingsstegen görs. */
const SVAR_TILLSKOTT = { n1:2, n2:2, n3:0, n4:0 };

const UNLOCK = {
  rubrik: "Krav för att låsa steg 06 och öppna steg 07",
  klartText: "Steg 06 är låst och steg 07 är öppet",
  krit: [
    { b:"Företag kontaktade ur registret", s:"Urvalet är gjort och utskicket är kört",
      matt:() => "47 av 40", klar:() => true },
    { b:"Tio svar från målgruppen", s:"Vid tio blir underlaget hållbart. Vid sex är det antydande.",
      matt:() => S.svar + " av 10", klar:() => S.svar >= 10 },
    { b:"Prisnivån prövad mot ett tal du kan sätta", s:"Tre svar säger omkring 900 kr. Din kalkyl säger 2 000.",
      matt:() => (S.stepIdx >= 2 ? "8 prisuppgifter" : "3 prisuppgifter"), klar:() => S.stepIdx >= 2 },
    { b:"Kundprofilen bekräftad mot svaren", s:"De som säger ja har 11 anställda eller fler.",
      matt:() => (S.stepIdx >= 3 ? "11–20 anställda" : "5–20 anställda"), klar:() => S.stepIdx >= 3 }
  ]
};

/* Datalagret. Haisynth MCP är frågelagret ovanpå registren — det är
   därigenom Spark hämtar, korsar och tidsstämplar källorna. */
const LAYERS = [
  { hs:true, namn:"Haisynth MCP", txt:"Frågelagret ovanpå registren. Normaliserar organisationsnummer, korsar SNI mot bokslut och tidsstämplar varje hämtning.",
    sync:"Live", detalj:"svarstid 240 ms" },
  { namn:"Bolagsverket", txt:"Företagsregister, nyregistreringar, bolagsformer", sync:"14 sep 06:00", detalj:"via Haisynth" },
  { namn:"allabolag", txt:"Omsättning, anställda, tillväxt ur inlämnade årsredovisningar", sync:"14 sep 06:00", detalj:"via Haisynth" },
  { namn:"SCB", txt:"Branschstatistik och företagsdemografi", sync:"1 sep", detalj:"via Haisynth" },
  { namn:"verksamt.se · Skatteverket", txt:"Krav, blanketter, F-skatt, moms", sync:"12 sep", detalj:"direkt" },
  { namn:"Sparks egen data", txt:"Svarsfrekvens per bransch ur 214 valideringskörningar", sync:"Live", detalj:"internt" }
];
const HAISYNTH_NOTE = {
  rubrik: "Haisynth MCP ligger mellan Spark och registren",
  txt: "Utan det lagret blir varje källa en egen integration med eget format. Med det blir en fråga som \"redovisningsbyråer med 11–20 anställda och positiv tillväxt\" ett anrop — och svaret bär källa och hämtningsdatum hela vägen ut i gränssnittet."
};

/* Bygget — omfånget ur bevisen, och Lovable som fönster i Spark. */
const SCOPE = [
  { i:true, b:"K2-beredning ur SIE-fil", s:"Sofia Ekwall och Anders Rydell bad om det. Fyra avstämningar, samma varje gång." },
  { i:true, b:"Avvikelserapport före bokslut", s:"Kjell Byström: flyttande av siffror mellan samma fyra ställen." },
  { i:true, b:"Landningssida med e-postinsamling", s:"Behövs när utskicket går ut till de 265 okontaktade." },
  { i:false, b:"K3-stöd", s:"Bara 1 av 6 efterfrågade det. 40 000 kr räcker inte till båda regelverken." },
  { i:false, b:"Integration mot befintliga byråsystem", s:"Petra Lindqvist ville ha det. Ett halvårs arbete du inte kan göra själv." }
];
const LOVABLE_PROMPT =
'Bygg en landningssida och ett bokslutsverktyg för svenska redovisningsbyråer\n' +
'med 11–20 anställda.\n\n' +
'# MÅLGRUPP  (Bolagsverket via Haisynth, 14 sep 2026)\n' +
'115 byråer, SNI 69201, medianomsättning 5,9 Mkr.\n\n' +
'# BEKRÄFTAT PROBLEM  (4 av 6 svar, 5–13 sep)\n' +
'Bokslutsberedningen tar mest tid. 60-timmarsveckor i februari och mars.\n' +
'80 % av arbetet är samma manuella moment varje gång.\n\n' +
'# BYGG  (steg 08, omfånget ur bevisen)\n' +
'1. K2-beredning som läser SIE-fil och gör fyra avstämningar automatiskt\n' +
'2. Avvikelserapport: konton utan motpart, före bokslut\n' +
'3. Landningssida: rubrik, tre nyttor, e-postinsamling, GDPR-text\n\n' +
'# BYGG INTE\n' +
'- K3-stöd — bara 1 av 6 efterfrågade det\n' +
'- Integration mot Kontea eller Balansera — ingen teknisk partner\n\n' +
'# PRIS SOM SKA SYNAS\n' +
'900 kr per konsult och månad. Inte 2 000 — tre av fyra kunder\n' +
'har sagt nej till den nivån.\n\n' +
'# SPRÅK  Svenska.   # TON  Saklig, ingen startup-jargong.';

const BUILD_LOG = [
  ["$ lovable build --from-spark steg-08", "dim"],
  ["Ansluten som elin.oberg@vastakers.se", "ok"],
  ["Läser omfånget från Spark · 3 poster med, 2 poster ute", ""],
  ["Hämtar segmentdata via Haisynth MCP · 115 bolag", ""],
  ["Genererar projektstruktur", ""],
  ["  app/page.tsx · landningssida", "ok"],
  ["  app/verktyget/page.tsx · K2-beredning", "ok"],
  ["  lib/sie.ts · inläsning och fyra avstämningar", "ok"],
  ["  lib/avvikelser.ts · konton utan motpart", "ok"],
  ["  app/integritetspolicy/page.tsx · GDPR på svenska", "ok"],
  ["Sätter pris 900 kr per konsult och månad", ""],
  ["Bygger  ·  14 filer  ·  3,2 s", ""],
  ["Klart. Förhandsvisning öppnad.", "ok"]
];
const FILETREE = [
  [0, "app", "fd", false], [1, "page.tsx", "", true], [1, "layout.tsx", "", true],
  [1, "verktyget", "fd", false], [2, "page.tsx", "", true],
  [1, "integritetspolicy", "fd", false], [2, "page.tsx", "", true],
  [0, "lib", "fd", false], [1, "sie.ts", "", true], [1, "avvikelser.ts", "", true],
  [1, "k2.ts", "", true], [0, "components", "fd", false], [1, "EpostFalt.tsx", "", true],
  [1, "Prisblock.tsx", "", true], [0, "public", "fd", false], [1, "og.png", "", true]
];

/* —————————————— ikoner och hjälpare —————————————— */
const ICONS = {
  check:'<polyline points="20 6 9 17 4 12"/>',
  lock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  chevron:'<polyline points="6 9 12 15 18 9"/>',
  arrow:'<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  up:'<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
  down:'<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>',
  db:'<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
  mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22 6 12 13 2 6"/>',
  spark:'<path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12z"/>',
  quote:'<path d="M9 7H5a2 2 0 0 0-2 2v3h4v3H3v2h6V7zM21 7h-4a2 2 0 0 0-2 2v3h4v3h-4v2h6V7z"/>',
  warn:'<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  wrench:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  plus:'<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  help:'<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  slash:'<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>',
  enter:'<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
  msg:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  chart:'<line x1="4" y1="20" x2="4" y2="12"/><line x1="10" y1="20" x2="10" y2="5"/><line x1="16" y1="20" x2="16" y2="9"/><line x1="22" y1="20" x2="22" y2="14"/>',
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>',
  user:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M6.5 19a6 6 0 0 1 11 0"/>',
  hammer:'<path d="M14 6l4 4-8 8-4-4z"/><path d="M14 6l3-3 4 4-3 3"/><line x1="6" y1="14" x2="3" y2="17"/><line x1="3" y1="17" x2="6" y2="20"/>',
  layers:'<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  lockOpen:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.5-2"/>',
  folder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
  eye:'<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>',
  refresh:'<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/>'
};
const ic = (n, s = 14, cls = "") =>
  '<svg class="' + cls + '" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[n] || "") + '</svg>';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
const nl2 = (s) => esc(s).replace(/\n/g, "<br>");
const chip = (k, hs) => '<span class="chip' + (hs ? " hs" : "") + '">' + ic(hs ? "layers" : "db", 9) +
  '<span>' + esc(k.o) + ' · ' + esc(k.d) + '</span></span>';
const chips = (arr) => '<div class="chiprow">' + arr.map((k) => chip(k)).join("") + '</div>';
const pill = (t, ton) => '<span class="pill ' + (ton || "") + '">' + t + '</span>';
const bar = (pct, ton) => '<div class="bar ' + (ton || "") + '"><i data-w="' + Math.max(0, Math.min(100, pct)) + '"></i></div>';
const card = (head, body, cls) => '<section class="card rise ' + (cls || "") + '">' + head + body + '</section>';
const chead = (t, right) => '<div class="card-head"><h2>' + t + '</h2>' + (right || "") + '</div>';
/* ——————————————————————————————————————————————
   Sektionsmarkering. Bara data-attribut — app.js känner inte till
   designpanelen, och attributen är inert markup utan den.
   —————————————————————————————————————————————— */
function sek(id, namn, spalt, spaltNamn, inner) {
  return '<div data-section="' + id + '" data-section-name="' + namn +
    '" data-col="' + spalt + '" data-col-name="' + spaltNamn + '">' + inner + '</div>';
}
function sekV(id, namn, spalt, spaltNamn, grupp, varianter) {
  const lista = varianter.map((v) => v[0] + ":" + v[1]).join("|");
  return '<div data-section="' + id + '" data-section-name="' + namn +
    '" data-col="' + spalt + '" data-col-name="' + spaltNamn +
    '" data-variant-group="' + grupp + '" data-variants="' + lista + '">' +
    varianter.map((v) => '<div data-variant="' + v[0] + '">' + v[2] + '</div>').join("") +
    '</div>';
}

const pagehead = (titel, ingress) => '<header class="pagehead"><h1>' + esc(titel) + '</h1>' +
  (ingress ? '<p>' + esc(ingress) + '</p>' : "") + '</header>';

/* —————————————— tillstånd —————————————— */
const NAV = [
  ["hem","Hem","home"], ["medgrundaren","Medgrundaren","msg"], ["marknaden","Marknaden","chart"],
  ["valideringen","Valideringen","shield"], ["bygget","Bygget","hammer"], ["profilen","Profilen","user"]
];
const START_PARTS = {};
SCORE_PARTS.forEach((p) => (START_PARTS[p.key] = p.start));
const ORDNING = STEPS.map((s) => s.nr);
const REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let S;
function nollstall() {
  S = {
    route:"hem", parts:{ ...START_PARTS }, forra:52, sinceLast:14, animera:false,
    stepIdx:0, deferred:false, svar:6, bump:{},
    valtSteg:"05", oppenDel:"betalningsvilja", visaRakning:false, underlagOppet:false,
    trail:TRAIL0.map((t, i) => ({ ...t, id:"t" + i })),
    notes:NOTES0.map((n, i) => ({ ...n, id:"b" + i })),
    chat:[{ roll:"co", id:"c0", svar:OPENING, animera:false }],
    forslag:PROMPTS.slice(), stalda:[], busy:false,
    build:{ ansluten:false, tab:"prompt", bygger:false, byggt:false, logg:[], prompt:LOVABLE_PROMPT }
  };
}
nollstall();

const total = () => Object.values(S.parts).reduce((a, b) => a + b, 0);
const nivaFor = (p) => LEVELS.find((l) => p >= l.min && p <= l.max) || LEVELS[0];
const nastaSteg = () => NEXT_STEPS[Math.min(S.stepIdx, NEXT_STEPS.length - 1)];
const kritKlara = () => UNLOCK.krit.filter((k) => k.klar()).length;
const alltKlart = () => kritKlara() === UNLOCK.krit.length;
const aktivtNr = () => (alltKlart() ? "07" : "05");
function stegStatus(nr) {
  const i = ORDNING.indexOf(nr), gransen = alltKlart() ? 6 : 4;
  return i < gransen ? "klar" : i === gransen ? "nu" : "last";
}
let timers = [];
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

/* —————————————— sidhuvud —————————————— */
function renderTop() {
  const t = total(), n = nivaFor(t), ton = n.ton === "ok" ? "var(--ok)" : n.ton === "warn" ? "var(--warn)" : "var(--bad)";
  const omkrets = 2 * Math.PI * 14;
  document.getElementById("scorebtn").innerHTML =
    '<span class="ring"><svg width="34" height="34" viewBox="0 0 34 34">' +
      '<circle cx="17" cy="17" r="14" fill="none" stroke="var(--hair-2)" stroke-width="3.4"/>' +
      '<circle cx="17" cy="17" r="14" fill="none" stroke="' + ton + '" stroke-width="3.4" stroke-linecap="round" ' +
      'stroke-dasharray="' + omkrets.toFixed(1) + '" stroke-dashoffset="' + (omkrets * (1 - t / 100)).toFixed(1) + '" ' +
      'style="transition:stroke-dashoffset .9s cubic-bezier(.22,.68,.3,1)"/></svg>' +
      '<b data-score>' + t + '</b></span>' +
    '<span class="lbl"><span>' + n.namn + '</span><small>+' + S.sinceLast + ' sedan måndag</small></span>';

  const steg = STEPS.find((s) => s.nr === aktivtNr());
  const namn = (NAV.find((x) => x[0] === S.route) || NAV[0])[1];
  document.getElementById("crumb").innerHTML =
    '<b>' + namn + '</b><span class="full">·</span>' +
    '<span class="stepnow full"><i></i>Steg ' + steg.nr + ' av 12 · ' + esc(steg.namn) + '</span>';
}
function renderNav() {
  document.getElementById("sidenav").innerHTML = NAV.map(([r, namn, i]) =>
    '<button class="navbtn" type="button" data-nav="' + r + '"' + (S.route === r ? ' aria-current="page"' : "") + '>' +
    ic(i, 15) + namn +
    (r === "hem" ? '<span class="ct">' + kritKlara() + '/4</span>' : "") +
    (r === "valideringen" ? '<span class="ct">' + S.svar + '</span>' : "") + '</button>').join("");
  document.getElementById("mobnav").innerHTML = NAV.map(([r, namn]) =>
    '<button type="button" data-nav="' + r + '"' + (S.route === r ? ' aria-current="page"' : "") + '>' + namn + '</button>').join("");
}

/* —————————————— HEM: resan, handlingssteget och poängen —————————————— */
function railHTML() {
  const faser = PHASES.map((f) => {
    const ifas = STEPS.filter((s) => s.fas === f.namn);
    const aktiv = ifas.some((s) => stegStatus(s.nr) === "nu");
    return '<div class="phase' + (aktiv ? " on" : "") + '"><div class="ph"><b>' + f.namn + '</b>' +
      '<span>' + ifas.filter((s) => stegStatus(s.nr) === "klar").length + '/' + ifas.length + '</span></div>' +
      '<div class="dots">' + ifas.map((s) => {
        const st = stegStatus(s.nr);
        return '<button class="dotbtn ' + (st === "klar" ? "done" : st === "nu" ? "now" : "") +
          (S.valtSteg === s.nr ? " sel" : "") + '" type="button" data-act="valjsteg" data-nr="' + s.nr +
          '" title="Steg ' + s.nr + ' · ' + esc(s.namn) + '">' + s.nr + '</button>';
      }).join("") + '</div></div>';
  }).join("");

  const s = STEPS.find((x) => x.nr === S.valtSteg) || STEPS[4];
  const st = stegStatus(s.nr);
  const detalj = st === "last"
    ? '<p class="kort">' + esc(s.kravs) + '</p>' +
      '<div style="margin-top:12px">' + pill("Ger upp till " + s.max + " poäng", "blue") + '</div>'
    : '<p class="kort">' + esc(s.kort) + '</p><div class="sc-grid">' +
      '<div><div class="eyebrow">Vad som gjordes</div><ul>' +
        (s.gjordes || []).map((g) => '<li><span style="color:var(--ok);margin-top:2px">' + ic("check", 13) + '</span>' + esc(g) + '</li>').join("") +
      '</ul></div><div><div class="eyebrow">Vad som kom ut</div><dl class="sc-out">' +
        (s.resultat || []).map((r) => '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>').join("") +
      '</dl>' + (s.lank ? '<button class="btn sekundar sm" type="button" data-nav="' + byggLank(s.lank) + '" style="margin-top:12px">' +
        esc(s.lankText) + ic("arrow", 13) + '</button>' : "") + '</div></div>';

  return card(
    '<div class="card-head"><h2>Resan</h2><span class="note">' +
      STEPS.filter((x) => stegStatus(x.nr) === "klar").length + ' av 12 klara · du är på steg ' + aktivtNr() + '</span></div>',
    '<div class="rail"><div class="rail-phases">' + faser + '</div></div>' +
    '<div class="stepcard"><div class="sc-head"><span class="n">Steg ' + s.nr + '</span><h3>' + esc(s.namn) + '</h3>' +
      (st === "klar" ? pill(ic("check", 11) + " Klart", "ok") : st === "nu" ? pill("Du är här", "navy") : pill(ic("lock", 11) + " Låst")) +
      (s.datum && st !== "last" ? '<span class="note" style="margin-left:auto">' + esc(s.datum) + '</span>' : "") +
    '</div>' + detalj + '</div>');
}
/* Steg 08–10 pekar numera på Bygget. */
function byggLank(l) { return (l === "hjarnan" ? "medgrundaren" : l === "profilen" ? "profilen" : l); }

function actHTML() {
  const st = nastaSteg(), klar = alltKlart();
  const rader = UNLOCK.krit.map((k) => {
    const d = k.klar();
    return '<div class="crit' + (d ? " done" : "") + '"><span class="box">' + (d ? ic("check", 11) : "") + '</span>' +
      '<span class="txt"><b>' + esc(k.b) + '</b><span>' + esc(k.s) + '</span></span>' +
      '<span class="st">' + esc(k.matt()) + '</span></div>';
  }).join("");

  return '<section class="card rise act">' +
    '<div class="act-top">' + pill("Gör det här nu", "navy") +
      '<span class="note">' + esc(st.steg) + '</span>' +
      (S.stepIdx > 0 ? '<span style="margin-left:auto">' + pill(ic("check", 11) + " " + S.stepIdx + " klarade i dag", "ok") + '</span>' : "") +
    '</div>' +
    '<div class="act-body"><h2 class="big">' + esc(st.rubrik) + '</h2><p class="sub">' + esc(st.sub) + '</p>' +
      '<ul class="why">' + st.varfor.map((v) => '<li>' + ic("arrow", 13) + '<span>' + esc(v) + '</span></li>').join("") + '</ul>' +
      (S.underlagOppet ? '<div class="evid expand"><div class="eyebrow">Det här bygger på</div><ul>' +
        st.underlag.rader.map((r) => '<li><span>' + esc(r) + '</span></li>').join("") +
        '</ul><div style="margin-top:11px">' + chip(st.underlag.k) + '</div></div>' : "") +
      '<div class="actions">' +
        (st.sist
          ? '<button class="btn blue" type="button" data-nav="valideringen">Öppna domen' + ic("arrow", 14) + '</button>'
          : '<button class="btn primar" type="button" data-act="klar">' + ic("check", 14) + 'Markera klart</button>') +
        '<button class="btn sekundar" type="button" data-act="senare"' + (st.sist || S.deferred ? " disabled" : "") + '>' +
          (S.deferred ? "Skjutet till i morgon" : "Senare") + '</button>' +
        '<button class="btn tyst" type="button" data-act="underlag">' +
          (S.underlagOppet ? "Dölj underlaget" : "Visa underlaget") + '</button>' +
        (!st.sist && st.okning > 0 ? '<span class="gain">+' + st.okning + ' poäng</span>' : "") +
      '</div>' +
      '<div class="unlock' + (klar ? " klar" : "") + '"><div class="uh">' +
        (klar ? ic("lockOpen", 14) : ic("lock", 14)) +
        '<b>' + (klar ? UNLOCK.klartText : UNLOCK.rubrik) + '</b>' +
        '<span class="cnt">' + kritKlara() + ' av ' + UNLOCK.krit.length + '</span></div>' +
        rader + '</div>' +
    '</div></section>';
}

function scorePanelHTML() {
  const t = total(), n = nivaFor(t);
  const ton = n.ton;
  const delar = SCORE_PARTS.map((p) => {
    const v = S.parts[p.key], last = !!p.last, oppen = S.oppenDel === p.key;
    const andel = (v / p.max) * 100;
    const bton = last ? "dim" : andel >= 75 ? "ok" : andel >= 45 ? "warn" : "bad";
    let ut = '<button class="sp-part" type="button"' + (last ? ' disabled title="' + esc(p.last) + '"' : ' data-act="del" data-key="' + p.key + '"') + '>' +
      '<span class="nm">' + (last ? ic("lock", 11) : "") + esc(p.namn) + '</span>' +
      '<span class="bw">' + bar(andel, bton) + '</span>' +
      '<span class="vv">' + (last ? '<small>steg ' + (p.last.match(/steg (\d+)/) || [0, "08"])[1] + '</small>' : v + '<small>/' + p.max + '</small>') + '</span></button>';
    if (oppen && !last) {
      const bumps = S.bump[p.key] || {};
      ut += '<div class="sp-open expand">' + p.rader.map((r, idx) => {
        const b = bumps[idx], pv = r.p + (b ? b.dp : 0);
        return '<div class="subline"><div class="sh"><b>' + esc(r.r) + '</b><span>' + pv + ' / ' + r.m + '</span></div><ul>' +
          r.t.map((x) => '<li>' + esc(x) + '</li>').join("") +
          (b ? b.t.map((x) => '<li class="ny">' + esc(x) + '</li>').join("") : "") + '</ul>' +
          '<div class="cw">' + chips(b ? [r.k].concat(b.k) : [r.k]) + '</div></div>';
      }).join("") + (p.slutsats ? '<p style="margin-top:10px;font-size:12px;line-height:1.55;color:var(--ink)">' +
        esc(p.slutsats) + '</p>' : "") + '</div>';
    }
    return ut;
  }).join("");

  return card(
    '<div class="card-head"><h2>Poängen</h2><span class="note">bevisgrad</span></div>',
    '<div class="sp-top"><div><span class="big" data-score>' + t + '</span><span class="of">/100</span></div>' +
      '<div class="lv">' + n.namn + '</div><div class="mv">+' + S.sinceLast + ' sedan måndag</div>' +
      '<div class="sp-scale">' + bar(t, ton) +
        '<span class="sp-cap" style="left:calc(' + CAP_NOW + '% - 1px)"></span>' +
        '<div class="lg"><span>1</span><span>tak ' + CAP_NOW + '</span><span>100</span></div></div></div>' +
    delar +
    '<div class="sp-note">' +
      '<button class="btn tyst sm" type="button" data-act="rakning" style="padding:0">' +
        (S.visaRakning ? "Dölj" : "Så räknas poängen") + ic("chevron", 12) + '</button>' +
      (S.visaRakning ? '<p class="expand" style="margin-top:8px">Poängen räknas i kod ur strukturerad data, inte av en ' +
        'språkmodell. Modellen läser svaren och drar ut fakta; beräkningen sker i en vanlig funktion. Varje poäng har en ' +
        'källa och ett datum — finns ingen källa ges ingen poäng. Poängen kan gå ner om nya svar motsäger tidigare.</p>' : "") +
    '</div>');
}

/* Variant b för handlingssteget: en rad med kraven som chips. */
function actRadHTML() {
  const st = nastaSteg(), klar = alltKlart();
  return '<section class="card rise act">' +
    '<div class="act-top">' + pill("Gör det här nu", "navy") +
      '<span class="note">' + esc(st.steg) + '</span>' +
      '<span style="margin-left:auto">' + pill(kritKlara() + " av 4 krav", klar ? "ok" : "warn") + '</span></div>' +
    '<div class="act-body" style="padding-block:calc(14px*var(--space))">' +
      '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:calc(14px*var(--space))">' +
        '<h2 class="big" style="font-size:calc(18px*var(--scale));flex:1;min-width:14ch">' + esc(st.rubrik) + '</h2>' +
        (st.sist
          ? '<button class="btn blue" type="button" data-nav="valideringen">Öppna domen' + ic("arrow", 14) + '</button>'
          : '<button class="btn primar" type="button" data-act="klar">' + ic("check", 14) + 'Markera klart</button>') +
      '</div>' +
      '<p class="sub" style="margin-top:calc(8px*var(--space))">' + esc(st.sub) + '</p>' +
      '<div style="display:flex;flex-wrap:wrap;gap:calc(6px*var(--space));margin-top:calc(14px*var(--space))">' +
        UNLOCK.krit.map((k) => pill((k.klar() ? "✓ " : "○ ") + k.b, k.klar() ? "ok" : "")).join("") +
      '</div>' +
    '</div></section>';
}

/* Variant b för poängpanelen: ring i stället för stapelrad. */
function scoreRingHTML() {
  const t = total(), n = nivaFor(t);
  const ton = n.ton === "ok" ? "var(--ok)" : n.ton === "warn" ? "var(--warn)" : "var(--bad)";
  const o = 2 * Math.PI * 46;
  return card(
    '<div class="card-head"><h2>Poängen</h2><span class="note">bevisgrad</span></div>',
    '<div style="display:flex;flex-direction:column;align-items:center;padding:calc(20px*var(--space))">' +
      '<div style="position:relative;width:112px;height:112px">' +
        '<svg width="112" height="112" viewBox="0 0 112 112" style="transform:rotate(-90deg)">' +
          '<circle cx="56" cy="56" r="46" fill="none" stroke="var(--hair-2)" stroke-width="8"/>' +
          '<circle cx="56" cy="56" r="46" fill="none" stroke="' + ton + '" stroke-width="8" stroke-linecap="round" ' +
          'stroke-dasharray="' + o.toFixed(1) + '" stroke-dashoffset="' + (o * (1 - t / 100)).toFixed(1) + '" ' +
          'style="transition:stroke-dashoffset .9s cubic-bezier(.22,.68,.3,1)"/></svg>' +
        '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">' +
          '<span class="num" data-score style="font-size:calc(30px*var(--scale));color:var(--ink);line-height:1">' + t + '</span>' +
          '<span style="font-size:calc(10px*var(--scale));color:var(--ink-3)">av 100</span></div>' +
      '</div>' +
      '<div style="margin-top:calc(10px*var(--space));font-size:calc(12.5px*var(--scale));color:var(--ink)">' + n.namn + '</div>' +
      '<div style="margin-top:calc(3px*var(--space));font-size:calc(11px*var(--scale));color:var(--ok)">+' + S.sinceLast + ' sedan måndag</div>' +
    '</div>' +
    SCORE_PARTS.filter((p) => !p.last).map((p) => {
      const v = S.parts[p.key], andel = (v / p.max) * 100;
      const bton = andel >= 75 ? "ok" : andel >= 45 ? "warn" : "bad";
      return '<div style="display:flex;align-items:center;gap:calc(10px*var(--space));padding:calc(7px*var(--space)) calc(18px*var(--space));' +
        'border-top:var(--border-width) solid var(--hair-2)">' +
        '<span style="flex:1;min-width:0;font-size:calc(12px*var(--scale));color:var(--ink)">' + p.namn + '</span>' +
        '<span style="flex:0 0 56px">' + bar(andel, bton) + '</span>' +
        '<span class="num" style="font-size:calc(11.5px*var(--scale));color:var(--ink)">' + v + '<small style="color:var(--ink-3)">/' + p.max + '</small></span>' +
      '</div>';
    }).join(""));
}

function vyHem() {
  const ikon = { svar:"mail", register:"layers", poang:"up", verktyg:"check" };
  const trail = card(chead("Sedan sist"),
    '<ul class="trail">' + S.trail.slice(0, 4).map((t) =>
      '<li class="fade"><span class="ico' + (t.typ === "poang" ? " ok" : "") + '">' + ic(ikon[t.typ] || "check", 12) + '</span>' +
      '<p>' + esc(t.text) + '</p><time>' + esc(t.tid) + '</time></li>').join("") + '</ul>');

  const sugg = card(
    '<div class="card-head"><h2>Höj din poäng</h2><span class="note">sorterat efter poäng per insats</span></div>',
    '<div class="sugggrid">' + SUGGESTIONS.map((s) =>
      '<div class="sg"><div class="sgh"><span class="pl">+' + s.plus + '</span><b>' + esc(s.rubrik) + '</b></div>' +
      s.mot.map((m) => '<p>' + esc(m) + '</p>').join("") +
      (s.reg ? '<p class="reg">' + esc(s.reg) + '</p>' : "") +
      '<div class="sgf">' + pill(s.tid) + pill(GAP_LABELS[s.lucka], s.lucka === "underlag" ? "" : "warn") +
      '<button class="btn sekundar sm" type="button">' + esc(s.knapp) + '</button></div></div>').join("") + '</div>' +
    '<div class="gap3"><div class="gh">' + ic("warn", 13) + '<b>Strukturell lucka</b></div>' +
      '<p>' + esc(STRUCT_GAP.text) + '</p><div class="gl">' +
      STRUCT_GAP.atgarder.map((a) => '<span>' + esc(a) + '</span>').join("") + '</div></div>');

  const pulse = card(
    '<div class="card-head"><h2>Pulsen</h2><span class="note" style="display:flex;align-items:center;gap:6px">' +
      '<span class="dot"></span>14 september · tre signaler som rör just din idé</span></div>',
    '<div class="pulse3">' + PULSE.map((p) => {
      const ton = p.ton === "bad" ? "bad" : "ok";
      return '<div><div class="ph"><span class="ico" style="background:var(--' + ton + '-soft);color:var(--' + ton + ')">' +
        ic(p.ton === "bad" ? "down" : "up", 12) + '</span><h4>' + esc(p.rubrik) + '</h4></div>' +
        '<p class="wy">' + esc(p.varfor) + '</p><div class="cw">' + chip(p.k) + '</div></div>';
    }).join("") + '</div>');

  return '<div class="stack">' +
    '<div class="hero"><div class="stack">' +
      sekV("act", "Handlingssteget", "huvud", "Huvudspalt", "hem-act",
        [["a", "Stor rubrik", actHTML()], ["b", "Kompakt rad", actRadHTML()]]) +
      sek("rail", "Resan", "huvud", "Huvudspalt", railHTML()) +
    '</div><div class="stack">' +
      sekV("score", "Poängen", "sido", "Sidospalt", "hem-score",
        [["a", "Staplar", scorePanelHTML()], ["b", "Ring", scoreRingHTML()]]) +
      sek("trail", "Sedan sist", "sido", "Sidospalt", trail) +
    '</div></div>' +
    sek("sugg", "Höj din poäng", "botten", "Nedre delen", sugg) +
    sek("pulse", "Pulsen", "botten", "Nedre delen", pulse) + '</div>';
}

/* —————————————— MEDGRUNDAREN + HJÄRNAN —————————————— */
function vyMedgrundaren() {
  const anvanda = S.notes.filter((n) => n.anvand).length;
  const hjarnan = card(
    '<div class="card-head"><h2>Hjärnan</h2><span class="note">' + S.notes.length + ' · ' + anvanda + ' använda</span></div>',
    '<div class="brainbox"><div class="add">' +
      '<textarea id="noteinput" rows="2" placeholder="Skriv ner det innan du glömmer det"></textarea>' +
      '<div class="af"><span>Spark läser men städar aldrig</span>' +
      '<button class="btn sekundar sm" type="button" data-act="addnote">' + ic("plus", 13) + 'Lägg till</button></div></div>' +
      '<ul class="notes">' + S.notes.map((n) =>
        '<li' + (n.anvand ? "" : ' class="tri"') + '><div class="nh"><time>' + esc(n.datum) + '</time>' +
        (n.anvand ? '<span class="used">' + esc(n.anvand) + '</span>' : "") + '</div>' +
        '<p>' + esc(n.text) + '</p></li>').join("") + '</ul></div>');

  return pagehead("Medgrundaren",
    "Samma medgrundare varje gång. Den läser profilen, hjärnan och spåret inför varje svar — och säger rakt ut vad den tycker.") +
    '<div class="cog">' + sek("chat", "Samtalet", "huvud", "Huvudspalt",
      '<section class="card chatbox">' +
      '<div class="card-head"><span style="display:flex;align-items:center;gap:8px"><span class="dot"></span>' +
        '<h2 style="font-size:13px;font-weight:500;color:var(--ink-2)">Läser profilen, hjärnan och spåret</h2></span>' +
        pill("Steg " + aktivtNr(), "blue") + '</div>' +
      '<div class="chatlog" id="chatlog"></div>' +
      '<div class="chatfoot"><div class="suggest" id="suggest"></div>' +
        '<div class="composer"><input id="chatinput" type="text" placeholder="Skriv till din medgrundare" autocomplete="off">' +
        '<button class="snd" type="button" data-act="send" aria-label="Skicka">' + ic("enter", 14) + '</button></div></div>' +
      '</section>') +
    '<div>' + sek("hjarnan", "Hjärnan", "sido", "Sidospalt", hjarnan) + '</div></div>';
}

/* —————————————— MARKNADEN —————————————— */
function vyMarknaden() {
  const maxN = Math.max.apply(null, DIST.map((d) => d.n));
  const stats = '<div class="stats">' + MARKET_HEAD.map((h) =>
    '<div class="card rise stat"><div class="big">' + h.v + '</div><div class="u">' + h.u + '</div>' +
    '<p class="d">' + esc(h.d) + '</p><div class="cw">' + chip(h.k) + '</div></div>').join("") + '</div>';

  const lager = card(chead("Datalagret"),
    '<div class="hsbanner">' + ic("layers", 18, "") + '<div class="bd"><b>' + esc(HAISYNTH_NOTE.rubrik) + '</b>' +
      '<p>' + esc(HAISYNTH_NOTE.txt) + '</p></div></div>' +
    '<ul class="layers">' + LAYERS.map((l) =>
      '<li' + (l.hs ? ' class="hs"' : "") + '><span class="lg">' + ic(l.hs ? "layers" : "db", 13) + '</span>' +
      '<span class="bd"><b>' + esc(l.namn) + '</b><span>' + esc(l.txt) + '</span></span>' +
      '<span class="sy"><b>' + esc(l.sync) + '</b><span>' + esc(l.detalj) + '</span></span></li>').join("") + '</ul>');

  const dist = card(chead("Storleksfördelning", '<span class="note">SNI 69201</span>'),
    '<div style="padding:16px 18px">' + DIST.map((d) =>
      '<div class="distrow"><span class="lb">' + d.s + '</span><span class="tk"><i data-w="' + ((d.n / maxN) * 100) + '"></i></span>' +
      '<span class="vl"><b>' + d.n + '</b> · ' + d.m + '</span></div>').join("") +
    '<p class="insight">197 av 312 har färre än 11 anställda. Det är den halvan som avvisade idén i samtalen och den som ' +
      'drar ner medianomsättningen — därför föreslår Spark att du snävar kundprofilen.</p>' +
    '<div style="margin-top:12px">' + chip({ o:"allabolag via Haisynth, 312 bolag", d:"14 september 2026" }, true) + '</div></div>');

  const utskick = card(chead("Dina utskick"),
    '<div style="padding:12px 18px 16px"><dl>' +
      [["I registret", CONTACT.totalt], ["Kontaktade", CONTACT.kontaktade], ["Svar", S.svar],
       ["Okontaktade", CONTACT.totalt - CONTACT.kontaktade]]
      .map((r) => '<div class="kv"><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>').join("") + '</dl>' +
    '<div class="callout"><div class="ch"><span>Svarsfrekvens</span><b>' + CONTACT.frekvens + '</b></div>' +
      '<p>Normalt i branschen är ' + CONTACT.benchmark + '. Språket fungerar — det är underlagets storlek som är problemet.</p></div>' +
    '<div style="margin-top:12px">' + chip(CONTACT.k) + '</div></div>');

  const lista = card(chead("Kundlistan", '<span class="note">namngivna företag · demonstrationsdata</span>'),
    '<div class="tablewrap"><table><thead><tr>' +
      ["Företag","Ort","Omsättning","Anst.","Status","Senast"].map((h) => '<th>' + h + '</th>').join("") +
    '</tr></thead><tbody>' + COMPANIES.map((c) =>
      '<tr><td class="strong">' + esc(c[0]) + '</td><td>' + esc(c[1]) + '</td><td class="num">' + c[2] + '</td>' +
      '<td class="num">' + c[3] + '</td><td>' + pill(STATUS_TXT[c[4]], c[4] === "svarat" ? "ok" : c[4] === "kontaktad" ? "blue" : "") + '</td>' +
      '<td style="color:var(--ink-3);font-size:12px">' + esc(c[5]) + '</td></tr>').join("") +
    '</tbody></table></div>' +
    '<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;padding:12px 18px;border-top:1px solid var(--hair-2)">' +
      '<span style="font-size:12px;color:var(--ink-3)">10 av 312 träffar. Resten finns i listan med kontaktuppgifter.</span>' +
      chip({ o:"Bolagsverket via Haisynth", d:"14 september 2026" }, true) + '</div>');

  const konk = card(chead("Vem som redan finns där"),
    '<div class="tablewrap"><table><thead><tr>' +
      ["Leverantör","Vad de är","Prisnivå","Täcker"].map((h) => '<th>' + h + '</th>').join("") +
    '</tr></thead><tbody>' + COMPETITORS.map((k) =>
      '<tr><td class="strong">' + esc(k[0]) + '</td><td>' + esc(k[1]) + '</td><td class="num">' + esc(k[2]) + '</td>' +
      '<td style="color:var(--ink-3)">' + esc(k[3]) + '</td></tr>').join("") + '</tbody></table></div>' +
    '<div style="padding:14px 18px;border-top:1px solid var(--hair-2)"><p style="max-width:78ch;font-size:12.5px;line-height:1.6">' +
      esc(COMP_VERDICT) + '</p><div style="margin-top:10px">' + chip(COMP_SRC) + '</div></div>');

  return pagehead("Redovisningsbyråer, 5–20 anställda",
    "Varje siffra här är hämtad ur registret, inte uppskattad. Haisynth MCP är lagret som gör källorna till en enda fråga.") +
    '<div class="stack">' +
      sek("stats", "Nyckeltalen", "huvud", "Huvudspalt", stats) +
      '<div class="split">' +
        sek("dist", "Storleksfördelning", "huvud", "Huvudspalt", dist) +
        '<div class="stack">' +
          sek("utskick", "Dina utskick", "sido", "Sidospalt", utskick) +
          sek("lager", "Datalagret", "sido", "Sidospalt", lager) +
        '</div></div>' +
      sek("lista", "Kundlistan", "huvud", "Huvudspalt", lista) +
      sek("konk", "Konkurrenterna", "huvud", "Huvudspalt", konk) + '</div>';
}

/* —————————————— VALIDERINGEN —————————————— */
function vyValideringen() {
  const sIko = { "bekräftat":"check", "motsagt":"slash", "obesvarat":"help" };
  const sTon = { "bekräftat":"ok", "motsagt":"bad", "obesvarat":"warn" };
  const stats = '<div class="stats">' + [
    [String(OUTREACH.kontaktade), "kontaktade", OUTREACH.period],
    [String(S.svar), "svar", "samtliga lästa och nedbrutna"],
    [OUTREACH.frekvens, "svarsfrekvens", "på 47 utskick"],
    [OUTREACH.benchmark, "branschens normalvärde", "Sparks data, 214 körningar"]
  ].map((k) => '<div class="card rise stat"><div class="big">' + k[0] + '</div><div class="u">' + k[1] + '</div>' +
    '<p class="d">' + esc(k[2]) + '</p></div>').join("") + '</div>';

  const antag = card(chead("Antagandena som prövades", chip(OUTREACH.k)),
    '<ul class="assum">' + ASSUMPTIONS.map((a) =>
      '<li><div class="ah"><div class="at"><span class="ico" style="background:var(--' + sTon[a.s] + '-soft);color:var(--' + sTon[a.s] + ')">' +
      ic(sIko[a.s], 13) + '</span><h4>' + esc(a.t) + '</h4></div>' + pill(a.s, sTon[a.s]) + '</div>' +
      '<p class="bdy">' + esc(a.u) + '</p><div class="cw">' + chip(a.k) + '</div></li>').join("") + '</ul>');

  const svar = '<div><div style="display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:12px">' +
    '<h3>Svaren, ordagrant</h3><span style="font-size:12px;color:var(--ink-3)">2 av 6 avvisar. Det är underlaget, inte ett urval.</span></div>' +
    '<div class="replies">' + REPLIES.map((r) => {
      const init = r.person.split(" ").map((x) => x[0]).join("");
      return '<article class="card rise reply"><div class="rh"><div class="who"><span class="av">' + init + '</span>' +
        '<span><b>' + esc(r.person) + '</b><span>' + esc(r.roll) + ' · ' + esc(r.foretag) + '</span></span></div>' +
        pill(STANCE_TXT[r.stance], STANCE_TON[r.stance]) + '</div>' +
        '<div class="rb"><blockquote>' + esc(r.citat) + '</blockquote></div>' +
        '<div class="rf"><span>' + esc(r.ort) + ' · ' + r.anst + ' anställda · ' + esc(r.datum) + '</span>' +
        (r.pris ? '<span style="color:var(--ok)">' + r.pris + ' kr/mån</span>' : '<span>inget pris</span>') + '</div></article>';
    }).join("") + '</div></div>';

  const pris = card(chead("Prisunderlaget"),
    '<div class="pricebox"><div><div class="pl">Vad kunderna sa</div>' +
      '<div style="display:flex;gap:7px;margin-top:8px">' + PRICE.angivna.map((p) => '<span class="ptag">' + p + ' kr</span>').join("") + '</div>' +
      '<div style="margin-top:9px;font-size:11.5px;color:var(--ink-3)">Median ' + PRICE.median + ' kr · 3 av 4 svarande</div></div>' +
      '<span class="vdivider"></span><div><div class="pl">Ditt pris</div>' +
      '<div style="margin-top:8px"><span class="ptag bad">' + PRICE.ditt + ' kr</span></div>' +
      '<div style="margin-top:9px;font-size:11.5px;color:var(--bad)">' + PRICE.faktor + ' för högt</div></div></div>' +
    '<div style="padding:0 18px 16px">' + chip(PRICE.k) + '</div>');

  const dom = '<section class="card rise verdict"><div class="vh">' + ic("warn", 14) + 'Domen · steg 06</div>' +
    '<div class="vb"><h2>' + VERDICT.beslut + '</h2>' +
    '<div class="vt"><p>' + esc(VERDICT.sammanfattning) + '</p><p>' + esc(VERDICT.invandning) + '</p></div>' +
    '<div class="ac">' + esc(VERDICT.atgard) + '</div><p class="dt">' + esc(VERDICT.detalj) + '</p>' +
    '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:11px;margin-top:16px">' + chip(VERDICT.k) +
    '<span style="font-size:12px;color:var(--ink-3)">' +
      (alltKlart() ? "Underlaget räcker nu. Domen kan låsas och steg 07 är öppet." : esc(VERDICT.sparr)) +
    '</span></div></div></section>';

  return pagehead("Sex svar från namngivna personer",
    "Spark byggde listan ur registret, skrev mejlen och skickade dem från Elins egen adress. Det här kom tillbaka — ordagrant, med avsändare och datum.") +
    '<div class="stack">' +
      sek("vstats", "Nyckeltalen", "huvud", "Huvudspalt", stats) +
      sek("antaganden", "Antagandena", "huvud", "Huvudspalt", antag) +
      sek("svaren", "Svaren", "huvud", "Huvudspalt", svar) +
      sek("pris", "Prisunderlaget", "huvud", "Huvudspalt", pris) +
      sek("domen", "Domen", "huvud", "Huvudspalt", dom) + '</div>';
}

/* —————————————— BYGGET: Lovable som fönster i Spark —————————————— */
function lovableBody() {
  const b = S.build;
  if (!b.ansluten) {
    return '<div class="lv-login fade"><span class="lg">' + ic("hammer", 22) + '</span>' +
      '<h3>Logga in på Lovable</h3>' +
      '<p>Spark skickar omfånget ur steg 08 direkt till din egen Lovable-arbetsyta. Projektet ligger hos dig — ' +
      'Spark skriver bara prompten och läser tillbaka bygget.</p>' +
      '<button class="btn primar" type="button" data-act="lvlogin">Fortsätt till Lovable' + ic("arrow", 14) + '</button>' +
      '<p class="fine">Spark begär åtkomst till att skapa och läsa projekt. Inte till din fakturering.</p></div>';
  }
  if (b.tab === "prompt") {
    return '<div class="fade"><div class="lv-acct">' + ic("check", 13) + 'Ansluten som elin.oberg@vastakers.se · arbetsytan Elin Öberg</div>' +
      '<div class="prompt-area"><div class="ph"><span class="eyebrow">Prompt genererad ur bevisen</span>' +
        '<span class="note" style="font-family:var(--mono);font-size:10.5px;color:var(--ink-3)">steg 08 · 3 med, 2 ute</span></div>' +
        '<textarea id="lvprompt" spellcheck="false">' + esc(b.prompt) + '</textarea></div>' +
      '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:9px;margin-top:14px">' +
        '<button class="btn blue" type="button" data-act="lvbuild"' + (b.bygger ? " disabled" : "") + '>' +
          (b.bygger ? ic("refresh", 14, "spin") + 'Bygger' : ic("hammer", 14) + 'Bygg i Lovable') + '</button>' +
        (b.byggt ? '<button class="btn sekundar" type="button" data-act="lvtab" data-tab="forhandsvisning">' +
          ic("eye", 14) + 'Öppna förhandsvisning</button>' : "") +
        '<span style="margin-left:auto;font-size:11.5px;color:var(--ink-3)">Prompten går att redigera innan du skickar den</span>' +
      '</div>' +
      (b.logg.length ? '<div class="lv-log" id="lvlog">' + b.logg.map((l) =>
        '<div class="' + (l[1] || "") + '">' + (l[1] === "ok" ? "✓ " : "") + esc(l[0]) + '</div>').join("") + '</div>' : "") +
      '</div>';
  }
  if (b.tab === "filer") {
    return '<div class="fade"><div class="eyebrow" style="margin-bottom:10px">14 filer · genererade 15 september</div>' +
      '<div class="filetree">' + FILETREE.map((f) =>
        '<div><span style="display:inline-block;width:' + (f[0] * 18) + 'px"></span>' +
        '<i>' + ic(f[1].indexOf(".") === -1 ? "folder" : "file", 12) + '</i>' +
        '<span class="' + (f[2] === "fd" ? "fd" : "nw") + '">' + esc(f[1]) + '</span></div>').join("") + '</div></div>';
  }
  return '<div class="fade"><div class="prev">' +
    '<div class="prev-hero"><span class="badge">' + ic("check", 12) + 'Byggt ur 6 kundsvar</span>' +
      '<h2>Bokslutssäsongen behöver inte vara tre månader</h2>' +
      '<p>Läser din SIE-fil, gör de fyra avstämningarna och visar konton utan motpart — innan du öppnar bokslutet. ' +
      'För byråer med 11–20 anställda.</p>' +
      '<div class="prev-form"><input type="email" placeholder="din@byra.se" aria-label="E-post">' +
      '<button class="btn primar" type="button">Boka en genomgång</button></div>' +
      '<p style="margin-top:14px;font-family:var(--mono);font-size:11px;color:var(--ink-3)">900 kr per konsult och månad</p></div>' +
    '<div class="prev-feat">' + [
      ["Fyra avstämningar", "Samma varje gång, gjorda automatiskt ur SIE-filen."],
      ["Avvikelser först", "Konton utan motpart visas innan bokslutet öppnas."],
      ["K2 i dag", "K3 när underlaget bär det. Inte tidigare."]
    ].map((f) => '<div><b>' + f[0] + '</b><p>' + f[1] + '</p></div>').join("") + '</div></div>' +
    '<p style="margin-top:14px;font-size:12px;line-height:1.55;color:var(--ink-3)">Rubriken kommer ur Kjell Byströms ' +
    'svar den 13 september. Priset ur medianen på de tre prisuppgifterna. Ingenting i sidan är påhittat av en modell.</p></div>';
}
function vyBygget() {
  const klar = alltKlart(), b = S.build;
  const gate = '<div class="gatebar' + (klar ? " klar" : "") + '"><span class="ico">' +
    ic(klar ? "check" : "warn", 15) + '</span><div class="bd">' +
    '<b>' + (klar ? "Omfånget vilar på åtta prisuppgifter" : "Omfånget bygger på en dom som inte är låst") + '</b>' +
    '<p>' + (klar
      ? "Kundprofilen är snävad, prisnivån är prövad och tio svar är inne. Bygg det här."
      : "Du kan bygga nu, men du bygger mot 2 000 kr som tre av fyra kunder redan sagt nej till. Lås steg 06 först — det är fyra krav och tre av dem tar en halvtimme.") + '</p></div>' +
    (klar ? "" : '<button class="btn sekundar" type="button" data-nav="hem">Visa kraven' + ic("arrow", 13) + '</button>') + '</div>';

  const scope = card(chead("Omfånget", '<span class="note">steg 08</span>'),
    '<ul class="scope">' + SCOPE.map((s, i) =>
      '<li' + (s.i ? "" : ' class="ute"') + '><span class="n">' + (s.i ? i + 1 : ic("slash", 11)) + '</span>' +
      '<span class="bd"><b>' + esc(s.b) + '</b><span>' + esc(s.s) + '</span></span></li>').join("") + '</ul>' +
    '<div style="padding:12px 16px;border-top:1px solid var(--hair-2)">' +
      chip({ o:"steg 06 och 6 svar", d:"13 september" }) +
      '<p style="margin-top:9px;font-size:11.5px;line-height:1.55;color:var(--ink-3)">Omfånget genereras ur bevisen, ' +
      'inte ur idén. Bygg bara det de som svarade faktiskt bad om.</p></div>');

  const fonster = '<div class="win rise">' +
    '<div class="win-bar"><span class="lights"><i></i><i></i><i></i></span>' +
      '<span class="win-url">' + ic("check", 11) + 'lovable.dev/projects/spark-bokslut' + (b.byggt ? " · byggd" : "") + '</span>' +
      '<span class="note" style="font-family:var(--mono);font-size:10.5px;color:var(--ink-3)">Lovable i Spark</span></div>' +
    (b.ansluten ? '<div class="win-tabs" role="tablist">' + [
      ["prompt", "Prompt"], ["forhandsvisning", "Förhandsvisning"], ["filer", "Filer"]
    ].map((t) => '<button type="button" role="tab" data-act="lvtab" data-tab="' + t[0] + '"' +
      ' aria-selected="' + (b.tab === t[0] ? "true" : "false") + '"' +
      (t[0] !== "prompt" && !b.byggt ? " disabled" : "") + '>' + t[1] + '</button>').join("") + '</div>' : "") +
    '<div class="win-body">' + lovableBody() + '</div></div>';

  return pagehead("Bygget",
    "Lovable körs i ett fönster inuti Spark. Prompten skrivs av medgrundaren ur bevisen i steg 06 — du loggar in med ditt eget konto och projektet blir ditt.") +
    '<div class="stack">' +
      sek("gate", "Grinden", "huvud", "Huvudspalt", gate) +
      '<div class="buildwrap">' +
        sek("scope", "Omfånget", "sido", "Sidospalt", scope) +
        sek("fonster", "Lovable-fönstret", "huvud", "Huvudspalt", fonster) +
      '</div></div>';
}

/* —————————————— PROFILEN —————————————— */
function vyProfilen() {
  const kedja = card(chead("Härifrån kom idén"),
    '<div style="padding:18px"><div class="chain">' +
      '<div class="bx"><div class="eyebrow">Bakgrunden</div><p>' + esc(CHAIN.fran) + '</p></div>' +
      '<div class="ar">' + ic("arrow", 16) + '</div>' +
      '<div class="bx"><div class="eyebrow">Genom hjärnan</div><p>' + esc(CHAIN.via) + '</p></div>' +
      '<div class="ar">' + ic("arrow", 16) + '</div>' +
      '<div class="bx end"><div class="eyebrow">Idén</div><p>' + esc(CHAIN.till) + '</p></div></div>' +
    '<p style="margin-top:16px;max-width:82ch;font-size:12.5px;line-height:1.65">' + esc(CHAIN.motivering) + '</p>' +
    '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:11px;margin-top:14px">' +
      chip({ o:"Profilen och Hjärnan", d:"2 september" }) +
      '<button class="btn sekundar sm" type="button" data-nav="medgrundaren">Se anteckningarna' + ic("arrow", 13) + '</button>' +
    '</div></div></div>');
  const block = PROFILE.map((b) => card(chead(b.rubrik),
    '<dl class="pf">' + b.rader.map((r) => '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>' +
      (r[2] ? '<div class="cw">' + chip(r[2]) + '</div>' : "") + '</div>').join("") + '</dl>')).join("");
  return pagehead("Elin Öberg, 26 år, Göteborg",
    "Byggd genom samtal, inte formulär. Det är härifrån idéerna kommer — och därför medgrundaren kan säga emot dig utan att fråga om bakgrunden igen.") +
    '<div class="stack">' +
      sek("kedja", "Härifrån kom idén", "huvud", "Huvudspalt", kedja) +
      sek("profblock", "Profilblocken", "huvud", "Huvudspalt", '<div class="profgrid">' + block + '</div>') + '</div>';
}

/* —————————————— chatten: strömmande svar —————————————— */
function scrollChat() { const l = document.getElementById("chatlog"); if (l) l.scrollTop = l.scrollHeight; }
function typeInto(el, text, done) {
  if (REDUCED) { el.textContent = text; scrollChat(); done(); return; }
  const node = document.createTextNode(""), caret = document.createElement("span");
  caret.className = "caret";
  el.appendChild(node); el.appendChild(caret);
  let i = 0;
  const tick = () => {
    i = Math.min(text.length, i + 2);
    node.data = text.slice(0, i);
    scrollChat();
    if (i >= text.length) { caret.remove(); done(); return; }
    const c = text[i - 1];
    timers.push(setTimeout(tick, c === "." || c === "?" || c === "!" ? 95 : 11));
  };
  timers.push(setTimeout(tick, 90));
}
function blockHTML(b) {
  if (b.typ === "text") return '<p class="para">' + esc(b.text) + '</p>';
  if (b.typ === "citat") return '<figure class="citat"><blockquote>' + esc(b.text) + '</blockquote>' +
    '<figcaption>' + esc(b.av) + '</figcaption></figure>';
  if (b.typ === "punkter") return '<ul class="bullets">' + b.punkter.map((p, i) =>
    '<li><b>' + (i + 1) + '</b><span>' + esc(p) + '</span></li>').join("") + '</ul>';
  return '<div class="tool"><div class="th">' + ic("wrench", 13) + '<span>' + esc(b.rubrik) + '</span></div><ul>' +
    b.rader.map((r) => '<li>' + esc(r) + '</li>').join("") + '</ul>' +
    (b.nav ? '<button type="button" data-nav="' + (b.nav === "hem" ? "hem" : b.nav) + '">' + esc(b.navText) + ic("arrow", 13) + '</button>' : "") + '</div>';
}
const coFullHTML = (s) => '<div class="msg co"><div class="av-co">M</div><div class="cobody">' +
  s.block.map(blockHTML).join("") + chips(s.chips) + '</div></div>';
const elinHTML = (t) => '<div class="msg elin rise"><div class="bubble"><p>' + esc(t) + '</p></div></div>';

function renderSuggest() {
  const el = document.getElementById("suggest");
  if (!el) return;
  el.innerHTML = S.forslag.filter((f) => S.stalda.indexOf(f) === -1).map((f) =>
    '<button type="button" data-act="ask" data-q="' + esc(f) + '"' + (S.busy ? " disabled" : "") + '>' + esc(f) + '</button>').join("");
}
function renderChat() {
  const log = document.getElementById("chatlog");
  if (!log) return;
  log.innerHTML = "";
  let pending = null;
  S.chat.forEach((it) => {
    if (it.roll === "elin") { log.insertAdjacentHTML("beforeend", elinHTML(it.text)); return; }
    if (it.animera) { pending = it; return; }
    log.insertAdjacentHTML("beforeend", coFullHTML(it.svar));
  });
  if (S.busy && !pending) log.insertAdjacentHTML("beforeend",
    '<div class="msg co fade"><div class="av-co">M</div><div class="thinking"><span></span>' +
    '<span style="animation-delay:.18s"></span><span style="animation-delay:.36s"></span></div></div>');
  renderSuggest(); scrollChat();
  if (pending) streama(pending, log);
}
function streama(item, log) {
  const wrap = document.createElement("div");
  wrap.className = "msg co";
  wrap.innerHTML = '<div class="av-co">M</div><div class="cobody"></div>';
  log.appendChild(wrap);
  const body = wrap.querySelector(".cobody"), blocks = item.svar.block;
  let bi = 0;
  const nasta = () => {
    if (bi >= blocks.length) {
      body.insertAdjacentHTML("beforeend", '<div class="fade">' + chips(item.svar.chips) + '</div>');
      item.animera = false; S.busy = false; renderSuggest(); scrollChat();
      return;
    }
    const b = blocks[bi++];
    if (b.typ === "text") {
      const p = document.createElement("p"); p.className = "para";
      body.appendChild(p); typeInto(p, b.text, nasta);
    } else if (b.typ === "citat") {
      const f = document.createElement("figure"); f.className = "citat fade";
      f.innerHTML = '<blockquote></blockquote><figcaption>' + esc(b.av) + '</figcaption>';
      body.appendChild(f); typeInto(f.querySelector("blockquote"), b.text, nasta);
    } else {
      body.insertAdjacentHTML("beforeend", '<div class="fade">' + blockHTML(b) + '</div>');
      scrollChat(); timers.push(setTimeout(nasta, 320));
    }
  };
  nasta();
}
function fraga(q) {
  if (S.busy) return;
  const n = S.chat.length;
  S.chat.push({ roll:"elin", id:"e" + n, text:q });
  S.stalda.push(q); S.busy = true; renderChat();
  const low = q.toLowerCase();
  const traff = EXCHANGES.find((e) => e.fraga.toLowerCase() === low) ||
                EXCHANGES.find((e) => e.ord.some((k) => low.indexOf(k) !== -1));
  const svar = traff ? traff.svar : FALLBACK;
  timers.push(setTimeout(() => {
    S.chat.push({ roll:"co", id:"c" + n, svar:svar, animera:true });
    S.forslag = svar.foljd && svar.foljd.length ? svar.foljd.slice() : PROMPTS.slice();
    renderChat();
  }, 600));
}

/* —————————————— rendering —————————————— */
const VYER = { hem:vyHem, medgrundaren:vyMedgrundaren, marknaden:vyMarknaden,
  valideringen:vyValideringen, bygget:vyBygget, profilen:vyProfilen };

function render() {
  renderTop(); renderNav();
  const view = document.getElementById("view");
  view.innerHTML = (VYER[S.route] || vyHem)();
  view.classList.remove("fade"); void view.offsetWidth; view.classList.add("fade");
  requestAnimationFrame(() => {
    view.querySelectorAll("[data-w]").forEach((i) => { i.style.width = i.getAttribute("data-w") + "%"; });
  });
  if (S.route === "medgrundaren") renderChat();
  if (S.animera) { S.animera = false; raknaUpp(S.forra, total()); }
}
function raknaUpp(fran, till) {
  const mal = Array.prototype.slice.call(document.querySelectorAll("[data-score]"));
  if (!mal.length || fran === till) return;
  const satt = (v) => mal.forEach((e) => { e.textContent = v; });
  if (REDUCED) { satt(till); return; }
  const start = performance.now(), tid = 900;
  satt(fran);
  const steg = (nu) => {
    const p = Math.min(1, (nu - start) / tid);
    satt(Math.round(fran + (till - fran) * (1 - Math.pow(1 - p, 3))));
    if (p < 1) requestAnimationFrame(steg);
  };
  requestAnimationFrame(steg);
}

/* —————————————— händelser —————————————— */
function gaTill(route) {
  if (!VYER[route] || route === S.route) return;
  clearTimers();
  S.chat.forEach((c) => { if (c.animera) c.animera = false; });
  S.busy = false; S.route = route;
  window.scrollTo(0, 0);
  render();
}
function markeraKlart() {
  const st = nastaSteg();
  if (st.sist) return;
  S.forra = total();
  st.delar.forEach((d) => { S.parts[d[0]] += d[1]; });
  if (st.bevis) Object.keys(st.bevis).forEach((key) => {
    S.bump[key] = S.bump[key] || {};
    st.bevis[key].forEach((b) => {
      const cur = S.bump[key][b.i] || { dp:0, t:[], k:[] };
      cur.dp += b.dp; cur.t.push(b.t); cur.k.push(b.k);
      S.bump[key][b.i] = cur;
    });
  });
  S.svar += SVAR_TILLSKOTT[st.id] || 0;
  S.sinceLast += st.okning;
  const nya = [{ id:"tn" + st.id, text:st.spar, tid:"Just nu", typ:"verktyg" }];
  if (st.okning > 0) nya.unshift({ id:"tp" + st.id, typ:"poang", tid:"Just nu",
    text:"Poängen steg med " + st.okning + ". " + st.delar.map((d) => {
      const p = SCORE_PARTS.find((x) => x.key === d[0]);
      return (p ? p.namn : d[0]) + " +" + d[1];
    }).join(", ") + "." });
  S.trail = nya.concat(S.trail);
  const foreDetta = alltKlart();
  S.stepIdx = Math.min(S.stepIdx + 1, NEXT_STEPS.length - 1);
  S.deferred = false; S.underlagOppet = false; S.animera = true;
  if (!foreDetta && alltKlart()) {
    S.valtSteg = "07";
    S.trail = [{ id:"tu", typ:"verktyg", tid:"Just nu",
      text:"Steg 06 låstes och steg 07 öppnades. Alla fyra krav är uppfyllda." }].concat(S.trail);
  }
  render();
}
function byggILovable() {
  const b = S.build;
  if (b.bygger) return;
  const ta = document.getElementById("lvprompt");
  if (ta) b.prompt = ta.value;
  b.bygger = true; b.logg = []; render();
  let i = 0;
  const nasta = () => {
    if (i >= BUILD_LOG.length) {
      b.bygger = false; b.byggt = true; b.tab = "forhandsvisning"; render();
      return;
    }
    b.logg.push(BUILD_LOG[i++]);
    render();
    const lg = document.getElementById("lvlog");
    if (lg) lg.scrollTop = lg.scrollHeight;
    timers.push(setTimeout(nasta, REDUCED ? 0 : 260));
  };
  timers.push(setTimeout(nasta, 260));
}
document.addEventListener("click", (ev) => {
  const nav = ev.target.closest("[data-nav]");
  if (nav) { ev.preventDefault(); gaTill(nav.getAttribute("data-nav")); return; }
  const btn = ev.target.closest("[data-act]");
  if (!btn || btn.disabled) return;
  const a = btn.getAttribute("data-act");
  if (a === "klar") markeraKlart();
  else if (a === "senare") { S.deferred = true; render(); }
  else if (a === "underlag") { S.underlagOppet = !S.underlagOppet; render(); }
  else if (a === "del") { const k = btn.getAttribute("data-key"); S.oppenDel = S.oppenDel === k ? null : k; render(); }
  else if (a === "valjsteg") { S.valtSteg = btn.getAttribute("data-nr"); render(); }
  else if (a === "rakning") { S.visaRakning = !S.visaRakning; render(); }
  else if (a === "scoreto") { if (S.route !== "hem") gaTill("hem"); else document.querySelector(".sp-top").scrollIntoView({ behavior:"smooth", block:"center" }); }
  else if (a === "ask") fraga(btn.getAttribute("data-q"));
  else if (a === "send") skicka();
  else if (a === "lvlogin") { S.build.ansluten = true; render(); }
  else if (a === "lvtab") { S.build.tab = btn.getAttribute("data-tab"); render(); }
  else if (a === "lvbuild") byggILovable();
  else if (a === "addnote") {
    const ta = document.getElementById("noteinput"), v = ta && ta.value.trim();
    if (!v) return;
    S.notes.unshift({ id:"bn" + S.notes.length, datum:"I dag", text:v });
    render();
  } else if (a === "reset") { clearTimers(); const r = S.route; nollstall(); S.route = r; render(); }
});
function skicka() {
  const inp = document.getElementById("chatinput"), v = inp && inp.value.trim();
  if (!v) return;
  inp.value = ""; fraga(v);
}
document.addEventListener("keydown", (ev) => {
  if (ev.key !== "Enter") return;
  const t = ev.target;
  if (t && t.id === "chatinput") { ev.preventDefault(); skicka(); }
  if (t && t.id === "noteinput" && (ev.metaKey || ev.ctrlKey)) {
    ev.preventDefault();
    const b = document.querySelector('[data-act="addnote"]');
    if (b) b.click();
  }
});

render();
