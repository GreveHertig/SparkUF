# Externa skills

Kopierade, inte länkade, så att molnsessioner får dem utan nätverk. Uppdatera bara medvetet och läs igenom ändringarna först: en skill är instruktioner med sessionens rättigheter.

| Skill | Källa | Version | Licens |
|---|---|---|---|
| emil-design-eng, animate, review-animations, animation-vocabulary | https://github.com/emilkowalski/skills | e8a175de22ae1e49370fc144c1f3bb9aeedf988d | MIT (LICENSE-emilkowalski) |

Genomgång 2026-10-03: bara markdown, inga skript eller kommandon, bara länkar till easing.dev och easings.co. Mobil-, Swift- och Expo-skills i samma repo togs inte med eftersom Spark är en webbapp.

## Regel

`DESIGN.md` och tokens i `design/` gäller framför alla designskills. Skillsen används för att granska och finputsa rörelse och detaljer, inte för att byta stil. Inga nya beroenden (till exempel animationsbibliotek) utan att fråga.

## Medvetet inte installerat

- **Impeccable** (pbakaus/impeccable): hämtar och kör en binär vid första körning, installerar hookar som körs vid varje redigering, och kommandona `init` och `document` skriver om `DESIGN.md`. Inget av det passar en kodbas med ett färdigt designsystem och molnsessioner utan nätverk. Kan användas lokalt för audit/critique om någon vill, utan att committas.
- **Context7 MCP:** `.mcp.json` är gitignorerad här, så den läggs lokalt per person.
