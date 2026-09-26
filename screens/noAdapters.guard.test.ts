import { describe, expect, it } from "vitest";
import { sourceFiles } from "@/test/repoFiles";

/**
 * Portregeln för skärmarna (CLAUDE.md, docs/arkitektur.md): en skärm vet
 * aldrig varifrån datan kommer. Den får props och typer från `ports/` och
 * `core/`, aldrig något ur `adapters/demo` eller `adapters/live`. Röd om
 * någon fil under `screens/` importerar, exporterar vidare eller laddar
 * (`import()`/`require`) något ur `adapters/`, med alias eller relativ sökväg.
 * Gäller även skärmarnas tester. Del av docs/plan-en-design.md, PR 1.
 */
const ADAPTER_IMPORT =
  /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s+)["'](?:@\/adapters\/|(?:\.\.\/)+adapters\/)/;

function adapterImports(text: string): string[] {
  return text.split("\n").filter((line) => ADAPTER_IMPORT.test(line));
}

describe("screens/ importerar aldrig adapters/", () => {
  it("vakten känner igen alla sätt att importera en adapter", () => {
    const bad = [
      'import { demoOutreachProvider } from "@/adapters/demo/OutreachProvider";',
      'import type { ResponseCard } from "@/adapters/demo/OutreachProvider";',
      'export type { TranscriptItem } from "@/adapters/demo/cofounderScript";',
      'const live = await import("@/adapters/live/RegistryProvider");',
      "import { x } from '../adapters/live/PulseProvider';",
      'import "@/adapters/demo/demoStore";',
    ];
    for (const line of bad) expect(adapterImports(line), line).toHaveLength(1);
    expect(adapterImports('import type { ResponseCard } from "@/ports/OutreachProvider";')).toHaveLength(0);
    expect(adapterImports("// adapters/demo/sara.ts nämns bara i en kommentar")).toHaveLength(0);
  });

  it("ingen fil under screens/ importerar från adapters/", () => {
    // Den här filen själv har exempelrader med adapterimporter (testet ovan).
    const screens = sourceFiles().filter(
      (file) => file.path.startsWith("screens/") && file.path !== "screens/noAdapters.guard.test.ts",
    );
    expect(screens.length).toBeGreaterThan(0);
    const offenders = screens.flatMap((file) =>
      adapterImports(file.text).map((line) => `${file.path}: ${line.trim()}`),
    );
    expect(offenders).toEqual([]);
  });
});
