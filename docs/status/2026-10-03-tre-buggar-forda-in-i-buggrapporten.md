## Tre buggar förda in i buggrapporten (2026-10-03, gren `bakgrund/buggar-lista`, PR mot `prototyp`)
Bakgrundsjobb (session 2). Bara `docs/buggar-2026-09.md` och den här filen är ändrade. Ingen kod.

### Klart
- **Nytt avsnitt "Hittat efter rapporten" i `docs/buggar-2026-09.md`** med nummer 21–23:
  - 21: `<html lang="sv">` i `app/layout.tsx` är fast.
  - 22: `onboarding.profile.subtitle` säger "Klicka på svaret för att gå vidare", men samtalet går vidare av sig självt.
  - 23: knappen i handlingskortet på Hem i `/app` gör ingenting, eftersom `app/(app)/app/page.tsx` inte skickar `onNextStep`.
- **Kontrollerat mot koden på `prototyp` före skrivandet:** alla tre finns kvar (`app/layout.tsx:30`, `i18n/sv.ts:761` och `i18n/en.ts:761`, `app/(app)/app/page.tsx` utan `onNextStep`).

### Kända problem
- Ingen av de tre är rättad. #23 går inte att rätta med en funktion som prop (Server Component), så den kräver ett designbeslut.
- Bugg 21–22 står också i status-avsnittet för PR #52 (`bakgrund/e2e-demoflode`), som inte är inne i `prototyp` än. Hänvisningen där kan hålla; listan är nu den enda källan för åtgärd.

### Beslut (session 2, utan tillsyn)
- Nya nummer 21–23 i ett eget avsnitt i stället för att fläta in dem i Bruno-rapportens kategorier, så att Brunos numrering (1–20) och hans genomgång står orörda.
- Bugg 23 lades till eftersom den inte var åtgärdad.
