## Affärsplanen: svaren från onboardingen före v4, och nästa steg när det är låst (gren `fix/affarsplan-gamla-svar-och-nasta-steg`, 2026-10-04)

Uppföljning av `docs/status/2026-10-03-affarsplanen-live.md`, efter att grundaren tittat på `/app/affarsplan` med ett riktigt konto.

### Klart
- **Svaren före v4 läses.** Konton som gjorde onboardingen före v4 har sina fritextsvar i `profiles.customer_guess` och `profiles.frustrations`, inte i `profiles.onboarding_answers`. Planen läste bara v4, så Kunden och problemet blev tom ("Steg 1 är klart, men gav inget underlag"). Nu går svaret före v4 före v4-svaret för samma sak, samma regel som `MemoryRepository.getKnownProfile`. De sparades utan tid och visas därför utan datum.
- **Nästa steg när det steget är låst.** Kortet valde steg 03 för en grundare på steg 02 (steg 02 hade redan gett underlag), och visade då ingen knapp. Nu säger kortet "Öppnas när steg 02 · … är klart." och knappen leder till det aktuella steget.
- Tester för båda i `adapters/live/businessPlan.test.ts` och `screens/BusinessPlan.test.tsx`. Typecheck, lint och alla tester gröna.

### Återstår
- Samma som i 2026-10-03-filen.

### Kända problem
- Inga nya.

### Beslut
- Inga nya.
