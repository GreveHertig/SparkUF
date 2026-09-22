# Beslutslogg

## 2026-09-19

**Design från artefakten överförs — endast utseendet.**
Tokens finns i design-referens/artefakt/TOKENS.md.
Inget innehåll, ingen layout och ingen komponentstruktur ändras.

**Sidhopslagning: uppskjuten, inte avfärdad.**
Artefakten har sex sidor, prototypen har omkring tio. Övervägt
förslag om åtta sidor: poängen flyttas till Hem och får ingen egen
flik, juridiken blir en förmåga hos Medgrundaren enligt uppdrag.md
i stället för en egen sida. Resan, Pulsen och onboardingen behålls
som egna. Beslut tas tillsammans med Erik efter Emma-mötet.
Varje sidhopslagning måste uppdatera adapters/demo/tourSteps.ts,
annars slutar den guidade rundturen fungera.

**Stavning: Hiasynth.** Artefakten stavar fel (Haisynth). Rättas.

**Öppet — typsnitt för data.** Castoro används även för siffror.
Neutral sans för tabeller, diagramaxlar och nyckeltal ska provas
via --font-data innan det låses.

**Öppet — poängen.** Frågan om poängen ska spegla faktiskt
resultat i stället för bevisgrad är inte avgjord. Går emot
uppdrag.md 11.1 och 11.7.

**Arbetssätt.** Kör aldrig git-kommandon medan en Claude
Code-session arbetar. Det svepte med halvfärdiga filer i kväll.

**Nästa sessioner, i ordning.**
1. Tokenbyte enligt TOKENS.md. — klart, se docs/status.md.
2. Marknaden — den sidan Emma kommer att titta på. — klart, se docs/status.md.

## 2026-09-20

**Gemensamt skal + innehållsburna rubriker, genomfört.**
Brödsmula och en klickbar poängvisning (poäng, nivå, rörelse) på alla
`/app`-sidor i både demo- och liveläget, och sidhuvuden som beskriver
innehållet i stället för menyvalet. Se docs/status.md för detaljer och
vilka fält som är genuint hämtade ur aktivt case.

**Sidhopslagning: Kunder + Valideringen, genomfört — separat från den
uppskjutna åttasidesplanen ovan.** Grundaren bad specifikt om att slå
ihop Kunder med valideringsinnehållet ur steg 04–06 till en sida,
"Valideringen" (route `/demo/app/validering`). Det är INTE samma sak
som den uppskjutna planen ovan (poängen in i Hem, juridiken som en
Medgrundaren-förmåga) — den planen väntar fortfarande på Erik efter
Emma-mötet, oförändrad. `adapters/demo/tourSteps.ts` uppdaterat i
samma commit, enligt regeln ovan.

**Luckor i demodatan, rapporterade (inte tysta avvikelser).** Inga
namngivna kontaktpersoner eller roller finns för de nio kundsvaren
(bara bolagsnamn och citat) — svarskorten saknar därför namn/roll.
Ingen av de nio svarar med ett fullt "avvisar" (alla bekräftar
problemet, tre är bara oense om priset) — kategorin har inget exempel
i det här scenariot. Inget verkligt branschsnitt ("jämförelsetal")
finns som strukturerad data — öppningsfrekvensen (38 %, redan
källbelagd) används i stället. Se docs/status.md för fullständig lucklista.

## 2026-09-22

**Affärsplanen, byggd — se docs/status.md för fullständig detalj.**
Ny funktion enligt grundarens uppdrag: en plan som sätts samman i kod
(`core/businessPlan.ts`, samma "ren funktion"-mönster som `core/score.ts`)
ur redan befintliga portsnapshots — ingen ny port, ingen ny datakälla,
ingen språkmodell inblandad. Specen ligger i `docs/uppdrag.md` avsnitt 15.

**Bekräftat under bygget: två demoadaptrar är hårdkodade mot en enda
persona vardera, utan egen entry-vakt.** `RegistryProvider` (registret,
alltid Saras 312-byrå-data) och `ProjectRepository.getIdeaScreening`
(alltid Jonas idégenomlysning) hade ingen `entry === "hasIdea"`-koll,
till skillnad från övriga demoadaptrar (OutreachProvider, VerdictProvider,
BuildProvider, PulseProvider, LegalAdvisor har alla redan en). Åtgärdat
genom att gardera anropen i den NYA hopsamlingskoden
(`adapters/demo/businessPlan.ts`), inte genom att ändra de befintliga
adaptrarna — de rördes inte, i linje med "rör inte befintlig demodata".
Flaggat här eftersom det är samma klass av fel som redan bitit en gång
(`SimulationProvider.ts`s regex-bugg, poleringssessionen ovan): en
adapter som ser persona-medveten ut men inte är det, tyst visar fel
persons siffror. En framtida session kan överväga att lägga samma vakt
direkt i `RegistryProvider`/`ProjectRepository` själva — inte gjort här,
eftersom uppdraget uttryckligen bad om att inte röra befintlig demodata.

**Resultatet är avsiktligt asymmetriskt, som uppdraget bad om.** Sara:
8 av 9 avsnitt håller (bara Beviset tunt — hon gjorde aldrig en
idégenomlysning, så "antagandena med utfall" saknas för henne). Jonas:
4 håller, 3 tunt, 2 saknas (Kunden och problemet, Konkurrensen) — en
direkt konsekvens av att hans resa är byggd i bredd och att Registret/
Utskicket/Domen aldrig byggdes ut för hans persona.
