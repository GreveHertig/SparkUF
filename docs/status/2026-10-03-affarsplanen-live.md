## Affärsplanen med riktig data och ny design (gren `modul/affarsplan-live`, 2026-10-03)

### Klart
- **`/app/affarsplan` visar riktig data.** Ny hopsamlare `adapters/live/businessPlan.ts` (`getLiveBusinessPlan`), samma roll som `adapters/demo/businessPlan.ts` i demot. Underlaget är bara tre saker:
  - projektet (`projects`) → Affärsidén, märkt "Din uppgift" med dagen projektet skapades
  - onboardingsvaren (`customer`, `payer`, `frustration`) → Kunden och problemet, märkta "Din uppgift" med dagen svaret gavs. "Vet inte än" blir inget påstående.
  - bevisen (`evidence`) → avsnittet för sin sort, med sin egen källa och sitt datum. Bara bevis som räknas just nu (`counted`, `capped`, `noPoints`): återkallade och för gamla tas aldrig med. Citatet är påståendet när det finns, sortens namn står bredvid. Ett bevis grundaren själv lagt in om en tredje part märks "Din uppgift".
- Avsnitt → bevissort → steg: Marknaden (`registerMarketCount`, `registerMarketRevenue`, steg 3), Konkurrensen (`registerCompetitorSet`, steg 4, kravet för steget), Erbjudandet och priset (`priceDecided` steg 7, `customerPrice*` steg 5), Genomförandet (`productScopeFromEvidence` 8, `productPublished` 10, `payingCustomer`/`activeUser` 11), Ekonomin (`priceDecided` 7, `fundingApplied` 12), Riskerna (motsägande kundbevis, steg 5, plus de låsta poängdelarna ur `calculateScore`).
- Utan projekt sätts planen ändå samman: onboardingsvaren kan bära Kunden och problemet och resten blir luckor. De låsta delarna räknas då av `calculateScore` i fasen "discover".
- **Ny design** (`screens/BusinessPlan.tsx`, delad av `/demo` och `/app`): översikt med statusstapel och länk per avsnitt, kort med steget som stärker planen mest (`nextPlanStep`, ny ren funktion i `core/businessPlan.ts`), siffervärden som nyckeltal, luckor som en streckad rad med stegets namn och en länk när steget är det aktuella, lugnare yta för avsnitt som helt saknas, låsta delar som en lista, och "Spara som PDF" (webbläsarens utskrift med egen utskriftsstil). Se `DESIGN.md`.
- **Buggfix:** avsnittens behållare hette `.fdd-plan`, samma klass som Min plan i Resan längre ner i `design/site.css`, som tog över layouten (planen låg i en kolumn). Nu `.fdd-bplan`.
- Tester: `adapters/live/businessPlan.test.ts` (ny, mot `makeSupabaseFake`), `core/businessPlan.test.ts` (`nextPlanStep`), `screens/BusinessPlan.test.tsx` (översikt, nyckeltal, nästa steg), `app/(app)/app/affarsplan/page.test.tsx` (omskriven: plan, platshållarfel, äkta fel), `app/demo/demo.test.tsx` (räknar nyckeltalen som påståenden). Typecheck, lint, alla tester och build gröna.

### Återstår
- **Beviset** (steg 6) är alltid en lucka tills `VerdictProvider` har en liveadapter. Samma för idégenomlysningens antaganden (`ProjectRepository.getIdeaScreening`) och byggspecen (`BuildProvider.getSpec`).
- **Registerbevisen skrivs inte än** av någon modul (Marknad läser registret men sparar inget bevis), så Marknaden och Konkurrensen fylls först när det byggs.
- Motsägelsen pris mot pris (grundarens beslutade pris mot kundernas nej) visas inte som ett par sida vid sida. Kundens nej syns i Erbjudandet och priset och i Riskerna. Att para dem kräver att priset läses ur citatet, vilket inte görs.
- En "Ny"-markering för avsnitt som fyllts sedan sist (kräver att något sparar vad grundaren sett).
- Den nya designen är inte kontrollerad i en riktig webbläsare i den här sessionen (sandlådan kunde inte ladda ner Chromium). Titta på Vercels förhandsvisning av PR:en.

### Kända problem
- Inga nya.

### Beslut
- Stegens höjdpunkter (`journey_steps.highlights`) används aldrig i `/app`-planen: de saknar källa i porten, och ett påstående lånar aldrig en källa.
- Nästa-steg-kortet visar ingen siffra (inget "fyller 3 avsnitt"), bara avsnittens namn, så att undantaget för uträknade siffror i `CLAUDE.md` inte behöver utökas.
