## Session — Affärsplanen (klar, gren `prototyp`)

Uppdrag: en ny funktion, Affärsplanen — en plan som sätts samman i kod ur
det grundaren redan bevisat i resan, aldrig genererad, ingen språkmodell
inblandad. Tre delar: specen i `docs/uppdrag.md` (avsnitt 15), en ren
funktion i `core/businessPlan.ts` (samma mönster som `core/score.ts`), och
en ny sida under `/demo/app`. `core/score.ts`, `adapters/live/`,
`lib/server/`, `ports/` och befintlig demodata orörda. Tre commits.

### Klart
- **`docs/uppdrag.md` avsnitt 15:** principen (planen sätts samman, sätts
  aldrig, varje påstående bär `Källa`+datum), tabellen över alla nio
  avsnitt mot sina underliggande portar, och de tre reglerna (luckor
  visas/fylls inte, motsägelser döljs inte, planen visar sin egen
  färdighetsgrad).
- **`core/businessPlan.ts`:** `buildBusinessPlan` — en ren funktion utan
  adapter-, i18n- eller portimport. Tar redan hopsamlade "kontrollpunkter"
  per avsnitt (`BusinessPlanCheck`: `claims` om kontrollpunkten höll, annars
  tom med `requiredStepNumber`) och räknar status (`solid`/`thin`/`missing`)
  och en `maturity.solidShare`. Sorterar alltid till den fasta
  avsnittsordningen (`BUSINESS_PLAN_SECTION_ORDER`), oavsett indataordning.
  Motsägelser (`BusinessPlanContradiction`) och låsta poängdelar
  (`lockedParts`, bara "risks") går rakt igenom oförändrade. Kastar om ett
  avsnitt skickas in utan en enda kontrollpunkt. `core/businessPlan.test.ts`
  har ett test per regel i 15.3, samma stil som `core/score.test.ts`.
- **`adapters/demo/businessPlan.ts`** (ny fil, inte en port): hopsamlingen
  ur de befintliga demoportarna — `JourneyRepository.getStepDetail` (steg
  1, 2, 4, 5, 6, 7, 8, 11, 12), `EvidenceRepository` (`ScoreSnapshot` +
  `getSuggestions`), `RegistryProvider`, `VerdictProvider`,
  `ProjectRepository.getIdeaScreening`, `BuildProvider.getSpec`. Bygger en
  `partSources`-uppslagning (`ScorePartId` → `{source, dataType}`) genom att
  matcha `ScoreSnapshot.parts[].name` (redan lokaliserad etikett) mot
  `t.score.parts` — `ScorePart` bär inget stabilt `partId` (bara `name`),
  så matchningen måste ske i adapterlagret, inte i `core/`.
  **Viktigt fynd under bygget:** `RegistryProvider` och
  `ProjectRepository.getIdeaScreening` är hårdkodade mot en enda persona
  vardera (registret alltid Sara, idégenomlysningen alltid Jonas) **utan**
  egen `entry`-vakt, till skillnad från `OutreachProvider`/`VerdictProvider`/
  `BuildProvider`/`PulseProvider`/`LegalAdvisor` som redan har en. Anropas
  därför bara för rätt persona i `businessPlan.ts` (samma disciplin som
  redan finns överallt annars) — adaptrarna själva rördes inte. Se
  `docs/beslut.md` 2026-09-22 för fullständig motivering.
- **`screens/BusinessPlan.tsx` + `app/demo/app/affarsplan/page.tsx`:** ny
  sida, samma kortskal (`Card`), typografiska skala, källchips (`SourceTag`)
  och maxbredd/gap som resten av `/demo/app`. Färdighetsgraden visas överst
  som en `KpiTile` (`x/9`). Varje avsnitt är ett `Card` med en statuspill
  (håller/tunt underlag/saknas, samma tonfärgsmönster som `Journey.tsx`s
  `journeyStatusToneClasses`), sina påståenden (etikett+tal i `DataFact`-stil
  där ett `value` finns, annars ren text, alltid med `SourceTag`),
  motsägelser i en egen markerad ruta, och luckor som `LockedState` (ärligt
  tomt läge, inte en tom ruta). Låsta poängdelar (bara "risks") listas
  likadant. Sidan hämtar data i en `useEffect` med
  `[locale, beatIndex, entry]` som beroende, samma mönster som
  `app/demo/app/poang/page.tsx`.
- **Ny nav-post** ("Affärsplanen") i `screens/AppShell.tsx`, ny
  `NavIcon`-variant (`businessPlan`). Nya i18n-nycklar
  (`appShell.nav.businessPlan`, `businessPlanPage.*`), sv+en, typtvingat.
  `screens/Market.tsx`s redan existerande `marketPage.companyCountLabel`
  m.fl. återanvänds rakt av för Marknad-avsnittets nyckeltal — inga
  duplicerade i18n-nycklar för samma etiketter.
- **`components/ui/Eyebrow.tsx`:** ny `tone="warning"` (score-orange text)
  för Riskerna-avsnittets motsägelsemarkering. Utan den hade två
  textfärgs-klasser (tone + en påstådd override i `className`) staplats på
  samma element — exakt den CSS-källordningsbugg `DESIGN.md` redan
  dokumenterat en gång (Session 1, `EditorialHeading`). Löst genom att lägga
  till en riktig tone-variant i stället för att stapla klasser.
