# Arbetsflöde: tre sessioner samtidigt

Förslag från Theo, 2026-10-02. Gäller Theos eget arbete; Bruno och Oskar kan använda samma mall.

## Tre sessioner, inte fler

Flaskhalsen är granskning, inte kodtimmar. Fler sessioner ger fler halvfärdiga PR:ar, inte mer färdigt.

| Session | Roll | Hur den körs |
|---|---|---|
| 1. Huvudbygget | Appens ytor på kritiska vägen (nu: `design/en-design`, sedan Marknad när registret landar) | Interaktivt, Theo styr |
| 2. Bakgrundsjobbet | Avgränsat och verifierbart: engelska texter, buggar ur `docs/buggar-2026-09.md`, tester, docs | Cloud session, startas innan Theo går, granskas när hen kommer tillbaka |
| 3. Granskaren | Granskar PR:ar mot reglerna (`/granska-pr`). Aldrig samma session som byggde | Separat session, två fasta fönster per dag |

## Regler

1. En gren och en yta per session. Aldrig två sessioner i samma filer. Under migreringen rör bara en person `screens/` och `design/site.css`.
2. Max två egna PR:ar öppna samtidigt.
3. Färdig = typecheck, lint, test och build gröna, en egen fil i `docs/status/` (se `docs/status.md`), och någon har klickat igenom det i webbläsare.
4. Sessioner rör aldrig `core/score.ts`, `ports/`, demodatan, andras adaptrar eller nycklar. Inga hemligheter i molnmiljön.
5. Inga git-kommandon medan en agent arbetar i samma katalog.
6. Veckan före lansering (från 17 nov) är fryst, även för autonoma sessioner. En kodfri dag per vecka.
7. Stoppa och rapportera hellre än att gissa. Datalöftet gäller: hitta aldrig på data.

## Uppgiftsmall (klistra in som första prompt)

```
Uppgift: <en mening>
Gren: <t.ex. bakgrund/en-texter-marknad, skapad från prototyp>
Läs först: de senaste filerna i docs/status/ och <relevant moduldokument>
Får röra: <filer/mappar>
Får inte röra: core/score.ts, ports/, demodatan, andras adaptrar, nycklar, <annat>
Klart när: typecheck, lint, test, build gröna; egen fil docs/status/<datum>-<kort-namn>.md; PR öppnad mot <prototyp | design/en-design> med /forbered-pr
Stoppa och fråga om: du behöver ändra något utanför "får röra"
```

## Dagsrytm

- Morgon: starta session 2 med en tydlig uppgift och egen gren.
- Eftermiddag/kväll: jobba i session 1, kör session 3 på det som samlats.
- Granskning i batchar, inte löpande.

## Kommandon

- `/session-bygg <uppgift>`: startar session 1 (plan först, egen gren, verifierar själv).
- `/session-bakgrund <uppgift>`: startar session 2 (utan tillsyn, slutar i PR).
- `/session-granska`: startar session 3 (granskar öppna PR:ar).
- `/klicka-igenom <sökväg>`: Claude tittar själv på sidan (skärmbilder, sv/en, mobil) så du slipper skicka skärmdumpar.
- `/forbered-pr`: kontroller, egen statusfil i `docs/status/`, PR-text.
- `/granska-pr <nummer eller gren>`: granskning enligt teamets regler.

Skriv uppgiften direkt i Code, till exempel `/session-bygg koppla onboardingen mot ProfileRepository`. Kopiera inte prompter från chatten.

## Verktyg och skydd (2026-10-03)

- **Hookar** (`.claude/settings.json`, skripten i `.claude/hooks/`):
  - `skydda-filer.mjs`: `.env*` nekas (utom `.env.example`). `core/score.ts`, `ports/`, `adapters/demo/` och `lib/demo-data/` kräver att en människa bekräftar. I en session utan människa betyder det att den stannar, vilket är avsikten.
  - `kontrollera-vid-stopp.mjs`: före avslut körs `pnpm typecheck` och eslint på ändrade filer. Misslyckas de får sessionen felen tillbaka och fortsätter. Hoppar över om beroenden saknas eller inget kodrelevant ändrats, och loopar inte. Tar ca 20 sekunder.
- **Skills:** fyra från Emil Kowalski (`emil-design-eng`, `animate`, `review-animations`, `animation-vocabulary`) i `.claude/skills/`. Källa och version i `KALLOR.md`.
- **Modell:** bygg-sessioner kan använda Opus, bakgrund och granskning klarar sig med Sonnet och sparar veckokvot.
- **Schemalagt:** en morgonkontroll varje vardag (se status.md för vad den gör).
