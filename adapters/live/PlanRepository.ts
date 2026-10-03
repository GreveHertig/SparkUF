import type { NewPlanItem, PlanItem, PlanRepository } from "@/ports/PlanRepository";
import { PLAN_ITEM_CONTEXT_MAX, PLAN_ITEM_TEXT_MAX, PLAN_MAX_OPEN, PLAN_ORIGINS } from "@/core/plan";
import { NotImplementedError, PlanLimitError, PlanTextError } from "@/core/errors";
import type { PlanOrigin } from "@/core/plan";
import { cleanText } from "@/core/text";
import { requireSupabaseUser } from "@/lib/server/session";

const DOC = "docs/moduler/min-plan.md";
const TABLE = "plan_items";
/** Fler än så läses aldrig. Taket för öppna är PLAN_MAX_OPEN, avbockade sparas också. */
const MAX_READ = 200;
/** Fler än så läggs aldrig till i ett anrop. En spelbok har fyra till fem steg. */
const MAX_ADD = 10;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** PostgREST och Postgres svar när tabellen saknas, t.ex. när migreringen inte är körd. */
function isMissing(error: { code?: string }): boolean {
  return ["PGRST205", "42P01"].includes(error.code ?? "");
}

/** Utan tabell visas varken knappen i Pulsen eller listan i Resan. Felmeddelandet
 * bär bara databasens kod, aldrig dess text, eftersom det kan loggas. */
function failure(error: { code?: string }, what: string): Error {
  if (isMissing(error)) return new NotImplementedError("Min plan", DOC);
  return new Error(`Min plan: kunde inte ${what} (${error.code ?? "okänt fel"}).`);
}

type PlanRow = {
  id: string;
  text: string;
  context: string | null;
  origin: string;
  origin_ref: string | null;
  done: boolean;
  created_at: string;
};

const key = (text: string, originRef: string | null) => `${originRef ?? ""}|${text.toLowerCase()}`;

async function readRows(): Promise<PlanRow[]> {
  const { supabase, userId } = await requireSupabaseUser();
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, text, context, origin, origin_ref, done, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(MAX_READ);
  if (error) throw failure(error, "läsa planen");
  return (data ?? []) as PlanRow[];
}

export const livePlanRepository: PlanRepository = {
  async getItems(): Promise<PlanItem[]> {
    const rows = await readRows();
    const items = rows.map((row) => ({
      id: row.id,
      text: row.text,
      context: row.context,
      // En okänd sort (en framtida migrering) visas som en egen uppgift, aldrig som en krasch.
      origin: (PLAN_ORIGINS.includes(row.origin as PlanOrigin) ? row.origin : "own") as PlanOrigin,
      done: row.done === true,
      createdAtIso: row.created_at,
    }));
    return [...items.filter((item) => !item.done), ...items.filter((item) => item.done)];
  },

  async addItems(newItems: NewPlanItem[]): Promise<number> {
    if (newItems.length > MAX_ADD) throw new Error("Min plan: för många uppgifter i ett anrop.");
    const cleaned = newItems.map((item) => {
      if (!PLAN_ORIGINS.includes(item.origin)) throw new Error("Min plan: okänt ursprung.");
      const originRef = item.originRef ?? null;
      if (originRef !== null && !UUID_PATTERN.test(originRef)) throw new Error("Min plan: ogiltigt ursprungs-id.");
      return {
        text: cleanText(item.text, PLAN_ITEM_TEXT_MAX),
        context: item.context ? cleanText(item.context, PLAN_ITEM_CONTEXT_MAX) || null : null,
        origin: item.origin,
        originRef,
      };
    });

    const rows = await readRows();
    const existing = new Set(rows.map((row) => key(row.text, row.origin_ref)));
    const fresh = cleaned.filter((item) => {
      if (!item.text) return false;
      const itemKey = key(item.text, item.originRef);
      if (existing.has(itemKey)) return false;
      existing.add(itemKey);
      return true;
    });
    if (fresh.length === 0) return 0;

    const open = rows.filter((row) => row.done !== true).length;
    if (open + fresh.length > PLAN_MAX_OPEN) throw new PlanLimitError(PLAN_MAX_OPEN);

    const { supabase, userId } = await requireSupabaseUser();
    let added = 0;
    // En i taget: hinner samma steg sparas från en annan flik under tiden
    // (unikt index, 23505) hoppas just det över, inte hela spelboken.
    for (const item of fresh) {
      // user_id kommer alltid ur sessionen, och RLS ("insert egen") är spärren.
      const { error } = await supabase.from(TABLE).insert({
        user_id: userId,
        text: item.text,
        context: item.context,
        origin: item.origin,
        origin_ref: item.originRef,
      });
      if (error) {
        if (error.code === "23505") continue;
        throw failure(error, "spara uppgiften");
      }
      added += 1;
    }
    return added;
  },

  async updateText(id: string, text: string): Promise<void> {
    if (!UUID_PATTERN.test(id)) throw new Error("Min plan: ogiltigt id.");
    if (typeof text !== "string") throw new PlanTextError("empty");
    const cleaned = cleanText(text, PLAN_ITEM_TEXT_MAX);
    if (!cleaned) throw new PlanTextError("empty");
    const rows = await readRows();
    const item = rows.find((row) => row.id === id);
    if (!item) return;
    if (item.text === cleaned) return;
    const clash = rows.some((row) => row.id !== id && key(row.text, row.origin_ref) === key(cleaned, item.origin_ref));
    if (clash) throw new PlanTextError("duplicate");
    const { supabase, userId } = await requireSupabaseUser();
    const { error } = await supabase.from(TABLE).update({ text: cleaned }).eq("id", id).eq("user_id", userId);
    if (error) {
      // Samma text från samma ursprung finns redan (unikt index).
      if (error.code === "23505") throw new PlanTextError("duplicate");
      throw failure(error, "ändra uppgiften");
    }
  },

  async setDone(id: string, done: boolean): Promise<void> {
    if (!UUID_PATTERN.test(id)) throw new Error("Min plan: ogiltigt id.");
    if (typeof done !== "boolean") throw new Error("Min plan: ogiltigt värde.");
    const { supabase, userId } = await requireSupabaseUser();
    const { error } = await supabase
      .from(TABLE)
      .update({ done, done_at: done ? new Date().toISOString() : null })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw failure(error, "bocka av uppgiften");
  },

  async removeItem(id: string): Promise<void> {
    if (!UUID_PATTERN.test(id)) throw new Error("Min plan: ogiltigt id.");
    const { supabase, userId } = await requireSupabaseUser();
    const { error } = await supabase.from(TABLE).delete().eq("id", id).eq("user_id", userId);
    if (error) throw failure(error, "ta bort uppgiften");
  },
};
