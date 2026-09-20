# DESIGN.md — Spark

Designbeslut för prototypen, i den ordning uppdraget kräver att de dokumenteras. Uppdateras varje session.

## Session 1 — Grund och designsystem

### Visuell riktning
Inspirerad av Fonda (`design-referens/fonda/`), men egen: ljus, luftig arbetsyta i `paper-50`, mörka ytor medvetet i `ink-800` (sidomeny, hero, demorad — kommer i senare sessioner). Små versala eyebrow-etiketter med mittpunkt (`STEG 05 · SAMTALEN`), tung geometrisk sans för rubriker, enstaka kursiverade serif-ord för betoning, mjuka radier, subtila kanter, generöst med luft. Källetiketter är ett synligt typografiskt element (pill med datatypens färg), inte en fotnot — det här är Sparks tydligaste avvikelse från Fonda.

### Typsnitt
- **Manrope** (variabel, 400–800) som sans-serif. Geometrisk, harmonierar med ordmärkets bokstavsform, brett utbud av vikter för både brödtext och tunga rubriker.
- **Instrument Serif Italic** (400) bara för `EditorialHeading.Em` — betoningsord i stora rubriker, aldrig brödtext.
- Båda självhostade som `.woff2` under `design/fonts/` och laddade via `next/font/local` (`design/fonts.ts`). Inget hämtas från Google Fonts CDN vare sig vid build eller körning — demot fungerar offline.

### Färger
Skiffergrå skala 50–950 (lätt blå underton) mellan `paper-50 #F1F2F6` och `ink-900 #1B1F23`, med `ink-800 #262B31` som namngiven stopp för mörka ytor. Accentskala med `#CFE3FF` som startvärde (accent-200), mörkare stopp härledda för kontrast i aktiva/fokustillstånd. Poängnivåerna (`score-red/orange/yellow/green/strong`) är medvetet dämpade jordtoner, inte trafikljusfärger — `score-strong` är skiffergrå med ett svagt accentsken snarare än en egen "vinnarfärg". Datatyperna (`data-register/simulation/customer`) har varsin ton så att register-, simulerings- och kunddata går att skilja åt på avstånd.

### Tokens-arkitektur
`design/tokens.css` är källan (CSS-variabler, rå namn utan `--color-`/`--radius-`-prefix, t.ex. `--slate-50`, `--r-md`). `app/globals.css` mappar in dem i Tailwinds tema via `@theme inline` (samma mönster som `create-next-app`-scaffoldens `--background` → `--color-background`). **Viktigt beslut:** typsnittsvariablerna (`--font-sans`, `--font-serif-italic`) mappas medvetet INTE in i `@theme` — de sätts redan av `next/font/local` via klasser på `<html>`, och en `@theme inline`-rad med samma namn skulle skapa en `:root`-regel som konkurrerar med den klass-satta varianten. Verifierat i kompilerad CSS att detta fungerar korrekt (font-familjen och alla `rounded-*`/färgutiliteter löser ut till rätt värden, inga cirkulära variabler).

`design/tokens.ts` speglar samma värden typat för JS/SVG (Recharts m.m. i senare sessioner). `score/levels.ts` är den *visuella* nivåtabellen från uppdrag 7.5 (tröskelvärde → ton → i18n-nyckel) — inte poängberäkningen. Session 2 återanvänder den härifrån för `calculateScore` i stället för att duplicera tröskelvärdena.

### Loggan
Ingen vektorfil fanns, bara `public/brand/spark-logo.png`. Tre försök innan det här höll:
1. SVG-text i Manrope + en `clip-path` för K:s ben — fel bokstavsavstånd, blev "SPAR  K".
2. CSS `mask-image` mot en beskuren kopia av originalbilden — visuellt korrekt i test, men opålitlig i praktiken (rendrade som en oklippt rektangel, sannolikt en bildladdning som inte hann/kunde slutföras i vissa miljöer).
3. **Nuvarande lösning:** `public/brand/spark-logo.png` beskars till ordmärkets bounding box och spårades till en riktig vektorpath med `potrace` (installerat via `apt-get` för det här momentet). `components/ui/Logo.tsx` innehåller nu fem inbäddade `<path>`-element (S, P, A, R, K), färgade via `fill="currentColor"` och en `tone`-prop (`text-paper-50`/`text-ink-900`). Ingen extern bildresurs — kan inte misslyckas ladda. **TODO:** ersätt med grundarnas original-SVG när den finns.

