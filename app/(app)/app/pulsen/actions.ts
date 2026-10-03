"use server";

import { revalidatePath } from "next/cache";
import { livePulseProvider } from "@/adapters/live/PulseProvider";
import { livePlanRepository } from "@/adapters/live/PlanRepository";
import type { PlanDue } from "@/ports/PlanRepository";
import { optional } from "../_lib/optional";
import { PlanLimitError, PulseWatchError } from "@/core/errors";
import { sv } from "@/i18n/sv";
import type { AddPlaybookResult, PulseWatchResult } from "@/screens/Pulse";

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

/**
 * "Lägg till stegen i min plan" (docs/moduler/min-plan.md). Stegen hämtas ur
 * spelbokens i18n-texter här på servern, aldrig från klienten: klienten
 * skickar bara signalens id, sorten, området och rubriken. Rubriken blir
 * uppgiftens sammanhang, rensas och kapas i adaptern, och är grundarens egen
 * data i grundarens egen plan. Användaren tas ur sessionen i adaptern, och RLS
 * på plan_items är den bindande spärren.
 */
export async function addPlaybookToPlan(request: unknown): Promise<AddPlaybookResult> {
  const steps = playbookSteps(request);
  if (!steps) return { ok: false, reason: "failed" };
  const { signalId, headline } = request as { signalId: string; headline: string };
  // Sista ansökningsdag (Pulsen v3) hämtas ur grundarens egen signal på
  // servern, aldrig från klienten. Går signalen inte att läsa blir det ingen.
  const due = await signalDue(signalId);
  try {
    const added = await livePlanRepository.addItems(
      steps.map((text) => ({ text, context: headline, origin: "pulsen" as const, originRef: signalId, due })),
    );
    revalidatePath("/app/resan");
    return { ok: true, added };
  } catch (error) {
    if (error instanceof PlanLimitError) return { ok: false, reason: "full" };
    // Bara namnet, aldrig meddelandet: det kan bära databasens svar.
    console.error(`Min plan: stegen kunde inte sparas (${error instanceof Error ? error.name : "okänt fel"}).`);
    return { ok: false, reason: "failed" };
  }
}

/** Spelbokens steg för en giltig förfrågan, annars `null`. Bara egna nycklar, aldrig ärvda. */
function playbookSteps(request: unknown): string[] | null {
  if (!request || typeof request !== "object") return null;
  const { signalId, kind, area, headline } = request as Record<string, unknown>;
  if (typeof signalId !== "string" || typeof area !== "string" || typeof headline !== "string") return null;
  const areas =
    kind === "risk" ? sv.pulsePage.riskAreas : kind === "opportunity" ? sv.pulsePage.opportunityAreas : null;
  if (!areas || !Object.prototype.hasOwnProperty.call(areas, area)) return null;
  return (areas as Record<string, { playbook: { solve: string[] } }>)[area].playbook.solve;
}

/** Signalens sista ansökningsdag med signalens källa, eller null. */
async function signalDue(signalId: string): Promise<PlanDue | null> {
  if (typeof livePulseProvider.getSignals !== "function") return null;
  const signals = await optional(livePulseProvider.getSignals("sv"), "Min plan: signalen");
  const signal = signals?.find((item) => item.id === signalId);
  if (!signal?.deadline) return null;
  return { date: signal.deadline, source: { namn: signal.source.namn, hämtad: signal.source.hämtad } };
}
