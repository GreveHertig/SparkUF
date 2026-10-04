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
**fortfarande stängd för alla utom Erik och Theodor** (flagga + allowlist med
bara de två). Licensen räcker inte ensam för att öppna den.

**Full öppning kräver alla tre (Eriks beslut 2026-09-23):**
1. **Transporten är skriven**: `lib/server/scb.ts` och `lib/server/bolagsverket.ts`
   gör riktiga anrop och är provkörda.
   - **Bolagsverket: provkörd 2026-09-24.** Erik körde den riktiga
     `lookupOrganisation` och `fetchDocumentList` från sin dator mot Volvo,
     Ericsson och H&M. Alla sex anropen lyckades, och grinden gällde som i
     appen. Se "Provkörning 2026-09-24" nedan.
   - **SCB: skriven 2026-10-04, inte provkörd.** `lib/server/scb.ts` gör
     riktiga anrop (testad mot mockad fetch). Provkörningen görs av Erik med
     `adapters/live/RegistryProvider.live.test.ts`, se "Provkörning av SCB"
     nedan.
2. **SCB:s villkor är lästa** för företagsregister-API:t, efter 30 september
   2026, och citerade ordagrant i `docs/dataspiken.md` på samma sätt som
   Bolagsverkets.
3. **§6 fråga 4 är avgjord med handledare**: enskilda firmor, reklamspärr och
   GDPR, beslutet dokumenterat i `docs/dataspiken.md`.
   - **Theodor avgjorde den 2026-10-04** ("Beslut om §6 fråga 4" i
     `docs/dataspiken.md`). Handledarens bekräftelse återstår.

Först när alla tre är klara får `REGISTRY_ALLOWED_USER_IDS` utökas eller
grinden tas bort, i en commit som också uppdaterar det här avsnittet.

**Mekanism (fyra lager, inget ensamt tillräckligt):**
1. ~~Ingen liveyta~~ **Borta sedan PR 8 (2026-09-30), enligt `docs/plan-en-design.md`:** `/app/marknad` finns och anropar `liveRegistryProvider`. Rutten frågar grinden först och visar "Registret är inte öppet än" i varje registersektion när den är stängd; ingen cache runt registeranropen. Bevisas av `app/(app)/app/marknad/licensgrind.test.tsx` (riktig grind, riktig adapter, bara sessionen och transporterna utbytta). Demon använder fortfarande fiktiv data. Kvar är lager 2–4.
2. `lib/server/registryAccess.ts`: kräver både `REGISTRY_LIVE_ENABLED=true` och att inloggad `user.id` finns i `REGISTRY_ALLOWED_USER_IDS`. Avstängd som standard. Anropas som första sats i båda portmetoderna. Nekat ger `RegistryLockedError` (visas som `ComingSoon`, på `/app/marknad` som låsläget "Registret är inte öppet än") innan något externt anrop görs.
3. CI-vakt i `ports/stubStatus.test.ts` (blocket "Licensvakt: Registret nekar utan öppen grind"): testerna blir röda om grinden tas bort eller försvagas.
4. Ingen lagring: inget skrivs till `public.companies` förrän licensen är Verifierat.

**Så lyfts grinden:** se "Full öppning kräver alla tre" ovan. Licensdelen
(§6 fråga 1) är klar sedan 2026-09-23; de tre kraven där återstår.

## Säkerhet

**Regler för framtiden (security-review 2026-09-19):**
- `competitors[].name/description` är extern text, rensad men inte neutraliserad. Om Gemini/Tavily någon gång får läsa dem: lägg dem i ett avgränsat databloc, säg i systemprompten att de är opålitliga, och aktivera inga verktygsanrop utifrån dem.
- **Uppfyllt för Bolagsverket 2026-09-23:** (a) transporten anropar grinden själv, och lint-regeln `registryTransportPattern` i `eslint.config.mjs` låter bara liveadaptern och tester importera `bolagsverket`/`scb`; (b) bas-URL:en kommer bara från miljövariabeln och måste vara https mot `*.api.bolagsverket.se`; (c) timeout 10 s och minst 200 ms mellan anrop i processen (Bolagsverket skickar inga rate limit-headers, så det finns ingen throttle per användare); (d) felen bär aldrig `cause`, request-id eller svarstext. Org.nr med tredje siffran under 2 (personnummer) avvisas före anropet. Kvar för SCB:
- När transporterna skrivs: (a) de ska själva anropa `assertRegistryAccessAllowed()` eller bara importeras av `adapters/live/RegistryProvider.ts` (lägg en `no-restricted-imports`-regel), så en framtida route inte kan gå förbi grinden; (b) bas-URL bara från miljövariabel, aldrig från indata (SSRF); (c) timeout, paginering och throttle per nyckel (SCB AFR: limit 1 000 per sida och högst 5 anrop/s, rättat 2026-09-30, se "SCB AFR" nedan) — `getMarketOverview` utan `sniCode` hämtar hela registret och ska därför inte gå mot AFR; (d) logga aldrig `RegistryTransportError.cause` (ZodError kan innehålla registervärden), bara `issues[].path` och `code`.
- `REGISTRY_LIVE_ENABLED` måste vara exakt `true` (`1`/`TRUE` nekas, avsiktligt).
- Bolagsnamn kan innehålla personnamn. Aktiebolag är juridiska personer och reklamspärr respekteras, men det är en GDPR-nyans att ta upp med Juridisk koll (§6 fråga 4).

