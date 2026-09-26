# Arkitektur: en kodbas, två lägen

Skrivet i Session A. Beskriver hur `/demo` och `/app` delar samma skärmar men
får sin data från olika adaptrar, enligt principen i `docs/uppdrag.md` avsnitt
14. Sökvägarna nedan är de faktiska i repot (inget `src/`-prefix, se
`docs/status.md`).

## 1. Principen

Skärmar (`screens/`) vet aldrig varifrån datan kommer. De tar emot redan
hämtad, redan språkvald data som props. Vem som hämtade den datan — en
**demoadapter** (statisk scenariodata) eller en **liveadapter** (Supabase,
Gemini, Tavily, registerkällor) — avgörs av den tunna route-filen som
monterar skärmen, inte av skärmen själv.

```
Route (app/demo/(app)/page.tsx, /demo) Route (app/(app)/app/page.tsx, /app)
        │                                       │
        ▼                                       ▼
adapters/demo/JourneyRepository.ts     adapters/live/JourneyRepository.ts
        │  implementerar                        │  implementerar
        ▼                                       ▼
        └──────────► ports/JourneyRepository.ts ◄──────────┘
                    (TypeScript-gränssnitt,
                     ingen implementation)
                              │
                              ▼
                    screens/AppHome.tsx
                 (tar emot data som props,
                  vet inte varifrån den kom)
```

Samma mönster upprepas för alla 12 portarna i avsnitt 2. Bara
`JourneyRepository`, `EvidenceRepository`, `ProfileRepository` och
`PulseProvider` har en skärm som faktiskt använder dem hittills (Hem-skärmen,
`screens/AppHome.tsx` + `screens/AppShell.tsx`). Övriga åtta är deklarerade
med en fungerande demoadapter och en stubbad liveadapter, redo för
kommande sessioner.

## 2. Faktiska sökvägar

| Del | Sökväg | Innehåll |
|---|---|---|
| Domäntyper och ren logik | `core/domain.ts`, `core/errors.ts` | Delade typer (`Profile`, `ScoreSnapshot`, `NextStep`, `SinceLastTime`, `PulseSignal`) samt `NotImplementedError`. Återexporterar `types/evidence.ts`, `types/legal.ts` och `types/bygg.ts` oförändrade — de filerna fanns innan sessionerna och flyttas inte. `calculateScore` och resans upplåsningslogik läggs här i Session 2. |
| Portar | `ports/*.ts` | Ett TypeScript-gränssnitt per modul, se tabellen i avsnitt 3. Inga implementationer. |
| Demoadaptrar | `adapters/demo/*.ts` | Implementerar portarna med statisk scenariodata. `adapters/demo/sara.ts` håller Saras data (migrerad från den tidigare `app/(app)/sara-mock.ts`, som är borttagen). |
| Liveadaptrar | `adapters/live/*.ts` | Implementerar portarna. Alla kastar i dag `NotImplementedError` — se avsnitt 4. |
| Delade skärmar | `screens/AppHome.tsx`, `screens/AppShell.tsx` | Tar emot data via props, ingen kunskap om demo/live. |
| Formgivet "kommer snart" | `components/ui/ComingSoon.tsx` | Visas av en route i stället för ett fel när en liveadapter kastar `NotImplementedError`. |
| Demoroute | `app/demo/**` (`layout.tsx`, `(app)/layout.tsx`, en sida per vy) | Demot på `/demo` (sedan 2026-09-26, se nedan). Sidorna anropar demoadaptrarna via portarna och har egen markup och egna stilar (`design/site.css`). De monterar **inte** skärmarna i `screens/`. |
| Plattformsroute | `app/(app)/layout.tsx`, `app/(app)/app/page.tsx` | Monterar samma skärmar med liveadaptrarna på `/app`. |

## 3. Modulerna (avsnitt 14.3)

