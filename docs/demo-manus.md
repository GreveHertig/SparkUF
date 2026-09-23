# Demo-manus — investerarmöten

Talmanus för de guidade genomgångarna av Spark UF-demot, i en 5- och en
10-minutersversion. Båda följer den guidade rundturens klick (avsnitt 9.2,
`adapters/demo/tourSteps.ts`), inte fri navigering — samma 20 stopp i
10-minutersversionen, en kurerad delmängd i 5-minutersversionen.

## Innan du börjar

- Öppna `/demo` (eller `/demo/start` direkt) i en ren webbläsarflik. Ingen
  inloggning behövs.
- Tryck `T`, eller klicka **Rundtur på** i demoraden nederst. Det tvingar
  automatiskt fram Saras persona (ingång A, "Jag har ingen idé") och
  startar om från stopp 1 — oavsett var i appen du stod innan.
- Varje stopp har en **Nästa**-knapp i rundturkortet. Klicka den i takt med
  manuset nedan. **Hoppa över** avslutar rundturen när som helst.
- Manuset citerar rundturkortens egna siffror — de är alltid Saras
  aktuella scenario (`adapters/demo/sara.ts`), inte påhittade för manuset.
- Om du hellre demar fritt utan overlay: varje stopp nedan anger också
  routen och vilket steg i Saras resa (via "Hoppa till steg" i demoraden)
  som visar samma sak.

---

## 10-minutersversionen — alla 20 stoppen

**~30 sekunder per stopp, andas mellan varje klick.**

**1. Välkommen** (`/demo/app`)
> "Det här är Spark, en medgrundare för UF-företagare. Jag visar er Saras
> resa, ett riktigt scenario, steg för steg. Ni kan alltid hoppa runt
> själva efteråt."

**2. Två ingångar** (`/demo/start`)
> "De flesta har inte en idé redan — Spark börjar då hos personen: vem är
> du, vad kan du, hur mycket tid och pengar har du. Har man redan en idé
> genomlyser Spark den i stället. Båda landar i samma tolvstegsresa."

**3. Medgrundaren kör verktyg** (steg 03, körning)
> "Varje samtal med Medgrundaren slutar med att den faktiskt gör något —
> här hämtar den siffror direkt ur Bolagsverket och SCB. Inte ett råd om
> vad Sara borde kolla upp, utan uppslaget färdigt."

**4. Poängen mäter bevis, inte optimism** (steg 01, efter)
> "1 till 100, alltid synlig uppe till höger. Sara har precis svarat på
> profilfrågorna — poängen är 6. Inte för att idén är dålig, utan för att
> nästan inget är bevisat än."

**5. Taket på 30 utan kundsamtal** (steg 04, efter)
> "Nu har hon register- och kundunderlag, poängen är 27 — men den kan
> ändå inte gå över 30. Spark vägrar kalla något 'bevisat' förrän ett
> enda riktigt kundsvar finns. Det är en regel i koden, inte en känsla."

**6. Datalöftet** (Marknad, registerdata)
> "312 byråer, 4,2 miljoner i medianomsättning, 18 procent tillväxt — och
> varje siffra har en klickbar källpill. Ingenting i Spark är gissat."

**7. Registret finns i Sverige** (Marknad, konkurrenter)
> "Varje aktiebolag lämnar en offentlig årsredovisning. Det gör
> konkurrentbilden faktisk — tre namngivna byråer här, ingen dominerar.
> Det är en svensk fördel knappt något annat land har."

**8. Hiasynth-lagret — ett koncept** (Marknad, simulering)
> "Ovanpå registret kan Spark lägga simuleringar över en syntetisk
> population — alltid märkta 'Simulering', ger aldrig poäng, blandas
> aldrig med fakta. Hiasynth är ett koncept i dag, inget partnerskap."

**9. Spark skickar mejlen själv** (steg 05a, efter)
> "Inte bara ett tips om att höra av sig — Spark skriver och skickar
> outreachen på svenska, från Saras egen Gmail, och bevakar öppningar
> och svar automatiskt."

**10. Egen svarsdata som försvarsvall** (Validering-sidan)
> "Svaren citeras rakt av, med namn. Spark kan säga: '4 procent
> svarsfrekvens är lågt för den här branschen, normalt ser vi 11.' Det är
> en jämförelse ingen konkurrent har underlag att göra."

