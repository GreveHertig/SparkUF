## Modul: Domen — grunden (steg 06, branch `modul/domen`)

Byggd enligt planner-agentens plan, godkänd av grundaren innan kod skrevs. Ingen skärm, ingen Gemini, ingen liveindata.

### Klart
- **`docs/moduler/domen.md`** skrivet (det saknades). Beslutsregler, antaganden, säkerhet, status.
- **`core/verdict.ts`**: ren, deterministisk logik. Fyra domar: `run`, `refine`, `pivot`, `insufficient` (egen dom). Trösklar som exporterade konstanter: 5 svar, 70 %, 40 %, 25 % nej till pris, 50 % accepterar pris. Inga texter, ingen poäng (testat). `core/verdictReport.ts` bygger visningsklar rapport ur i18n (`verdict.*`, sv+en); citat ordagranna, rensade med `cleanText`, med källa.
- **Ny port `ports/VerdictProvider.ts`** (`getVerdictInput`, `getVerdictReport`), demoadapter (bygger på `getResponseCards`/`getCampaign`, orörda), liveadapter som är stub (`NotImplementedError`), kontraktstest, rad i `stubStatus.test.ts` och i arkitekturtabellen. `JourneyRepository` orörd.
- **`MemoryRepository.recordTraceEvent`** (ändrad port, eget beslut enligt bygga-en-modul §4): rensar och kortar text, kräver giltig tid, idempotent, användaren ur sessionen, RLS "insert egen". Demo: no-op. `core/verdictTrace.ts` (`recordVerdictTrace`) sparar en pivot i Spåret; inte kopplad till någon skärm.
- **Demodatan rättad till "3 av 9" som avböjer priset** (beslut av grundaren): `getValidationAssumptions`, `sara.ts` steg 06 (sv+en, tre ställen), `cofounderScript.ts` och specraden i `docs/uppdrag.md`.
- Verifierat: `pnpm typecheck`, `lint`, `test`, `build`. `/security-review` körd: inga fynd.

### Beslut nästa session behöver känna till
- **Trösklarna är utgångsvärden**, ska justeras när riktig data finns.
- **Svarstolkningen är öppen**: vem klassificerar svar som bekräftar/delvis/avvisar och pris accepterar/avböjer/tvekar i livedrift hör ihop med OutreachProviders klassificering, som inte är byggd. Demoadaptern tolkar citaten (`DECLINES_PRICE`, `UNDECIDED_PRICE`, `COUNTER_OFFER_KR`).
- **Skärmkoppling är en egen fas**: `screens/Validation.tsx` läser fortfarande skriven prosa från `JourneyRepository`. Kopplingen ska också anropa `recordVerdictTrace`.
- **Liveadaptern** väntar på Utskick (svar) och Registret (anställda). Gemini-sammanfattning är utanför avgränsningen; villkoren står i moduldokumentet.

### Kända problem / medvetna begränsningar
- **Kvar med "6 av 9" (orörda enligt uppdraget):** fixturen i `screens/Validation.test.tsx` och den historiska loggtexten i `docs/status.md` (Valideringssessionen). Rör inte demotexten "7 av 9 bekräftar problemet" (svarskorten visar 9 som bekräftar eller delvis) och "median 900 kr" (ett enda motbud, Domen visar "baserat på 1 svar"): samma sorts inkonsekvens, inte åtgärdad.
- `recordTraceEvent` lämnar `project_id` null (kontonivå) och är inte körd mot en riktig databas (bara fejkad Supabase); lägg gärna till i `rls.live.test.ts`.
- `recordTraceEvent`s idempotens är select-sedan-insert utan unikt index på `trace_events`; två samtidiga omräkningar kan ge dubbletter i Spåret (bara egen data, ingen säkerhetsrisk). Åtgärd om det behövs: unikt index på (user_id, module, occurred_at, description) och `upsert` med `ignoreDuplicates`.
