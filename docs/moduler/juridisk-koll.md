# Modul: Juridisk koll

## Syfte

Ingen egen persona/sida än — en förmåga hos Medgrundaren, nåbar via knappen
"Juridisk koll" i chatten och på varje steg i resan. Dyker upp automatiskt vid
steg 05 (utskick), 09 (formalia) och 10 (lansering/GDPR).
Resultat: en juridisk karta för det specifika företaget — per lag/regel:
vad den konkret kräver, status (klart/att göra/bevaka), källa + datum.
Obligatorisk ansvarsbegränsning på varje juridisk yta:
"Spark ger vägledning, inte juridisk rådgivning. Kontrollera med jurist vid behov."

## Porten

`ports/LegalAdvisor.ts`:
`getLegalMap(bolagsform: Bolagsform): Promise<JuridisktKrav[]>`
Typer i `types/legal.ts` (Bolagsform, JuridisktKrav) och `types/evidence.ts` (Källa).

## Datakällor och vad som krävs

- Liveadaptern bygger på Gemini + en kuraterad, hårdkodad källista
  (`adapters/live/legalSources.ts`): Bolagsverket, Skatteverket, verksamt.se,
  IMY, EUR-Lex (GDPR-förordningen), Konsumentverket, Bokföringsnämnden,
  Riksdagen.
- **Gemini får aldrig ange en egen källa, avgift, deadline eller myndighet.**
  Modellen väljer bara vilka ämnen ur en sluten katalog (`LEGAL_TOPICS`) som
  gäller för en given bolagsform och formulerar rubrik/beskrivning. Själva
  `källa`-objektet injiceras alltid från den kuraterade listan i kod, efter
  att modellens svar validerats mot ett `.strict()` zod-schema som strukturellt
  saknar ett `källa`-fält (`adapters/live/legalSchema.ts`). Se
  `adapters/live/LegalAdvisor.ts` för hela flödet.
- GEMINI_API_KEY — skaffa på aistudio.google.com, server-only
  (`lib/server/gemini.ts`, `import "server-only"`), sätts i `.env.local`
  (aldrig committad, se `.env.example`).
- **Verifieringsstatus (2026-10-01):**
  - **Kontrollerade av en människa:** alla källor från Bolagsverket,
    verksamt.se och Bokföringsnämnden (2026-09-30), och alla källor från
    Skatteverket, IMY, EUR-Lex och Konsumentverket (2026-10-01), i
    webbläsaren (se verifieringsloggen nedan). Källorna pekar på de undersidor
    där uppgiften står, inte på startsidorna.
  - **Inte kontrollerad:** Riksdagen (startsida, maskinellt hämtad av Claude
    Code 2026-09-17). Inget ämne använder källan. Om den ska finnas kvar
    väntar på Theos beslut.
  - **Ingenting är juristgranskat.** Ämneskatalogen i
    `adapters/live/legalSources.ts` är en rimlig tolkning av svenska
    bolagsregler, inte sakgranskad av jurist — särskilt vilka ämnen som gäller
    per bolagsform. `kostnadKr`/`deadline`/`myndighet` är medvetet inte
    ifyllda — lägg bara till dem med en verifierad källa för just den siffran,
    aldrig modellgenererat.

## Verifieringslogg

Kontrollerat av: Oskar Jaeger, 2026-09-30 och 2026-10-01

### 2026-10-01 — kontroll i webbläsaren av en människa (Skatteverket, IMY, EUR-Lex, Konsumentverket)

Kontrollerat i webbläsaren 2026-10-01 av Oskar Jaeger. Resultat, ordagrant:

1. Skatteverket – f_skatt: DELVIS. F-skatt söks hos Skatteverket (e-tjänst via verksamt.se eller blankett SKV 4620). FA-skatt gäller bara enskild näringsverksamhet; AB och HB kan aldrig ha FA-skatt.
   https://www.skatteverket.se/foretag/drivaforetag/startaochregistrera/fochfaskatt.4.58d555751259e4d661680006355.html
2. Skatteverket – moms: DELVIS. Momsregistrering krävs vid momspliktig försäljning över 120 000 kr per år. Högst 120 000 kr är i de flesta fall undantaget (frivillig registrering möjlig). Vissa verksamheter är momsfria.
   https://www.skatteverket.se/foretag/moms/momsregistrering/registreradittforetagformoms.4.deeebd105a602bfe38000256.html
   https://www.skatteverket.se/foretag/moms/momsregistrering/ivissafallbehoverduinteregistreradittforetagformoms.4.3152d9ac158968eb8fd1efe.html
3. Skatteverket – arbetsgivare: STÄMMER. Registrering när man anställer, innan ersättning betalas ut. AB-ägare som tar lön räknas som anställd.
   https://www.skatteverket.se/foretag/arbetsgivare/arbetsgivarregistrering/dittansvarsomarbetsgivare.4.361dc8c15312eff6fd16ec2.html
   https://www.skatteverket.se/foretag/arbetsgivare/arbetsgivarregistrering/registreradig.4.18e1b10334ebe8bc80003496.html
