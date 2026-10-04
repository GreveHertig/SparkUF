## Registret kopplat till SCB och Bolagsverket (2026-10-04, gren `plattform/registret-scb-koppling`, PR mot `prototyp`)

Uppdrag från Bruno: få Marknaden att fungera. `/app/marknad` visade ingen riktig data, eftersom SCB-transporten kastade och Bolagsverket inte var inkopplat. Nu är allt som går att göra i kod gjort. Grinden är orörd: den öppnas av Erik när de tre kraven i `docs/moduler/registret.md` ("Licensgrind") är uppfyllda. Besluten står i `docs/beslut.md` 2026-10-04.

### Klart
- **SCB-transporten** `lib/server/scb.ts` (`fetchLegalUnitsBySni`): grinden först, `/count` och sedan alla sidor med `limit=1000` och `cursorId`. Tak på enheter, svarsstorlek, tid och takt. Ingen omdirigering, nyckeln bara i `X-API-Key`. Fysiska personer, dödsbon och okänd juridisk form lämnar aldrig transporten. Testad mot mockad fetch (`lib/server/scb.test.ts`).
- **`lib/server/registrySchemas.ts`** omskriven efter AFR:s verkliga svar och kodtabeller.
- **Liveadaptern** `adapters/live/RegistryProvider.ts` på SCB, med Bolagsverkets beskrivning och reklamspärr för konkurrenterna. Verksamma aktiebolag, Stockholmsandel, storleksklasser och upp till fem konkurrenter. Omsättning och tillväxt visas som luckor.
- **Porten:** `RegistryCompany.revenueKsek` är nullbar. Demots bolag har kvar sina tal (typen i `adapters/demo/RegistryProvider.ts` säger det).
- **Steg 03 och 04 går att klara i live:** knappen "Spara som underlag" på Marknaden sparar `registerMarketCount` och `registerCompetitorSet` som systembevis (`lib/server/systemEvidence.ts`, service role, bara `adapters/live/EvidenceRecorder.ts` får importera den). Servern hämtar siffrorna själv. Citaten bär antal, aldrig bolagsnamn.
- **Etiketten** "Bolag i registret" heter nu "Verksamma aktiebolag" i live, med en beskrivning som säger exakt vad som räknas.
- **`/app/marknad` har `maxDuration = 60`**, eftersom en hel bransch tar 20–40 sekunder utan cache.
- **Provkörningstestet** `adapters/live/RegistryProvider.live.test.ts` kör riktiga anrop (opt-in). Kommandot står i `docs/moduler/registret.md`, "Provkörning av SCB".
- **Juridiskt underlag** för §6 fråga 4: `docs/registret-juridiskt-underlag.md`.
- **Säkerhetsgranskning** (agent): inga kritiska eller höga fynd. Rättat: omdirigering nekas, okänd juridisk form filtreras bort, `Content-Length` kontrolleras, en tidsgräns för hela genomgången, striktare SNI-form, samtidig återkallelse hanteras, och en vakt för vem som får anropa `recordRegistryEvidence`.
- `CLAUDE.md`: den nya poängen efter en sparad registerbild, och efter ett loggat kundsvar i Valideringen (från #78), står nu i listan över uträknade sammanfattningar.
- **Theodors beslut om §6 fråga 4** inskrivet i `docs/dataspiken.md`. Följder byggda: "Registrerade totalt" som eget antal (inga namn), och länkar till SCB:s och Bolagsverkets sidor i källorna (porten får `registeredTotal?` och `competitorsSource?`).
- typecheck, lint, tester och build gröna lokalt.

### Återstår (inte kod)
1. **Erik:** provkör SCB med kommandot i `docs/moduler/registret.md` och lägg utskriften i en statusfil.
2. **Erik:** läs och citera SCB:s användarvillkor i `docs/dataspiken.md`.
3. **Handledaren:** bekräfta Theodors beslut om §6 fråga 4 (taget 2026-10-04, står i `docs/dataspiken.md`, "Beslut om §6 fråga 4") och skriv in namn och datum där.
4. **Erik:** öppna grinden när 1–3 är klara.

### Återstår (kod, senare)
- En väg för bolag att bli borttagna ur Spark (beslutet punkt 1), och informationstexten till mottagare i Utskick (punkt 4).
- Cache i `registry_cache` när villkoren är citerade, så att sidan inte går igenom hela branschen vid varje besök.
- Årsredovisningarna (iXBRL) för omsättning och tillväxt.
- SNI-formen `69201` i porten och demot (beslutet om SNI 2025).

### Kända problem
- Utan cache tar en stor bransch 20–40 sekunder att ladda.
- Storleksfördelningen räknas på de högst 50 namngivna bolagen, inte på hela branschen. Sidan säger "Baserat på 50 av N bolag".
- Återkallelse och ny rad i systembevisen är två steg, inte en transaktion. Misslyckas den nya raden står frågan utan bevis tills grundaren sparar igen.

### Beslut
Se `docs/beslut.md` 2026-10-04, "Registret kopplat till SCB och Bolagsverket".
