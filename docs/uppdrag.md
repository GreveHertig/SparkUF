# Uppdrag: Sparks demo och plattformsskelett

Du är senior produktdesigner och frontendutvecklare. Du arbetar i GitHub-repot **Spark UF**, som två grundare äger tillsammans.

Du bygger **Spark**, en svensk AI-medgrundare för förstagångs- och soloentreprenörer, som **en kodbas med två lägen**:

- **Demon** (`/demo`): en fullt klickbar prototyp med fiktiv data för investerare och rådgivare. Ingen inloggning. Den går igenom hela onboardingen och hela resan.
- **Plattformen** (`/app`): ett riktigt skelett av produkten med arkitektur, sidor, datamodell och inloggning. Varje del har en tydlig plats så att grundarna kan bygga en del i taget med Supabase, Gemini och Tavily.

Båda lägena använder **samma skärmar och komponenter**. Skillnaden är bara varifrån datan kommer (avsnitt 14). Designen blir därmed automatiskt designen för den riktiga produkten.

Därför är designens och komponenternas kvalitet lika viktig som funktionen.

Det här dokumentet ligger i repot som `docs/uppdrag.md` och innehåller all produktkontext. Arbetet delas upp i flera separata Claude Code-sessioner (avsnitt 13). Varje session får en egen uppgift och läser bara de avsnitt den behöver.

---

## 0. Arbetssätt

1. **Utgå från repot som det är.** Det finns redan ett Next.js-projekt. Bygg vidare på det som finns och skriv aldrig över andras arbete.
2. **Branch:** allt prototyparbete sker på branchen `prototyp`, som redan finns. Landningssidan byggs på `prototyp-landning` och slås ihop med `prototyp` via pull request. Inget pushas direkt till `main`.
3. **Läs först, planera sedan.** Varje session läser `CLAUDE.md`, `docs/status.md` och sina avsnitt i det här dokumentet. Därefter föreslår den en plan och väntar på godkännande innan kod skrivs.
4. **Committa ofta** med tydliga meddelanden. `typecheck` och `lint` ska gå igenom utan fel före varje commit.
5. **Lämna över.** Varje session avslutas med att `docs/status.md` uppdateras: vad som är klart, vad som återstår, kända problem och beslut som nästa session behöver känna till.
6. **Fråga bara när det spelar roll.** Fråga om något oklart påverkar arkitekturen. Mindre designbeslut fattar du själv och dokumenterar i `DESIGN.md`.

---

## 1. Produkten

### 1.1 Grundidén
Spark hjälper två typer av grundare:

- **De som inte har någon idé:** Spark utgår från personen.
- **De som redan har en idé:** Spark gör idén bättre och bygger företaget kring den.

Grundaren går igenom en strukturerad resa i 12 steg, från "vem är du" till betalande kunder. Spark minns varje beslut, ger ett handlingssteg i taget och säger rakt ut när en idé är svag.

Det som skiljer Spark från internationella verktyg är **underlaget**. Sverige har fullständig, offentlig företagsdata: varje aktiebolag lämnar in årsredovisning. Spark kan därför säga saker som:

> "Det finns 312 redovisningsbyråer i Sverige med 5–20 anställda. Medianomsättning 4,2 miljoner. 18 % växte över 10 % förra året. Här är de 40 som växer snabbast."

Det är inte en uppskattning. Det kommer ur registret.

### 1.2 Datalöftet
Produktens viktigaste princip: **ingenting i Spark är gissat. Allt har en källa och ett datum.**

- **Marknadsstorlek:** Bolagsverket och SCB.
- **Kundlistor:** namngivna, existerande företag ur registret, inte påhittade personas.
- **Omsättning, anställda och tillväxt:** inlämnade årsredovisningar.
- **Konkurrentbilden:** SNI-koder och faktiska bolag.
- **Efterfrågan:** bevisas av namngivna personer som svarat, inte av en modells bedömning.
- **Det formella:** verksamt.se och Skatteverket.
- **Finansiering:** Almi, Vinnova och Tillväxtverket.

Varje påstående i gränssnittet visar källa och hämtningsdatum, till exempel *"312 företag · Bolagsverket · hämtat 14 september"*. Finns ingen källa gör Spark inget påstående. Då säger den att den inte vet.

### 1.3 Arkitekturen i fyra lager
- **Registret:** Bolagsverket, SCB, företagsdatabaser, verksamt.se, Almi, Vinnova och branschmedia.
- **Simuleringslagret (Hiasynth, koncept):** ligger ovanpå registret, se 2.2.
- **Minnet:**
  - **Profilen:** vem grundaren är.
  - **Hjärnan:** grundarens egna fria anteckningar. Spark läser dem men städar aldrig.
  - **Spåret:** allt som hänt, skrivet automatiskt.
- **Medgrundaren:** den enda ytan grundaren möter.
- **Resan:** 12 steg i 4 faser.

### 1.4 Fem kärnfunktioner
1. **Medgrundaren.** En agent, alltid samma. Den läser hela minnet inför varje svar, startar verktyg och säger vad den tycker. Varje samtal slutar med att ett verktyg körs eller att grundaren får en konkret uppgift i verkligheten, aldrig bara med ett svar. Tonen är svensk och rak, utan peppning. Svaga idéer dödas vänligt men tydligt.
2. **Minnet.** Profil, Hjärna och Spår enligt ovan.
3. **Nästa steg.** Vid varje besök visas var grundaren är, vad som hänt sedan sist och ett enda handlingssteg. När steget är klart låses nästa upp. Det hindrar grundaren från att hoppa till bygget innan valideringen är gjord.
4. **Poängen.** 1–100, alltid synlig. Den mäter **bevisgrad, inte idékvalitet** (avsnitt 7).
5. **Pulsen.** En daglig svensk marknadssignal kopplad till idén och kundsegmentet: nyregistreringar, kapitalrundor, nedläggningar och branschnyheter. Varje signal har en mening om varför den spelar roll för just den här grundaren.

