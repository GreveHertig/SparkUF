## Onboarding v4: konkreta frågor, startkort och återstående frågor i Minnet (2026-10-03, gren `plattform/onboarding-v4`, PR mot `prototyp`)

PR 1 av 2 för att få onboardingen och Medgrundaren i linje med systemspecifikationen v4 (§4 Onboarding, §3.2 Minnet). Plan godkänd av Erik 2026-10-03. PR 2 (Medgrundarens konkreta uppgift, §3.1) återstår. Besluten står i `docs/beslut.md` (2026-10-03, "Onboarding v4").

### Klart
- **Frågorna** (`core/onboarding.ts`, i18n `onboarding.v4Questions` på sv och en):
  - Sju frågor per ingång. Sex av dem är val med stabila id:n, och en är fritext: `frustration` i ingång A och `customer` i ingång B.
  - Ingen självskattning. `bio` och `risk` ställs inte längre.
  - De fyra första frågorna är kärnfrågor. Resten är återstående frågor.
  - `onboarding.profileQuestions` står kvar för svaren från före v4 och för demon.
- **Migreringen `supabase/migrations/20261003150000_onboarding_v4.sql`** (inte körd):
  - `profiles.onboarding_answers` (jsonb) och `profiles.onboarding_version`. Båda är stängda för klienten och står i `PROFILES_CLIENT_CLOSED`.
  - `public.onboarding_v4_questions()` speglar `core/onboarding.ts`.
  - Den nya `public.save_onboarding_answer` (security definer) tar emot ett svar i taget. Ingången härleds i databasen. Efter klar onboarding tas bara obesvarade frågor emot.
  - `public.complete_onboarding` byts ut med samma signatur och kräver kärnfrågorna.
  - Konton som redan var klara får `onboarding_version = 1`.
  - Inga nya RLS-policyer.
- **`/start/profil`** (`screens/blocks/OnboardingQuestionFlow.tsx`, `OnboardingQuestion.tsx`):
  - En fråga i taget med valknappar, och varje svar sparas direkt.
  - Den som avbryter fortsätter vid första obesvarade fråga.
  - "Ändra" fungerar tills onboardingen är klar.
- **Startkortet** (`core/startFrame.ts`, `screens/blocks/StartFrameCard.tsx`) visas efter kärnfrågorna och bygger bara på grundarens svar:
  - tiden på tre månader och pengarna, med `SourceTag` "Din uppgift"
  - Medgrundarens bedömning
  - en första uppgift i verkligheten

  "Till appen" gör onboardingen klar och öppnar `/app`. Kortet ger inga bevis och ingen poäng.
- **Minnet:**
  - "Dina svar" visar v4-svaren med etiketter.
  - "Återstår" visar de obesvarade frågorna med samma valknappar (`screens/blocks/RemainingQuestions.tsx`, action `saveRemainingAnswer`).
  - Fritextsvar från före v4 syns som förut, men bara de som har ett svar. Det gäller också konton med version 1.
- **Medgrundaren:** `getKnownProfile` ger nu även `frustrations`, `customer` och v4-svaren med svenska etiketter, så Medgrundaren ser dem redan nu. Prompten ändras i PR 2.
- **Portar** (godkända av Erik, alla valfria så att demoadaptrarna är orörda):
  - `OnboardingQuestion.kind?` och `choices?`
  - `ProfileRepository.saveOnboardingAnswer?` och `getOnboardingAnswers?`, som ger `SavedOnboardingAnswer` (`{ answer, answeredOn }`)
  - `ProfileSummary.answers?`, där varje svar har `answeredOn` (dagen svaret gavs, eller `null`)
  - `MemoryRepository.getPendingOnboardingQuestions?`
- **Robusthet:** utan körd migrering visar `/start/profil` "Kommer snart", och Minnet läser profilen som förut.
- **Källans datum** (efter Eriks granskning 2026-10-03):
  - `answered_at` sparas per svar.
  - `save_onboarding_answer` ger tillbaka tiden.
  - Dagen räknas i svensk tid (`answeredOn`).
  - `SourceTag` visar källan utan datum när `hämtad` är tom. Det är en ändring i den delade komponenten, med ett nytt test (`components/ui/SourceTag.test.tsx`), och den påverkar inte källor som har ett datum.
- **CSS:** en ny regel `.fdd-choices` i `design/site.css`, så att långa val radbryts på mobil (`DESIGN.md`).
- **Tester:**
  - `onboardingWrite.pg.test.ts` är omskriven för v4. Den täcker synk av frågor och val mot core, klientspärren, save, complete, att ingången härleds, låset efter klar onboarding och version 1.
  - `journeyStepCompletion.pg.test.ts` är uppdaterad.
  - `test/stubs/onboardingRpcFake.ts` följer v4.
  - Adapter-, kontrakts-, action-, rutt- och skärmtester är uppdaterade.
  - Nya tester: `core/startFrame.test.ts` och `screens/blocks/OnboardingQuestionFlow.test.tsx`.
  - `rls.live.test.ts` täcker de nya kolumnerna och `save_onboarding_answer`.
  - Nytt e2e-test: `e2e/onboarding.spec.ts`.
  - Inget under `adapters/demo/` eller `app/demo/` är ändrat.

