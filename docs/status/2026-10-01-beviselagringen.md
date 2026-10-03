## Beviselagringen (grenen `plattform/bevislagring`, 2026-10-01)

Byggd enligt `docs/bevislagring.md`. Besluten, med motiv, står i specens avsnitt 11.

### Klart
- **Bevissorterna** (`core/evidenceKinds.ts`): 14 sorter som en fast lista. Sorten avgör del, datatyp, poäng, motsäger, livslängd och vem som får lägga in den.
- **Migrationen** (`supabase/migrations/20261001120000_evidence_write_path.sql`, med rollback-block, rör inte `profiles` eller `projects`):
  - ny tabell `evidence_kinds`
  - nya kolumner och villkor på `evidence`
  - dubblettspärr
  - trigger som sätter poäng, del, datatyp och motsäger ur sorten vid varje insert
  - trigger som bara tillåter återkallelse
  - `record_evidence` och `retract_evidence` (security definer)
  - skrivpolicyerna på `evidence` och `score_snapshots` borttagna
- **Porten** `ports/EvidenceRecorder.ts`, med demoadapter (sparar ingenting) och liveadapter (`adapters/live/EvidenceRecorder.ts`). Läsvägen är delad med `EvidenceRepository` i `adapters/live/evidenceScore.ts`.
- **`core/evidenceInput.ts`** (ren funktion): återkallade bevis bort, sortkontroll, föråldring (utesluts), ordning och tak för självrapporterat.
- **De fyra felen i specens avsnitt 0:**
  1. Insert-policyn är borttagen. Egna `points` avvisas, både direkt och via funktionen.
  2. `calculateScore` kastar inte längre på en tom upplåst del. Delen hamnar i `emptyParts` och `/app/poang` visar "Inget underlag än".
  3. `previousTotal` räknas ur den senaste snapshottens egen förändring.
  4. Fasen räknas ur högsta avklarade steg, se `docs/beslut.md` 2026-10-01.
- **Snapshots** skrivs bara av servern med service role (`lib/server/scoreSnapshots.ts`, lint-spärrad, beslut i `docs/beslut.md`).
- **Tester:**
  - `core/evidenceKinds.test.ts`, `core/evidenceInput.test.ts` (en grupp per regel)
  - `supabase/migrations/evidenceWritePath.pg.test.ts`: SQL:en mot en riktig Postgres via PGlite, i CI, utan Docker. Där finns testet att egna `points` avvisas och synktestet mellan SQL och core.
  - `WRITE_CLOSED_TABLES` i `migrations.test.ts`
  - `ports/EvidenceRecorder.contract.test.ts`, `adapters/live/EvidenceRecorder.test.ts`
  - `rls.live.test.ts` och läsvägens tester uppdaterade till det nya schemat
- **Nytt dev-beroende:** `@electric-sql/pglite`.
- Verifierat: `pnpm typecheck`, `pnpm lint` (0 fel, 3 gamla varningar i `design-referens/`), `pnpm test`, `pnpm build` och `pnpm test:e2e` (44 gröna mot det riktiga Supabase-projektet). `/security-review`: inga fynd över tröskeln. Granskningens förslag om en `check` på `source_url` är infört.

### Återstår för att poängen ska röra sig i live
1. **Kör migrationen i Supabase före nästa driftsättning av koden.** Läsvägen frågar nu efter de nya kolumnerna (`kind`, `entered_by`, `retracted_at`). Utan migrationen kraschar `/app` för alla med ett aktivt projekt och minst ett bevis. e2e gick igenom eftersom testkontot inte når den frågan.
2. **Ett flöde som anropar skrivvägen.** Ingen skärm eller server action anropar `recordEvidence` än. Första flödet enligt specen är Passform från profilen.
3. **`journey_steps` saknar skrivväg.** Fasen står kvar i `discover`, där taket är 18 och bara Passform och Marknad är upplåsta.
4. **Registret är grindat och sändningen spärrad.** Marknad och Konkurrens får inga systembevis, och Problem och Betalningsvilja bara självrapporterade (högst halva vikten).
5. **`SUPABASE_SERVICE_ROLE_KEY` måste finnas i Vercel,** annars kan snapshots inte skrivas.

### Kända problem
- ~~`UNLOCK_STEP` i `core/score.ts`~~ rättat på `plattform/poangen-ror-sig`.
- ~~`journey_steps` går att skriva direkt~~ stängt på `plattform/poangen-ror-sig`.
- **Samma bolag kan anges under många olika namn.** Varje nytt `subject_ref` är ett nytt bevis. Taket i B6 begränsar effekten till halva delen.
- **`rls.live.test.ts`:s bevistest** använder kontots aktiva projekt (testprojektet är inaktivt). Saknas ett aktivt projekt prövas bara att direkt insert nekas.

### Beslut nästa session behöver känna till
- **Ändras en bevissort** krävs en ny migrering som uppdaterar `evidence_kinds`, annars failar synktestet. Gamla bevis behåller sitt lagrade värde (B2).
- **Systembevis** (`entered_by = 'system'`) ska skrivas av servern, inte via `record_evidence`. Triggern sätter poängen ändå.
- **Test mot Postgres:** nya migreringar kan prövas med `createMigratedDb()` i `test/pgMigrations.ts`.

### Docs mot kod
- **Specen (avsnitt 3.1 och 3.3)** sade att `core/score.ts` inte skulle röras. Den rördes för B4 enligt Theodors beslut, se 11.1.
- **Specen (6.3a)** föreslog att skicka det senaste föråldrade beviset med 0 poäng så att delen inte blir tom. Med B4 behövs det inte. En tom del visas som en lucka, vilket är ärligare än en gammal källa.
- **`docs/moduler/evidens-och-poang.md`** sade att en upplåst del utan bevis "kastar ett tydligt fel". Uppdaterad.
- **`.env.example`** sade att service role bara används av registercachen. Uppdaterad.
