---
description: Titta själv på en sida i appen (skärmbilder, båda språken) i stället för att be om skärmdumpar
argument-hint: <sökväg, t.ex. /demo eller /app/resan>
---

Verifiera visuellt: $ARGUMENTS

1. Starta dev-servern med `pnpm dev` i bakgrunden om den inte redan körs. Öppna aldrig en sparad adress; använd den port servern skriver ut.
2. Använd Playwright (finns redan i repot, installera inget nytt) för att öppna sidan i bredd 1280 och 390 (mobil), på svenska och engelska. Gå via startsidan till sidan, inte via en djup länk (känd hydreringsbugg, se docs/status/2026-09-22-formgivningspass-mot-artefakten-fullstandigt.md).
3. Ta skärmbilder, spara dem i scratchpad-katalogen och titta på dem med Read.
4. Leta efter: text som bryts fult, saknade mellanslag, avklippt innehåll, tomma ytor, hårdkodad svensk text i engelska läget, fiktiv data utan märkning, konsolfel.
5. Rapportera kort: vad som ser rätt ut, vad som ser fel ut (sida, språk, bredd, vad du förväntade dig). Lägg inga skärmbilder i repot. Ändra ingen kod om jag inte ber om det.
6. Saknas webbläsaren för Playwright eller går servern inte att starta: stoppa och säg exakt vad som saknas.
