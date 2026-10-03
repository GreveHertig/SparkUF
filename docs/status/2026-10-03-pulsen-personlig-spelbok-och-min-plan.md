## Pulsen: personlig spelbok, Medgrundaren och Min plan (2026-10-03, Bruno, gren `modul/pulsen-spelbok`)

Uppdrag från Bruno efter genomklickningen av Pulsen: gör spelboken personlig,
låt grundaren gå vidare med Medgrundaren och gör stegen till uppgifter.
Beslut i `docs/beslut.md` (2026-10-03), detaljer i
`docs/moduler/webbresearch-och-pulsen.md` ("Personlig spelbok") och
`docs/moduler/min-plan.md`.

### Klart
- **Det du har berättat** överst i spelboken (`app/(app)/app/pulsen/personal.ts`):
  idé, tid, pengar, risk och läget i "Det formella". Ingen modell. En rad med
  en siffra får källan "Din uppgift".
- **Gå igenom det här med Medgrundaren**: länk med signalens id. Medgrundaren
  förifyller frågan (`signalDraft.ts`), bara ur grundarens egna signaler.
  Inget skickas förrän grundaren trycker Skicka.
- **Lägg till stegen i min plan**: ny port `PlanRepository` med demo- och
  liveadapter, tabellen `plan_items` (RLS), Server Actions i Pulsen och Resan,
  och delen "Min plan" i Resan där uppgifterna bockas av och tas bort.
- **Kompletterande data fäller aldrig sidan** (`app/(app)/app/_lib/optional.ts`):
  går Profilen, projektet, Resan eller planen inte att läsa visas Pulsen,
  Resan och Medgrundaren ändå, och felet loggas utan sitt meddelande.
- Min plan läses om när servern skickar en ny plan (nyckel på listan).
- Testattrappen för Supabase (`test/stubs/supabaseFake.ts`) kan nu `delete()`.
- Kontroll: `pnpm typecheck`, `pnpm lint` (0 fel, 3 gamla varningar),
  `pnpm test` (1425 gröna, 45 skippade), `pnpm build`. Spelboken och planen
  renderade och granskade på en skärmbild med `design/site.css`.

### Återstår
- **Kör migreringen** `supabase/migrations/20261003180000_plan_items.sql` i
  SQL Editor. Tills dess visas varken planknappen eller "Min plan".
- Klicka igenom på förhandslänken inloggad.

### Kända problem
- Rubriken i planens sammanhang kommer från klienten (rensad och kapad). Den
  hamnar bara i grundarens egen plan.
- Demot visar ingen plan och ingen länk till Medgrundaren.
- `screens/` och `design/site.css` är ändrade, stäm av med den som har dem.
