# Demo-manus — investerarmöten och jury

Talmanus för de guidade genomgångarna av Spark UF-demot på `/demo`, i en
5- och en 10-minutersversion. Båda följer den guidade rundturens klick
(`adapters/demo/tourSteps.ts`, rubrikerna och vissa brödtexter i
`app/demo/_lib/tourCopy.ts`), inte fri navigering: alla 20 stopp i
10-minutersversionen, ett urval i 5-minutersversionen.

> **Genomgånget rad för rad mot demot 2026-10-01** (produktionsbygget, 1440 och
> 390 px, rundturen körd hela vägen). Rubrikerna nedan är exakt de som står i
> rundturskortet. Siffrorna i hakparentes är vad sidhuvudet visar på stoppet.

## Det här måste du veta om demot

- **Allt i demot är påhittat.** Sara Lindqvist, Jonas Berg, byråerna,
  hallarna, citaten och siffrorna finns inte på riktigt. Sidhuvudet säger
  "Exempel med påhittad data", och varje påhittad uppgift bär en streckad
  tagg: **"EXEMPEL · Påhittad data, steg NN"**. Säg det högt i början. Påstå
  aldrig att en siffra i demot kommer från Bolagsverket, SCB eller någon annan
  verklig källa.
- **Källtaggarnas färger** (visa gärna en gång, det är en poäng i sig):
  streckad vit = exempel, lila "Simulering" = simulering (ger aldrig poäng),
  petrol = kundsvar, blå "Media" = nyhetskälla (bara i den inloggade appen),
  grå = register.
- **Varning: några taggar i demot är fortfarande grå "Bolagsverket" eller
  "Bolagsverket och SCB"** fast datan under är påhittad: nyckeltalen på
  Marknad, Marknaden-avsnittet i Affärsplanen, tre av poängdelarna på Poäng
  (Marknad, Konkurrens, Genomförbarhet) och Jonas idégenomlysning. Klicka inte
  på de taggarna och säg inte att de är verkliga. Peka på "Exempel"-märkningen
  ovanför i stället.
- **Medianomsättningen visas inte.** Marknad visar ett streck och "Räkenskapsåret
  saknas i underlaget, så siffran visas inte." Det är avsiktligt: Spark visar
  hellre en lucka än en siffra utan räkenskapsår. Säg inte "4,2 miljoner".

## Innan du börjar

- Öppna `/demo` i en ren webbläsarflik (privat fönster). Ingen inloggning
  behövs. En ny besökare skickas först till `/demo/start`, valet mellan med
  och utan idé. Det gör inget, rundturen tar över därifrån.
- Tryck `T`, eller klicka **Rundtur på** i demoraden nederst. Det tvingar fram
  Saras persona (ingång A, "Jag har ingen idé") och startar från stopp 1, var
  du än stod.
- Varje stopp har **Nästa** och **Bakåt** i rundturskortet. **Hoppa över**
  avslutar rundturen. Sista stoppet har **Avsluta rundtur**.
- **Rundturen går framåt i tiden.** Poängen i sidhuvudet stiger stopp för
  stopp: 3, 6, 14, 24, 27, 47. Den sjunker en enda gång, 47 → 43 på stopp
  10–11, och det är just det stoppen visar.
- På mobil (390 px) täcker rundturskortet sidans överkant. Det fungerar, men
  visa hellre på en bred skärm.

---

## 10-minutersversionen — alla 20 stoppen

**Ungefär 30 sekunder per stopp, andas mellan varje klick.**

**1. Välkommen till Spark** (`/demo`) [steg 01, poäng 3]
> "Det här är Spark, en medgrundare för UF-företagare. Jag visar er Saras
> resa, steg för steg. Sara är påhittad och allt ni ser är exempeldata, det
> står överst och på varje siffra. Det vi visar är hur Spark arbetar."

**2. Börja med eller utan idé** (`/demo/start`)
> "De flesta har inte en idé redan. Då börjar Spark hos personen: vem är du,
> vad kan du, hur mycket tid och pengar har du. Har man redan en idé
> genomlyser Spark den i stället. Båda landar i samma tolvstegsresa."

**3. Poängen startar på 6 av 100** (`/demo`) [steg 01, poäng 6]
> "1 till 100, alltid synlig uppe till höger. Sara har precis svarat på
> profilfrågorna, poängen är 6. Inte för att idén är dålig, utan för att
> nästan inget är bevisat än."

