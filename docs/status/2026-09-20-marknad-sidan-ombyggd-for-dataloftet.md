## Marknad-sidan ombyggd för Datalöftet (klar, gren `prototyp`)

Uppdrag (`docs/beslut.md`, sist i "Nästa sessioner, i ordning"): bygg om
Marknad-sidan i demoläget så att den bevisar Datalöftet (uppdrag 1.2) i
praktiken, inte bara beskriver det — den sida Emma (Hiasynths grundare) får
se. Struktur: en KPI-rad, ett "Datalagret"-kort, ett storleksfördelnings-
diagram och ett utskicks-/svarsfrekvenskort. Bara demoläget och demoadaptern
fick röras — inte `ports/`, `adapters/live/` eller `lib/server/`.

### Klart
- **`screens/Market.tsx` omskriven** till fyra sektioner i uppdragets ordning
  (`market-kpi`, `market-datalayers`, `market-distribution`,
  `market-outreach`), plus de två befintliga sektionerna (`market-competitors`,
  `market-simulation`) kvar oförändrade längst ner — inget innehåll togs bort,
  bara omstrukturerat och kompletterat.
- **KPI-raden** återanvänder `KpiTile`/`KpiRow` (byggda i designuppdateringen)
  i stället för den gamla `DataFact`-rutnätet. `KpiTile` fick en ny valfri
  `description`-prop (bakåtkompatibel, används redan av Hem/Poäng utan ändrad
  rendering) för den korta förklarande meningen varje kort kräver.
- **"Baserat på N av M bolag" på riktigt:** `MarketOverview.basis` fanns redan
  som ett valfritt fält i porten (Registret-modulsessionen) men demoadaptern
  satte det aldrig. `adapters/demo/RegistryProvider.ts` sätter nu
  `basis: { medianRevenueCompanies: 194, growthCompanies: 171,
  regionCompanies: 308 }` (av 312 totalt) — mediansiffran, tillväxtandelen och
  regionandelen visar nu alla sitt urval i klartext, aldrig ett tal som
  låtsas gälla hela registret. **Ingen porttyp ändrades** — fältet var redan
  där, bara ifyllt.
- **"Datalagret"-kortet** (nytt): tre rader — Register, Årsredovisning,
  Simulering — var och en med en kort not och en klickbar `SourceTag` (källa +
  hämtdatum). Byggt helt av redan tillgänglig data (`overview.source`,
  `simulation.source`), ingen ny porttyp.