### i18n
Typad `Dictionary` (`i18n/dictionary.ts`) som `sv.ts`/`en.ts` båda måste uppfylla (`satisfies Dictionary`) — TypeScript larmar om en nyckel saknas i endera språket. Egennamn (Bolagsverket, Hiasynth, m.fl.) ligger *inte* i ordböckerna, i enlighet med uppdrag 4 — de är källdata (`Källa.namn`), inte gränssnittstext. `i18n/format.ts` använder `Intl` för belopp och datum; **beslut:** engelska datum formateras med `en-GB` (inte `en-US`) eftersom uppdraget vill ha dag-månad-ordning ("14 September"), vilket är `en-GB`s standardordning men inte `en-US`s.

### Komponenter
`components/ui/` = komponenter som inte känner till demot (Eyebrow, EditorialHeading, SourceTag, DataFact, ConceptBadge, DemoDataBadge, LockedState, LanguageSwitch, Logo). `components/spark/` = produktbegrepp (ScoreBadge, VerdictCard, NextStepCard, PulseCard) — de vet vad en poäng, ett utslag eller en signal är. `SourceTag` och `DataFact` återanvänder `Källa`-typen från `types/evidence.ts` snarare än att definiera en egen form. `SourceTag` använder Radix Popover för källdetaljer (tillgänglig, tangentbordsstyrd disclosure). `ScoreBadge`s räkneanimation använder Framer Motion och stänger av sig själv vid `prefers-reduced-motion` (via `design/usePrefersReducedMotion.ts`, byggd med `useSyncExternalStore` för att undvika en `setState`-i-effekt-cascade).

### Vad som medvetet INTE byggdes än
`zustand` och `recharts` är inte tillagda som beroenden — inget i den här sessionen använder dem. De läggs till i Session 2 (demo-store) respektive när ett diagram faktiskt behövs.

### Granskningsrunda: kontrast och tokens
Grundaren granskade `/designsystem` i en riktig webbläsare och hittade flera fel som inte syntes vid textbaserad verifiering:
- **Tailwind-utiliteter avgörs av CSS-källordning, inte className-ordning.** `EditorialHeading` hade en hårdkodad `text-slate-900` som kunde vinna över en påstådd override, oavsett vilken klass som stod sist i `className`-strängen. Lösning: ge aldrig grundkomponenter en hårdkodad textfärg som en anropare förväntas kunna byta ut — låt dem ärva eller kräv färgen som prop.
- **Flex/grid stretchar barn som standard.** `ConceptBadge`, `DemoDataBadge` och `SourceTag` blev fullbredds-pillar första gången de hamnade i en `flex-col`- eller grid-förälder, eftersom `align-items: stretch` är standard. Lösning: `self-start w-fit shrink-0` direkt på komponenterna, inte bara på anroparens container.
- **Kontrollräknade WCAG AA-kontraster avslöjade fler fel än det synliga.** `accent-500` klarade inte 3:1 som fokusring, och score-orange/yellow/green samt data-simulation/customer klarade inte 4.5:1 mot sina egna `-bg`-toner. Alla sex mörkades (samma nyans, lägre ljushet) tills de passerade — värdena finns i `design/tokens.css` och `design/tokens.ts`. `--accent` pekar nu på `accent-600` i stället för `accent-500`. Regel framåt: `slate-500` och ljusare räcker inte som textfärg mot `paper-50` — använd `slate-600` eller mörkare.

### `/app` — förhandsgranskning (byggd i förtid, på begäran)
Grundaren ville bedöma designen i en verklig appvy innan Session 1 godkänns, inte bara i designsystemkatalogen. `app/(app)/layout.tsx` (sidomeny + sidhuvud) och `app/(app)/app/page.tsx` (Hem) byggdes med **bara** komponenter från designsystemet, mot Saras steg 05 (uppdrag 9.3), med hårdkodad mockdata i `app/(app)/sara-mock.ts`. Det här är en förhandstitt för designgranskning — **inte** Session 3:s leverans. Session 3 bygger den riktiga demomotorn (`src/demo/scenarios/sara.ts`, styrd av demoraden) och ska ersätta `sara-mock.ts`, inte bygga vidare på den.

## Designuppdatering — high-tech dashboard

Grundaren visade tre referensbilder (`design-referens/dashboard/`, ej committade som en del av leveransen — bara underlag): en tät instrumentpanel med KPI-rad, sparklines och mätare, och en lugn centrerad promptruta. Uttrycket skulle tas, inte färgerna — våra `paper-50`/`ink-800`/accentskalan ligger fast, oförändrade sedan Session 1. Det här var en ren token/komponentuppdatering: inget innehåll (i18n-texter, scenariodata i `sara.ts`, poängformler i `core/score.ts`) ändrades.