### 1.5 Resan: 12 steg i 4 faser
**Fas 1 · Upptäck**
- **01 Om dig:** profilsamtal om bakgrund, kompetens, nätverk, tid, pengar och riskaptit.
- **02 Möjligheter:** idéer grundade i profilen, korsade med luckor i registret.

**Fas 2 · Pröva**
- **03 Marknaden:** riktiga siffror ur registret, som antal företag, storleksfördelning, medianomsättning, tillväxt och geografi.
- **04 Kunden:** kundprofil ur registret (SNI, storlek, omsättning, ort). Resultatet är en lista på namngivna företag.
- **05 Samtalen:** Spark bygger kontaktlistan, skriver svensk outreach, skickar från grundarens egen Gmail, följer öppningar och svar och skickar påminnelse efter 4 dagar. Bara B2B.
- **06 Domen:** kör, förfina eller pivotera, baserat på faktiska svar med citat och siffror.

**Fas 3 · Lansera**
- **07 Affärsfall och pris:** svensk kalkyl med moms, arbetsgivaravgifter, F-skatt, kostnadsgolv och break-even. Prisförslaget har ett spann och en motivering som bygger på fyra saker:
  - vad kunderna tål (deras omsättning)
  - vad jämförbara aktörer tar
  - vad kunderna själva sagt
  - vad som krävs för att gå ihop
- **08 Omfånget:** MVP ur bevisen. "Bygg bara det de som svarade faktiskt bad om."
- **09 Det formella:** enskild firma eller aktiebolag, Bolagsverket, F-skatt, moms och bokföring.
- **10 Live:** landningssida eller MVP, byggd och publicerad.

**Fas 4 · Växa**
- **11 Första kunderna:** 30-dagarsplan i svenska kanaler (LinkedIn, branschforum, Nyföretagarcentrum, lokala nätverk, mässor).
- **12 Kapital:** Almi, Vinnova, Tillväxtverket, regionala medel, banklån och bootstrapping.

### 1.6 Affärsmodell
Prenumeration för allt utom bygget, och bygget säljs separat per projekt eller credit.

---

## 2. Nya delar som ska synas i prototypen

### 2.1 Två ingångar i onboardingen
- **"Jag har ingen idé än":** steg 01 → 02 som ovan.
- **"Jag har redan en idé":** grundaren beskriver sin idé och Medgrundaren gör en **idégenomlysning**:
  1. bryter ner idén i antaganden
  2. markerar vilka som går att pröva mot registret direkt
  3. visar en första registerbild
  4. säger rakt ut vad som är svagt
  5. föreslår en skarpare version

  Efter genomlysningen följer ett kortare profilsamtal med fokus på passform, och sedan samma resa från steg 03. Genomlysningen ersätter steg 02.

### 2.2 Hiasynth: simuleringslager (koncept)
Hiasynth bygger syntetiska populationer ur europeisk data. Exempel med påhittade siffror: om det i EU finns 180 000 redovisningskonsulter och 35 % av dem arbetar på byråer med 5–20 anställda, så finns de klonade i systemet som syntetiska individer med arbetsuppgifter, tidsåtgång och budget. Då går det att simulera till exempel hur mycket tid byråerna lägger på att jaga kvitton och vid vilket pris de skulle byta arbetssätt. Det möjliggör avancerade simuleringar av efterfrågan, priskänslighet och beteende. I Spark ligger det ovanpå registret och ger mer precisa marknads- och konkurrensanalyser i steg 03, 04, 06 och 07.

**Hårda regler:**
- **Alltid märkt och åtskild.** Simuleringar visas med egen visuell stil och etiketten "Simulering". De blandas aldrig ihop med registerfakta.
- **Underlaget syns.** Varje simulering visar populationens storlek, vilka källor den bygger på och ett osäkerhetsintervall.
- **Ger aldrig poäng.** Simuleringar kan ge riktning, men poäng kräver registerdata eller riktiga kundsvar.
- **Märkt som koncept.** Inget avtal finns, så allt Hiasynth-relaterat får etiketten **"Koncept · partnerskap utforskas"**. Ingen text i prototypen får påstå att samarbetet finns.

### 2.3 Bygg med Lovable (koncept)
Steg 10 visar hur det ser ut när grundaren bygger direkt i Spark via Lovable, inbäddat i Sparks gränssnitt:
- Till vänster skriver Medgrundaren byggspecen ur bevisen från steg 08.
- Till höger byggs en förhandsvisning upp: skelett → komponenter → färdig sida.
- Därefter publiceras sidan till en fiktiv domän.

Märk ytan **"Bygg drivs av Lovable · Koncept · partnerskap utforskas"**. Använd bara namnet i text, ingen Lovable-logotyp. Visa att bygget kostar credits.

### 2.4 Juridisk koll: en förmåga hos Medgrundaren
- Ingen egen persona. Det är en förmåga som kan anropas när som helst under resan, via knappen "Juridisk koll" i chatten och på varje steg. Den dyker också upp automatiskt vid steg med juridiska konsekvenser: 05 (utskick), 09 (formalia) och 10 (lansering och GDPR).
- Resultatet är en **juridisk karta för just det här företaget**. För varje lag eller regel som berör produkten visas:
  - vad den kräver konkret
  - status: klart, att göra eller bevaka
  - källa (riksdagen.se, IMY, verksamt.se, Skatteverket, EUR-Lex) och datum
