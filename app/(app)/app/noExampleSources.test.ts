import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

// PR 11: demots exempelkällor (adapters/demo/exampleSource.ts, datatypen
// "example") finns bara i demot. I /app, /start och liveadaptrarna visas
// luckan när verkligt underlag saknas, aldrig ett exempel.
const ROOT = join(__dirname, "..", "..", "..");
const LIVE_DIRS = ["app/(app)", "app/start", "adapters/live", "lib/server"];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

describe("inga exempelkällor utanför demot (PR 11)", () => {
  it("ingen /app-rutt, /start-rutt eller liveadapter använder exempelkällan eller datatypen example", () => {
    const offenders: string[] = [];
    for (const dir of LIVE_DIRS) {
      for (const file of files(join(ROOT, dir))) {
        const source = readFileSync(file, "utf8");
        if (/exampleSource|dataType:\s*"example"|"example"\s+as\s+const|exampleOrigins/.test(source)) {
          offenders.push(relative(ROOT, file));
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
