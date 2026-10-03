## Modul: Registret — liveadapter (påbörjad, grindad, branch `modul/registret`)

Byggd enligt `docs/bygga-en-modul.md`, plan godkänd 2026-09-19 (beslut D1–D7).

**Villkor (blockerande för exponering):** ingen annan än Erik och Theodor får se
eller använda liveregisterdata (ingen demo för lärare, investerare eller andra
UF-företag) förrän `docs/dataspiken.md` §6 fråga 1 är uppgraderad från
Sekundärt till Verifierat. **Uppfyllt 2026-09-20** (Erik läste Bolagsverkets sida; *senare, 2026-09-23: inte uppfyllt, nedgraderat till Sekundärt, villkorstexten är inte läst*); licensgrinden i koden ligger kvar tills Erik öppnar den, och juridisk koll av fråga 4 (aktiebolag/reklamspärr) återstår. Internt utvecklingsarbete och
tester är okej.

### Klart
- **Licensgrind:** `lib/server/registryAccess.ts` — nekat som standard, kräver
  `REGISTRY_LIVE_ENABLED=true` och att `user.id` finns i `REGISTRY_ALLOWED_USER_IDS`.
  Första sats i båda metoderna, före indata och transport. `RegistryLockedError`
  ingår i `isPlaceholderError` (visas som `ComingSoon`) men ärver inte
  `NotImplementedError`. Skyddas av `Licensvakt` i `ports/stubStatus.test.ts`.
- **`adapters/live/RegistryProvider.ts`:** båda metoderna, se
  `docs/moduler/registret.md` ("Hur liveadaptern fungerar i dag"). Bara
  aktiebolag utan reklamspärr med namn, källa = anropsdatum, luckor utelämnas
  eller flaggas via `basis`, extern text rensas och kortas.
- **Port:** valfritt `basis` på `MarketOverview` (D3) och valfri `sniCode` som
  andra parameter på `getMarketOverview` (nytt beslut, se nedan).
- **Transport:** `lib/server/scb.ts` och `bolagsverket.ts` är skelett som kastar
  `RegistryTransportError`. Alla antaganden om svarsform i
  `lib/server/registrySchemas.ts` (`ANTAGANDEN`).
- **Tester:** grind (8), adapter (20), transportskelett (2), kontraktstestet körs
  **grönt mot live** (5 av 5, inte skippat) med mockad transport, `RegistryProvider.live.test.ts`
  (opt-in, `REGISTRY_LIVE_SMOKE`). Registret borttaget ur `STILL_STUBS`.
- `.gitignore`: `.mcp.json` och `supabase/.temp/`. `.env.example`: de två
  grindvariablerna utan värde (Eriks och Theodors user.id ligger bara i `.env.local`).
- Rättat: kundanmälan till Bolagsverket är **inte skickad** (stod felaktigt som skickad).

### Beslut nästa session behöver känna till
- **Grönt betyder inte verifierat mot Bolagsverket/SCB.** Kontraktstestet går mot
  mockad transport i en antagen svarsform. Den riktiga transporten är en andra PR
  efter spiken. Modulstatus är därför "påbörjad", inte "klar".
- **`getMarketOverview` fick valfri `sniCode`** eftersom porten inte hade någon
  branschangivelse. Utan den gäller sammanfattningen hela registret. **Beslutat 2026-09-19 (Erik):** `sniCode`
  förblir en valfri parameter tills vidare. Automatisk koppling till projektets
  bransch tas i en senare session (när `/app/marknad` byggs).
- **Ingen liveyta finns** (`/app/marknad` byggs inte här) och `docs/bygga-en-modul.md`
  §11.2 (`ComingSoon` ska försvinna) är därför medvetet inte tillämpligt.
- **Inget skrivs till Supabase** (`public.companies` har ingen skrivpolicy, en
  service role-nyckel skulle kräva ett eget dokumenterat beslut).
- `REGISTRY_LIVE_ENABLED` är avsiktligt inte satt i `.env.local`; sätt den lokalt
  bara när något faktiskt ska köras mot grinden.

### Kända problem / medvetna begränsningar
- `employees`/`revenueKsek` är icke-nullbara i porten, så bolag med okänt värde
  utelämnas från `searchCompanies`. `regionSharePercent` (Stockholms län) och
  `growthSharePercent` (>10 %) följer i18n-etiketterna men länsnamnet är ett
  ANTAGANDE. Utan `sniCode` ger `getMarketOverview` inga konkurrenter.
- Enskilda firmor/reklamspärr (§6 fråga 4) fortsatt öppet: Juridisk koll + vuxen/handledare.