Inga hemliga nycklar finns för den här modulen i dag (avtal saknas — se
ovan); när ett avtal ger en API-nyckel eller inloggningsuppgift gäller
samma regel som alla andra moduler: bara i serverkod, aldrig
`NEXT_PUBLIC_`-prefix. Sökfrågan (`RegistryQuery`) är begränsad till
strukturerad indata (SNI-kod, siffror) — inget fritextfält går vidare till
en extern källa okontrollerat. Registerdatan är offentlig och inte
användarspecifik. Den cachas därför i en **gemensam** tabell,
`public.registry_cache`, som bara servern når med service role-nyckeln
(`lib/server/registryCache.ts`, beslut 2026-09-23). Tabellen har RLS på utan
policies och är stängd för alla klienter.

## Status

**byggd, grindad, väntar på provkörning (2026-10-04).** SCB-transporten
(`lib/server/scb.ts`) är skriven och inkopplad i liveadaptern tillsammans med
Bolagsverkets `lookupOrganisation`. Marknadsbilden och bolagslistan bygger på
riktiga svarsformer (`lib/server/registrySchemas.ts`, verifierade i spiken
2026-09-30). Kvar innan grinden öppnas: provkörning av SCB-delen (Erik), SCB:s
villkor citerade (Erik) och §6 fråga 4 avgjord (Theodor och handledare, se
`docs/registret-juridiskt-underlag.md`). Årsredovisningarna (omsättning och
tillväxt) är fortfarande inte byggda. Demoadaptern är oförändrad.

### Provkörning av SCB (för Erik)

Från din dator, med nycklarna i `.env.local` och grinden öppen för ditt
user.id:

```
REGISTRY_LIVE_SMOKE=1 REGISTRY_SMOKE_USER_ID=<ditt user.id> \
  node --env-file=.env.local node_modules/vitest/vitest.mjs run \
  adapters/live/RegistryProvider.live.test.ts
```

Valfritt `REGISTRY_SMOKE_SNI=62.100` för en annan bransch. Utskriften visar
bara antal, andelar, källa och tid, inga namn eller org.nr. Klistra in
utskriften i en statusfil; då är grindkrav 1 uppfyllt för SCB.

## Bolagsverket-transporten (`lib/server/bolagsverket.ts`)

- **`lookupOrganisation(orgNr)`**: `POST /organisationer`. Returnerar en platt
  `BolagsverketOrganisation` (namn, organisationsform, SNI-koder som fem
  siffror, registreringsdatum, verksam, avregistrerad, avveckling,
  reklamspärr, postnummer, ort, verksamhetsbeskrivning och `fetchedAt`). Okänt blir `null`, aldrig en
  gissning. **`advertisingBlock: null` betyder okänt**, inte "ingen spärr".
  Adaptern måste därför behandla `null` som att bolaget inte får visas tills
  frågan är utredd. Tom lista eller 404 ger `[]`.
- **`fetchDocumentList(orgNr)`**: `POST /dokumentlista`. Elementens form är
  overifierad, eftersom listan var tom för alla bolag i steg A.
- **`fetchAnnualFigures`** kastar fortfarande, eftersom `/dokument` och iXBRL
  är uppskjutna (inga nya beroenden).
- **Token:** OAuth 2 client credentials mot en fast token-URL, cachas i
  minnet tills 60 s före `expires_in`. Vid 401 hämtas en ny token och anropet
  görs om en gång.
