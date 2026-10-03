## Pulsen: risksignaler (2026-10-02, Bruno, direkt på `design/en-design`)
Hampus Hedelius tips efter Rotary-pitchen: yttre omständigheter som kan påverka företaget. Beslut i `docs/beslut.md` (2026-10-02), beskrivning i `docs/moduler/webbresearch-och-pulsen.md`, "Risksignaler".

### Klart
- **Liveadaptern** (`adapters/live/PulseProvider.ts`) gör en risksökning per hämtning med dagens tema (sex teman i tur och ordning) och projektets nyckelord. Varje träff klassas utan modell till ett av sex riskområden eller som nyhet. Högst 3 risker och högst 5 signaler totalt. Riskområdet sparas som `risk:<område>` i `category`, utan migration.
- **`core/domain.ts`:** `PulseSignal.risk` (valfri) och `PULSE_RISK_AREAS`. Porten (`ports/`) är oförändrad.
- **`screens/Pulse.tsx`:** "Risker att bevaka" först, med en orange "Risk"-markering, området, "Varför det spelar roll", "Vad du kan göra" och källan. Sedan "Nyheter i din bransch". Utan risker ser sidan ut som förut.
- **i18n** (sv och en): `pulsePage.risksTitle`, `risksIntro`, `newsTitle`, `riskLabel`, `actionsTitle` och `riskAreas` (namn, "varför" och tre förslag per område).
- **`design/site.css`:** en ny klass, `.fdd-risk-actions`, sist i filen. Inget befintligt ändrat.
- **Tester:** adaptern (risksökningen, klassning, spara och läsa, högst 3 risker, äldre rader, båda språken, fel i risksökningen; dagscachens tester räknar nu hämtningar i stället för anrop), klassningen och temarotationen, skärmen (med och utan risker). Kontraktstestet oförändrat och grönt.
- **Demot oförändrat:** 28 skärmbilder (`/demo` och `/demo/pulsen`, sju lägen, 1440 och 390 px) identiska med före (AE 0). Riskvyn kontrollerad med en tillfällig förhandsvisningssida (inte committad) i 1440 och 390 px.
- Verifierat: `pnpm typecheck`, `pnpm lint`, `pnpm test` (963 gröna, 36 skippade), `pnpm build`. Säkerhet granskad manuellt: bara nyckelord och fasta ord i sökfrågorna, webbtext visas som text, riskområdet ur databasen kontrolleras mot en vitlista, inga nya nycklar.

### Inte verifierat
- **Mot riktiga Tavily och inloggat.** Tavily-nyckeln finns nu i Vercel (Erik, 2026-10-02). Kontrollera efter nästa deploy att `/app/pulsen` visar risker för ett konto med aktivt projekt, och att klassningen träffar rätt på riktiga rubriker. Ordlistorna (`RISK_TERMS`) kan behöva justeras efter det.

### Kända problem och nästa steg
- **Kostnaden fördubblas** per grundare och dag (två anrop i stället för ett). Delad sökning per bransch sänker den men kräver en migration (Erik).
- **Klassningen är ordbaserad.** Den kan missa en risk som är formulerad på ett annat sätt och kan ibland ta en nyhet för en risk. Listorna är snäva för att undvika falsklarm.
- **Hem** (`screens/AppHome.tsx`, Theodors) visar dagens signal utan riskmarkering. Den kan vara en risk, och kategorin säger då "Risk · …".
- **Koppla risken till grundarens antaganden** ("din kalkyl räknar med X") kräver data från Resan. Inte byggt.
