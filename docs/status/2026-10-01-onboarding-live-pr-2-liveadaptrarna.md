## Onboarding live, PR 2: liveadaptrarna (klar 2026-10-01, gren `plattform/onboarding-live-2`, PR mot `prototyp`)
Andra PR:en av tre (plan i "Onboarding live, PR 1" ovan). Migreringen `20260930120000_onboarding.sql` är körd i SparkUF2 av Erik. Inga routefiler är ändrade, det är PR 3.

### Klart
- **Profil** (`adapters/live/ProfileRepository.ts`):
  - `getOnboardingScript`: frågorna ur i18n per ingång, `suggestedAnswer: null`.
  - `getOnboardingStatus`: läser profilraden via nya `lib/server/onboardingStatus.ts` (delad med Resan). `entry` är `null` tills onboardingen är klar.
  - `completeOnboarding`: en enda `update` med svaren (trimmade, till `role`, `bio`, `time_available`, `money_available`, `risk_appetite`), `onboarding_entry` och `onboarding_completed_at`. Svaren ska vara exakt ingångens frågor, en gång var, 1–1000 tecken. Uppdateringen gäller bara en rad där `onboarding_completed_at is null`: ett andra anrop kastar `OnboardingAlreadyCompletedError` (ny i `core/errors.ts`) och skriver inte över något.
- **Projekt och idé:** `createProject` trimmar, prövar gränserna och gör en `insert` med `is_active: true`. Felkod 23505 från `projects_ett_aktivt_per_user` ger `ProjectExistsError` (ny).
- **Resan:**
  - `getHomeSummary` är byggd: handlingskortet för det aktuella steget, `estimatedTime: ""` och `sinceLastTime: null`.
  - `deriveCurrentStepNumber(completed, onboardingDone)`: steg 1 är klart när onboardingen är klar.
  - Steg 2 heter "Genomlys din idé" för ingång B (`journeySteps.step2Idea`, sv/en) och "Möjligheter" för A.
- **`sinceLastTime: SinceLastTime | null`** i porten och i `AppHomeData`. #36 var redan mergad, så Theo behöver inte rebasa något.
  - `AppHome` visar "Kommer snart" i rutan "Sedan sist" när värdet är `null`, och döljer " · tid" när tiden är tom.
  - Demots Hem fick bara en typvakt och fungerar som förut.
- **`core/onboarding.ts`:** `isValidProfileAnswer`, `isValidProjectInput` och `isOnboardingEntry`. Längden räknas i tecken som Postgres `char_length`, inte i UTF-16-enheter.
- **i18n:** `journeySteps.step2Idea`, `journeyPage.nextStepEyebrowTemplate` och `journeyPage.openStepTemplate` (sv/en).
- **`test/stubs/supabaseFake.ts`:**
  - `update()` och `is()`;
  - `onConflict` med flera kolumner;
  - deklarerade unika index (även partiella) som ger 23505 vid `insert`;
  - genererade id:n;
  - `.single()` även efter en mutation.

  Eget test i `supabaseFake.test.ts`.
- **Tester:**
  - Adaptertester för alla fem metoderna.
  - Kontraktstesterna för Profil, Projekt och Resan körs nu mot live och hoppas inte över.
  - Fem rader är borttagna ur `PARTIELLA_STUBBAR`. Bara `getIdeaScreening` står kvar.
  - Skärm- och ruttester för `sinceLastTime: null`.
- **RLS-testet** (`adapters/live/rls.live.test.ts`, nya `describe("onboardingen")`):
  - B kan inte sätta A:s onboarding-kolumner.
  - B kan inte skapa ett projekt med `user_id = A` (42501).
  - A kan inte ha två aktiva projekt (23505).
  - Databasen avvisar för långt eller tomt namn, för lång ingress, ett svar på 1001 tecken och en okänd ingång (23514).
  - **Kört mot SparkUF2 2026-10-01: 17 av 17 gröna.**
