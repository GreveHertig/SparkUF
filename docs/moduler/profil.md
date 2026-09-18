# Modul: Profil

## Syfte

Grundarens person — vem hen är, vad hen kan, hur mycket tid/pengar/riskaptit
hen har. Byggs upp i **01 Om dig** (profilsamtal) och sitter sedan i
sidhuvudet (namn, initialer) samt i Minnets Profilen-flik
(`docs/moduler/minnet.md`, som återanvänder samma underliggande data men via
en egen port). `ProfileRepository` är den smalaste porten i systemet — bara
identiteten, inte bakgrund/resurser (de hör till Minnet).

## Porten

`ports/ProfileRepository.ts`:

```ts
getProfile(): Promise<Profile>
getOnboardingScript(entry: OnboardingEntry, locale: Locale): Promise<OnboardingScript>
```

`Profile` (`core/domain.ts`): `{ name: string; initials: string }`.

`getOnboardingScript` (tillagd i Session 5, `docs/status.md`) är profilsamtalets
frågor och klickbara svarsförslag (**01 Om dig**, `/start/profil`) — inte
fritext än. `entry` (`OnboardingEntry`, `core/domain.ts`) väljer hela samtalet
(ingång A) eller det kortare passform-samtalet efter idégenomlysningen
(ingång B, uppdrag 2.1). Skriver inget till `profiles`-tabellen själv — den
riktiga liveadaptern behöver antingen generera frågorna dynamiskt (Gemini,
`CofounderAgent`-mönstret) eller ersätta chippen med fritext, och i båda
fallen till slut spara svaren via en skrivmetod som inte finns än. Flaggat,
inte löst här.

## Datakällor och vad som krävs

- **Supabase**, tabell `profiles` (uppdrag 14.4) — en rad per inloggad
  användare, `user_id` som primärnyckel/foreign key mot `auth.users`. RLS:
  en policy som bara ger användaren åtkomst till sin egen rad
  (`user_id = auth.uid()`).
- Ingen extern tjänst, inget API-nyckelbehov. `getProfile()` läses direkt ur
  Supabase med den inloggade användarens session — ingen `service_role`-nyckel
  behövs för en enkel egen-rad-läsning (den används från klienten via RLS,
  eller från en server component med användarens session).
- Namn och initialer sätts vid registrering/onboarding (**01 Om dig**) —
  ingen extern källa att verifiera mot, det är grundarens egna uppgifter.

## Hur demoadaptern fungerar i dag

`adapters/demo/ProfileRepository.ts` returnerar `saraProfile`
(`adapters/demo/sara.ts`: `{ name: "Sara Lindqvist", initials: "SL" }`) rakt
av — inget läge, ingen `locale` (namnet är detsamma på båda språken).

`getOnboardingScript` returnerar Saras respektive Jonas redan skrivna
frågor/svar (samma innehåll, olika datastruktur, som Saras del av
`cofounderScript.ts`s `"01-om-dig"`) beroende på `entry`.

## Acceptanskriterier

- `getProfile()` returnerar alltid en profil för **den inloggade
  användaren**, aldrig någon annans rad (verifieras av RLS-policyn, inte
  bara adapterkoden).
- `name` och `initials` är alltid ifyllda — en användare utan namn har inte
  slutfört **01 Om dig**, och den sidan visar då ett tomt tillstånd, inte en
  halvfärdig profil.
- Klarar kontraktstestet i `ports/ProfileRepository.contract.test.ts`
  (kontraktstestet prövar i dag bara `getProfile` — `getOnboardingScript` är
  inte kontraktstestad ännu, se `docs/status.md` Session 5).

## Säkerhet

RLS på `profiles`, policy begränsad till `user_id = auth.uid()`. Inga
hemliga nycklar. Namn är personuppgift — samma raderingskrav som övriga
användardata i Supabase (GDPR, gäller hela plattformen, inte unikt för den
här modulen).

## Status

stub — `adapters/live/ProfileRepository.ts` kastar `NotImplementedError` för
båda metoderna. Demoadaptern är klar och används av `/demo/app`s sidhuvud
och (sedan Session 5) `/demo/start/profil`. `getProfile` är fortfarande
enklast att bygga tidigt i Session P1 tillsammans med inloggningen;
`getOnboardingScript` väntar troligen på designbeslutet om profilsamtalet
ska bli ett riktigt Gemini-samtal (se ovan) innan den byggs på riktigt.