**4. Medgrundaren hämtar marknadssiffrorna** (`/demo/medgrundaren`) [steg 03, poäng 14]
> "Varje samtal med Medgrundaren slutar med att den gör något. Här hämtar den
> marknadsbilden åt Sara, i stället för att ge ett tips om vad hon borde kolla
> upp. I demot är siffrorna påhittade. Spark är byggt för att hämta dem ur
> Bolagsverket och SCB."

**5. 312 byråer, varje siffra med källa** (`/demo/marknad`) [steg 03, poäng 24]
> "312 byråer, 18 procent växte mer än tio procent förra året, 31 procent i
> Stockholms län. I Spark bär varje tal en källa, ett datum och hur många
> bolag det bygger på: 171 av 312, 308 av 312. Och se medianomsättningen: den
> visas inte, för underlaget saknar räkenskapsår. Spark visar hellre en lucka
> än en gissning."

**6. Tre namngivna konkurrenter** (`/demo/marknad`)
> "Varje aktiebolag i Sverige lämnar en offentlig årsredovisning. När Sara
> kopplat sitt företag bygger Spark konkurrentbilden på dem i stället för på
> en gissning. De tre här är påhittade, det står på dem."

**7. Hiasynth-simuleringen ger inga poäng** (`/demo/marknad`)
> "Ovanpå marknadsbilden kan Spark lägga simuleringar över en syntetisk
> population, alltid märkta 'Simulering' i lila. De ger aldrig poäng och
> blandas aldrig med fakta. Hiasynth är ett koncept i dag, inget partnerskap."

**8. Utan kundsvar stannar poängen under 30** (`/demo`) [steg 04, poäng 27]
> "Nu har hon marknads- och kundunderlag, poängen är 27, men den kan inte gå
> över 30. Spark kallar inget bevisat förrän ett enda riktigt kundsvar finns.
> Det är en regel i koden, inte en känsla."

**9. Spark mejlade 20 byråer från Saras Gmail** (`/demo/validering`) [steg 05, poäng 47]
> "Inte bara ett tips om att höra av sig. Spark skriver utskicket på svenska
> och skickar det åt Sara. Här har 20 byråer kontaktats och sex har svarat."

Lova inte att Spark bevakar öppningar automatiskt. Rundturskortet säger det,
men spårningen är struken ur MVP:n (docs/buggar-2026-09.md punkt 15).

**10. Nio byråer svarade, citerade med namn** (`/demo/validering`) [steg 05, poäng 43]
> "Nio av 20 svarade, 45 procent. Svaren citeras rakt av, med bolagets namn.
> Med egen svarsdata kan Spark jämföra Saras svarsfrekvens med andra utskick
> i samma bransch, en jämförelse ingen konkurrent har underlag för."

**11. Poängen sjönk från 47 till 43** (`/demo`) [steg 05, poäng 43]
> "Tre av nio sa nej till priset, och poängen faller från 47 till 43. Spark
> mjukar aldrig upp en motsägelse för att hålla siffran uppe."

**12. Domen blev Förfina** (`/demo/resan/6`) [steg 06, poäng 54]
> "Ur de faktiska svaren landar Spark i 'Förfina': sju av nio bekräftar
> problemet, men alla som sa ja har tio eller fler anställda. Segmentet snävas
> in. En slutsats ur citat och siffror, inte en känsla."

**13. Priset landar på 1 190 kr/mån** (`/demo/resan/7`) [steg 07, poäng 60]
> "Prisförslaget vilar på fyra saker: vad kunderna tål, vad jämförbara
> aktörer tar, vad kunderna själva sagt, och vad som krävs för att gå ihop
> med moms och arbetsgivaravgifter. En svensk kalkyl, inte en amerikansk mall."

**14. Åtta delar ger 60 av 100** (`/demo/poang`) [steg 07, poäng 60]
> "Åtta delar, var och en med källa. Ingen modell bedömer. Nedbrytningen går
> att räkna för hand ur samma underlag som visas här."

Klicka inte på de grå "Bolagsverket"-taggarna här (se ovan).

**15. Snabbaste poängen står överst** (`/demo/poang`)
> "Högst avkastning per insats överst. Varje förslag har en av tre sorters
> luckor: för lite underlag, motsägande underlag, eller en strukturell lucka
> som kräver ett helt steg."

