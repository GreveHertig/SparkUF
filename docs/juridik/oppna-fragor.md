# Öppna frågor om personuppgiftspolicyn och användarvillkoren

Frågorna kommer från `personuppgiftspolicy-utkast.md` (P1–P19) och
`anvandarvillkor-utkast.md` (V1–V14) i samma mapp. Frågor som hör ihop är
sammanslagna. Det som blockerar mest står först.

Fyll i "Svar:" när svaret kommer, med namn och datum. För sedan in svaret i
utkasten och ta bort markeringen där.

---

## 1. Till UF-rådgivaren (blockerar mest)

Hej! Vi skriver personuppgiftspolicy och användarvillkor för Spark UF och
behöver hjälp med några frågor:

1. **Vem är personuppgiftsansvarig och avtalspart gentemot våra användare?**
   UF-företaget Spark UF, skolan, Ung Företagsamhet eller någon av oss
   personligen? Vilket namn och vilken adress ska stå i villkoren? [P1, V1]

   **Svar:**

2. **Vad händer när UF-året tar slut?** Får tjänsten och avtalen med
   användarna fortsätta efter det, och i så fall under vem? [V2]

   **Svar:**

3. **Finns det regler från UF om användare under 18 år**, till exempel att
   en vårdnadshavare måste godkänna? [P17, V3]

   **Svar:**

Tack!

---

## 2. Till Erik

Hej Erik! Det här är frågorna till dig från utkasten till policy och
villkor. Det räcker med korta svar.

### Avtal och överföring (blockerar policyn)

1. Har vi personuppgiftsbiträdesavtal (DPA) med Supabase, Vercel, Google och
   Tavily? Ja eller nej för var och en, och vem godkände dem. [P5]

   **Svar:**

2. Gemini: vilken skyddsåtgärd gäller när data cachas utanför EU
   (standardavtalsklausuler, Data Privacy Framework eller något annat)? Hur
   länge loggas prompterna? Skicka gärna länken till villkoren du läste.
   [P6]

   **Svar:**

3. Vercel: när är bytet till Frankfurt (fra1) klart? Vilken skyddsåtgärd
   gäller tills dess? [P7]

   **Svar:**

4. Supabase: kan deras support eller underbiträden komma åt vår data från
   länder utanför EU? [P8]

   **Svar:**

### Lagring och säkerhet

5. Hur länge finns raderade uppgifter kvar i säkerhetskopior och loggar hos
   Supabase och Vercel? [P11]

   **Svar:**

6. Hur lagrar Supabase lösenorden? Jag vill bara skriva något om det som vi
   har bekräftat. [P19]

   **Svar:**

### Senare (blockerar inte publiceringen)

7. När registerdatan öppnas för användare: ska policyn nämna personnamn i
   bolagsnamn, enskilda firmor och reklamspärr? Det hänger ihop med §6
   fråga 4 i dataspiken. [P14]

   **Svar:**

---

## 3. Till Theo

Hej Theo! Det här är frågorna till dig från utkasten till användarvillkor
och policy:

### Betalning (blockerar villkoren)

1. Är priserna beslutade, eller fortfarande förslag? Villkoren kan inte
   nämna priser förrän de är beslutade. [V6]

   **Svar:** Inga priser i villkoren. Villkoren hänvisar till prissidan. (Theo, 2026-10-02)

2. Kan du skriva avsnittet om pris och betalning? Det behöver ta upp
   provperioden, hur betalningen dras, uppsägning och gnistor. Det står som
   [THEO: betalningsvillkor] i `docs/juridik/anvandarvillkor-utkast.md`,
   avsnitt 7. [V6]

   **Svar:** Theo skriver avsnitt 7 när gnistorna är definierade. [THEO: betalningsvillkor] står kvar tills dess. (Theo, 2026-10-02)

3. Ångerrätten i praktiken: hur ångrar sig en användare och hur betalas
   pengarna tillbaka? Vad gäller för gnistor som redan har förbrukats?
   Juristen svarar på vad lagen kräver, du på hur det ska fungera. [V7]

   **Svar:** Full återbetalning inom 14 dagar, oavsett förbrukade gnistor. Användaren mejlar oss, och vi betalar tillbaka till samma kort inom 5 arbetsdagar. (Theo, 2026-10-02)

4. Vad händer med ett betalt abonnemang när någon avslutar kontot, eller när
   vi stänger ett konto som brutit mot villkoren? [V11, V12]

   **Svar:** Avslutat konto: abonnemanget löper ut vid periodens slut, ingen återbetalning av återstående tid, och data raderas enligt policyn. Konto som stängs för regelbrott: återbetalning av outnyttjad period, utom vid bedrägeri eller missbruk. (Theo, 2026-10-02)

### Appen

5. Ska vi bygga en knapp för att radera kontot före lanseringen, eller
   räcker det med ett mejl till spark.ai.uf@gmail.com? [P12]

   **Svar:** Radering via mejl till lanseringen. En knapp kommer i version två, och policyn ska säga att den kommer. (Theo, 2026-10-02)

