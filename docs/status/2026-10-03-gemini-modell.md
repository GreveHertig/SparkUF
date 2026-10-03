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
