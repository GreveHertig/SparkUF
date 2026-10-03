## Licensgrinden: öppning avbruten, grinden stängd (klar, gren `prototyp`)

### Klart
- **Öppningen av grinden förkastades innan den committades** (Eriks beslut,
  med `git restore`, ingen reset eller force push). Den hade tagit bort
  allowlisten så att alla inloggade släpptes in när flaggan var på. Koden
  (`lib/server/registryAccess.ts`, testerna, licensvakten i
  `ports/stubStatus.test.ts`, `.env.example`) är oförändrad sedan `8d10919`:
  flagga **och** allowlist krävs.
- **Licensen står kvar som Verifierat** i `docs/dataspiken.md`, med citatet,
  datumet och Eriks namn (`8d10919`).
- **`docs/moduler/registret.md`:** full öppning kräver nu uttryckligen tre
  saker: transporten skriven, SCB:s villkor lästa (efter 30 september 2026)
  och §6 fråga 4 avgjord med handledare.
- **Miljövariabler:** varken `.env.local` eller driftmiljön ändrades.
  `.env.local` har 2 id i `REGISTRY_ALLOWED_USER_IDS` (vems har inte
  kontrollerats, värdena lästes inte) och ingen `REGISTRY_LIVE_ENABLED`.

### Återstår
- De tre kraven för full öppning (se `registret.md`, "Licensgrind").
- **Erik:** bekräfta att de två id:na i `REGISTRY_ALLOWED_USER_IDS` är Erik
  och Theodor, i `.env.local` och i driftmiljön.

### Beslut nästa session behöver känna till
- **Verifierad licens är inte samma sak som öppen grind.** Grinden rörs inte
  förrän alla tre kraven i `registret.md` är uppfyllda.