### Typsnitt: Funnel Display + JetBrains Mono
Manrope byttes till **Funnel Display** (variabel, 300–800) som `--font-sans` (brödtext och gränssnittstext). Valt framför Mona Sans (uppdragets andra alternativ): Funnel Display är en stramare, mer geometrisk display-grotesk — närmare det "tätt, tech"-intryck referensbilderna visar, medan Mona Sans är mer humanistiskt neutral. **Instrument Serif Italic** är oförändrad, bara `EditorialHeading.Em`.

Ny **JetBrains Mono** (variabel, 400–700) som `--font-mono`, för alla siffror: poäng, belopp, procent, antal. Båda hämtade som `.woff2` ur `@fontsource-variable/funnel-display`/`@fontsource-variable/jetbrains-mono` (samma öppna Google Fonts-källa som Manrope/Instrument Serif, OFL-1.1) och lagda som riktiga filer under `design/fonts/funnel-display/` och `design/fonts/jetbrains-mono/` — **inte** npm-beroenden. Samma mönster som tidigare: `next/font/local`, självhostat, inget hämtas från en CDN vid build eller körning.

`--font-mono` mappas medvetet **inte** in i `app/globals.css`s `@theme inline`, av exakt samma anledning som `--font-sans`/`--font-serif-italic` sedan Session 1 (se ovan): en `@theme`-rad med samma variabelnamn skulle skapa en konkurrerande `:root`-regel. Siffror får mono-typsnittet via en egen utility-klass, `.font-numeric` (definierad i `globals.css`, inte Tailwinds inbyggda `.font-mono`-klass — den namngavs annorlunda för att inte tävla med Tailwinds egen genererade utility). `tabular-nums` är redan globalt satt på `body` sedan Session 1, så `.font-numeric` byter bara typsnittsfamilj. Klassen sätts bara på de faktiska siffrorna, aldrig på hela meningar som råkar innehålla ett tal (t.ex. `PulseCard`s "Uppdaterad 06:00" är medvetet kvar i sans — det är en mening, inte ett tal).

### KPI-rader och sparklines
Nya `components/spark/KpiTile.tsx` + `KpiRow.tsx`: en tät ruta per nyckeltal (label, mono-värde, valfri sparkline, valfri deltachip, `SourceTag`). Ny `components/ui/Sparkline.tsx`: minimal inline-SVG (polyline + mjuk fyllning), ingen ny dependency — `recharts` är fortfarande inte motiverat för en 60×20px-linje (samma avvägning Session 1 gjorde uttryckligen för hela projektet).

**Databeslut:** en sparkline ritas bara där en genuin flerpunktsserie finns — annars ingen sparkline alls, hellre än en påhittad form (CLAUDE.md: siffror ska ha källa, ingen hårdkodad/påhittad data). Den enda serien med riktig historik i demot är **totalpoängen per beat** (redan beräknad av `calculateScore`). Det exponerades som en ny port-metod, `EvidenceRepository.getScoreHistory(locale)`: demoadaptern härleder den ur `adapters/demo/sara.ts`s nya `getScoreHistoryUpToBeat` (återanvänder den befintliga `totalForBeat`-hjälpfunktionen, ingen egen poänglogik), liveadaptern kastar `NotImplementedError` som alla andra obyggda metoder. Övriga KPI:er (mottagare, öppningsfrekvens, svar mottagna, upplåsta delar, bästa förslaget) visas som täta tal **utan** sparkline.

KPI-raden på Hem (`screens/AppHome.tsx`) visar fem rutor, på Poäng (`screens/Score.tsx`) fyra — se respektive fil. Duplicerar delvis informationen i korten under (t.ex. "Vad som hänt sedan sist"), vilket är avsiktligt: en dashboards KPI-rad är en sammanfattning, detaljvyn nedanför är oförändrad.

En verklig bugg hittades och fixades under webbläsarverifieringen: vid det allra första momentet (`score.delta === 0`) visade deltachippen `−0` (minus noll, ett känt kosmetiskt fel i den äldre "Poängrörelse"-kortet enligt `docs/status.md`, som nu spreds till den nya KPI-rutan). Fixat genom att bara rendera deltachippen när `delta !== 0`.

### Medgrundaren — centrerad promptruta
Ny `components/spark/PromptBox.tsx`: ljus ruta, `rounded-2xl`, tunn `border-slate-200`, mjuk skugga, dämpad placeholder, liten rund accent-skickaknapp nere till höger — enligt referensbilden. Medgrundaren i demot är helt förskriven (`ChatMessage.tsx`s egen kommentar: "Ingen inmatning i demot"), så rutan är **medvetet inert**: `disabled` textarea + `disabled` knapp, ingen koppling till `useDemoStore`/`next()`. Den lägger inte till funktion eller innehåll, bara den visuella affordansen. Placeholder-texten är en ny i18n-nyckel (`cofounderPage.promptPlaceholder`), inte hårdkodad.