**11. Poängen kan sjunka** (steg 05b, efter)
> "Tre av nio svar sa nej till priset — poängen faller från 47 till 43.
> Spark mjukar aldrig till en motsägelse för att hålla siffran uppe."

**12. Domen** (Resan, steg 06)
> "Baserat på de faktiska svaren landar Spark i 'Förfina' — inte en
> gissning om vad som känns rätt, utan en slutsats ur citat och siffror."

**13. Svensk kalkyl** (Resan, steg 07)
> "Prisförslaget vilar på fyra saker: vad kunderna tål, vad andra tar
> betalt, vad kunderna själva sagt, och vad som krävs för att gå ihop med
> moms och arbetsgivaravgifter. Det är en svensk kalkyl, inte en amerikansk
> mall."

**14. Poängen räknas i kod** (Poäng-sidan)
> "Åtta delar, var och en med källa. Det är ingen modells bedömning —
> nedbrytningen går att räkna för hand från exakt samma bevis som visas
> här."

**15. Förslagen sorteras efter poäng per minut** (Poäng-sidan)
> "Alltid högst avkastning per insats överst. Varje förslag har en av tre
> typer av luckor: för lite underlag, motsägande underlag, eller en
> strukturell lucka som kräver ett helt steg."

**16. Juridisk koll genom hela resan** (Juridik-sidan)
> "En egen juridisk karta för just det här företaget — källa till
> riksdagen.se, Skatteverket eller Integritetsskyddsmyndigheten. Dyker
> upp automatiskt vid steg 05, 09 och 10, ingen generisk checklista."

**17. Bygget via Lovable** (Bygg-sidan, steg 10)
> "Medgrundaren skriver byggspecen ur bevisen, Lovable bygger sidan.
> Bygget kostar credits och kommer sist av en anledning — Spark bygger
> bara det bevisen redan sagt att Sara behöver. Ett koncept i dag, inget
> avtal."

**18. Pulsen** (Pulsen-sidan)
> "En daglig svensk marknadssignal kopplad till just Saras idé och
> kundsegment — nyregistreringar, kapitalrundor, nedläggningar — varje
> signal med en mening om varför den spelar roll för henne."

**19. Affärsmodellen** (Pulsen-sidan, avslutande kort)
> "Prenumeration för allt utom bygget, som säljs separat per projekt
> eller credit. Grundare-nivån, 199 kronor i månaden, låser upp hela
> resan, full Puls och juridisk koll."

**20. Det var rundturen**
> "Klicka runt fritt nu — byt ingång för att se Jonas resa, eller
> återställ demot för att börja om. Allt speglar det ni redan sett."

---

## 5-minutersversionen — kurerad delmängd

**Samma rundtur, men klicka Nästa snabbt förbi de stopp som inte är
listade här** (2, 6, 7, 8, 13, 14, 15, 18) **— pausa och prata vid:**

**1. Välkommen** — kort, samma text som ovan.

**3. Medgrundaren kör verktyg** — samma text.

**4. Poängen mäter bevis, inte optimism** — samma text.

**5. Taket på 30 utan kundsamtal** — samma text. Det här är kärnargumentet,
ge det extra tid.

**10. Egen svarsdata som försvarsvall** — samma text.

**11. Poängen kan sjunka** — samma text. Nämn uttryckligen: "Spark ljuger
aldrig för att se bra ut."

**12. Domen** — samma text.

**17. Bygget via Lovable** — samma text.

**19. Affärsmodellen** — samma text.

**20. Det var rundturen** — samma text.

Det ger tio stopp á ungefär 25–30 sekunder plus klicktid mellan dem,
totalt strax under fem minuter.

---

## Om rundturen inte används

Samma innehåll nås genom att klicka **Hoppa till steg** i demoraden och
välja beat rakt av — stoppens rubriker ovan anger vilket steg (och
"före/körning/efter") som hör till. Poäng och citat är identiska, bara
utan spotlight/pil.
Kör aldrig rundturen från Jonas — den finns bara för Sara.
Öppna aldrig en djup adress direkt, och ladda inte om sidan mitt i en visning. Starta alltid från början och klicka dig fram. 
## Regler vid visning
Visa aldrig liveregisterdata för någon utanför Theo och Erik.