## PR 10: Medgrundaren, Bygg och Affärsplan (2026-09-30, direkt på `design/en-design`)
Tionde steget i `docs/plan-en-design.md`. `origin/prototyp` fanns redan i grenen. Fyra kodcommits och docs: Medgrundaren (`032a12f`), Bygg (`9a5d347`), Affärsplanen (`98eda3d`) och rättningarna av affärsplanens källor (`73287c4`, egen commit så att den kan granskas och backas för sig). Arbetet avbröts en gång av användningsgränsen efter Medgrundaren och återupptogs.

### Klart
- **Medgrundaren:** `screens/Cofounder.tsx` är ersatt av demots markup.
  - `CofounderData = { moment; context }`, nullbara var för sig. En tom `context` döljer spalten, som i demot.
  - `ChatLine`, `ToolRun` och `TimeSkipLine` är flyttade till `screens/blocks/ChatBlocks.tsx`. `DemoBlocks` exporterar dem vidare åt onboardingen (PR 11).
  - Demots manus (`cofounderScript`, `journeyEngine`) stannar i demots sida.
  - `/app/medgrundaren`: `CofounderAgent` har bara `sendMessage` (stubbe), och ingen port ger moment eller kontext. Båda sektionerna visar därför "Kommer snart", och inget anrop görs. Promptfältet är avstängt.
- **Bygg:** `screens/Build.tsx` är ersatt av demots markup.
  - `BuildData = { status; spec }`, där `spec: ByggBrief | "none" | null`. `"none"` betyder att porten svarat att ingen spec finns än och ger tomläget "Ingen spec än." (ny nyckel `buildPage.specEmpty`). `null` betyder platshållarfel och ger "Kommer snart".
  - `BuildLock` har samma form som Validering och Marknad. Demot räknar ut den som förut: ingen spec ger låst till steg 07, och Jonas får "inte i scenariot".
  - `ConceptBadge` visas alltid, också i låst läge.
  - `/app/bygg`: låst tills steg 07 är klart (Resans `getSteps`), och i låst läge görs inga andra anrop. `getStatus` och `getSpec` fångas var för sig med `orNull`, och portens `null` skiljs ut före fångsten. Båda är stubbar, så båda sektionerna visar "Kommer snart" för den som har låst upp.
- **Affärsplanen:** `screens/BusinessPlan.tsx` är ersatt av demots markup. Skärmen visar bara vad `buildBusinessPlan` returnerar, och `core/businessPlan.ts` är orörd.
  - `BusinessPlanData = { plan: BusinessPlan | null }`. `null` ger alla nio avsnitt med rubrik, beskrivning och "Kommer snart", och färdighetsgraden "—", aldrig 0.
  - `/app/affarsplan`: det finns ingen port och ingen live-hopsamling, så sidan visar just det. Demots hopsamling används aldrig.
- **Rättningarna av affärsplanens källor** (`adapters/demo/businessPlan.ts`, beslut av grundaren):
  - **Ett påstående visas bara med sin egen, verkliga källa.** Följande saknar källa i sina portar men lånade tidigare en poängdels eller registrets källa. De tas nu inte med:
    - stegens höjdpunkter, alla steg (poängdelens källa)
    - steg 04:s kundprofil (registrets källa)
    - förslagens förklaringar i Riskerna (poängdelens källa)
    - den skarpare idéns motivering (registrets källa)
    - Jonas antaganden (registrets källa)
    - konkurrenternas beskrivningar ("dyrt och tungt att införa") (registrets källa)
    - domens reservkälla (poängdelen)
  - Kontrollpunkterna står kvar utan påståenden, så avsnittens status sjunker och luckan visas ("Underlag saknas — kommer från steg N"). Ingen källa är påhittad.
  - **Urvalet** skrivs "tillväxt: 171 av 312, region: 308 av 312" (sv) eller "growth: 171 of 312, region: 308 of 312" (en), i stället för "171/308". **Andelarna** bär % ("18 %"). En andel med underlaget 0 (porten: okänt) visas inte. Nya nycklar: `businessPlanPage.percentValueTemplate` och `coverageValueTemplate`.
  - **`CLAUDE.md`:** undantaget från källmärkning gäller nu uträknade sammanfattningar som bara bygger på delar som visas med källa, på samma sida eller en länkad. Det gäller i dag två siffror, sidhuvudets poäng och affärsplanens färdighetsgrad, och aldrig en hämtad siffra.
  - `adapters/demo/businessPlan.test.ts` (5 tester) går igenom alla moment för Sara och Jonas. Mot den gamla hopsamlingen föll alla fem.
- **Tester:**
  - skärmtester: `screens/Cofounder.test.tsx` (6), `screens/Build.test.tsx` (5), `screens/BusinessPlan.test.tsx` (4)
  - ruttester: `/app/medgrundaren` (3), `/app/bygg` (7), `/app/affarsplan` (3)
  - tre nya i `app/demo/demo.test.tsx`
  - alla tre sidorna ligger i `PAGES` i `e2e/app.spec.ts`