Transkriptet (`ChatMessage`) ligger kvar ovanför, slimmat (mindre padding, tätare radavstånd) men fortsatt bubbelbaserat — referensbildens "samtalet ligger ovanför rutan" tolkades som att promptrutan är en enda, sidan-omfattande yta under hela transkriptet, inte en ersättning av varje enskilt meddelande.

### Täthetspass
Padding i kort ett steg ner genomgående (`p-6`→`p-4`/`p-5`, `gap-6`→`gap-4` osv.), `leading-snug` på brödtext i kort, tätare sidomeny/sidhuvud i `AppShell.tsx` (`w-60`→`w-56`, `p-6`→`p-5`, `px-8 py-4`→`px-6 py-3`). Kanttjockleken är oförändrad (1px `border-slate-200` var redan tunnast Tailwind klarar).

**Accent starkare i aktiva/primära lägen:** sidomenyns aktiva länk bytte `bg-slate-700` mot `bg-accent-600 text-white` — återanvänder en redan kontrollräknad kontrastsiffra från Session 1 (vit text på `accent-600` = 5.01:1, klarar WCAG AA för text oavsett bakgrund eftersom ytan är självbärande). Inga nya färgtoner uppfanns.

### Verifiering
`pnpm typecheck`/`lint`/`test`/`build` gröna. Klickad igenom med Playwright (headless Chromium, `pnpm dev`) genom alla elva `/demo/app`-sidorna (inkl. `/resan/[steg]`) på **både sv och en** — inga konsol- eller sidfel på någon av de 22 kombinationerna. Detta täpper till en känd lucka från Session 3 ("Engelska texter … Inte manuellt klickigenomgången på engelska i en riktig webbläsare"). `/app` (livevyn) opåverkad — visar fortfarande "Kommer snart", nu med `getScoreHistory` också anropad (och stubbad) i dess `Promise.all`, konsekvent med de andra portmetoderna.

## Session P1 — inloggning: TextField

`/logga-in` och `/skapa-konto` (uppdrag 14.4) behövde ett formulärfält, och inget i designsystemet täckte det — `components/ui/` hade elva komponenter men ingen etikett+fält+felmeddelande-primitiv. Ny `components/ui/TextField.tsx`: label, `<input>`, valfri hint-text, valfritt felmeddelande (`role="alert"`, `aria-invalid`, `aria-describedby`). Samma mönster som `LockedState`/`ComingSoon` — komponenten vet inget om i18n, all text kommer in som redan uppslagna strängar från anroparen.

**Beslut: fältfel är koder, inte text, ända fram till komponenten.** `app/(auth)/actions.ts` (Server Actions) returnerar snake_case-koder (`"password_too_short"` osv.), aldrig färdig text — CLAUDE.md: "Ingen hårdkodad text" gäller även serverkod. `app/(auth)/errorMessages.ts` slår koden mot en `Record<Kod, NyckelITDictionary>` (inte en `switch`/funktion), så TypeScript vägrar kompilera om en ny felkod läggs till i `actions.ts` utan en motsvarande rad här. `LogInForm.tsx`/`SignUpForm.tsx` slår sedan upp den nyckeln i `t.auth.errors`.

**Beslut: Supabases egna felmeddelanden visas aldrig.** `mapAuthError` i `actions.ts` växlar på `error.code` (Supabases stabila felkoder, `@supabase/auth-js`) till en av tre generiska kategorier (`invalid_credentials`, `email_in_use`, `unexpected`) — aldrig `error.message`, som kan skilja sig mellan "fel lösenord" och "kontot finns inte" (användaruppräkning) eller läcka interna detaljer.

Formuläret använder Reacts `useActionState` (samma mönster som Next.js egen auth-guide) i stället för ett kontrollerat formulär med egen `useState` per fält — mindre kod, och valideringsfel överlever en helsides-omladdning utan JavaScript (progressiv förbättring).

`TextField` demonstreras i `/designsystem` med tre lägen: tomt, hint synlig, fel synligt (hint och fel visas aldrig samtidigt — felet vinner).

## Session 6 — Landningssida (gren `prototyp-landning`)

