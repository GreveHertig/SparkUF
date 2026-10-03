## Pulsen: kunden i sökningen och RLS-test för omdöme och bevakningar (2026-10-02, Bruno, gren `modul/pulsen-kund`, PR mot `prototyp`)

Bygger på #50 (`modul/pulsen-relevant`) och #54 (`plattform/onboarding-fragor`), båda mergade 2026-10-03. Ingen migrering.

### Klart
- **Kundgissningen blir sökord.** Upp till tre ord ur `profiles.customer_guess` ("Vem tror du skulle köpa?") läggs till Pulsens båda sökningar och relevansfiltret. Utan gissning, eller utan kolumnen, söker Pulsen som förut. Detaljer i `docs/moduler/webbresearch-och-pulsen.md`, "Kunden i sökningen".
- **RLS-testet mot riktig databas** (`adapters/live/rls.live.test.ts`) prövar nu `pulse_watches` och `pulse_feedback`:
  - B kan inte läsa, ändra, radera eller skapa A:s bevakningar och omdömen.
  - B kan inte lägga en bevakning på A:s projekt, inte ens i eget namn.
  - B kan inte ge omdöme om A:s signal, inte ens i eget namn.
- Testfejken (`test/stubs/pulseSupabaseFake.ts`) kan nu låtsas att en kolumn saknas (`missingColumns`).
- Tester: sex nya fall i `adapters/live/PulseProvider.test.ts` ("kunden i sökningen").
- Kontroll: `pnpm typecheck`, `pnpm lint` (0 fel, 3 gamla varningar), `pnpm test` (1224 gröna, 45 skippade). Säkerhetsgranskning: inga fynd. Kundorden är bara bokstäver och siffror, högst tre, och bara grundarens egen profil läses.

### Återstår
- **Kör `rls.live.test.ts` mot SparkUF2** (Erik). De nya fallen är inte körda mot den riktiga databasen.
