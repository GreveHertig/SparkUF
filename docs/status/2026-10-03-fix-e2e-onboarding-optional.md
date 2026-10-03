## Fix: e2e-testet för onboardingen och optional() under build (2026-10-03, gren `fix/e2e-onboarding-optional`, PR mot `prototyp`)

Två fynd från Eriks körning av `e2e/onboarding.spec.ts` mot SparkUF2 efter merge av #70 och körd migrering.

### Klart
- **`e2e/onboarding.spec.ts`:** testet räknade frågorna under Återstår med `getByRole("group")`. Ingång A har tre återstående frågor, men `frustration` är fritext (en textruta, ingen grupp), så testet fick 2 i stället för 3. Appen visade alla tre. Testet pekar nu ut varje fråga på dess text:
  - de två valen som grupper
  - fritexten som textruta
  - efter "Ja" är `knowsOwner` borta från Återstår och syns under Dina svar
- **`app/(app)/app/_lib/optional.ts`** (från Brunos #69):
  - Raderna "Pulsen: Profilen / projektet / Resan / Min plan" och "Resan: Min plan: kunde inte läsas (Error)" kom från `pnpm build`, inte från testkontot. Vid förrenderingen kastar `cookies()` (via `requireSupabaseUser`) Nexts `DynamicServerError`, och `optional()` svalde det.
  - Nu anropas `unstable_rethrow(error)` först, enligt Nexts dokumentation. Raderna finns inte längre i build-loggen, och `/app/pulsen` och `/app/resan` är fortfarande dynamiska.
  - Nytt test: Nexts signaler (DynamicServerError, redirect) kastas vidare utan logg.
  - `app/(app)/app/resan/page.test.tsx` tar den riktiga `unstable_rethrow` i sin mock av `next/navigation`.
- **Kontroller:**
  - `pnpm typecheck`, `pnpm lint` (0 fel, 3 gamla varningar) och `pnpm build` är gröna.
  - `pnpm test`: 1513 gröna, 46 skippade.
  - `pnpm test:e2e e2e/onboarding.spec.ts` mot SparkUF2, med kontot återställt av Erik: 1 grön (desktop), 1 skippad (mobil, med flit: ett konto).

### Återstår
- Testkontot är klart med onboardingen igen efter körningen. Återställ det med SQL-satsen i filhuvudet före nästa körning.

### Kända problem
- Inga nya.

### Beslut
- Inga. Fixen följer Nexts dokumentation för `unstable_rethrow`.
