# Modul: Profil

## Syfte

Grundarens person — vem hen är, vad hen kan, hur mycket tid/pengar/riskaptit
hen har. Byggs upp i **01 Om dig** (profilsamtal) och sitter sedan i
sidhuvudet (namn, initialer) samt i Minnets Profilen-flik
(`docs/moduler/minnet.md`, som återanvänder samma underliggande data men via
en egen port). `ProfileRepository` är den smalaste porten i systemet — bara
identiteten, inte bakgrund/resurser (de hör till Minnet).

## Porten

`ports/ProfileRepository.ts`:

```ts
getProfile(): Promise<Profile>
getOnboardingScript(entry: OnboardingEntry, locale: Locale): Promise<OnboardingScript>
getOnboardingStatus(): Promise<OnboardingStatus>          // { entry, completed }
completeOnboarding(input: { entry; answers: OnboardingAnswer[] }): Promise<void>
saveOnboardingAnswer?(answer: OnboardingAnswer): Promise<void>  // v4, bara plattformen
getOnboardingAnswers?(): Promise<Record<string, string>>        // v4, bara plattformen
```

**Onboarding v4 (2026-10-03, spec v4 §4).** Frågorna, valen och kärnfrågorna
står i `core/onboarding.ts` (`ONBOARDING_CHOICES`,
`ONBOARDING_QUESTIONS_BY_ENTRY`). `getOnboardingScript` ger kärnfrågorna med
`kind` och `choices` (etiketter ur `onboarding.v4Questions`). Varje svar sparas
med `saveOnboardingAnswer` (`public.save_onboarding_answer`) i
`profiles.onboarding_answers`. `completeOnboarding` kräver kärnfrågorna och
sätter `onboarding_version = 2`. Fel från databasen: `55000` blir
`OnboardingAlreadyCompletedError` (complete) eller `OnboardingAnswerLockedError`
(save), `22023` blir `OnboardingAnswerInvalidError` (save). En okörd
migrering ger `NotImplementedError`, alltså "Kommer snart". Texten nedan
beskriver version 1 (fritext), vars svar finns kvar för konton med
`onboarding_version = 1`. Beslut: `docs/beslut.md` 2026-10-03.

**Onboarding live (2026-09-30, PR 1 av 3):** `getOnboardingStatus` och
`completeOnboarding` är tillagda. `OnboardingQuestion.suggestedAnswer` är
`string | null`: demot har färdiga svar, plattformen `null` (fritext).
Profilsamtalet i v1 är fasta frågor ur i18n (`onboarding.profileQuestions`),
ingen Gemini. Ingång A får sex frågor, B fyra, en per fält
(`core/onboarding.ts`: `role`, `bio`, `frustrations`, `customer`, `time`,
`money`, `risk`). `frustrations` ("Vad stör du dig på?") ställs bara i A,
`customer` ("Vem tror du skulle köpa? En gissning räcker.") bara i B (beslut
2026-10-02, migreringen `20261002190000_onboarding_nya_fragor.sql`). Svaren
skrivs till profilradens kolumner (`role`, `bio`, `frustrations`,
`customer_guess`, `time_available`, `money_available`, `risk_appetite`).
Minnets Profilen-flik läser de fem första; `frustrations` och
`customer_guess` sparas men visas inte där än (skärmen är Theodors).
`completeOnboarding` sätter också `onboarding_entry` och
`onboarding_completed_at`, via databasfunktionen `public.complete_onboarding`. Steg 1 ("Om dig") räknas som klart
när `onboarding_completed_at` är satt (docs/moduler/resan.md). En framtida
Gemini-version fyller samma fält, så porten behöver inte ändras.

`Profile` (`core/domain.ts`): `{ name: string; initials: string }`.

`getOnboardingScript` (tillagd i Session 5, `docs/status.md`) är profilsamtalets
frågor och klickbara svarsförslag (**01 Om dig**, `/start/profil`) — inte
fritext än. `entry` (`OnboardingEntry`, `core/domain.ts`) väljer hela samtalet
(ingång A) eller det kortare passform-samtalet efter idégenomlysningen
(ingång B, uppdrag 2.1). Skriver inget till `profiles`-tabellen själv — den
riktiga liveadaptern behöver antingen generera frågorna dynamiskt (Gemini,
`CofounderAgent`-mönstret) eller ersätta chippen med fritext, och i båda
fallen till slut spara svaren via en skrivmetod som inte finns än. Flaggat,
inte löst här.

## Datakällor och vad som krävs

- **Supabase**, tabell `profiles` (uppdrag 14.4) — en rad per inloggad
  användare, `user_id` som primärnyckel/foreign key mot `auth.users`. RLS:
  en policy som bara ger användaren åtkomst till sin egen rad
  (`user_id = auth.uid()`).
- Ingen extern tjänst, inget API-nyckelbehov. `getProfile()` läses direkt ur
  Supabase med den inloggade användarens session — ingen `service_role`-nyckel
  behövs för en enkel egen-rad-läsning (den används från klienten via RLS,
  eller från en server component med användarens session).
- Namn och initialer sätts vid registrering/onboarding (**01 Om dig**) —
  ingen extern källa att verifiera mot, det är grundarens egna uppgifter.

## Hur demoadaptern fungerar i dag