**16. Juridiken för just Saras bolag** (`/demo/juridik`) [steg 09, poäng 70]
> "En juridisk karta för just det här företaget, från steg 05 och framåt. Varje
> krav länkar till sin källa: Bolagsverket, Skatteverket, IMY. Vi märker
> varje källa 'Overifierad' tills en människa kontrollerat den, och inget är
> granskat av jurist än. Spark ger vägledning, inte juridisk rådgivning."

**17. Lovable bygger sidan sist** (`/demo/bygg`) [steg 10, poäng 77]
> "Medgrundaren skriver byggspecen ur bevisen, Lovable bygger sidan. Bygget
> kommer sist av en anledning: Spark bygger bara det kunderna redan bett om.
> Lovable är ett koncept i dag, inget avtal."

Klicka inte på adressen `kvittojakten.lovable.app`. Sidan finns inte.

**18. Dagliga marknadssignaler om Saras bransch** (`/demo/pulsen`) [steg 12, poäng 92]
> "En daglig marknadssignal kopplad till Saras idé och kundsegment, med en
> mening om varför den spelar roll för just henne. Signalerna här är exempel.
> I den inloggade appen kommer de från nyhetskällor och märks 'Media'."

**19. 249 kr i månaden, bygget ingår** (`/demo/pulsen`)
> "Först en gratis provvecka. Sedan låser Grundare-nivån, 249 kronor i
> månaden, upp hela resan med bygget, full Puls och juridisk koll. Tar
> gnistorna till bygget slut fyller man på för 99 kronor. Priset är ett
> förslag och inte fastställt."

**20. Klart. Nu kan du utforska själv** (`/demo/pulsen`)
> "Klicka runt fritt nu: byt ingång för att se Jonas resa, eller börja om
> från början."

---

## 5-minutersversionen — ett urval

**Samma rundtur, men klicka Nästa snabbt förbi de stopp som inte står här**
(2, 5, 6, 7, 13, 14, 15, 18) **och pausa vid:**

**1. Välkommen till Spark** — samma text. Säg att allt är exempeldata.

**3. Poängen startar på 6 av 100** — samma text.

**4. Medgrundaren hämtar marknadssiffrorna** — samma text.

**8. Utan kundsvar stannar poängen under 30** — samma text. Det här är
kärnargumentet, ge det extra tid.

**10. Nio byråer svarade, citerade med namn** — samma text.

**11. Poängen sjönk från 47 till 43** — samma text. Säg uttryckligen: "Spark
ljuger aldrig för att se bra ut."

**12. Domen blev Förfina** — samma text.

**17. Lovable bygger sidan sist** — samma text.

**19. 249 kr i månaden, bygget ingår** — samma text.

**20. Klart. Nu kan du utforska själv** — samma text.

Tio stopp á 25–30 sekunder plus klicktid, strax under fem minuter.

---

## Värt att visa efter rundturen (nytt sedan förra manuset)

- **Affärsplanen** (`/demo/affarsplan`). Sätts samman i kod ur det som redan
  finns i resan, aldrig genererad. Vid rundturens slut står Sara på 8/9.
  Visa en lucka: "Underlag saknas — kommer från steg N" eller "Steg N är
  klart, men gav inget underlag med källa till det här avsnittet." Poängen:
  Spark fyller aldrig i det som inte är bevisat.
- **Källtyperna.** På Marknad syns exempel (streckad), simulering (lila) och
  utskickets kundsvar (petrol) på samma sida.
- **Jonas resa** (ingång B, "Byt ingång" i demoraden). Börja på
  `/demo/start/ide`: idégenomlysningen bryter ner en svag konsumentidé och
  föreslår en skarpare B2B-idé. Kör inte rundturen härifrån. Undvik
  Marknad, Validering, Juridik och Bygg för Jonas: de står som "Låst — Det
  här steget är inte genomfört i det här scenariot" fast Hem säger att stegen
  är klara.

---

## Om rundturen inte används

Samma innehåll nås genom **Hoppa till steg** i demoraden. Stoppens
hakparenteser ovan anger steget och poängen som hör till. Poäng och citat är
identiska, bara utan rundturskortet.

## Regler vid visning

1. **Kör aldrig rundturen från Jonas.** Den finns bara för Sara (knappen står
   som "Rundtur (låst)" i Jonas läge).
2. **Öppna aldrig en djup adress direkt.**
3. **Ladda inte om sidan mitt i en visning.** Starta alltid från början och
   klicka dig fram.
4. **Visa aldrig liveregisterdata för någon utanför Theo och Erik.** Det gäller
   även jury och investerare. Logga inte in i `/app` och öppna inte
   `/app/marknad` under en visning.
