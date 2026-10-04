# Registret: underlag för den juridiska frågan (§6 fråga 4)

Till Theodor och er handledare. Skrivet 2026-10-04 när SCB-kopplingen byggdes.
Det här är ett underlag, inte juridisk rådgivning. Beslutet tas av er och
skrivs in i `docs/dataspiken.md`, §6 fråga 4.

> **Avgjort av Theodor 2026-10-04.** Svaren står i `docs/dataspiken.md`,
> "Beslut om §6 fråga 4". Handledarens bekräftelse återstår.

## Frågan

Får Spark visa namngivna aktiebolag ur SCB:s och Bolagsverkets register, och
hur ska enskilda firmor och reklamspärr hanteras? Det är ett av tre krav innan
Registret öppnas för alla (`docs/moduler/registret.md`, "Licensgrind").
Själva licensen är redan klar: Bolagsverkets värdefulla data får användas
kommersiellt, med källhänvisning (Verifierat 2026-09-23).

## Vad koden gör i dag

**Vilka bolag som namnges**
- Bara aktiebolag (SCB:s juridiska former 41, 42, 43 och 49).
- Bara bolag som är verksamma enligt SCB.
- Bara bolag som tar emot reklam enligt SCB (reklamspärr typ 1). Ett okänt
  värde räknas som spärr.
- Konkurrenterna kontrolleras dessutom mot Bolagsverket. En spärr där
  utesluter bolaget.

**Vilka som aldrig lämnar transporten**
- Fysiska personer (enskilda firmor, juridisk form 10).
- Dödsbon (juridisk form 91).

De filtreras bort i `lib/server/scb.ts` innan något når resten av appen.

**Vad som visas**
- Marknaden: antal verksamma aktiebolag, andel i Stockholms län och
  storleksfördelning (antal och klasser, inga namn).
- Upp till fem konkurrenter med namn och Bolagsverkets verksamhetsbeskrivning.
- Bolagslistan (högst 50 namn) hämtas men visas inte på någon sida i dag.

**Vad som sparas**
- Inga bolagsnamn eller org.nr sparas i databasen.
- När grundaren trycker "Spara som underlag" sparas två bevis med bara antal
  och SNI-kod, till exempel "812 verksamma aktiebolag med SNI 69.201 som
  huvudbransch" och "5 konkurrenter …".
- Registersvaren cachas inte. De hålls bara i minnet medan en sida laddas.

**Vad som inte hämtas**
- Telefonnummer och e-post: SCB:s `/full` används inte.
- Omsättning: kräver `/full` eller årsredovisningar, och är inte byggt.

## Att ta ställning till

1. **Namn på aktiebolag.** Aktiebolag är juridiska personer. Men namnet kan
   innehålla en persons namn (till exempel "Anna Andersson Konsult AB"). Räcker
   det att visa namnet som det står i registret, eller ska sådana namn hanteras
   särskilt?
2. **Reklamspärr.** Är det rätt att bolag med reklamspärr aldrig namnges, men
   räknas i antal och andelar? Koden gör så i dag.
3. **Enskilda firmor.** De visas och sparas aldrig, inte ens räknade. Bör de
   räknas i antalet bolag i branschen (de tillhör ofta marknaden), så länge de
   aldrig namnges?
4. **Kundlistan i steg 04.** Grundaren ska kunna se namngivna bolag att
   kontakta. Är det samma bedömning som konkurrenterna, eller krävs mer
   (till exempel information till bolagen om var uppgifterna kommer ifrån)?
   Kopplingen till Utskick och svar (artikel 14 i GDPR) är en öppen fråga där
   också, se `docs/moduler/utskick-och-svar.md`.
5. **Källhänvisning.** Varje siffra visar "SCB:s företagsregister och
   Bolagsverket" med datum. Räcker det, eller kräver villkoren en viss
   formulering eller länk?

## Det andra kravet: SCB:s villkor

SCB:s användarvillkor för företagsregister-API:t ska läsas och citeras
ordagrant i `docs/dataspiken.md`, som Bolagsverkets redan är. Det kräver en
människa (Erik). Utgångspunkt:
https://www.scb.se/vara-tjanster/bestall-data-och-statistik/foretagsregistret/avgiftsfria-uppgifter-i-foretagsregistret/

## När allt är klart

Erik öppnar grinden: `REGISTRY_ALLOWED_USER_IDS` utökas eller grinden tas
bort, i en commit som också uppdaterar "Licensgrind" i
`docs/moduler/registret.md`. Först då ska cachning i `registry_cache`
övervägas, så att sidan inte behöver gå igenom hela branschen vid varje
besök.
