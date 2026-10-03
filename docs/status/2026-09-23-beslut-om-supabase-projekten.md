## Beslut om Supabase-projekten (klar, gren `docs/supabase-projektbeslut`, PR mot `prototyp`)

### Klart
- **`docs/beslut.md` (2026-09-23):** SparkUF2 (Supabase, Frankfurt) är
  utvecklings- och betaprojektet, trots PRODUCTION-märkningen i Supabase.
  Före lanseringen 30 november 2026 skapas ett separat produktionsprojekt med
  samma migreringar (`supabase/migrations/`). Testanvändarna test-a och test-b
  är borttagna 2026-09-23.

### Återstår
- **Före 30 november 2026:** skapa produktionsprojektet, kör migreringarna och
  kontrollera RLS där. Sätt driftmiljöns Supabase-variabler mot det nya
  projektet och flytta inte över testdata.

### Kända problem
- **`adapters/live/rls.live.test.ts` kan inte köras just nu.** Opt-in-testet
  loggar in som två testanvändare (`SUPABASE_TEST_USER_A_*`/`_B_*`), och de är
  borttagna. Skapa två nya testanvändare och uppdatera `.env.local` innan RLS
  prövas mot SparkUF2 eller mot det kommande produktionsprojektet. CI påverkas
  inte, eftersom testet är opt-in.
