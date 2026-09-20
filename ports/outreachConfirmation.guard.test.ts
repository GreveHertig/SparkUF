import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import type { ConfirmedOutreach } from "./outreachConfirmation";
import type { EmailSuggestion, OutreachDraft } from "./OutreachPrep";
import type { OutreachProvider } from "./OutreachProvider";
import { sourceFiles } from "@/test/repoFiles";

/**
 * G4, bekräftelsevakt: ingenting får skickas utan att grundaren manuellt
 * bekräftat adress OCH text. `ConfirmedOutreach` kan inte skapas av någon kod
 * (docs/moduler/utskick-och-svar.md, "Bekräftelse"). Röd om någon fil utanför
 * ports/outreachConfirmation.ts nämner brandet, casta:r till typen eller
 * skriver ett `status: "confirmed"`-literal.
 */
const OWNER = "ports/outreachConfirmation.ts";
const SELF = "ports/outreachConfirmation.guard.test.ts";

describe("Bekräftelsevakt", () => {
  // Vitest tar bort typer, så @ts-expect-error nedan skulle annars aldrig prövas i `pnpm test`.
  // Här körs tsc på just den här filen: ett oanvänt @ts-expect-error (t.ex. om ConfirmedOutreach
  // blivit `any`) eller ett typfel ger rött.
  it("tsc bekräftar typskydden i den här filen", { timeout: 120_000 }, () => {
    expect(() =>
      execFileSync("node_modules/.bin/tsc", ["-p", "test/tsconfig.confirmation.json"], {
        stdio: "pipe",
        encoding: "utf8",
      }),
    ).not.toThrow();
  });

  it("brandsymbolen nämns bara i sin egen fil", () => {
    const offenders = sourceFiles()
      .filter(({ path, text }) => path !== OWNER && path !== SELF && text.includes("CONFIRMED_BY_HUMAN"))
      .map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it("ingen fil casta:r till ConfirmedOutreach eller skriver ett confirmed-literal", () => {
    const castPatterns = [
      /\bas\s+(unknown\s+as\s+)?ConfirmedOutreach\b/,
      /<ConfirmedOutreach>\s*[\w({[]/,
      /status:\s*["']confirmed["']/,
    ];
    const offenders = sourceFiles()
      .filter(({ path }) => path !== OWNER && path !== SELF)
      .filter(({ text }) => castPatterns.some((re) => re.test(text)))
      .map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it("typsystemet: varken objektliteral eller adressförslag går att tilldela ConfirmedOutreach", () => {
    const suggestion = {} as EmailSuggestion;
    // @ts-expect-error: ett förslag är inte en bekräftelse
    const a: ConfirmedOutreach = suggestion;
    // @ts-expect-error: ett objektliteral saknar brandet
    const b: ConfirmedOutreach = {
      status: "confirmed",
      address: "x@y.se",
      subject: "s",
      body: "b",
      confirmedByUserId: "u",
      confirmedAt: "2026-01-01",
    };
    expect([a, b]).toHaveLength(2);
  });

  it("typsystemet: send() tar varken adressförslag eller utkast", () => {
    const send = (provider: OutreachProvider, suggestion: EmailSuggestion, draft: OutreachDraft) => {
      // @ts-expect-error: ett adressförslag är inte bekräftat
      void provider.send([suggestion]);
      // @ts-expect-error: ett utkast är inte bekräftat
      void provider.send([draft]);
    };
    expect(typeof send).toBe("function");
  });
});
