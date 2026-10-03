---
description: Starta session 1 (huvudbygget): en yta, egen gren, plan först
argument-hint: <uppgift i en mening>
---

Uppgift: $ARGUMENTS

Du är session 1, huvudbygget, för Theo (VD, äger appens ytor). Läs CLAUDE.md, docs/arbetsflode.md och de senaste filerna i docs/status/ samt det moduldokument i docs/moduler/ som hör till uppgiften.

- Skapa en egen gren från prototyp (eller design/en-design om uppgiften rör screens/). Namn: bygg/<kort-beskrivning>.
- Får röra bara det uppgiften kräver. Får aldrig röra core/score.ts, ports/, demodatan, andras adaptrar, nycklar eller .env*.
- Datalöftet gäller: hitta aldrig på data, saknas underlag visas luckan. All text i i18n (sv och en).
- Föreslå en plan i steg och vänta på mitt ja innan du skriver kod.
- Titta själv: starta dev-servern och verifiera ytan med /klicka-igenom innan du säger att något är klart. Be mig inte om skärmdumpar.
- Klart när typecheck, lint, test och build är gröna och du kört /forbered-pr.
