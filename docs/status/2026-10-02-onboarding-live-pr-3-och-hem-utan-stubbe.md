## Onboarding live, PR 3 och Hem utan stubbe (2026-10-02, grenarna `plattform/onboarding-live-3` och `fix/hem-utan-stubbe`, PR:er mot `prototyp`)
Tredje PR:en av tre i onboardingen (plan i "Onboarding live, PR 1"). Theos fritextfält fanns inte på någon gren, så formulären byggdes här med Eriks godkännande (2026-10-02). Ändringarna i `screens/` är små, valfria och listade i PR-beskrivningen.

### Klart
- **`/start` skapar projektet och slutför onboardingen:**
  - `app/start/actions.ts` (zod, gränserna ur `core/onboarding.ts`):
    - `createProjectAction` sparar idén som aktivt projekt (`is_active: true` i adaptern). `ProjectExistsError` går vidare med det befintliga projektet och skriver inte över.
    - `completeOnboardingAction` sparar svaren och skickar till `/app`. `OnboardingAlreadyCompletedError` går också till `/app`.
    - Ogiltig indata ger ett felmeddelande i formuläret. Riktiga fel kastas.
  - **Ingången härleds på servern** (`app/start/_lib/entry.ts`): ett aktivt projekt betyder ingång B (tre frågor), annars A (fem). Klienten kan inte välja frågor. Funktionen ligger utanför `actions.ts` med flit, eftersom allt som exporteras därifrån blir en anropbar Server Action.
  - `/start/ide`: utan projekt visas idéformuläret, med projekt genomlysningen (fortfarande "Kommer snart").
  - `/start/profil`: ett fritextfält per fråga.
- **Spärren:**
  - `app/(app)/layout.tsx` skickar en ofärdig onboarding till `/start`.
  - `app/start/layout.tsx` skickar en färdig onboarding till `/app`.
  - Utan session gäller `requireUser` först, så spärrarna kan inte ge en loop.
- **`screens/`:**
  - Nya `screens/blocks/OnboardingForms.tsx` (`ProfileAnswerForm`, `IdeaForm`).
  - Valfria `answerAction` på `OnboardingProfile` och `ideaAction` på `OnboardingIdea`. Utan dem fungerar demot exakt som förut.
  - Ingen ny CSS: `fdd-textarea`, `fdd-input` och `fd-btn`.
- **i18n:** formulärtexterna i `onboarding.profile` och `onboarding.idea` (sv/en).
- **Tester:**
  - `app/start/actions.test.ts` (9).
  - `start.test.tsx`: spärren, idéformuläret, den härledda ingången och fritextfälten.
  - `layout.test.tsx`: ny användare → `/start`, ingen loop utan session, riktigt fel kastas.
- `/security-review`: inga fynd.
- Kontroll: `pnpm typecheck`, `pnpm lint` (0 fel, 3 gamla varningar i `design-referens/`), `pnpm test` (1111 gröna, 40 skippade) och `pnpm build`.

### Kända problem
- **Inte provat i webbläsaren mot SparkUF2.** Ett riktigt konto som går igenom flödet skriver en profil och ett projekt som inte går att göra om. Erik provar med ett nytt testkonto.
- **Ingång A får inget projekt i onboardingen.** Det är enligt planen: projektet kommer i steg 2 (Möjligheter). Pulsen visar ett tomt läge tills dess.
- **Steg 2 kan fortfarande inte markeras klart** tills `plattform/steg1-klart` är gjord (se PR 2, Kända problem).
- **Klienten kan sätta `onboarding_completed_at` direkt** med ett eget PostgREST-anrop och därmed hoppa över spärren för sitt eget konto. Detta fanns före PR 3 och rättas i `plattform/steg1-klart` (kravet från säkerhetsgranskningen 2026-10-01).
- Profilsamtalets avslutningsrepliker (`profileQuestions.*.closingMessage`) visas inte i formuläret. B:s replik säger att genomlysningen kommer härnäst, men på plattformen kommer den före.

### Återstår
- `plattform/steg1-klart` (klar, se nästa avsnitt).
- Idégenomlysningen (`getIdeaScreening`), som väntar på Registret.
