"use server";

import { revalidatePath } from "next/cache";
import { livePlanRepository } from "@/adapters/live/PlanRepository";
import { PlanLimitError, PlanTextError } from "@/core/errors";
import type { PlanEditResult } from "@/screens/Journey";

/**
 * Min plan i Resan (docs/moduler/min-plan.md): bocka av, ta bort, ändra text
 * och lägg till egna uppgifter. Användaren tas ur sessionen i adaptern, aldrig
 * ur indata, och RLS på plan_items är den bindande spärren. Indata kontrolleras
 * här och i adaptern. Grundarens text är data, aldrig instruktion.
 */

export async function togglePlanItem(id: unknown, done: unknown): Promise<void> {
  if (typeof id !== "string" || typeof done !== "boolean") throw new Error("Min plan: ogiltig ändring.");
  await livePlanRepository.setDone(id, done);
  revalidatePath("/app/resan");
  revalidatePath("/app");
}

export async function removePlanItem(id: unknown): Promise<void> {
  if (typeof id !== "string") throw new Error("Min plan: ogiltigt id.");
  await livePlanRepository.removeItem(id);
  revalidatePath("/app/resan");
  revalidatePath("/app");
}

/** Byter texten på en uppgift. Fel blir en orsak som skärmen visar ur i18n. */
export async function editPlanItem(id: unknown, text: unknown): Promise<PlanEditResult> {
  if (typeof id !== "string" || typeof text !== "string") return { ok: false, reason: "failed" };
  return run(() => livePlanRepository.updateText(id, text));
}

/** En egen uppgift, skriven av grundaren. Ursprunget är alltid "own". */
export async function addOwnPlanItem(text: unknown): Promise<PlanEditResult> {
  if (typeof text !== "string") return { ok: false, reason: "failed" };
  if (!text.trim()) return { ok: false, reason: "empty" };
  return run(async () => {
    const added = await livePlanRepository.addItems([{ text, origin: "own" }]);
    if (added === 0) throw new PlanTextError("duplicate");
  });
}

async function run(write: () => Promise<void>): Promise<PlanEditResult> {
  try {
    await write();
  } catch (error) {
    if (error instanceof PlanTextError) return { ok: false, reason: error.reason };
    if (error instanceof PlanLimitError) return { ok: false, reason: "full" };
    // Bara namnet, aldrig meddelandet: det kan bära databasens svar.
    console.error(`Min plan: kunde inte spara (${error instanceof Error ? error.name : "okänt fel"}).`);
    return { ok: false, reason: "failed" };
  }
  revalidatePath("/app/resan");
  revalidatePath("/app");
  return { ok: true };
}