- **Skärmbilder** (Playwright mot `pnpm build && pnpm start`, 1440 och 390 px, Sara vid beat 0, 9, 17, 25, 30 och 37 och Jonas vid 0, 10 och sista, 72 par för `/demo`, `/demo/medgrundaren`, `/demo/bygg` och `/demo/affarsplan`):
  - Efter varje flytt var alla 72 identiska med före (AE 0).
  - Efter rättningarna skiljer sig bara `/demo/affarsplan` (18 av 72). Sara i sista momentet går från 8/9 till 1/9, och Jonas i sista momentet visar 0/9.
- **Inloggat:** testkontot står på steg 01. `/app/medgrundaren` och `/app/affarsplan` visar "Kommer snart" per sektion, och `/app/bygg` visar "Låses upp efter steg 07".
- **`/security-review`:** inga fynd. Kontrollerat:
  - att rutterna ligger under `requireUser()`
  - att ingen rutt läser `params`, `searchParams`, cookies eller formulär
  - att inget renderas som HTML
  - att `orNull` bara fångar platshållarfel
  - att skärmarna inte importerar `adapters/` eller `lib/server` och att demot inte importerar någon liveadapter
  - att det inte finns några nya `NEXT_PUBLIC_`-variabler
  - att inget registeranrop görs
- Verifierat: `pnpm typecheck`, `pnpm lint` (0 fel, 3 gamla varningar i `design-referens/`), `pnpm test` (798 gröna, 35 skippade), `pnpm build` och `pnpm test:e2e` (34 av 34 mot produktionsbygget).

### Vad som inte var en ren flytt (innehållsbeslut)
- **Demots affärsplan ändras synligt** av rättningarna (se ovan). Beslut av grundaren: hellre ett tunt avsnitt än ett påstående med lånad källa.
- **Luckans text** "Underlag saknas — kommer från steg 1" visas också när steg 1 är klart. Underlaget finns då, men utan egen källa. Texten är orörd.
- **Medgrundaren utan moment:** kortets rubrik blir sidans namn ("Medgrundaren"), eftersom etiketten kommer ur samma data.
- **Byggets tomläge** "Ingen spec än." är ny text, eftersom portens `null` inte är samma sak som en stubbe eller ett låst läge.
- **Affärsplanen utan plan:** avsnitten visar ingen statuspill, eftersom status inte går att avgöra.

### Påståenden och siffror utan täckning som inte är rättade (rapporteras)
- **Marknad** (`screens/Market.tsx`, demots registeradapter): konkurrenternas beskrivningar visas där med registrets källa. Samma fel som togs bort ur affärsplanen, men det hör till Marknad och Registrets demodata.
- **Bygg:** "Credits använda: 40/62" är ett fast, fiktivt tal i `adapters/demo/BuildProvider.ts` och visas utan källa. Webbläsarraden har reservadressen "lovable.dev/projects/spark" hårdkodad i markupen, flyttad rakt av.
- **Medgrundaren:** manusets siffror (till exempel "312 byråer, 18 %" och priser) visas i chattbubblor utan `SourceTag`. Kontextspalten visar resans sammanfattningar utan källa.
- **Affärsplanen, domen:** domens motivering ("9 av 9 som svarade …") visas med citatens källa (utskicket). Det är utskickets svar som ligger bakom domen, så det bedöms som en verklig källa. Det ska granskas om domen får en egen källa i `VerdictReport`.
- **Affärsplanen, Jonas:** idégenomlysningens registerfakta visas både i Affärsidén och i Marknaden (fanns före PR 10).

### Beslut nästa session behöver känna till
- **Props:**
  - `Cofounder({ data: { moment; context } })`
  - `Build({ data: { status; spec }, locked })`
  - `BusinessPlan({ data: { plan } })`
- **När någon bygger en live-hopsamling för affärsplanen:** följ källregeln i `adapters/demo/businessPlan.ts`. Ett påstående utan egen källa tas inte med. Skärmen behöver inte ändras.
- **När stegens höjdpunkter får en egen källa i `JourneyStepDetail`** kan de komma tillbaka i planen, men bara med den källan.
- **Flikarna i `/app`** är fortfarande inerta. Bara Pulsen saknas.

### Kända problem / docs som inte stämmer
- **Skärmbildsfällan, två gånger till:** en `next start` som lever kvar gav alla 72 som falska skillnader. Kontrollera att porten är fri (`ps`) före `pnpm start`. `pkill -f "next …"` i samma skalkommando dödar skalet självt (exit 144).
- **Demots läge** ligger i `localStorage` under `spark:fonda-demo-state` (`app/demo/_lib/fondaDemoIsolation.ts`), inte `spark:demo-state` som `demoStore.ts` visar.
- **`i18n/dictionary.ts`** hänvisar till `screens/Cofounder.tsx` för "Sedan tidigare" och stämmer fortfarande.
