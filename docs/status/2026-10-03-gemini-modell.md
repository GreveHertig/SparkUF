## Gemini-modellen ur GEMINI_MODEL (2026-10-03, gren `fix/gemini-modell`, PR mot `prototyp`)
Medgrundarens Gemini-anrop föll med 404 i Vercel-loggen: "models/gemini-2.5-flash is no longer available to new users. Please update your code to use models/gemini-3.8-flash".

### Klart
- **Modellen på ett ställe.** Den var redan bara satt i `lib/server/gemini.ts` (konstanten `GEMINI_MODEL`, använd av `generateJson` och `generateText`). Ingen adapter skickar ett eget modellnamn. Konstanten är ersatt av `geminiModel()`, som båda funktionerna anropar.
- **`GEMINI_MODEL`**, ny server-only-variabel. `geminiModel()` läser den vid varje anrop (trimmad). Tom eller saknad ger standardvärdet `DEFAULT_GEMINI_MODEL = "gemini-3.8-flash"`. Modellen kan alltså bytas i Vercel utan ny kod (gäller från nästa deploy eller omstart av funktionerna). Tillagd i `.env.example` med kommentar.
- **Anropsformen och schemat:** oförändrade. `generateJson` skickar `responseMimeType: "application/json"` och `responseJsonSchema` (från zods `z.toJSONSchema` i adaptrarna), och svaren valideras som förut av adaptrarnas zod-scheman. Inget i dem är knutet till en viss modell.
- **Tester:** nya `lib/server/geminiModel.test.ts` med mockad SDK: standardmodellen, tom variabel, override, och att modell, `contents`, `responseMimeType` och `responseJsonSchema` faktiskt skickas till `generateContent`.
- `pnpm typecheck`, `pnpm lint` (0 fel), `pnpm test` och `pnpm build` gröna.

### Återstår
- **Opt-in-testerna mot riktiga Gemini är inte körda.** `GEMINI_API_KEY` finns inte i sessionens miljö (och `.env.local` läses inte av agenten). Kör lokalt med nyckeln: `pnpm vitest run adapters/live/LegalAdvisor.live.test.ts adapters/live/CofounderAgent.live.test.ts`.
- Efter merge: kontrollera i Vercel-loggen att Medgrundaren svarar utan 404.

### Kända problem
- Se tillägget nedan: live-testerna föll med 400 och anropsformen är ändrad. Inte omkörd mot riktiga Gemini av agenten.

### Beslut (Erik 2026-10-03)
- Modellen läses ur `GEMINI_MODEL` med `gemini-3.8-flash` som standard.

### Tillägg: 400 INVALID_ARGUMENT mot gemini-3.8-flash (2026-10-03)
Erik körde live-testerna med en riktig nyckel: alla 7 föll med `ApiError 400 INVALID_ARGUMENT "Request contains an invalid argument."` från både `generateJson` och `generateText`. Modellnamnet godtogs (inget 404).

Kontrollerat mot Googles dokumentation för Gemini 3.8 Flash (ai.google.dev/gemini-api/docs/latest-model och …/generate-content/thinking) och SDK:ns typer i `@google/genai` 2.23.0:
- `temperature`, `topP` och `topK` ska tas bort, och `candidateCount` stöds inte från Gemini 3. Båda anropen skickade `temperature` och `candidateCount`, vilket är den troliga gemensamma orsaken.
- `thinkingBudget` ersätts av `thinkingLevel` (LOW, MEDIUM som standard, HIGH; MINIMAL ger fel på 3.8 Flash). Båda får inte skickas samtidigt.
- `maxOutputTokens` räknar med tänkandets tokens.
- `responseMimeType`, `responseJsonSchema` och `systemInstruction` nämns inte som ändrade.

