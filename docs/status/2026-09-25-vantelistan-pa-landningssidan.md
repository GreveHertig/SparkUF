## Väntelistan på landningssidan (PR #21 från `landning` mot `prototyp`, väntar på granskning)

PR: https://github.com/GreveHertig/SparkUF/pull/21. Granskare: Erik
(`GreveHertig`) och Theo (`magnussontheodor-max`).
Påverkar varken `main` eller produktion förrän PR:en är mergad.

### Klart
- **`supabase/migrations/20260924120000_waitlist.sql`:** tabellen
  `public.waitlist` med bara `id`, `email` och `created_at`. Villkor i
  databasen: högst 254 tecken, bara gemener, ett @ och en punkt i domänen,
  `unique` på `email`. RLS är på.
  - **Besökare har inga rättigheter på tabellen**
    (`revoke all … from anon, authenticated`, ingen grant).
  - **Enda vägen in är funktionen `public.join_waitlist(p_email text)`:**
    `security definer`, `set search_path = ''`, fullständiga namn,
    `lower(trim(p_email))`, `insert … on conflict (email) do nothing`,
    `returns void`. Samma svar för ny och befintlig adress, och inget id,
    ingen tid och inget antal lämnar databasen.
  - **Rättigheter:** `revoke execute … from public`, `grant execute` bara
    till `anon` och `authenticated`.
  - **Stängd tabell:** `waitlist` står i `CLOSED_TABLES` i
    `migrations.test.ts`. RLS på, inga policyer,
    `revoke all on table … from anon, authenticated`. Vakten kontrollerar
    just det. Beslut Erik 2026-09-25, `docs/beslut.md`.
  - **Varför funktion i stället för direkt insert:** med direkt insert via
    Supabases API svarade databasen 201 för en ny adress och 409 för en som
    redan fanns. Vem som helst med den publika anon-nyckeln kunde då pröva
    vilka adresser som står på listan. Hittat av `/security-review`
    innan migreringen kördes.
- **`app/(marketing)/actions.ts`:** Server Action `joinWaitlist`. Trimmar,
  gör om till gemener, validerar med `zod` och anropar
  `supabase.rpc("join_waitlist", …)`, aldrig tabellen direkt. Varje fel ger
  samma allmänna felkod. Returnerar bara koder, aldrig text.
- **`app/(marketing)/WaitlistForm.tsx`:** ett mejlfält (återanvänder
  `TextField`), en knapp och en GDPR-rad om vad adressen används till. En
  komponent som används två gånger i `page.tsx`, i hero och i den
  avslutande sektionen. Beskriven i `DESIGN.md`.
- **i18n:** `landingPage.waitlist` på svenska och engelska.
- **Kontaktadress för borttagning i GDPR-raden** (`privacyNote`, sv och en):
  `spark.ai.uf@gmail.com`, bestämd av Theo. Den som vill bli borttagen från
  listan mejlar dit. Theo eller Erik tar då bort adressen i Supabase. Är inte
  längre ett hinder för merge.
- **Tester:**
  - `actions.test.ts`: giltig adress går via `join_waitlist` och aldrig
    `from()`, ogiltig adress, dubblett ger samma svar, okänt fel, anropet
    kastar.
  - `supabase/migrations/waitlist.test.ts` (ny, statisk som
    `migrations.test.ts`, läser alla migreringar):
    - Ingen migrering ger `anon` eller `authenticated` någon rättighet på
      tabellen, inte heller med namn utan schema, med citattecken eller via
      `on all tables in schema`.
    - **Varje** definition av `join_waitlist`, också en senare `create or
      replace`, har `security definer`, låst `search_path`, `returns void`,
      `lower(trim(...))` och `on conflict do nothing`. Ingen `alter
      function` på den.
    - `execute` bara för `anon` och `authenticated`.
    - Prövat genom att tillfälligt lägga in fem felaktiga rader i
      migreringen: testet föll varje gång.
  - `WaitlistForm.test.tsx` (sv och en) och en rad i `page.test.tsx`.
  - Supabase är mockad. Ingenting är prövat mot en riktig databas.
