# Modul: Valideringen (samtalsloggen)

## Syfte

**05 Samtalen och 06 Domen** i `/app` (uppdrag avsnitt 1.5), utan att Spark
skickar något. Grundaren pratar själv med kunderna, i vilken kanal som helst
(telefon, LinkedIn, möte, egen mejl), och loggar varje samtal i Spark. Spark
hjälper före, under och efter samtalet:

- **Före:** kontaktlistan (lägg till bolag eller klistra in en lista),
  samtalsguiden (frågor i Mom Test-stil, hur man frågar om priset, vad man
  undviker) och ett första meddelande att kopiera.
- **Under:** status per bolag: planerad → kontaktad → svarat eller nej tack.
  Status går aldrig bakåt.
- **Efter:** svaret loggas strukturerat (problem, pris, motbud, ordagrant
  citat). Det blir bevis, poängen rör sig, och Domen räknas i kod.

Utskick och svar (`docs/moduler/utskick-och-svar.md`) gäller orörd:
sändspärren står kvar, och den här modulen kan inte skicka något. Den dag
sändningen öppnas kan svar som Spark tar emot ligga bredvid de loggade, som
systembevis med full vikt.

## Porten

`ports/ValidationLog.ts` (ny port, beslut i `docs/beslut.md` 2026-10-04):

```ts
getContacts(): Promise<ValidationContact[]>
addContact(input): Promise<ValidationContact>
markContacted(id, channel, contactedOnIso): Promise<void>
markDeclined(id): Promise<void>
saveAnswer(id, channel, answer): Promise<ValidationContact>
removeContact(id): Promise<void>
```

Fel som grundaren kan rätta kastas som `ValidationLogError` med en orsak
(`invalid`, `duplicate`, `backwards`, `limit`, `answered`). Saknas tabellen
kastas `NotImplementedError`, och utan aktivt projekt `EmptyStateError`; sidan
visar då "Kommer snart".

- Liveadapter: `adapters/live/ValidationLog.ts`, mot `public.validation_contacts`.
- Demoadapter: `adapters/demo/ValidationLog.ts`, i minnet. Ingen demosida
  använder den; demots Validering visar fortfarande Saras manusstyrda utskick.
- Kontrakt: `ports/ValidationLog.contract.test.ts`.

## Tabellen

`supabase/migrations/20261004090000_validation_contacts.sql`. **Körs manuellt
i SQL Editor efter granskning**, som de andra.

- En rad per bolag och projekt (unikt index på normaliserat namn), så att
  tröskeln för steg 06 (tre olika bolag) inte går att fylla med ett bolag.
- `project_id, user_id` pekar på `projects (id, user_id)`: en rad kan aldrig
  hängas på någon annans projekt. Raderas med kontot (cascade).
- RLS: select, insert och update på egna rader. Delete bara för bolag som inte
  svarat eller tackat nej: ett obekvämt svar går inte att gömma.
- Triggern `validation_contacts_forward_only`: status går aldrig bakåt, och
  raden kan inte flyttas till ett annat projekt.
- Check-villkor: ett svar är komplett eller finns inte, inga datum i framtiden,
  rimliga priser, inga styrtecken i namnet.
- Prövas mot Postgres i `supabase/migrations/validationContacts.pg.test.ts`.

## Från svar till bevis och poäng

`logValidationAnswer` (`app/(app)/app/validering/actions.ts`):

1. Svaret sparas i tabellen.
2. Två bevis skrivs via `public.record_evidence` (beslut B3), med bolaget som
   källa och samtalets dag som datum (`fetched_at` är faktumets dag):
   - problemet: `customerProblemConfirmed` (bekräftar eller delvis) eller
     `customerProblemRejected`
   - priset: `customerPriceAccepted` eller `customerPriceDeclined`. "Tog inte
     ställning" ger inget prisbevis, och ett tidigare prisbevis från samma
     bolag återkallas med en anledning i Spåret.
3. `subject_ref` är `bolag:<namn i gemener>` (`companySubjectRef`), så ett nytt
   svar från samma bolag ersätter det gamla (7.2b).
4. Bevisen är självrapporterade (B6): halva poängen, högst hälften av delen.
   Svaret märks "Din uppgift" överallt där det visas.

Går bevisen inte att skriva står svaret kvar, och skärmen säger att det inte
räknats in än. Nästa sparning försöker igen (dubblettspärren gör det ofarligt).

## Domen

`adapters/live/VerdictProvider.ts` läser loggen och kör `core/verdict.ts`
och `core/verdictReport.ts`, samma kod som demot. Antalet anställda är
storleksklassens nedre gräns (grundaren anger klassen; Registret är grindat).
Svar äldre än 180 dagar räknas inte (B9). Domen visas utan poäng.

## Ren logik

`core/validationLog.ts`: rensning och kontroll av indata, bevissorterna per
svar, nyckeltalen, Domens indata, framsteget mot steg 06 (samma räkning som
`public.complete_journey_step`), nästa steg och varningar om underlaget:

- `allPositive`: minst tre svar och alla positiva. Tyder ofta på ledande frågor.
- `priceNotTested`: hälften eller fler tog inte ställning till priset.
- `oneSize`: minst fyra svar, alla från samma storleksklass.

## Skärmen

`screens/ValidationLive.tsx` och `screens/blocks/ValidationContacts.tsx`.
Siffror ur loggen bär källan "Din samtalslogg" som grundarens egen uppgift
(`SourceTag` med `dataType="user"`), med dagen för den senaste händelsen.
Svaren bär bolaget som källa. Sidan öppnas när steg 02 är klart.

## Personuppgifter

Bara bolagets namn sparas, aldrig en persons namn eller adress. Formuläret
säger det vid namnfältet och vid citatet. Citatet är tredjepartstext: data,
aldrig instruktion, och visas som ren text. Juridisk koll för steg 05 gäller
som förut.

## Kända begränsningar

- Svaren är självrapporterade. Taket i B6 gör att de ensamma kan ge högst
  hälften av Problem och Betalningsvilja.
- Steg 05 och 06 går att uppfylla i loggen, men stegen före (03 och 04)
  kräver registerdata. Så länge Registret är grindat kan grundaren alltså
  logga svar och se domen, men inte markera steg 06 klart.
- Storleksklassen är grundarens uppgift, inte registrets.
- Antaganden med dödskriterier (grundaren skriver i förväg vad som skulle
  motbevisa idén) är inte byggt än.

## Status

**Byggd (2026-10-04).** Port, demo- och liveadapter, migrering, Server
Actions, skärm och Domens liveadapter. Migreringen är inte körd i Supabase.