Ändrat i `lib/server/gemini.ts`:
- `temperature` och `candidateCount` borttagna ur båda anropen. `thinkingBudget: 256` ersatt av `thinkingLevel: ThinkingLevel.LOW`, i båda anropen.
- `maxOutputTokens` höjt med marginal för tänkandet: 8192 för JSON (var 4096), 4096 för text (var 1024).
- **Avklippta svar är fel (Brunos punkt):** ett svar med `finishReason` som inte är `STOP` (MAX_TOKENS, SAFETY, RECITATION m.fl.) ger `GeminiResponseError` i stället för att halv JSON eller en avklippt mening används. Adaptrarna slår redan in fel från anropet i sina egna feltyper.
- **Felsökning:** ett `ApiError` loggas med `console.error`: HTTP-status, modell, Googles `code`, `status`, `message` (kortat) och hela `error.details` (där står vilket fält som är fel). Nyckeln finns aldrig i felsvaret (den skickas i ett huvud), och prompten och användarens text loggas inte. Felet kastas vidare som förut.
- `$schema` tas bort ur JSON-schemat i `generateJson`, för alla anropare. `LegalAdvisor` gjorde det redan själv, men `OutreachPrep` skickade det med.
- Tester i `lib/server/geminiModel.test.ts`: inga borttagna fält skickas, `thinkingLevel` LOW, `$schema` borttagen, MAX_TOKENS och SAFETY ger fel, och loggningen innehåller `details` men varken nyckel, instruktion eller användarens text.
- Utan `temperature: 0` är Juridisk kolls JSON-svar inte längre så nära deterministiska som förut. Svaren valideras fortfarande mot zod-schemat.

Återstår: Erik kör live-testerna igen. Faller de fortfarande, står fältet i loggens `details`.

### Tillägg 2: omförsök, live-tester i sekvens och felsökning av 400 i generateJson (2026-10-03)
Eriks nya körning: `generateText` (Medgrundaren) har inget 400 längre, bara 503 UNAVAILABLE ("high demand") och 429 RESOURCE_EXHAUSTED (gratisnivån, 5 anrop i minuten, retryDelay 47 s). `generateJson` (Juridisk koll) ger fortfarande 400 INVALID_ARGUMENT, utan `details`, i 4 av 5 tester.

- **Omförsök** i `lib/server/gemini.ts` (`withRetry`): högst två omförsök vid 503 (väntar 1 s, sedan 3 s) och 429 (väntar `retryDelay` ur Googles RetryInfo om den är högst 10 s, annars visas felet direkt). 400 och övriga fel försöks aldrig om. Varje försök får en egen timeout. Omförsöken loggas med `console.warn`, och det sista felet loggas som förut med `details`.
- **Live-testerna i sekvens:** nytt skript `pnpm test:live:gemini` (`vitest run --no-file-parallelism` på `LegalAdvisor.live.test.ts` och `CofounderAgent.live.test.ts`). `test/geminiLivePace.ts` håller 13 s mellan anropen, också över testfilerna (tiden sparas i en fil i tmp). Testernas timeout höjd till 90 s för omförsöken. Provat med en ogiltig nyckel: sju anrop i sekvens på 80 s, varje 400 loggat en gång och inte omförsökt. I CI hoppas de över som förut.
- **400 i generateJson:** schemat som Juridisk koll skickar har inga `$ref`, inga icke-ASCII-namn och inga `format`/`pattern`. Misstänkta: `additionalProperties: false`, `maxItems`, `minLength`/`maxLength`, eller att JSON-läget inte går ihop med `thinkingConfig` eller `maxOutputTokens: 8192`. Felsökningsskriptet `scratchpad/gemini-schema-probe.mjs` (gitignorerat, med schemat i `scratchpad/legal-schema.json`) provar tio steg ett i taget och skriver ut Googles svar för varje. Kör: `set -a && . ./.env.local && set +a && node scratchpad/gemini-schema-probe.mjs`. Ej kört av agenten (ingen nyckel).
- Tester i `lib/server/geminiModel.test.ts`: 503 försöks om och lyckas, högst två omförsök, 429 väntar en kort retryDelay, 429 med 47 s visas direkt, 400 försöks aldrig om.

Återstår: kör felsökningsskriptet och live-testerna, och rätta schemat eller anropet efter det som skriptet visar.

### Tillägg 3: schemat till generateJson (2026-10-03)
Eriks körning av felsökningsskriptet: steg "JSON-läge utan schema" gick igenom (STOP). Nästa steg (minimalt schema) fick 503 och sedan 429 med retryDelay 19 587 s, alltså är gratisnivåns dagskvot slut, och körningen avbröts. JSON-läget, `thinkingLevel` och `maxOutputTokens: 8192` fungerar alltså tillsammans. Det som skiljer från Juridisk kolls anrop är schemat (och prompten).