- **Synlig ansvarsbegränsning** på varje juridisk yta: *"Spark ger vägledning, inte juridisk rådgivning. Kontrollera med jurist vid behov."*
- Alla juridiska texter ligger i `src/demo/legal.ts` med kommentaren `// GRANSKAS AV MÄNNISKA INNAN EXTERN VISNING` överst. Formulera dem försiktigt och allmänt.

### 2.5 Ärlighet i demon
- I demoläget visas en diskret men alltid synlig etikett: **"Demodata · fiktiv grundare och fiktiva siffror"**.
- Alla företagsnamn i demot (kunder, konkurrenter, pilotkunder) är **påhittade**. Använd aldrig verkliga företag med påhittade siffror.
- Myndigheter, finansiärer och kanaler får nämnas vid namn.

---

## 3. Tekniska ramar

- **Befintligt projekt:** repot har redan ett Next.js-projekt (`app/`, `lib/`, `types/`, `AGENTS.md`). Läs `AGENTS.md` och bygg vidare i den befintliga strukturen. Sökvägar i det här dokumentet som börjar med `src/` är logiska: placera dem i repots struktur (normalt utan `src/`-prefix) och skriv de faktiska sökvägarna i `docs/status.md`. Ta inte bort eller skriv om befintlig kod utan att fråga.
- **Stack:** Next.js (App Router), TypeScript i strict-läge och Tailwind CSS mappat mot CSS-variabler. Därtill Radix UI-primitiver, Framer Motion, Recharts, Zustand och Vitest.
- **Struktur:**
  - `src/design/`: tokens, både som `tokens.css` och `tokens.ts`.
  - `src/components/ui/`: grundkomponenter som inte känner till demot.
  - `src/components/spark/`: produktkomponenter.
  - `src/demo/`: scenarier och mockdata.
  - `src/score/`: poängberäkningen.
  - `src/i18n/`: översättningar.
- **Demon har ingen backend.** Under `/demo` görs inga anrop till databaser, AI-modeller eller externa API:er, allt drivs av demoadaptrarna.
- **Plattformen** använder Supabase (databas och inloggning) och, när delarna byggs, Gemini och Tavily. Alla anrop med nycklar sker på servern. Se avsnitt 14.
- **Offlinesäker.** Typsnitten självhostas via `next/font` och inget hämtas från CDN, så att demot fungerar på ett möte utan internet.
- **State:** demoläget sparas i `localStorage` så att sidan kan laddas om mitt i en demo. Knappen "Återställ" nollställer.
- **Skärm:** byggt för dator. Primärt 1440 px bred, snyggt ner till 1280 och användbart ner till 1024. Mobil behövs inte.
- **Tillgänglighet:**
  - Allt ska gå att styra med tangentbordet och ha synliga fokusmarkeringar.
  - `prefers-reduced-motion` ska respekteras.
  - Kontrasten ska klara WCAG AA.

---

## 4. Språk: svenska med engelsk växel

- **Svenska är standard.** En tydlig växel **SV / EN** i sidhuvudet översätter **allt**: gränssnitt, demoinnehåll, rundturens texter, juridiska texter och källetiketter.
- **Ingen hårdkodad text** i komponenter. Strängarna ligger i `src/i18n/sv.ts` och `en.ts` med typade nycklar, så att TypeScript larmar om en översättning saknas.
- **Demoscenarierna** lagras också på båda språken.
- **Formatering via `Intl`:** "4,2 Mkr" och "14 september" på svenska, "SEK 4.2M" och "14 September" på engelska.
- **Egennamn översätts inte:** Bolagsverket, SCB, Skatteverket, Almi, Vinnova och verksamt.se står kvar som de är. På engelska förklaras de i en tooltip första gången de förekommer.

---

## 5. Designriktning

### 5.1 Referens: Fonda
Designen ska inspireras av **Fonda** (fonda.co), en amerikansk AI-medgrundare med samma grundstruktur. Om mappen `design-referens/fonda/` finns i repot ska du studera skärmdumparna där noggrant innan fas 1. Du kan också läsa fonda.co.

**Det här tar vi från Fonda:**
- **Redaktionella rubriker** där enstaka ord kursiveras i en serif för betoning, till exempel "En *resa*. Tolv *steg*." Resten av rubriken står i en ren sans-serif.
- **Produkten syns i marknadsföringen.** Landningssidans sektioner visar riktiga gränssnittskort, som Nästa steg, dagens signaler och domen, i stället för abstrakta illustrationer.
- **Små versala etiketter** med mittpunkt ovanför korttitlar, till exempel `STEG 05 · SAMTALEN`.
- **"Ditt nästa steg"-kortet:** en tydlig uppgift, en rad om varför och en lista över det som redan är klart, med bockar.
- **Signalflödet:** kategorietikett, rubrik, "Varför det spelar roll: …" och en tidsstämpel ("Uppdaterad 06:00").
- **Domkortet:** stor poäng "54 / 100", en rad med utslaget ("Förfina · snäva segmentet") och två meningar motivering.
- **Resan som numrerat rutnät,** grupperat i faser med ett kort citat per fas.
- **Minnet illustrerat som ett chattutdrag** där Medgrundaren refererar till tidigare beslut.
- **Lugn, luftig och generös layout** med få men säkra element, mjuka radier, subtila kanter och mycket vitt utrymme.

**Det här gör Spark annorlunda:**
- Källetiketter på varje siffra är ett synligt designelement.
- Poängens nedbrytning, och att den kan sjunka, har en egen tydlig visuell form.
- Datatyperna (register, simulering, kundsvar) har var sitt visuellt språk.

**Inspiration, inte kopia.** Återskapa inte Fondas layout sida för sida, deras texter, illustrationer eller tillgångar. Spark ska kännas som samma kvalitetsnivå men vara ett eget varumärke.

