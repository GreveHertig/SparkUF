## Statusen som en fil per session (2026-10-03, gren `docs/status-per-fil`, PR mot `prototyp`)
`docs/status.md` gav merge-konflikt i nästan varje PR: alla lade till ett avsnitt längst ner, och GitHubs merge-knapp bryr sig inte om `merge=union` i `.gitattributes`. Plan godkänd av Erik 2026-10-03.

### Klart
- De 88 avsnitten i `docs/status.md` är flyttade till var sin fil i `docs/status/` (`<datum>-<kort-namn>.md`) utan att texten ändrats. Kontrollerat med ett skript: filerna satta ihop, med de ursprungliga tomraderna emellan, ger exakt den gamla filen. Datumet är datumet i rubriken, eller annars dagen då rubriken lades till (`git blame`).
- `docs/status.md` är ett kort index: vad mappen är, regeln och hur man läser.
- Regeln uppdaterad i `CLAUDE.md`, `docs/arbetsflode.md`, `docs/bygga-en-modul.md`, `docs/uppdrag.md`, `docs/plan-en-design.md` och `.claude/commands/` (`forbered-pr`, `granska-pr`, `session-bygg`, `session-bakgrund`, `klicka-igenom`).
- `.gitattributes` borttagen. Den innehöll bara `docs/status.md merge=union`, ingen LFS-regel.

### Återstår
- Öppna PR:er som lägger till ett avsnitt i `docs/status.md` får en sista konflikt. Lösningen står i PR-beskrivningen.

### Kända problem
- Äldre dokument och kodkommentarer hänvisar fortfarande till "`docs/status.md`, avsnitt X". De är orörda (ingen kod rörd). Index-filen säger hur man hittar avsnittet.
- `AGENTS.md` innehåller ingen statusregel (bara Next-blocket som `next dev` skriver) och är orörd.

### Beslut (Erik 2026-10-03)
- En fil per session i `docs/status/`, ingen redigerar andras. `docs/status.md` får inga nya avsnitt.
