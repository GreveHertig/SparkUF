/**
 * Min plan (docs/moduler/min-plan.md): gränserna delas av liveadaptern,
 * demoadaptern, server actions och skärmarna, så att samma siffra gäller överallt.
 */

/** Längsta text för en uppgift, i tecken. Samma gräns som i databasen. */
export const PLAN_ITEM_TEXT_MAX = 300;

/** Längsta sammanhang (till exempel signalens rubrik), i tecken. Samma gräns som i databasen. */
export const PLAN_ITEM_CONTEXT_MAX = 200;

/** Högst så många uppgifter som inte är avbockade. En spelbok har fyra till fem steg. */
export const PLAN_MAX_OPEN = 50;

/** Var en uppgift kom ifrån. I dag bara Pulsens spelböcker. */
export const PLAN_ORIGINS = ["pulsen"] as const;
export type PlanOrigin = (typeof PLAN_ORIGINS)[number];