### 5.2 Varumärke och färger
**Loggan** är ett ordmärke: "SPARK" i versaler, geometrisk sans-serif med brett teckenavstånd. K:ets nedre ben är snett avskuret. Märket är ljust på mörk skiffergrå botten, utan ikon.
- Loggfilen ligger i `public/brand/`. Finns bara en PNG: skapa en SVG-version (spåra om verktyg finns, annars bygg ordmärket som SVG-bokstäver så nära originalet som möjligt) och lägg en TODO om att ersätta den med original-SVG.
- Gör två varianter: ljus logga för mörka ytor och mörk logga för ljusa ytor.

**Färger (behålls):**

| Token | Värde | Användning |
|---|---|---|
| `ink-900` | `#1B1F23` | Djupaste mörka ytor, text med högst kontrast |
| `ink-800` | `#262B31` | Loggans bakgrund: mörka sektioner, sidomeny, sidfot |
| `paper-50` | `#F1F2F6` | Loggans ljusa ton: ljus bakgrund, text på mörkt |
| `accent` | ljusblå | Sparks accentfärg, för aktiva tillstånd, fokus och poängens starkaste nivå |

- **Bygg fullständiga skalor:** en skiffergrå skala (50–950) mellan `#F1F2F6` och `#1B1F23` med lätt blå underton, och en ljusblå accentskala (startvärde `#CFE3FF`, justera för kontrast).
- **Temat är ljust.** Arbetsytorna har ljus botten (`paper-50` och vitt) med skiffergrå text. Mörka ytor i `ink-800` används medvetet: sidomenyn, landningssidans hero och sidfot, samt demoraden.
- **Poängnivåerna** är egna semantiska tokens och ska vara dämpade och harmonierade, aldrig skrikiga:
  - `score-red` (1–29)
  - `score-orange` (30–49)
  - `score-yellow` (50–69)
  - `score-green` (70–84)
  - `score-strong` (85–100), en "förtjänad" ton: skiffergrå med ljusblått sken
- **Datatyperna** har var sin token: `data-register`, `data-simulation` och `data-customer`.

### 5.3 Typografi
- **Sans-serif:** en geometrisk, ren sans-serif som harmonierar med ordmärket, till exempel Manrope eller Geist. Den används till gränssnitt, brödtext och rubriker. Välj och motivera i `DESIGN.md`.
- **Serif (kursiv):** en elegant serif, till exempel Instrument Serif, som **bara** används för betonade ord i stora rubriker, som i Fondas stil.
- **Tabellsiffror** för alla tal.
- **Versala etiketter** med teckenavstånd, som ekar loggans bredd.

### 5.4 Principer
- **Källan är designen.** Källetiketten ska kännas som en naturlig del av typografin, inte som en fotnot.
- **Låst är inte noll.** Låsta delar har en egen lugn stil ("Låses upp efter steg 05"), aldrig 0 eller rött.
- **Rörelse med mening.** Poäng räknar upp och ner, nya fynd glider in och verktygskörningar visar framsteg. Inga dekorativa animationer.
- **Tillstånden är formgivna.** Låst, laddar, tomt och fel har alla en design.

### 5.5 Designsystemsida
Bygg `/designsystem` som visar alla tokens och komponenter i alla tillstånd. Sidan är till för att grundarna ska kunna vidareutveckla designen.

---

## 6. Sidor

> **Två lägen.** Skärmarna nedan byggs en gång som delade skärmkomponenter och monteras på två ställen: under `/demo/...` (demoadaptrar, ingen inloggning, demoraden och `DemoDataBadge` synliga) och under `/app/...` (liveadaptrar, kräver inloggning). Onboardingen finns som `/demo/start/...` och `/start/...`. `/app` i listan nedan gäller båda lägena.

### Publika sidor
- **`/` Landningssida**, med Fonda-stilen från 5.1:
  - **Hero:** mörk `ink-800`-yta med rubriken "Din idé. *Spark* gör resten.", knapparna "Starta demo" och "Skapa konto", samt ett levande produktkort (Nästa steg med källetiketter).
  - **Sektioner:**
    1. Problemet
    2. Datalöftet (en registermening med källa)
    3. Resan i rutnät
    4. Fyra saker Medgrundaren gör, var och en med ett gränssnittskort
    5. Poängen som mäter bevis
    6. Juridisk koll
    7. Minnet som chattutdrag
    8. Koncept på väg: Hiasynth och Lovable, tydligt märkta
    9. Priser, FAQ och en avslutande uppmaning
  - Nämn inga konkurrenter vid namn.
- **`/priser`:** tre nivåer, märkta som förslag.
  - **Gratis:** steg 01–04 och begränsad Puls.
  - **Grundare:** 199 kr/mån, steg 01–09 och 11–12, full Puls och juridisk koll.
  - **Bygg-credits:** säljs separat.
- **`/logga-in` och `/skapa-konto`:** fejkade formulär som leder in i onboardingen.
- **`/designsystem`:** se 5.5.

### Onboarding
- **`/start`:** välj ingång med två stora valkort.
- **`/start/profil`:** profilsamtal i chattform med klickbara svarsförslag.
- **`/start/ide`:** idégenomlysningen.

### Appen (`/app/*`)
Layout: mörk sidomeny till vänster med ljus logga. Ljus arbetsyta. Sidhuvudet visar **poängen alltid**, SV/EN-växeln och profilmenyn.

