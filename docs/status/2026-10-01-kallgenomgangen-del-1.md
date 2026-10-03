## Källgenomgången, del 1 (2026-10-01, Bruno, direkt på `design/en-design`)
Uppdrag från Theodor: varje påstående ska bära rätt källa och rätt typ (docs/beslut.md, 2026-10-01). Demot är fryst, så rättningarna gäller bara `/app`. Demots fynd rapporteras. Ingen fil som demot använder är ändrad.

### Så gjordes det
- **`/app`:** varje rutt i `app/(app)/app/` och `app/start/` lästes mot sin skärm: vilken `SourceTag` som visas, vilken källa och datatyp som når den från liveadaptern, och vilka siffror som visas utan tagg.
- **Demot:** en Playwright-skanning av den synliga källtaggen på alla 30 demosidor (Hem, alla flikar, `/resan/1–12`, onboardingen) i 15 moment (Sara vid beat 0, 4 … 36, 37 och Jonas vid 0, 4, 8, 12). Taggar med ett myndighetsnamn eller en kund-/utskickskälla listades.

### Fynd

| # | Var | Fynd | Status |
|---|---|---|---|
| 1 | `/app/pulsen` | Artiklar visades med registrets grå tagg | **Rättat** (`690684a`, `media`) |
| 2 | `/app/marknad`, Konkurrenter | Namn och beskrivning kommer ur registret men visades utan källa (känt sedan PR 11) | **Rättat**: rutten sätter `competitorsSource` till registrets källa och typ `register`, bara när registret svarat. Test i `page.test.tsx`. |
| 3 | `/demo/start/ide`, "Första registerbilden" (Jonas idégenomlysning, visas för båda) | Påhittade siffror (412 padelhallsbolag, 8 nyregistrerade, 34 nedläggningar) med grå tagg "Bolagsverket" (`adapters/demo/ProjectRepository.ts`, `registerSource`) | **Lämnat**, demot är fryst. Det enda kvarvarande myndighetsnamnet på påhittad data i demot. Rättas som de andra: exempelkälla och typ `example` (skärmen `OnboardingIdea` behöver då ta emot en datatyp). Syns i pitchdemot. |
| 4 | Demots Juridik | Bolagsverket och Skatteverket som källa | **Korrekt**: kuraterade juridiska källor, undantagna (pitchsäkringen). Datumet är scenariots, inte kontrolldatumet. |
| 5 | Hem i `/app`, "Vad som hänt sedan sist" (`screens/AppHome.tsx`) | Utan `sourceDataTypes.sinceLastTime` får "Utskick skickat" och "Öppningsfrekvens" registrets typ som standard. Det är grundarens eget utskick, inte ett register. | **Lämnat**, Theodors skärm. Syns inte i dag (Resans `getHomeSummary` är en stubbe). Rätta i Hem-rutten (`sinceLastTime: "customer"` eller `"user"`) innan stubben byggs. |
| 6 | `/app/minnet`, Profil, "Resurser" (`screens/Memory.tsx`) | Grundarens egna uppgifter med siffror ("15 timmar i veckan", sparat belopp) visas utan tagg. Typen `user` ("Din uppgift") finns nu för just detta. | **Lämnat**, delad skärm (demot fryst). Syns inte i dag (Profil är en stubbe). |
| 7 | `/start/ide`, idégenomlysningens fakta (`screens/OnboardingIdea.tsx`) | `SourceTag` utan datatyp, alltså registrets typ för allt. Idégenomlysningen kommer delvis från en modell. | **Lämnat**, delad skärm. Syns inte i dag (Projekt är en stubbe). Samma rättning som fynd 3. |
| 8 | `/app/bygg`, underlaget (`screens/Build.tsx`) | Utan `underlagSource` får varje bevis typen `customer`, oavsett vad beviset är | **Lämnat**, delad skärm. Syns inte i dag (Bygg är en stubbe). Ta typen från beviset. |
| 9 | Databasen, `evidence.data_type` | Check-villkoret tillåter bara `register`, `simulation` och `customer`. Ett bevis från webbresearch eller grundarens egen uppgift kan inte sparas med rätt typ (`media`, `user`). | **Lämnat**, migration och Evidens ägs av andra. Behöver en migration innan webbresearch skriver bevis. |
| 10 | `/app/validering`, "Kontaktade" | Antalet kontaktade bär typen `customer` (kundsvar), fast det är grundarens egen handling | **Lämnat**, litet. Övervägs med `user` när Validering ses över. |

Kontrollerat utan fynd i `/app`: Poäng (typen kommer ur databasen), Juridik (kuraterade källor som `register`), Marknads nyckeltal och datalager (registret), Valideringens svar (`customer`), simuleringar (`simulation`), Medgrundaren, Affärsplanen och Bygg (Kommer snart).

### Annat i den här sessionen
- **RLS-testet för `pulse_fetches`** i `adapters/live/rls.live.test.ts`: B kan inte läsa, ändra eller radera A:s dagscache och kan inte skapa en rad i A:s namn, till exempel ett framtida datum som blockerar A:s sökning. Testraden har datumet 2000-01-01 och upsertas, eftersom klienten inte kan radera. **Inte kört här** (kräver två testkonton mot riktig databas, `SUPABASE_TEST_USER_A/B_*`).
- **Hem väntar på Tavily** (Pulsen: liveadaptern, Kända problem): inte ändrat, Theodors skärm. Förslag: Hem-rutten hämtar Pulsen i en egen async komponent inom `<Suspense>`, och `AppHome` tar emot "Dagens signal" som en färdig slot (`ReactNode`) i stället för `pulseSignals`. Resten av Hem visas direkt, och signalen kommer när Tavily svarat. Kräver en prop i `AppHome`, alltså `screens/`.
- Verifierat: `pnpm typecheck`, `pnpm lint`, `pnpm test` (866 gröna, 36 skippade), `pnpm build`. Ändrade filer: `app/(app)/app/marknad/page.tsx` och dess test samt `adapters/live/rls.live.test.ts`. Ingen av dem används av demot.
