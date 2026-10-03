## Marknad låser upp steg 03 (gren `modul/marknad-steg3`, 2026-10-04)

### Klart
- **Steg 03 går att klara i `/app`.** Förut kunde ingen bli klar med steg 03: kravet är ett `registerMarketCount`-bevis, men inget kunde skriva det (`record_evidence` vägrar registersorterna, och SCB-transporten fanns inte).
- **SCB AFR, delvis** (`lib/server/scb.ts`):
  - `fetchCompanyCount(sni)`: `GET /v1/juridiskaenheter/naringsgren/{kod}/count`, ett anrop, inga namn. 404 ger 0. Fel blir våra egna texter, aldrig SCB:s `detail`. https mot exakt `apiafr.scb.se`, nyckeln i `X-API-Key`, minst 250 ms mellan anropen.
  - `searchIndustries(text)` och `fetchIndustryName(sni)` ur kodtabellen `naringsgrenkoder`, som hålls i minnet i 7 dagar. Omslaget kring tabellen är inte verifierat, så både lista och objekt med en lista tas emot.
  - `fetchCompanies` kastar `ScbListingUnavailableError` (platshållarfel). Appens SNI-form "69.201" blir AFR:s "69201" i transporten; porten är oförändrad.
- **Registeradaptern:** `getMarketOverview(locale, sni)` ger SCB:s antal med källa och länk när listan inte finns, resten luckor (basis 0, inga konkurrenter). `searchLiveIndustries` och `getLiveIndustryName` utanför porten, bakom licensgrinden.
- **Systembevis** (`lib/server/systemEvidence.ts`, service role, lint-låst till `EvidenceRecorder.ts`) och `recordMarketEvidence` i `adapters/live/EvidenceRecorder.ts`: antal → `registerMarketCount` (steg 3), konkurrenter → `registerCompetitorSet` (steg 4), `subject_ref` = `sni:69.201`. Byte av bransch återkallar de gamla registerbevisen, föråldrade hämtas på nytt. Poängen räknas om och en snapshot skrivs, och Spåret får en rad.
- **`/app/marknad`:**
  - Sök bransch på namn (`?q=`), eller ange koden som förut.
  - Branschens namn i rubriken ("Elinstallationer (43.210)").
  - Utan kod i adressen öppnas grundarens valda bransch (senaste giltiga registerbeviset).
  - Knappen "Det här är min bransch" (server action `chooseIndustry`): hämtar marknadsbilden på servern, sparar beviset och klarar steg 03 (och 04 om konkurrenterna finns) när det är det aktuella steget. Resultatet visas efter omdirigering (`?sparad=steg3|1|fel`), utan JavaScript.
  - Etiketten "Din bransch" när koden redan är vald, och en uppmaning när SCB har 0 företag med koden.
  - Konkurrentsektionen säger att listan inte är kopplad än, i stället för en tom lista.
- Tester: `lib/server/scb.test.ts`, `lib/server/systemEvidence.test.ts`, `adapters/live/RegistryProvider.count.test.ts`, `adapters/live/EvidenceRecorder.market.test.ts`, `app/(app)/app/marknad/actions.test.ts`, nya fall i `page.test.tsx`, och `supabase/migrations/systemEvidence.pg.test.ts` som mot en riktig Postgres visar att beviset klarar steg 03 via `complete_journey_step` och att steg 04 nekas. Två vakttester uppdaterade med beslut (se Beslut). Typecheck, lint, alla tester och build gröna.

### Återstår (för att det ska fungera i produktion)
1. **Vercel, miljövariabler** (Production och Preview): `SCB_AFR_API_KEY`, gärna `SCB_AFR_API_BASE_URL=https://apiafr.scb.se`, `SUPABASE_SERVICE_ROLE_KEY` (finns redan för poänghistoriken), `REGISTRY_LIVE_ENABLED=true` och `REGISTRY_ALLOWED_USER_IDS` med de användar-id som får se registret.
2. **Provkör mot SCB** med riktig nyckel. Claude Codes miljö når inte `apiafr.scb.se`, så anropen är bara testade mot den verifierade svarsformen. Särskilt omslaget kring `naringsgrenkoder` är overifierat.
3. **SNI 2025 mot appens form:** koden skrivs fortfarande "69.201" i appen och omvandlas i transporten. Koder som bytt innebörd mellan SNI 2007 och 2025 kan ge fel bransch om grundaren skriver en gammal kod. Sökningen på namn ger alltid 2025-koder.
4. **Steg 04** kräver konkurrenterna, alltså hela bolagslistan med cache. Väntar på SCB:s villkor och `registry_cache`-migreringen.
5. Licensgrinden: att öppna registret för fler än Erik och Theodor är ett beslut, inte kod.

### Kända problem
- Varje visning av Marknad med en vald bransch gör ett `/count`-anrop (och kodtabellen en gång per process och vecka). Inom SCB:s gräns, men ingen cache.

### Beslut
Se `docs/beslut.md`, 2026-10-04: systembevis via service role, listan som platshållarfel, branschen ur senaste registerbeviset, och att valet klarar steg 03 direkt. Vakterna i `lib/server/registryCache.test.ts` och `lib/server/registryTransport.test.ts` är uppdaterade efter besluten.
