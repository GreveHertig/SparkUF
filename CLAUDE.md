@AGENTS.md

# Spark UF – prototyp

> Repot har redan ett Next.js-projekt. Läs AGENTS.md och bygg i den befintliga strukturen. Sökvägar i docs/uppdrag.md som börjar med `src/` är logiska; placera dem i repots struktur och skriv faktiska sökvägar i docs/status.md. Ta inte bort eller skriv om befintlig kod utan att fråga.

Klickbar investerarprototyp av Spark, en svensk AI-medgrundare. Full produktkontext och alla krav finns i `docs/uppdrag.md`. Läs bara de avsnitt din uppgift kräver.

## Varje session
- **Börja** med att läsa `docs/status.md`. Föreslå sedan en plan och vänta på godkännande innan du skriver kod.
- **Håll dig till sessionens uppgift.** Bygg inte i förväg på andra sessioners delar.
- **Avsluta** med att uppdatera `docs/status.md` (klart, återstår, kända problem, beslut) och committa.

## Git
- Prototypen byggs på branchen `prototyp`, landningssidan på `prototyp-landning`.
- Pusha aldrig direkt till `main`.
- Kör `typecheck` och `lint` utan fel före varje commit.

## Stack
Next.js (App Router), TypeScript i strict-läge, Tailwind mappat mot CSS-variabler i designmappen för tokens, Radix UI, Framer Motion, Recharts, Zustand och Vitest. Ingen backend och inga externa anrop. Typsnitten är självhostade.

## Hårda regler
- **Källa på varje siffra.** Varje siffra visas via `DataFact` eller `SourceTag` med källa och datum.
- **Ingen hårdkodad text.** Alla strängar ligger i i18n-filerna för svenska och engelska.
- **Poängen räknas alltid** av `calculateScore` och hårdkodas aldrig.
- **Simuleringar:** märks "Simulering" och ger aldrig poäng.
- **Koncept-etikett:** allt som rör Hiasynth eller Lovable får `ConceptBadge`.
- **Fiktiva företag:** alla företagsnamn i demot är påhittade.
- **Juridik:** varje juridisk yta visar ansvarsbegränsningen.
- **Återanvänd komponenter.** Använd det som redan finns i komponentmapparna för grundkomponenter och produktkomponenter innan du skapar något nytt. Skapa inga dubbletter.
- **Designbeslut** dokumenteras i `DESIGN.md`.
