import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { OutreachSendDisabledError, NotImplementedError } from "@/core/errors";
import { liveOutreachProvider } from "@/adapters/live/OutreachProvider";
import { sourceFiles } from "@/test/repoFiles";

/**
 * G3, sändvakt: ingen riktig e-post får kunna skickas (docs/moduler/utskick-och-svar.md,
 * "Sändspärr"). Röd om ett mejlpaket, Gmail-sändning eller SMTP dyker upp i
 * beroenden eller kod. Tas inte bort utan uttryckligt ja från Theodor och grundaren.
 */
const PACKAGES = [
  "nodemailer",
  "googleapis",
  "@googleapis/",
  "@sendgrid/",
  "resend",
  "postmark",
  "mailgun",
  "@aws-sdk/client-ses",
];
const ENDPOINTS = ["gmail.googleapis.com", "users.messages.send", "createTransport", "smtp://", "smtps://"];

// Filer som nämner namnen för att FÖRBJUDA dem.
const ALLOWED_MENTIONS = new Set(["eslint.config.mjs", "lib/server/noMailer.guard.test.ts"]);

describe("Sändvakt", () => {
  it("package.json har inget mejlpaket", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    const deps = Object.keys({
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.optionalDependencies,
      ...pkg.peerDependencies,
    });
    const hits = deps.filter((d) => PACKAGES.some((p) => d === p || d.startsWith(p) || d.startsWith(`${p}-`)));
    expect(hits).toEqual([]);
  });

  it("ingen källfil importerar ett mejlpaket eller nämner en sändningsändpunkt", () => {
    const offenders: string[] = [];
    for (const { path, text } of sourceFiles()) {
      if (ALLOWED_MENTIONS.has(path)) continue;
      const importsPackage = PACKAGES.some((p) =>
        new RegExp(`(from\\s+|require\\(\\s*|import\\(\\s*)["']${p.replace(/[/@.-]/g, "\\$&")}`).test(text),
      );
      const usesEndpoint = ENDPOINTS.some((e) => text.includes(e));
      if (importsPackage || usesEndpoint) offenders.push(path);
    }
    expect(offenders).toEqual([]);
  });

  it("liveOutreachProvider.send avvisar alltid med OutreachSendDisabledError", async () => {
    const attempt = liveOutreachProvider.send([]);
    await expect(attempt).rejects.toBeInstanceOf(OutreachSendDisabledError);
    await expect(attempt).rejects.toBeInstanceOf(NotImplementedError);
    await expect(liveOutreachProvider.getStatuses()).rejects.toBeInstanceOf(OutreachSendDisabledError);
    await expect(liveOutreachProvider.getCampaign("sv")).rejects.toBeInstanceOf(OutreachSendDisabledError);
  });
});
