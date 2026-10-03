import type { NewPlanItem, PlanItem, PlanRepository } from "@/ports/PlanRepository";
import { PLAN_ITEM_CONTEXT_MAX, PLAN_ITEM_TEXT_MAX, PLAN_MAX_OPEN } from "@/core/plan";
import { PlanLimitError, PlanTextError } from "@/core/errors";
import type { PlanOrigin } from "@/core/plan";
import { cleanText } from "@/core/text";

/**
 * Demots plan ligger i minnet och används inte av någon demosida: demots
 * Pulsen och Resan visar ingen plan. Finns för att varje port ska ha en
 * demoadapter och för kontraktstestet.
 */
export function createDemoPlanRepository(): PlanRepository {
  let items: (PlanItem & { origin: PlanOrigin; originRef: string | null })[] = [];
  let nextId = 0;

  const key = (text: string, originRef: string | null) => `${originRef ?? ""}|${text.toLowerCase()}`;

  return {
    async getItems() {
      const open = items.filter((item) => !item.done);
      const done = items.filter((item) => item.done);
      return [...open, ...done].map(({ id, text, context, origin, due, done: isDone, createdAtIso }) => ({
        id,
        text,
        context,
        origin,
        ...(due ? { due } : {}),
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
          ...(item.due ? { due: item.due } : {}),
        });
      }
      const open = items.filter((item) => !item.done).length;
      if (fresh.length > 0 && open + fresh.length > PLAN_MAX_OPEN) throw new PlanLimitError(PLAN_MAX_OPEN);
      items = [...items, ...fresh];
      return fresh.length;
    },

    async updateText(id: string, text: string) {
      const cleaned = cleanText(text, PLAN_ITEM_TEXT_MAX);
      if (!cleaned) throw new PlanTextError("empty");
      const item = items.find((candidate) => candidate.id === id);
      if (!item) return;
      const clash = items.some(
        (other) => other.id !== id && key(other.text, other.originRef) === key(cleaned, item.originRef),
      );
      if (clash) throw new PlanTextError("duplicate");
      items = items.map((candidate) => (candidate.id === id ? { ...candidate, text: cleaned } : candidate));
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