Uppdrag: bygg `/`, `/priser` och de publika delarna av `/logga-in`/`/skapa-konto` (uppdrag avsnitt 5, 6), i Fonda-stilen från 5.1, med riktiga produktkort i stället för illustrationer. `/logga-in`/`/skapa-konto` var redan riktiga Supabase-formulär sedan Session P1 — återanvända rakt av, inte ombyggda.

### Ny delad ram: `components/spark/PublicHeader.tsx` + `PublicFooter.tsx`
De publika sidorna (`/`, `/priser`) delar en ny `app/(marketing)/layout.tsx` med en ljus, sticky header (logga, Priser, Logga in, SV/EN, "Starta demo") och en footer (tagline, produkt-/kontolänkar, fiktions-/ansvarsnot). Header är medvetet ljus (inte `ink-800`) och ligger ovanför den mörka hero-sektionen som en egen sektion i sidan — samma "ljus arbetsyta, mörka ytor medvetet" princip som Session 1 satte, bara tillämpad på en ny yta. `/logga-in`/`/skapa-konto` behöll sin egen minimala `AuthLayout`-header (P1) i stället för att återanvända `PublicHeader` — de är formulär, inte marknadsföringsytor, och P1:s header (logga + SV/EN) är redan rätt avskalad för dem.

### Landningssidan: riktiga komponenter, inga illustrationer
Alla nio sektionerna i uppdrag 6 byggda i `app/(marketing)/page.tsx` med redan existerande designsystemkomponenter — ingen ny visuell primitiv utom en liten lokal `FeatureCard`-hjälpare (titel + brödtext + valfri children-slot, återanvänd tre gånger i "Fyra saker Medgrundaren gör" och två gånger i "Koncept på väg", motiverar en gemensam komponent utan att vara en för tidig abstraktion):

- **Hero:** `NextStepCard` (samma komponent som `/demo/app`, egen text, inte kopplad till en adapter) bredvid en `EditorialHeading` med `.Em` på "Spark" — den enda rubriken på sidan som använder kursiv betoning, avsiktligt sparsamt använt (5.4: "inga dekorativa detaljer") i stället för på varje sektionsrubrik.
- **Datalöftet:** tre `DataFact`+`SourceTag`-kort med exakt uppdragets egna exempeltal (312 byråer, 4,2 Mkr, 18 %) — samma illustrativa siffror som `docs/uppdrag.md` avsnitt 1.1 själv använder, med Bolagsverket/SCB som källa.
- **Resan:** stegen grupperade i de fyra faserna, titlar hämtade rakt ur `journeySteps`/`journeyPage.phaseNames` (aldrig dubblerade), ett nytt citat per fas i `landingPage.journey.phaseQuotes`.
- **Fyra saker Medgrundaren gör:** `ToolRunCard`, ett `ChatMessage`-par (rak dom) och `PulseCard` — plus en fjärde, avsiktligt enklare "Nästa steg"-ruta (en `Eyebrow` + poängrad, inte en full andra `NextStepCard` — hero visar redan den komponenten i sin helhet, en identisk dubblett hade känts repetitiv vid skrollning).
- **Poängen:** `VerdictCard` med `score={54}` — samma poäng och utslag ("Förfina · snäva segmentet") som Saras riktiga steg 06 i demot, en avsiktlig kontinuitetsdetalj, inte en slump.
- **Juridisk koll:** `LegalMap` med två exempelkrav (F-skatt/Skatteverket, personuppgiftsbiträdesavtal/IMY), samma `t.legalPage.disclaimer` som `/demo/app/juridik` använder.
- **Minnet:** ett `ChatMessage`-par som uttryckligen refererar ett tidigare beslut ("Du sa i steg 06...") — skild från "Säger rakt ut"-kortet i sektion 4, som inte refererar historik.
- **Koncept på väg:** `SimulationCard` för Hiasynth (riktig `Simulation`-form, `source.namn` med "(koncept)"-suffix som redan används i `adapters/demo/SimulationProvider.ts`) och `ToolRunCard` + `ConceptBadge` för Lovable.
- **Priser/FAQ/avslutning:** en pristeaser som länkar till `/priser`, fem FAQ-poster som `<dl>`, och en sista mörk uppmaningssektion som speglar hero.

### `/priser`
Tre nivåer (Gratis, Grundare 199 kr/mån, Bygg-credits) enligt uppdrag 6, alla under en gemensam "Förslag — inte fastställda priser"-etikett (streckad kant, som `ConceptBadge`s visuella språk men utan att återanvända just den komponenten — det är inte ett Hiasynth/Lovable-koncept, bara ett prisförslag). Grundare-nivån är visuellt högre prioriterad (`border-accent-600`, "Mest valt"-bricka). Gratis/Grundare länkar till `/skapa-konto`, Bygg-credits till `/demo` (det finns inget att köpa än, bara att se).

