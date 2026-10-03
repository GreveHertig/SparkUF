## Sidornas komposition mot artefaktens vyer (klar, gren `prototyp`)

Uppdrag: läs `design-referens/artefakt/app.js`/`app.css`/`index.html` för
STRUKTUR — hur `vyHem`, `vyMedgrundaren`, `vyMarknaden`, `vyValideringen`,
`vyBygget` och `vyProfilen` är komponerade — aldrig för innehåll (artefaktens
Elin/Kvittojakten-scenario är påhittat, inget av det fick in i kodbasen). Till
skillnad från förra sessionens rena `className`-formgivning fick JSX-struktur
och komponentindelning ändras den här gången. Alla tio `/demo/app`-sidor
gjorda (inte bara Hem) — grundaren godkände att fortsätta genom hela listan
efter att Hem var klar. Tio commits, en per sida. Fullständig motivering per
sida i `DESIGN.md` under samma rubrik.

### Klart
- **Hem** ombyggd helt: den gamla femkorts-KPI-raden borttagen (grundarens
  uttryckliga instruktion). Ny tvåkolumns hero — huvudspalt: utökat
  `NextStepCard` (nya valfria props `actionPillLabel`/`remainingParts`) +
  ny `components/spark/JourneyRail.tsx` (kompakt Resan-widget med
  stegprickar, länkar till `/resan/[steg]`). Sidospalt: ny
  `components/spark/ScorePanel.tsx` (total + rörelse + sparkline + alla åtta
  delarna + låsta delar) och "Vad som hänt sedan sist". Botten, full bredd:
  "Höj din poäng" (ny `components/spark/SuggestionList.tsx`, utbruten ur
  `Score.tsx`) och Pulsen — nu 3–5 signaler (`getSignals`) i grid i stället
  för bara dagens signal.
- **Medgrundaren:** samma tvåkolumns "cog"-grid som originalet — chatten i
  huvudspalten, "Sedan tidigare"-kontextlistan i sidospalten (fyller Hjärnans
  platsroll utan att duplicera Minnets data — Hjärnan finns redan på Minnet).
- **Marknad:** ny split — Storleksfördelningen i huvudspalten, "Dina
  utskick" (nu kompakta `dl`-rader i stället för `KpiTile`-kort) och
  "Datalagret" staplade i en sidospalt, som artefaktens `dist`/`[utskick,
  lager]`-uppdelning. KPI-raden, Kundlistan, Konkurrenterna, Simuleringen
  oförändrade.
- **Validering:** låg redan i artefaktens exakta sektionsordning sedan en
  tidigare session — minst omtag. Antagandena och kontaktlistan fick
  `Card`-skal (artefakten wrappar just de två), resten var redan bar
  `Eyebrow` + grid som artefakten.
- **Bygg:** statusraden blev en färgad grindbanner. Ny split: "Omfånget"
  (målgrupp + sidor) i sidospalt, ett webbläsarchrome-styrt "fönster" i
  huvudspalt som visar specen och underlaget. Ingen Lovable-interaktivitet
  tillagd.
- **Minnet:** profilfliken bytte från ett blandat kort till två `Card`-kort
  i grid (Bakgrund, Resurser) — samma "profgrid"-idé, byggt av
  `ProfileSummary`s faktiska sex fält.
- **Resan, Poäng, Pulsen, Juridik** (inget eget artefakt-original): Resan
  fick en "klara/totalt"-not per fasrubrik; Poäng återanvänder nu samma
  `ScorePanel`/`SuggestionList` som Hem i stället för egna uppfinningar;
  Pulsen visar sina signaler som grid i stället för staplad lista; Juridik
  fick en `Eyebrow`-rubrik ovanför kartan.
- **Nytt delat byggblock `components/ui/Card.tsx`:** motsvarar artefaktens
  `card`/`chead`. Regel för när en sektion wrappas: artefakten avgör — en
  sektion artefakten själv bygger med `card()` blir `Card` hos oss, en bar
  `stats`/`.replies`-grid under en rubrik förblir bar `Eyebrow` + grid.
- **`adapters/demo/tourSteps.ts`:** de tre stoppen som pekade på Hems
  borttagna KPI-rad/"Poängrörelse"-kort (`hem-kpi` × 2,
  `hem-score-movement`) omriktade till den nya poängpanelen (`hem-score`).
  Övriga tolv mål verifierade oförändrade (`comm` mellan `tourSteps.ts`s mål
  och samtliga `data-tour-id` i kodbasen — inget saknas).
- Verifierat: `pnpm typecheck`/`lint`/`test` (373 gröna, 36 skippade som
  väntat, genom hela sessionen) och `pnpm build` gröna före varje commit.

### Beslut nästa session behöver känna till
- **`components/ui/Card.tsx` är nu det delade kortskalet** — återanvänd det
  i stället för att skriva `rounded-md border border-slate-200 bg-white p-4
  shadow-lg` för hand, men bara när artefakten själv wrappar motsvarande
  sektion i `card()` (se `DESIGN.md`s regel). En grid av redan
  egna-bordade kort (KpiTile, svarskort, konkurrentkort) ska förbli en bar
  `Eyebrow` + grid, inte dubbelt inkapslad.
- **`components/spark/ScorePanel.tsx` och `SuggestionList.tsx`** används nu
  av både Hem och Poäng — ändra dem på ett ställe, inte per sida.
- **`NextStepCard.remainingParts`** är byggt av `ScoreSnapshot.lockedParts`
  och visar bara "delen är låst, låses upp efter steg N" — det finns ingen
  bespoke kravtext per krav (som artefaktens `UNLOCK.krit`) i vår datamodell.
  Hitta inte på sådan text i en framtida session utan att först fråga
  grundaren om det är värt en ny porttyp.
- **Minnets idé-kedja** ("Härifrån kom idén", artefaktens `vyProfilen`)
  fördes medvetet inte över — sökt igenom hela kodbasen, ingen sådan
  strukturerad data finns. Grundaren godkände avvikelsen under
  förutsättningen att inget befintligt försvinner; eftersom kedjan aldrig
  fanns är villkoret trivialt uppfyllt.
- **Dubbel kantlinje, avsiktlig:** Hems "Höj din poäng"/Pulsen är
  `Card`-wrappade (artefakten wrappar dem) trots att `SuggestionList`/
  `PulseCard` redan har egen kant+skugga — ett litet visuellt dubbelt-kant-
  avdrag, dokumenterat i `DESIGN.md`, inte en bugg att jaga.

### Kända problem / medvetna begränsningar
- **Ingen manuell webbläsarverifiering.** Inget webbläsarverktyg anslutet,
  och ingen cachad Playwright/Chromium-installation tillgänglig den här
  gången (till skillnad från förra sessionen) — att installera ett nytt
  paket hade brutit mot "inga nya beroenden". Verifierat med
  `typecheck`/`lint`/`test`/`build` genom hela sessionen plus `curl` (200)
  mot `/demo/app`. Gör en klickgenomgång (båda språken) i nästa session som
  har ett webbläsarverktyg — särskilt Hems tvåkolumnslayout vid smalare
  bredder och `JourneyRail`s stegprickar.
- `screens/Market.test.tsx` fick ett test justerat (`"4/ 5"` → `"4 / 5"`) för
  den nya `dl`-radens mellanslagsformatering — samma tal, ingen
  beteendeändring.

### Återstår
- Klickgenomgång i en riktig webbläsare (se ovan).
- Sidhopslagningen som väntar på Erik efter Emma-mötet (`docs/beslut.md`,
  oförändrad av den här sessionen — ren layoutsession, ingen sidstruktur
  slogs ihop eller togs bort).
