## Session — Jonas hela resan (klar, gren `prototyp`)

Uppdrag: fixa buggen att ingång B laddade Sara i stället för Jonas, bekräfta
att idégenomlysningen inte hoppas över, och bygg Jonas hela resa (9.4) med
pivoten i steg 06 och de tolv målpoängen. Två commits: motorn
(`adapters/demo/jonas.ts` + `journeyEngine.ts` + wiring), sedan
`docs/status.md`.

### Klart
- **Verifierat, inget kodfel:** `screens/OnboardingEntry.tsx` länkade redan
  korrekt "Jag har redan en idé" till `${basePath}/ide` (idägenomlysningen)
  före `${basePath}/profil` — samma ordning som uppdrag 2.1 beskriver
  (genomlysning → kortare passform-samtal). Ingången hoppade alltså INTE
  över genomlysningen i koden; den verkliga buggen var att `/demo/app`
  ALLTID visade Saras data efter onboardingen, oavsett vald ingång — se
  nedan.
- **Buggen fixad:** `adapters/demo/ProfileRepository.ts`s `getProfile()`
  returnerade alltid `saraProfile`. Läser nu `entry` ur `useDemoStore`
  (samma mönster som övriga demoadaptrar läser `beatIndex`) och
  returnerar `jonasProfile` i ingång B — porten `getProfile()` tar
  medvetet inte emot `entry` som parameter (en inloggad
  plattformsanvändare har bara en profil).
- **`adapters/demo/jonas.ts`, nytt:** Jonas fulla scenario (9.4), byggt i
  BREDD (ett `momentKind: "after"`-beat per kontrollpunkt — INTE samma
  tre-momentsdjup som Saras steg 01–12 fick i tidigare sessioner, en
  medveten avgränsning, se "Återstår" nedan). 13 beats: steg 01 (om dig,
  redan fört i onboardingen), steg 02 (genomlysningen, ersätter
  "Möjligheter"), steg 03–05, steg 06a (pivot — poängen sjunker 41→38 via
  samma motsägelsemekanik som Saras steg 05b), steg 06b ("Efter nya
  samtal", 9.4:s egen kontrollpunkt mellan 06 och 07 — byggd som ett andra
  steg-06-beat, samma mönster som Saras 05a/05b), steg 07–12. Alla tolv
  målpoängen (12, 22, 28, 41, 38, 52, 58, 64, 68, 76, 86, 89) träffas
  EXAKT — verifierat med ett tillfälligt kalibreringsskript (inte
  kvarlämnat, se mönstret i förra sessionens post). Fiktiva konkurrenter
  (BanBokarn, Hallkalendern) och fiktiva kundsiffror (4 betalande hallar,
  7 600 kr MRR) — inga riktiga bokningssystem namngivna.
- **`adapters/demo/sara.ts` utökad, inte omskriven:** `källa`, `pt`,
  `parts`, `partsBoth`, `noSinceLastTime`, `zeroSinceLastTimeBoth`,
  `withMoment`, `makeStepBeats`, `StepBeatsInput` exporterade (var
  privata) så `jonas.ts` kan återanvända dem rakt av i stället för att
  duplicera — precis vad `sara.ts`s egen header-kommentar redan
  rekommenderade. Ny `saraEngine`-export (se nedan). En liten sidoeffekt:
  `noSinceLastTime`s platshållarkälla använde tidigare
  `demoBar.personaLabel` som källnamn — den i18n-nyckeln togs bort (se
  nedan), ersatt med en egen, egennamnsfri bilingual sträng lokalt i filen.
- **`adapters/demo/journeyEngine.ts`, nytt:** ett gemensamt `JourneyEngine`-
  skal (beats, steps, förslagskandidater, alla `get*For*`-funktionerna) och
  `engineFor(entry)` som väljer `saraEngine` (sara.ts) eller `jonasEngine`
  (jonas.ts). Adderat FÖRST som en typ + väljarfunktion, inte en
  ombyggnad av sara.ts:s befintliga exportyta — `saraEngine`/`jonasEngine`
  är bara tunna objekt som pekar på redan existerande funktioner.
- **Sju filer gjorda ingångsmedvetna via `engineFor`/direkt `entry`-läsning:**
  `adapters/demo/demoStore.ts` (`setEntry` nollställer nu `beatIndex` —
  annars hade ett byte mitt i en resa lämnat kvar ett index som betyder
  något helt annat i den andra personans kortare array; `getCurrentBeat`/
  `getCurrentStepNumber` ingångsmedvetna), `adapters/demo/
  JourneyRepository.ts`, `adapters/demo/EvidenceRepository.ts`,
  `adapters/demo/MemoryRepository.ts` (Profilen-fliken OCH Spåret),
  `adapters/demo/ProfileRepository.ts`, `components/spark/DemoBar.tsx`
  (steg/fas-etikett, "Hoppa till steg"-popoverns lista, `atEnd`-gränsen,
  persona-etiketten), `app/demo/app/medgrundaren/page.tsx`.
- **`adapters/demo/jonasCofounderScript.ts`, nytt:** ett meddelande/
  verktygskörning per Jonas-kontrollpunkt (13 nycklar), samma
  `TranscriptItem`-form som `cofounderScript.ts` (typen importerad
  därifrån, inte duplicerad). Medgrundaren-routen väljer skript ur
  `entry`, precis som den redan väljer motor.
