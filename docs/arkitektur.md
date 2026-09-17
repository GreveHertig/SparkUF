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
Route (app/demo/app/page.tsx)          Route (app/(app)/app/page.tsx, /app)
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
| Demoroute | `app/demo/app/layout.tsx`, `app/demo/app/page.tsx`, `app/demo/app/loading.tsx` | Monterar `AppShell`/`AppHome` med demoadaptrarna på `/demo/app`. |
| Plattformsroute | `app/(app)/layout.tsx`, `app/(app)/app/page.tsx` | Monterar samma skärmar med liveadaptrarna på `/app`. |

## 3. De 12 modulerna (avsnitt 14.3)

| Modul | Port | Demoadapter | Liveadapter bygger på | Moduldokument (Session P2) |
|---|---|---|---|---|
| Profil | `ProfileRepository` | `adapters/demo/ProfileRepository.ts` | Supabase | `docs/moduler/profil.md` |
| Projekt och idé | `ProjectRepository` | `adapters/demo/ProjectRepository.ts` | Supabase | `docs/moduler/projekt-och-ide.md` |
| Resan | `JourneyRepository` | `adapters/demo/JourneyRepository.ts` | Supabase | `docs/moduler/resan.md` |
| Evidens och poäng | `EvidenceRepository` | `adapters/demo/EvidenceRepository.ts` | Supabase | `docs/moduler/evidens-och-poang.md` |
| Minnet | `MemoryRepository` | `adapters/demo/MemoryRepository.ts` | Supabase | `docs/moduler/minnet.md` |
| Medgrundaren | `CofounderAgent` | `adapters/demo/CofounderAgent.ts` | Gemini | `docs/moduler/medgrundaren.md` |
| Registret | `RegistryProvider` | `adapters/demo/RegistryProvider.ts` | Bolagsverket, SCB (stub tills dataavtal) | `docs/moduler/registret.md` |
| Webbresearch | `ResearchProvider` | `adapters/demo/ResearchProvider.ts` | Tavily | `docs/moduler/webbresearch-och-pulsen.md` |
| Pulsen | `PulseProvider` | `adapters/demo/PulseProvider.ts` | Tavily | `docs/moduler/webbresearch-och-pulsen.md` |
| Simuleringar | `SimulationProvider` | `adapters/demo/SimulationProvider.ts` | Hiasynth (koncept, alltid stub) | `docs/moduler/simuleringar.md` |
| Utskick och svar | `OutreachProvider` | `adapters/demo/OutreachProvider.ts` | Gmail (stub) | `docs/moduler/utskick-och-svar.md` |
| Juridisk koll | `LegalAdvisor` | `adapters/demo/LegalAdvisor.ts` | Gemini + kuraterade källor (byggd, ej sakgranskad) | `docs/moduler/juridisk-koll.md` |
| Bygg | `BuildProvider` | `adapters/demo/BuildProvider.ts` | Lovable (koncept, alltid stub) | `docs/moduler/bygg.md` |

`docs/moduler/*.md` skrivs i Session P2 (avsnitt 14.5). Fram tills dess är
hänvisningen i `NotImplementedError` ett medvetet framåtpekande.

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
`react-hooks/error-boundaries` tillåter inte JSX inuti `try/catch`), och
`NotImplementedError` fångas specifikt — andra fel kastas vidare.

## 5. Byta en stub mot en riktig adapter

1. Öppna `adapters/live/<Modul>.ts` och `ports/<Modul>.ts` för att se exakt
   vilken metod som ska implementeras och vilken form datan ska ha.
2. Läs `docs/moduler/<modul>.md` (Session P2) för datakällor, nycklar och
   acceptanskriterier.
3. Skriv den riktiga implementationen. Nycklar (Supabase service role,
   Gemini, Tavily) används bara här, aldrig i `screens/` eller i routen.
4. Kör kontraktstesterna för porten (Session P2 bygger en gemensam svit som
   körs mot både demo- och liveadaptern) tills de går igenom.
5. Rör **inget** i `screens/` eller i route-filerna. Så snart
   `adapters/live/<Modul>.ts` inte längre kastar `NotImplementedError`
   försvinner `ComingSoon` automatiskt och skärmen visar riktig data — det är
   hela poängen med portar och adaptrar.
6. Kör `/security-review` (eller security-reviewer-agenten) innan sessionen
   avslutas, se `docs/uppdrag.md` 14.6.

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
- **Demoroutens klientkomponenter hämtar data med `useEffect`/`useState`,
  inte `use()`.** Ett första försök använde `use()` med promises memoiserade
  per `locale` via `useMemo`, men det kraschade med "An unknown Component is
  an async Client Component" när språket byttes (varje ny `locale` gav en ny
  promise-identitet till `use()`, vilket React/Next inte hanterade
  tillförlitligt i en Client Component). `app/demo/app/layout.tsx` och
  `page.tsx` anropar i stället demoadaptrarna i en `useEffect` med `[locale]`
  som beroende och sätter datan i `useState` — standardmönstret för
  klientdata som kan ändras efter första renderingen. `app/demo/app/loading.tsx`
  är kvar som Next.js navigeringsladdning, inte som en Suspense-gräns.
- **Bara Hem är byggd som delad skärm.** Övriga sidor i `docs/uppdrag.md`
  avsnitt 6 (`/app/resan`, `/app/poang`, `/app/marknad`, med flera) byggs i
  senare sessioner, men portarna de kommer behöva finns redan deklarerade.
- **`lib/demo-data/mock.ts` och `app/demo/page.tsx`** (Eriks ursprungliga
  scaffolding) rördes inte i den här sessionen — de hör inte till
  `/demo/app` och ligger utanför uppgiften.
