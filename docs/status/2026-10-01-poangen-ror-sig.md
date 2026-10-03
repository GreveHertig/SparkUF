## Poängen rör sig (grenen `plattform/poangen-ror-sig`, från `plattform/bevislagring`, 2026-10-01)

Skrivvägen i bruk, stegmarkeringen och motsägelsen i `UNLOCK_STEP`. Detaljer i `docs/bevislagring.md` 11.7, besluten i `docs/beslut.md` 2026-10-01.

### Klart
- **Passform från profilen:** fyra frågor under Profilen i `/app/minnet`.
  - Varje svar sparas som `profileFitAnswer` via server action `saveFitAnswer` → `liveEvidenceRecorder.recordEvidence`.
  - Källan är `spark:profile`, datumet är dagens, och svaret sparas i `quote`.
  - Poängen räknas om på servern. Sidhuvudet uppdateras via `revalidatePath`, och formuläret visar den nya poängen som en länk till Poäng-sidan.
  - Märkningen är "Ditt eget svar". Profilsvar är inte självrapporterade enligt B6, eftersom grundaren själv är källan.
- **Stegmarkeringen:**
  - Migrationen `20261001150000_journey_step_completion.sql` (med rollback-block, rör inte `profiles` eller `projects`):
    - tabellen `journey_step_requirements`
    - funktionen `complete_journey_step` (security definer)
    - skrivpolicyerna på `journey_steps` borttagna.
  - Kraven per steg finns i `core/journeyRequirements.ts` och i SQL, synktestade mot varandra.
  - Porten `ports/JourneyProgress.ts` med demo- och liveadapter. Server action `completeJourneyStep`. `/app/resan/[steg]` visar vad som saknas, eller knappen "Markera som klart".
- **Taket följer med:** efter ett avklarat steg räknas poängen om i den nya fasen, och en snapshot skrivs med orsaken `unlocked`. Testat från 16 till 20 när steg 03 blir klart.
- **`UNLOCK_STEP`:** Produkt och Genomförbarhet står nu på 07. Ett test binder upplåsningstexten till fasen.
- **Tester:**
  - `journeyStepCompletion.pg.test.ts` (Postgres): direkt insert, update och delete på `journey_steps` nekas, och det går inte att hoppa över steg. Testet prövar också krav per steg, föråldrade och återkallade bevis, andra `subject_ref` än de fyra frågorna, och att SQL och core ger samma svar i varje fall.
  - `core/journeyRequirements.test.ts`, `adapters/live/JourneyProgress.test.ts`, `ports/JourneyProgress.contract.test.ts`, `screens/blocks/FitPanel.test.tsx` och tester för sidorna och actions.
  - `rls.live.test.ts`: testet för `journey_steps` prövar nu att ett direkt anrop nekas.
- **Verifierat:**
  - `pnpm typecheck`, `pnpm lint` (0 fel, 3 gamla varningar i `design-referens/`), `pnpm test` (988 gröna), `pnpm build` och `pnpm test:e2e` (44 gröna).
  - `/security-review`: inga fynd över tröskeln. Tre iakttagelser står under kända problem.

### Kända problem
- **Live fastnar efter steg 02 tills Registret öppnas. Det är licensgrinden som blockerar, inte koden.** Steg 03 kräver `registerMarketCount`, ett systembevis ur registret, och Registret är grindat tills licensen är verifierad (`docs/moduler/registret.md`). Fasen stannar därför i Upptäck (tak 18). Eftersom Marknad i Upptäck också kräver registerdata är **högsta möjliga poäng i live i dag 10** (Passform full).
- **Steg 06, 07 och 12 har inget krav och kan inte markeras klara.** Förslagen står som öppna punkter i `docs/beslut.md` och väntar på Theodor. De är inte byggda. Även när Registret öppnas stannar resan efter steg 05 (tak 66) tills steg 06 har ett krav.
- **Kör båda migreringarna i Supabase** (`20261001120000` och `20261001150000`) före nästa driftsättning. e2e kördes mot ett Supabase utan dem. Testkontot har inget aktivt projekt, så de nya frågorna nåddes inte.
- **Steg som skrevs direkt före migreringen ligger kvar som klara.** Kontrollera `journey_steps` i live en gång efter rader som inte uppfyller kraven.
- **Ett avklarat steg står kvar om beviset bakom det återkallas eller blir för gammalt.** Fasen och taket ligger då kvar. Poängen sjunker ändå, eftersom delen töms (B4).
- **Ett passformssvar går inte att ändra samma dag.** Samma fråga och samma datum ger `duplicate`. Återkallelse finns i porten men inte i UI:t.
- **Profilsvaren är fritext utan kontroll.** Fyra svar ger full Passform (10) oavsett innehåll. Det ligger i sakens natur: grundaren är källan.
- Härdning, inte sårbarhet: `revoke` gäller insert, update och delete men inte truncate på `journey_steps` och `journey_step_requirements`. PostgREST kan inte köra truncate.

### Beslut nästa session behöver känna till
- **Ändras kraven för ett steg** krävs en ny migrering som uppdaterar `journey_step_requirements`, annars failar synktestet.
- **Snapshots skrivs fortfarande bara via `adapters/live/EvidenceRecorder.ts`** (`settleScore`, exporterad). Resans adapter anropar den.
- **`EvidenceView` har fått `subjectRef`**, som är null i demot.

### Docs mot kod
- **CLAUDE.md:** listan över uträknade sammanfattningar har fått de två nya poängsiffrorna (`FitPanel` och `StepCompletionPanel`).
- **`docs/moduler/resan.md` och `docs/moduler/evidens-och-poang.md`:** uppdaterade med skrivvägen.
