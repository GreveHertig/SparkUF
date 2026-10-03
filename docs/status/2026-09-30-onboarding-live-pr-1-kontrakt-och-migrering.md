## Onboarding live, PR 1: kontrakt och migrering (gren `plattform/onboarding-live`, PR mot `prototyp`)
Vecka 1 i lanseringsplanen: inloggning, profil och projekt live. Plan i tre PR:er, godkänd av Erik 2026-09-30. PR 1 lägger portar, demoadaptrar, kontraktstester, frågorna och migreringen. Ingenting ändras för en användare än.

### Klart
- **Portar.** `ProfileRepository`: `getOnboardingStatus()` → `{ entry, completed }` och `completeOnboarding({ entry, answers })`. `OnboardingQuestion.suggestedAnswer` är `string | null` (demo: färdigt svar, plattform: fritext). `ProjectRepository`: `createProject({ name, oneLiner })`.
- **`core/onboarding.ts`:** frågornas id:n (`role`, `bio`, `time`, `money`, `risk`), vilka varje ingång ställer (A fem, B tre) och längdgränserna (svar ≤ 1000, projektnamn ≤ 80, ingress ≤ 280).
- **i18n:** `onboarding.profileQuestions` på sv och en. **Formuleringarna är förslag som Theo godkänner i granskningen.**
- **Demoadaptrar:** onboardingstatusen går via `demoStore`. Den får bara användas av demot och tester, aldrig från en serverrutt (kommentar i adaptern). Demot sparar inga svar. `createProject` speglar indata och sparar inget.
- **Liveadaptrar:** de nya metoderna kastar `NotImplementedError` och står tillfälligt i `PARTIELLA_STUBBAR`. De byggs i PR 2.
- **Kontraktstester:** `getOnboardingScript` och `completeOnboarding` per ingång, samt `createProject`. De körs mot demo och hoppas över mot live tills PR 2.
- **Migrering `20260930120000_onboarding.sql` (skriven, INTE körd):**
  - `profiles.onboarding_entry` och `onboarding_completed_at`;
  - check-villkor på längd och giltig ingång;
  - villkor på `projects.name` och `one_liner`;
  - trigger `set_updated_at` på `profiles`, `projects` och `journey_steps`.

  Inga nya tabeller eller policyer, eftersom RLS redan ger insert och update på egna rader. Hela filen körs i en transaktion. Vakten `supabase/migrations/onboarding.test.ts` låser att gränserna är desamma som i `core/onboarding.ts`.
- **Två skärmar fick en vakt för `suggestedAnswer === null`:** `screens/OnboardingProfile.tsx` och `app/demo/start/profil/page.tsx`. Bara typer, ingen markup och ingen stil. Fritextfältet bygger Theo.
- Kontroll: `typecheck`, `lint` (0 fel, 3 gamla varningar i `design-referens/`), `test` (636 gröna, 40 skippade), `build`.

### Innan migreringen körs (Erik)
Kör kontrollfrågan i filhuvudet i SQL Editor. Den ska ge 0 rader. Den visar profiler med ett svarsfält över 1000 tecken och projekt vars namn eller ingress är tomma eller för långa (kvarlämnade `rls-test-…`-projekt klarar gränserna). Rensa eller korta de rader den visar. Kör sedan filen. Den körs i en transaktion, så ett fällt villkor lämnar ingenting halvt.

### Återstår
- **PR 2:**
  - liveadaptrarna (`getOnboardingScript`, `getOnboardingStatus`, `completeOnboarding`, `createProject`, `getHomeSummary`);
  - `deriveCurrentStepNumber` med `onboardingDone`;
  - `sinceLastTime: SinceLastTime | null` (görs efter Theos PR 3, som skriver om samma rader);
  - `update()` i `test/stubs/supabaseFake.ts`;
  - RLS-testet;
  - Pulsens tomläge utan projekt och att ett konfigurationsfel i Pulsen stannar i Pulsens ruta.
  - Kräver att migreringen är körd.
- **PR 3:**
  - `app/start/actions.ts` (zod);
  - routefilerna under `/start`;
  - spärren i `app/(app)/layout.tsx`, med tester för ny användare → `/start`, färdig användare på `/start` → `/app` och ingen loop utan session.
  - Mergas efter Theos PR 3 och tillsammans med hans skärmar.

### Beslut (Erik 2026-09-30)
- Steg 1 markeras klart på `profiles`, inte i `journey_steps`, eftersom ingång A inte har något projekt.
- Ingång B:s nästa steg är steg 2 "Genomlys din idé".
- A får fem frågor, B tre.
- `/start` skickar vidare till `/app` efter avslutad onboarding. Ingen omgörning i v1.
- Fel i en modul stannar i modulens ruta på Hem. Ingen demodata som fallback i `/app`.
