# Personuppgiftspolicy för Spark

> **Utkast – inte granskat av jurist**
>
> Skrivet 2026-10-02 utifrån koden på `prototyp` och fakta från Erik
> (2026-10-02). Markeringar i texten:
> - **[VÄNTAR: …]** – vi väntar på ett svar eller en ändring.
> - **[FÖRSLAG, ej beslutat]** – ett förslag som teamet måste godkänna.
> - **[FRÅGA: …]** – oklart, måste redas ut innan texten publiceras.
>
> Listan över alla öppna frågor står sist i dokumentet.

Senast uppdaterad: [datum när policyn publiceras]

## 1. Vem som ansvarar för dina uppgifter

Personuppgiftsansvarig är [VÄNTAR: svar från UF om vem som är ansvarig –
UF-företaget Spark UF, skolan, Ung Företagsamhet eller en av oss
personligen].

Kontakt i alla frågor om personuppgifter: **spark.ai.uf@gmail.com**

[FRÅGA: Behöver Spark ett dataskyddsombud? Troligen inte, men det ska
bekräftas.]

## 2. Kort sammanfattning

- Vi samlar bara in det som behövs för att Spark ska fungera.
- Dina uppgifter lagras i en databas i Frankfurt (Tyskland).
- Vi säljer aldrig dina uppgifter.
- Den språkmodell vi använder (Google Gemini) tränar inte på våra data.
- Du kan när som helst be oss visa, rätta eller radera dina uppgifter.

## 3. Vilka uppgifter vi behandlar, varför och med vilken rätt

I tabellen står varje behandling för sig. Kolumnen "Rättslig grund" säger
vilken regel i dataskyddsförordningen (GDPR) som ger oss rätt att behandla
uppgifterna. Alla rättsliga grunder är **[FÖRSLAG, ej beslutat]** tills en
jurist har läst dem.

| Behandling | Uppgifter | Ändamål | Rättslig grund (förslag) | Varför just den grunden |
|---|---|---|---|---|
| **Väntelistan** på startsidan | Mejladress och när du skrev upp dig | Meddela dig när Spark öppnar | **Samtycke** (art. 6.1 a) | Du väljer själv att skriva upp dig och kan ångra dig. Det är också den grund som redan står på sidan `/integritet`. |
| **Spamskydd** för väntelistan | IP-adress | Stoppa automatiska anmälningar | **Berättigat intresse** (art. 6.1 f) | Vi har ett intresse av att listan inte fylls med skräp. Adressen finns bara i serverns minne en kort stund och sparas aldrig i databasen. |
| **Ditt konto** | Namn, mejladress och lösenord (lösenordet hanteras av Supabase inloggning) [FRÅGA: Bekräfta hur Supabase lagrar lösenord, innan vi skriver något om det.] | Skapa kontot och låta dig logga in | **Avtal** (art. 6.1 b) | Kontot behövs för att vi ska kunna ge dig tjänsten enligt användarvillkoren. |
| **Inloggningen** | Cookies för inloggningen | Hålla dig inloggad | **Avtal** (art. 6.1 b) | Utan dem fungerar inte inloggningen. [FRÅGA: Bekräfta att de här cookierna räknas som nödvändiga och inte kräver samtycke.] |
| **Profilsamtalet** | Det du berättar om dig själv: roll, bakgrund, tid, pengar och hur mycket risk du vill ta | Anpassa resan och förslagen efter dig | **Avtal** (art. 6.1 b) | Det är själva tjänsten. Spark kan inte anpassa råden utan uppgifterna. |
| **Din affärsidé och din resa** | Idéns namn och beskrivning, stegen du gjort, bevis med citat, poäng, dina anteckningar och en logg över vad som hänt | Driva resan, räkna poängen och komma ihåg dina beslut | **Avtal** (art. 6.1 b) | Samma skäl som ovan. |
| **Pulsen** (nyheter för din bransch) | Några ord ur idéns namn och beskrivning | Hitta nyheter som rör din idé | **Avtal** (art. 6.1 b) | Pulsen är en del av tjänsten. Bara enstaka ord skickas, aldrig ditt namn eller din mejladress. |
| **Språkval** | Svenska eller engelska | Visa sidan på rätt språk | Ingen personuppgift som skickas till oss | Valet sparas bara i din webbläsare (`localStorage`). |

**Det vi inte gör:** vi använder inga verktyg för analys eller spårning och
inga reklamcookies.

### Funktioner som inte är öppna för användare än

- **Riktig företagsdata från Bolagsverket och SCB.** Bolagsnamn kan
  innehålla personnamn, till exempel i handelsbolag. Funktionen används bara
  internt av teamet. [FRÅGA: Hur ska behandlingen beskrivas när den öppnas?
  Hänger ihop med frågan om enskilda firmor och reklamspärr i
  `docs/dataspiken.md` §6 fråga 4.]
