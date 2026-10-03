## Steg 1 klart och skrivskyddad onboarding (2026-10-02, gren `plattform/steg1-klart`, PR mot `prototyp`)
Rättar de två kända problemen från "Onboarding live, PR 2" och "PR 3": steg 2 gick inte att markera klart, och klienten kunde sätta `onboarding_completed_at` själv (kravet från säkerhetsgranskningen 2026-10-01). Plan godkänd av Erik 2026-10-02.

### Klart
- **Migreringen `20261002150000_steg1_onboarding.sql`.** Körd i SparkUF2 av Erik 2026-10-02, efter merge av #48.
  - **Steg 1 i resan:**
    - Steg 1 är klart när `profiles.onboarding_completed_at` är satt, och bara då.
    - `complete_journey_step(1)` kräver inget projekt och skriver ingen rad.
    - Steg 2 kräver klar onboarding i stället för en rad för steg 1.
    - Kravet `onboardingCompleted` ersätter de fyra `profileFitAnswer`-raderna i `journey_step_requirements`.
    - Onboardingen skapar aldrig passformsbevis (Datalöftet).
  - **`profiles` för klienten:**
    - `insert` och `delete` är stängda. Policyerna "insert egen" och "delete egen" är borttagna. Ingen kod skapade eller raderade profilrader. Raden skapas av `handle_new_user()` och försvinner med kontot.
    - `update` gäller bara `name`, `initials`, `role`, `bio`, `time_available`, `money_available` och `risk_appetite`.
  - **Ny `public.complete_onboarding(p_entry, p_answers jsonb)`** (`security definer`):
    - Det är den enda vägen att sätta `onboarding_entry` och `onboarding_completed_at`.
    - Den prövar ingången och att svaren är exakt ingångens frågor, 1–1000 tecken efter trim, och skriver allt i en uppdatering.
    - Ett andra anrop ger `55000`.
- **Kod:**
  - `core/journeyRequirements.ts`: `onboardingCompleted` i `StepCompletionInput`. Steg 1 avgörs bara av onboardingen.
  - `JourneyProgress` läser onboardingstatusen.
  - `ProfileRepository.completeOnboarding` anropar `rpc("complete_onboarding")`, och `55000` ger `OnboardingAlreadyCompletedError`.
  - i18n `stepCompletion.requirements.onboardingCompleted` ersätter `fit_*` (sv/en).
- **Tester:**
  - `journeyStepCompletion.pg.test.ts`:
    - Steg 1 och 2 kräver klar onboarding.
    - Passformssvar och gamla rader för steg 1 räknas inte.
    - Steg 1 kräver inget projekt.
    - Synktestet mot core körs som förut.
  - Nya `onboardingWrite.pg.test.ts` (19 fall):
    - Signup skapar fortfarande profilraden, som rollen `supabase_auth_admin`.
    - `update`, `insert` och `delete` av onboardingkolumnerna nekas, och anon nekas.
    - Funktionens regler.
    - Synktest mellan frågorna i SQL och `PROFILE_QUESTIONS_BY_ENTRY`.
    - Motprov: utan `revoke` fallerar tre fall.
  - `migrations.test.ts`: vakt som listar exakt vilka profilkolumner `authenticated` får skriva (`PROFILES_CLIENT_WRITABLE`). Varje ny kolumn kräver ett beslut (`PROFILES_CLIENT_CLOSED`).
  - `rls.live.test.ts`:
    - A och B kan inte sätta onboardingkolumnerna (42501).
    - Onboardingen går via funktionen, och ett andra anrop ger 55000.
    - Steg 1 och 2 kan markeras klara efteråt.
    - En okänd ingång ger 22023.
  - Adapter-, kontrakts- och rutttester uppdaterade.
- `/security-review`: inga fynd med hög konfidens.
- **RLS-testet mot SparkUF2, 2026-10-02, efter migreringen: 19 av 19 gröna** (`rls.live.test.ts`). Den första körningen gav 18 av 19: det andra `complete_onboarding`-anropet i testet skickade fel svar och fick `22023` i stället för `55000`. Testet rättades i #49 (`fix/rls-test-55000`).
- Kontroll: `pnpm typecheck`, `pnpm lint` (0 fel, 3 gamla varningar i `design-referens/`), `pnpm test` (1208 gröna, 42 skippade) och `pnpm build`.

### Kända problem
- **Testkonto A är permanent klart med onboardingen** sedan den första körningen 2026-10-02. RLS-testet prövar nu bara att ett andra anrop nekas. Återställ i SQL Editor vid behov:
  `update public.profiles set onboarding_entry = null, onboarding_completed_at = null where user_id = '<A:s id>';`
- **Ett konto som markerat steg 1 direkt före `20261001150000`** och inte klarat onboardingen fastnar på steg 2 tills onboardingen är klar (beslut 2026-10-02: gamla rader räknas inte). Det gäller bara testkonton.

### Beslut (Erik 2026-10-02)
- Gamla `journey_steps`-rader för steg 1 räknas inte.
- `55000` betyder "onboardingen är redan klar".
- `profiles` är stängd för `insert` och `delete` från klienten.
- `drop policy` står utan `if exists` med avsikt: hellre en rollback än att en gammal policy blir kvar.
- **Spec v4:** när onboardingen ändras, till exempel med nya frågor, en ny ingång eller ändrade gränser, måste `public.complete_onboarding` i SQL uppdateras i en ny migrering samtidigt som `PROFILE_QUESTIONS_BY_ENTRY`. Synktestet i `onboardingWrite.pg.test.ts` fäller annars bygget.

### Återstår
- Längdvillkor på `profiles.name` och `profiles.initials`. Det var ett lågt fynd i säkerhetsgranskningen och fanns redan före den här PR:en.
- Idégenomlysningen (`getIdeaScreening`), som väntar på Registret.
