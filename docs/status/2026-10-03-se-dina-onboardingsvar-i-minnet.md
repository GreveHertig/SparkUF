## Se dina onboardingsvar i Minnet (2026-10-03, gren `plattform/minnet-onboardingsvar`, PR mot `prototyp`)
Grundaren ska kunna se vad hen svarade i onboardingen. Tidigare kastade `liveMemoryRepository.getProfileSummary` `EmptyStateError` om något av de sex fälten saknades, så användare från ingång B (som bara svarar på role, time och money) såg ingenting i Profilen-fliken. Plan godkänd av Erik 2026-10-03.

### Klart
- **Porten** (`ports/MemoryRepository.ts`): `ProfileSummary` har fälten `string | null` och ett nytt fält `entry: OnboardingEntry`. Ingen migrering.
- **Liveadaptern** läser också `onboarding_entry` och `onboarding_completed_at`. `EmptyStateError` bara om onboardingen inte är klar. Annars blir varje saknat eller tomt fält `null`.
- **Demoadaptern:** bara `entry` är tillagt. Jonas behåller `bio` och `risk` (demot är fryst).
- **Profilfliken** (`screens/Memory.tsx`): panelerna Bakgrund (role, bio) och Resurser (time, money, risk) visar frågetexten från `onboarding.profileQuestions[entry]` och svaret. En obesvarad fråga visas som "Inte besvarat än" (ny `memoryPage.notAnswered`, sv/en) med ingång A:s formulering, eftersom ingång B saknar text för bio och risk. Rubriken tål att namn eller roll saknas.
- **Länken "Se dina svar"** (ny `common.seeYourAnswers`, sv/en): bara i `/app`, på Hem under stegraden och på Resan under steg 1:s kort, till `/app/minnet` (Profilen är standardfliken). Prop `profileAnswersHref` som routen skickar. Layouten släpper bara in den som är klar med onboardingen, så länken visas alltid där. Demots rutter skickar `null`.
- **Tester:** kontraktstestet (fixtur från ingång B; text eller null, aldrig tom text), `adapters/live/MemoryRepository.test.ts` (ingång B, ej klar onboarding, tomma strängar), `adapters/demo/entrySwitch.test.ts` (Jonas behåller bio och risk), `screens/Memory.test.tsx`, `screens/AppHome.test.tsx`, `screens/Journey.test.tsx` och `app/(app)/app/minnet/page.test.tsx`.

### Kontrollerat
- `pnpm typecheck`, `pnpm lint` (0 fel, 3 gamla varningar), `pnpm test` (1219 gröna, 42 skippade) och `pnpm build` gröna. `/security-review`: inga fynd.
- `handle_new_user()` fyller `name` och `initials` vid signup ur `raw_user_meta_data.name`, som skapa konto-actionen alltid skickar (minst två tecken). `name` är alltså inte alltid tom i live; den är tom bara för konton skapade utan metadata, till exempel i Supabase-dashboarden. Ingen bugg; skärmen hanterar `null`.

### Återstår
- Redigering av svaren kommer i spec v4.

### Kända problem
- Inte klickat igenom i webbläsaren mot SparkUF2 (inga nycklar i miljön).

### Beslut (Erik 2026-10-03)
- Demot ändras inte för Jonas: bara liveadaptern ger null-fält.
- Länken "Se dina svar" finns bara i `/app`, inte i demot.
- Profilfliken får ändras i demot eftersom skärmen är delad. Den visar nu fråga och svar för Sara och Jonas. Theo måste godkänna det (står i PR-beskrivningen).

### Tillägg efter merge av #54 och #58 (2026-10-03)
- `prototyp` fick #54 (frågorna `frustrations` för ingång A och `customer` för B) och #58 (Hems knapp länkar till steget). Konflikterna i `app/(app)/app/page.tsx` och `screens/AppHome.test.tsx` löstes genom att behålla båda sidor (`nextStepHref` och `profileAnswersHref`).
- `ProfileSummary` får de valfria fälten `frustrations` och `customer`. Liveadaptern läser `frustrations` och `customer_guess`. Demoadaptern skickar dem inte, så demot som Theo godkände ser likadant ut. Skärmen visar en fråga bara om fältet finns. En fråga som ingången inte ställer får den andra ingångens formulering, som en lucka. Beslut Erik 2026-10-03.