- Moduldokumenten `profil.md`, `projekt-och-ide.md` och `resan.md` är uppdaterade.
- Kontroll: `pnpm typecheck`, `pnpm lint` (0 fel, 3 gamla varningar i `design-referens/`), `pnpm test` (1094 gröna, 40 skippade) och `pnpm build`.

### Kända problem
- **Steg 2 kan inte markeras klart i databasen.** `complete_journey_step` (Theos `20261001150000`) kräver fyra `profileFitAnswer`-bevis för steg 1 och en `journey_steps`-rad för steg 1 innan steg 2 kan bli klart. Onboardingen skriver bara till `profiles`. Appen visar alltså steg 2 som aktuellt, men det går inte att klara. **Rättas i `plattform/steg1-klart`, direkt efter PR 2:** en ny migrering som räknar steg 1 som klart när `profiles.onboarding_completed_at` är satt. Kravet ändras i `journey_step_requirements` och `complete_journey_step`, och `core/journeyRequirements.ts` hålls i synk. **Onboardingen skapar aldrig `profileFitAnswer`-bevis:** det vore påhittade bevis (Datalöftet).
- **`/start/profil` visar nu riktiga frågor men har inget svarsfält.** Rutten anropade redan `getOnboardingScript`, som var en stubbe och visade "Kommer snart". Nu visas frågorna, men inget sparas. Rättas i PR 3 (Theos fritextfält och server actions), som kommer direkt efter.
- **Fynd 5 i källgenomgången** ("Sedan sist" får registrets tagg som standard) syns inte, eftersom `sinceLastTime` är `null`. När Utskick och svar byggs ska Hem-rutten sätta `sourceDataTypes.sinceLastTime` (`"user"` eller `"customer"`). Kommentaren står i `app/(app)/app/page.tsx`.
- **SparkUF2 saknade fyra migreringar** fram till 2026-10-01: `20260930120000`, `20261001120000`, `20261001150000` och `20261001180000`. RLS-testet visade att `journey_steps` och `score_snapshots` gick att skriva direkt. Erik körde dem samma dag och testkonto A städades. Lärdom: kör RLS-testet efter varje migrering.

### Beslut (Erik 2026-10-01)
- Steg 1 räknas klart när `onboarding_completed_at` är satt. Det rättas i en egen migrering och PR (`plattform/steg1-klart`), inte i PR 2.
- `estimatedTime` är `""` i `/app`, och `AppHome` döljer den.
- Ett andra `completeOnboarding` ger `OnboardingAlreadyCompletedError`.
- `sinceLastTime` är `null` tills Utskick och svar finns.
- `/start/profil` rörs först i PR 3.

### Återstår
- **`plattform/steg1-klart`:** migreringen ovan, med pg-test och `core/journeyRequirements.ts`.
  - **Krav från säkerhetsgranskningen (Erik 2026-10-01):** klienten får inte kunna skriva `onboarding_completed_at` eller `onboarding_entry` direkt, varken med kolumnrättigheter eller med en trigger. De ska bara kunna sättas av onboardingflödet. Annars kan vem som helst låsa upp steg 1 och 2 med ett eget PostgREST-anrop när flaggan blir en grind i `complete_journey_step`.
  - I dag skriver `completeOnboarding` kolumnerna med användarens egen `update`. Om rättigheterna stängs måste skrivningen därför flyttas till en databasfunktion, till exempel `complete_onboarding(p_entry, p_answers)` med `security definer`. Den prövar ingången och svaren och skriver svaren, ingången och klar-tiden i en enda transaktion. Liveadaptern anropar sedan funktionen, och felet för en redan klar onboarding behålls.
  - Ett RLS-test i `adapters/live/rls.live.test.ts` ska visa att A inte kan sätta sina egna två kolumner med `update`, men kan klara onboardingen via funktionen.
- **PR 3:**
  - `app/start/actions.ts` (zod);
  - routefilerna under `/start`;
  - spärren i `app/(app)/layout.tsx`;
  - att Pulsen inte kraschar `/app` vid konfigurationsfel;
  - tomt läge för användare utan projekt.
