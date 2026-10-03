## Registret: två öppna frågor om `registry_cache` (klar, gren `scb/cache-oppna-fragor`, PR mot `scb/forberedelse`)

### Klart
- **`docs/moduler/registret.md`, nytt avsnitt "Öppna frågor (avgörs före
  vecka 2)":**
  1. Användaren skriver i dag själv till `registry_cache` (insert/update för
     `authenticated`) och kan därmed förfalska registerdata i sin egen cache,
     vilket kan påverka Marknad-poängen och affärsplanen. Alternativet är att
     bara servern skriver (servicenyckel isolerad i `lib/server/`, inga
     insert/update-policies för `authenticated`). Erik beslutar innan
     transporten skrivs.
  2. Utgångna rader rensas aldrig. Rensning (vid läsning eller schemalagt
     jobb) ska läggas till så att data inte sparas längre än 7 dagar.

### Återstår
- Eriks beslut om fråga 1, och sedan en ändring av migreringen därefter
  (den är inte körd, så den kan fortfarande skrivas om).
- Rensning av utgångna rader (fråga 2).

### Kända problem
- **Den här PR:en bygger på PR #14** (`scb/forberedelse`), där
  `registry_cache` skapas. Mergea #14 först.
- "Vecka 2" finns inte definierat någonstans i repot. Rubriken följer Eriks
  formulering, men datumet behöver bestämmas.