- **`core/businessPlan.ts`s `BusinessPlanClaim`** fick ett valfritt
  `value`-fält (siffra eller redan formaterad sträng) för siffertunga
  påståenden, i samma "etikett + tal"-stil som `DataFact` — upptäckt som
  nödvändigt medan `adapters/demo/businessPlan.ts` skrevs (registrets
  nyckeltal har ingen egen meningstext att återanvända, bara en i18n-etikett
  + ett tal).
- **Manuell webbläsarverifiering genomförd** (cachad Playwright/Chromium,
  `pnpm build && next start`): båda personas, båda språken, via
  demoradens "Hoppa till steg" (senaste beatet) och sidomenyns SPA-länk —
  samma etablerade metod som undviker den kända fresh-load-
  hydreringskapplöpningen på nästlade `/demo/app`-routes. Inga konsol-
  eller sidfel i någon av de fyra kombinationerna. Skärmdumpar bekräftar
  visuellt: kortskal, chips, statuspiller och `LockedState`-tomma-lägen
  renderar konsekvent med resten av `/demo/app`.
- Verifierat: `pnpm typecheck`/`lint`/`test` (389 gröna, 36 skippade som
  väntat — 11 nya gröna från `core/businessPlan.test.ts`) och `pnpm build`
  gröna. `adapters/demo/tourSteps.ts` opåverkat (ny sida är inte en del av
  `TourRoute`-unionen, ingen tour-uppgift begärdes) — bekräftat via grön
  `TourOverlay.test.tsx` och en oförändrad `pnpm build`.

### Resultat: vilka avsnitt saknade underlag (rapporterat, per uppdrag)
- **Sara (8 av 9 håller):** bara **Beviset** är tunt underlag — domen
  (steg 06) finns och håller, men "antagandena med utfall" saknas eftersom
  hennes ingång (`noIdea`) aldrig gick igenom en idégenomlysning.
- **Jonas (4 håller, 3 tunt, 2 saknas):** **Kunden och problemet** och
  **Konkurrensen** saknas helt — `RegistryProvider`/`OutreachProvider`/
  `VerdictProvider` är Sara-hårdkodade, så ingen kundprofil, inga
  namngivna konkurrenter och inga domsciterade kundsvar finns för honom.
  **Marknaden**, **Erbjudandet och priset** och **Beviset** är tunt
  underlag: Marknaden saknar täckningen (`basis`) eftersom han bara har
  idégenomlysningens tre registerfakta, inte en full `MarketOverview`;
  Erbjudandet saknar valideringen mot steg 05 (ingen `VerdictReport`);
  Beviset saknar en sourced domen-rad (hans steg 6-beats `verdict`-fält
  hittade ingen matchande delkälla vid det slutgiltiga beatet — se "Beslut
  nästa session" nedan). **Affärsidén**, **Genomförandet**, **Ekonomin**
  och **Riskerna** håller — byggda av data han faktiskt har (hans
  idégenomlysning, hans egna 12 stegs highlights och poängbevis).
  Exakt det avsiktliga "full av luckor, inte trasigt"-utfallet uppdraget
  bad om.

### Beslut nästa session behöver känna till
- **`RegistryProvider` och `ProjectRepository.getIdeaScreening` saknar
  fortfarande en egen `entry`-vakt** — `adapters/demo/businessPlan.ts`
  garderar anropen utifrån, men adaptrarna själva är oförändrade. En
  framtida session som bygger vidare på någon av dem bör lägga vakten där
  också, inte bara vid det här anropsstället.
- **Jonas steg 6-beats `verdict`-fält gav ingen sourced rad i Beviset**
  vid hans SISTA beat (kontrollerat manuellt: `steps[6]?.verdict` fanns,
  men källuppslagningen mot `problem`/`willingnessToPay`-delarna gav ingen
  träff vid det läget) — inte felsökt vidare, flaggat i stället som en
  legitim, mekaniskt uppkommen lucka (samma "hitta inte på" -princip som
  resten av funktionen). Om en framtida session vill täta den, börja med
  att logga `partSourcesFrom`s resultat vid Jonas sista beat.
- **`BUSINESS_PLAN_SECTION_ORDER`/`BusinessPlanSectionId`** i
  `core/businessPlan.ts` är den enda källan till avsnittens ordning och
  identiteter — lägg till ett nytt avsnitt där, inte bara i
  `adapters/demo/businessPlan.ts` eller i18n.
- **`Eyebrow`s nya `tone="warning"`** är avsedd att återanvändas för
  framtida motsägelse-/varningsmarkeringar — stapla aldrig en egen
  textfärgsklass ovanpå en annan `tone`, se DESIGN.md om CSS-källordning.

### Kända problem / medvetna begränsningar
- Inga nya utöver den redan flaggade `RegistryProvider`/
  `ProjectRepository`-luckan ovan (som är en förutsättning för resultatet,
  inte en bugg i den här sessionens kod).
