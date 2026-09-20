import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

/** Testhjälpare för vakttesterna: källfiler i repot (utan beroenden, byggen och docs). */
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "docs", "out", "build", ".claude"]);
const ROOT = process.cwd();

export function sourceFiles(exts = [".ts", ".tsx", ".mjs", ".js"]): { path: string; text: string }[] {
  const found: { path: string; text: string }[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(join(dir, entry.name));
      } else if (exts.some((e) => entry.name.endsWith(e))) {
        const full = join(dir, entry.name);
        found.push({ path: relative(ROOT, full).split("\\").join("/"), text: readFileSync(full, "utf8") });
      }
    }
  };
  walk(ROOT);
  return found;
}