6. Vad lovar vi en betalande användare om tjänsten är nere eller om en
   funktion tas bort? [V8]

   **Svar:** Ingen tillgänglighetsgaranti. 30 dagars varsel innan en funktion tas bort, med rätt att säga upp utan kostnad. Vid driftstopp ingen kompensation, men man kan alltid avsluta. (Theo, 2026-10-02)

### Senare (blockerar inte publiceringen)

7. Utskicken: när sändningen byggs, är det användaren som skickar mejlen och
   ansvarar för dem? Hur informeras mottagarna enligt GDPR artikel 14? Den
   frågan tar vi tillsammans, jag och du. [P15, V4]

   **Svar:** Tas senare. (Theo, 2026-10-02)

---

## 4. Till hela teamet (Erik, Theo, Oskar)

Fyra förslag att godkänna. Svara ja, nej eller med ett annat förslag:

1. **Väntelistan** raderas senast 2026-12-30. [P9]

   **Svar:** Ja, väntelistan raderas 2026-12-30. (Theo, 2026-10-02)

2. **Radering av konto** sker genom ett mejl till spark.ai.uf@gmail.com och
   utförs inom en månad. [P9, P12, V10]

   **Svar:** Ja, via mejl inom en månad. Vi bekräftar mottagandet samma dag. (Theo, 2026-10-02)

3. **Inaktiva konton** raderas efter 12 månader utan aktivitet. Vad räknas
   som aktivitet: inloggning eller något annat? Varnar vi innan, och hur
   många dagar innan? [P9, P10, V10]

   **Svar:** Ja, efter 12 månader. Aktivitet betyder inloggning eller ändring i projektet. Varning två gånger, 30 och 7 dagar innan. (Theo, 2026-10-02)

4. **All data raderas om Spark läggs ner.** Hur långt i förväg meddelar vi
   användarna, och inom vilken tid raderar vi? [P9, V10, V13]

   **Svar:** 90 dagars varsel, och användaren kan exportera all sin data innan. Exporten ska stå i löftet. (Theo, 2026-10-02)

Och två korta frågor:

5. Hur många dagar i förväg meddelar vi användarna om ändrade villkor?
   [V13]

   **Svar:** 30 dagars varsel, med rätt att säga upp utan kostnad. (Theo, 2026-10-02)

6. Godkänner ni att användaren äger sin idé och att Spark bara får lagra och
   behandla innehållet för att ge tjänsten? [V5]

   **Svar:** Användaren äger sin idé. Det ska stå tydligt och tidigt i villkoren, inte långt ner. (Theo, 2026-10-02)

---

## 5. Till en jurist (när vi har en)

Hej! Vi har två utkast, en personuppgiftspolicy och användarvillkor, för en
tjänst som drivs som UF-företag. Kan du svara på det här?

### Personuppgiftspolicyn

1. Är de rättsliga grunder vi föreslår rätt valda? Samtycke för
   väntelistan, avtal för kontot och tjänsten, berättigat intresse för
   IP-adressen i spamskyddet. [P3]

   **Svar:**

2. Räknas cookierna för inloggningen som nödvändiga, så att de inte kräver
   samtycke? [P4]

   **Svar:**

3. Behöver vi ett dataskyddsombud? [P2]

   **Svar:**

4. Tjänsten räknar automatiskt fram en poäng för en affärsidé. Den bedömer
   idén, inte personen. Är det ett automatiserat beslut eller en profilering
   enligt artikel 22? [P13]

   **Svar:**

### Användarvillkoren

5. Ångerrätten: vem räknas som konsument hos oss, vad gäller om tjänsten
   används under ångerfristen, och vad måste vi informera om före köpet?
   [V7]

   **Svar:**

6. Kan du formulera ansvarsbegränsningen så att den håller mot konsumenter?
   [V9]

   **Svar:**

7. Vilken domstol eller nämnd gäller vid en tvist, och vad måste vi upplysa
   konsumenter om? [V14]

   **Svar:**

8. Vad gäller för användare under 18 år, både för att skapa konto och för
   samtycket till väntelistan? [P17, V3]

   **Svar:**

### Senare

9. Hur ska vi informera mottagarna enligt artikel 14 när användare kontaktar
   företag via tjänsten, och vilken rättslig grund gäller för deras
   mejladresser? [P15]

   **Svar:**

---

## Kvar hos Oskar (ingen fråga att skicka)

- **[P18]** När svaren har kommit ska `/integritet` och i18n-texterna stämma
  med policyn. Det gäller särskilt "lagras inom EU" (Vercel kör i USA tills
  Erik byter till fra1) och "raderas efter lanseringen".
- **[P16]** När Medgrundaren byggs måste policyn uppdateras om idén börjar
  skickas till Gemini.
