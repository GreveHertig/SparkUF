## Verktyg och skydd (Theo, 2026-10-03)

### Klart
- Hookar för skyddade filer och typecheck/lint vid avslut; testade (ask/deny/släpp igenom, typfel blockerar, ren kod passerar, ingen loop).
- Fyra skills från Emil Kowalski (MIT), genomlästa, bara markdown. `.claude/skills/KALLOR.md` har källa, version och regler.
- Regel i `CLAUDE.md`: `DESIGN.md` och tokens gäller framför designskills.

### Återstår / beslut
- Hookarna gäller alla i teamet. Erik, Bruno och Oskar får en bekräftelsefråga vid ändringar i `ports/` och demodata. Säg till om det stör, så görs det om till en varning.
- Hookarna är inte provade i en molnsession, bara lokalt. Första molnkörningen visar hur "ask" beter sig utan människa.
- Impeccable och Context7 installerades inte (skäl i `KALLOR.md`).
- Stop-hooken kräver att `node_modules` finns. Saknas de hoppar den över kontrollen, så CI behövs ändå.
