## `<html lang>` följer språket, och ny text i profilsamtalet (2026-10-03, gren `bakgrund/sprak-och-profiltext`, PR mot `prototyp`)
Bakgrundsjobb (session 2). Rättar två fynd från "E2E-röktester för demots huvudflöde" på Theos uppdrag. Inga ändringar i `screens/`, `design/site.css`, `core/`, `ports/` eller demodatan.

### Klart
- **`<html lang>` följer det valda språket.** `LocaleProvider` (`i18n/context.tsx`) sätter `document.documentElement.lang` i en effekt när språket ändras. Servern renderar fortfarande `lang="sv"` (`app/layout.tsx` är orörd), eftersom språket bara finns i localStorage. Attributet byts efter hydreringen.
- **Profilsamtalets underrubrik** (`onboarding.profile.subtitle`) bad om ett klick som inte finns. Ny text:
  - sv: "Samtalet spelar upp sig självt. Svaren bygger profilen Spark utgår från."
  - en: "The conversation plays out on its own. The answers build the profile Spark works from."
- **Nya `i18n/context.test.tsx`** (3 fall): svenska som standard, att attributet följer bytet åt båda hållen, och ett sparat språk. Motprov: utan effekten fallerar alla tre.
- **Provat i webbläsaren** (Playwright mot `pnpm start`, desktop och mobil): `lang` byts på startsidan, följer med in i demot och tillbaka, och den nya texten syns på båda språken.
- Kontroll: `pnpm typecheck`, `pnpm lint` (0 fel, 3 gamla varningar i `design-referens/`), `pnpm test` (1211 gröna, 42 skippade) och `pnpm build`. Bygget kördes med platshållare för de två publika Supabase-variablerna i skalet, eftersom det inte finns någon `.env.local` här.

### Kända problem
- Den förrenderade HTML:en säger alltid `lang="sv"`. En engelsk besökare får `en` först efter hydreringen. För att rätta det måste språket finnas på servern (en cookie eller en rutt), vilket är ett större beslut.

### Beslut (session 2)
- Attributet sätts i `LocaleProvider` och inte i varje layout, eftersom alla sidor redan ligger under providern.