- **Utskick till företag i valideringen.** Spark kan i dag leta upp en
  kontaktadress på ett företags webbsida och skriva ett utkast till mejl,
  men inte skicka något. Funktionen används bara internt av teamet.
  [FRÅGA: Innan den öppnas behöver vi bestämma hur mottagarna informeras
  enligt artikel 14 (uppgifter som inte samlats in från den registrerade),
  och vilken rättslig grund som gäller för deras mejladresser.]

Policyn uppdateras innan någon av funktionerna öppnas för användare.

### Automatiserade beslut

Spark räknar automatiskt fram en poäng för din affärsidé. Poängen bedömer
idén och underlaget, inte dig som person, och leder inte till något beslut
som påverkar dig rättsligt. [FRÅGA: Jurist bekräftar att poängen inte är
ett automatiserat beslut eller en profilering enligt artikel 22.]

### Måste du lämna uppgifterna?

Du behöver inte lämna några uppgifter. Men utan mejladress och lösenord kan
du inte skapa ett konto, och utan profilsvar och idé kan Spark inte ge dig
anpassade råd. Demot på `/demo` fungerar helt utan konto och utan
personuppgifter.

## 4. Vem som får dina uppgifter

Vi säljer aldrig dina uppgifter. Vi delar dem bara med de tjänster som
behövs för att driva Spark. De behandlar uppgifterna för vår räkning.

| Mottagare | Vad tjänsten gör | Vad den får | Var |
|---|---|---|---|
| **Supabase** | Databas och inloggning | Allt i tabellen i avsnitt 3 som sparas | Frankfurt, Tyskland |
| **Vercel** | Driver webbplatsen | Allt som skickas till och från webbplatsen | Frankfurt, Tyskland [VÄNTAR: Vercel i USA tills Erik bytt till fra1] |
| **Google (Gemini)** | Språkmodell | I dag bara vilken bolagsform du valt i Juridisk koll, inga uppgifter om dig. [FRÅGA: Uppdatera när Medgrundaren byggs. Då kan din idé skickas till Gemini.] | Se avsnitt 5 |
| **Tavily** | Webbsökning för Pulsen | Några ord ur idéns namn och beskrivning, inga namn eller mejladresser | USA, se avsnitt 5 |

[FRÅGA: Finns ett personuppgiftsbiträdesavtal (DPA) med var och en av
Supabase, Vercel, Google och Tavily? Vem har godkänt dem?]

Inom Spark-teamet har bara de som behöver det åtkomst:
- **Databasen (Supabase):** Erik och Theo.
- **Driften (Vercel) och tjänsternas nycklar:** bara Erik.

## 5. Överföring utanför EU och EES

- **Tavily** finns i USA. Överföringen skyddas av **EU:s
  standardavtalsklausuler**.
- **Google Gemini:** enligt Googles villkor för EES tränar Google inte sina
  modeller på våra data. Prompter loggas en begränsad tid för att upptäcka
  missbruk. **Data kan cachas utanför EU.** [FRÅGA: Vilken skyddsåtgärd
  gäller då (standardavtalsklausuler, EU–US Data Privacy Framework eller
  något annat)? Hur länge loggas prompterna? Länka till Googles villkor.]
- **Vercel:** [VÄNTAR: Vercel i USA tills Erik bytt till fra1]. Tills
  bytet är gjort går trafiken via USA. [FRÅGA: Vilken skyddsåtgärd gäller
  tills dess?]
- **Supabase** lagrar allt i Frankfurt. [FRÅGA: Kan Supabase support eller
  underbiträden komma åt data från länder utanför EU?]

## 6. Hur länge vi sparar uppgifterna

| Uppgifter | Hur länge |
|---|---|
| Väntelistan | Raderas senast **2026-12-30**, eller tidigare om du ber om det. **[FÖRSLAG, ej beslutat]** |
| IP-adress för spamskyddet | Bara i serverns minne, försvinner när servern startas om. Sparas aldrig. |
| Konto och allt som hör till det | Så länge du har kontot. Kontot raderas efter **12 månader utan aktivitet**. **[FÖRSLAG, ej beslutat]** [FRÅGA: Vad räknas som aktivitet? Varnar vi innan, och i så fall hur långt innan?] |
| När du raderar kontot | Allt som hör till kontot raderas samtidigt (profil, idéer, resa, bevis, anteckningar och logg). **[FÖRSLAG, ej beslutat]** om hur det går till, se avsnitt 7. |
| Om Spark läggs ner | **All data raderas.** **[FÖRSLAG, ej beslutat]** [FRÅGA: Inom hur lång tid?] |

