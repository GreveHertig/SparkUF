## Onboarding: två nya frågor i profilsamtalet (2026-10-02, Bruno, gren `plattform/onboarding-fragor`, PR mot `prototyp`)

Texterna godkända av Theodor 2026-10-02. **Migreringen kräver Eriks granskning och körning innan PR:n mergas.**

### Klart
- **Ingång B ("jag har en idé")**, ny fråga två: "Vem tror du skulle köpa? En gissning räcker." Id `customer`, kolumn `customer_guess`.
- **Ingång A ("ingen idé än")**, ny fråga tre: "Vad stör du dig på i vardagen, skolan eller jobbet?" Id `frustrations`, kolumn `frustrations`.
- Migrering `supabase/migrations/20261002190000_onboarding_nya_fragor.sql`: två kolumner (högst 1000 tecken), update-rätt för klienten som de andra svarskolumnerna, och `complete_onboarding` utbytt med samma signatur. Rollback längst ner i filen.
- `core/onboarding.ts`, i18n (sv/en), testfejken och alla tester som skickar svar. Invarianten "ingång B:s frågor är en delmängd av A:s" gäller nu utom `customer`.
- Kontroll: `pnpm typecheck`, `pnpm lint` (0 fel, 3 gamla varningar), `pnpm test` (1208 gröna, 42 skippade), `pnpm build`.
- Säkerhetsgranskning: inga fynd. Grant-listan öppnar inte onboardingkolumnerna, funktionen är oförändrad i allt utom frågorna och kolumnerna, och ett glapp mellan kod och databas stänger (22023) i stället för att öppna.

### Beslut
- Kundfrågan ställs bara i B: den som saknar idé har ingen kund att gissa.
- Frågan ska fånga en gissning, inte rätt svar. Spark hjälper sedan till att snäva in kunden (Validering, steg 06).
- De nya kolumnerna är skrivbara för klienten, precis som de andra svarskolumnerna. Erik kan stänga dem (`PROFILES_CLIENT_CLOSED`) om han hellre vill det.

### Ordning vid driftsättning
1. Erik kör migreringen i SQL Editor.
2. Merga PR:n direkt efter. Ny kod mot gammal funktion, eller gammal kod mot ny funktion, gör att onboardingen avvisar svaren (22023) tills båda är på plats.
3. Kör `adapters/live/rls.live.test.ts`. Testkonto A är redan klart, så testet prövar bara att ett andra anrop nekas (nu med fyra svar).

### Återstår
- Visa de nya svaren i Minnets Profilen-flik (`screens/`, Theodors).
- Använda `customer_guess` i Validering och `frustrations` i steg 02 när de modulerna byggs.