- SDK:ns dokumentation för `responseJsonSchema` (`GenerateContentConfig` i @google/genai 2.23) säger: "only the following properties are supported": `$id`, `$defs`, `$ref`, `$anchor`, `type`, `format`, `title`, `description`, `enum`, `items`, `prefixItems`, `minItems`, `maxItems`, `minimum`, `maximum`, `anyOf`, `oneOf`, `properties`, `additionalProperties`, `required` och `propertyOrdering`. Googles sida om strukturerade svar listar samma delmängd. `minLength`, `maxLength` och `pattern` finns inte med. Juridisk kolls schema har `minLength`/`maxLength` på `rubrik` och `beskrivning` (från zod). 2.5 ignorerade dem; den troliga orsaken till 400 är att 3.8 inte gör det.
- **Rättelse (trolig, inte bekräftad mot Gemini):** `toGeminiSchema()` i `lib/server/gemini.ts` behåller bara de stödda nyckelorden, på alla nivåer, och ersätter den tidigare rensningen av `$schema`. Fältnamn under `properties`/`$defs` rörs inte. Längdkraven gäller ändå: adaptrarna validerar svaret mot sitt zod-schema som förut.
- `responseFormat` (Googles nyare exempel) finns inte i `GenerateContentConfig` i SDK 2.23, så `responseMimeType` + `responseJsonSchema` behålls.
- Tester: nyckelorden tas bort på alla nivåer, fältnamn som heter som ett nyckelord är kvar, indata ändras inte, och Juridisk kolls riktiga schema skickas utan `minLength`/`maxLength`/`pattern`/`$schema`.
- **Felsökningsskriptet** (`scratchpad/`, gitignorerat) provar nu det schema appen skickar först (`legal-schema-gemini.json`, genererat med `toGeminiSchema`), sedan minimalt schema och det gamla schemat. `PROBE_STEG=1,2` kör bara vissa steg. Är retryDelay över 60 s avbryter det direkt med ett meddelande om att kvoten är slut (exit-kod 2). Provat mot en lokal låtsasserver som svarar 429 med 19 587 s.

Återstår: när kvoten är tillbaka, kör `PROBE_STEG=1,2,3` i skriptet och sedan `pnpm test:live:gemini`.

### Tillägg 4: enum + maxItems (2026-10-03)
Eriks körning av felsökningsskriptet med betald nyckel: appens schema (efter tillägg 3) 400, minimalt schema OK, gamla schemat 400. Utan `additionalProperties` 400, **utan `maxItems` OK, utan `enum` OK**, utan `thinkingConfig` 400. Slutsats: gemini-3.8-flash avvisar Juridisk kolls schema när `enum` och `maxItems` finns tillsammans, fast båda står bland de nyckelord SDK:n dokumenterar som stödda. Att `minLength`/`maxLength` var orsaken (tillägg 3) stämde alltså inte; de tas ändå bort eftersom de inte är dokumenterade som stödda.

- `toGeminiSchema()` tar nu också bort `maxItems`, i samma filter. `enum` behålls, eftersom modellen ska välja bland katalogens ämnen. `minItems` står kvar (inget av våra scheman använder det).
- Gränsen på 25 krav kontrolleras fortsatt av zod (`GeminiSvarSchema`, `.max(25)`) när svaret tolkas. Nytt test i `adapters/live/LegalAdvisor.test.ts`: 26 krav avvisas, 25 går igenom.
- Felsökningsskriptet: steg 1 är exakt det appen skickar nu (`legal-schema-gemini.json`, omgenererat med `toGeminiSchema`). Väntat utfall: steg 1, 2, 5 och 6 går, 3 och 4 ger 400.

Återstår: Erik kör `pnpm test:live:gemini`.

### Live-testerna gröna (2026-10-03)
`pnpm test:live:gemini` mot riktiga Gemini (`gemini-3.8-flash`, Eriks betalda nyckel ur `.env.local`) på `0dd5b5f`: **7 av 7 gröna** på 81 s.
- Juridisk koll (`LegalAdvisor.live.test.ts`): 5 av 5. Schemat utan `maxItems` godtas, och svaren håller zod-schemat.
- Medgrundaren (`CofounderAgent.live.test.ts`): 2 av 2, också testet att den inte visar sin systemprompt på begäran.
- Inga avvisade anrop och inga omförsök. Anropen gick i sekvens med 13 s mellanrum.

Kvar efter merge: kontrollera i Vercel-loggen att Medgrundaren och Juridisk koll svarar utan fel i produktion, och att `GEMINI_MODEL` antingen är tom eller `gemini-3.8-flash` där.
