#!/usr/bin/env node
// PreToolUse-hook för Edit/Write/MultiEdit. Gör reglerna i docs/arbetsflode.md mekaniska.
// - Hemligheter (.env*, utom .env.example): nekas alltid.
// - Känsliga filer (core/score.ts, ports/, demodata): kräver att en människa bekräftar.
import { readFileSync } from "node:fs";

let input = {};
try {
  input = JSON.parse(readFileSync(0, "utf8"));
} catch {
  process.exit(0); // aldrig blockera på trasig indata
}

const raw = input?.tool_input?.file_path ?? input?.tool_input?.notebook_path ?? "";
if (!raw) process.exit(0);

const cwd = input.cwd ?? process.cwd();
const rel = raw.startsWith(cwd) ? raw.slice(cwd.length).replace(/^\/+/, "") : raw.replace(/^\.\//, "");

const respond = (decision, reason) => {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: decision,
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0);
};

const base = rel.split("/").pop() ?? "";
if (/^\.env(\..*)?$/.test(base) && base !== ".env.example") {
  respond("deny", `Nekad: ${rel} kan innehålla hemligheter. Redigera .env.example (utan värden) i stället.`);
}

const sensitive = [
  [/^core\/score\.ts$/, "poängen räknas bara av calculateScore"],
  [/^ports\/(.*)$/, "portar är kontrakt mellan team, ändra dem i samråd med Erik"],
  [/^adapters\/demo\//, "demodata ska vara fiktiv och stabil"],
  [/^lib\/demo-data\//, "demodata ska vara fiktiv och stabil"],
];
for (const [re, why] of sensitive) {
  if (re.test(rel)) {
    respond("ask", `Skyddad fil enligt docs/arbetsflode.md: ${rel} (${why}). Fortsätt bara om Theo uttryckligen bett om ändringen i den här filen; annars stoppa och rapportera.`);
  }
}
process.exit(0);
