## Tydligt fel när registreringen stoppas av mejlgränsen (2026-10-03, gren `fix/registrering-felmeddelande`, PR mot `prototyp`)
När Supabase når gränsen för bekräftelsemejl visade `/skapa-konto` bara "Något gick fel. Försök igen om en stund.", så grundaren visste inte om det var något fel på kontot.

### Klart
- `signUp` (`app/(auth)/actions.ts`) känner igen felet: koden `over_email_send_rate_limit` eller status 429 ger den nya felkoden `rate_limited`. Kontrollen ligger efter "kontot finns redan" (som fortfarande ger "kolla din mejl", skydd mot kontouppräkning) och bara i `signUp`; inloggningen är oförändrad.
- `formErrorKeys` (`app/(auth)/errorMessages.ts`) mappar `rate_limited` till den nya i18n-nyckeln `auth.errors.tooManyAttempts`: "För många försök just nu. Vänta en stund och försök igen." / "Too many attempts right now. Wait a moment and try again."
- Övriga fel ger "Något gick fel" som förut.
- Tester: `app/(auth)/actions.test.ts` (koden, status 429 utan kod, ett annat fel ger fortfarande `unexpected`) och nya `app/(auth)/SignUpForm.test.tsx` (formuläret visar den nya texten, och övriga fel som förut).

### Återstår
- Själva gränsen (antal bekräftelsemejl per timme) ställs in i Supabase (Authentication → Rate Limits, eller egen SMTP). Inte ändrad här.

### Kända problem
- Inga.

### Beslut (Erik 2026-10-03)
- Egen text för mejlgränsen, på sv och en. Inloggningens fel ändras inte i den här PR:en.
