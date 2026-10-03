## Spik: SCB:s företagsregister-API, AFR (klar 2026-09-30, gren `docs/scb-afr-spik`, PR mot `prototyp`, bara docs)

### Klart
- **Provkörning mot `apiafr.scb.se`** från Claude Codes miljö, med Eriks personliga nyckel (`SCB_AFR_API_KEY` i `.env.local`, lästes med `node --env-file` och skrevs aldrig ut).
  - Tio anrop, alla 200, i två skript i `scratchpad/` (gitignorerad): `scb-afr-test.mjs` och `scb-afr-uppfoljning.mjs`.
  - Bara struktur, antal och kodtabeller skrevs ut. Inga enskilda firmor, inget `/full`.
- **`docs/dataspiken.md`:**
  - Nytt avsnitt "SCB AFR, provkörning 2026-09-30" (Verifierat/Sekundärt, filtermodell, fält, kodtabeller, kostnad, luckor, öppen fråga om `/full`).
  - §6 fråga 2 och 8 besvarade.
  - De gamla uppgifterna (certifikat, 2 000 rader, 10 anrop/10 s) rättade.
- **`docs/moduler/registret.md`:** nytt avsnitt "SCB AFR":
  - gränser, nattfönster, sidstorlek och filtermodellen;
  - förslaget för `searchCompanies` och `getMarketOverview`;
  - cache och SNI 2025;
  - skillnader mot `registrySchemas.ts` och porten;
  - vad som ska göras när transporten skrivs.
- **`docs/beslut.md`:** SNI 2025 rakt av (Erik, 2026-09-30).
- **`.env.example`:** `SCB_AFR_API_KEY` och `SCB_AFR_API_BASE_URL` utan värden, server-only, med kommentar.
- **`lib/server/scb.ts`:** bara kommentaren uppdaterad, ingen kodändring. Funktionen kastar fortfarande.

### Beslut
- **SNI 2025 rakt av**, fem siffror utan punkt, ingen omkodning. Porten och demodatan är inte ändrade än, se `docs/moduler/registret.md`, "SNI 2025".
- **Vilka bolag vi behåller:**
  - `jurform` 41, 42, 43, 49 (alla aktiebolag);
  - `ftgStat` 1 (verksam);
  - `reklamSparrTyp` 1 (tar emot reklam). Allt annat räknas som spärr.
- **`/full` och omsättningsklass används inte** (innehåller `tel` och `epost`). Det kräver ett eget beslut om personuppgifter.

### Återstår
- **SCB:s användarvillkor** citerade ordagrant i `docs/dataspiken.md`. Erik klistrar in dem. Det är grindkrav 2 i "Licensgrind".
- **Inget cachas** förrän villkoren är citerade och Erik har kört `registry_cache`-migreringen.
- **Skriv `lib/server/scb.ts`** och skriv om `lib/server/registrySchemas.ts` mot det verkliga svaret, enligt `docs/moduler/registret.md`, "SCB AFR". Byt också felmeddelandet i `fetchCompanies`.
- **Byt SNI-formen** i porten, liveadaptern, demodatan och testerna (listan står i `registret.md`).

### Kända problem
- `swagger.json` saknar `servers`. Bas-URL:en är härledd och bekräftad med anrop, inte angiven i kontraktet.
- Gränsen 5 anrop/s är Sekundärt: den står i SCB:s dokumentation enligt Erik, inte i swagger.json, och inga rate limit-headers syntes.