- **`/app` Hem:** Nästa steg, vad som hänt sedan sist, dagens Puls-signal och poängrörelse.
- **`/app/medgrundaren`:** chatten. Verktygskörningar visas som kort i flödet.
- **`/app/resan`:** 12 steg i 4 faser med tillstånden klar, aktuell och låst. Varje steg visar "kan ge upp till X poäng".
- **`/app/resan/[steg]`:** stegets arbetsyta.
- **`/app/poang`:** poängens åtta delar, nedbrytning, "Höj din poäng" och historikgraf.
- **`/app/marknad`:** registerbilden och simuleringar, tydligt åtskilda.
- **`/app/kunder`:** kundlistan, utskick, öppningar och svar.
- **`/app/pulsen`:** signalflödet.
- **`/app/minnet`:** flikarna Profilen, Hjärnan (går att skriva i) och Spåret.
- **`/app/juridik`:** den juridiska kartan.
- **`/app/bygg`:** Lovable-konceptet.

Alla sidor speglar demots aktuella läge.

---

## 7. Poängen

### 7.1 Princip
- **Poängen mäter hur mycket som är bevisat, inte hur bra idén låter.**
- **Den börjar lågt för alla** och stiger bara när grundaren gör verkligt arbete.
- **Den går inte att prata sig till.** Den som inte pratat med en enda kund kan aldrig komma över 30. För 85+ krävs betalande kunder.
- **Den räknas i kod, inte av en språkmodell.** Implementera `src/score/calculateScore.ts` som en **ren funktion** från strukturerad evidens till poäng. Poängen sätts aldrig direkt i mockdatan, så den kan räknas för hand.

### 7.2 Åtta delar

| Del | Vikt | Mäter | Källa |
|---|---|---|---|
| Marknad | 12 | Finns tillräckligt många köpare? | Register |
| Konkurrens | 8 | Finns en lucka? | Register |
| Passform | 10 | Kan just du bygga och sälja det här? | Profilen |
| Problem | 18 | Säger riktiga kunder att problemet är verkligt? | Steg 05 |
| Betalningsvilja | 18 | Vill de betala, och tål de priset? | Steg 05 + register |
| Produkt | 12 | Bygger du det bevisen stöder, och är det byggt? | Steg 08–10 |
| Traktion | 14 | Använder och betalar någon på riktigt? | Steg 10–11 |
| Genomförbarhet | 8 | Räcker tid, pengar och kompetens? Är det formella klart? | Profilen + steg 09 |

### 7.3 Upplåsning och tak
| Fas | Nya delar | Tak |
|---|---|---|
| Upptäck | Passform plus preliminär Marknad | ~18 |
| Pröva före samtal | Marknad fullt och Konkurrens | 30 |
| Pröva efter samtal | Problem och Betalningsvilja | 66 |
| Lansera | Produkt och Genomförbarhet | 86 |
| Växa | Traktion | 100 |

### 7.4 Regler
- **Minsta poäng är 1**, aldrig 0.
- **Ingen källa, ingen poäng.** Varje delpoäng har källa och datum.
- **Låsta delar visas som låsta**, aldrig som 0.
- **Avtagande värde** för svar av samma sort: svar 5–10 är värda mycket, svar 20–30 nästan inget.
- **Motsägande svar** räknas fullt ut, och ett skevt underlag sänker poängen.
- **Poängen kan sjunka.**
- **Simuleringar ger 0 poäng.**
- **Ingen jämförelse** mot andra grundare.

### 7.5 Nivåer
| Poäng | Nivå | Spark säger |
|---|---|---|
| 1–29 | Oprövat | Du vet för lite än. Här är nästa steg. |
| 30–49 | Underbyggt men obevisat | Marknaden finns. Nu måste du prata med folk. |
| 50–69 | Efterfrågan bekräftad | Du har belägg. Bygg det minsta som testar resten. |
| 70–84 | Byggt och lanserat | Det finns. Nu ska någon börja använda det. |
| 85–100 | Bevisad affär | Kör. |

### 7.6 Nedbrytning och förslag
- **Varje del kan öppnas.** Den visar underdelar, siffror, källa och datum, samt en slutsatsrad (t.ex. "Problemet är inte viljan. Det är nivån.").
- **"Höj din poäng"** listar förslag med poäng, uppskattad tid, förklaring ur grundarens egen data och en handlingsknapp. Listan **sorteras efter poäng per minut**.
- **Varje förslag märks med vilken sorts lucka det gäller:**
  - **Otillräckligt underlag:** gör mer av samma.
  - **Motsägande underlag:** ändra något i idén.
  - **Strukturell lucka:** arbete löser det inte. Hitta en partner, snäva omfånget eller byt idé.
- **Låsta delar ger inga förslag**, bara "Låses upp efter steg 05".
- **Förslagen härleds ur evidensen med kod.**

### 7.7 Tester
Skriv Vitest-tester för taken, det avtagande värdet, motsägelserna, att poängen aldrig blir 0 och att poäng utan källa inte kan uppstå.

---

## 8. Komponenter

