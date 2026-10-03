## Radering av konto: vilka tabeller följer med (2026-10-03, gren `plattform/radering-cascade`, PR mot `prototyp`)
Personuppgiftspolicyn (#47) lovar att all data raderas när någon ber om det, genom att kontot tas bort i Supabase (Authentication → Users → Delete). Det fungerar bara om varje tabell med användardata har `user_id ... references auth.users (id) on delete cascade`. Genomgång av alla 14 migreringar i `supabase/migrations/`. **Ingen migrering skriven**; Erik avgör om något ska rättas.

### Metod
- Alla `create table`, `alter table` och `references` i migreringarna lästa.
- Kontrollerat mot databasen själv: alla migreringar körda i PGlite (`test/pgMigrations.ts`) och varje främmande nyckel läst ur `pg_constraint`, så att senare `alter table` och borttagna nycklar räknas. Katalogen stämde med genomgången. Den tillfälliga testfilen är inte committad.

### Resultat: 21 tabeller i `public`

| Tabell | `user_id` → `auth.users` | Pekar på `projects` | Övriga nycklar | Följer med när kontot raderas? |
|---|---|---|---|---|
| `profiles` | ja, cascade (primärnyckel) | – | – | Ja |
| `projects` | ja, cascade | – | – | Ja |
| `journey_steps` | ja, cascade | ja, cascade | – | Ja |
| `evidence` | ja, cascade | ja, cascade | `companies` set null, `responses` set null, `evidence_kinds` no action | Ja |
| `score_snapshots` | ja, cascade | ja, cascade | – | Ja |
| `brain_notes` | ja, cascade (primärnyckel) | – | – | Ja |
| `trace_events` | ja, cascade | ja, cascade | – | Ja |
| `outreach_messages` | ja, cascade | ja, cascade | `companies` no action | Ja (inklusive mottagarnas mejladresser) |
| `responses` | ja, cascade | – | `outreach_messages` cascade | Ja |
| `legal_items` | ja, cascade | ja, cascade | – | Ja |
| `pulse_signals` | ja, cascade | ja, cascade | – | Ja |
| `pulse_fetches` | ja, cascade | – | – | Ja |
| `pulse_feedback` | ja, cascade | – | `pulse_signals` cascade | Ja |
| `pulse_watches` | ja, cascade | ja, cascade | – | Ja |
| `cofounder_messages` | ja, cascade | – | – | Ja |
| `waitlist` | **nej** | – | – | **Nej: mejladresser utan koppling till ett konto** |
| `companies` | nej | – | – | Delad registerdata, inte per användare |
| `registry_cache` | nej | – | – | Delad servercache med registersvar |
| `evidence_kinds` | nej | – | – | Referensdata (bevistyper) |
| `journey_step_requirements` | nej | – | `evidence_kinds` no action | Referensdata (stegkrav) |
| `journey_step_group_thresholds` | nej | – | – | Referensdata (trösklar) |

### Slutsatser
- **Alla 15 tabeller med användardata** har `user_id references auth.users (id) on delete cascade`. Alla tabeller som pekar på `projects` gör det med `on delete cascade`, och `responses`/`pulse_feedback` följer med via `outreach_messages`/`pulse_signals`. Att radera kontot tar alltså bort all data som är knuten till kontot.
- **`waitlist` följs inte med.** Mejladresser på väntelistan har ingen koppling till ett konto. Den som står på väntelistan och sedan skapar ett konto och ber om radering har kvar sin adress där. I dag lovar väntelistans text att man mejlar för att bli borttagen (manuell radering). Beslut behövs: räcker den manuella vägen, eller ska raderingsrutinen också ta bort adressen ur `waitlist`?
- **Inget hindrar raderingen.** De nycklar som saknar cascade (`companies` no action från `outreach_messages`, `evidence_kinds` no action) pekar från användarens rader mot delad data, inte tvärtom, så de stoppar inte en radering av kontot.
- **`companies` är delad registerdata.** Den kan innehålla en enskild firmas namn, vilket kan vara en persons namn, men den kommer ur offentliga register och hör inte till ett konto.

### Utanför tabellerna (inte genomgånget här)
- `auth.users` och Supabases egna auth-tabeller (identiteter, sessioner) tas bort av Supabase när kontot raderas.
- Supabases säkerhetskopior, loggar i Supabase och Vercel, och anrop som redan gått till Gemini och Tavily omfattas inte av cascade. Policyn bör säga hur länge sådant finns kvar.
- Ingen Supabase Storage används i migreringarna.

### Återstår
- Eriks beslut om `waitlist` och om policyn ska nämna säkerhetskopior och loggar. Ingen migrering förrän dess.
- Ett pg-test som bevisar raderingen (skapa en användare med rader i alla 15 tabeller, radera, räkna) vore ett bra vakttest om fler tabeller tillkommer.

### Kända problem
- Inga i koden. Se `waitlist` ovan.

### Beslut
- Ingen migrering i den här PR:en (Erik 2026-10-03).
