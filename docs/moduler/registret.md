# Modul: Registret

## Syfte

Den del av Datalöftet som gör Spark annorlunda (uppdrag avsnitt 1.1, 1.2):
riktiga siffror ur svensk offentlig företagsdata, inte gissningar. Används i
**03 Marknaden** (registerbild: antal företag, storleksfördelning,
medianomsättning, tillväxt, geografi, konkurrenter) och **04 Kunden**
(namngiven kundlista ur registret, filtrerad på SNI-kod och storlek). Ligger
till grund för Kunder-sidan (Utskick och svar, `docs/moduler/utskick-och-svar.md`,
som återanvänder samma bolagslista) och för Simuleringslagret (Hiasynth,
`docs/moduler/simuleringar.md`), som bygger sina syntetiska populationer ovanpå
registret men aldrig ersätter det.

## Porten

`ports/RegistryProvider.ts`:

```ts
searchCompanies(query: RegistryQuery): Promise<RegistryCompany[]>
getMarketOverview(locale: Locale): Promise<MarketOverview>
```

- `RegistryQuery`: `{ sniCode: string; minEmployees?: number; maxEmployees?: number }`.
- `RegistryCompany`: `{ name, sniCode, employees, revenueKsek, county }` — en rad i
  kundlistan (04).
- `Competitor`: `{ name, description }`.
- `MarketOverview`: `{ companyCount, medianRevenueKsek, growthSharePercent,
  regionSharePercent, source: Källa, competitors: Competitor[] }` — registerbilden
  för `/app/marknad` (03).

`Källa` (`core/domain.ts` → `types/evidence.ts`): `{ namn, hämtad, url? }` —
obligatorisk på `MarketOverview`, Datalöftets krav.

## Datakällor och vad som krävs

- **Bolagsverket:** företagsuppgifter — namn, org.nr, SNI-kod, bolagsform,
  registreringsdatum. Ger underlaget för `searchCompanies` (namngivna bolag).
- **SCB (Statistiska centralbyrån):** branschstatistik — antal företag,
  omsättnings- och anställningsfördelning per SNI-kod och län. Ger underlaget
  för `getMarketOverview`s aggregat (`companyCount`, `medianRevenueKsek`,
  `growthSharePercent`, `regionSharePercent`).
- **Blockeraren är avtal, inte kod.** Båda källorna kräver ett dataavtal
  eller en licens innan liveadaptern kan byggas — se `docs/uppdrag.md`
  avsnitt 14.3 ("stub tills dataavtal finns"). `.env.example` har därför
  **ingen** Registret-variabel än; uppfinn inget variabelnamn i förväg
  (samma regel som gäller Supabase, se `.env.example`s kommentar).
- **TODO (avtal, inte sakgranskning):** vilken av källorna som ger
  `searchCompanies` (namngivna bolag, sannolikt Bolagsverkets öppna data
  eller en tredjepartstjänst ovanpå den) respektive `getMarketOverview`
  (SCB:s öppna statistik-API kan räcka på egen hand för aggregaten) bör
  klargöras när avtalssamtalen börjar — de kan mycket väl bli två separata
  integrationer bakom samma port. Kostnadsmodell (per anrop, per abonnemang)
  okänd i dag.
- Hämtningsdatum (`Källa.hämtad`) ska alltid vara det faktiska anropsdatumet
  när liveadaptern byggs, aldrig ett hårdkodat värde (se demoadaptern nedan
  för hur det görs medvetet fel i demot, där det är avsiktligt statiskt).

## Hur demoadaptern fungerar i dag

`adapters/demo/RegistryProvider.ts`:

- `saraCompanies`: 20 fiktiva redovisningsbyråer, alla SNI 69.201, 5–19
  anställda, omsättning 3 000–12 500 ksek, spridda över svenska län —
  representerar de "40 snabbast växande" ur 9.3 steg 04 (ett urval på 20
  visas, resten summeras bara i registerstatistiken).
  **Den här listan återanvänds rakt av av `adapters/demo/OutreachProvider.ts`**
  (`getCampaign`) — en ändring här slår igenom i kundlistan för steg 05–06 med.
- `searchCompanies(query)` filtrerar `saraCompanies` synkront: exakt
  `sniCode`-match, plus valfria `minEmployees`/`maxEmployees`-gränser.
- `getMarketOverview(locale)` returnerar fasta tal (312 bolag, median
  4 200 ksek, 18 % tillväxtandel, 31 % regionandel) och en `Källa` — "Bolagsverket
  och SCB" (sv) / "Bolagsverket and Statistics Sweden (SCB)" (en), hämtad
  "2026-01-09" — plus tre **fiktiva** konkurrenter per språk (`Kvittly`,
  `ByråFlöde`, `Underlagshjälpen`, alla explicit märkta "(fiktivt)"/"(fictional)"
  i beskrivningen, uppdrag 2.5: verkliga bolagsnamn med påhittade siffror
  används aldrig i demot).

## Acceptanskriterier

- `searchCompanies(query)` returnerar bara bolag vars `sniCode` matchar
  exakt, och som ligger inom ett angivet `minEmployees`/`maxEmployees`-intervall.
- En sökning utan träffar ger `[]`, aldrig ett kastat fel eller en påhittad rad.
- `getMarketOverview(locale)` har alltid en ifylld `source.namn` och
  `source.hämtad` — inget aggregat utan källa (Datalöftet).
- Liveadaptern returnerar **aldrig** ett fiktivt bolagsnamn eller en
  konkurrent märkt "(fiktivt)"/"(fictional)" — den etiketten är exklusiv för
  demot (uppdrag 2.5).
- Klarar kontraktstestet i `ports/RegistryProvider.contract.test.ts`.

## Säkerhet

Inga hemliga nycklar finns för den här modulen i dag (avtal saknas — se
ovan); när ett avtal ger en API-nyckel eller inloggningsuppgift gäller
samma regel som alla andra moduler: bara i serverkod, aldrig
`NEXT_PUBLIC_`-prefix. Sökfrågan (`RegistryQuery`) är begränsad till
strukturerad indata (SNI-kod, siffror) — inget fritextfält går vidare till
en extern källa okontrollerat. Ingen Supabase-koppling för själva
registerdatan (den är offentlig, inte användarspecifik); om liveadaptern
cachar resultat i Supabase för att spara anrop gäller RLS som för alla
andra tabeller.

## Status

stub — `adapters/live/RegistryProvider.ts` kastar `NotImplementedError` för
båda metoderna. Blockerad på dataavtal med Bolagsverket och/eller SCB, inte
på kod. Demoadaptern är klar och används av `/demo/app/marknad` och
`/demo/app/kunder` (via Utskick och svar). Bygg enligt
`docs/bygga-en-modul.md` när avtalet finns.