| Komponent | Syfte |
|---|---|
| `ScoreBadge` | Poäng med nivåfärg. Kompakt i sidhuvud, stor på Hem och Poäng. Animerad räkning. |
| `ScoreBreakdown` | De åtta delarna med vikt, delpoäng, källor och låst läge. |
| `ScoreSuggestion` | Förslag med poäng, tid, förklaring och handling. |
| `GapTypeTag` | Otillräckligt / Motsägande / Strukturellt. |
| `VerdictCard` | Stor poäng + utslag (kör / förfina / pivotera) + motivering. |
| `SourceTag` | Källa + datum i variant efter datatyp. Klick visar detaljer. |
| `DataFact` | Påstående med siffra + `SourceTag`. Används för alla siffror. |
| `SimulationCard` | Hiasynth-resultat med population, intervall och `ConceptBadge`. |
| `ConceptBadge` | "Koncept · partnerskap utforskas". |
| `DemoDataBadge` | Global etikett i demoläget. |
| `Eyebrow` | Versal etikett, t.ex. `STEG 05 · SAMTALEN`. |
| `EditorialHeading` | Rubrik med kursiverade serif-ord. |
| `NextStepCard` | Handlingssteg, varför, potential, tid, klara delmoment med bockar. |
| `JourneyGrid` / `StepTimeline` | Resan som rutnät respektive tidslinje. |
| `LockedState` | Låst del eller steg, med vad som låser upp. |
| `ToolRunCard` | Medgrundaren kör ett verktyg med delmoment och bockar, t.ex. "Hämtar från Bolagsverket…". |
| `ChatMessage` | Meddelanden och klickbara svarsförslag. |
| `PulseCard` | Kategori, signal, "varför det spelar roll för dig", källa och tid. |
| `CompanyTable` | Företag med SNI, anställda, omsättning, tillväxt och utskicksstatus. |
| `LegalMap` | Juridisk karta med status, källa och ansvarsbegränsning. |
| `TraceTimeline` | Spåret. |
| `ScoreDelta` | "+14 sedan i måndags" / "−4 efter nya svar". |
| `TimeSkip` | Markören "4 dagar senare" i demot. |

---

## 9. Demoläget

### 9.1 Styrning
- **Start:** via knappen "Starta demo" eller adressen `/demo`. Demot börjar alltid i onboardingen (`/demo/start`, val av ingång, profilsamtal och för Jonas idégenomlysningen) och går därefter in i appen under `/demo/app`. Ingen inloggning krävs.
- **Demoraden:** en fast rad nederst i `ink-800`, som kan fällas ihop. Den visar:
  - persona och ingång
  - steg X av 12 och fas
  - aktuellt moment
  - knapparna ◀ Bakåt, Nästa ▶, "Hoppa till steg", "Rundtur på/av", "Byt ingång" och "Återställ"
- **Tangenter:** ← → styr, `T` slår på och av rundturen, `R` återställer (med bekräftelse).
- **Tre moment per steg:**
  1. **Före:** Nästa steg-kortet visar vad som ska göras, varför, vad det kan ge och ungefär hur lång tid det tar.
  2. **Körning:** Medgrundaren kör verktyget. Längre förlopp har delmoment med `TimeSkip`, till exempel: skickat → "2 dagar senare" öppningar → "4 dagar senare" påminnelse → svar.
  3. **Efter:** vad som hände, med fynd, animerad poängändring och förklaring, nya poster i Spåret, nya signaler, juridiska flaggor och vad som låstes upp.
- **Fri navigering:** investeraren kan när som helst klicka runt i appen, och allt speglar aktuellt läge.

### 9.2 Guidad rundtur
- **Format:** förklaringsrutor med spotlight, pil, kort text och knapparna "Nästa" och "Hoppa över".
- **Timing:** rundturen är knuten till demots moment så att rätt ruta visas vid rätt tillfälle.
- **Omfång:** cirka 18–22 stopp skrivna för investerare, korta och utan överdrifter. Stoppen ska täcka:
  - Datalöftet: varje siffra har källa och datum.
  - Registret: det finns i Sverige men knappt någon annanstans.
  - De två ingångarna.
  - Poängen mäter bevis, inte optimism.
  - Taket på 30 utan kundsamtal.
  - Poängen räknas i kod och kan räknas för hand.
  - Poängen kan sjunka.
  - Förslagen sorteras efter poäng per minut.
  - De tre sorternas luckor.
  - Spark skickar mejlen själv, den ger inte bara tips.
  - Domen: kör, förfina eller pivotera.
  - Svensk kalkyl.
  - Juridisk koll genom hela resan.
  - Hiasynth-lagret (som koncept).
  - Bygget via Lovable (som koncept) och varför bygget ligger sist.
  - Pulsen.
  - Egen svarsdata över tid som försvarsvall: "4 % svarsfrekvens är lågt för den branschen, normalt ser vi 11 %."
  - Affärsmodellen.

### 9.3 Persona A: "Jag har ingen idé"
**Sara Lindqvist, 26, Stockholm.**
- **Bakgrund:** fyra år som redovisningsassistent på en liten byrå. Kan byråns flöden och Excel men har ingen kodvana.
- **Resurser:** 15 timmar i veckan, 30 000 kr sparat och medelhög riskaptit.
- **I Hjärnan:** *"Varje månadsskifte jagar vi kvitton från kunderna via mejl och sms. Det äter två dagar."*

