import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sourceFiles } from "@/test/repoFiles";

/**
 * G2, statisk grindvakt: varje metod i porten OutreachPrep måste börja med
 * `assertOutreachAccessAllowed()` i liveadaptern, och adaptern får inte ha
 * fler metoder än porten. Källtext, inte AST: ett av fyra lager, se
 * docs/moduler/utskick-och-svar.md ("Grind").
 */
const port = readFileSync("ports/OutreachPrep.ts", "utf8");
const adapter = readFileSync("adapters/live/OutreachPrep.ts", "utf8");

const portBlock = port.slice(port.indexOf("export interface OutreachPrep"));
const portMethods = [...portBlock.matchAll(/^\s{2}(?:readonly )?(\w+)\s*[(:]/gm)].map((m) => m[1]);
const adapterBlock = adapter.slice(adapter.indexOf("export const liveOutreachPrep"));
// Alla nycklar på två blanksteg: async-metoder, vanliga metoder och egenskaper. Bara `async name(` godkänns nedan.
const adapterMethods = [...adapterBlock.matchAll(/^ {2}(?:async )?(\w+)\s*[(:]/gm)].map((m) => m[1]);

describe("Grindvakt: adapters/live/OutreachPrep.ts", () => {
  it("hittar portens metoder", () => {
    expect(portMethods.length).toBeGreaterThan(0);
  });

  it("adaptern har exakt portens metoder (en ny metod kan inte slinka förbi grinden)", () => {
    expect([...adapterMethods].sort()).toEqual([...portMethods].sort());
  });

  it.each(portMethods)("%s: första satsen är assertOutreachAccessAllowed()", (name) => {
    const start = adapterBlock.search(new RegExp(`^ {2}async ${name}\\(`, "m"));
    expect(start, `${name} måste skrivas som \`async ${name}(\` för att vakten ska kunna läsa den`).toBeGreaterThan(-1);
    const open = adapterBlock.indexOf("{\n", adapterBlock.indexOf(")", start));
    const body = adapterBlock.slice(open + 2);
    const firstStatement = body.replace(/^(\s*\/\/[^\n]*\n)*/, "").trimStart();
    expect(firstStatement).toMatch(/^(const \w+ = )?await assertOutreachAccessAllowed\(\);/);
  });

  it("grinden importeras från rätt modul, inte en lokal kopia", () => {
    expect(adapter).toMatch(
      /import \{ assertOutreachAccessAllowed \} from "@\/lib\/server\/outreachAccess";/,
    );
    expect(adapter).not.toMatch(/function assertOutreachAccessAllowed|const assertOutreachAccessAllowed/);
  });

  it("bara godkända icke-testfiler använder Tavily (varje ny användare måste läggas till här medvetet)", () => {
    const allowed = new Set(["adapters/live/OutreachPrep.ts", "adapters/live/PulseProvider.ts", "lib/server/tavily.ts"]);
    const users = sourceFiles()
      .filter(({ path, text }) => !/\.test\.tsx?$/.test(path) && /@\/lib\/server\/tavily"/.test(text))
      .map((f) => f.path)
      .filter((p) => !allowed.has(p));
    expect(users).toEqual([]);
  });
});