- **Miljövariabler:** `BOLAGSVERKET_CLIENT_ID`, `BOLAGSVERKET_CLIENT_SECRET`
  och `BOLAGSVERKET_API_BASE_URL` (https mot `*.api.bolagsverket.se`).

### Provkörning 2026-09-24 (grindkrav 1, Bolagsverket-delen)

- **Hur:** en fristående bunt av den riktiga transporten
  (`scratchpad/bv-transport-prov.mjs`, gitignorerad), körd av Erik från sin
  dator. Codespacet når inte Bolagsverket. Grinden
  (`lib/server/registryAccess.ts`) var den riktiga. I bunten var bara
  `server-only` och inloggningen utbytta: den inloggade användaren var Eriks
  user.id från en miljövariabel. Id, secret och token maskades i utdata.
- **`lookupOrganisation`:** ett bolag per org.nr, alla fält mappade.

  | Bolag | Registreringsdatum | SNI | Postnummer, ort |
  |---|---|---|---|
  | Aktiebolaget Volvo (5560125790) | 1915-05-05 | 70100 | 40508 GÖTEBORG |
  | Telefonaktiebolaget LM Ericsson (5560160680) | 1918-08-19 | 70100, 62201 | 16483 STOCKHOLM |
  | H & M Hennes & Mauritz AB (5560427220) | 1943-08-07 | 70100 | 10638 STOCKHOLM |

  Alla tre: `legalForm` `AB`, `active: true`, inte avregistrerade, ingen
  avveckling, `advertisingBlock: null` (okänt) och en ifylld
  verksamhetsbeskrivning.
- **`fetchDocumentList`:** **tom lista för alla tre bolagen**, precis som i
  steg A. Elementens form är därför fortfarande overifierad. **Nästa steg är
  att prova med mindre aktiebolag** som har lämnat årsredovisningen
  digitalt. Det behövs innan `/dokument` och iXBRL byggs.

## SCB AFR (`lib/server/scb.ts`, skriven 2026-10-04)

Spiken mot SCB:s allmänna företagsregister-API gjordes 2026-09-30, se
`docs/dataspiken.md`, "SCB AFR, provkörning 2026-09-30". Det här avsnittet
var förslaget för transporten och adaptern. **Det är byggt 2026-10-04**, med
avvikelserna under "Så byggdes det" längst ned i avsnittet.

### Adress, nyckel och gränser
- **Kontrakt:** `https://apiafr.scb.se/swagger/v1/swagger.json` är
  normativt. Filen saknar `servers`.
- **Bas-URL:** `https://apiafr.scb.se`, verifierad med riktiga anrop. Sätts i
  `SCB_AFR_API_BASE_URL`. Transporten ska kräva https mot exakt
  `apiafr.scb.se`, samma mönster som Bolagsverket.
- **Version:** `/v1` blir en konstant i koden, eftersom kontraktet är
  versionerat.
- **Nyckel:** `SCB_AFR_API_KEY`, skickas i headern `X-API-Key`. Den är
  personlig (Eriks), server-only och delas inte.
- **Gränser:** högst 5 anrop/s per nyckel (Sekundärt, SCB:s dokumentation)
  och `limit` högst 5 000 (Verifierat). Vid 429 läses `Retry-After`. Fel är
  `application/problem+json`, och felen vi kastar bär aldrig `detail` eller
  `instance` (samma regel som Bolagsverket).
- **Nattfönster:** API:t ligger nere 04:00–04:30 varje natt. Ett 503 i det
  fönstret ska visas som "registret uppdateras, försök igen om en stund",
  inte som ett tyst tomt svar.
- **Sidstorlek:** `limit=1000` (~430 kB per sida). `scb.ts` får **ett eget
  tak för svarsstorlek**, anpassat till limit 1 000 (till exempel ~1 MB). Det
  ärver inte Bolagsverkets `MAX_RESPONSE_CHARS` på 512 000 tecken. En sida
  med 5 000 rader är ~2,2 MB och skulle slå i det taket.
- **Kostnad för en kundlista:** SNI 69201 har 25 791 juridiska enheter, 26
  sidor och ~20–35 s. SNI 62100 har 31 495, 32 sidor och ~25–40 s. Sidorna
  hämtas i tur och ordning.

### Filtermodellen
- **Ett filter per anrop**, som inte går att kombinera: `naringsgren`
  (bara `rangordning=1`), `kommun`, `lan`, `anstalldaklass` och för JE även
  `omsattningsklass` och `juridiskform`. Varje filter har ett `/count`.
