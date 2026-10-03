import type { PlanOrigin } from "@/core/plan";

/** En uppgift i grundarens plan, som Resan visar den. */
export type PlanItem = {
  id: string;
  text: string;
  /** Varifrån uppgiften kom, till exempel signalens rubrik. Ren text. */
  context: string | null;
  done: boolean;
  createdAtIso: string;
};

/** En ny uppgift. Texten är data, aldrig instruktion. */
export type NewPlanItem = {
  text: string;
  context?: string | null;
  origin: PlanOrigin;
  /** Id för det uppgiften kom ifrån, till exempel signalens id. */
  originRef?: string | null;
};

/**
 * Min plan (docs/moduler/min-plan.md): uppgifter som grundaren lägger till,
 * i dag från en spelbok i Pulsen, och bockar av i Resan. Liveadapter bygger
 * på Supabase (`public.plan_items`). Användaren tas alltid ur sessionen, aldrig
 * ur indata. Ny port, eget beslut (docs/beslut.md 2026-10-03).
 */
export interface PlanRepository {
  /** Alla uppgifter: de öppna först, sedan de avbockade, äldst först inom varje. */
  getItems(): Promise<PlanItem[]>;
  /**
   * Lägger till uppgifterna. Samma text från samma ursprung en gång (stora och
   * små bokstäver spelar ingen roll), så att knappen kan tryckas två gånger.
   * Svarar med hur många som faktiskt lades till. Kastar `PlanLimitError` när
   * de nya skulle ta planen över taket för öppna uppgifter, och lägger då inte
   * till någon.
   */
  addItems(items: NewPlanItem[]): Promise<number>;
  /** Bockar av en uppgift, eller tillbaka. Ett okänt id gör ingenting. */
  setDone(id: string, done: boolean): Promise<void>;
  /** Tar bort en uppgift. Ett okänt id gör ingenting. */
  removeItem(id: string): Promise<void>;
}
