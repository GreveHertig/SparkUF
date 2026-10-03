#!/usr/bin/env node
// Stop-hook: kör typecheck och lint på ändrade filer innan sessionen får avsluta.
// Hoppar tyst över om beroenden saknas eller inget kodrelevant ändrats, och loopar aldrig.
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

let input = {};
try {
  input = JSON.parse(readFileSync(0, "utf8"));
} catch {
  process.exit(0);
}
if (input.stop_hook_active) process.exit(0);

const root = input.cwd ?? process.cwd();
const run = (cmd, args, timeout) =>
  spawnSync(cmd, args, { cwd: root, encoding: "utf8", timeout, maxBuffer: 20 * 1024 * 1024 });

if (!existsSync(`${root}/node_modules`)) process.exit(0);

const changed = new Set();
for (const args of [["diff", "--name-only", "HEAD"], ["ls-files", "--others", "--exclude-standard"]]) {
  const r = run("git", args, 20000);
  for (const f of (r.stdout ?? "").split("\n")) if (f) changed.add(f);
}
const code = [...changed].filter((f) => /\.(ts|tsx|mjs|js)$/.test(f) && existsSync(`${root}/${f}`));
if (code.length === 0) process.exit(0);

const problems = [];
if (!existsSync(`${root}/.next/types`)) run("pnpm", ["exec", "next", "typegen"], 120000);

const tsc = run("pnpm", ["typecheck"], 240000);
if (tsc.status !== 0) problems.push("typecheck misslyckades:\n" + `${tsc.stdout}${tsc.stderr}`.trim().split("\n").slice(-25).join("\n"));

const lint = run("pnpm", ["exec", "eslint", ...code], 240000);
if (lint.status !== 0) problems.push("lint misslyckades på ändrade filer:\n" + `${lint.stdout}${lint.stderr}`.trim().split("\n").slice(-25).join("\n"));

if (problems.length) {
  process.stderr.write(`Åtgärda innan du avslutar (regel i CLAUDE.md: typecheck och lint utan fel före commit):\n\n${problems.join("\n\n")}\n`);
  process.exit(2);
}
process.exit(0);
