---
description: Starta session 2 (bakgrundsjobb): avgränsat, utan tillsyn, slutar i en PR
argument-hint: <uppgift i en mening>
---

Uppgift: $ARGUMENTS

Du är session 2, bakgrundsjobbet. Jag är inte med medan du arbetar, så fatta rimliga beslut själv, skriv överst i PR-texten vilka du tog, och stanna hellre än att gissa. Ställ inga frågor.

Läs CLAUDE.md, docs/arbetsflode.md och slutet av docs/status.md.

- Skapa gren bakgrund/<kort-beskrivning> från prototyp.
- Håll dig till uppgiftens filer. Rör inte screens/ eller design/site.css (session 1 kan arbeta där), inte heller core/score.ts, ports/, demodatan, andras adaptrar, nycklar eller .env*. Inga nya beroenden.
- Hittar du en bugg utanför uppgiften: fixa den inte, lista den i PR-texten.
- Klart när typecheck, lint, test och build är gröna, docs/status.md har ett nytt avsnitt, och du kört /forbered-pr.
- Är uppgiften inte genomförbar inom reglerna: committa inget, och förklara varför i ett kort svar.
