## Modul: Juridisk koll — källorna kontrollerade, del 2 (klar 2026-10-01, gren `modul/juridisk-koll-kallor-2`, PR mot `prototyp`)

### Klart
- **Källorna från Skatteverket, IMY, EUR-Lex och Konsumentverket är nu kontrollerade av en människa** (Oskar Jaeger, i webbläsaren 2026-10-01). Kontrollistan med adresser står ordagrant i verifieringsloggen i `docs/moduler/juridisk-koll.md`. Beslutet står i `docs/beslut.md` under 2026-10-01. **Ingenting är juristgranskat.**
- `adapters/live/legalSources.ts`:
  - `skatteverket`, `imy` och `konsumentverket` (startsidor) är ersatta av en källa per undersida, `hämtad: "2026-10-01"`. `eurlex_gdpr` pekar på den svenska versionen.
  - `gdpr_personuppgifter` är uppdelat i `gdpr_rattslig_grund` och `gdpr_register`, med var sin IMY-sida. Katalogen har nu 18 ämnen.
  - Nya texter för de fyra DELVIS-punkterna: `f_skatt`, `moms` (med gränsen 120 000 kr), `gdpr_register` och `konsument_angerratt`.
  - `moms` och `arbetsgivare` pekar på den första av de två adresserna. Den andra står bara i loggen.
  - Verifieringskommentaren i filhuvudet är omskriven.
- `adapters/live/legalSources.test.ts`: domäntestet matchar nu på prefix. Tre nya tester: varje ämne pekar på en källa som en människa kontrollerat (`hämtad` 2026-09-30 eller senare), EUR-Lex pekar på den svenska versionen, och GDPR-ämnena har var sin IMY-sida. Testet för undersidor gäller nu alla källor utom `riksdagen`.
- `adapters/live/LegalAdvisor.test.ts`: en rad ändrad, `KURERADE_KÄLLOR.skatteverket` → `KURERADE_KÄLLOR.skatteverket_f_skatt`. Det är den enda ändringen utanför `legalSources.ts` och dess test.
- Inga ändringar i `ports/`, `types/`, `LegalAdvisor.ts`, `legalSchema.ts` eller demoadaptern.

### Återstår
- **Riksdagen:** inte kontrollerad, inget ämne använder källan. Theo beslutar om den ska vara kvar.
- **Frågan om krav och rekommendationer** (se förra Juridisk koll-avsnittet) gäller nu fler ämnen: moms under 120 000 kr, GDPR-registret under 250 anställda och FA-skatt gäller bara vissa. `LegalAdvisor.ts` sätter fortfarande `status: "ej_uppfyllt"` på varje krav.
- Juristgranskning av hela ämneskatalogen.

### Beslut
- Ämnes-id:t `gdpr_personuppgifter` och källnycklarna `skatteverket`, `imy` och `konsumentverket` finns inte längre.