[FRÅGA: Sparar Supabase och Vercel säkerhetskopior och loggar, och hur
länge finns uppgifterna kvar där efter radering?]

## 7. Dina rättigheter

Du har rätt att:

- **få veta** vilka uppgifter vi har om dig och få en kopia av dem
  (art. 15);
- **få fel rättade** (art. 16);
- **få uppgifterna raderade** (art. 17);
- **begränsa** hur vi använder uppgifterna (art. 18);
- **få ut dina uppgifter** i ett format som går att flytta till en annan
  tjänst, när behandlingen bygger på samtycke eller avtal (art. 20);
- **invända** mot behandling som bygger på berättigat intresse (art. 21);
- **ta tillbaka ditt samtycke** när som helst, till exempel för
  väntelistan. Det påverkar inte det vi gjort innan (art. 7.3).

**Så gör du:** mejla **spark.ai.uf@gmail.com** från den adress du använder
hos oss. Vi svarar och utför det inom **en månad**. **[FÖRSLAG, ej
beslutat]** för radering av konto.

[FRÅGA: Appen saknar en egen knapp för att radera kontot. I dag kan det
bara göras för hand i Supabase. Räcker det med mejl, eller ska en knapp
byggas före lanseringen?]

## 8. Klaga hos IMY

Om du tycker att vi behandlar dina uppgifter fel kan du klaga hos
**Integritetsskyddsmyndigheten (IMY)**, www.imy.se. Hör gärna av dig till
oss först, så försöker vi lösa det.

## 9. Säkerhet

- Varje användare kan bara läsa sina egna uppgifter. Det styrs i databasen
  (radnivåsäkerhet, RLS), inte bara i appen.
- Nycklarna till externa tjänster finns bara på servern, aldrig i
  webbläsaren.
- Väntelistan kan inte läsas av besökare. Bara teamet ser den, i Supabase.

## 10. Ändringar i policyn

Vi uppdaterar policyn när Spark ändras, till exempel när nya funktioner
öppnas. Datumet överst visar när den senast ändrades. Om ändringen är stor
meddelar vi dig via mejl innan den börjar gälla. **[FÖRSLAG, ej beslutat]**

---

## Öppna frågor

| # | Fråga | Vem svarar |
|---|---|---|
| 1 | Vem är personuppgiftsansvarig? | UF (Ung Företagsamhet), via Erik |
| 2 | Behövs ett dataskyddsombud? | Jurist |
| 3 | Är rättsliga grunderna i avsnitt 3 rätt valda? | Jurist |
| 4 | Är inloggningscookierna nödvändiga, så att de inte kräver samtycke? | Jurist |
| 5 | Finns personuppgiftsbiträdesavtal med Supabase, Vercel, Google och Tavily? | Erik |
| 6 | Gemini: skyddsåtgärd vid cachning utanför EU, hur länge prompter loggas, länk till villkoren | Erik |
| 7 | Vercel: när är bytet till Frankfurt (fra1) klart, och vad gäller tills dess? | Erik |
| 8 | Supabase: kan support eller underbiträden nå data utanför EU? | Erik |
| 9 | Godkänn lagringstiderna: väntelistan senast 2026-12-30, radering efter 12 månader utan aktivitet, all data raderas om Spark läggs ner | Teamet (Erik, Theo, Oskar) |
| 10 | Vad räknas som aktivitet, och varnar vi innan ett konto raderas? | Teamet |
| 11 | Hur länge finns raderade uppgifter kvar i säkerhetskopior och loggar? | Erik |
| 12 | Godkänn radering via mejl inom en månad, eller bygg en knapp före lanseringen? | Teamet, Theo för appen |
| 13 | Är poängen ett automatiserat beslut eller en profilering enligt art. 22? | Jurist |
| 14 | Registerdata: hur beskrivs behandlingen när den öppnas (personnamn i bolagsnamn, enskilda firmor, reklamspärr)? | Erik, jurist |
| 15 | Utskick: information till mottagarna enligt art. 14, och rättslig grund för deras mejladresser | Theo, Oskar (Juridisk koll), jurist |
| 16 | Medgrundaren: policyn måste uppdateras om din idé börjar skickas till Gemini | Den som bygger Medgrundaren |
| 17 | Får Spark användas av personer under 18 år, och påverkar det samtycket för väntelistan? | Jurist, UF |
| 18 | Sidan `/integritet` och texterna i i18n säger "raderas efter lanseringen" och "lagras inom EU". De behöver stämma med den här policyn, särskilt så länge Vercel är i USA. | Oskar, efter beslut |
| 19 | Hur lagrar Supabase lösenord? Bekräfta innan policyn säger något om det. | Erik |
