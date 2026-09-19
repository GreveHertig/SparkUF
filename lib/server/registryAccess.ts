import "server-only";
import { RegistryLockedError } from "@/core/errors";
import { getCurrentUser } from "@/lib/server/session";

/**
 * Licensgrinden för Registret (docs/moduler/registret.md, "Licensgrind").
 * Tills docs/dataspiken.md §6 fråga 1 är Verifierat får bara Erik och Theodor
 * använda liveregisterdata. Nekat som standard: BÅDE flaggan och allowlisten
 * måste vara satta, så varken en förlupen flagga eller en förlupen rad räcker.
 *
 * Anropas som första sats i varje metod i adapters/live/RegistryProvider.ts,
 * före indatavalidering och före alla externa anrop. Ingen NEXT_PUBLIC_.
 */

function allowedUserIds(): Set<string> {
  const raw = process.env.REGISTRY_ALLOWED_USER_IDS ?? "";
  return new Set(
    raw
      .split(",")
      .map((id) => id.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function assertRegistryAccessAllowed(): Promise<void> {
  if (process.env.REGISTRY_LIVE_ENABLED !== "true") throw new RegistryLockedError();
  const allowed = allowedUserIds();
  if (allowed.size === 0) throw new RegistryLockedError();
  const user = await getCurrentUser();
  if (!user || !allowed.has(user.id.toLowerCase())) throw new RegistryLockedError();
}
