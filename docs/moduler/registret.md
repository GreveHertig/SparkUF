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
- **Uppdaterat efter dataspiken (2026-09-18, se `docs/dataspiken.md`):**
  Bolagsverkets och SCB:s "API för värdefulla datamängder" är gratis och
  kräver inget avtal, bara en kundanmälan (**inte skickad än**). Blockeraren är alltså godkännandet plus att Bolagsverkets
  användarvillkor läses (de gick inte att läsa under spiken), inte ett
  avtal. Rekommenderad MVP-källa är den här, inte Allabolag/UC eller
  Ratsit. Stycket nedan är kvar som historik.
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

## Licensgrind (villkor för exponering)

**Villkor:** RegistryProvider (liveadaptern) får inte visas för eller användas
av någon utanför Erik och Theodor (t.ex. demo för lärare, investerare eller
andra UF-företag) förrän licensfrågan om namngivna aktiebolag är uppgraderad
från **Sekundärt** till **Verifierat** i `docs/dataspiken.md` (§6 fråga 1),
dvs. tills en människa faktiskt läst Bolagsverkets egna villkor om
återanvändning/visning av namngiven data. API-åtkomstsidan ("inget avtal,
avgiftsfritt") är redan verifierad men säger ingenting om visning eller
lagring av namngivna företag. Internt utvecklingsarbete och tester är okej.

**Licensvillkoret är uppfyllt 2026-09-23.** Erik läste Bolagsverkets text
"Användning av värdefulla data" och den är ordagrant citerad i
`docs/dataspiken.md` avsnitt 2 och §6 fråga 1 (Verifierat). Grinden i koden är
**fortfarande stängd**: den lyfts bara när Erik själv väljer det, och då med
§6 fråga 4 i åtanke. Transporten (`lib/server/scb.ts`, `bolagsverket.ts`) är
dessutom oskriven, och SCB:s företagsregister-API har egna villkor som inte
täcks av Bolagsverkets text.

**Mekanism (fyra lager, inget ensamt tillräckligt):**
1. Ingen liveyta: ingen `/app/marknad`-route finns, `screens/` och routes rörs inte. Demon använder fiktiv data.
2. `lib/server/registryAccess.ts`: kräver både `REGISTRY_LIVE_ENABLED=true` och att inloggad `user.id` finns i `REGISTRY_ALLOWED_USER_IDS`. Avstängd som standard. Anropas som första sats i båda portmetoderna. Nekat ger `RegistryLockedError` (visas som `ComingSoon`) innan något externt anrop görs.
3. CI-vakt i `ports/stubStatus.test.ts` (blocket "Licensvakt: Registret nekar utan öppen grind"): testerna blir röda om grinden tas bort eller försvagas.
4. Ingen lagring: inget skrivs till `public.companies` förrän licensen är Verifierat.

**Så lyfts grinden:** en människa läser Bolagsverkets villkor, `docs/dataspiken.md`
§6 fråga 1 ändras till Verifierat i en commit som också uppdaterar det här
avsnittet, och först därefter får `REGISTRY_ALLOWED_USER_IDS` utökas eller
grinden tas bort. Reglerna för enskilda firmor/reklamspärr (§6 fråga 4,
Juridisk koll + vuxen/handledare) är en separat, fortfarande öppen fråga.

## Säkerhet

**Regler för framtiden (security-review 2026-09-19):**
- `competitors[].name/description` är extern text, rensad men inte neutraliserad. Om Gemini/Tavily någon gång får läsa dem: lägg dem i ett avgränsat databloc, säg i systemprompten att de är opålitliga, och aktivera inga verktygsanrop utifrån dem.
- När transporterna skrivs: (a) de ska själva anropa `assertRegistryAccessAllowed()` eller bara importeras av `adapters/live/RegistryProvider.ts` (lägg en `no-restricted-imports`-regel), så en framtida route inte kan gå förbi grinden; (b) bas-URL bara från miljövariabel, aldrig från indata (SSRF); (c) timeout, paginering och throttle per användare (SCB: 2 000 rader/anrop, 10 anrop/10 s) — `getMarketOverview` utan `sniCode` hämtar hela registret; (d) logga aldrig `RegistryTransportError.cause` (ZodError kan innehålla registervärden), bara `issues[].path` och `code`.
- `REGISTRY_LIVE_ENABLED` måste vara exakt `true` (`1`/`TRUE` nekas, avsiktligt).
- Bolagsnamn kan innehålla personnamn. Aktiebolag är juridiska personer och reklamspärr respekteras, men det är en GDPR-nyans att ta upp med Juridisk koll (§6 fråga 4).

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

**påbörjad — grindad, transporten oskriven.** `adapters/live/RegistryProvider.ts`
är byggd: grind, indatavalidering, aktiebolag utan reklamspärr, källstämpling
och ärlighet kring luckor. Men `lib/server/scb.ts` och `lib/server/bolagsverket.ts`
kastar `RegistryTransportError` (inga nycklar, ingen API-spec, kundanmälan är
inte skickad). Kontraktstestet är grönt **mot mockad transport i en ANTAGEN
svarsform** (`lib/server/registrySchemas.ts`): det bevisar vår logik, inte att
Bolagsverket/SCB ser ut så. **Exponering är spärrad**, se "Licensgrind".
Demoadaptern är klar och används av `/demo/app/marknad` och
`/demo/app/kunder` (via Utskick och svar).

## Hur liveadaptern fungerar i dag

- **Första satsen** i båda metoderna: `assertRegistryAccessAllowed()`.
- **`searchCompanies`:** validerar SNI (`12.345`-form) och anställdagränser före
  allt annat. Hämtar rader, behåller bara aktiebolag, aktiva, utan reklamspärr,
  med exakt SNI-match och känt antal anställda inom intervallet (max 50), hämtar
  omsättning per bolag och **utelämnar** bolag utan känd omsättning (aldrig 0).
  Okänt län ger `""`. Inga träffar ger `[]`.
- **`getMarketOverview(locale, sniCode?)`:** `companyCount` över aktiva bolag,
  `regionSharePercent` = andel bolag i Stockholms län (som UI-etiketten lovar) av
  bolag med känt län, `growthSharePercent` = andel med omsättning >10 % över
  föregående år, median och tillväxt över ett deterministiskt urval (sorterat på
  orgNr, max 100) aktiebolag med digital årsredovisning, konkurrenter (bara när
  `sniCode` anges, annars `[]`) = de fem största namngivbara bolagen med verksamhetsbeskrivning
  (rensad, kortad till 200 tecken, aldrig instruktion). `source.hämtad` är
  anropsdagen. **`basis`** anger antal bolag bakom varje siffra; `0` betyder
  okänt och siffran får inte visas.
- **Porten ändrades i två avseenden** (beslutat 2026-09-19): valfritt `basis`
  på `MarketOverview` (D3) och valfri andra parameter `sniCode` på
  `getMarketOverview` (nytt beslut: porten saknade branschangivelse, så
  liveadaptern visste inte vad den skulle sammanfatta; utan `sniCode` gäller
  sammanfattningen hela registret). Båda valfria, så demo, skärmar och
  kontraktstest är oförändrade.
- Fel: `RegistryLockedError` (grind, visas som `ComingSoon`),
  `RegistryInputError` (ogiltig indata), `RegistryTransportError` (transport
  eller oväntat svar). Ingen ärver `NotImplementedError`.

## Kvar innan modulen är klar

0. **Senare session:** koppla `sniCode` automatiskt till projektets bransch (beslutat 2026-09-19 att lämna den valfri tills dess).

1. Spik med riktiga nycklar (`docs/dataspiken.md` §3): kan man söka på SNI, vilka
   iXBRL-taggar finns, går län att härleda, vad säger villkoren om lagring.
2. Skriv transporten och skriv om `lib/server/registrySchemas.ts` mot det
   verkliga svaret; byt `RegistryProvider.live.test.ts` mot riktiga anrop.
   Respektera SCB:s gränser (2 000 rader/anrop, 10 anrop/10 s). Adaptern kastar `RegistryTransportError` om ett svar når 2 000 rader (troligen avkortat) tills paginering finns.
3. ~~Läs Bolagsverkets villkor (Verifierat)~~ klart 2026-09-23. Kvar: Erik beslutar om och när licensgrinden lyfts.
4. Portens `employees`/`revenueKsek` är icke-nullbara, så bolag med okänt värde
   utelämnas i dag. Överväg nullbara fält när en skärm ska visa dem.
5. Enskilda firmor/reklamspärr med Juridisk koll + vuxen/handledare
   (`docs/dataspiken.md` §6 fråga 4).
