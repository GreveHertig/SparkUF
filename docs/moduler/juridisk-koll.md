# Modul: Juridisk koll

## Syfte

Ingen egen persona/sida än — en förmåga hos Medgrundaren, nåbar via knappen
"Juridisk koll" i chatten och på varje steg i resan. Dyker upp automatiskt vid
steg 05 (utskick), 09 (formalia) och 10 (lansering/GDPR).
Resultat: en juridisk karta för det specifika företaget — per lag/regel:
vad den konkret kräver, status (klart/att göra/bevaka), källa + datum.
Obligatorisk ansvarsbegränsning på varje juridisk yta:
"Spark ger vägledning, inte juridisk rådgivning. Kontrollera med jurist vid behov."

## Porten

`ports/LegalAdvisor.ts`:
`getLegalMap(bolagsform: Bolagsform): Promise<JuridisktKrav[]>`
Typer i `types/legal.ts` (Bolagsform, JuridisktKrav) och `types/evidence.ts` (Källa).

## Datakällor och vad som krävs

- Liveadaptern bygger på Gemini + en kuraterad, hårdkodad källista
  (`adapters/live/legalSources.ts`): Bolagsverket, Skatteverket, verksamt.se,
  IMY, EUR-Lex (GDPR-förordningen), Konsumentverket, Bokföringsnämnden,
  Riksdagen.
- **Gemini får aldrig ange en egen källa, avgift, deadline eller myndighet.**
  Modellen väljer bara vilka ämnen ur en sluten katalog (`LEGAL_TOPICS`) som
  gäller för en given bolagsform och formulerar rubrik/beskrivning. Själva
  `källa`-objektet injiceras alltid från den kuraterade listan i kod, efter
  att modellens svar validerats mot ett `.strict()` zod-schema som strukturellt
  saknar ett `källa`-fält (`adapters/live/legalSchema.ts`). Se
  `adapters/live/LegalAdvisor.ts` för hela flödet.
- GEMINI_API_KEY — skaffa på aistudio.google.com, server-only
  (`lib/server/gemini.ts`, `import "server-only"`), sätts i `.env.local`
  (aldrig committad, se `.env.example`).
- **Verifieringsstatus (2026-09-30):**
  - **Kontrollerade av en människa:** alla källor från Bolagsverket,
    verksamt.se och Bokföringsnämnden, i webbläsaren 2026-09-30 (se
    verifieringsloggen nedan). Källorna pekar nu på de undersidor där
    uppgiften står, inte på startsidorna.
  - **Bara maskinellt hämtade, inte kontrollerade av en människa:**
    Skatteverket, IMY, EUR-Lex (GDPR), Konsumentverket och Riksdagen (hämtade
    av Claude Code 2026-09-17, fortfarande startsidor).
  - **Ingenting är juristgranskat.** Ämneskatalogen i
    `adapters/live/legalSources.ts` är en rimlig tolkning av svenska
    bolagsregler, inte sakgranskad av jurist — särskilt vilka ämnen som gäller
    per bolagsform. `kostnadKr`/`deadline`/`myndighet` är medvetet inte
    ifyllda — lägg bara till dem med en verifierad källa för just den siffran,
    aldrig modellgenererat.

## Verifieringslogg

Kontrollerat av: Oskar Jaeger, 2026-09-30

### 2026-09-30 — kontroll i webbläsaren av en människa (Bolagsverket, verksamt.se, BFN)

Kontrollerat i webbläsaren 2026-09-30. Resultat, ordagrant:

1. Bolagsverket – registrering: STÄMMER. https://bolagsverket.se/foretag/foretagsnamn.1153.html
2. Bolagsverket – aktiekapital: DELVIS. Bankintyg krävs om aktierna betalas med pengar, revisorns yttrande om de betalas med egendom (apport). Inte ett fritt val. Minst 25 000 kr för privat AB. https://bolagsverket.se/foretag/aktiebolag/startaaktiebolag.479.html
3. Bolagsverket – bolagsordning, styrelse, revisor: STÄMMER.
   https://bolagsverket.se/foretag/aktiebolag/startaaktiebolag/bolagsordningforaktiebolag.483.html
   https://bolagsverket.se/foretag/aktiebolag/startaaktiebolag/styrelseochverkstallandedirektoriaktiebolag.505.html
   https://bolagsverket.se/foretag/aktiebolag/startaaktiebolag/revisoriaktiebolag.521.html
4. Bolagsverket – årsredovisning: STÄMMER för både AB och ekonomisk förening.
   https://bolagsverket.se/foretag/aktiebolag/arsredovisningforaktiebolag/arsredovisningsguidenforaktiebolag.5550.html
   https://bolagsverket.se/forening/ekonomiskforening/arsredovisningforekonomiskforening/arsredovisningsguidenforekonomiskforening.5538.html