4. IMY – gdpr_personuppgifter: Rättslig grund STÄMMER. Register DELVIS: huvudregel är undantag under 250 anställda, men registret krävs ändå om behandlingen inte är tillfällig, innebär risk eller gäller känsliga uppgifter.
   https://www.imy.se/verksamhet/dataskydd/det-har-galler-enligt-gdpr/rattslig-grund/
   https://www.imy.se/verksamhet/dataskydd/det-har-galler-enligt-gdpr/fora-register-over-behandling/
5. EUR-Lex – gdpr_forordningen: STÄMMER. Föreslå svensk version: https://eur-lex.europa.eu/legal-content/SV/TXT/?uri=CELEX:32016R0679
6. Konsumentverket – marknadsforing_epost: STÄMMER. E-post/sms-reklam till konsumenter kräver godkännande; undantag för tidigare kunder om alla tre villkor är uppfyllda (inte tackat nej, liknande produkter, enkelt att tacka nej).
   https://www.konsumentverket.se/lagar/marknadsforingslagen-konsument/
7. Konsumentverket – konsument_angerratt: DELVIS. 14 dagars ångerrätt vid distansköp gäller konsumenter som köper av företag, inte alla. Undantag finns.
   https://www.konsumentverket.se/konsumentratt-process/angerratt/

Riksdagen: ingen kontroll gjord, ingen topic använder källan. Väntar på Theos beslut.

**Vad som ändrades i `adapters/live/legalSources.ts` efter kontrollen:**
- De gemensamma källorna `skatteverket`, `imy` och `konsumentverket`
  (startsidor) är ersatta av en källa per undersida:
  `skatteverket_f_skatt`, `skatteverket_moms`, `skatteverket_arbetsgivare`,
  `imy_rattslig_grund`, `imy_register`, `konsumentverket_marknadsforing` och
  `konsumentverket_angerratt`, alla med `hämtad: "2026-10-01"`.
- `eurlex_gdpr` (punkt 5) pekar på den svenska versionen.
- `gdpr_personuppgifter` (punkt 4) är uppdelat i `gdpr_rattslig_grund` och
  `gdpr_register`, med var sin IMY-sida. Katalogen har nu 18 ämnen.
- Nya texter för DELVIS-punkterna: `f_skatt` (punkt 1, FA-skatt bara för
  enskild näringsverksamhet), `moms` (punkt 2, gränsen 120 000 kr, frivillig
  registrering, momsfria verksamheter), `gdpr_register` (punkt 4) och
  `konsument_angerratt` (punkt 7, konsumenter som köper av företag, undantag
  finns).
- `moms` och `arbetsgivare` pekar på den första adressen i punkt 2 och 3.
  Den andra adressen står bara här i loggen. Momssidan som används säger både
  huvudregeln och undantaget.
- `riksdagen` är oförändrad (startsida, 2026-09-17, oanvänd).

### 2026-09-30 — kontroll i webbläsaren av en människa (Bolagsverket, verksamt.se, BFN)

Kontrollerat i webbläsaren 2026-09-30. Resultat, ordagrant:

1. Bolagsverket – registrering: STÄMMER. https://bolagsverket.se/foretag/foretagsnamn.1153.html
2. Bolagsverket – aktiekapital: DELVIS. Bankintyg krävs om aktierna betalas med pengar, revisorns yttrande om de betalas med egendom (apport). Inte ett fritt val. Minst 25 000 kr för privat AB. https://bolagsverket.se/foretag/aktiebolag/startaaktiebolag.479.html
3. Bolagsverket – bolagsordning, styrelse, revisor: STÄMMER.
   https://bolagsverket.se/foretag/aktiebolag/startaaktiebolag/bolagsordningforaktiebolag.483.html
   https://bolagsverket.se/foretag/aktiebolag/startaaktiebolag/styrelseochverkstallandedirektoriaktiebolag.505.html
   https://bolagsverket.se/foretag/aktiebolag/startaaktiebolag/revisoriaktiebolag.521.html
4. Bolagsverket – årsredovisning: STÄMMER för både AB och ekonomisk förening.
   https://bolagsverket.se/foretag/aktiebolag/arsredovisningforaktiebolag/arsredovisningsguidenforaktiebolag.5550.html
   https://bolagsverket.se/forening/ekonomiskforening/arsredovisningforekonomiskforening/arsredovisningsguidenforekonomiskforening.5538.html
