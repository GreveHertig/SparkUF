# Designreferens — artefakt 15 sep

Theo har godkänt den här riktningen. Ljus grund, marinblå sekundär, blå accent.

## Färg
--ground:#F4F6F8; --paper:#FFFFFF;
--ink:#0E2033; --ink-2:#4A5C6E; --ink-3:#677686;
--navy:#143253;
--accent:#0B69D4;
--ok:#0F8A5F; --warn:#9A6B08; --bad:#C0453B;
--hair:#E4E9EE;

Mjuka toner blandas fram, inga egna hexvärden:
--sunk:color-mix(in srgb, var(--ground) 55%, var(--paper));
--hair-2:color-mix(in srgb, var(--hair) 55%, var(--paper));
--navy-soft:color-mix(in srgb, var(--navy) 11%, var(--paper));
--accent-soft:color-mix(in srgb, var(--accent) 10%, var(--paper));
--ok-soft:color-mix(in srgb, var(--ok) 12%, var(--paper));
--warn-soft:color-mix(in srgb, var(--warn) 14%, var(--paper));
--bad-soft:color-mix(in srgb, var(--bad) 11%, var(--paper));

## Djup
--shadow:0 1px 2px rgba(14,32,51,.04), 0 10px 28px -16px rgba(14,32,51,.14);
--shadow-lift:0 1px 2px rgba(14,32,51,.05), 0 18px 40px -20px rgba(14,32,51,.20);

## Typografi
--font-display:"Castoro"; --font-body:"Castoro";
Reserv: Georgia, "Times New Roman", serif.
Kursiva serif-ord i rubriker behalls.
OPPET: neutral sans for tabeller, axlar och nyckeltal ska provas
innan detta last. Serif i tat sifferkolumn ar svarlast.

## Form
--radius:10px; --border-width:1px; --maxw:1080px;
--r-sm:calc(var(--radius) * .7);

## Regler
Referens, inte inklistring. Komponenterna i repot behalls.
Bara tokens byts, sa foljer allt med automatiskt.