- `typecheck`, `lint` (0 fel, samma 3 gamla varningar i
  `design-referens/artefakt/app.js`), `test` och `build` är gröna. `build`
  kräver `NEXT_PUBLIC_SUPABASE_URL` och `NEXT_PUBLIC_SUPABASE_ANON_KEY`;
  utan `.env.local` fallerar `/app` vid förrendering (gäller hela appen, inte
  väntelistan). Kört med platshållarvärden. `/security-review` körd två
  gånger, se ovan.

### Återstår
Ordningen (Eriks beslut 2026-09-25): granska, merga, sedan kör Erik
migreringen.
1. **Granskning av PR #21** (Erik och Theo).
2. **Merge mot `prototyp`.**
3. **Migreringen är körd** (rättat 2026-09-26): `20260924120000_waitlist.sql`
   kördes mot SparkUF2 den 26/9 och är verifierad: RLS på, inga policyer,
   anon kan varken göra insert eller select på tabellen, och anon kan köra
   `join_waitlist`. Kör **inte** `supabase db push`: den skulle också köra
   `registry_cache`, som väntar på §6 fråga 4.
4. **Prova skarpt efter migreringen:** skicka formuläret med riktiga
   Supabase-nycklar, pröva att direkt `POST /rest/v1/waitlist` med
   anon-nyckeln ger "permission denied", och att `rpc/join_waitlist` svarar
   likadant två gånger med samma adress.
- **Bekräftelsemejl (dubbel opt-in)** ingår inte och kommer i en egen PR.

### Kända problem
- **Inget spamskydd.** Vem som helst med den publika anon-nyckeln kan anropa
  `join_waitlist` i en loop och fylla listan med skräp, också utan att gå
  via formuläret. Databasen stoppar bara ogiltiga adresser och dubbletter.
  Okej för en väntelista nu. Senare: ett spärrmönster (rate limit per IP i
  Server Action, och att dra in `execute` från `anon` så att bara servern
  anropar funktionen) eller en CAPTCHA.
- **"Invalid Server Actions request" när formuläret skickas via
  Codespaces-adressen (`*.app.github.dev`). Inte löst, och ska inte lösas
  här.** Orsak (återskapad med curl): Next.js jämför `Origin`-headern
  (Codespaces-adressen) med `x-forwarded-host`, som Codespaces sätter till
  `localhost:3000`. De skiljer sig, så Next.js avbryter anropet som skydd mot
  CSRF. Beslut (Oskar): lägg **inte** in `allowedOrigins`. Formuläret testas
  på Vercels förhandsadress för `landning` eller efter att migreringen är
  körd.
  **Ändrat 2026-09-26 (gren `landning-ny-startsida`, Eriks beslut, behöver
  Oskars ok i PR:en):** `next.config.ts` lägger in `allowedOrigins`
  (`localhost:3000`, `localhost:3200`, `*.app.github.dev`) **bara när
  `CODESPACES` är satt**. På Vercel är variabeln inte satt, och där gäller
  Nexts CSRF-skydd oförändrat.

### Beslut nästa session behöver känna till
- **`waitlist` är en stängd tabell i `CLOSED_TABLES`** (Erik 2026-09-25,
  `docs/beslut.md`), samma mönster som `registry_cache`. Den tidigare
  `using (false)`-policyn är borttagen. För att få `CLOSED_TABLES` mergades
  `origin/prototyp` in i `landning`.
- **Supabases Security Advisor kommer att varna för `join_waitlist`**
  ("security definer function executable by anon/authenticated", lints
  0028/0029). Det är avsiktligt: funktionen är den enda vägen in på listan
  och kan bara lägga till en normaliserad adress. Stäng inte av
  `execute` för `anon` och gör inte om den till `security invoker` utan att
  lösa väntelistan på annat sätt, annars slutar formuläret fungera eller
  läckan öppnas igen.
- **Avsteg från RLS-mönstret "egen data":** besökaren är inte inloggad och
  har inget `user_id`. Det ersätts av inga rättigheter på tabellen och en
  `security definer`-funktion som enda väg in. Godkänt av Oskar.
- **Grenen heter `landning`,** inte `prototyp-landning`. Den gamla grenen
  ligger 98 commits efter `prototyp` och är redan inslagen.
- **Produktion deployas från `main`.** Det finns ingen deploykonfiguration i
  repot. Enligt GitHubs deploy-historik bygger Vercel Production från `main`
  och en Preview för varje push till andra grenar, så `landning` får en egen
  förhandsadress.
