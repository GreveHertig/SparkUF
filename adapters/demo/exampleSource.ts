// Exempelkällor (PR 11): källan på påhittad data i demot som inte har någon
// verklig källa i sin port, till exempel stegens höjdpunkter, konkurrenternas
// beskrivningar, byggets credits och siffrorna i Medgrundarens manus.
//
// Sådana påståenden lånade tidigare en poängdels eller registrets källa (rättat
// i PR 10). Nu får de en egen källa som säger vad de är: påhittad data, och var
// i scenariot den kommer ifrån ("Påhittad data, steg 04"). De visas alltid med
// datatypen "example", som ger taggen etiketten "Exempel" och fiktionsmärkets
// streckade kant (components/ui/SourceTag.tsx). En exempelkälla får aldrig
// bära ett myndighetsnamn, och den används bara i demot: /app visar luckan.
import type { Källa } from "@/core/domain";
import type { Locale } from "@/i18n/context";
import type { Dictionary } from "@/i18n/dictionary";
import { sv } from "@/i18n/sv";
import { en } from "@/i18n/en";
import { fill } from "@/i18n/fill";
import { engineFor } from "./journeyEngine";
import { useDemoStore } from "./demoStore";

const dictionaries: Record<Locale, Dictionary> = { sv, en };

export type ExampleOrigin = { step: number } | "ideaScreening" | "suggestions" | "score";

/** Datumet i scenariot: det senaste momentet i steget som demot hunnit till,
 * annars det aktuella momentet. */
function scenarioDate(stepNumber: number | null): string {
  const { beatIndex, entry } = useDemoStore.getState();
  const engine = engineFor(entry);
  const current = engine.getBeatAt(beatIndex);
  if (stepNumber === null) return current.todayIso;
  const reached = engine.beats.slice(0, beatIndex + 1).filter((beat) => beat.stepNumber === stepNumber);
  return reached.at(-1)?.todayIso ?? current.todayIso;
}

export function exampleSource(locale: Locale, origin: ExampleOrigin): Källa {
  const copy = dictionaries[locale].site.demo;
  const originText =
    typeof origin === "object"
      ? fill(copy.exampleOrigins.step, { step: String(origin.step).padStart(2, "0") })
      : copy.exampleOrigins[origin];
  const stepNumber = typeof origin === "object" ? origin.step : origin === "ideaScreening" ? 1 : null;
  return { namn: fill(copy.exampleSourceTemplate, { origin: originText }), hämtad: scenarioDate(stepNumber) };
}
