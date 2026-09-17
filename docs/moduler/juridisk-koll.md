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
- **TODO (juridiskt overifierat, jag verifierar detta):** ämneskatalogen i
  `adapters/live/legalSources.ts` är en rimlig tolkning av kända svenska
  bolagsregler, inte jurist-sakgranskad — särskilt vilka ämnen som gäller per
  bolagsform. Källadresserna till Skatteverket, IMY, EUR-Lex, Konsumentverket
  och Riksdagen kontrollerades och bekräftades innehållsmässigt via hämtning
  2026-09-17; Bolagsverket, verksamt.se och Bokföringsnämnden kunde INTE
  hämtas i samma session (nätverksblockering, inte nödvändigtvis fel adress)
  och behöver kontrolleras manuellt. `kostnadKr`/`deadline`/`myndighet` är
  medvetet inte ifyllda ännu — lägg bara till dem med en verifierad källa för
  just den siffran, aldrig modellgenererat.

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

live (Gemini + kuraterade källor) — juridiskt innehåll (ämnenas
bolagsformstillhörighet, avgifter, deadlines) ej sakgranskat av jurist.
Demoadaptern är fortfarande en stub (`[]`), oförändrad.
