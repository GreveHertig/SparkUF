## Registret: Bolagsverket-transporten, steg A och B (klar, gren `modul/registret-bolagsverket`, PR mot `prototyp`)

### Klart
- **Steg A, svarsformaten är verifierade.** Erik körde det fristående skriptet
  `scratchpad/bv-steg-a.mjs` (gitignorerat, bara Node och miljövariabler) på
  sin egen dator mot Volvo, Ericsson och H&M, plus tre felfall. Formaten står
  i `docs/dataspiken.md` under "Svarsformat, verifierat mot riktiga anrop".
  Den gamla Swagger-skissen var fel på flera punkter och är ersatt.
  Ip-adresser, trace-id och request-id skrevs medvetet inte in.
- **Steg B, `lib/server/bolagsverket.ts`:** `lookupOrganisation` gör
  `/organisationer` och `fetchDocumentList` gör `/dokumentlista`. Token
  hämtas med client credentials och cachas. Vid 401 görs ett nytt försök.
  Anropen har timeout och tempo. Bas-URL:en läses från en miljövariabel med
  host-kontroll (SSRF). Org.nr måste ha giltig kontrollsiffra och får inte
  vara ett personnummer. Grinden anropas först. Scheman:
  `lib/server/bolagsverketSchemas.ts`. Tester: `lib/server/bolagsverket.test.ts`,
  med Ericssons riktiga svar som fixtur.
- **Lint-regel** i `eslint.config.mjs`: bara `adapters/live/RegistryProvider.ts`
  och tester får importera `lib/server/bolagsverket` och `lib/server/scb`.
- **`.env.example`:** `BOLAGSVERKET_CLIENT_ID`, `BOLAGSVERKET_CLIENT_SECRET`,
  `BOLAGSVERKET_API_BASE_URL`, utan värden.

### Återstår
- **Erik:** lägg till `BOLAGSVERKET_API_BASE_URL` i `.env.local` (adressen står
  i dataspiken). Den saknas där i dag. `.env.local` rördes inte.
- **Provkörning av TypeScript-transporten** mot det riktiga API:t. Den går inte
  att köra från Codespacet, och grindkrav 1 i `registret.md` kräver den.
- Koppla `lookupOrganisation` till adaptern. Det väntar på SCB-listan, som
  ger vilka org.nr som ska slås upp.
- `/dokument` och iXBRL (uppskjutet, inga nya beroenden). Först behövs ett
  bolag vars `/dokumentlista` inte är tom.
- De öppna punkterna i dataspiken: hur "finns inte" besvaras, vad
  `reklamsparr: null` betyder, formen på `fel`, SNI-versionen, rate limits
  och `[TEST]`.

### Kända problem
- **Codespacet når inte Bolagsverket.** Både `gw.api`, `portal.api` och
  `bolagsverket.se` ger timeout över IPv4 och IPv6, medan `www.scb.se` svarar.
  Troligen blockeras molnets ip-intervall. Alla riktiga anrop måste göras
  från en annan maskin.
- `post-checkout`/`post-merge`-hookarna klagar på att `git-lfs` saknas.
  Repot spårar inga LFS-filer, så det påverkar inget.

### Beslut nästa session behöver känna till
- **`reklamsparr: null` tolkas som okänt**, inte som "ingen spärr". En
  ifylld spärr i en form vi inte känner igen räknas som spärr.
- **Bolagsverket-schemana är inte `.strict()`**, eftersom svaret har ett
  fyrtiotal fält. Okända fält tas bort av Zod och når aldrig transporten.
- **`registry_cache` rördes inte** (Eriks beslut 2026-09-23, fråga 1 avgörs
  separat).
