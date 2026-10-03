## Session — Fem sidor gjorda ingångsmedvetna: Pulsen, Kunder, Marknad, Bygg, Juridik (klar, gren `prototyp`)

Uppdrag: grundaren bekräftade att Pulsen, Kunder, Marknad, Bygg och Juridik
fortfarande visade Saras data i ingång B (Jonas), flaggat men lämnat utanför
scope i "Session — Jonas hela resan". Uppdraget: hitta orsaken, gör alla fem
ingångsmedvetna, och där Jonas saknar data — hitta inte på något, visa ett
ärligt tomt läge. Rör inte `adapters/live/` eller poängmotorn.

### Orsak
Fem demoadaptrar läste aldrig `entry` ur `useDemoStore` — de returnerade
alltid Saras hårdkodade data (`adapters/demo/PulseProvider.ts`,
`OutreachProvider.ts`, `RegistryProvider.ts`, `BuildProvider.ts`,
`LegalAdvisor.ts`), och två routefiler (`marknad/`, `kunder/page.tsx`)
räknade aktuellt steg via `getCurrentStepNumberFor` importerad direkt från
`sara.ts` i stället för demomotorns entry-medvetna variant. Redan
dokumenterat i "Session — Jonas hela resan" som en medveten avgränsning, inte
en ny bugg.

### Klart
- **Fyra adaptrar** (`OutreachProvider.getCampaign`, `LegalAdvisor.getLegalMap`,
  `BuildProvider.getSpec`/`getStatus`, `PulseProvider.getSignals`) läser nu
  `entry` och returnerar `[]`/`null`/`"not_started"` för Jonas — porttyperna
  tillåter ett tomt svar här, så ändringen ligger helt i adaptern, Sara
  oförändrad.
- **`PulseProvider.getTodaysSignal`** och **`RegistryProvider.getMarketOverview`**
  tillåter INTE ett tomt/null-svar i porten (delas med liveadaptern, som inte
  fick röras) — de anropas i stället aldrig för Jonas: `app/demo/app/page.tsx`
  hoppar över `getTodaysSignal`-anropet och sätter `pulse: null`,
  `marknad/page.tsx` hoppar över hela `Promise.all`-blocket. `AppHomeData.pulse`
  (`screens/AppHome.tsx`) är nu `PulseSignal | null`.
- **Ärligt tomt läge, skilt från "låst":** ny i18n-nyckel
  `homePage.notInThisScenario` ("Det här steget är inte genomfört i det här
  scenariot") — skild från `unlocksAfterStepBefore`, som antyder att
  innehållet kommer senare (fel intryck för Jonas, eftersom det aldrig
  kommer). `screens/Market.tsx`, `Customers.tsx`, `Build.tsx`, `Legal.tsx`
  fick en ny `notInScenario?: boolean`-prop som väljer rätt text i den redan
  befintliga `LockedState`. `pulsePage.emptyState`s text skrevs om (tog bort
  "de dyker upp när resan kommer igång", som bara stämde för Sara).
- **`marknad/page.tsx` och `kunder/page.tsx`** läser nu `entry` och byter
  `getCurrentStepNumberFor` (sara.ts) mot den entry-medvetna
  `getCurrentStepNumber()` (`demoStore.ts`). Båda slutar också anropa
  `demoSimulationProvider` för Jonas — de tre kanoniska simuleringarna
  (`time`/`tolerance`/`price`) är skrivna mot Saras byråer/kvitton
  (`adapters/demo/SimulationProvider.ts`s egen header) och hade annars läckt
  Saras siffror på Jonas sidor även efter huvudfixet.
- **Ingen ny Jonas-data uppfanns.** `adapters/demo/jonas.ts` har löptext om
  marknaden (412 padelhallsbolag m.m.) och juridik (enskild firma, samma
  bolagsform som Sara) men ingen strukturerad `RegistryCompany`/`CampaignRow`/
  `ByggBrief`-data och ingen Kvittojakten-fri juridisk karta — att pressa in
  den löptexten i de formaten hade krävt påhittade fält (t.ex.
  `medianRevenueKsek`, namngivna hallar). Alla fem sidor visar därför ett
  ärligt tomt läge för Jonas, inte påhittat innehåll.
- **Nya tester i `adapters/demo/entrySwitch.test.ts`:** fyra nya `it`-block
  bevisar att `OutreachProvider`/`LegalAdvisor`/`BuildProvider`/`PulseProvider`
  ger Saras data i ingång A och ett tomt svar i ingång B, via de riktiga
  adaptrarna (inte bara mot `jonas.ts` isolerat) — samma mönster som filens
  befintliga tester.
- Verifierat: `pnpm typecheck`/`lint`/`test` (213 tester totalt: 209 gröna +
  35 förväntat skippade, fyra nya gröna) och `pnpm build` går igenom utan
  fel. `pnpm start` + `curl` mot `/`, `/demo`, `/demo/app` och alla fem
  ändrade routes: 200/307 som väntat. Ingen webbläsarverifiering av att
  Jonas faktiskt ser tomma-läge-texten på skärm (inget webbläsarverktyg
  anslutet) — bekräftat i stället via `entrySwitch.test.ts` mot de riktiga
  adaptrarna och `curl` mot den statiska routen.

### Beslut nästa session behöver känna till
- **`homePage.notInThisScenario`** är den nya, generella nyckeln för "den
  här personan har inget byggt innehåll här" — återanvänd den i stället för
  att skriva en ny variant, om fler moduler görs ingångsmedvetna med samma
  mönster.
- **Om Jonas någon gång får riktigt innehåll i dessa fem moduler:** bygg
  strukturerad data i en ny `jonas`-specifik sektion (motsvarande
  `saraCompanies`/Sara-specen) och ta bort `entry === "hasIdea"`-grenarna i
  respektive adapter — rör inte `RegistryProvider.getMarketOverview`s
  Sara-gren, den ska fortsätta gälla oförändrad för ingång A.
- **`RegistryProvider.searchCompanies`** rördes inte — anropas inte av någon
  skärm/route i dag (bara kontraktstestet), så ingen ingångsmedvetenhet
  behövdes där.

### Kända problem / medvetna begränsningar
- Ingen webbläsarverifiering den här sessionen (se ovan).
- De fem modulerna visar nu korrekt ett tomt läge för Jonas, men har
  fortfarande inget riktigt innehåll för honom — om grundaren vill att Jonas
  demo ska kännas lika fullständig som Saras, är nästa steg att skriva den
  strukturerade datan (se "Beslut nästa session" ovan), inte att öppna
  portarnas typer.
