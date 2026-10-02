"use server";

import { revalidatePath } from "next/cache";
import { livePulseProvider } from "@/adapters/live/PulseProvider";
import { PulseWatchError } from "@/core/errors";
import type { PulseWatchResult } from "@/screens/Pulse";

/**
 * Pulsens omdöme och bevakningar i /app (docs/moduler/webbresearch-och-pulsen.md,
 * "Omdöme och bevakningar"). Användaren tas ur sessionen i adaptern
 * (`requireSupabaseUser`), aldrig ur indata, och RLS på pulse_feedback och
 * pulse_watches är den bindande spärren. Indata kontrolleras här och i adaptern.
 * Grundarens ord är data, aldrig instruktion (CLAUDE.md, Säkerhet).
 */

export async function giveFeedback(signalId: unknown, verdict: unknown): Promise<void> {
  if (typeof signalId !== "string" || (verdict !== "relevant" && verdict !== "not_relevant")) {
    throw new Error("Pulsen: ogiltigt omdöme.");
  }
  // Ingen revalidering: skärmen visar svaret direkt, och nästa sidvisning läser omdömet.
  await livePulseProvider.setFeedback!(signalId, verdict);
}

export async function addWatch(kind: unknown, term: unknown): Promise<PulseWatchResult> {
  if ((kind !== "competitor" && kind !== "keyword") || typeof term !== "string") {
    return { ok: false, reason: "failed" };
  }
  try {
    await livePulseProvider.addWatch!(kind, term);
  } catch (error) {
    if (error instanceof PulseWatchError) return { ok: false, reason: error.reason };
    // Bara namnet, aldrig meddelandet: det kan bära databasens svar.
    console.error(`Pulsen: bevakningen kunde inte sparas (${error instanceof Error ? error.name : "okänt fel"}).`);
    return { ok: false, reason: "failed" };
  }
  revalidatePath("/app/pulsen");
  return { ok: true };
}

export async function removeWatch(id: unknown): Promise<void> {
  if (typeof id !== "string") throw new Error("Pulsen: ogiltigt id.");
  await livePulseProvider.removeWatch!(id);
  revalidatePath("/app/pulsen");
}
