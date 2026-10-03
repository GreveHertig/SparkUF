## Pulsen: dagscachen `pulse_fetches` (klar 2026-09-25, gren `plattform/pulsen-cache`, PR mot `prototyp`)

### Klart
- **Migrering** `supabase/migrations/20260925090000_pulse_fetches.sql`: ny
  tabell `pulse_fetches` med `user_id` (cascade från `auth.users`),
  `fetch_date` (default svensk dag, `(now() at time zone 'Europe/Stockholm')::date`),
  `status` (`pending`/`done`/`empty`/`error`), `claimed_at` och `fetched_at`.
  Primärnyckel `(user_id, fetch_date)`. Ett check-villkor kräver att
  `fetched_at` är `null` exakt när status är `pending`. `pulse_signals` är
  orörd.
- **RLS:** select, insert och update av egna rader. Ingen delete-policy. RLS-vakten
  i `migrations.test.ts` täcker tabellen (RLS på, minst en policy).
- **Provkört i PGlite** (lokal Postgres i minnet, bara i scratchpad, inte
  committat): claim ger en rad första gången och noll andra gången. Insert åt
  en annan användare stoppas av RLS. En annan användare ser och uppdaterar noll
  rader. `done` utan `fetched_at` stoppas av check-villkoret. Takeover tar ett
  `error` en gång, sedan inte igen, och tar aldrig en `empty`-dag.
- **`docs/moduler/webbresearch-och-pulsen.md`:** nytt avsnitt "Dagscachen"
  (claim före Tavily, statusflöde, svensk dag i SQL, takeover efter 5 minuter
  eller vid `error`).
- **`docs/bygga-en-modul.md`:** Pulsens liveadapter byggs på `modul/pulsen`.
- **`docs/beslut.md`:** beslutet om dagscachen, med `claimed_at`.
- **`/security-review`:** inga fynd. Enda anmärkningen: en användare kan
  sätta valfri status eller valfritt `fetch_date` på sina egna rader. Det
  påverkar bara hens egen sökning och är accepterat i beslutet.

### Återstår
- **Adaptern:** `adapters/live/PulseProvider.ts` kastar fortfarande
  `NotImplementedError`. Den byggs på `modul/pulsen` enligt "Dagscachen".
- **Migreringen är körd** (rättat 2026-09-26): `pulse_fetches` kördes mot
  SparkUF2 den 26/9. RLS är på och tabellen har sina 3 policyer.
- **Tak för omförsök av `error`** samma dag bestäms i adaptern (se modul-docen).
- **RLS-testet mot riktig databas** (`adapters/live/rls.live.test.ts`) täcker
  inte `pulse_fetches` än. Lägg till tabellen när migreringen körs.

### Kända problem
- **Inaktuella typer i `.next/dev/types`** efter att `experiment/landning-fonda`
  varit utcheckad gav typecheck-fel om `app/experiment/...`. `rm -rf .next/dev/types`
  löser det. Det är genererade filer, inte kod.

### Beslut nästa session behöver känna till
- **Adaptern räknar aldrig dagen i Node.** Den låter kolumnens default och
  samma SQL-uttryck avgöra svensk dag.
- **`pulse_fetches` är användarägd**, till skillnad från `registry_cache`. En
  förfalskad rad påverkar bara grundarens egen sökning.