### i18n
Fyra nya toppnycklar (`publicNav`, `publicFooter`, `landingPage`, `pricingPage`) i `i18n/dictionary.ts`, fullt typade och skrivna på båda språken direkt (`satisfies Dictionary` fångade två saknade fält under arbetet). Engelska namn på svenska myndigheter (Bolagsverket, Skatteverket, IMY) förklaras med en kort parentes vid första förekomsten i `landingPage.dataPromise.body`/`legal.body` i stället för en ny tooltip-komponent — uppdrag 4 ber om en tooltip, men inget tooltip-primitiv finns i designsystemet än och att bygga en enkom för det här vore fel session för det. Flaggat som en känd, medveten avgränsning nedan.

### Verifiering
`pnpm typecheck`/`lint`/`test`/`build` gröna (ny testfil `app/(marketing)/page.test.tsx`: SV-innehåll, EN-innehåll via `localStorage`-satt `spark:locale` — samma mönster som `locale-switch.test.tsx`, men utan att klicka en `LanguageSwitch`-knapp eftersom headern med växeln inte är en del av sidkomponenten som testas). Klickad igenom med Playwright (headless Chromium, tillfälligt installerat i en scratch-mapp utanför repot) mot `/` och `/priser` på båda språken — alla nio sektionerna, inga konsolfel. En verklig layoutbugg hittades och fixades under det: "Ett steg i taget"-kortet i "Fyra saker Medgrundaren gör" var tomt (ingen `children`) medan de tre andra korten i samma rad-par hade riktigt innehåll, vilket såg trasigt ut i ett grid med lika kolumnbredd — fixat genom att lägga till en liten poäng-/tidsrad, se ovan.

### Kända problem / medvetna begränsningar
- **Ingen tooltip-komponent** för engenamn på engelska (uppdrag 4) — löst med inline-parentes i stället, se ovan. Bygg en riktig tooltip-primitiv i en framtida session om fler ytor behöver samma sak.
- **`DataFact`s `SourceTag`-pill kan radbryta** i den smalaste av de tre Datalöftet-rutorna ("Bolagsverket · 14 september" på två rader) vid 1440 px — samma komponent och mönster som redan används i `screens/Market.tsx` (4 kolumner), inte en ny regression, men trängre här på grund av 3 kolumner i en halv `max-w-6xl`-bredd. Kosmetiskt, ingen överlappning eller bruten layout. Åtgärda vid en framtida poleringssession om det stör i en riktig genomgång.

## Tokenbyte — design-referens/artefakt/TOKENS.md (gren `prototyp`)

Uppdrag (`docs/beslut.md`, 2026-09-19/20): byt tokenlagrets *värden* mot artefaktens, utan att röra layout, komponentstruktur eller innehåll — "referens, inte inklistring… bara tokens byts, så följer allt med automatiskt" (TOKENS.md själv). Sessionens huvuduppgift var att hitta hårdkodade färger/typsnitt/radier/skuggor som går förbi tokenlagret och routa dem genom det.