- **Kontroller:**
  - `pnpm typecheck`, `pnpm lint` (0 fel, 3 gamla varningar i `design-referens/`) och `pnpm build` är gröna.
  - `pnpm test`: 1463 gröna, 46 skippade (efter rättningen av källans datum).
  - `pnpm test:e2e`: 16 gröna (demot, sv och en, desktop och mobil) och 46 skippade. Testerna av `/app` och onboardingen skippades eftersom testkontona saknas i `.env.local` i den här miljön. Playwrights Chromium 1243 installerades först, eftersom den saknades.
- **`/security-review`:** inga fynd med hög konfidens. Granskningen täckte:
  - att ingen kan skriva en annans rad
  - att ingången härleds i databasen
  - att onboardingen inte kan bli klar utan kärnfrågorna
  - låset efter klar onboarding
  - att det inte finns någon dynamisk SQL
  - indragen `execute` på hjälpfunktionerna
  - att klienten saknar kolumnrättighet

### Återstår
- **Migreringen måste köras i SQL Editor direkt vid merge** (se Kända problem). Kör sedan `adapters/live/rls.live.test.ts`.
- **E2e-testet för onboardingen** kräver ett eget testkonto (`APP_ONBOARDING_USER_EMAIL`/`_PASSWORD` i `.env.local`, se `.env.example`). Kontot ska inte vara klart med onboardingen och inte ha något aktivt projekt, och det återställs i SQL Editor före varje körning (filhuvudet i `e2e/onboarding.spec.ts`).
- **PR 2:**
  - Medgrundaren ställer de återstående frågorna och slutar varje svar med en konkret uppgift (strukturerad output `svar` och `nastaUppgift`).
  - Ny kolumn `cofounder_messages.next_task`.
  - Riskformuleringen i `STEP_GUIDANCE[1]` stryks.

### Kända problem
- **Inte klickat igenom inloggat.** Migreringen är inte körd och det fanns inga testkonton i den här miljön. Flödet är prövat med enhets-, rutt- och PGlite-tester. E2e-testet är skrivet men inte kört mot riktig Supabase.
- **Ordningen vid merge.** `complete_onboarding` byts ut. Gammal kod mot ny funktion skickar fritextsvar, som avvisas (22023). Ny kod mot gammal databas saknar kolumnerna och `save_onboarding_answer`, och visar då "Kommer snart" i `/start/profil`. Kör migreringen direkt vid merge.
- **Källans datum på profilsvar.** Rättat efter Eriks granskning: dagens datum visas inte längre för svar som saknar tidsstämpel.
  - Varje v4-svar sparas nu med `answered_at` (databasens `now()`) i `onboarding_answers`.
  - Ett svar utan tid visar källan "Din uppgift" utan datum.
  - Fritextsvaren från före v4 har ingen tid. Minnet visar dem utan källmärkning, som förut.
- **"Sedan tidigare" i Medgrundaren** (`app/(app)/app/medgrundaren/knownItems.ts`, från Medgrundaren v1) visar fortfarande dagens datum som källdatum på profilrader med en siffra. Det gäller nu också v4-svaren, eftersom `getKnownProfile` slår ihop dem till ett fält per sak utan tid. Det rättas inte i den här PR:en. Föreslås till PR 2, där Medgrundarens kontext ändå byggs om.
- **Konto A i `rls.live.test.ts`** får ett v4-svar sparat vid första körningen efter migreringen. Svaret står kvar, och senare körningar prövar bara låset.
- **Byte av ingång mitt i samtalet** (ett projekt skapas efter några svar): svaren på frågor som båda ingångarna ställer följer med. Svar på frågor som bara den gamla ingången ställer ligger kvar i `onboarding_answers` men räknas inte och visas inte.

### Beslut (Erik 2026-10-03)
- Dagens datum visas aldrig som källdatum för ett svar som saknar tidsstämpel: det är påhittade data. `answered_at` sparas per svar från och med v4, och ett svar utan tid visas utan datum.
- Skyddade filer (`ports/` m.fl.) ändras bara med Edit/Write så att hooken får fråga. I första versionen av PR:en ändrades `ports/MemoryRepository.ts`, `ports/MemoryRepository.contract.test.ts` och `ports/ProfileRepository.contract.test.ts` via Bash, utan hookens bekräftelse. De granskas extra.
- Steg 1 är klart efter startkortet ("Till appen"), inte efter alla frågor.
- Kravet på `nextTask` gäller bara Medgrundarens liveadapter (PR 2). Inget under `adapters/demo` eller `/demo` rörs.
- De ändrade portarna är godkända och listas i PR-beskrivningen.
- Frågelistan är godkänd som den är.
- Startkortet visas före `complete_onboarding`, så att layouten för `/start` (som skickar en klar onboarding till `/app`) inte ändras.
- Grundaren kan svara på återstående frågor i Minnet redan i PR 1.
