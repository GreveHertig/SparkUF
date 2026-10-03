## Medgrundaren v4: en konkret uppgift i varje svar, och bara servern skriver Medgrundarens rader (2026-10-03, gren `modul/medgrundaren-uppgift`, PR mot `prototyp`)

PR 2 av 2 för onboarding v4, enligt systemspecifikationen v4 §3.1. PR 1 är `docs/status/2026-10-03-onboarding-v4.md`. Plan godkänd av Erik 2026-10-03, med två tillägg: "Sedan tidigare" rättas i den här PR:en, och skrivrätten på `cofounder_messages` stängs. Besluten står i `docs/beslut.md` (2026-10-03, "Medgrundaren v4").

### Klart
- **Säkerhetshål stängt, migrering `supabase/migrations/20261003230000_cofounder_next_task.sql`** (inte körd):
  - Prövat mot SparkUF2: testkonto A kunde med anon-nyckeln och sin egen session lägga in en rad med `role = 'cofounder'`.
  - Migreringen tar bort insert-policyn och drar in `insert, update, delete` från `anon` och `authenticated`. Tabellen står nu i `WRITE_CLOSED_TABLES`.
  - `reserve_cofounder_message` är nu `security definer` med samma signatur. Rollen är alltid `founder`, `next_task` alltid `null` och användaren alltid `auth.uid()`.
  - Den nya kolumnen `next_task` har ett check-villkor: den får bara vara satt på Medgrundarens rader, och då med 1–500 tecken.
- **Service role för Medgrundarens svar:**
  - `lib/server/cofounderReplies.ts` (`server-only`) gör bara insert av `role = 'cofounder'`, och `user_id` kommer ur sessionen.
  - Lint-regeln `cofounderRepliesPattern` låter bara `adapters/live/CofounderConversation.ts` och tester importera filen.
  - Vakttestet i `lib/server/registryCache.test.ts` listar filen bland dem som får läsa nyckeln.
  - Klientbunten är kontrollerad efter build. `.next/static` innehåller varken nyckelns namn, `cofounderReplies`, `sb_secret_` eller någon JWT.
- **Strukturerad output:**
  - `generateText` har fått ett valfritt `responseJsonSchema`. Medgrundaren svarar med `{ svar, nastaUppgift }`, som valideras med zod.
  - `nastaUppgift` har 1–500 tecken och får inte sluta med frågetecken.
  - Ett ogiltigt svar (inte JSON, avklippt, uppgift som saknas, är tom eller är en fråga) försöks om en gång. Sedan kastas `CofounderAgentError` utan orsak, så att ingen råtext följer med.
- **Prompten:**
  - Den säger emot en svag idé och förklarar varför, och har inga utropstecken.
  - Uppgiften görs ute i verkligheten inom sju dagar.
  - Riskformuleringen i steg 01 är struken.
  - `knownData` har fått `profil.svar` (etiketter), `frustration`, `kund` och `aterstaendeFragor` med svarsalternativ, och modellen ställer nästa fråga.
  - En tidigare uppgift följer med i historiken.
- **Portar** (valfria, demon är orörd):
  - `CofounderMessage.nextTask?`
  - `appendCofounderReply(text, nextTask?)`
  - `COFOUNDER_TASK_MAX`
- **UI:** "Din uppgift" visas som ett eget kort (`TaskCard`, `.fdd-task`, se `DESIGN.md`). i18n-nyckeln `cofounderPage.live.taskTitle` finns på sv och en.
- **"Sedan tidigare":** ett v4-svar visar dagen svaret gavs (`answeredOn`). Fritextsvar från före v4, idén och Hjärnan visas utan datum. Dagens datum visas aldrig.
- **Tester:**
  - kontraktstest som bara körs mot live, för både agenten och samtalet
  - 13 felfall, var och en med "andra försöket lyckas" och "två fel ger fel utan råtext"
  - prompttester
  - PGlite-testerna är omskrivna för den stängda tabellen
  - `rls.live.test.ts` har ett nytt test för `cofounder_messages`
  - tester för `cofounderReplies` och schemat i `generateText`
  - skärmtest för kortet och test för källans datum
- **Opt-in mot riktiga Gemini** (körd 2026-10-03, 4 av 4 gröna):
  - Den svaga idén ("ett socialt nätverk för alla") fick svaret "Nej, idén är svag" med skäl.
  - Varje svar hade en uppgift i verkligheten, och den återstående frågan ställdes med alternativen.
  - Första körningen gav uppgiften "Välj ett av de tre alternativen". Prompten skärptes så att uppgiften alltid görs utanför Spark.
- **Kontroller:**
  - `pnpm typecheck` och `pnpm build` är gröna. `pnpm lint` gav 0 fel och 3 gamla varningar i `design-referens/`.
  - `pnpm test` utan testkontona (som i CI): 1604 gröna och 48 skippade.
  - `pnpm test:e2e`: 16 gröna och 46 skippade (testerna av `/app` saknar testkonton här).
- **`/security-review`:** inga fynd med konfidens ≥ 8.

### Återstår
- **Kör migreringen i SQL Editor direkt vid merge.** Kör sedan `adapters/live/rls.live.test.ts`, som nu ska vara grön.
- **Ta bort tre provrader** i testkonto A:s historik (seq 42, 43 och 44, se PR-texten).
- **Klickgenomgång inloggat** med migreringen körd (`/klicka-igenom`), särskilt kortet "Din uppgift" på mobil.

### Kända problem
- **`rls.live.test.ts` körs av `pnpm test` i den här miljön**, eftersom testkontona ligger i miljövariablerna. Före migreringen är det nya testet rött. Två sådana körningar lade in var sin provrad (seq 43 och 44) innan testet stannade, och seq 42 är det manuella provet. Kör inte testet igen förrän migreringen är körd.
- **Ordningen vid merge:**
  - Med ny kod mot gammal databas saknas `next_task`, och hela Medgrundaren visar "Kommer snart".
  - Med gammal kod mot ny databas misslyckas varje sparat svar, eftersom insert-rätten är borta.
  - Kör migreringen direkt vid merge. `SUPABASE_SERVICE_ROLE_KEY` krävs nu för Medgrundaren. Nyckeln finns redan i Vercel för poänghistoriken.
- **Ingen kodspärr mot siffror** i svaret eller uppgiften, bara regeln i prompten. Modellen skrev till exempel "bolag med miljarder i budget".
- **Kravet på sju dagar och verklighet styrs bara av prompten.** Koden prövar bara att uppgiften finns, är kort och inte är en fråga.
- **Ett meddelande kan ge två Gemini-anrop** (omförsöket). Taket räknar meddelanden.
- **Supabases standardrättigheter** ger troligen `authenticated` kvar `truncate`, `references` och `trigger` på tabellen. PostgREST exponerar inte `truncate`. En `revoke all` vore städigare härdning (säkerhetsgranskningen, låg konfidens).
- **`screens/` och `design/site.css` är ändrade:** `ChatBlocks.tsx`, `CofounderChat.tsx` och regeln `.fdd-task`. Stäm av med den som har `screens/`.

### Beslut (Erik 2026-10-03)
- Medgrundarens rader skrivs bara av servern med service role, som en ändring av beslutet från #63. Samma mönster som `score_snapshots`.
- `SUPABASE_SERVICE_ROLE_KEY` används för Medgrundaren bara i `lib/server/cofounderReplies.ts`.
- "Sedan tidigare" använder `answeredOn` och visar inget datum när tiden saknas.
- Kravet på `nextTask` gäller bara liveadaptern.