`adapters/demo/ProfileRepository.ts` returnerar `saraProfile`
(`adapters/demo/sara.ts`: `{ name: "Sara Lindqvist", initials: "SL" }`) rakt
av — inget läge, ingen `locale` (namnet är detsamma på båda språken).

`getOnboardingScript` returnerar Saras respektive Jonas redan skrivna
frågor/svar (samma innehåll, olika datastruktur, som Saras del av
`cofounderScript.ts`s `"01-om-dig"`) beroende på `entry`.

## Acceptanskriterier

- `getProfile()` returnerar alltid en profil för **den inloggade
  användaren**, aldrig någon annans rad (verifieras av RLS-policyn, inte
  bara adapterkoden).
- `name` och `initials` är alltid ifyllda — en användare utan namn har inte
  slutfört **01 Om dig**, och den sidan visar då ett tomt tillstånd, inte en
  halvfärdig profil.
- Klarar kontraktstestet i `ports/ProfileRepository.contract.test.ts` mot
  BÅDA adaptrarna nu (Supabase mockad bort i CI, `test/stubs/supabaseFake.ts`)
  — kontraktstestet prövar `getProfile`, `getOnboardingScript`,
  `getOnboardingStatus` och `completeOnboarding` per ingång.

## Säkerhet

RLS på `profiles`, policy begränsad till `user_id = auth.uid()`. Inga
hemliga nycklar. Namn är personuppgift — samma raderingskrav som övriga
användardata i Supabase (GDPR, gäller hela plattformen, inte unikt för den
här modulen).

## Status

**Onboarding live, PR 2 (2026-10-01): klar.** Alla fyra metoderna är byggda
i liveadaptern och kontraktstestade mot båda adaptrarna. Migreringen
`20260930120000_onboarding.sql` är körd i SparkUF2.

- `getOnboardingScript`: fasta frågor ur i18n (`onboarding.profileQuestions`),
  `suggestedAnswer: null`. Ingen databas, ingen Gemini.
- `getOnboardingStatus`: `onboarding_entry`/`onboarding_completed_at` på
  profilraden (`lib/server/onboardingStatus.ts`, delad med Resan). `entry`
  är `null` tills onboardingen är klar.
- `completeOnboarding`: anropar `rpc("complete_onboarding", { p_entry,
  p_answers })` med svaren som `{frågans id: svar}`. Funktionen
  (`security definer`, `20261002150000_steg1_onboarding.sql`) prövar
  ingången och att svaren är exakt ingångens frågor, 1–1000 tecken efter
  trim, och skriver svaren, ingången och klar-tiden i en uppdatering. Ett
  andra anrop ger felkod `55000`, som adaptern gör till
  `OnboardingAlreadyCompletedError` (ingen omgörning i v1). Frågorna i
  SQL speglar `PROFILE_QUESTIONS_BY_ENTRY`, vaktat av
  `supabase/migrations/onboardingWrite.pg.test.ts`.
- **Klienten kan inte skriva onboarding-kolumnerna.** `profiles` är stängd
  för `insert` och `delete` (raden skapas av `handle_new_user()` och
  försvinner med kontot), och `update` gäller bara `name`, `initials`,
  `role`, `bio`, `time_available`, `money_available`, `risk_appetite`,
  `customer_guess` och `frustrations`.
  En ny kolumn kräver ett beslut i `supabase/migrations/migrations.test.ts`
  (`PROFILES_CLIENT_WRITABLE` eller `PROFILES_CLIENT_CLOSED`).
- RLS prövat mot riktig databas (`adapters/live/rls.live.test.ts`): varken A
  eller B kan sätta onboarding-kolumnerna, onboardingen går via
  funktionen, steg 2 kan markeras klart efteråt, och databasen avvisar ett
  svar över 1000 tecken och en okänd ingång.

PR 1 (2026-09-30): porten, demoadaptern och migreringen
`20260930120000_onboarding.sql` (inte körd) är klara. Demoadaptern läser och skriver status via `demoStore`, aldrig från en serverrutt.

Tidigare: påbörjad (Session P1, branch `plattform-p1-adaptrar`) — `getProfile` är
klar och testad mot Supabase. `getOnboardingScript` är MEDVETET kvar som
`NotImplementedError`: designbeslutet ovan (Gemini-samtal eller fritext)
är fortfarande olöst, och den här sessionen löser det inte i förbifarten
(`ports/stubStatus.test.ts`s `PARTIELLA_STUBBAR` vaktar att den fortsätter
kasta).

### Hur liveadaptern fungerar i dag

`adapters/live/ProfileRepository.ts`: `getProfile()` läser
`profiles`-radens `name`/`initials` via `requireSupabaseUser()`
(`lib/server/session.ts`) — ingen service-role-nyckel, RLS + användarens
egen session räcker. En `handle_new_user()`-trigger
(`supabase/migrations/20260918090000_profiles_projects_journey.sql`)
skapar raden automatiskt vid signup (namnet kommer från
`auth.users.raw_user_meta_data`, satt av `app/(auth)/actions.ts`s
`signUp()`), så `getProfile()` alltid hittar en rad. Ett tomt eller
saknat namn (kontot har inte gjort **01 Om dig** än) kastar
`EmptyStateError` — samma "Kommer snart"-yta som en obyggd modul, se
`docs/arkitektur.md` avsnitt 4.