| Steg | Innehåll | Poäng |
|---|---|---|
| 01 | Profilsamtal. Styrka: branschinsikt. Strukturell lucka: kan inte bygga själv (löses senare av bygget). | 6 |
| 02 | Tre idéer ur profil och register. Hon väljer **Kvittojakten**, automatisk insamling av underlag från byråernas småföretagskunder. | 16 |
| 03 | 312 redovisningsbyråer med 5–20 anställda (SNI 69.201), medianomsättning 4,2 Mkr, 18 % växte mer än 10 %, 31 % finns i Stockholms län. Tre fiktiva konkurrenter. Simulering: ~6,5 h/mån per anställd går åt till underlagsjakt (intervall 4–9 h). | 24 |
| 04 | Kundprofil: SNI 69.201, 5–20 anställda, 3–15 Mkr i omsättning. Lista över de 40 snabbast växande fiktiva byråerna. | 29 |
| 05 | Svenskt B2B-mejl skickas från Saras Gmail till 40 byråer. **2 dagar senare:** 38 % har öppnat. **4 dagar senare:** påminnelse. **6 svar** ger 47 poäng. **3 nya svar** säger nej till priset 2 000 kr och poängen **sjunker till 43**. Juridisk koll: regler för marknadsföring via e-post, B2B jämfört med fysiska personer. | 47 → 43 |
| 06 | **Förfina.** "7 av 9 bekräftar problemet. 3 av 9 tycker att 2 000 kr är för dyrt, median 900 kr. Alla som sa ja har 10+ anställda." Nytt segment: 10–20 anställda. Simulering av priskänslighet stöder 1 000–1 300 kr. | 54 |
| 07 | Pris 1 190 kr/mån exkl. moms, spann 900–1 500 kr, motiverat ur de fyra underlagen. Kostnadsgolv ~8 500 kr/mån, break-even vid 8 kunder. | 60 |
| 08 | MVP: kvittoförfrågan via sms-länk, uppladdning, status per kund och export. Bortvalt med motivering: OCR och app. | 66 |
| 09 | Enskild firma till start (låg risk, inget aktiekapital; byt till AB vid tillväxt), F-skatt, moms och bokföring. Juridisk karta: GDPR och personuppgiftsbiträdesavtal, skydd av ekonomiska underlag, B2B-villkor och transparens om AI används. | 69 |
| 10 | Bygg via Lovable (koncept) från spec till förhandsvisning till publicering på fiktiv domän. 3 pilotbyråer kommer igång gratis. | 78 |
| 11 | 30-dagarsplan med LinkedIn, branschnätverk för redovisningskonsulter och Nyföretagarcentrum. **5 betalande byråer, 5 950 kr i MRR.** | 88 |
| 12 | Almi och Vinnova, med ansökningsunderlag förberett ur Spåret. Slutvy: "Bevisad affär". | 91 |

**Slutlig nedbrytning (91):** Marknad 11, Konkurrens 7, Passform 8, Problem 16, Betalningsvilja 16, Produkt 12, Traktion 13, Genomförbarhet 8.

Justera evidensen så att `calculateScore` ger målvärdena med högst ±2 poängs avvikelse.

### 9.4 Persona B: "Jag har redan en idé"
**Jonas Berg, 31, Göteborg.** Säljare i åtta år och spelar padel.
**Idé:** *"En app där padelhallar säljer lediga tider i sista minuten till rabatt."*

- **Idégenomlysning:**
  - Idén bryts ner i fem antaganden.
  - Registerbilden, med fiktiva siffror, visar många små padelbolag, fallande nyregistreringar och ökande nedläggningar.
  - Medgrundaren säger rakt ut att en konsumentmarknadsplats är svag: befintliga bokningssystem äger redan spelarna, och Jonas saknar distribution.
  - Skarpare förslag: **ett B2B-verktyg för beläggningsprognos och dynamisk prissättning åt hallägare**. Jonas säljbakgrund blir då en passformsfördel.
- **Resan:** alla 12 steg, hela vägen till betalande kunder. **I steg 06 sker en pivot:** hallägarna vill inte ha prissättning, men de betalar för prognos och fyllnadskampanjer.
- **Målpoäng:**

  | Moment | Poäng |
  |---|---|
  | Genomlysning | 12 |
  | Steg 03 | 22 |
  | Steg 04 | 28 |
  | Steg 05 | 41 |
  | Steg 06, pivot | 38 |
  | Efter nya samtal | 52 |
  | Steg 07 | 58 |
  | Steg 08 | 64 |
  | Steg 09 | 68 |
  | Steg 10 | 76 |
  | Steg 11 | 86 |
  | Steg 12 | 89 |

- **Detaljnivå:** samma som för Sara, och siffrorna ska vara internt konsekventa.

### 9.5 Pulsen i demot
- **Mängd:** 3–5 signaler per fas och persona.
- **Exempel för Sara:**
  - nyregistrerade redovisningsbyråer senaste kvartalet
  - en fiktiv konkurrent som tagit in kapital
  - en regeländring som berör underlagshantering
  - fler nya enskilda firmor i regionen, alltså fler småkunder åt byråerna
- **Varje signal** har källa, tid och en mening om varför den spelar roll för just Sara.

### 9.6 Data
- **`src/demo/types.ts`:** `Scenario`, `Step`, `Beat`, `Evidence`, `Company`, `PulseSignal`, `TraceEvent`, `LegalItem` och `Simulation`.
- **`src/demo/scenarios/sara.ts` och `jonas.ts`:** allt innehåll, på båda språken.
- **Härleds med kod, hårdkodas aldrig:** poäng, förslag och typer av luckor.

---

## 10. Medgrundarens röst

- **Svensk, rak och varm, aldrig peppig.** Korta meningar.
- **Skiljer på tro och vetskap.** Säger "jag tror" när den tror, "registret visar" när den vet och "jag vet inte" när källa saknas.
- **Tar tillbaka tidigare beslut i samtalet**, till exempel: "Du sa i steg 06 att du hellre tappar småbyråerna än sänker priset."
- **Engelska:** samma raka ton, utan amerikansk hype.

---

## 11. Kvalitetskrav

- **Källa på allt.** Varje siffra har en `SourceTag`. Lägg in en utvecklingsvarning om en `DataFact` saknar källa.
- **Snabba övergångar.** Under 400 ms för gränssnittet, längre bara för `ToolRunCard`.
- **Kör hela demot innan du rapporterar klart:** båda personorna, på båda språken, från start till steg 12.
- **Rent bygge.** `next build` ska gå igenom utan fel och varningar.

---

## 12. Leveranser