5. Bolagsverket – stadgar och medlemmar: STÄMMER, minst tre medlemmar. https://bolagsverket.se/forening/ekonomiskforening/startaekonomiskforening.1335.html
6. verksamt.se – drivs av Bolagsverket, Skatteverket och Tillväxtverket: STÄMMER. https://verksamt.se/om-verksamt-se/om-webbplatsen
7. verksamt.se – bolagsavtal och solidariskt ansvar: DELVIS. Solidariskt ansvar stämmer. Bolagsavtal rekommenderas men är inget formellt krav. https://verksamt.se/starta-foretag/valj-foretagsform/handelsbolag
8. bfn.se är Bokföringsnämndens webbplats: STÄMMER.
9. BFN – bokföring: STÄMMER. Alla AB, HB, ekonomiska föreningar och enskilda näringsidkare är bokföringsskyldiga, löpande bokföring, arkivering i 7 år.
   https://www.bfn.se/fragor-och-svar/bokforing/allmanna-bokforingsfragor/
   https://www.bfn.se/redovisningsregler/vad-galler-for/enskilda-naringsidkare/

**Vad som ändrades i `adapters/live/legalSources.ts` efter kontrollen:**
- Varje ämne från Bolagsverket, verksamt.se och BFN pekar på sin undersida
  (en källa per sida, `hämtad: "2026-09-30"`).
- `aktiekapital` (punkt 2): texten säger nu minst 25 000 kr för privat AB,
  bankintyg vid betalning med pengar och revisorns yttrande vid apport.
- `bolagsavtal` (punkt 7): texten säger nu att bolagsavtal rekommenderas men
  inte är ett formellt krav, och att bolagsmännen har solidariskt ansvar.
- `bolagsordning_styrelse` (punkt 3) är uppdelat i tre ämnen, `bolagsordning`,
  `styrelse` och `revisor`, med var sin adress.
- `arsredovisning` (punkt 4) är uppdelat i `arsredovisning_ab` och
  `arsredovisning_ek_forening`, med var sin adress.
- `bokforing` pekar på den första BFN-adressen i punkt 9. Sidan om enskilda
  näringsidkare och verksamt.se:s sida "Om webbplatsen" (punkt 6) används
  inte som källa i koden, bara här i loggen.

**Inte kontrollerat av en människa:** Skatteverket, IMY, EUR-Lex,
Konsumentverket och Riksdagen. **Inget av detta är juristgranskat.**

## Hur demoadaptern fungerar i dag

`adapters/demo/LegalAdvisor.ts` returnerar bara `[]` än — ingen skärm använder
porten ännu, den juridiska kartan för Sara byggs i Session 4 (steg 09).

## Hur liveadaptern fungerar i dag

`adapters/live/LegalAdvisor.ts` är byggd och klarar kontraktstestet (mockad
Gemini i CI, se nedan). Flöde: validera bolagsform → filtrera kuraterade
ämnen för den bolagsformen → be Gemini välja tillämpliga ämnen och formulera
text → validera svaret mot ett strikt schema (kastar på trasig JSON, okänt
ämnes-id eller extra fält som en smugglad källa) → slå ihop dubbletter (ett
"applicable"-svar vinner alltid över ett tidigare "not_applicable" för samma
ämne) → injicera kuraterad källa → validera slutresultatet mot
`JuridisktKravSchema` innan det returneras. Ingen skärm anropar porten än.

**Att köra det riktiga Gemini-anropet manuellt** (kostar riktiga anrop, körs
inte i CI): `GEMINI_API_KEY=... pnpm test adapters/live/LegalAdvisor.live.test.ts`
— annars skippas den filen automatiskt.

**Känt att bevaka:** felmeddelanden från `LegalAdvisorError` kan innehålla
fragment av Geminis råa (ogiltiga) svar via `z.prettifyError`. I dag stannar
det på servern (ingen route använder adaptern än) — när `/app/juridik` byggs,
visa aldrig det felet rakt av för användaren.

## Acceptanskriterier

- getLegalMap(bolagsform) returnerar JuridisktKrav[] där varje objekt har en
  ifylld källa (namn + hämtad) — aldrig ett påstående utan källa.
- Ogiltig/okänd bolagsform ger ett tydligt fel, ingen tom gissning.
- Svarar även vid tomt resultat (t.ex. inga krav hittade) utan att krascha.
- Klarar kontraktstestet i ports/LegalAdvisor.contract.test.ts.

## Säkerhet

Gemini-nyckeln bara i serverkod, aldrig NEXT*PUBLIC*-prefix. Användarens
bolagsform/indata är data till Gemini, aldrig instruktion. Ingen Supabase-koppling
för den här modulen.

## Status

live (Gemini + kuraterade källor). Källorna från Bolagsverket, verksamt.se och
BFN är kontrollerade av en människa 2026-09-30, övriga fem är bara maskinellt
hämtade. Juridiskt innehåll (ämnenas bolagsformstillhörighet, avgifter,
deadlines) är inte juristgranskat.
Demoadaptern är fortfarande en stub (`[]`), oförändrad.
