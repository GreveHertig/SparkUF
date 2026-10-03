## Registret: `registry_cache` blir en gemensam servercache (klar, gren `scb/forberedelse`)

### Klart
- **Beslut (Erik 2026-09-23):** cachen är gemensam, och bara servern läser och
  skriver den. Beslutet står i `docs/beslut.md`, och skälen till service role i
  `docs/arkitektur.md` avsnitt 9. Öppen fråga 1 i `registret.md` är struken.
- **Migreringen** `20260923120000_registry_cache.sql` är omskriven:
  - `user_id` och alla policies för `authenticated` är borttagna.
  - Unik nyckel är `(source, request_key)`.
  - RLS är påslaget **utan policies**, och `revoke all … from anon,
    authenticated` är tillagt.
  - Källa, hämtdatum och 7-dagarstaket står kvar.
  - Den är fortfarande inte körd.
- **`lib/server/registryCache.ts`:**
  - Exporterar `registryCache.get/set`, är server-only och använder
    `SUPABASE_SERVICE_ROLE_KEY`.
  - Grinden anropas först.
  - Cachenyckeln måste vara strukturerad (ingen fritext) och käll-URL:en
    https.
  - `fetchedAt` får inte ligga i framtiden (det skulle förlänga lagringen),
    och ttl är högst 7 dagar.
  - Felen bär aldrig Supabase-meddelandet.
  - **`get()` tar bort alla utgångna rader** och returnerar aldrig en utgången.
- **Lint-regel** `registryCachePattern`: bara `adapters/live/RegistryProvider.ts`
  och tester får importera cachen.
- **RLS-vakten** (`supabase/migrations/migrations.test.ts`) har `CLOSED_TABLES`
  med `registry_cache`. En stängd tabell måste ha RLS på, **ingen** policy och
  indragna rättigheter. Vakten bortser nu från SQL-kommentarer.
- **Vakt för nyckeln** (`lib/server/registryCache.test.ts`): bara
  `registryCache.ts` läser `SUPABASE_SERVICE_ROLE_KEY`, och inget
  `NEXT_PUBLIC_…SERVICE` finns.
- **`.env.example`:** `SUPABASE_SERVICE_ROLE_KEY=` utan värde. Den gamla
  kommentaren "service role används INTE" är ersatt.

### Återstår
- **PR #17** (`scb/forberedelse` → `prototyp`) väntar på granskning. PR #14
  från samma gren var redan mergad.
- **`SUPABASE_SERVICE_ROLE_KEY` läggs inte in** i `.env.local` eller
  driftmiljön förrän §6 fråga 4 är avgjord.
- Kör migreringen mot SparkUF2 först när du vill det. Ingenting får skrivas
  till tabellen förrän §6 fråga 4 är avgjord, och `set()` anropas inte av
  någon än.
- Ett schemalagt rensningsjobb, om cachen kan stå oanvänd längre än 7 dagar.

### Kända problem
- **`eslint.config.mjs` kommer att krocka** med PR #16
  (`modul/registret-bolagsverket`), eftersom båda ändrar samma
  `no-restricted-imports`-block. Slå ihop dem till en regel med både
  `registryTransportPattern` och `registryCachePattern`.
- Cachens tester körs mot en egen liten fejk, inte mot riktig PostgREST.
  Semantiken för `lte`/`gt`/`upsert` behöver prövas mot en riktig databas.

### Beslut nästa session behöver känna till
- **Service role används på exakt ett ställe.** En ny användning kräver ett
  nytt beslut i `docs/beslut.md` och en rad i `docs/arkitektur.md` avsnitt 9.
- Beslutet i avsnittet "SCB-spåret förberett" ovan, att cachen ägs per
  användare, gäller inte längre.