- **Inget filter** på verksam eller reklamspärr.
- **Därför:** hämta per SNI och filtrera allt annat hos oss:
  - juridisk form: `jurform` i {41, 42, 43, 49}, alla aktiebolag;
  - verksam: `ftgStat` = 1;
  - reklamspärr: bara `reklamSparrTyp` = 1 ("Tar emot reklam"). 2 och
    okända värden räknas som spärr;
  - storleksklass: `anstKl`.
- Fysiska personer (`jurform` 10) och dödsbon (91) kommer med namn i
  listan. De filtreras bort i transporten eller adaptern **innan** något
  returneras eller lagras.

### Förslag: `searchCompanies`
1. Validera SNI som fem siffror (se "SNI 2025").
2. Gå igenom `GET /v1/juridiskaenheter/naringsgren/{sni}?limit=1000`
   tills `hasMore` är false (eller läs cachen, se nedan).
3. Filtrera hos oss: aktiebolag, verksamma, utan reklamspärr. `anstKl`
   översätts från `minEmployees`/`maxEmployees` till klasser. En klass tas
   med bara om hela intervallet ligger inom gränserna.
4. Sortera deterministiskt (orgNr), ta högst 50, och berika bara dem med
   Bolagsverkets `lookupOrganisation` (beskrivning, registreringsdatum,
   Bolagsverkets reklamspärr).
5. Län: `lanSate` blir namn via `lankoder`. 00 och 99 blir okänt.

### Förslag: `getMarketOverview(locale, sniCode)`
- **Utan `sniCode` går vi inte mot AFR** (hela registret är 1+ miljon rader).
- **`companyCount`:** räknat ur samma genomgång som `searchCompanies`, som
  verksamma aktiebolag med huvudbransch `sniCode`. Etiketten ska säga just
  det. `/count` (ett anrop) ger alla juridiska enheter i huvudbranschen och
  kan visas bredvid som "registrerade totalt".
- **`regionSharePercent`:** andel av de verksamma aktiebolagen med
  `lanSate` = 01 (Stockholm), räknat på de med känt län. Det ersätter planen
  att härleda län ur postnummer.
- **`competitors`:** de största namngivbara aktiebolagen efter `anstKl`,
  med beskrivning från Bolagsverket.
- **`medianRevenueKsek`** och **`growthSharePercent`** kommer inte från AFR
  (iXBRL eller statistikdatabasen). Tills vidare är `basis` 0, alltså okänt.

### Cache i `registry_cache` (förslag)
- **Inget cachas förrän SCB:s användarvillkor är citerade ordagrant i
  `docs/dataspiken.md` och Erik själv har kört
  `registry_cache`-migreringen.** Till dess hämtas allt live.
- Nycklar (`source = 'scb_foretagsregistret'`):
  - `je:sni:{kod}` för den filtrerade, reducerade listan, bara aktiebolag,
    verksamma och utan reklamspärr, med fälten orgNr, namn, anstKl, lanSate,
    kommunSate och postOrt. Aldrig råsvaret, aldrig fysiska personer;
  - `je:sni:{kod}:count` för `/count`;
  - `kod:{tabell}` för kodtabeller.
- **Giltighet:**
  - 24 h för listor och antal. SCB uppdaterar varje natt, och en kort tid
    gör att en ny reklamspärr slår igenom snabbt;
  - 7 dagar för kodtabeller, vilket är migreringens tak.

### SNI 2025 (beslut 2026-09-30, se `docs/beslut.md`)
Spark använder SNI 2025 rakt av, fem siffror utan punkt, till exempel
`69201`. Ingen omkodning från SNI 2007. AFR:s kodtabell är SNI 2025
(62010 finns inte, 62100 = Dataprogrammering). **Ingenting ändras nu**, men
följande ska ändras när porten och demodatan ses över:
- **Porten:** `RegistryQuery.sniCode` och `RegistryCompany.sniCode` blir
  fem siffror utan punkt. Kommentaren i `ports/RegistryProvider.ts` ska
  säga SNI 2025.
- **Liveadaptern:** `SNI_PATTERN` (`/^\d{2}\.\d{3}$/`) och felmeddelandet
  "formen 12.345" i `adapters/live/RegistryProvider.ts` blir `/^\d{5}$/`.
