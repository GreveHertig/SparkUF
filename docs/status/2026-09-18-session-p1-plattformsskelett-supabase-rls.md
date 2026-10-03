## Session P1 — Plattformsskelett: Supabase, RLS, inloggning, fem liveadaptrar

Två PR:ar mot `prototyp`, planerade med planner-agenten och godkända av
grundaren (sex öppna beslut, D1–D6) innan kod skrevs: **PR 1**
(`plattform-p1`, #5) — datamodell, RLS, inloggning. **PR 2**
(`plattform-p1-adaptrar`, gren ur `plattform-p1`) — de fem liveadaptrarna.
`/demo/*` helt orört i båda.

### Klart

- **`supabase/migrations/`:** tolv tabeller (`profiles`, `projects`,
  `journey_steps`, `evidence`, `score_snapshots`, `brain_notes`,
  `trace_events`, `companies`, `outreach_messages`, `responses`,
  `legal_items`, `pulse_signals`), RLS påslaget på alla, policyer
  begränsade till `auth.uid() = user_id` (`companies` är delad
  registerdata, läsbar för alla inloggade, ingen skrivpolicy). Sammansatta
  främmande nycklar `(child_id, user_id) → (id, user_id)` hindrar att en
  rad hängs på någon annans projekt/utskick. En `handle_new_user()`-trigger
  skapar `profiles`-raden automatiskt vid signup. Ett CI-test
  (`supabase/migrations/migrations.test.ts`) hävdar statiskt att varje
  `create table` har en matchande RLS-policy — körbart utan Docker/databas.
  **Migreringarna är INTE körda mot en riktig databas** (ingen Docker i den
  här sandboxen, inget länkat projekt) — se "Beslut nästa session" nedan.
- **Inloggning:** Supabase Auth på `/logga-in` och `/skapa-konto`
  (`app/(auth)/actions.ts`, Server Actions + `useActionState` + zod).
  Fält-/formulärfel returneras som koder, aldrig text
  (`app/(auth)/errorMessages.ts` binder kod → i18n-nyckel med en
  `Record`-typ som failar kompileringen om en ny kod saknar sin nyckel).
  Supabases råa felmeddelanden visas aldrig. Ett upptaget konto vid
  registrering ger AVSIKTLIGT samma "kolla din mejl"-svar som en ny
  registrering (skydd mot kontouppräkning, fixat under den fristående
  säkerhetsgranskningen — se nedan). `?next=` saneras av
  `lib/safeNextPath.ts` (delad med `proxy.ts`).
- **Route-skydd, tre lager** (`docs/arkitektur.md` avsnitt 8): `proxy.ts`
  (Next 16:s ersättning för `middleware.ts`, optimistisk omdirigering +
  sessionsförnyelse), `lib/server/session.ts`s `requireUser()`/
  `requireSupabaseUser()` (bindande, i `app/(app)/layout.tsx` OCH
  `app/start/layout.tsx`), RLS i databasen.
  `components/ui/TextField.tsx` (ny formulärprimitiv, se `DESIGN.md`) och
  en ny `headerRight`-slot i `screens/AppShell.tsx`
  (`components/spark/SignOutButton.tsx`).
- **`core/errors.ts`:** `NotAuthenticatedError` (en adapter kastar,
  navigerar aldrig själv) och `EmptyStateError` + `isPlaceholderError`
  (modulen är byggd men just den här användaren har ingen data än — samma
  "Kommer snart"-yta som `NotImplementedError`).
- **`core/journey.ts`:** delad upplåsningslogik
  (`deriveStepStatus`/`deriveCurrentStepNumber`/`scorePhaseForStep`) och de
  12 stegens metadata (`JOURNEY_STEP_META`, bara siffror — titel/ingress
  ligger i en ny i18n-nyckel, `journeySteps`). **Avsiktligt INTE delad med
  demot** — grundaren bad uttryckligen att `adapters/demo/JourneyRepository.ts`
  inte skulle röras i den här sessionen, så dess lokala `statusFor` är kvar
  och duplicerar samma regel. Se `docs/moduler/resan.md`.
- **Fem liveadaptrar mot Supabase**, alla läser/skriver bara den inloggade
  användarens egna rader via `requireSupabaseUser()` — ingen service-role-
  nyckel används någonstans i P1:
  - **Profil** (påbörjad) — `getProfile` klar. `getOnboardingScript`
    medvetet kvar som stub (olöst designbeslut: Gemini-samtal eller
    fritext).
  - **Projekt och idé** (påbörjad) — `getProject` klar (returnerar `null`
    för inget aktivt projekt). `getIdeaScreening` medvetet kvar som stub
    (i praktiken Medgrundaren/Gemini-analys, porten saknar en skrivmetod).
  - **Resan** (påbörjad) — `getSteps`/`getStepDetail` klara. `getHomeSummary`
    medvetet kvar som stub: `JourneySummary.sinceLastTime` kräver Utskick
    och svar (inte byggd), och "opened" som mätvärde är redan flaggat som
    en olöst GDPR-fråga som P1 inte ska föregripa.
  - **Evidens och poäng** (klar) — `getScoreSnapshot` hämtar `evidence`-
    rader och skickar dem genom `calculateScore` (aldrig egen räkning,
    bevisat med ett test som jämför mot ett direkt `calculateScore`-anrop).
    `getScoreHistory` äkta historik eller tom lista. `getSuggestions`
    returnerar medvetet `[]` — förslagstext är produktinnehåll, inte
    mekaniskt härledbart utan att uppfinna siffror.
  - **Minnet** (klar) — alla fyra metoder, inklusive `setBrainNotes`
    (plattformens första ovaliderade skrivning: längdgräns, ren text,
    skriv-läs-rundtur testad).
  - `ports/stubStatus.test.ts` har en ny `PARTIELLA_STUBBAR`-lista för de
    fyra metoder ovan som medvetet fortsätter kasta `NotImplementedError`
    i en annars påbörjad/klar adapter (P2:s dokumenterade blinda fläck).
- **`test/stubs/supabaseFake.ts`:** en minimal, uttryckligen avgränsad
  fejkad PostgREST-kedja (`select`/`eq`/`order`/`limit`/`maybeSingle`/
  `single`/`insert`/`upsert`, flerkolumns-`order()` som en sammansatt
  nyckel). Alla fem portarnas kontraktstester mockar `@/lib/server/session`
  med den — liveadaptrarna prövas nu på riktigt i CI, utan nätverk.
- **`adapters/live/rls.live.test.ts`** (opt-in, uppgift 6): loggar in som
  två riktiga testkonton och bevisar per användarägd tabell att den ena
  varken kan läsa, ändra, radera eller utge sig för att äga den andras
  rader. Skippar sig självt utan `SUPABASE_TEST_USER_A/B_EMAIL/PASSWORD`
  (alltid i CI) — grundaren kör det manuellt efter `supabase link` +
  `supabase db push`.
- **Granskning:** code-reviewer-agenten (APPROVE, en MEDIUM om att
  uppdatera den här filen — åtgärdas i och med den här commiten) och en
  fristående säkerhetsgranskning (`/security-review`, tre sub-agenter:
  identifiering, false-positive-filtrering) på PR 1:s diff. Tre fynd, alla
  åtgärdade i samma PR (commit `ceeab0c`): kontouppräkning vid registrering
  (ett upptaget konto gav ett skiljbart fel — fixat till samma
  "kolla din mejl"-svar), `app/start/layout.tsx` saknade helt
  `requireUser()` trots att en tidigare commits meddelande påstod att
  `/start` hade samma skydd som `/app`, och en tokenförnyelse i `proxy.ts`
  som bara skrevs till svaret och inte till den inkommande requesten
  (kunde ge en falsk utloggning direkt efter en lyckad förnyelse).
- Verifierat vid varje commit: `pnpm typecheck`/`lint`/`test`/`build` gröna.
  Manuell verifiering (`pnpm build` + `pnpm start` + `curl`): `/app`,
  `/start`, `/start/*` → 307 till `/logga-in?next=...`, `/logga-in`/
  `/skapa-konto` renderar, `/demo/*` helt opåverkat.

### Beslut nästa session behöver känna till

- **Migreringarna är skrivna men inte tillämpade.** Grundaren behöver köra
  `supabase link --project-ref <projekt>` och `supabase db push` (eller
  klistra in SQL-filerna i Supabase-dashboardens SQL-redigerare) innan
  `/logga-in`/`/skapa-konto` fungerar mot en riktig databas, och innan
  `adapters/live/rls.live.test.ts` kan köras. Beslutat med grundaren (D1)
  som ett medvetet avsteg, inte en glömd uppgift.
- **E-postbekräftelse är kvar påslagen i Supabase-projektet** (grundarens
  beslut, D4) — en ny användare får inte en session direkt efter
  `/skapa-konto`, utan ett "kolla din mejl"-läge. Koden hanterar båda
  vägarna (`SignUpForm.tsx`).
- **`core/journey.ts` och `adapters/demo/JourneyRepository.ts` duplicerar
  samma upplåsningsregel med flit** (D3 — grundaren ville inte att demot
  skulle röras). En framtida session kan slå ihop dem genom att låta
  demoadaptern importera `core/journey.ts` i stället för sin lokala
  `statusFor` — inte gjort här.
- **Fyra metoder är medvetna, dokumenterade stubbar** i annars påbörjade/
  klara adaptrar: `ProfileRepository.getOnboardingScript`,
  `ProjectRepository.getIdeaScreening`, `JourneyRepository.getHomeSummary`,
  och (oförändrat sedan tidigare) hela Medgrundaren/Registret/Webbresearch/
  Pulsen/Simuleringar/Utskick och svar/Bygg. Se respektive
  `docs/moduler/<modul>.md` för vad som blockerar varje.
- **`EvidenceRepository.getSuggestions` returnerar `[]`.** Förslagstext
  (förklaring, uppskattad tid per lucka) är skrivet produktinnehåll —
  bygg den tillsammans med en session som faktiskt skriver det innehållet,
  gissa den inte fram mekaniskt.
- **`adapters/live/supabase.live.test.ts` (end-to-end genom adaptrarna,
  inte bara mot rå-klienten) byggdes INTE.** `lib/server/supabase.ts`
  kräver `next/headers`, som inte finns utanför en Next-request — att
  fejka det korrekt är en egen uppgift. `rls.live.test.ts` provar i stället
  databasens RLS-policyer direkt med samma frågor adaptrarna kör, vilket
  bedömdes vara rätt avvägning för uppgift 6.
- **Två PR:ar, `plattform-p1` (#5) och `plattform-p1-adaptrar`** (gren ur
  `plattform-p1`, öppnas som en egen PR när adaptrarna är klara) —
  `plattform-p1-adaptrar`s diff mot `prototyp` innehåller därför båda
  PR:arnas commits tills PR 1 är mergead. Slå ihop PR 1 först för en ren
  diff i PR 2, eller granska PR 2 som "allt ovanpå PR 1".

### Kända problem / medvetna begränsningar

- **En layout re-renderas inte garanterat vid klientsidig navigering
  mellan syskonrutter** (Next-dokumentets egen varning) — `requireUser()`
  i `app/start/layout.tsx` är därför inte en garanti vid varje
  `/start`-undernavigering utan en full sidladdning. Ofarligt i dag
  (`/start` har ingen liveadapter kopplad än), men en framtida session som
  kopplar in `getOnboardingScript`/`getIdeaScreening` bör lägga den
  bindande kontrollen nära datahämtningen också (Next-mönstret "Auth
  checks in page components"), se `docs/arkitektur.md` avsnitt 8.
- **`test/stubs/supabaseFake.ts` kan glida semantiskt från riktig
  PostgREST.** Adapterfrågorna hålls medvetet enkla (en tabell, `eq`/
  `order`, inga joins/RPC:er) för att minska den risken —
  `rls.live.test.ts` är sanningen den dagen det är osäkert.
- Inga nya problem i övrigt. `.mcp.json` (otrackad) rördes inte.

### Återstår (andra sessioner)

- Applicera migreringarna mot en riktig Supabase-databas och kör
  `rls.live.test.ts` manuellt (grundaren).
- De fyra medvetna metod-stubbarna ovan, var och en beror på ett separat
  beslut eller en separat modul (Medgrundaren för profilsamtal/
  idégenomlysning, Utskick och svar för "Vad hänt sedan sist").
- Resten av `/app/*`-sidorna (Resan, Poäng, Marknad, Kunder, Pulsen,
  Minnet, Juridik, Bygg) — portarna och nu fem liveadaptrar finns, men
  ingen route eller skärm är kopplad ihop än utöver Hem.
- Övriga sju moduler (Medgrundaren, Registret, Webbresearch/Pulsen,
  Simuleringar, Utskick och svar, Bygg) — se `docs/uppdrag.md` avsnitt 13
  och `docs/sessioner.md`.
