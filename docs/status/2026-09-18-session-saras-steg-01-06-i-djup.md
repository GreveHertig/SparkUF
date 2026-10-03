## Session — Saras steg 01–06 i djup (klar, gren `prototyp`)

Uppdrag: bygg Saras steg 01–06 i djup, inte bara i bredd (uppdrag 9.1) —
tre klickbara moment per steg (före/körning/efter), kalibrera poängen mot
9.3, gör nedgången i steg 05 pedagogisk, bygg ut simuleringsytorna i steg
03/04/06, verifiera att demot alltid startar i onboardingen och att allt
finns på båda språken. Tre commits: portar/komponenter/simulering,
innehållet i `sara.ts` + de kringliggande demoadaptrarna, sist UI-wiring
på Resan/[steg] och en `−0`-fix på Hem/Poäng.

### Klart

- **`adapters/demo/sara.ts` omstrukturerad:** steg 01–06 har nu 20 beats i
  stället för 6 — varje steg är `<id>-fore`/`<id>-korning`/`<id>-efter`
  (`makeStepBeats`-hjälparen), steg 05 en egen femdelad form
  (`05a-utskicket-{fore,korning,efter}` + `05b-svaren-{korning,efter}`).
  Poängen ändras aldrig i före/körning (samma `PartEvidence` som
  föregående stegs efter-moment, kopierat rakt av) — bara `-efter` bär ny
  evidens. Steg 07–12 orörda i sak (bara ett nytt `momentKind: "after"`
  tillagt på varje, `Beat`-typen kräver det nu).
- **Kalibrering (uppdrag 9.3, högst ±2):** 6, 14 (−2), 24, 27 (−2), 47,
  43, 54 — steg 01, 03, 05 (både 47 och 43) och 06 träffar målvärdena
  exakt. Steg 02 och 04 är matematiskt tvungna till −2 inom nuvarande
  fasarkitektur: Passform är låst vid sitt facit-värde 8 (rör man det
  spricker steg 12:s redan godkända slutnedbrytning) och Marknad är
  hård-kappad vid sin vikt 12, så det enda röbara i de två stegen är
  Konkurrens — och den är redan i sitt tak (8) vid steg 04. Fixet som
  faktiskt gjordes: steg 03:s egna Konkurrens-bevis sänktes från 7 till 5
  poäng (en isolerad ändring, bara det beatet — flyttade steg 03 från +2
  till exakt 24) medan steg 04 och alla senare steg behåller sina
  ursprungliga bevis. Verifierat med ett tillfälligt testskript (inte
  kvarlämnat) att steg 07–12 ger exakt samma totalsummor som innan
  ändringen (60, 66, 70, 77, 88, 92) — ingen cascading-effekt.
- **Steg 05:s nedgång (avsnitt 9.1, punkt 3):** `05b-svaren-efter`s
  highlights förklarar regeln konkret i stället för att bara säga att
  poängen sjunker: Betalningsvilja bygger på två bevisposter (+9 för de
  sex positiva, −3 för de tre som säger nej), en av två (50 %) motsäger
  vilket är över 30 %-tröskeln, så hela delen straffas 15 %:
  `(9 − 3) × 0,85 ≈ 5`. Siffrorna är verifierade mot `core/score.ts`s
  faktiska beräkning, inte påhittade för att låta pedagogiska.
- **`SimulationCard`** (`components/spark/SimulationCard.tsx`) — fanns i
  komponenttabellen (uppdrag 8) men var aldrig byggd. Visar alltid
  Simulering-etiketten, populationens storlek, källan och
  osäkerhetsintervallet. `Market`-vyn visade tidigare INTE
  populationsstorleken alls — en verklig lucka mot uppdrag 2.2/kravet i
  den här sessionen, nu fixad. Wire:ad in på Marknad (steg 03, befintlig
  simulering), Kunder (steg 04, ny simulering om betalningstolerans per
  byråstorlek — `adapters/demo/SimulationProvider.ts` fick en tredje
  kanonisk simulering, `"tolerance"`) och Resan/[steg] för alla tre steg
  (03/04/06), via nya fält på `JourneyStepDetail`.
- **`ports/JourneyRepository.ts` utökad:** `JourneyStepDetail` har nu
  `momentKind` ("before"/"running"/"after"), `scoreDelta`,
  `newlyUnlockedParts` och `verdict` utöver `simulation`. Alla kod-
  härledda i `demoJourneyRepository.getStepDetail` (poängdiff mot
  föregående beat, låsta-delar-diff för upplåsning) — inget hårdkodat.
  `adapters/live/JourneyRepository.ts` uppdaterad med trygga
  default-värden (`momentKind: "after"`, resten `null`/`[]`) så
  plattformen fortsätter kompilera; ingen ny livefunktionalitet byggd.
- **`screens/JourneyStep.tsx`** renderar nu momentpillen, en körnings-
  hint (pekar mot Medgrundaren när `momentKind === "running"`),
  poängändring med förklaring, "Nyupplåst"-listan, `VerdictCard` (steg
  06 — den befintliga men tidigare oanvända komponenten) och
  `SimulationCard` (steg 03/04/06).
- **`adapters/demo/PulseProvider.ts`:** fem signaler i stället för fyra
  (tre synliga från start, håller kontraktstestets 3–5-krav i varje
  läge), två låses successivt upp efter `03-marknaden-efter` respektive
  `06-domen-efter` — den sistnämnda bekräftar segmentbytet från Domen med
  en oberoende registersignal. `getTodaysSignal` visar den senast
  upplåsta i stället för en statisk signal.
