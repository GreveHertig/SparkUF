# Claude Code-sessioner för Spark UF

## Ordning
| # | Session | Status |
|---|---|---|
| 1 | Grund och designsystem | Klar |
| A | Arkitektur: demo och plattform i samma kodbas | Nästa |
| 2 | Poängmotor och demomotor | |
| P1 | Plattform: Supabase, inloggning, datamodell | |
| P2 | Plattform: moduldokument, stubbar, kontraktstester | |
| 3 | Demo: Sara, steg 01–06 | |
| 4 | Demo: Sara, steg 07–12 | |
| 5 | Demo: onboarding och Jonas | |
| 6 | Landningssida (egen branch, kan köras när som helst efter A) | |
| 7 | Rundtur, demomanus, polering och säkerhetsgranskning | |

Efter P2 kan din medgrundare börja bygga riktiga moduler parallellt, på egna brancher (se längst ner).

## Kom ihåg
- **En ny chatt, eller `/clear`, för varje session.**
- **När en chatt blir lång:** be den uppdatera `docs/status.md` och pusha, starta en ny chatt och klistra in samma prompt igen.
- **Auto-läge** passar bara i session 2 och P2. Läs planen själv i övriga sessioner.

---

## Session A – Arkitektur
Förberedelse: ladda upp `uppdrag.md`, `sessioner.md` och `CLAUDE.md` från chatten till en ny mapp `inkorg/` i Codespacet.
```
Först, filerna i inkorg/:
- inkorg/uppdrag.md ersätter docs/uppdrag.md
- inkorg/sessioner.md ersätter docs/sessioner.md
- inkorg/CLAUDE.md är den nya Spark-delen av CLAUDE.md. Behåll det som fanns överst i CLAUDE.md innan Spark-delen lades till (t.ex. @AGENTS.md), ersätt den gamla Spark-delen med den nya och visa mig resultatet.
Ta sedan bort inkorg/.

Läs sedan CLAUDE.md, docs/status.md och docs/uppdrag.md avsnitt 3, 6, 9.1 och 14.

Uppgift: gör om strukturen så att demon och plattformen blir en kodbas med två lägen:
1. Inventera det som redan finns (types/, lib/, score/, app/(app), app/(marketing), app/demo, components, design, i18n). Kör git log på filerna och visa vem som skapat vad. Föreslå vad som återanvänds, flyttas eller ersätts.
2. Skapa core/, ports/ (alla portar i 14.3), adapters/demo/ och adapters/live/ (live = stubbar med NotImplementedError), och screens/.
3. Gör om den statiska /app-förhandsvisningen till en delad skärm som får data via portar. Montera den på /demo/app (demoadapter) och /app (liveadapter, visar formgivet "Kommer snart" tills vidare).
4. Lägg till en ESLint-regel eller importkontroll som hindrar kod under demo från att importera adapters/live.
5. Skriv docs/arkitektur.md med faktiska sökvägar, ett diagram i text och instruktioner för hur man byter en stub mot en riktig adapter.
6. Hämta agenterna planner.md, code-reviewer.md och security-reviewer.md från github.com/affaan-m/everything-claude-code (bara de filerna). Visa mig innehållet innan du lägger dem i .claude/agents/.

Ingen Supabase och inga nya skärmar i den här sessionen. Uppdatera docs/status.md, committa och pusha till prototyp.
```

## Session 2 – Poängmotor och demomotor
```
Läs CLAUDE.md, docs/status.md, docs/arkitektur.md och docs/uppdrag.md avsnitt 7 och 9.

Uppgift:
- Lägg domäntyperna och calculateScore i core/, med tester för alla regler i avsnitt 7, inklusive förslagen och typerna av luckor. Återanvänd det som finns i score/ och types/.
- Bygg demomotorn (Zustand + localStorage) och demoraden med tangentbordsstyrning (← → T R), som en del av demoadaptrarna.
- Koppla till /demo/app med ett minimalt testscenario (3–4 moment) så att poängen och NextStepCard ändras när man klickar.

Inga riktiga scenarier. Uppdatera docs/status.md, committa och pusha.
```

## Session P1 – Plattform: Supabase och inloggning
Förberedelse: skapa ett gratis **utvecklingsprojekt** på supabase.com (inte det som ska användas skarpt). Ha projektets URL och anon-nyckel redo.
```
Läs CLAUDE.md, docs/status.md, docs/arkitektur.md och docs/uppdrag.md avsnitt 14.4 och 14.6.

Uppgift:
1. Guida mig att lägga Supabase-URL och nycklar som Codespaces secrets eller i .env.local (aldrig committat). Uppdatera .env.example.
2. Skapa datamodellen i 14.4 som migreringar i supabase/migrations/, med RLS och policyer på varje tabell.
3. Bygg inloggning med Supabase Auth på /logga-in och /skapa-konto, och skydda /app/* på servern.
4. Bygg liveadaptrarna för ProfileRepository, ProjectRepository, JourneyRepository, EvidenceRepository och MemoryRepository mot Supabase.
5. En ny användare ska kunna logga in, gå igenom onboardingens första steg och få profilen sparad. Resten visar "Kommer snart".
6. Skriv tester som bevisar att en användare inte kan läsa en annan användares data.
7. Kör /security-review och åtgärda fynden.

Rör inte demon. Uppdatera docs/status.md och docs/arkitektur.md, committa och pusha.
```