5. Bolagsverket – stadgar och medlemmar: STÄMMER, minst tre medlemmar. https://bolagsverket.se/forening/ekonomiskforening/startaekonomiskforening.1335.html
6. verksamt.se – drivs av Bolagsverket, Skatteverket och Tillväxtverket: STÄMMER. https://verksamt.se/om-verksamt-se/om-webbplatsen
7. verksamt.se – bolagsavtal och solidariskt ansvar: DELVIS. Solidariskt ansvar stämmer. Bolagsavtal rekommenderas men är inget formellt krav. https://verksamt.se/starta-foretag/valj-foretagsform/handelsbolag
8. bfn.se är Bokföringsnämndens webbplats: STÄMMER.
9. BFN – bokföring: STÄMMER. Alla AB, HB, ekonomiska föreningar och enskilda näringsidkare är bokföringsskyldiga, löpande bokföring, arkivering i 7 år.
   https://www.bfn.se/fragor-och-svar/bokforing/allmanna-bokforingsfragor/
   https://www.bfn.se/redovisningsregler/vad-galler-for/enskilda-naringsidkare/

**Vad som ändrades i `adapters/live/legalSources.ts` efter kontrollen:**
- Varje ämne från Bolagsverket, verksamt.se och BFN pekar på sin undersida
  (en källa per sida, `hämtad: "2026-09-30"`).
- `aktiekapital` (punkt 2): texten säger nu minst 25 000 kr för privat AB,
  bankintyg vid betalning med pengar och revisorns yttrande vid apport.
- `bolagsavtal` (punkt 7): texten säger nu att bolagsavtal rekommenderas men
  inte är ett formellt krav, och att bolagsmännen har solidariskt ansvar.
- `bolagsordning_styrelse` (punkt 3) är uppdelat i tre ämnen, `bolagsordning`,
  `styrelse` och `revisor`, med var sin adress.
- `arsredovisning` (punkt 4) är uppdelat i `arsredovisning_ab` och
  `arsredovisning_ek_forening`, med var sin adress.
- `bokforing` pekar på den första BFN-adressen i punkt 9. Sidan om enskilda
  näringsidkare och verksamt.se:s sida "Om webbplatsen" (punkt 6) används
  inte som källa i koden, bara här i loggen.

**Inte kontrollerat av en människa (vid kontrollen 2026-09-30):**
Skatteverket, IMY, EUR-Lex, Konsumentverket och Riksdagen. De fyra första
kontrollerades 2026-10-01, se ovan. **Inget av detta är juristgranskat.**

## Hur demoadaptern fungerar i dag

`adapters/demo/LegalAdvisor.ts` returnerar bara `[]` än — ingen skärm använder
porten ännu, den juridiska kartan för Sara byggs i Session 4 (steg 09).

## Hur liveadaptern fungerar i dag

`adapters/live/LegalAdvisor.ts` är byggd och klarar kontraktstestet (mockad
Gemini i CI, se nedan). Flöde: validera bolagsform → filtrera kuraterade
ämnen för den bolagsformen → be Gemini välja tillämpliga ämnen och formulera
text → validera svaret mot ett strikt schema (kastar på trasig JSON, okänt
ämnes-id eller extra fält som en smugglad källa) → slå ihop dubbletter (ett
"applicable"-svar vinner alltid över ett tidigare "not_applicable" för samma
ämne) → injicera kuraterad källa → validera slutresultatet mot
`JuridisktKravSchema` innan det returneras. Ingen skärm anropar porten än.

**Att köra det riktiga Gemini-anropet manuellt** (kostar riktiga anrop, körs
inte i CI): `GEMINI_API_KEY=... pnpm test adapters/live/LegalAdvisor.live.test.ts`
— annars skippas den filen automatiskt.

**Känt att bevaka:** felmeddelanden från `LegalAdvisorError` kan innehålla
fragment av Geminis råa (ogiltiga) svar via `z.prettifyError`. I dag stannar
det på servern (ingen route använder adaptern än) — när `/app/juridik` byggs,
visa aldrig det felet rakt av för användaren.

## Acceptanskriterier

- getLegalMap(bolagsform) returnerar JuridisktKrav[] där varje objekt har en
  ifylld källa (namn + hämtad) — aldrig ett påstående utan källa.
- Ogiltig/okänd bolagsform ger ett tydligt fel, ingen tom gissning.
- Svarar även vid tomt resultat (t.ex. inga krav hittade) utan att krascha.
- Klarar kontraktstestet i ports/LegalAdvisor.contract.test.ts.

## Säkerhet

Gemini-nyckeln bara i serverkod, aldrig NEXT*PUBLIC*-prefix. Användarens
bolagsform/indata är data till Gemini, aldrig instruktion. Ingen Supabase-koppling
för den här modulen.

## Status

live (Gemini + kuraterade källor). Källorna från Bolagsverket, verksamt.se och
BFN är kontrollerade av en människa 2026-09-30, övriga fem är bara maskinellt
hämtade. Juridiskt innehåll (ämnenas bolagsformstillhörighet, avgifter,
deadlines) är inte juristgranskat.
Demoadaptern är fortfarande en stub (`[]`), oförändrad.
