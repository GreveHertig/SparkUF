## Pulsen: omdöme och bevakningar (2026-10-02, Bruno, gren `modul/pulsen-bevakningar`, PR mot `design/en-design`)
**Väntar på Erik:** migreringen `20261002120000_pulse_feedback_watches.sql` ska godkännas och köras. Koden tål att den saknas, så PR:en kan mergas före. Då syns bara inga knappar och inga bevakningar.

### Klart
- **Omdöme:** "Relevant" eller "Inte relevant" under varje signal i `/app/pulsen`. "Inte relevant" döljer signalen, nu och framöver.
- **Egna bevakningar:** konkurrenter och nyckelord, högst 10 per projekt. De ingår i sökningen och i relevansfiltret. En bevakad konkurrent som nämns blir en konkurrensrisk.
- **Migrering** med RLS: bara egna rader, och omdöme bara om egna signaler. Prövad i en riktig Postgres (PGlite, 13 fall).
- **Porten:** fyra valfria metoder. Demoadaptern och demot är orörda.
- **Server Actions** (`app/(app)/app/pulsen/actions.ts`) med indatakontroll. Okända fel loggas bara med namn, aldrig databasens svar.
- **Tester:** adaptern (omdöme, bevakningar, gränser, tabellerna saknas), migreringen (PGlite), Server Actions, routen (med och utan tabellerna, äkta fel kastas) och skärmen (knappar, dölj, fel, formulär, borttagning, taket).
- **Demot oförändrat:** 28 av 28 skärmbilder identiska (AE 0). Nya vyn kontrollerad med en tillfällig förhandsvisningssida (inte committad) i 1440 och 390 px.
- Verifierat: `pnpm typecheck`, `pnpm lint`, `pnpm test` (1016 gröna, 36 skippade), `pnpm build`.

### Inte verifierat
- **Mot riktig Supabase:** migreringen är inte körd. `adapters/live/rls.live.test.ts` har inga fall för de nya tabellerna än; lägg till dem när migreringen körts (de skulle annars falla mot en databas utan tabellerna).
- **e2e:** `/app/pulsen` finns redan i `e2e/app.spec.ts`. Kör `pnpm test:e2e` efter migreringen.

### Nästa steg
- Använd "Relevant" för att rangordna (t.ex. källor eller ord som ofta får "Relevant" först).
- Låt grundaren ångra "Inte relevant".
