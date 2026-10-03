## Onboardingens avslutningsreplik (2026-10-02, gren `bygg/onboarding-avslutning`, PR mot `prototyp`)
Rättar det kända problemet från "Onboarding live, PR 3": profilsamtalets avslutningsrepliker visades inte i `/start/profil`, och ingång B:s replik lovade fel nästa steg. Plan godkänd av Theo 2026-10-02.

### Klart
- **`ProfileAnswerForm`** (`screens/blocks/OnboardingForms.tsx`) visar `closingMessage` som en replik från medgrundaren efter sista frågan, före knappen. `completeOnboardingAction` skickar till `/app` direkt efter sparandet, så det finns ingen plats att visa den efteråt. Demots samtal är oförändrat.
- **i18n `onboarding.profileQuestions.*.closingMessage` (sv/en), omskrivna.** Sista meningen namnger det steg som Hem på `/app` visar efter sparandet (`getHomeSummary`): Möjligheter för ingång A, Genomlys din idé för B. Den lovar inget som inte finns. Texterna används bara av liveadaptern; demot har egna.
- **Tester:**
  - `core/onboarding.test.ts`: repliken slutar med titeln på steg 2 för respektive ingång, på båda språken.
  - `screens/OnboardingProfile.test.tsx`: formuläret visar repliken direkt, efter sista frågan och före knappen.
  - `app/start/start.test.tsx`: `/start/profil` visar repliken.
- **Klickat igenom (Playwright, sv/en, 1280 och 390):** `/demo/start/profil` via `/demo/start` (oförändrat) och formuläret med de riktiga i18n-texterna för båda ingångarna, i en tillfällig rutt som inte är committad. Inga konsolfel.
- Kontroll: `pnpm typecheck` (efter `pnpm next typegen` i en ny klon), `pnpm lint` (0 fel, 3 gamla varningar), `pnpm test` (1211 gröna, 42 skippade) och `pnpm build` (med platshållarvärden för `NEXT_PUBLIC_SUPABASE_*`, ingen `.env`-fil).

### Kända problem
- **Inloggningsflödet är provat mot en lokal Supabase, inte mot SparkUF2** (2026-10-03, se nedan). Molnmiljön når varken SparkUF2 eller Vercels förhandsversioner.
- **Hem kraschar för den som har ett projekt när `TAVILY_API_KEY` saknas.** Pulsen kastar konfigurationsfelet med avsikt. Det påverkar inte produktionen så länge nyckeln är satt. Med en nyckel som inte fungerar visar Pulsen tomläget och Hem fungerar.
- `pnpm build` kräver `NEXT_PUBLIC_SUPABASE_URL` och `NEXT_PUBLIC_SUPABASE_ANON_KEY`, och `pnpm typecheck` kräver genererade rutttyper i en ny klon. Bör finnas med när CI sätts upp.

### Provat med inloggning (2026-10-03, efter merge av #53)
`prototyp` (`3976066`) kördes mot en lokal Supabase (`supabase start`) med alla migreringar ur `supabase/migrations/`. Två nya konton skapades via `/skapa-konto`, och Playwright gick igenom flödet. Testmiljön är borttagen efteråt.

| | Ingång A | Ingång B |
|---|---|---|
| Efter signup | `/start` | `/start` |
| Idéformuläret | – | idén sparad som projekt |
| Profilfrågor | 5 fritextfält | 3 fritextfält |
| Repliken före knappen | "… Nästa steg i resan är Möjligheter." | "… Nästa steg i resan är Genomlys din idé." |
| Hem efter sparandet | "STEG 02 · MÖJLIGHETER" | "STEG 02 · GENOMLYS DIN IDÉ" |
| Databasen | `onboarding_entry` och klar-tiden satta, svaren sparade | samma |
| `/start/profil` igen | till `/app` | till `/app` |
| Konsolfel | inga | inga |

Kvar att prova är bara samma flöde mot SparkUF2, för att se att produktionens konfiguration stämmer.

### Beslut (Theo 2026-10-02)
- Repliken står i formuläret före knappen (alternativ A), inte efter sparandet. Det senare skulle kräva att actionen slutar skicka vidare, och layoutspärren kan då skicka till `/app` innan repliken syns.