| Modul | Port | Liveadapter bygger på | Status | Moduldokument |
|---|---|---|---|---|
| Profil | `ProfileRepository` | Supabase | påbörjad (P1) | `docs/moduler/profil.md` |
| Projekt och idé | `ProjectRepository` | Supabase | påbörjad (P1) | `docs/moduler/projekt-och-ide.md` |
| Resan | `JourneyRepository` | Supabase | påbörjad (P1) | `docs/moduler/resan.md` |
| Evidens och poäng | `EvidenceRepository` | Supabase | klar (P1) | `docs/moduler/evidens-och-poang.md` |
| Minnet | `MemoryRepository` | Supabase | klar (P1) | `docs/moduler/minnet.md` |
| Medgrundaren | `CofounderAgent` | Gemini | stub | `docs/moduler/medgrundaren.md` |
| Registret | `RegistryProvider` | Bolagsverket, SCB (`lib/server/scb.ts`, `bolagsverket.ts`, oskrivna; grindad via `lib/server/registryAccess.ts`) | påbörjad, grindad | `docs/moduler/registret.md` |
| Webbresearch | `ResearchProvider` | Tavily | stub | `docs/moduler/webbresearch-och-pulsen.md` |
| Pulsen | `PulseProvider` | Tavily | stub | `docs/moduler/webbresearch-och-pulsen.md` |
| Simuleringar | `SimulationProvider` | Hiasynth (koncept, alltid stub) | stub | `docs/moduler/simuleringar.md` |
| Utskick och svar | `OutreachProvider` | Gmail. **Sändning avstängd** (kräver uttryckligt ja från Theodor och grundaren) | stub, avsiktligt | `docs/moduler/utskick-och-svar.md` |
| Utskick, förberedelse | `OutreachPrep` (mejlsökning, utkast) | Tavily + Gemini (`lib/server/tavily.ts`; grindad via `lib/server/outreachAccess.ts`) | byggd, grindad | `docs/moduler/utskick-och-svar.md` |
| Domen | `VerdictProvider` | Ren logik i `core/verdict.ts` (Utskick + Registret som indata, inte live) | påbörjad (logik + demo klara, live stub) | `docs/moduler/domen.md` |
| Juridisk koll | `LegalAdvisor` | Gemini + kuraterade källor | klar (ej sakgranskad) | `docs/moduler/juridisk-koll.md` |
| Bygg | `BuildProvider` | Lovable (koncept, alltid stub) | stub | `docs/moduler/bygg.md` |

Varje modul har fortfarande en fungerande demoadapter i `adapters/demo/`
(`adapters/demo/<Modul>.ts`) — tabellen ovan visar bara liveadapterns
status, se avsnitt 2 för sökvägarna. "Påbörjad" betyder att en eller flera
metoder i porten fortfarande är en medveten `NotImplementedError`-stub —
`ports/stubStatus.test.ts`s `PARTIELLA_STUBBAR` vaktar exakt vilka.

`docs/moduler/*.md` finns nu för alla 12 moduler (skrivna i Session P2,
avsnitt 14.5, med `docs/moduler/juridisk-koll.md` som förebild).

## 4. Hur en liveadapter kastar sitt fel

```ts
// adapters/live/ProfileRepository.ts
import type { ProfileRepository } from "@/ports/ProfileRepository";
import { NotImplementedError } from "@/core/errors";

const DOC = "docs/moduler/profil.md";

export const liveProfileRepository: ProfileRepository = {
  async getProfile() {
    throw new NotImplementedError("Profil", DOC);
  },
};
```

Den anropande routen fångar felet och visar `<ComingSoon />` i stället för
att låta det nå gränssnittet (avsnitt 5.4, 14.4 — "Tomma tillstånd"). Se
`app/(app)/app/page.tsx` och `app/(app)/layout.tsx` för mönstret: all
datahämtning sker i ett `try/catch` innan någon JSX konstrueras (ESLint-regeln
`react-hooks/error-boundaries` tillåter inte JSX inuti `try/catch`).

**Session P1 lade till ett andra "inget att visa än"-fel:**
`EmptyStateError` (`core/errors.ts`) — kastas av en KLAR liveadapter när
den inloggade användaren själv inte har någon data än (t.ex. ett nytt
konto utan bevis). Skiljer sig från `NotImplementedError` (modulen är inte
byggd) genom att modulen ÄR byggd, bara den här användarens rad(er)
saknas. Route-filerna fångar båda via en delad hjälpare,
`isPlaceholderError(error)`, och visar `<ComingSoon />` för båda — ett
tredje, oväntat fel (t.ex. ett nätverksfel mot Supabase) kastas fortfarande
vidare, aldrig tyst till "Kommer snart".

## 5. Byta en stub mot en riktig adapter