## Session P2 – Plattform: moduldokument och kontrakt
```
Läs CLAUDE.md, docs/status.md, docs/arkitektur.md och docs/uppdrag.md avsnitt 1, 2 och 14.

Uppgift:
1. Skriv docs/moduler/<modul>.md för varje modul i 14.3, enligt strukturen i 14.5, så att en utvecklare kan bygga modulen utan annan kontext.
2. Skriv kontraktstester per port som körs mot demoadaptern i dag och mot liveadaptern när den byggs.
3. Säkerställ att alla liveadaptrar som inte är byggda är stubbar med tydlig hänvisning till sitt moduldokument.
4. Förbered serverstrukturen för Gemini och Tavily (server-only-klienter, miljövariabler i .env.example, ingen riktig logik) så att CofounderAgent och ResearchProvider kan byggas direkt.
5. Skriv docs/bygga-en-modul.md: steg för steg hur man tar en modul från stub till klar, inklusive branch, tester och säkerhetsgranskning.

Uppdatera docs/status.md, committa och pusha.
```

## Session 3 – Demo: Sara, steg 01–06
```
Läs CLAUDE.md, docs/status.md, docs/arkitektur.md och docs/uppdrag.md avsnitt 1, 2, 6, 8, 9.1, 9.3, 9.5 och 10.

Uppgift:
- Bygg alla appskärmar som delade skärmar i screens/ och montera dem under /demo/app (och /app med "Kommer snart" där liveadaptern saknas).
- Lägg in Saras scenario för steg 01–06 i demoadaptrarna, med alla moment på båda språken, inklusive Pulsen och den juridiska kollen.
- Poängen ska hamna på målvärdena ±2.

Uppdatera docs/status.md, committa och pusha.
```

## Session 4 – Demo: Sara, steg 07–12
```
Läs CLAUDE.md, docs/status.md, docs/arkitektur.md och docs/uppdrag.md avsnitt 2.3, 2.4, 9.3, 9.5 och 10.

Uppgift: lägg in Saras steg 07–12 med alla moment på båda språken: affärsfall och pris, omfånget, det formella med juridisk karta, bygget via Lovable (koncept), första kunderna, kapital och slutvyn "Bevisad affär". Kör hela Saras demo och kontrollera poängen mot målvärdena.

Uppdatera docs/status.md, committa och pusha.
```

## Session 5 – Demo: onboarding och Jonas
```
Läs CLAUDE.md, docs/status.md, docs/arkitektur.md och docs/uppdrag.md avsnitt 2.1, 6 (Onboarding), 9.1, 9.4 och 10.

Uppgift:
- Bygg onboardingen som delade skärmar: val av ingång, profilsamtalet och idégenomlysningen. Montera under /demo/start (demo) och /start (plattform, där profilen sparas via liveadaptern från P1).
- Demot ska alltid börja i onboardingen och gå vidare in i /demo/app.
- Lägg in hela Jonas scenario (alla 12 steg, med pivoten i steg 06) på båda språken. "Byt ingång" i demoraden ska fungera.

Uppdatera docs/status.md, committa och pusha.
```

## Session 6 – Landningssida
```
Läs CLAUDE.md, docs/status.md och docs/uppdrag.md avsnitt 1, 2, 5 och 6 (Publika sidor). Studera design-referens/fonda/ noggrant.

Uppgift: skapa branchen prototyp-landning från prototyp och bygg /, /priser och de publika delarna av /logga-in och /skapa-konto (återanvänd inloggningen från P1 om den finns). "Starta demo" leder till /demo. Sidan ska hålla världsklass, använda designsystemets komponenter och finnas på båda språken.

Föreslå först sektionsordning och layout och vänta på godkännande. Öppna en pull request mot prototyp när du är klar.
```

## Session 7 – Rundtur, manus, polering
```
Läs CLAUDE.md, docs/status.md och docs/uppdrag.md avsnitt 9.2, 11, 12 och 14.6.

Uppgift:
- Bygg den guidade rundturen i demot.
- Skriv docs/demo-manus.md (5 och 10 minuter).
- Polera engelska, rörelse och tillgänglighet.
- Kör båda demona på båda språken från start till slut.
- Kör /security-review på hela repot och låt security-reviewer-agenten granska Supabase-policyerna. Åtgärda fynden.
- Slutför README.md och DESIGN.md och kontrollera att next build går igenom utan varningar.
```

---

## För medgrundaren: bygga en modul
När P2 är klar:
1. Välj en modul i `docs/moduler/` med status "stub".
2. Skapa en branch från `prototyp`, till exempel `modul/medgrundaren`.
3. Starta Claude Code och skriv:
```
Läs CLAUDE.md, docs/arkitektur.md, docs/bygga-en-modul.md och docs/moduler/<modul>.md. Använd planner-agenten för att föreslå en plan och vänta på mitt ok. Bygg sedan liveadaptern tills kontraktstesterna passerar, låt code-reviewer och security-reviewer granska, uppdatera modulens status och öppna en pull request mot prototyp.
```