- **Demodatan:**
  - `adapters/demo/RegistryProvider.ts` (`sniCode: "69.201"` på 20 bolag
    och `SARA_MARKET_SNI_CODE`);
  - texterna "SNI 69.201" i `adapters/demo/sara.ts`,
    `adapters/demo/cofounderScript.ts` och `i18n/sv.ts`/`en.ts`;
  - testerna som använder formen: `ports/RegistryProvider.contract.test.ts`,
    `ports/stubStatus.test.ts`, `adapters/live/RegistryProvider*.test.ts`,
    `lib/server/registryCache.test.ts`, `lib/server/registryTransport.test.ts`,
    `screens/Market.test.tsx` och `screens/Validation.test.tsx`.

  69201 finns i SNI 2025 med samma innebörd (redovisning och bokföring), så
  Saras bransch behöver bara byta form, inte kod.

### Skillnader mot `lib/server/registrySchemas.ts` och porten
Att göra när transporten skrivs.

| Antaget (`RegistryRowSchema`) | Verkligt i AFR |
|---|---|
| `{ companies: [...] }`, `.strict()` | `{ jes: [...], pagination: { nextCursorId, limit, hasMore } }`. `.strict()` fäller alla extra fält (`postAdress`, `kommunSate`, spärrfälten) |
| `orgNr` | `orgNr` (10 siffror). Dessutom `peOrgNr` (12) |
| `name` | `namn` |
| `legalForm`, `AKTIEBOLAG_FORM = "AB"` | `jurform`. Aktiebolag är `"41"`, `"42"`, `"43"` och `"49"` hos SCB. `"AB"` gäller bara Bolagsverket |
| `sniCode` | `primarNaringsgren.naringsgren`, fem siffror, SNI 2025, bara huvudbranschen, plus `andelProcent` |
| `employees: number \| null` | `anstKl`, klasskod som sträng. `"0"` betyder okänt |
| `county: string \| null` (härlett) | `lanSate`, en kod. 00 och 99 betyder okänt |
| `description` | Finns inte, bara hos Bolagsverket |
| `deregistered: boolean` | `ftgStat`: 1 verksam, 0 aldrig verksam, 9 inte längre verksam |
| `advertisingBlock: boolean` | `reklamSparrTyp`: 1 tar emot, 2 frånsagt. Dessutom `telefonSparrTyp` och `epostSparrTyp` |
| `AnnualFigures` | Finns inte i AFR |

**Porten:**
- `RegistryCompany.employees` och `revenueKsek` är tal som inte får vara
  null. AFR ger en klass respektive ingenting, se punkt 4 under "Kvar innan
  modulen är klar".
- `min/maxEmployees` översätts till klasser.
- `sniCode` byter form enligt beslutet ovan.

### Öppen fråga: /full och omsättningsklass
`/full` används inte eftersom den innehåller `tel` och `epost`.
Omsättningsklassen (`omsKl`) skulle kunna fylla en del av
`medianRevenueKsek`, men det kräver ett eget beslut om personuppgifter
först.

### Så byggdes det (2026-10-04)
- **`fetchLegalUnitsBySni(sni)`** ersätter `fetchCompanies`. Grinden först.
  `/count` först, sedan alla sidor med `limit=1000` och `cursorId` tills
  `hasMore` är false. Tak: 80 000 enheter (80 sidor), 1,5 MB per svar,
  4 anrop/s inom processen, 15 s timeout per anrop, en ny chans vid 429 med
  `Retry-After` på högst 5 s, och ett eget felmeddelande vid 503 under
  nattfönstret. En paginering som inte går framåt ger ett fel.
- **Fysiska personer och dödsbon** filtreras bort i transporten. Bara de fält
  adaptern behöver lämnar transporten.
- **`lib/server/registrySchemas.ts`** är omskriven efter AFR:s svar och
  kodtabeller (storleksklasser, länskoder, aktiebolagens jurform).
- **Ingen cache** (villkoren är inte citerade). Samtidiga anrop för samma
  bransch delar på samma genomgång, så att en sidladdning bara går igenom
  listan en gång. `/app/marknad` har `maxDuration = 60`.
- **SNI-formen är oförändrad i porten och på sidan** (`69.201`). Adaptern och
  transporten godtar också `69201` och gör om till fem siffror mot AFR.
  Bytet av form i porten och demot (avsnittet "SNI 2025") är inte gjort.
- **`RegistryCompany.revenueKsek` är nullbar** (porten ändrad). AFR har ingen
  omsättning; liveadaptern ger `null`. Demots bolag har kvar sina tal.

## Hur liveadaptern fungerar i dag