Fullständig steg-för-steg-guide (branch, kontraktstest, tre testlager,
nycklar, granskning, dokumentation): `docs/bygga-en-modul.md`. I korthet:
läs `docs/moduler/<modul>.md` och `ports/<Modul>.ts`, implementera i
`adapters/live/<Modul>.ts` med nycklar bara i `lib/server/`, rör aldrig
`screens/` eller route-filerna (så snart adaptern slutar kasta
`NotImplementedError` försvinner `ComingSoon` av sig själv), och kör
`/security-review` innan sessionen avslutas.

## 6. Importkontroll: demon får aldrig importera liveadaptrar

`eslint.config.mjs` har en `no-restricted-imports`-regel för
`app/demo/**/*.{ts,tsx}` och `adapters/demo/**/*.{ts,tsx}` som blockerar all
import från `@/adapters/live/*`. Verifierad manuellt under Session A genom att
tillfälligt lägga en sådan import i en testfil under `app/demo/` och
bekräfta att `pnpm lint` fångar den (testfilen togs bort igen, ingår inte i
committen).

## 7. Kända avgränsningar från Session A

- **Locale hanteras olika i demo och live.** Demot är helt frontend (ingen
  backend, se `docs/uppdrag.md` avsnitt 3) och har fabricerat
  scenarioinnehåll på båda språken (`adapters/demo/sara.ts`). Portmetoder som
  returnerar text (`JourneyRepository.getHomeSummary`,
  `EvidenceRepository.getScoreSnapshot`, `PulseProvider.getTodaysSignal`,
  `CofounderAgent.sendMessage`) tar därför emot `locale: Locale` så att
  demoadaptern kan välja rätt språkvariant. Live data är grundarens egen,
  inte förövers på båda språken i förväg — `locale`-parametern är ändå med i
  kontraktet eftersom framtida Gemini-svar (Medgrundaren, Juridisk koll)
  rimligen ska komma på användarens språk.
- **`/app`s sidhuvud visar en neutral platshållare** (`—`/`—`, ingen
  poängbricka) tills `ProfileRepository` respektive `EvidenceRepository` är
  byggda live, i stället för att hela `/app` visar "Kommer snart". Det gör
  det synligt när en enskild adapter blir klar, innan alla är det.
- **Demot har egna sidor, inte de delade skärmarna (2026-09-26).** Det
  tidigare demot under `/demo/app` monterade `screens/` med demoadaptrarna.
  Det är borttaget (finns i git-historiken) och ersatt av demot som byggdes
  på grenen `experiment/landning-fonda`: samma portar och demoadaptrar, men egna sidor
  i `app/demo/` och egna stilar. Portregeln gäller fortfarande (sidorna
  läser bara via portarna, demot importerar aldrig liveadaptrar). Det som
  inte längre gäller för demot är att skärmen är samma komponent som `/app`
  monterar.
- **Demoroutens klientkomponenter hämtar data med `useEffect`/`useState`,
  inte `use()`.** Ett första försök använde `use()` med promises memoiserade
  per `locale` via `useMemo`, men det kraschade med "An unknown Component is
  an async Client Component" när språket byttes (varje ny `locale` gav en ny
  promise-identitet till `use()`, vilket React/Next inte hanterade
  tillförlitligt i en Client Component). `app/demo/(app)/layout.tsx` och
  sidorna anropar i stället demoadaptrarna i en `useEffect` med `[locale]`
  som beroende och sätter datan i `useState` — standardmönstret för
  klientdata som kan ändras efter första renderingen.
- **Bara Hem är byggd som delad skärm.** Övriga sidor i `docs/uppdrag.md`
  avsnitt 6 (`/app/resan`, `/app/poang`, `/app/marknad`, med flera) byggs i
  senare sessioner, men portarna de kommer behöva finns redan deklarerade.
- **`lib/demo-data/mock.ts`** (Eriks ursprungliga scaffolding) rördes inte
  i den här sessionen. (`app/demo/page.tsx` från samma tid är borttagen
  2026-09-26 tillsammans med det gamla demot.)

## 8. Inloggning: tre lager (Session P1)

`/app/*` och `/start/*` skyddas av tre oberoende lager, inget ensamt
tillräckligt:

