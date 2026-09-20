import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Testhjälpare för vakttesterna: källfiler i repot. Hoppar bara över
 * beroenden/byggen överallt, och docs/.claude/out/build endast på toppnivå
 * (en framtida app/**\/build/ ska skannas).
 */
const SKIP_EVERYWHERE = new Set(["node_modules", ".next", ".git"]);
const SKIP_TOP_LEVEL = new Set(["docs", ".claude", "out", "build"]);
const ROOT = process.cwd();

export function sourceFiles(
  exts = [".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs"],
): { path: string; text: string }[] {
  const found: { path: string; text: string }[] = [];
  const walk = (dir: string, depth: number) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (SKIP_EVERYWHERE.has(entry.name)) continue;
        if (depth === 0 && SKIP_TOP_LEVEL.has(entry.name)) continue;
        walk(join(dir, entry.name), depth + 1);
      } else if (exts.some((e) => entry.name.endsWith(e))) {
        const full = join(dir, entry.name);
        found.push({ path: relative(ROOT, full).split("\\").join("/"), text: readFileSync(full, "utf8") });
      }
    }
  };
  walk(ROOT, 0);
  return found;
}
