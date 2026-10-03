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
- `generateText` skickar `thinkingConfig: { thinkingBudget: 256 }`. Nyare Gemini-modeller styr tänkandet med `thinkingLevel` och tar emot `thinkingBudget` för bakåtkompatibilitet, men det är inte bekräftat mot `gemini-3.8-flash`. Om live-testet för Medgrundaren faller eller svaren blir avklippta är det första stället att titta.

### Beslut (Erik 2026-10-03)
- Modellen läses ur `GEMINI_MODEL` med `gemini-3.8-flash` som standard.
