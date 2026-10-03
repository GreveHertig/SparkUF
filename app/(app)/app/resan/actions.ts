"use server";

import { revalidatePath } from "next/cache";
import { livePlanRepository } from "@/adapters/live/PlanRepository";

/**
 * Min plan i Resan (docs/moduler/min-plan.md): bocka av och ta bort.
 * Användaren tas ur sessionen i adaptern, aldrig ur indata, och RLS på
 * plan_items är den bindande spärren. Indata kontrolleras här och i adaptern.
 */

export async function togglePlanItem(id: unknown, done: unknown): Promise<void> {
  if (typeof id !== "string" || typeof done !== "boolean") throw new Error("Min plan: ogiltig ändring.");
  await livePlanRepository.setDone(id, done);
  revalidatePath("/app/resan");
}

export async function removePlanItem(id: unknown): Promise<void> {
  if (typeof id !== "string") throw new Error("Min plan: ogiltigt id.");
  await livePlanRepository.removeItem(id);
  revalidatePath("/app/resan");
}
