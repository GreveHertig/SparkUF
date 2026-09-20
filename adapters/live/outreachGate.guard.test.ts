import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * G2, statisk grindvakt: varje metod i porten OutreachPrep måste börja med
 * `assertOutreachAccessAllowed()` i liveadaptern, och adaptern får inte ha
 * fler metoder än porten. Källtext, inte AST: ett av fyra lager, se
 * docs/moduler/utskick-och-svar.md ("Grind").
 */
const port = readFileSync("ports/OutreachPrep.ts", "utf8");
const adapter = readFileSync("adapters/live/OutreachPrep.ts", "utf8");

const portBlock = port.slice(port.indexOf("export interface OutreachPrep"));
const portMethods = [...portBlock.matchAll(/^\s{2}(\w+)\(/gm)].map((m) => m[1]);
const adapterBlock = adapter.slice(adapter.indexOf("export const liveOutreachPrep"));
const adapterMethods = [...adapterBlock.matchAll(/^ {2}async (\w+)\(/gm)].map((m) => m[1]);

describe("Grindvakt: adapters/live/OutreachPrep.ts", () => {
  it("hittar portens metoder", () => {
    expect(portMethods.length).toBeGreaterThan(0);
  });

  it("adaptern har exakt portens metoder (en ny metod kan inte slinka förbi grinden)", () => {
    expect([...adapterMethods].sort()).toEqual([...portMethods].sort());
  });

  it.each(portMethods)("%s: första satsen är assertOutreachAccessAllowed()", (name) => {
    const start = adapterBlock.search(new RegExp(`^ {2}async ${name}\\(`, "m"));
    const open = adapterBlock.indexOf("{\n", adapterBlock.indexOf(")", start));
    const body = adapterBlock.slice(open + 2);
    const firstStatement = body.replace(/^(\s*\/\/[^\n]*\n)*/, "").trimStart();
    expect(firstStatement).toMatch(/^(const \w+ = )?await assertOutreachAccessAllowed\(\);/);
  });
});
