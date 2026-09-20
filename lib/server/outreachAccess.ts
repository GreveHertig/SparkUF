import "server-only";
import { OutreachLockedError } from "@/core/errors";
import { getCurrentUser } from "@/lib/server/session";

/**
 * Grinden för Utskick-förberedelsen (docs/moduler/utskick-och-svar.md, "Grind").
 * Rör riktiga externa företag, så nekat som standard: BÅDE flaggan och
 * allowlisten måste vara satta, annars nekas allt.
 *
 * Anropas som första sats i varje metod i adapters/live/OutreachPrep.ts,
 * före indatavalidering och före alla externa anrop (vaktas av
 * adapters/live/outreachGate.guard.test.ts). Ingen NEXT_PUBLIC_.
 */

function allowedUserIds(): Set<string> {
  const raw = process.env.OUTREACH_ALLOWED_USER_IDS ?? "";
  return new Set(
    raw
      .split(",")
      .map((id) => id.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** Returnerar den tillåtna användarens id (används av throttlen). */
export async function assertOutreachAccessAllowed(): Promise<string> {
  if (process.env.OUTREACH_LIVE_ENABLED !== "true") throw new OutreachLockedError();
  const allowed = allowedUserIds();
  if (allowed.size === 0) throw new OutreachLockedError();
  const user = await getCurrentUser();
  if (!user || !allowed.has(user.id.toLowerCase())) throw new OutreachLockedError();
  return user.id;
}