- **`adapters/demo/MemoryRepository.ts`:** Spåret loggar bara beats med
  `momentKind === "after"` — annars hade varje steg gett tre rader i
  Spåret för samma händelse. Ny `traceSummary`-text per efter-beat
  (kort, retrospektiv) i stället för att återanvända uppgiftens titel.
- **`adapters/demo/OutreachProvider.ts`:** Kunder-tabellens status
  (draft/sent/opened/responded) följer nu beatens `momentKind` och
  `id`-prefix (`stageFor`) i stället för en enda hårdkodad
  `beat.id === "05a-utskicket"`-jämförelse. Svarsvågorna delades upp på
  riktigt: de sex som bekräftar problemet syns från `05a-utskicket-efter`,
  de tre som säger nej till priset syns först från `05b-svaren-efter`
  (tidigare visades alla nio samtidigt så fort steg 05b nåddes).
- **`adapters/demo/cofounderScript.ts`:** en nyckel per moment
  (`-fore`/`-korning`/`-efter`). Steg 01 och 06 fick var sitt
  `ToolRunCard` (profilsammanställning respektive domen) som tidigare
  helt saknades — de var bara chattmeddelanden.
- **`−0`-buggen i Poängrörelse-kortet fixad på riktigt** (Hem och Poäng):
  var ett känt kosmetiskt problem sedan Session 2 (visade "−0" utan text
  efter vid oförändrad poäng), men blev mycket vanligare nu när varje
  steg har två moment (före/körning) utan poängändring. Sektionen göms
  nu helt när `delta === 0`.
- **Onboarding startar alltid om (uppdrag 9.1):** verifierat, inte
  ändrat — `onboardingDone`-flaggan och redirecten från Session 5
  fungerar fortfarande oförändrat med de nya beatsen (`beatIndex 0` är
  bara ett annat, tidigare beat nu).
- **Båda språken:** allt nytt scenarioinnehåll (`sara.ts`,
  `cofounderScript.ts`, pulssignalerna, betalningstoleranssimuleringen)
  och alla nya i18n-nycklar (`journeyPage.momentPill`/`runningHint`/
  `scoreChangeTitle`/`unlockedTitle`/`simulationTitle`,
  `customersPage.simulationTitle`, `common.simulationPopulationLabel`)
  finns typtvingat på sv och en.
- Verifierat: `pnpm typecheck`/`lint`/`test` (227 tester, 192 gröna + 35
  förväntat skippade) och `pnpm build` går alla igenom utan fel eller
  varningar. `pnpm start` + `curl` mot alla `/demo/*`- och publika routes:
  200 överallt (`/demo`/`/app` → 307 som väntat).

### Beslut nästa session behöver känna till

- **Steg 02 och 04 ligger permanent på −2** inom den nuvarande
  fasarkitekturen (se kalibreringsresonemanget ovan) — det går inte att
  stänga gapet helt utan antingen ett tredje `EvidenceItem` för Passform
  (bryter steg 12:s facit) eller att lätta Marknads prelimiär-tak i
  `core/score.ts` (bryter `core/score.test.ts`s beskrivna regler). Låt
  dem vara −2 om inte grundaren uttryckligen vill ändra formlerna.
  `adapters/demo/sara.ts`s header dokumenterar samma resonemang.
  Motsvarande resonemang gäller om Jonas (Persona B, Session 5+) någon
  gång får samma djup — samma fasarkitektur, samma begränsning.
- **`makeStepBeats`-mönstret i `sara.ts`** är tänkt att återanvändas rakt
  av när Jonas fulla resa eller andra scenarier byggs i djup — se
  kommentaren överst i filen och `StepBeatsInput`-typen.
- **`Beat.momentKind` är nu obligatoriskt** på varje beat (inklusive
  steg 07–12, som alla är `"after"`). Ett nytt scenario som inte sätter
  fältet failar typecheck direkt, inte i körning.
- **Ingen webbläsarverifiering** — Claude in Chrome-tillägget var inte
  anslutet i den här sessionen (samma begränsning som Session 3 och 5).
  Verifierat i stället med `typecheck`/`lint`/`test` (inklusive
  komponenttester som faktiskt klickar igenom `DemoBar`s Nästa/Bakåt),
  `pnpm build` och `curl` mot alla routes. **Klicka igenom alla 27 beats
  i `/demo/app` på båda språken i en riktig webbläsare** innan nästa
  session bygger vidare ovanpå det här — särskilt steg 05:s nedgång och
  "Hoppa till steg"-popoverns nya längd (27 rader, fick `max-h-[70vh]
  overflow-y-auto` i `DemoBar.tsx` men är overifierad i en riktig
  webbläsare).
- **`ports/JourneyRepository.ts`s nya fält är demo-bara i praktiken.**
  Liveadaptern returnerar trygga default-värden men bygger ingen egen
  logik för moment/upplåsning/simulering — det är en framtida
  plattformssessions uppgift när Resan-modulen görs klar där, se
  `docs/moduler/resan.md`.

### Kända problem / medvetna begränsningar

- **Steg 07–12 har fortfarande bara ett moment vardera** (oförändrat
  sedan Session 3) — den här sessionens djup gäller uttryckligen bara
  01–06, per uppdraget.
- **"Hoppa till steg"-popoverns 27 rader** är overifierad i en riktig
  webbläsare (se ovan) — fungerar i teorin (Radix Popover + `overflow-y-
  auto`) men inte klickad igenom.
- Inga nya problem i övrigt.
