# Status — Spark UF-prototypen

`docs/status/` är överlämningen mellan sessioner: en fil per session eller PR, med vad som är klart, vad som återstår, kända problem och beslut som nästa session behöver känna till.

## Regeln
- **Varje ny session skapar en egen fil** `docs/status/<datum>-<kort-namn>.md`, till exempel `docs/status/2026-10-03-minnet-onboardingsvar.md`. Datumet är dagens datum (ÅÅÅÅ-MM-DD), namnet några ord med små bokstäver och bindestreck, utan å, ä och ö.
- Filen börjar med en `##`-rubrik som säger vad sessionen gjorde, gren och datum, och har avsnitten Klart, Återstår, Kända problem och Beslut.
- **Redigera aldrig andras filer.** Ett beslut som ändrar något i en äldre fil skrivs i den nya filen, med en hänvisning till den äldre.
- Skriv aldrig nya avsnitt i den här filen. Den är bara ett index, så att två grenar inte längre lägger till text på samma ställe och får merge-konflikt.

## Läsa
- Filnamnen sorteras i tidsordning. Börja en session med att läsa de senaste filerna (`ls docs/status | tail`) och de som rör din uppgift.
- Kartan över logiska `src/`-vägar i `docs/uppdrag.md` och de verkliga vägarna i repot: [2026-09-17-verkliga-sokvagar.md](status/2026-09-17-verkliga-sokvagar.md).
- Äldre dokument och kodkommentarer hänvisar till "`docs/status.md`, avsnitt X". Avsnittet finns nu som en egen fil i `docs/status/` med samma rubrik (sök med `grep -l "## X" docs/status/*.md`).

Filerna flyttades hit ur den gamla `docs/status.md` 2026-10-03 utan att texten ändrades. Datumet i namnet är datumet i rubriken, eller annars dagen då avsnittet skrevs.
