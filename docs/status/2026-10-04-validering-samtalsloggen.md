## Valideringen som samtalslogg (2026-10-04, gren `plattform/validering-samtalsloggen`, PR mot `prototyp`)

Uppdrag från Bruno: bygg in Valideringen i appen. `/app/validering` visade bara "Kommer snart", eftersom sändningen är spärrad, inget formulär för kundsvar fanns och Domens liveadapter var en stubbe. Resan fastnade därför på steg 05 i live. Lösningen: grundaren pratar själv med kunderna och loggar samtalen i Spark. Spark skickar ingenting. Hela beskrivningen står i `docs/moduler/validering.md`, beslutet i `docs/beslut.md` 2026-10-04.

### Klart
- **Migrering** `supabase/migrations/20261004090000_validation_contacts.sql`: en rad per bolag och projekt, RLS, trigger som hindrar status att gå bakåt, check-villkor. Prövad mot Postgres (`validationContacts.pg.test.ts`). **Inte körd i Supabase än.**
- **Ny port** `ports/ValidationLog.ts` med demo- och liveadapter och kontraktstest.
- **Ren logik** `core/validationLog.ts`: rensning, bevissorter per svar, nyckeltal, Domens indata, framsteg mot steg 06, nästa steg och varningar om underlaget (alla positiva, priset inte prövat, bara en storlek).
- **Server Actions** `app/(app)/app/validering/actions.ts`: lägg till bolag, klistra in en lista (högst 30), markera kontaktad, nej tack, ta bort, logga svar. Ett svar blir två självrapporterade bevis via `record_evidence` (B6), och poängen räknas om.
- **Domens liveadapter** `adapters/live/VerdictProvider.ts` på loggen, samma kod som demot. Borttagen ur `STILL_STUBS` i `ports/stubStatus.test.ts`.
- **Skärmen** `screens/ValidationLive.tsx` och `screens/blocks/ValidationContacts.tsx`: nästa steg, framsteg mot steg 06, varningar, nyckeltal med källan "Din samtalslogg", domen utan poäng, svaren med bolaget som källa, kontaktlistan med formulär och samtalsguiden med ett meddelande att kopiera.
- **i18n** sv och en (`validationLog`). CSS i `design/site.css` under egna klassnamn (`fdd-vlog`).
- `VerdictBlock` tar poängen som valfri. Demot och Resans steg är oförändrade.
- typecheck, lint, tester (1608 gröna) och build gröna lokalt.

### Återstår
- **Kör migreringen** i SQL Editor efter granskning (Erik). Utan den visar sidan "Kommer snart" och inget kraschar.
- **Antaganden med dödskriterier**: grundaren skriver sina tre riskigaste antaganden och vad som skulle motbevisa dem, och utfallet räknas ur svaren. Inte byggt.
- **Visuell granskning** i webbläsaren. Ingen webbläsare fanns i sessionen, så skärmen är bara prövad med tester.
- Hem och Resans steg 05 kan länka till Valideringen.

### Kända problem
- Steg 06 går inte att markera klart i live så länge Registret är grindat: steg 03 och 04 kräver registerdata. Loggen och domen fungerar ändå.
- Självrapporterade svar ger högst hälften av Problem och Betalningsvilja (B6). Avsiktligt.

### Beslut
- Valideringen öppnas efter steg 02 i stället för 03.
- "Delvis" bekräftar problemet i bevisen, som i Domen.
- "Tog inte ställning" till priset återkallar ett tidigare prisbevis från samma bolag.
- Domen i `/app/validering` visas utan poäng.
