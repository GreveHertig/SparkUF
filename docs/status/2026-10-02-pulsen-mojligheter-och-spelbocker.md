## Pulsen: möjligheter och spelböcker (2026-10-02, Bruno, direkt på `design/en-design`)

### Klart
- **Möjligheter:** stöd och bidrag samt offentlig upphandling, som en tredje sort bredvid nyheter och risker (`adapters/live/PulseProvider.ts`, `classify`, `OPPORTUNITY_TERMS`). Rotationen har åtta teman, fortfarande två Tavily-anrop per grundare och dag. Högst 3 risker, 2 möjligheter och 5 signaler totalt. Sparas som `opportunity:<område>` i `category`, utan migration. Okända kategorier läses som nyheter (vitlista, testat).
- **Spelböcker** under varje risk och möjlighet (`screens/Pulse.tsx`, i18n sv och en): "Så påverkar det dig" och "Så löser du det" (för möjligheter "Passar det dig?" och "Så tar du vara på det"). Utfällbara och märkta "Allmän vägledning, ännu inte granskad av en rådgivare".
- **`core/domain.ts`:** `PulseSignal.opportunity` (valfri) och `PULSE_OPPORTUNITY_AREAS`. Porten är oförändrad.
- **`design/site.css`:** `.fdd-playbook` sist i filen. Inget befintligt ändrat.
- **Tester:** möjligheternas klassning, risk vinner vid lika poäng, spara och läsa, högst 2 möjligheter, vitlistan, båda språken, rotationen över åtta dagar, skärmen (grön markering, spelboken stängd från början med innehåll och märkning, ingen spelbok på en vanlig nyhet).
- **Demot oförändrat:** 28 av 28 skärmbilder identiska med före (AE 0). Den nya vyn kontrollerad med en tillfällig förhandsvisningssida (inte committad) i 1440 och 390 px, med spelboken utfälld.
- Verifierat: `pnpm typecheck`, `pnpm lint`, `pnpm test` (972 gröna, 36 skippade), `pnpm build`.

### Återstår
- **Spelböckerna ska granskas** av en kunnig person (förslag: Hampus Hedelius) innan märkningen "ännu inte granskad" tas bort.
- **Inte provat mot riktiga Tavily.** Ordlistorna för möjligheter (`OPPORTUNITY_TERMS`) kan behöva justeras efter riktiga rubriker.
- **Inte byggt, och varför:** uträkning av påverkan med grundarens egna siffror (Resan sparar inte kalkylen än), knapp till Medgrundaren (Medgrundaren finns inte i `/app` än), veckomejl (ingen mejltjänst), AI-bedömning per nyhet (teambeslut). Relevansknappar och egna bevakningar kräver nya tabeller och förbereds separat för Eriks granskning.
