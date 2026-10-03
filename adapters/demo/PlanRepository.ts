import type { NewPlanItem, PlanItem, PlanRepository } from "@/ports/PlanRepository";
import { PLAN_ITEM_CONTEXT_MAX, PLAN_ITEM_TEXT_MAX, PLAN_MAX_OPEN } from "@/core/plan";
import { PlanLimitError } from "@/core/errors";
import { cleanText } from "@/core/text";

/**
 * Demots plan ligger i minnet och används inte av någon demosida: demots
 * Pulsen och Resan visar ingen plan. Finns för att varje port ska ha en
 * demoadapter och för kontraktstestet.
 */
export function createDemoPlanRepository(): PlanRepository {
  let items: (PlanItem & { origin: string; originRef: string | null })[] = [];
  let nextId = 0;

  const key = (text: string, originRef: string | null) => `${originRef ?? ""}|${text.toLowerCase()}`;

  return {
    async getItems() {
      const open = items.filter((item) => !item.done);
      const done = items.filter((item) => item.done);
      return [...open, ...done].map(({ id, text, context, done: isDone, createdAtIso }) => ({
        id,
        text,
        context,
        done: isDone,
        createdAtIso,
      }));
    },

    async addItems(newItems: NewPlanItem[]) {
      const existing = new Set(items.map((item) => key(item.text, item.originRef)));
      const fresh: typeof items = [];
      for (const item of newItems) {
        const text = cleanText(item.text, PLAN_ITEM_TEXT_MAX);
        if (!text) continue;
        const originRef = item.originRef ?? null;
        const itemKey = key(text, originRef);
        if (existing.has(itemKey)) continue;
        existing.add(itemKey);
        const context = item.context ? cleanText(item.context, PLAN_ITEM_CONTEXT_MAX) || null : null;
        fresh.push({
          id: `demo-plan-${++nextId}`,
          text,
          context,
          done: false,
          createdAtIso: new Date().toISOString(),
          origin: item.origin,
          originRef,
        });
      }
      const open = items.filter((item) => !item.done).length;
      if (fresh.length > 0 && open + fresh.length > PLAN_MAX_OPEN) throw new PlanLimitError(PLAN_MAX_OPEN);
      items = [...items, ...fresh];
      return fresh.length;
    },

    async setDone(id: string, done: boolean) {
      items = items.map((item) => (item.id === id ? { ...item, done } : item));
    },

    async removeItem(id: string) {
      items = items.filter((item) => item.id !== id);
    },
  };
}

export const demoPlanRepository = createDemoPlanRepository();