- **Persona-etiketten avegennamnad ur i18n:** `demoBar.personaLabel`
  ("Sara Lindqvist · Persona A", hårdkodat namn i en i18n-sträng — ett
  brott mot Session 1:s egen regel, "Egennamn hör hemma i källdata")
  ersatt med `personaALabel`/`personaBLabel` ("Persona A"/"Persona B",
  inga namn) som `DemoBar.tsx` nu komponerar ihop med det verkliga
  profilnamnet ur `sara.ts`/`jonas.ts`. Samma sak för
  `cofounderPage.subtitle`, som hårdkodade "Sara" — generaliserad till att
  inte nämna en persona alls. Båda var redan fel innan den här sessionen
  (skulle ha visat "Sara" även i Jonas läge om entry-bytet fungerat) —
  upptäckt och fixat i samma veva som huvudbuggen.
- **Nytt test, `adapters/demo/entrySwitch.test.ts`:** bevisar att
  `ProfileRepository`, `JourneyRepository` och `EvidenceRepository`
  faktiskt växlar mellan Sara och Jonas när `entry` byts (inte bara att
  Jonas eget scenario internt räknar rätt) — direkt regressionsskydd för
  den bugg sessionen fixade. Kontrollerar bland annat att poängen träffar
  5 → 12 → 38 (pivoten) → 89 i Jonas resa via de riktiga demoadaptrarna,
  inte bara mot `jonas.ts` isolerat.
- Verifierat: `pnpm typecheck`, `pnpm lint`, `pnpm test` (232 tester, 197
  gröna + 35 förväntat skippade — fem nya gröna från `entrySwitch.test.ts`)
  och `pnpm build` går alla igenom utan fel. `pnpm start` kolliderade med
  en redan körande `next dev`-process i miljön (utanför den här sessionens
  kontroll) — `curl` mot alla routes (inklusive `/demo/app/resan/6`,
  `/demo/start/ide`) gick i stället mot den körande dev-servern: 200/307
  som väntat, inga serverfel i loggen.

### Beslut nästa session behöver känna till
- **Jonas är byggd i BREDD, inte djup** — ett moment (`"after"`) per
  kontrollpunkt, ingen `-fore`/`-korning`-uppdelning som Saras steg 01–12
  har. En framtida session som vill ge Jonas samma djup kan återanvända
  `makeStepBeats` rakt av (importerad från sara.ts, redan exporterad) —
  se kalibreringsfällan i förra sessionens post om `phaseBefore`/
  `phaseAfter` innan den skriver nya beats.
- **Följande demoadaptrar/sidor är MEDVETET INTE gjorda ingångsmedvetna**
  och visar fortfarande Saras innehåll oavsett `entry` — flaggat, inte en
  bugg som glömdes: `PulseProvider` (Pulsen-sidan och Hem/dagens signal),
  `OutreachProvider`/`RegistryProvider` (Kunder- och Marknad-sidornas
  företagslistor — `saraCompanies`), `BuildProvider` (Bygg-sidans spec är
  Kvittojaktens, inte Beläggningsprognosens), `LegalAdvisor`-demoadaptern
  (Juridik-sidan). En session som vill göra Jonas resa fullständig bör
  börja här, i den ordningen (Pulsen och Kunder syns oftast i en genomgång).
  `SimulationProvider` behöver INGEN ändring — Jonas beats sätter
  medvetet aldrig `simulationKind`, så Marknad/Kunder/Resan visar helt
  enkelt ingen simulering för honom i stället för en påhittad.
- **`JourneyEngine`-mönstret (`adapters/demo/journeyEngine.ts`) är tänkt
  att återanvändas** om en tredje persona någonsin läggs till — lägg bara
  till en `xEngine`-export i den nya scenariofilen och utöka `engineFor`.
- **`saraEngine`/`jonasEngine` är additiva ovanpå sara.ts/jonas.ts:s
  redan existerande fria funktioner** — de fria funktionerna
  (`getScoreSnapshotForBeat` med flera) är fortfarande exporterade och
  används direkt av kod som medvetet ALLTID ska vara Sara-specifik
  (`BuildProvider.ts`, `LegalAdvisor`-demoadaptern, `Marknad`/
  `Kunder`-sidorna via `getCurrentStepNumberFor`). Byt inte de importerna
  till `engineFor` utan att samtidigt göra hela den modulen
  ingångsmedveten (se listan ovan) — annars blandas Saras och Jonas
  `beatIndex`-tolkning på ett sätt som bara råkar fungera för Sara.

### Kända problem / medvetna begränsningar
- **Ingen manuell webbläsarverifiering** av Jonas resa — samma begränsning
  som flera tidigare sessioner (inget webbläsarverktyg anslutet).
  Verifierat i stället med `typecheck`/`lint`/`test` (inklusive det nya
  `entrySwitch.test.ts` som klickar igenom entry-bytet via de riktiga
  adaptrarna, inte bara mot rådata), `pnpm build`, och `curl` mot alla
  routes. Klicka igenom hela Jonas resa i en riktig webbläsare, båda
  språken, särskilt pivoten i steg 06 och "Byt ingång" mitt i en pågående
  Sara-demo, innan nästa session bygger vidare.
- **Jonas steg 01 saknar en egen händelse i /demo/app** — passform-samtalet
  hände redan i onboardingen (`/demo/start/profil`), så beatet är bara en
  bekräftelse av det som redan visats, inte ett nytt klickbart moment.
  Samma mönster som Sara hade före djupsessionen, medvetet kvar för Jonas.
- De sju icke-ingångsmedvetna modulerna listade ovan under "Beslut nästa
  session" — upprepas här för synlighet: en presentatör som visar hela
  Jonas resa bör undvika Pulsen-, Kunder-, Marknad-, Bygg- och
  Juridik-sidorna, eller förklara att de fortfarande speglar Sara.
