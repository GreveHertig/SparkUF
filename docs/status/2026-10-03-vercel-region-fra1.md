## Vercel-region fra1 (2026-10-03, gren `plattform/region-fra1`, PR mot `prototyp`)
Serverfunktionerna körde i Vercels standardregion `iad1` (Washington, USA), medan Supabase ligger i Frankfurt. Varje databasanrop gick alltså över Atlanten.

### Klart
- Ny fil `vercel.json` med bara `"regions": ["fra1"]` (Frankfurt). Filen fanns inte tidigare, och inget annat i Vercel-konfigurationen är ändrat.
- Kontrollerat att ingen region eller runtime redan sätts i `next.config.ts`, i någon `vercel.ts` eller med `preferredRegion` i en route.

### Återstår
- Gäller från nästa deploy. Bekräfta i Vercel efter merge: Deployments → den nya deployen → Functions, där regionen ska vara `fra1`.

### Kända problem
- Inga.

### Beslut (Erik 2026-10-03)
- Serverfunktionerna körs i `fra1`, nära Supabase.
