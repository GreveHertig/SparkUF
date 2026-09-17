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

- Liveadaptern bygger på Gemini + verkliga källor (riksdagen.se, IMY, verksamt.se,
  Skatteverket, EUR-Lex).
- TODO (jag verifierar detta): Gemini API-nyckel — skaffa på aistudio.google.com,
  server-only, döps GEMINI_API_KEY i .env.local (aldrig committad).
- TODO (jag verifierar detta): exakta krav per bolagsform med riktig källa och
  hämtningsdatum — inget påstående utan källa.

## Hur demoadaptern fungerar i dag

`adapters/demo/LegalAdvisor.ts` returnerar bara `[]` än — ingen skärm använder
porten ännu, den juridiska kartan för Sara byggs i Session 4 (steg 09).

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

stub