- **Storleksfördelningen** (ny `components/ui/BarChart.tsx`, samma
  "ingen-dependency"-princip som `Sparkline`): bucketar Saras 20 byråer i
  fem SCB-liknande storleksklasser (1–4/5–9/10–19/20–49/50+ anställda) och
  visar **aldrig ett exakt anställningstal** (docs/dataspiken.md: "SCB ger
  klasser, inte siffror") — bara klassnamn och antal bolag per klass.
  SNI-koden läses av det första bolaget i urvalet (`RegistryCompany.sniCode`),
  inte hårdkodad i sidan. Insiktsmeningen ("Vanligast i urvalet: …") räknas
  fram från den faktiska bucketräkningen, inte skriven för hand. Källchip
  och "baserat på 20 av 312 bolag" under diagrammet.
  - **Avvikelse från uppdraget, flaggas:** uppdraget bad om Recharts, men
    "inga nya beroenden" var också ett hårt krav och Recharts är inte
    installerat i den här kodbasen (bekräftat i Tokenbyte-sessionen ovan).
    Byggde i stället en minimal inline-SVG-fri (ren HTML/CSS) stapelgraf,
    samma princip som `Sparkline`. Färgerna kommer uteslutande från tokens
    (`var(--accent-600)`/`var(--slate-100)`). Om Recharts verkligen ska in,
    är det ett eget beroendebeslut för en framtida session, inte något som
    smögs in här.
- **Utskick och svarsfrekvens-kortet** (nytt): läser `OutreachProvider.
  getCampaign` (samma port Kunder-sidan redan använder) och räknar kontaktade
  (alla utom `draft`), svarat och svarsfrekvens. **`CampaignRow` bär ingen
  egen källa** (porten är oförändrad), så en ny demo-bara `outreachSource`
  (`adapters/demo/OutreachProvider.ts`, Källa "Sparks utskick (Gmail)",
  2026-01-19 — samma datum som 05a:s "efter" i `sara.ts`) skickas med via
  skärmens `MarketData`-typ i stället. **Tre ärliga lägen**, inget påhittat:
  ingen kontaktlista byggd än (före steg 04), kontaktlistan klar men inget
  skickat än (alla rader `draft`), och de faktiska siffrorna när utskicket är
  igång. Inga kontaktuppgifter visas (`CampaignRow` har inga — porten gav
  redan inga, oförändrat).
- **`adapters/demo/tourSteps.ts`:** stoppet "dataloftet" (route
  `/demo/app/marknad`) pekade på `target: "market-register"`, som inte längre
  finns — uppdaterat till `"market-kpi"`. De två andra Marknad-stoppen
  (`market-competitors`, `market-simulation`) är oförändrade sektioner, ingen
  uppdatering behövdes där.
- **i18n:** `marketPage` utökad i `dictionary.ts`/`sv.ts`/`en.ts` med
  `dataLayers`, `distribution` (inkl. storleksklassernas etiketter) och
  `outreach`, plus `basedOnLabel`/`ofLabel`/`companiesUnit` för den
  återanvändbara "Baserat på N av M bolag"-meningen. Ingen ny hårdkodad text
  i komponenterna.
- **`screens/Market.test.tsx`** (ny): nio tester — låst läge, Jonas-tomläge,
  urvalstexterna på alla tre KPI:er, Datalagrets tre källor, bucketräkningen
  (bevisar att ett enskilt bolags exakta antal, t.ex. "7 anställda", aldrig
  syns), konkurrenter/simulering oförändrade, och utskickets tre lägen.
- Verifierat: `pnpm typecheck`/`lint`/`test` (261 gröna, 31 skippade som
  väntat — 9 nya tester, alla gröna) och `pnpm build` gröna. `pnpm start` +
  `curl` mot `/demo/app/marknad`: 200.

### Beslut nästa session behöver känna till
- **`overview.basis`-siffrorna (194/171/308 av 312) är påhittade men
  interna konsistenta** — samma mönster som resten av Saras scenario (t.ex.
  registerbilden i `RegistryProvider.ts` sedan tidigare). Justera dem fritt
  om grundaren vill ha andra tal, men håll `medianRevenueCompanies ≤
  growthCompanies` inte nödvändig — de mäter olika saker (tillväxt kräver två
  års iXBRL, se `docs/dataspiken.md` §2).
- **Recharts-avvikelsen ovan** — om grundaren verkligen vill ha Recharts
  specifikt (t.ex. för interaktiva tooltips), är det ett nytt beroendebeslut,
  inte en efterhandsjustering av `BarChart.tsx`.
- **`KpiTile.description`** är nu tillgänglig för alla sidor som använder
  `KpiTile` (Hem, Poäng, Marknad) — återanvänd den i stället för att bygga en
  egen textrad, om fler kort behöver en förklarande mening.
- **`SARA_MARKET_SNI_CODE`** (`adapters/demo/RegistryProvider.ts`) är den
  enda platsen "69.201" definieras för Saras scenario utanför
  `saraCompanies` själva — importera den, skriv inte om strängen.

### Kända problem / medvetna begränsningar
- **Ingen manuell webbläsarverifiering.** Inget webbläsarverktyg var anslutet
  den här sessionen (samma återkommande begränsning som flera tidigare
  sessioner, se t.ex. Tokenbyte ovan) — verifierat med `typecheck`/`lint`/
  `test`/`build` och `curl` (200), samt nio komponenttester som faktiskt
  renderar skärmen med jsdom och läser av texten. Gör en klickgenomgång
  (båda språken) av `/demo/app/marknad` i nästa session som har en
  webbläsare tillgänglig — särskilt stapeldiagrammets layout på mobilbredd.
- **Kunder-sidans tabell visar fortfarande exakta anställningstal**
  (`row.employees`, nu i `screens/Validation.tsx`) — samma dataspik-krav
  ("aldrig exakta tal") gäller där också, men det var utanför den här
  sessionens uppgift (bara Marknad-sidan). Flaggat, inte åtgärdat. Gäller
  fortfarande efter Validering-sammanslagningen nedan.
- Recharts-avvikelsen (se ovan) — dokumenterad, inte en tyst avvikelse.