### Färgmappning — namn behållna, värden bytta
Artefakten ger sex gråtoner (ground/hair/ink-3/ink-2/navy/ink) och en accent, inte en fullständig 50–950-skala. Kartlagt mot den befintliga skalan efter faktisk användning i kodbasen (kontrollerat med grep innan bytet):
- `--slate-50`/`--paper-50` → `--ground` (#F4F6F8)
- `--slate-200` → `--hair` (#E4E9EE) — redan den dominerande kantfärgen (`border-slate-200`)
- `--slate-600` → `--ink-3` (#677686)
- `--slate-700` → `--ink-2` (#4A5C6E)
- `--slate-800`/`--ink-800` → `--navy` (#143253) — verifierat att `ink-800` uteslutande används som mörk ytfyllnad (sidomeny, hero, demorad, `/designsystem`-headern), aldrig som text, vilket matchar artefaktens "navy = marinblå sekundär" rakt av
- `--slate-900`/`--ink-900` → `--ink` (#0E2033) — verifierat att `slate-900` uteslutande används som stark text (~30 träffar `text-slate-900`), matchar artefaktens "ink = primär text"
- `--slate-100/300/400/500/950`: ingen artefaktmotsvarighet — linjärt interpolerade mellan grannarna i sRGB (samma metod som color-mix "in srgb" använder) för en jämn skala utan hack. Uträkningen ligger i `design/tokens.css`s kommentarer.
- `--accent`/`--accent-600` → artefaktens `--accent` (#0B69D4), samma position i skalan som tidigare. `--accent-50…900` ombyggda som en ny ramp runt den ankaren (ingen skala gavs i referensen).
- **Inte rörda** (ingen motsvarighet i TOKENS.md): `--score-red/orange/yellow/green/strong`, `--data-simulation`, `--data-customer`. `--data-register`/`--data-register-bg` följer automatiskt med (de var redan alias för `--slate-700`/`--slate-100`).
- **Nya tokens** utan tidigare namn: `--ok`/`--warn`/`--bad` (statusfärger, oanvända i UI:t hittills — etablerar bara ordförrådet, t.ex. inför Marknaden-sessionen), `--sunk`, `--hair-2`, `--navy-soft`, `--accent-soft`, `--ok-soft`, `--warn-soft`, `--bad-soft` (samtliga `color-mix(in srgb, …)`, rakt av från artefakten), `--scrim` (se TourOverlay nedan).
- **Inte tillagda**: `--maxw`/`--border-width` — layout, uttryckligen utanför uppdraget.

### Skuggor — nytt tokenpar, men omdöpt för att undvika en dold krock
Artefaktens `--shadow`/`--shadow-lift` lades först in med de namnen rakt av — men Tailwind v4 har redan en egen temavariabel `--shadow` (styr `.shadow`-utilityn), så ett eget `:root`-värde med samma namn hade tyst skuggat den, exakt den krock som `--r-*` (i stället för `--radius-*`) redan medvetet undviker för radier. Döpte om till `--shadow-soft` innan commit. `--shadow-lift` krockar inte (Tailwind saknar den nyckeln) och behöll sitt namn.

Wire-in: `app/globals.css`s `@theme inline` sätter `--shadow-lg: var(--shadow-soft)` och `--shadow-xl: var(--shadow-lift)` — de enda två `shadow-*`-klasserna som faktiskt användes i kodbasen (`SourceTag`, `TourOverlay`, `DemoBar`, `priser`-sidan, landningssidan), nu tokeniserade utan att röra någon komponentfil.

### Hårdkodade värden hittade och rättade (sessionens huvuduppgift)
Sökte igenom hela kodbasen (hex, `rgba()`/`rgb()`, `style={{...}}`, Tailwind-godtyckliga `-[...]`-klasser, `fontFamily`). Ett första svep missade en träff på grund av en regex-egenhet (en lång alternationsgrupp före `-\[[^]]+\]` matchade inte, medan samma mönster isolerat gjorde det) — sveptes om med enklare mönster per prefix för att vara säker:
- **`components/spark/TourOverlay.tsx`** (två ställen): `rgba(15, 23, 42, 0.72)` hårdkodad i både spotlightens `boxShadow` och den vanliga overlay-dimningens `backgroundColor` — bytt mot `var(--scrim)` (`color-mix(in srgb, var(--ink-900) 72%, transparent)`).
- **`components/spark/PromptBox.tsx`**: `shadow-[0_4px_24px_-4px_rgba(38,43,49,0.12)]` (en godtycklig Tailwind-klass med inbränd gammal `slate-800`-hex) — bytt mot `shadow-[var(--shadow-soft)]`.
- **Inga andra hårdkodade färger, radier eller skuggor hittades.** Ingen Tailwind-standardpalett (`red-*`/`green-*`/`blue-*` osv.) används någonstans — bara `bg-white`/`text-white`, som redan matchar artefaktens `--paper` (#FFFFFF) rakt av och inte rördes.
- **Recharts är inte en dependency och importeras ingenstans** — punkt 3 i uppdraget ("Recharts-diagrammen ska hämta sina färger från tokens") gäller alltså inte den här kodbasen. Den enda grafkomponenten, `components/ui/Sparkline.tsx`, är egen inline-SVG och hämtade redan sina färger från `design/tokens.ts` (`dataTypeColors`/`scoreColors`) — ärver de nya värdena automatiskt, ingen kodändring behövdes där.
- **"Haisynth" förekommer inte i kodbasen** — redan korrekt stavat "Hiasynth" överallt (bara `docs/beslut.md` nämner felstavningen som ett skäl till rättelsen). Inget att rätta.

### Typsnitt: Castoro in, JetBrains Mono ut, Funnel Display får ny roll
- **`--font-sans` (brödtext/rubriker):** Funnel Display → **Castoro**, självhostad `.woff2` (`@fontsource/castoro`, OFL-1.1, samma licensmönster som tidigare typsnitt — bara filen kopierad in, inget nytt npm-beroende). Löser artefaktens huvudkrav rakt av.
- **`--font-data` (ny token, tabeller/diagramaxlar/nyckeltal):** återanvänder de redan självhostade Funnel Display-filerna i stället för att hämta ett nytt typsnitt — löser `docs/beslut.md`s öppna fråga ("neutral sans för data ska provas innan det låses") pragmatiskt: samma neutrala, geometriska sans som redan fanns i repot, bara en ny roll. `.font-numeric`-utilityn (`app/globals.css`) pekar nu på `var(--font-data)` i stället för `var(--font-mono)` — samma klassnamn i alla anropande komponenter, noll komponentfiler ändrade.
- **`--font-serif-italic` (Instrument Serif Italic):** oförändrad — "kursiva serif-ord i rubriker behålls" (TOKENS.md, `docs/beslut.md`).
- **JetBrains Mono borttagen**, eftersom `--font-data` tog över dess enda roll (siffror). `design/fonts.ts`s `mono`-export och `--font-mono`-wiringen i `app/layout.tsx` är borttagna. **Känt problem:** `design/fonts/jetbrains-mono/`-mappen kunde inte tas bort — sandboxens auto-läge-klassificerare blockerade både `rm -rf` och `git rm` som "Irreversible Local Destruction". Mappen ligger kvar oanvänd i repot; ta bort den manuellt (`git rm -r design/fonts/jetbrains-mono`) när du har tillfälle.
- **Känd begränsning:** Castoro (`@fontsource/castoro`) finns bara i vikt 400 (normal + kursiv). Befintliga `font-bold`/`font-extrabold`-klasser på rubriker (byggda för den varibla Funnel Display) renderas nu som webbläsarens syntetiska fetstil, inte ett riktigt snitt — vanligt för seriffer, men inte kontrollerat i en riktig webbläsare den här sessionen (se nedan).

### WCAG AA-kontroll (rapporterat, paletten oförändrad enligt uppdrag)
Beräknat direkt på de nya hexvärdena (relativ luminans, WCAG 2.x-formeln), inte ögonmått:
- **Godkänt:** `ink-3`/paper 4.65:1, `ink-2`/paper 6.89:1, `ink`/paper 16.5:1, `navy`/paper 13.04:1, vit text på `accent` 5.27:1, `accent` som icke-text-yta mot `ground` 4.86:1, `accent` på `accent-soft` 4.58:1, `navy` (score-strong) på sin `accent-100`-bakgrund 10.87:1 (kontrollerat efter tokenbytet, en följdeffekt av att `--score-strong` pekar på `slate-800`).
- **Klarar INTE 4.5:1 för normal text** (klarar väl 3:1, dvs. stor/fet text eller UI-komponenter): text i **`ok`** på **`ok-soft`** = 3.74:1, **`warn`** på **`warn-soft`** = 3.92:1, **`bad`** på **`bad-soft`** = 4.34:1. Ingen av dessa tre par används i något UI än (etablerade som ordförråd för framtiden, se ovan) — flaggat här så att den som först bygger en badge/pill med dem vet att den mjuka bakgrundstonen inte räcker för liten brödtext, bara för stor/fet text. Paletten är inte ändrad för att fixa detta, enligt uppdrag.
- Inte kontrollerat: fokusringar (`focus-visible:outline-accent-300` i `TextField`) — utanför uppdragets "text på mjuka bakgrundstoner"-fråga, och inte en regression (samma mönster fanns redan mot den gamla paletten).

### Radier
`--r-md` motsvarade redan artefaktens `--radius:10px` oförändrat, av en slump. `--r-sm` bytt från ett eget fast värde (6px) till `calc(var(--r-md) * .7)` (≈7px), samma relation som artefaktens `--r-sm:calc(var(--radius) * .7)`. `--r-lg`/`--r-pill` har ingen artefaktmotsvarighet och lämnades.

### Verifiering
`pnpm typecheck`/`lint`/`test` (252 gröna, 31 skippade som väntat) och `pnpm build` gröna. Kontrollerat i den kompilerade CSS:n att `--shadow-soft`/`--shadow-lift` löser ut till rätt `#hex`-värden, att `--shadow`-namnkrocken inte uppstår (Tailwinds `.shadow`-klass genereras inte ens, ingen av kodbasens komponenter använder den bara `shadow`), att Castoro-filen bäddas in i byggresultatet, och att inga `fonts.googleapis`/`fonts.gstatic`-anrop finns (demot fungerar fortfarande offline). **Ingen manuell webbläsarverifiering** den här sessionen (inget webbläsarverktyg anslutet) — särskilt Castoros syntetiska fetstil på rubriker och den nya paletten i en riktig renderad sida är inte sedda med ögon, bara verifierade via beräknad kontrast och kompilerad CSS.