- **Första satsen** i båda metoderna: `assertRegistryAccessAllowed()`.
- **`searchCompanies`:** validerar SNI (`12.345` eller fem siffror) och
  anställdagränser före allt annat. Hämtar branschen ur SCB och namnger bara
  aktiebolag som är verksamma, tar emot reklam enligt SCB och har känd
  storleksklass. En klass tas med bara om hela intervallet ligger inom
  gränserna. Högst 50, i ett deterministiskt men spritt urval (hash av
  org.nr, inte de äldsta bolagen). `employees` är klassens nedre gräns,
  `revenueKsek` är `null` och okänt län ger `""`.
- **`getMarketOverview(locale, sniCode)`:** kräver `sniCode` (hela registret
  gås aldrig igenom). `companyCount` = verksamma aktiebolag med branschen som
  huvudbransch, också de med reklamspärr (de räknas men namnges inte).
  `regionSharePercent` = andelen i Stockholms län av dem med känt län.
  Median och tillväxt har underlaget 0 (okända). Konkurrenterna är de största
  namngivbara bolagen, berikade med Bolagsverkets beskrivning: en spärr,
  avregistrering eller saknad beskrivning hos Bolagsverket utesluter. Högst
  tio uppslag för fem konkurrenter. Går Bolagsverket inte att nå blir listan
  tom och resten visas. Källan är "SCB:s företagsregister och Bolagsverket"
  med anropsdagen.
- Fel: `RegistryLockedError` (grind), `RegistryInputError` (ogiltig indata),
  `RegistryTransportError` (transport eller oväntat svar). Ingen ärver
  `NotImplementedError`.

### Registerbevis (steg 03 och 04)

På `/app/marknad` kan grundaren trycka "Spara som underlag"
(`app/(app)/app/marknad/actions.ts`). Servern hämtar marknadsbilden på nytt
bakom grinden och sparar två systembevis (`entered_by = 'system'`) via
`lib/server/systemEvidence.ts` (service role, bara `adapters/live/EvidenceRecorder.ts`
får importera den): `registerMarketCount` (steg 03) och
`registerCompetitorSet` (steg 04), med antal och SNI-kod i citatet, aldrig
bolagsnamn. En nyare hämtning ersätter den äldre. Det gör att steg 03 och 04
går att klara i live när grinden är öppen. Beslut i `docs/beslut.md`
2026-10-04.

## Öppna frågor (avgörs före vecka 2)

1. ~~**Vem skriver till `registry_cache`?**~~ **Avgjort 2026-09-23 (Erik):**
   gemensam cache som bara servern läser och skriver
   (`lib/server/registryCache.ts`, service role). Tabellen är stängd för alla
   klienter. Se `docs/beslut.md` och `docs/arkitektur.md` avsnitt 9.
2. **Utgångna rader rensas aldrig.** *Delvis löst 2026-09-23:* varje
   `registryCache.get()` tar bort alla utgångna rader. Om cachen inte används
   alls ligger raderna kvar, så ett schemalagt jobb behövs fortfarande för att
   garantera 7 dagar.

## Kvar innan modulen är klar

0. **Senare session:** koppla `sniCode` automatiskt till projektets bransch (beslutat 2026-09-19 att lämna den valfri tills dess).

1. Spik med riktiga nycklar (`docs/dataspiken.md` §3): kan man söka på SNI, vilka
   iXBRL-taggar finns, går län att härleda, vad säger villkoren om lagring.
2. Skriv transporten och skriv om `lib/server/registrySchemas.ts` mot det
   verkliga svaret (**Bolagsverket klart 2026-09-23, SCB och inkopplingen
   av `lookupOrganisation` klart 2026-10-04**; kvar är `/dokument`/iXBRL).
   `RegistryProvider.live.test.ts` kör nu riktiga anrop (opt-in).
   Respektera SCB:s gränser: cursor-paginering med limit 1 000 och högst 5 anrop/s (rättat 2026-09-30, de gamla uppgifterna 2 000 rader/anrop och 10 anrop/10 s gällde det gamla API:t). Se "SCB AFR" ovan.
3. ~~Läs Bolagsverkets villkor (Verifierat)~~ klart 2026-09-23. Grinden lyfts först när de tre kraven under "Licensgrind" är uppfyllda.
4. ~~Portens `revenueKsek` är icke-nullbar~~ nullbar sedan 2026-10-04.
   `employees` är klassens nedre gräns; bolag med okänd klass namnges inte.
5. Enskilda firmor/reklamspärr med Juridisk koll + vuxen/handledare
   (`docs/dataspiken.md` §6 fråga 4).