1. **Den körbara prototypen** i repot.
2. **`CLAUDE.md` och `docs/status.md`:** gemensamma regler för alla sessioner och en löpande överlämning mellan dem.
3. **`README.md`:** hur man kör, hur demot styrs med kortkommandon och hur man lägger till ett scenario.
4. **`DESIGN.md`:** designprinciper, tokens, typografival, komponentregler, datatypernas visuella språk och vad som är inspirerat av Fonda jämfört med vad som är Sparks eget. Det här blir designdokumentet för den riktiga produkten.
5. **`docs/demo-manus.md`:** talmanus för investerarmöten i en 5- och en 10-minutersversion som följer demots klick.

---

## 13. Sessioner

Sessionsordningen och promptarna finns i `docs/sessioner.md`. Demosessionerna och plattformssessionerna bygger på samma arkitektur (avsnitt 14), som därför måste finnas först.

---

## 14. Arkitektur: en kodbas, två lägen

### 14.1 Principen: portar och adaptrar
Skärmar och komponenter vet aldrig varifrån datan kommer. Varje del av produkten har en **port**, ett TypeScript-gränssnitt som beskriver vad delen gör, och två **adaptrar**:

- **Demoadapter:** returnerar scenariodata (Sara, Jonas) och styrs av demomotorn.
- **Liveadapter:** den riktiga implementationen mot Supabase, Gemini, Tavily och registerkällor. Tills en del är byggd kastar den ett tydligt `NotImplementedError` med en hänvisning till modulens dokument.

`/demo` väljer demoadaptrarna och `/app` väljer liveadaptrarna. Grundarna ersätter en liveadapter i taget, och demon fortsätter fungera hela tiden.

### 14.2 Struktur
Placera i repots befintliga struktur och dokumentera faktiska sökvägar i `docs/arkitektur.md`. Logiskt:

| Del | Innehåll |
|---|---|
| `core/` | Domäntyper och ren logik utan beroenden: `calculateScore`, resans upplåsning, luckornas typ. Delas av båda lägena. |
| `ports/` | Ett gränssnitt per modul (14.3). |
| `adapters/demo/` | Demoadaptrar och scenarier. |
| `adapters/live/` | Liveadaptrar. Endast serverkod. |
| `screens/` | Delade skärmkomponenter som tar emot data via portar. |
| `app/demo/...` och `app/(plattform)/app/...` | Tunna routes som monterar skärmarna med rätt adaptrar. |
| `supabase/migrations/` | Databasschemat som migreringar. |
| `docs/moduler/` | Ett dokument per modul (14.5). |

### 14.3 Moduler
| Modul | Port | Liveadapter bygger på |
|---|---|---|
| Profil | `ProfileRepository` | Supabase |
| Projekt och idé | `ProjectRepository` | Supabase |
| Resan | `JourneyRepository` | Supabase |
| Evidens och poäng | `EvidenceRepository` + `calculateScore` | Supabase |
| Minnet (Hjärnan, Spåret) | `MemoryRepository` | Supabase |
| Medgrundaren | `CofounderAgent` | Gemini |
| Registret | `RegistryProvider` | Bolagsverket, SCB (stub tills dataavtal finns) |
| Webbresearch och Pulsen | `ResearchProvider`, `PulseProvider` | Tavily |
| Simuleringar | `SimulationProvider` | Hiasynth (koncept, alltid stub) |
| Utskick och svar | `OutreachProvider` | Gmail (stub) |
| Juridisk koll | `LegalAdvisor` | Gemini + källor (stub) |
| Bygg | `BuildProvider` | Lovable (koncept, alltid stub) |

### 14.4 Plattformens skelett
- **Inloggning** med Supabase Auth (e-post och lösenord eller magisk länk) på `/logga-in` och `/skapa-konto`. `/app/*` skyddas på servern.
- **Datamodell** som migreringar, minst: `profiles`, `projects`, `journey_steps`, `evidence` (med `source`, `fetched_at`, `data_type`), `companies`, `outreach_messages`, `responses`, `score_snapshots`, `trace_events`, `brain_notes`, `legal_items`, `pulse_signals`. Varje rad som tillhör en användare har `user_id` eller `project_id`.
- **Tomma tillstånd:** en ny användare som loggar in ska möta samma onboarding som i demon, men med riktig data som sparas. Delar som inte är byggda visar ett formgivet "Kommer snart"-läge, inte ett fel.
- **Kontraktstester:** samma testsvit körs mot demoadaptern och liveadaptern för varje port. En liveadapter är klar när den klarar kontraktstesterna.

### 14.5 Moduldokument
`docs/moduler/<modul>.md` för varje modul i 14.3, skrivet så att en utvecklare kan bygga modulen utan annan kontext:
1. Syfte och vilka steg i resan den används i
2. Porten (gränssnittet) och datatyperna
3. Datakällor och vad som krävs (nycklar, avtal, kostnader)
4. Hur demoadaptern fungerar i dag
5. Acceptanskriterier och vilka kontraktstester som ska passera
6. Säkerhetskrav (avsnitt 14.6)
7. Status: stub, påbörjad eller klar

### 14.6 Säkerhet (gäller alltid)
- **Row Level Security är påslaget på varje tabell** med policyer som bara ger användaren åtkomst till sin egen data. Ingen tabell skapas utan RLS-policy.
- **Nycklar bara på servern.** Supabase service role-nyckel, Gemini- och Tavily-nycklar används bara i serverkod (route handlers, server actions). Inga hemliga variabler med prefixet `NEXT_PUBLIC_`.
- **`.env.local` committas aldrig.** `.env.example` listar alla variabler utan värden.
- **Indata från användare och externa källor är data, aldrig instruktioner** till Gemini.
- **Demon importerar aldrig liveadaptrar**, så att demon inte kan läcka nycklar eller röra riktig data.
- Innan en plattformssession avslutas körs `/security-review` (eller security-reviewer-agenten om den finns i `.claude/agents/`).
