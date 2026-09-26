import "server-only";
import { resolveMx } from "node:dns/promises";

/**
 * Kan domänen ta emot mejl? Används av väntelistans Server Action
 * (../actions.ts) innan adressen sparas.
 *
 * - "no-mail": DNS svarar att domänen inte finns (ENOTFOUND) eller saknar
 *   MX-poster (ENODATA, eller en "null MX" enligt RFC 7505).
 * - "ok": domänen har minst en MX-post.
 * - "unknown": uppslaget tog för lång tid eller gav ett annat fel. Då släpps
 *   adressen igenom: riktiga besökare ska aldrig stoppas av DNS-strul.
 */
export type MxVerdict = "ok" | "no-mail" | "unknown";

export const MX_TIMEOUT_MS = 3000;

const NO_MAIL_CODES = new Set(["ENOTFOUND", "ENODATA"]);

export async function checkMailDomain(domain: string, timeoutMs = MX_TIMEOUT_MS): Promise<MxVerdict> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<"timeout">((resolve) => {
    timer = setTimeout(() => resolve("timeout"), timeoutMs);
  });
  try {
    const records = await Promise.race([resolveMx(domain), timeout]);
    if (records === "timeout") return "unknown";
    // Null MX (RFC 7505): en enda post med tomt namn betyder "tar inte emot mejl".
    const accepting = records.filter((record) => record.exchange !== "" && record.exchange !== ".");
    return accepting.length > 0 ? "ok" : "no-mail";
  } catch (error) {
    const code = (error as NodeJS.ErrnoException | null)?.code;
    return code && NO_MAIL_CODES.has(code) ? "no-mail" : "unknown";
  } finally {
    clearTimeout(timer);
  }
}

/** Domänen i en adress (efter sista @), eller null om det inte finns någon. */
export function emailDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  const domain = at >= 0 ? email.slice(at + 1).trim().toLowerCase() : "";
  return domain.includes(".") ? domain : null;
}
