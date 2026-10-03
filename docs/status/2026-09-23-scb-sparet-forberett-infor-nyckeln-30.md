## SCB-spåret förberett inför nyckeln 30 september (klar, gren `scb/forberedelse`, PR mot `prototyp`)

### Klart
- **`docs/dataspiken.md`, nytt avsnitt "SCB:s företagsregister-API:
  publicerad dokumentation"**, hämtat ordagrant från scb.se 2026-09-23 (HTML
  och PDF, inte sammanfattat), med länkar:
  - SCB:s *värdefulla datamängder* ligger i **Bolagsverkets** API (bara
    uppslag på org.nr). Det sökbara API:t är SCB:s **företagsregister-API**,
    en separat tjänst.
  - Publicerat: REST, JSON/XML, https, certifikat och lösenord efter
    godkända användarvillkor (scbforetag@scb.se), max 2 000 rader per anrop,
    10 anrop per 10 sekunder. Nytt API i september 2026 med API-nyckel och
    paginering; det gamla finns kvar minst sex månader.
  - Levererade fält enligt postbeskrivningen (2025-06-26): SNI
    (`Bransch_1–5`), `Stkl` (anställda), `Juridisk form`, `Reklam`.
    Omsättningsklass, telefon och e-post är tilläggsgrupper.
  - Storleksklasserna är rättade: 0 = uppgift saknas, 1–16.
  - **Inte publicerat:** endpoints, vilka fält som är sökbara, det nya
    API:ts specifikation och användarvillkoren. Inget är gissat.
- **`supabase/migrations/20260923120000_registry_cache.sql`:** skiss av en
  cache för råa registersvar. Varje rad har källa (`source_name`,
  `source_url`), hämtdatum (`fetched_at`) och utgångstid (`expires_at`, högst
  7 dagar). Tabellen ägs per användare med RLS som bara ger åtkomst till
  egna rader (select/insert/update/delete), och raderna tas bort med kontot.
  RLS-täckningsvakten är grön.
- **`lib/server/scb.ts` är inte rörd.**

### Återstår
- **När nyckeln kommer:** fråga SCB om endpoints och sökbara fält i nya
  API:t, maxrader per anrop, om SNI och `Stkl` kan kombineras i en fråga,
  om TG07Oms (omsättningsklass) ingår avgiftsfritt, och be om
  användarvillkoren ordagrant (krav för att öppna licensgrinden).
- Skriv transporten först när det finns riktig dokumentation.

### Kända problem
- **SNI 2025 mot SNI 2007.** SCB:s register följer SNI 2025. Demot och porten
  använder koder som `69.201` (troligen SNI 2007). Översättningen är
  okontrollerad och blockerar `searchCompanies`.
- **Migreringen är inte körd** mot SparkUF2. Den är ofarlig (tom tabell, inget
  skriver), men kör den inte förrän skissen är godkänd. Ingenting får skrivas
  till tabellen förrän §6 fråga 4 är avgjord (licensgrinden, punkt 4).

### Beslut nästa session behöver känna till
- **Cachen ägs per användare, inte delad.** Det följer CLAUDE.md:s RLS-regel
  och kräver ingen service role, men samma fråga från två användare hämtas
  två gånger. En delad cache kräver en servicenyckel och ett eget beslut.