1. **`proxy.ts`** (projektroten — Next.js 16 döpte om `middleware.ts` till
   `proxy.ts`, se `node_modules/next/dist/docs/.../proxy.md`). Kör före
   varje matchad request (`matcher: ["/app/:path*", "/start/:path*",
   "/logga-in", "/skapa-konto"]` — medvetet INTE hela sajten, `/demo/*` ska
   aldrig göra ett Supabase-anrop). Anropar `supabase.auth.getUser()` via
   `lib/server/supabaseProxy.ts`, omdirigerar tidigt och förnyar
   sessionscookien.
2. **`lib/server/session.ts`** — den BINDANDE kontrollen. `requireUser()`
   anropas överst i `app/(app)/layout.tsx` och `app/start/layout.tsx`
   (körs i varje Server Component-render, kan inte kringgås av
   klientsidig navigering mellan syskon-sidor under samma layout).
   `requireSupabaseUser()` används av liveadaptrarna — kastar
   `NotAuthenticatedError` i stället för att omdirigera, en adapter ska
   inte styra navigering. Båda delar ett enda `supabase.auth.getUser()`-
   anrop per rendering via Reacts `cache()`.
3. **RLS** (`supabase/migrations/`) — den bindande spärren i databasen om
   de två föregående lagren på något sätt kringgås.

**Känd begränsning:** enligt Next-dokumentets egen varning ("Layouts and
auth checks") re-renderas inte en layout vid klientsidig navigering mellan
syskonrutter under samma layout — `requireUser()` i `app/start/layout.tsx`
körs alltså inte garanterat om igen när användaren navigerar
`/start` → `/start/profil` utan en full sidladdning. I dag ofarligt
(`/start`s sidor har ingen liveadapter kopplad än — `getOnboardingScript`
och `getIdeaScreening` är fortfarande stubbar), men den dag de kopplas in
ska den bindande kontrollen också sitta nära datahämtningen (Next-mönstret
"Auth checks in page components"), inte bara i layouten.

`test/stubs/supabaseFake.ts` mockar Supabase i alla kontraktstester —
`docs/bygga-en-modul.md`s tre testlager gäller rakt av för de fem
P1-portarna: kontraktstest (mockad), adapterns egna tester (mockad,
kantfall/tomma tillstånd), och ett opt-in `.live.test.ts`
(`adapters/live/rls.live.test.ts`) mot en riktig databas, `skipIf` på
saknade testkonton.

## 9. Service role-nyckeln: ett enda, avgränsat undantag (2026-09-23)

Plattformen läser och skriver annars bara via användarens session, och RLS är
spärren i databasen (avsnitt 8, punkt 3). `SUPABASE_SERVICE_ROLE_KEY` går
förbi RLS och används därför på exakt **ett** ställe: `lib/server/registryCache.ts`,
den gemensamma registercachen (`public.registry_cache`).

**Varför** (Eriks beslut, `docs/beslut.md` 2026-09-23): registerdata är
offentlig och inte användarspecifik. Om användaren själv skrev till cachen
kunde hen förfalska registerdata som påverkar Marknad-poängen och
affärsplanen. Därför skriver och läser bara servern.

**Hur undantaget hålls litet:**
- **Tabellen är stängd för alla klienter.** RLS är på utan policies, och
  `revoke all … from anon, authenticated`. RLS-vakten
  (`supabase/migrations/migrations.test.ts`, `CLOSED_TABLES`) kräver att en
  stängd tabell *inte* har någon policy.
- **Nyckeln är server-only** och har aldrig `NEXT_PUBLIC_`-prefix. En vakt i
  `lib/server/registryCache.test.ts` kräver att bara `registryCache.ts` läser
  den och att inget `NEXT_PUBLIC_…SERVICE` finns i koden.
- **Importen är låst.** Lint-regeln `registryCachePattern` i
  `eslint.config.mjs` låter bara `adapters/live/RegistryProvider.ts` och
  tester importera cachen. Klienten lämnas aldrig ut ur filen.
- **Grinden gäller.** Cachen anropar `assertRegistryAccessAllowed()` först,
  precis som transporterna.
- **Lagring är tidsbegränsad.** Varje `get()` tar bort alla utgångna rader,
  och databasen tillåter högst 7 dagar mellan `fetched_at` och `expires_at`.

Nya användningar av service role kräver ett nytt beslut i `docs/beslut.md`
och en rad här.
